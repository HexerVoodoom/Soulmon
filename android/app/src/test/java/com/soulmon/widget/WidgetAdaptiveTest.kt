package com.soulmon.widget

import com.soulmon.widget.WidgetAdaptive.Message
import com.soulmon.widget.WidgetAdaptive.Shape
import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetAdaptiveTest {
    private val now = 1_000L
    private val later = 2_000L

    private fun msg(
        hungryAt: Long? = null,
        poop: Boolean = false,
        task: String? = null,
        dayEndsAt: Long? = later,
        completed: Int = 0,
        total: Int = 0,
    ) = WidgetAdaptive.selectMessage(now, hungryAt, poop, task, dayEndsAt, completed, total)

    @Test fun priorityIsCareThenTaskThenKindWord() {
        assertEquals(Message.HUNGRY, msg(hungryAt = now, poop = true, task = "Read"))
        assertEquals(Message.POOP, msg(hungryAt = later, poop = true, task = "Read"))
        assertEquals(Message.TASK, msg(hungryAt = later, task = "Read", completed = 1, total = 3))
        assertEquals(Message.DAY_CLOSED, msg(completed = 3, total = 3))
        assertEquals(Message.SUPPORT, msg())
    }

    @Test fun absentOldDataIsNeverTaskOrCelebration() {
        assertEquals(Message.SUPPORT, msg(dayEndsAt = null, completed = 3, total = 3))
        assertEquals(Message.SUPPORT, msg(dayEndsAt = null, task = "Read"))
    }

    @Test fun yesterdaysListIsNotShown() {
        assertEquals(Message.SUPPORT, msg(dayEndsAt = now, task = "Read"))
        assertEquals(Message.SUPPORT, msg(dayEndsAt = now, completed = 3, total = 3))
    }

    @Test fun blankTaskIsNoTask() {
        assertEquals(Message.SUPPORT, msg(task = "   ", completed = 1, total = 3))
    }

    @Test fun shapeFollowsSize() {
        assertEquals(Shape.SQUARE, WidgetAdaptive.chooseShape(40, 40))
        assertEquals(Shape.SQUARE, WidgetAdaptive.chooseShape(130, 130))
        assertEquals(Shape.SQUARE, WidgetAdaptive.chooseShape(30, 30))
        assertEquals(Shape.HORIZONTAL, WidgetAdaptive.chooseShape(180, 90))
        assertEquals(Shape.HORIZONTAL, WidgetAdaptive.chooseShape(250, 130))
        assertEquals(Shape.HORIZONTAL, WidgetAdaptive.chooseShape(320, 200))
        assertEquals(Shape.VERTICAL, WidgetAdaptive.chooseShape(110, 200))
        assertEquals(Shape.VERTICAL, WidgetAdaptive.chooseShape(200, 200))
        assertEquals(Shape.HORIZONTAL, WidgetAdaptive.chooseShape(0, 0))
    }
}
