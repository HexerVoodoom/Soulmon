package com.soulmon.widget

/**
 * Pure decisions of the resizable widget (no Android imports, covered by JUnit in
 * `src/test/.../WidgetAdaptiveTest.kt`). Sizes are dp. REGISTRO §221.
 */
object WidgetAdaptive {
    enum class Shape { SQUARE, HORIZONTAL, VERTICAL }
    enum class Message { HUNGRY, POOP, TASK, DAY_CLOSED, SUPPORT }

    /** Minimum size of each layout. API 31+ gets this list as the RemoteViews size map. */
    data class SizeKey(val widthDp: Float, val heightDp: Float, val shape: Shape)

    val SIZE_KEYS = listOf(
        SizeKey(40f, 40f, Shape.SQUARE),
        SizeKey(160f, 40f, Shape.HORIZONTAL),
        SizeKey(90f, 170f, Shape.VERTICAL),
        SizeKey(280f, 100f, Shape.HORIZONTAL),
    )

    /**
     * Same answer the API 31+ size map is meant to give: the largest key that fits, and
     * the square when none does. `0x0` means the launcher reported nothing: the provider's
     * default placement (3x1), which is the horizontal one.
     */
    fun chooseShape(widthDp: Int, heightDp: Int): Shape {
        if (widthDp <= 0 && heightDp <= 0) return Shape.HORIZONTAL
        return SIZE_KEYS
            .filter { it.widthDp <= widthDp && it.heightDp <= heightDp }
            .maxByOrNull { it.widthDp * it.heightDp }
            ?.shape ?: Shape.SQUARE
    }

    /**
     * The owner's priority: care (hunger, then residue), then a missing task, then a kind
     * word. Task data is only trusted inside the day it was written for (`dayEndsAt`):
     * after midnight with the app closed the list is yesterday's, so neither a task nor a
     * "closed" line may appear. Absent values (data from before this widget) fall to SUPPORT.
     */
    fun selectMessage(
        now: Long,
        hungryAt: Long?,
        hasPoop: Boolean,
        nextTask: String?,
        dayEndsAt: Long?,
        completed: Int,
        total: Int,
    ): Message {
        if (hungryAt != null && now >= hungryAt) return Message.HUNGRY
        if (hasPoop) return Message.POOP
        val sameDay = dayEndsAt != null && now < dayEndsAt
        if (sameDay && !nextTask.isNullOrBlank()) return Message.TASK
        if (sameDay && total > 0 && completed >= total) return Message.DAY_CLOSED
        return Message.SUPPORT
    }
}
