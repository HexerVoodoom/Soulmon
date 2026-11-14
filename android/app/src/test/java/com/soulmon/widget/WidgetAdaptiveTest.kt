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

    @Test fun clearWidgetIsCompactBelowThreshold() {
        assertEquals(true, WidgetAdaptive.isCompact(40, 40))
        assertEquals(true, WidgetAdaptive.isCompact(110, 110))
        assertEquals(true, WidgetAdaptive.isCompact(180, 60))
        assertEquals(false, WidgetAdaptive.isCompact(180, 90))
        assertEquals(false, WidgetAdaptive.isCompact(140, 70))
        assertEquals(false, WidgetAdaptive.isCompact(0, 0))
    }

    @Test fun ownSpritePolicyIsAllowlistOnly() {
        val p = WidgetOwnSprite.Policy
        assertEquals(true, p.isAllowed("https://images.higgs.ai/x.png"))
        assertEquals(true, p.isAllowed("data:image/png;base64,AAAA"))
        assertEquals(false, p.isAllowed("http://images.higgs.ai/x.png"))
        assertEquals(false, p.isAllowed("https://evil.example/x.png"))
        assertEquals(false, p.isAllowed("https://images.higgs.ai@evil.example/x.png"))
        assertEquals(false, p.isAllowed("https://x.images.higgs.ai/x.png"))
        assertEquals(false, p.isAllowed("file:///etc/passwd"))
        val k = "a".repeat(32)
        assertEquals(true, p.isAllowed("https://soulmon.mateus-sprnd.workers.dev/api/sprite-image?k=$k"))
        assertEquals(false, p.isAllowed("https://soulmon.mateus-sprnd.workers.dev/api/other?k=$k"))
        assertEquals(false, p.isAllowed("https://soulmon.mateus-sprnd.workers.dev/api/sprite-image?k=curto"))
        assertEquals(false, p.isAllowed(""))
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

    // ---- Widget sem moldura (clear), beta12 A2: 1 celula de largura x 2+ de altura = vertical, fala abaixo. ----
    @Test fun clearShapeFollowsTheCellsOfTheLauncher() {
        val c = WidgetAdaptive.ClearShape.COMPACT
        val v = WidgetAdaptive.ClearShape.VERTICAL
        val f = WidgetAdaptive.ClearShape.FULL
        // Horizontal igual a antes: o padrao 3x2 (180x110) e o 0x0 do launcher que nao informa nada.
        assertEquals(f, WidgetAdaptive.chooseClearShape(0, 0))
        assertEquals(f, WidgetAdaptive.chooseClearShape(180, 110))
        assertEquals(f, WidgetAdaptive.chooseClearShape(250, 130))
        assertEquals(f, WidgetAdaptive.chooseClearShape(140, 70))
        // So a criatura: 1x1 e as faixas baixas (ate 2x1, 3x1).
        assertEquals(c, WidgetAdaptive.chooseClearShape(40, 40))
        assertEquals(c, WidgetAdaptive.chooseClearShape(110, 40))
        assertEquals(c, WidgetAdaptive.chooseClearShape(180, 40))
        assertEquals(c, WidgetAdaptive.chooseClearShape(30, 30))
        // Vertical: 1 celula de largura e 2, 3 ou 4 de altura; e o quadrado 2x2.
        assertEquals(v, WidgetAdaptive.chooseClearShape(40, 110))
        assertEquals(v, WidgetAdaptive.chooseClearShape(60, 180))
        assertEquals(v, WidgetAdaptive.chooseClearShape(50, WidgetAdaptive.CLEAR_MAX_HEIGHT_DP))
        assertEquals(v, WidgetAdaptive.chooseClearShape(110, 110))
        assertEquals(c, WidgetAdaptive.chooseClearShape(40, 109))
    }

    @Test fun clearHeightCeilingIsFourCells() {
        assertEquals(70 * 4 - 30, WidgetAdaptive.CLEAR_MAX_HEIGHT_DP)
    }

    @Test fun everyClearShapeHasAKey() {
        assertEquals(
            WidgetAdaptive.ClearShape.values().toSet(),
            WidgetAdaptive.CLEAR_KEYS.map { it.shape }.toSet(),
        )
    }
}
