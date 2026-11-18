package com.soulmon.widget

import com.soulmon.widget.WidgetEventQueue.Event
import com.soulmon.widget.WidgetHomeTasks.Item
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

/** Fila do check do widget da Home e a lista de tarefas (parte pura). org.json fica de fora (só no aparelho). */
class WidgetEventQueueTest {
    private fun ev(eid: String, ref: String, ts: Long = 1L) = Event(eid, WidgetEventQueue.KIND_TASK_DONE, ref, "2026-11-18", ts)

    @Test fun enqueueAddsOnce() {
        val a = WidgetEventQueue.enqueue(emptyList(), ev("e1", "t1"))
        assertEquals(1, a.size)
        val b = WidgetEventQueue.enqueue(a, ev("e2", "t1"))
        assertSame(a, b) // tocar duas vezes = um evento
        assertEquals(2, WidgetEventQueue.enqueue(b, ev("e3", "t2")).size)
    }

    @Test fun enqueueRefusesBadRef() {
        assertTrue(WidgetEventQueue.enqueue(emptyList(), ev("e1", "")).isEmpty())
        assertTrue(WidgetEventQueue.enqueue(emptyList(), ev("e1", "x".repeat(201))).isEmpty())
    }

    @Test fun capDropsOldest() {
        var q = emptyList<Event>()
        for (i in 0 until WidgetEventQueue.MAX_EVENTS + 5) q = WidgetEventQueue.enqueue(q, ev("e$i", "t$i"))
        assertEquals(WidgetEventQueue.MAX_EVENTS, q.size)
        assertEquals("t5", q.first().ref)
    }

    @Test fun ackRemovesOnlyThoseEids() {
        val q = listOf(ev("e1", "t1"), ev("e2", "t2"))
        assertEquals(listOf("e2"), WidgetEventQueue.ack(q, listOf("e1", "zz")).map { it.eid })
        assertSame(q, WidgetEventQueue.ack(q, emptyList()))
        // ack repetido = no-op
        val once = WidgetEventQueue.ack(q, listOf("e1"))
        assertEquals(once, WidgetEventQueue.ack(once, listOf("e1")))
    }

    @Test fun pendingRefsOnlyTaskDone() {
        val q = listOf(ev("e1", "t1"), Event("e2", "outro", "t2", "", 0))
        assertEquals(setOf("t1"), WidgetEventQueue.pendingDoneRefs(q))
    }

    @Test fun tasksSanitize() {
        val raw = listOf(
            Item(" a ", "  Ler   livro  ", false),
            Item("a", "Repetida", false),
            Item("", "Sem id", false),
            Item("b", "   ", false),
            Item("c", "x".repeat(80), true),
        )
        val out = WidgetHomeTasks.sanitize(raw)
        assertEquals(listOf("a", "c"), out.map { it.id })
        assertEquals("Ler livro", out[0].name)
        assertEquals(WidgetHomeTasks.MAX_NAME, out[1].name.length)
        assertEquals(WidgetHomeTasks.MAX_ITEMS, WidgetHomeTasks.sanitize((1..30).map { Item("$it", "t$it", false) }).size)
    }

    @Test fun pendingShowsAsDone() {
        val items = listOf(Item("a", "A", false), Item("b", "B", false))
        val out = WidgetHomeTasks.withPending(items, setOf("b"))
        assertFalse(out[0].done)
        assertTrue(out[1].done)
    }

    @Test fun listOnlyFreshSameDay() {
        assertTrue(WidgetHomeTasks.isFresh(10L, 20L))
        assertFalse(WidgetHomeTasks.isFresh(20L, 20L))
        assertFalse(WidgetHomeTasks.isFresh(10L, null))
    }
}
