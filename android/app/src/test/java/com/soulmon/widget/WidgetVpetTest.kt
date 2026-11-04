package com.soulmon.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetVpetTest {
    private val screen = WidgetVpet.Box(
        WidgetVpet.SCREEN_L, WidgetVpet.SCREEN_T, WidgetVpet.SCREEN_R, WidgetVpet.SCREEN_B,
    )

    private fun inside(b: WidgetVpet.Box) =
        b.l >= screen.l && b.t >= screen.t && b.r <= screen.r && b.b <= screen.b && b.w > 0 && b.h > 0

    @Test fun openingMatchesTheArtScaled() {
        assertEquals(Math.round(289 * 0.375).toInt(), WidgetVpet.SCREEN_L)
        assertEquals(Math.round(188 * 0.375).toInt(), WidgetVpet.SCREEN_T)
        assertEquals(Math.round(1245 * 0.375).toInt(), WidgetVpet.SCREEN_R)
        assertEquals(Math.round(701 * 0.375).toInt(), WidgetVpet.SCREEN_B)
    }

    @Test fun everyContentBoxStaysInsideTheScreen() {
        assertTrue(inside(WidgetVpet.sprite))
        assertTrue(inside(WidgetVpet.text))
        assertTrue(inside(WidgetVpet.iconRow))
    }

    @Test fun textDoesNotOverlapIconsOrSprite() {
        assertTrue(WidgetVpet.text.b <= WidgetVpet.iconRow.t)
        assertTrue(WidgetVpet.text.l >= WidgetVpet.sprite.r)
    }

    @Test fun twoIconsFitTheRow() {
        assertTrue(2 * WidgetVpet.ICON + WidgetVpet.ICON_GAP <= WidgetVpet.iconRow.w)
        assertTrue(WidgetVpet.ICON <= WidgetVpet.iconRow.h)
    }

    @Test fun hungerOnlyWhenTheInstantPassed() {
        assertFalse(WidgetVpet.isHungry(1000, null))
        assertFalse(WidgetVpet.isHungry(1000, 2000))
        assertTrue(WidgetVpet.isHungry(2000, 2000))
    }

    @Test fun frameNameOnlyForTheTwentyBaseElements() {
        assertEquals(20, WidgetVpet.FRAME_ELEMENTS.size)
        assertEquals("moldura_vpet_fogo", WidgetVpet.frameDrawableName("fogo"))
        assertEquals("moldura_vpet_espaco", WidgetVpet.frameDrawableName("espaco"))
        assertEquals(null, WidgetVpet.frameDrawableName(""))
        assertEquals(null, WidgetVpet.frameDrawableName(null))
        assertEquals(null, WidgetVpet.frameDrawableName("vapor"))
        assertEquals(null, WidgetVpet.frameDrawableName("../fogo"))
    }

    @Test fun missingArtFallsBackToTheDefaultCasing() {
        assertEquals(7, WidgetVpet.pickCasing(0, 7))
        assertEquals(9, WidgetVpet.pickCasing(9, 7))
    }
}
