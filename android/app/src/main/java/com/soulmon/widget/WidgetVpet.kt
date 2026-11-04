package com.soulmon.widget

/**
 * Pure decisions and geometry of the "Soulmon V-Pet" widget (no Android imports, covered by
 * JUnit in `src/test/.../WidgetVpetTest.kt`). All coordinates are pixels of the 576x384
 * casing bitmap (`vpet_moldura.png`, the 1536x1024 art scaled by 0.375, nearest).
 */
object WidgetVpet {
    const val W = 576
    const val H = 384

    // Opening of the casing: x 289..1245, y 188..701 of the 1536x1024 art, times 0.375.
    const val SCREEN_L = 108
    const val SCREEN_T = 71
    const val SCREEN_R = 467
    const val SCREEN_B = 263

    /** Safe inset inside the opening, so nothing touches the casing border. */
    const val PAD = 12

    const val ICON = 30
    const val ICON_GAP = 10
    const val ROW_H = 34

    data class Box(val l: Int, val t: Int, val r: Int, val b: Int) {
        val w get() = r - l
        val h get() = b - t
    }

    private val inner = Box(SCREEN_L + PAD, SCREEN_T + PAD, SCREEN_R - PAD, SCREEN_B - PAD)

    /** Sprite column (left), full height of the safe area. */
    val sprite = Box(inner.l, inner.t, inner.l + 120, inner.b)

    /** Status icon row, bottom right of the LCD. */
    val iconRow = Box(sprite.r + 12, inner.b - ROW_H, inner.r, inner.b)

    /** Speech text, right of the sprite and above the icon row. */
    val text = Box(sprite.r + 12, inner.t, inner.r, iconRow.t - 6)

    /** Hunger shown full-colour only when the pet is hungry (same rule as the hungry line). */
    fun isHungry(now: Long, hungryAt: Long?): Boolean = hungryAt != null && now >= hungryAt
}
