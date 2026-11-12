package com.soulmon.widget

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.time.LocalDate
import java.time.ZoneOffset

/**
 * Molduras do V-Pet (Cage e Companheiro) servidas pela web (beta12, A1; plano em docs/design/PLANO-WIDGET-MOLDURAS-REMOTAS.md).
 *
 * Manifesto JSON estatico em `https://<APP_HOST>/widget-frames/manifest.json` + PNGs com hash no nome. O Android baixa em
 * segundo plano ([WidgetFramesSync]) para `noBackupFilesDir/widget_frames/`; o renderer SO LE do disco, sem rede. Ordem de
 * resolucao: cache valido -> drawable embutido (as 20 do APK) -> casco padrao. Nada aqui lanca para o renderer.
 *
 * A parte PURA (sem Android; coberta por JUnit em `WidgetFrameStoreTest`) e [Policy] e as funcoes de decisao. A de disco e
 * [Disk]. A allowlist de ids deixou de ser uma lista fechada: o id so precisa ter a FORMA de um id ([Policy.isValidId]); a
 * posse/preco continua no app e no servidor (`widgetFrames.ts`, `_billing.js`) e NAO muda.
 */
object WidgetFrameStore {

    object Policy {
        /** O Worker do app: a mesma origem de `capacitor.config` > `server.url` (igualdade EXATA, nunca sufixo). */
        const val APP_HOST = WidgetOwnSprite.Policy.APP_HOST
        const val BASE = "https://$APP_HOST/widget-frames/"
        const val MANIFEST_URL = BASE + "manifest.json"

        const val SCHEMA = 1
        const val MAX_MANIFEST_BYTES = 64 * 1024
        const val MAX_FRAME_BYTES = 256 * 1024
        const val MAX_CACHE_BYTES = 6L * 1024 * 1024

        private val ID = Regex("^[a-z][a-z0-9_]{1,31}$")
        private val REL = Regex("^[a-z0-9][a-z0-9_.-]{0,95}\\.png$")
        private val SHA256 = Regex("^[0-9a-f]{64}$")

        fun isValidId(id: String?): Boolean = id != null && ID.matches(id)
        fun isValidSha256(s: String?): Boolean = s != null && SHA256.matches(s)

        /** Nome de arquivo relativo ao manifesto: sem `/`, sem `..`, sem esquema; so `.png`. */
        fun isValidRelative(rel: String?): Boolean = rel != null && REL.matches(rel) && !rel.contains("..")

        /** https, host exato, sem userinfo, caminho dentro de `/widget-frames/`, sem query nem `..`. */
        fun isAllowedUrl(url: String): Boolean {
            if (!url.startsWith("https://")) return false
            return try {
                val u = java.net.URL(url)
                u.userInfo == null && u.host.lowercase() == APP_HOST && u.query == null &&
                    u.path.startsWith("/widget-frames/") && !u.path.contains("..") && (u.port == -1 || u.port == 443)
            } catch (e: Exception) {
                false
            }
        }

        /** URL absoluta da imagem a partir do `url` relativo do manifesto, ou null se nao passar na politica. */
        fun resolve(rel: String?): String? {
            if (!isValidRelative(rel)) return null
            val full = BASE + rel
            return if (isAllowedUrl(full)) full else null
        }
    }

    /** Uma moldura do manifesto. `untilMs` 0 = sem prazo; `minVersionCode` 0 = qualquer versao. */
    data class Frame(
        val id: String,
        val url: String,
        val sha256: String,
        val bytes: Int,
        val minVersionCode: Int = 0,
        val untilMs: Long = 0L,
    )

    data class Manifest(
        val schema: Int,
        val version: Long,
        val enabled: Boolean,
        /** `geometry` do manifesto == as constantes compiladas (`WidgetVpet.W/H/SCREEN_*`). */
        val geometryOk: Boolean,
        val frames: List<Frame>,
    )

    /** De onde vem a arte de um id. */
    enum class Source { REMOTE, BUNDLED, DEFAULT }

    // ---------------------------------------------------------------- parte pura

    /** `until` ("YYYY-MM-DD", UTC, inclusive) -> instante em que a janela FECHA (inicio do dia seguinte). Invalido -> null. */
    fun untilEndMs(until: String?): Long? {
        if (until == null) return null
        return try {
            LocalDate.parse(until).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        } catch (e: Exception) {
            null
        }
    }

    /**
     * As molduras que podem ser usadas agora. Kill-switch (`enabled:false`), schema que este cliente nao entende e geometria
     * divergente das constantes compiladas (a arte teria outra abertura de LCD) => NENHUMA (volta as embutidas). Cada moldura
     * ainda passa por id valido, hash valido, tamanho dentro do teto, janela de versao do app e prazo (`until`).
     */
    fun usableFrames(m: Manifest, versionCode: Long, nowMs: Long): List<Frame> {
        if (!m.enabled || m.schema != Policy.SCHEMA || !m.geometryOk) return emptyList()
        val seen = HashSet<String>()
        return m.frames.filter { f ->
            Policy.isValidId(f.id) && Policy.isValidSha256(f.sha256) &&
                Policy.resolve(f.url) != null &&
                f.bytes in 1..Policy.MAX_FRAME_BYTES &&
                f.minVersionCode <= versionCode &&
                (f.untilMs == 0L || nowMs < f.untilMs) &&
                seen.add(f.id)
        }
    }

    /** `version` e monotonica: um manifesto mais velho que o guardado (cache velho de CDN) nunca e aceito. */
    fun isNewerOrSame(candidate: Long, stored: Long): Boolean = candidate >= stored

    /** Nome do arquivo no disco: o hash esta no nome, entao arte diferente = arquivo diferente. */
    fun cacheName(f: Frame): String = "${f.id}.${f.sha256.take(8)}.png"

    /** Ordem de resolucao (a do plano 2.5): cache valido > embutida do APK > casco padrao. */
    fun resolveSource(cacheHit: Boolean, bundledRes: Int): Source = when {
        cacheHit -> Source.REMOTE
        bundledRes != 0 -> Source.BUNDLED
        else -> Source.DEFAULT
    }

    /** Arquivos a apagar: os que nao estao em `keep`, e depois os mais velhos ate caber em `maxBytes`. `files` = nome, tamanho, mtime. */
    data class CacheFile(val name: String, val size: Long, val modified: Long)

    fun evictions(files: List<CacheFile>, keep: Set<String>, maxBytes: Long): List<String> {
        val out = ArrayList<String>()
        val kept = ArrayList<CacheFile>()
        for (f in files) if (f.name in keep) kept.add(f) else out.add(f.name)
        var total = kept.sumOf { it.size }
        for (f in kept.sortedBy { it.modified }) {
            if (total <= maxBytes) break
            out.add(f.name)
            total -= f.size
        }
        return out
    }

    fun sha256Hex(bytes: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }

    /** Interpreta o JSON do manifesto; qualquer defeito estrutural => null (o cliente ignora e fica no que tem). */
    fun parseManifest(json: String): Manifest? = try {
        val root = JSONObject(json)
        val g = root.optJSONObject("geometry")
        val s = g?.optJSONObject("screen")
        val geometryOk = g != null && s != null &&
            g.optInt("w") == WidgetVpet.W && g.optInt("h") == WidgetVpet.H &&
            s.optInt("l") == WidgetVpet.SCREEN_L && s.optInt("t") == WidgetVpet.SCREEN_T &&
            s.optInt("r") == WidgetVpet.SCREEN_R && s.optInt("b") == WidgetVpet.SCREEN_B
        val arr = root.optJSONArray("frames")
        val frames = ArrayList<Frame>()
        if (arr != null) for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            frames.add(
                Frame(
                    id = o.optString("id"),
                    url = o.optString("url"),
                    sha256 = o.optString("sha256").lowercase(),
                    bytes = o.optInt("bytes", 0),
                    minVersionCode = o.optInt("minVersionCode", 0),
                    untilMs = untilEndMs(if (o.has("until")) o.optString("until") else null) ?: 0L,
                ),
            )
        }
        Manifest(root.optInt("schema", -1), root.optLong("version", -1L), root.optBoolean("enabled", true), geometryOk, frames)
    } catch (e: Exception) {
        null
    }

    // ---------------------------------------------------------------- disco

    object Disk {
        const val MANIFEST_FILE = "manifest.json"
        private const val PREFS_KEY_ETAG = "frames_etag"
        private const val PREFS_KEY_LAST = "frames_last_check"

        fun dir(context: Context): File = File(context.noBackupFilesDir, "widget_frames").also { it.mkdirs() }

        fun versionCode(context: Context): Long = try {
            androidx.core.content.pm.PackageInfoCompat.getLongVersionCode(context.packageManager.getPackageInfo(context.packageName, 0))
        } catch (e: Exception) {
            0L
        }

        /** O ultimo manifesto aceito (ou null). */
        fun readManifest(context: Context): Manifest? {
            val f = File(dir(context), MANIFEST_FILE)
            if (!f.exists() || f.length() > Policy.MAX_MANIFEST_BYTES) return null
            return try { parseManifest(f.readText()) } catch (e: Exception) { null }
        }

        /** O arquivo da moldura `id` SE ela esta no manifesto em cache, usavel agora, e o arquivo existe com o tamanho certo. */
        fun cachedFrame(context: Context, id: String?): File? {
            if (!Policy.isValidId(id)) return null
            return try {
                val m = readManifest(context) ?: return null
                val f = usableFrames(m, versionCode(context), System.currentTimeMillis()).firstOrNull { it.id == id } ?: return null
                val file = File(dir(context), cacheName(f))
                if (file.isFile && file.length() == f.bytes.toLong()) file else null
            } catch (e: Exception) {
                null
            }
        }

        fun etag(context: Context): String? =
            context.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE).getString(PREFS_KEY_ETAG, null)

        fun saveEtag(context: Context, etag: String?) {
            val e = context.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE).edit()
            if (etag.isNullOrBlank()) e.remove(PREFS_KEY_ETAG) else e.putString(PREFS_KEY_ETAG, etag)
            e.apply()
        }

        fun lastCheck(context: Context): Long =
            context.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE).getLong(PREFS_KEY_LAST, 0L)

        fun saveLastCheck(context: Context, ms: Long) {
            context.getSharedPreferences(WidgetRenderer.PREFS_NAME, Context.MODE_PRIVATE).edit().putLong(PREFS_KEY_LAST, ms).apply()
        }

        /** Apaga tudo que o manifesto atual nao cita e, se ainda passar do teto, os mais antigos. */
        fun evict(context: Context, keep: Set<String>) {
            val d = dir(context)
            val files = (d.listFiles() ?: return).filter { it.isFile && it.name != MANIFEST_FILE && !it.name.endsWith(".tmp") }
                .map { CacheFile(it.name, it.length(), it.lastModified()) }
            for (n in evictions(files, keep, Policy.MAX_CACHE_BYTES)) File(d, n).delete()
            d.listFiles()?.filter { it.name.endsWith(".tmp") }?.forEach { it.delete() }
        }

        /** Kill-switch / geometria divergente: apaga o cache inteiro (as embutidas seguem). */
        fun clear(context: Context) {
            dir(context).listFiles()?.forEach { it.delete() }
            saveEtag(context, null)
        }
    }
}
