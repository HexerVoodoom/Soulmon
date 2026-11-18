package com.soulmon.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * Widget grande da Home (decisão do dono, 18/11/2026): a FILA do check.
 *
 * O check do widget SÓ MARCA: grava aqui um evento `task_done` e o widget redesenha a linha riscada na hora.
 * Nenhuma regra de jogo roda no nativo (sem comida, XP nem Bits: footgun 9). Quem paga é o app, ao abrir,
 * pela mesma regra do toque na Home (`src/utils/widgetEvents.ts`), e só então apaga o evento (`ack`).
 *
 * A parte pura (sem Android) é coberta por `WidgetEventQueueTest`; [Store] guarda a lista em SharedPreferences.
 */
object WidgetEventQueue {
    const val KIND_TASK_DONE = "task_done"
    /** Adendo ao §478: hábito do dia. `dayKey` (data local) importa: o app ignora check de ontem. */
    const val KIND_HABIT_DONE = "habit_done"

    /** O evento de cada tipo de linha da lista ([WidgetHomeTasks.Item.kind]). */
    fun eventKindFor(itemKind: String): String? = when (itemKind) {
        WidgetHomeTasks.KIND_TASK -> KIND_TASK_DONE
        WidgetHomeTasks.KIND_HABIT -> KIND_HABIT_DONE
        else -> null
    }

    /** Teto da fila. Passou disso, sai o mais antigo (50 tarefas marcadas sem abrir o app uma vez). */
    const val MAX_EVENTS = 50

    /** Mesmo teto do lado web (`sanitizeWidgetEvents`). */
    const val MAX_REF_LENGTH = 200

    data class Event(val eid: String, val kind: String, val ref: String, val dayKey: String, val ts: Long)

    fun isValidRef(ref: String?): Boolean = !ref.isNullOrBlank() && ref.length <= MAX_REF_LENGTH

    /** Acrescenta o evento, a não ser que a mesma tarefa já esteja na fila (tocar duas vezes = um evento). */
    fun enqueue(events: List<Event>, ev: Event): List<Event> {
        if (!isValidRef(ev.ref)) return events
        if (events.any { it.kind == ev.kind && it.ref == ev.ref }) return events
        return (events + ev).takeLast(MAX_EVENTS)
    }

    /** Tira da fila os eventos já aplicados pelo app. `eid` desconhecido é ignorado. */
    fun ack(events: List<Event>, eids: Collection<String>): List<Event> {
        if (eids.isEmpty()) return events
        val set = eids.toSet()
        return events.filterNot { it.eid in set }
    }

    /** Os itens com check pendente, como chaves `tipo:id` ([WidgetHomeTasks.Item.key]): o widget os mostra riscados até o app drenar. */
    fun pendingDoneKeys(events: List<Event>): Set<String> =
        events.mapNotNull {
            when (it.kind) {
                KIND_TASK_DONE -> "${WidgetHomeTasks.KIND_TASK}:${it.ref}"
                KIND_HABIT_DONE -> "${WidgetHomeTasks.KIND_HABIT}:${it.ref}"
                else -> null
            }
        }.toSet()

    /** Leitura/escrita em SharedPreferences (org.json: só no aparelho, fora do JUnit). */
    object Store {
        const val PREFS_NAME = "soulmon_widget_events"
        private const val KEY = "events"
        private val lock = Any()

        fun read(context: Context): List<Event> = synchronized(lock) { parse(prefs(context).getString(KEY, null)) }

        /** Grava o check (`kind` = [KIND_TASK_DONE] ou [KIND_HABIT_DONE]). `true` = entrou agora (a fila mudou). */
        fun addDone(context: Context, kind: String, ref: String, dayKey: String, nowMs: Long): Boolean = synchronized(lock) {
            val before = parse(prefs(context).getString(KEY, null))
            val after = enqueue(before, Event(UUID.randomUUID().toString(), kind, ref, dayKey, nowMs))
            if (after === before) return@synchronized false
            prefs(context).edit().putString(KEY, toJson(after)).commit()
        }

        fun ack(context: Context, eids: Collection<String>) = synchronized(lock) {
            val before = parse(prefs(context).getString(KEY, null))
            val after = ack(before, eids)
            if (after.size != before.size) prefs(context).edit().putString(KEY, toJson(after)).commit()
        }

        fun toJson(events: List<Event>): String {
            val arr = JSONArray()
            for (e in events) {
                arr.put(JSONObject().put("eid", e.eid).put("kind", e.kind).put("ref", e.ref).put("dayKey", e.dayKey).put("ts", e.ts))
            }
            return arr.toString()
        }

        private fun parse(json: String?): List<Event> {
            if (json.isNullOrBlank()) return emptyList()
            return try {
                val arr = JSONArray(json)
                (0 until arr.length()).mapNotNull { i ->
                    val o = arr.optJSONObject(i) ?: return@mapNotNull null
                    val eid = o.optString("eid", "")
                    val ref = o.optString("ref", "")
                    if (eid.isEmpty() || !isValidRef(ref)) null
                    else Event(eid, o.optString("kind", KIND_TASK_DONE), ref, o.optString("dayKey", ""), o.optLong("ts", 0L))
                }
            } catch (e: Exception) {
                emptyList()
            }
        }

        private fun prefs(context: Context) = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
}
