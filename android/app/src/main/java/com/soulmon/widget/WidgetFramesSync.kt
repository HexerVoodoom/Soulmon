package com.soulmon.widget

import android.content.Context
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Baixa o manifesto de molduras e as imagens que faltam (beta12, A1). Bloqueante: chame de thread propria ou do
 * [WidgetFramesSyncWorker]. Nada e promovido sem passar por: host/esquema ([WidgetFrameStore.Policy]), teto de bytes,
 * `sha256` e dimensao exata 576x384; escrita atomica (`.tmp` + rename). Qualquer falha deixa o cache como estava e o
 * widget segue com o que tem (ou com as embutidas). A requisicao e um GET sem cookie nem identidade.
 */
object WidgetFramesSync {
    private const val TAG = "SoulmonWidget"
    private const val MIN_INTERVAL_MS = 60L * 60 * 1000

    enum class Outcome { CHANGED, UNCHANGED, SKIPPED, FAILED }

    /**
     * @param force ignora o intervalo minimo de 1 h (o Worker diario e a escolha de uma moldura nova passam true).
     */
    @Synchronized
    fun sync(context: Context, force: Boolean): Outcome {
        val app = context.applicationContext
        val now = System.currentTimeMillis()
        if (!force && now - WidgetFrameStore.Disk.lastCheck(app) < MIN_INTERVAL_MS) return Outcome.SKIPPED
        return try {
            val outcome = syncInternal(app, now)
            WidgetFrameStore.Disk.saveLastCheck(app, now)
            if (outcome == Outcome.CHANGED) WidgetRenderer.updateAll(app)
            outcome
        } catch (e: IOException) {
            android.util.Log.w(TAG, "frames: rede/arquivo falhou (${e.javaClass.simpleName}); widget usa o cache ou as embutidas")
            Outcome.FAILED
        } catch (e: Exception) {
            android.util.Log.w(TAG, "frames: sync falhou (${e.javaClass.simpleName})")
            Outcome.FAILED
        } catch (e: OutOfMemoryError) {
            Outcome.FAILED
        }
    }

    /** Sync em thread propria (chamado pelo plugin quando o jogador escolhe uma moldura que ainda nao esta em disco). */
    fun syncAsync(context: Context, force: Boolean) {
        val app = context.applicationContext
        Thread { sync(app, force) }.start()
    }

    private fun syncInternal(app: Context, now: Long): Outcome {
        val stored = WidgetFrameStore.Disk.readManifest(app)
        val fetched = fetchManifest(if (stored != null) WidgetFrameStore.Disk.etag(app) else null)
        var changed = false

        val manifest: WidgetFrameStore.Manifest
        if (fetched == null) {
            // 304: o manifesto em cache continua valendo; so completa imagens que faltem.
            manifest = stored ?: return Outcome.UNCHANGED
        } else {
            val parsed = WidgetFrameStore.parseManifest(fetched.body) ?: throw IOException("manifesto invalido")
            if (stored != null && !WidgetFrameStore.isNewerOrSame(parsed.version, stored.version)) {
                android.util.Log.w(TAG, "frames: manifesto v${parsed.version} < v${stored.version}, ignorado")
                return Outcome.UNCHANGED
            }
            manifest = parsed
            if (!parsed.enabled || parsed.schema != WidgetFrameStore.Policy.SCHEMA || !parsed.geometryOk) {
                // Kill-switch / schema novo / geometria divergente: o remoto e ignorado e o cache apagado.
                val had = WidgetFrameStore.Disk.dir(app).listFiles()?.isNotEmpty() == true
                WidgetFrameStore.Disk.clear(app)
                return if (had) Outcome.CHANGED else Outcome.UNCHANGED
            }
            changed = true
        }

        val dir = WidgetFrameStore.Disk.dir(app)
        val usable = WidgetFrameStore.usableFrames(manifest, WidgetFrameStore.Disk.versionCode(app), now)
        for (f in usable) {
            val target = File(dir, WidgetFrameStore.cacheName(f))
            if (target.isFile && target.length() == f.bytes.toLong()) continue
            if (downloadFrame(f, target)) changed = true
        }
        if (fetched != null) {
            // So agora o manifesto novo e promovido (nunca fica meio estado).
            val tmp = File(dir, WidgetFrameStore.Disk.MANIFEST_FILE + ".tmp")
            tmp.writeText(fetched.body)
            val dst = File(dir, WidgetFrameStore.Disk.MANIFEST_FILE)
            if (!tmp.renameTo(dst)) { dst.delete(); tmp.renameTo(dst) }
            WidgetFrameStore.Disk.saveEtag(app, fetched.etag)
        }
        WidgetFrameStore.Disk.evict(app, usable.map { WidgetFrameStore.cacheName(it) }.toSet())
        return if (changed) Outcome.CHANGED else Outcome.UNCHANGED
    }

    private class Fetched(val body: String, val etag: String?)

    /** null = 304 (nao mudou). */
    private fun fetchManifest(etag: String?): Fetched? {
        val conn = open(WidgetFrameStore.Policy.MANIFEST_URL)
        try {
            conn.useCaches = false
            if (!etag.isNullOrBlank()) conn.setRequestProperty("If-None-Match", etag)
            val code = conn.responseCode
            if (code == 304) return null
            if (code != 200) throw IOException("manifesto http $code")
            val bytes = readLimited(conn, WidgetFrameStore.Policy.MAX_MANIFEST_BYTES)
            return Fetched(String(bytes, Charsets.UTF_8), conn.getHeaderField("ETag"))
        } finally {
            conn.disconnect()
        }
    }

    private fun downloadFrame(f: WidgetFrameStore.Frame, target: File): Boolean {
        val url = WidgetFrameStore.Policy.resolve(f.url) ?: return false
        val tmp = File(target.parentFile, target.name + ".tmp")
        val conn = open(url)
        try {
            if (conn.responseCode != 200) { android.util.Log.w(TAG, "frames: ${f.id} http ${conn.responseCode}"); return false }
            val bytes = readLimited(conn, WidgetFrameStore.Policy.MAX_FRAME_BYTES)
            if (bytes.size != f.bytes) { android.util.Log.w(TAG, "frames: ${f.id} tamanho diferente do manifesto"); return false }
            if (WidgetFrameStore.sha256Hex(bytes) != f.sha256) { android.util.Log.w(TAG, "frames: ${f.id} sha256 errado, descartado"); return false }
            val b = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, b)
            if (b.outWidth != WidgetVpet.W || b.outHeight != WidgetVpet.H) { android.util.Log.w(TAG, "frames: ${f.id} dimensao ${b.outWidth}x${b.outHeight}, descartado"); return false }
            tmp.writeBytes(bytes)
            if (!tmp.renameTo(target)) { target.delete(); if (!tmp.renameTo(target)) { tmp.delete(); return false } }
            return true
        } catch (e: IOException) {
            tmp.delete()
            return false
        } finally {
            conn.disconnect()
        }
    }

    private fun open(url: String): HttpURLConnection {
        if (!WidgetFrameStore.Policy.isAllowedUrl(url)) throw IOException("url fora da politica")
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 10_000
        conn.readTimeout = 10_000
        conn.instanceFollowRedirects = false // um redirect poderia sair do host permitido
        return conn
    }

    private fun readLimited(conn: HttpURLConnection, max: Int): ByteArray {
        if (conn.contentLength > max) throw IOException("grande demais")
        val out = ByteArrayOutputStream()
        val buf = ByteArray(16 * 1024)
        conn.inputStream.use { ins ->
            while (true) {
                val n = ins.read(buf)
                if (n < 0) break
                out.write(buf, 0, n)
                if (out.size() > max) throw IOException("grande demais")
            }
        }
        return out.toByteArray()
    }
}
