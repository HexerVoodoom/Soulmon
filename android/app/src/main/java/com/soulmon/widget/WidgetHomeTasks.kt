package com.soulmon.widget

import org.json.JSONArray
import org.json.JSONObject

/**
 * Widget grande da Home: a lista de tarefas de hoje que o app manda (`tasks_json`, `widgetTaskList` no TS).
 * Parte pura coberta por `WidgetHomeTasksTest`; o parse com org.json fica em [Json] (só no aparelho).
 */
object WidgetHomeTasks {
    /** Mesmo teto de `WIDGET_TASK_LIST_MAX` (TS). */
    const val MAX_ITEMS = 12
    const val MAX_NAME = 40
    const val MAX_ID = 200

    data class Item(val id: String, val name: String, val done: Boolean)

    /** Corta, limpa e tira repetidos: o SharedPreferences é lido pelo renderer sem mais filtro. */
    fun sanitize(items: List<Item>): List<Item> =
        items.asSequence()
            .map { it.copy(id = it.id.trim(), name = it.name.replace(Regex("\\s+"), " ").trim().take(MAX_NAME)) }
            .filter { it.id.isNotEmpty() && it.id.length <= MAX_ID && it.name.isNotEmpty() }
            .distinctBy { it.id }
            .take(MAX_ITEMS)
            .toList()

    /** O check pendente na fila aparece como feito (otimista) até o app drenar e mandar a lista nova. */
    fun withPending(items: List<Item>, pendingRefs: Set<String>): List<Item> =
        items.map { if (!it.done && it.id in pendingRefs) it.copy(done = true) else it }

    /** A lista só vale no dia em que foi escrita (`day_ends_at`): depois da meia-noite com o app fechado ela é de ontem. */
    fun isFresh(nowMs: Long, dayEndsAtMs: Long?): Boolean = dayEndsAtMs != null && nowMs < dayEndsAtMs

    object Json {
        fun parse(json: String?): List<Item> {
            if (json.isNullOrBlank()) return emptyList()
            return try {
                val arr = JSONArray(json)
                (0 until arr.length()).mapNotNull { i ->
                    val o = arr.optJSONObject(i) ?: return@mapNotNull null
                    Item(o.optString("id", ""), o.optString("name", ""), o.optBoolean("done", false))
                }
            } catch (e: Exception) {
                emptyList()
            }
        }

        fun toJson(items: List<Item>): String {
            val arr = JSONArray()
            for (it in items) arr.put(JSONObject().put("id", it.id).put("name", it.name).put("done", it.done))
            return arr.toString()
        }
    }
}
