package com.soulmon.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * O sprite PRÓPRIO do jogador (o gerado no Oráculo / o equipado) no widget.
 *
 * Antes o widget só sabia os 5 iniciais + corvo; quem tinha criatura gerada via, fora do app, o
 * inicial de reserva por hash (o "Crato"). Agora o app manda a URL do sprite que ele mesmo mostra e o
 * Kotlin guarda uma cópia 256² em `filesDir`. Sem arquivo (ou falha) = cai no inicial, como sempre.
 *
 * Parte pura (sem Android) em [Policy], coberta por JUnit.
 */
object WidgetOwnSprite {
    private const val FILE_NAME = "widget_own_sprite.png"
    private const val KEY_PREF = "own_sprite_key"
    private const val MAX_BYTES = 6 * 1024 * 1024
    private const val MAX_SIDE = 256

    object Policy {
        /** Espelho de `HOSTS_DE_SPRITE` (src/utils/spriteLibrary.ts): igualdade EXATA, nunca sufixo. */
        val HOSTS = setOf("d8j0ntlcm91z4.cloudfront.net", "images.higgs.ai", "platform.higgsfield.ai")

        /** O Worker do app: SO o caminho `/api/sprite-image?k=<32hex>` (o sprite gerado do jogador). */
        const val APP_HOST = "soulmon.mateus-sprnd.workers.dev"
        private val APP_SPRITE_QUERY = Regex("^k=[0-9a-fA-F]{32}$")
        private val DATA_PREFIX = Regex("^data:image/(png|jpe?g|webp|gif);base64,", RegexOption.IGNORE_CASE)

        fun isData(url: String) = DATA_PREFIX.containsMatchIn(url)

        fun isAllowedHttps(url: String): Boolean {
            if (!url.startsWith("https://", ignoreCase = true)) return false
            return try {
                val u = URL(url)
                u.userInfo == null && (
                    u.host.lowercase() in HOSTS ||
                        (u.host.lowercase() == APP_HOST && u.path == "/api/sprite-image" && u.query != null && APP_SPRITE_QUERY.matches(u.query))
                    )
            } catch (e: Exception) {
                false
            }
        }

        fun isAllowed(url: String) = isData(url) || isAllowedHttps(url)

        /** Chave estável da URL (muda a URL → baixa de novo). */
        fun keyOf(url: String): String = url.length.toString() + ":" + url.hashCode()
    }

    private fun file(context: Context) = File(context.filesDir, FILE_NAME)

    /** O bitmap do sprite próprio com o lado maior em [maxPx], ou null (sem sprite próprio / falhou). */
    fun load(context: Context, maxPx: Int): Bitmap? {
        val f = file(context)
        if (!f.exists()) return null
        return try {
            val raw = BitmapFactory.decodeFile(f.path) ?: return null
            val big = maxOf(raw.width, raw.height)
            if (big <= maxPx) raw
            else {
                val k = maxPx.toFloat() / big
                Bitmap.createScaledBitmap(raw, (raw.width * k).toInt().coerceAtLeast(1), (raw.height * k).toInt().coerceAtLeast(1), true)
                    .also { if (it !== raw) raw.recycle() }
            }
        } catch (e: Exception) {
            null
        } catch (e: OutOfMemoryError) {
            null
        }
    }

    /** Sem URL válida → apaga o sprite próprio (volta ao inicial). */
    fun clear(context: Context) {
        file(context).delete()
        context.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE).edit().remove(KEY_PREF).apply()
    }

    /** Baixa/decodifica em thread própria e redesenha os widgets quando termina. Idempotente por chave. */
    fun sync(context: Context, url: String?) {
        val app = context.applicationContext
        if (url.isNullOrBlank() || !Policy.isAllowed(url)) {
            clear(app)
            return
        }
        val prefs = app.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE)
        val key = Policy.keyOf(url)
        if (prefs.getString(KEY_PREF, null) == key && file(app).exists()) return
        // Sprite novo (evoluiu/degenerou/trocou de forma): o antigo NAO pode ficar no lugar enquanto baixa, nem se a rede falhar.
        file(app).delete()
        prefs.edit().remove(KEY_PREF).apply()
        android.util.Log.d("SoulmonWidget", "own sprite: baixando novo ($key)")
        Thread {
            try {
                val bytes = if (Policy.isData(url)) {
                    Base64.decode(url.substringAfter("base64,"), Base64.DEFAULT)
                } else download(url)
                val raw = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return@Thread
                val big = maxOf(raw.width, raw.height)
                val bmp = if (big > MAX_SIDE) {
                    val k = MAX_SIDE.toFloat() / big
                    Bitmap.createScaledBitmap(raw, (raw.width * k).toInt().coerceAtLeast(1), (raw.height * k).toInt().coerceAtLeast(1), true)
                } else raw
                val tmp = File(app.filesDir, "$FILE_NAME.tmp")
                tmp.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
                tmp.renameTo(file(app))
                prefs.edit().putString(KEY_PREF, key).apply()
                android.util.Log.d("SoulmonWidget", "own sprite: ok ${bmp.width}x${bmp.height}")
                WidgetRenderer.updateAll(app)
            } catch (e: Exception) {
                android.util.Log.w("SoulmonWidget", "own sprite: falhou (${e.javaClass.simpleName}); widget usa o inicial até a próxima sync")
            } catch (e: OutOfMemoryError) {
            }
        }.start()
    }

    private fun download(url: String): ByteArray {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 8000
        conn.readTimeout = 8000
        conn.instanceFollowRedirects = false // um redirect poderia sair da allowlist
        try {
            if (conn.responseCode != 200) throw java.io.IOException("http ${conn.responseCode}")
            if (conn.contentLength > MAX_BYTES) throw java.io.IOException("grande demais")
            val out = java.io.ByteArrayOutputStream()
            val buf = ByteArray(16 * 1024)
            conn.inputStream.use { ins ->
                while (true) {
                    val n = ins.read(buf)
                    if (n < 0) break
                    out.write(buf, 0, n)
                    if (out.size() > MAX_BYTES) throw java.io.IOException("grande demais")
                }
            }
            return out.toByteArray()
        } finally {
            conn.disconnect()
        }
    }
}
