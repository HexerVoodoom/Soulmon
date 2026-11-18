package com.soulmon.widget

import org.json.JSONArray
import org.json.JSONObject

/**
 * Widget grande da Home: o "Hoje" que o app manda (`tasks_json`, `widgetTaskList` no TS): tarefas avulsas (`task`) e
 * hábitos/tarefas de dias específicos (`habit`), na ordem da Home. `lock` = hábito com etapas (sem check no widget).
 * Parte pura coberta por `WidgetHomeTasksTest`; o parse com org.json fica em [Json] (só no aparelho).
 */
object WidgetHomeTasks {
    /** Mesmo teto de `WIDGET_TASK_LIST_MAX` (TS). */
    const val MAX_ITEMS = 24
    const val MAX_NAME = 40
    const val MAX_ID = 200

    const val KIND_TASK = "task"
    const val KIND_HABIT = "habit"

    data class Item(val id: String, val name: String, val done: Boolean, val kind: String = KIND_TASK, val lock: Boolean = false) {
        /** Tarefa e hábito podem ter o mesmo id: a chave é tipo + id. */
        val key get() = "$kind:$id"
        /** O check grava algo na fila: aberto e sem etapas. */
        val checkable get() = !done && !lock
    }

    /** Corta, limpa e tira repetidos: o SharedPreferences é lido pelo renderer sem mais filtro. */
    fun sanitize(items: List<Item>): List<Item> =
        items.asSequence()
            .map { it.copy(id = it.id.trim(), name = it.name.replace(Regex("\\s+"), " ").trim().take(MAX_NAME)) }
            .filter { it.id.isNotEmpty() && it.id.length <= MAX_ID && it.name.isNotEmpty() && (it.kind == KIND_TASK || it.kind == KIND_HABIT) }
            .distinctBy { it.key }
            .take(MAX_ITEMS)
            .toList()

    /** O check pendente na fila (chaves `tipo:id`, [WidgetEventQueue.pendingDoneKeys]) aparece como feito até o app drenar. */
    fun withPending(items: List<Item>, pendingKeys: Set<String>): List<Item> =
        items.map { if (!it.done && it.key in pendingKeys) it.copy(done = true) else it }

    /** A lista só vale no dia em que foi escrita (`day_ends_at`): depois da meia-noite com o app fechado ela é de ontem. */
    fun isFresh(nowMs: Long, dayEndsAtMs: Long?): Boolean = dayEndsAtMs != null && nowMs < dayEndsAtMs

    object Json {
        fun parse(json: String?): List<Item> {
            if (json.isNullOrBlank()) return emptyList()
            return try {
                val arr = JSONArray(json)
                (0 until arr.length()).mapNotNull { i ->
                    val o = arr.optJSONObject(i) ?: return@mapNotNull null
                    Item(o.optString("id", ""), o.optString("name", ""), o.optBoolean("done", false), o.optString("kind", KIND_TASK), o.optBoolean("lock", false))
                }
            } catch (e: Exception) {
                emptyList()
            }
        }

        fun toJson(items: List<Item>): String {
            val arr = JSONArray()
            for (it in items) {
                val o = JSONObject().put("id", it.id).put("name", it.name).put("done", it.done).put("kind", it.kind)
                if (it.lock) o.put("lock", true)
                arr.put(o)
            }
            return arr.toString()
        }
    }
}
