package com.soulmon.widget

import com.soulmon.widget.WidgetFrameStore.CacheFile
import com.soulmon.widget.WidgetFrameStore.Frame
import com.soulmon.widget.WidgetFrameStore.Manifest
import com.soulmon.widget.WidgetFrameStore.Policy
import com.soulmon.widget.WidgetFrameStore.Source
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Parte pura das molduras remotas (beta12, A1). O parse do JSON usa org.json (so no aparelho) e fica de fora. */
class WidgetFrameStoreTest {
    private val sha = "a".repeat(64)
    private fun frame(id: String = "festa_2026", url: String = "festa_2026.aaaaaaaa.png", bytes: Int = 80_000, minV: Int = 0, until: Long = 0L) =
        Frame(id, url, sha, bytes, minV, until)

    private fun manifest(frames: List<Frame>, enabled: Boolean = true, geometryOk: Boolean = true, schema: Int = 1, version: Long = 7) =
        Manifest(schema, version, enabled, geometryOk, frames)

    @Test fun idHasTheShapeOfAnIdNotAClosedList() {
        assertTrue(Policy.isValidId("fogo"))
        assertTrue(Policy.isValidId("festa_2026"))
        assertFalse(Policy.isValidId(""))
        assertFalse(Policy.isValidId(null))
        assertFalse(Policy.isValidId("../x"))
        assertFalse(Policy.isValidId("a/b"))
        assertFalse(Policy.isValidId("Fogo"))
        assertFalse(Policy.isValidId("a"))
        assertFalse(Policy.isValidId("a" + "b".repeat(32)))
        assertTrue(WidgetVpet.isFrameIdShape("festa_2026"))
        assertFalse(WidgetVpet.isFrameIdShape("../fogo"))
    }

    @Test fun urlsOnlyOnTheAppHostInsideWidgetFrames() {
        assertTrue(Policy.isAllowedUrl("https://soulmon.mateus-sprnd.workers.dev/widget-frames/manifest.json"))
        assertTrue(Policy.isAllowedUrl(Policy.BASE + "fogo.3fa91c02.png"))
        assertFalse(Policy.isAllowedUrl("http://soulmon.mateus-sprnd.workers.dev/widget-frames/x.png"))
        assertFalse(Policy.isAllowedUrl("https://evil.example/widget-frames/x.png"))
        assertFalse(Policy.isAllowedUrl("https://soulmon.mateus-sprnd.workers.dev.evil.example/widget-frames/x.png"))
        assertFalse(Policy.isAllowedUrl("https://soulmon.mateus-sprnd.workers.dev@evil.example/widget-frames/x.png"))
        assertFalse(Policy.isAllowedUrl("https://user@soulmon.mateus-sprnd.workers.dev/widget-frames/x.png"))
        assertFalse(Policy.isAllowedUrl("https://soulmon.mateus-sprnd.workers.dev/api/save"))
        assertFalse(Policy.isAllowedUrl("https://soulmon.mateus-sprnd.workers.dev/widget-frames/../api/save"))
        assertFalse(Policy.isAllowedUrl("https://soulmon.mateus-sprnd.workers.dev/widget-frames/x.png?a=1"))
    }

    @Test fun manifestUrlsAreRelativeFileNamesOnly() {
        assertEquals(Policy.BASE + "festa_2026.aaaaaaaa.png", Policy.resolve("festa_2026.aaaaaaaa.png"))
        assertNull(Policy.resolve("../x.png"))
        assertNull(Policy.resolve("a/b.png"))
        assertNull(Policy.resolve("https://evil.example/x.png"))
        assertNull(Policy.resolve("x.webp"))
        assertNull(Policy.resolve(""))
        assertNull(Policy.resolve(null))
        assertNull(Policy.resolve("..png"))
    }

    @Test fun killSwitchSchemaAndGeometryDisableEveryRemoteFrame() {
        val f = listOf(frame())
        assertEquals(1, WidgetFrameStore.usableFrames(manifest(f), 32, 0).size)
        assertTrue(WidgetFrameStore.usableFrames(manifest(f, enabled = false), 32, 0).isEmpty())
        assertTrue(WidgetFrameStore.usableFrames(manifest(f, geometryOk = false), 32, 0).isEmpty())
        assertTrue(WidgetFrameStore.usableFrames(manifest(f, schema = 2), 32, 0).isEmpty())
    }

    @Test fun eachFrameIsFilteredByShapeSizeVersionAndWindow() {
        val ok = frame()
        val badId = frame(id = "../x")
        val badUrl = frame(id = "outra", url = "../evil.png")
        val tooBig = frame(id = "grande", url = "grande.aaaaaaaa.png", bytes = Policy.MAX_FRAME_BYTES + 1)
        val noBytes = frame(id = "vazia", url = "vazia.aaaaaaaa.png", bytes = 0)
        val newer = frame(id = "nova", url = "nova.aaaaaaaa.png", minV = 33)
        val expired = frame(id = "velha", url = "velha.aaaaaaaa.png", until = 1_000L)
        val open = frame(id = "aberta", url = "aberta.aaaaaaaa.png", until = 10_000L)
        val dup = frame(id = "festa_2026", url = "festa_2026.bbbbbbbb.png")
        val badSha = Frame("sha_ruim", "sha_ruim.aaaaaaaa.png", "xyz", 10, 0, 0)
        val got = WidgetFrameStore.usableFrames(
            manifest(listOf(ok, badId, badUrl, tooBig, noBytes, newer, expired, open, dup, badSha)), versionCode = 32, nowMs = 5_000L,
        ).map { it.id }
        assertEquals(listOf("festa_2026", "aberta"), got)
        // The same manifest on a newer app accepts the frame that needs version 33.
        assertTrue(WidgetFrameStore.usableFrames(manifest(listOf(newer)), 33, 5_000L).isNotEmpty())
    }

    @Test fun untilIsInclusiveInUtc() {
        val end = WidgetFrameStore.untilEndMs("2027-01-31")!!
        assertEquals(1_801_440_000_000L, end) // 2027-02-01T00:00:00Z
        assertNull(WidgetFrameStore.untilEndMs("amanha"))
        assertNull(WidgetFrameStore.untilEndMs(null))
        assertTrue(1L < end)
    }

    @Test fun versionNeverGoesBack() {
        assertTrue(WidgetFrameStore.isNewerOrSame(8, 7))
        assertTrue(WidgetFrameStore.isNewerOrSame(7, 7))
        assertFalse(WidgetFrameStore.isNewerOrSame(6, 7))
    }

    @Test fun resolutionOrderIsCacheThenBundledThenDefault() {
        assertEquals(Source.REMOTE, WidgetFrameStore.resolveSource(true, 99))
        assertEquals(Source.REMOTE, WidgetFrameStore.resolveSource(true, 0))
        assertEquals(Source.BUNDLED, WidgetFrameStore.resolveSource(false, 99))
        assertEquals(Source.DEFAULT, WidgetFrameStore.resolveSource(false, 0))
    }

    @Test fun hashIsInTheFileName() {
        assertEquals("festa_2026.aaaaaaaa.png", WidgetFrameStore.cacheName(frame()))
        val other = frame().copy(sha256 = "b".repeat(64))
        assertEquals("festa_2026.bbbbbbbb.png", WidgetFrameStore.cacheName(other))
    }

    @Test fun sha256OfKnownInput() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", WidgetFrameStore.sha256Hex("abc".toByteArray()))
    }

    @Test fun evictionDropsStrangersThenTheOldestUntilItFits() {
        val files = listOf(CacheFile("a", 3, 10), CacheFile("b", 3, 20), CacheFile("c", 3, 30), CacheFile("fora", 5, 1))
        assertEquals(listOf("fora"), WidgetFrameStore.evictions(files, setOf("a", "b", "c"), 100))
        assertEquals(listOf("fora", "a"), WidgetFrameStore.evictions(files, setOf("a", "b", "c"), 6))
        assertEquals(listOf("fora", "a", "b"), WidgetFrameStore.evictions(files, setOf("a", "b", "c"), 3))
    }

    @Test fun widgetFramesAreDataButTheBundledTwentyStayAsTheSafetyNet() {
        assertEquals(20, WidgetVpet.FRAME_ELEMENTS.size)
        assertEquals("moldura_vpet_fogo", WidgetVpet.frameDrawableName("fogo"))
        assertNull(WidgetVpet.frameDrawableName("festa_2026"))
    }
}
