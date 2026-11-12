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

    /**
     * Casing variants (owner, 04/11/2026): one per BASE element, drawable `moldura_vpet_<element>` (576x384, the SAME
     * LCD opening as `vpet_moldura`). The allowlist is the 20 base ids; anything else (or a missing file) falls back to
     * the default casing, so a bad pref or art that is not in the APK yet can never break the widget.
     */
    val FRAME_ELEMENTS: Set<String> = setOf(
        "fogo", "agua", "terra", "ar", "eletricidade", "arcano", "sombra", "luz", "vileza", "morte",
        "vida", "vigor", "marcial", "tempo", "som", "gravidade", "espaco", "fada", "industrial", "planta",
    )

    /** Drawable name of the chosen casing, or null = default casing (empty/unknown id). */
    fun frameDrawableName(id: String?): String? =
        if (id != null && id in FRAME_ELEMENTS) "moldura_vpet_$id" else null

    private val BG_ID = Regex("^bg-[a-z0-9-]{1,48}$")

    /** Drawable name of the equipped scene's thumbnail (`vpet_bg_<id with _>`), or null = no background (bad/empty id). */
    fun bgDrawableName(id: String?): String? =
        if (id != null && BG_ID.matches(id)) "vpet_bg_" + id.replace('-', '_') else null

    /** Sleep Z box: top-right corner of the sprite column, free space above the creature (never over the speech text). */
    val sleepZ = Box(sprite.r - 30, sprite.t, sprite.r, sprite.t + 34)

    /**
     * Where everything goes inside ONE bitmap (`w` x `h`). The casing (576x384, same LCD opening in every variant) is
     * drawn at y = `casingY`; every other box is in BITMAP coordinates. `spriteOverCasing`: the creature is drawn AFTER
     * the casing (it may stand out of the device); otherwise it sits under it, inside the LCD (the Cage).
     */
    data class Layout(
        val w: Int, val h: Int, val casingY: Int,
        val sprite: Box, val text: Box, val iconRow: Box, val sleepZ: Box,
        val spriteOverCasing: Boolean,
    )

    /** "Cage" (V-Pet com moldura): exactly the original geometry, casing at the top-left of a 576x384 bitmap. */
    val CAGE = Layout(W, H, 0, sprite, text, iconRow, sleepZ, false)

    /** Companion canvas: square, so a 2x2 / 3x3 placement uses the whole cell block (fitCenter scales it). */
    const val COMPANION_SIZE = 576

    /** Side of the creature in the Companion (the Cage's is 120): it stands on top of the casing. */
    const val COMPANION_SPRITE = 320

    /**
     * "Companheiro": the Cage's content (scene, speech, icons, casing) with a BIG creature. The casing sits at the
     * bottom of a square bitmap, the creature above and in front of it; the speech text sits in the LCD under the creature,
     * the icon row at the bottom of the LCD. Same LCD opening as every casing, shifted down by `casingY`.
     */
    val COMPANION: Layout = run {
        val casingY = COMPANION_SIZE - H
        val lcd = Box(SCREEN_L + PAD, SCREEN_T + casingY + PAD, SCREEN_R - PAD, SCREEN_B + casingY - PAD)
        val spriteBox = Box((COMPANION_SIZE - COMPANION_SPRITE) / 2, 0, (COMPANION_SIZE + COMPANION_SPRITE) / 2, COMPANION_SPRITE)
        val row = Box(lcd.l, lcd.b - ROW_H, lcd.r, lcd.b)
        val textBox = Box(lcd.l, spriteBox.b + 6, lcd.r, row.t - 6)
        val z = Box(spriteBox.r - 34, spriteBox.t, spriteBox.r, spriteBox.t + 34)
        Layout(COMPANION_SIZE, COMPANION_SIZE, casingY, spriteBox, textBox, row, z, true)
    }

    /** The LCD opening of a layout, in bitmap coordinates. */
    fun screenOf(l: Layout) = Box(SCREEN_L, SCREEN_T + l.casingY, SCREEN_R, SCREEN_B + l.casingY)

    /** A casing id has the SHAPE of an id (data, not a closed list): the renderer decides what art exists. */
    private val FRAME_ID = Regex("^[a-z][a-z0-9_]{1,31}$")
    fun isFrameIdShape(id: String?): Boolean = id != null && FRAME_ID.matches(id)

    /** The resource id to draw: the variant when it exists in the APK (`variantRes` != 0), else the default. */
    fun pickCasing(variantRes: Int, defaultRes: Int): Int = if (variantRes != 0) variantRes else defaultRes

    /** Hunger shown full-colour only when the pet is hungry (same rule as the hungry line). */
    fun isHungry(now: Long, hungryAt: Long?): Boolean = hungryAt != null && now >= hungryAt

    /** The three food states of the game (`utils/hunger.ts` > `HungerTier`): whole meat, half meat, bone only. */
    enum class FoodTier { FED, FAIR, STARVING }

    /**
     * Food tier now, from the two INSTANTS the app stores (hunger falls by timestamp, so a refresh with the app closed still
     * gets it right): `hungryAt` = below "well fed" (HUNGER_FED_MIN), `starvingAt` = below "fair" (HUNGER_FAIR_MIN). Absent = not there.
     */
    fun foodTier(now: Long, hungryAt: Long?, starvingAt: Long?): FoodTier = when {
        starvingAt != null && now >= starvingAt -> FoodTier.STARVING
        hungryAt != null && now >= hungryAt -> FoodTier.FAIR
        else -> FoodTier.FED
    }

    /** Energy bolt: dark = none, half-filled = some, full = (nearly) full. */
    enum class EnergyLevel { EMPTY, HALF, FULL }

    /** `points` of `max` (`getMaxEnergyForStage`). Unknown/zero max: any energy reads as full, none as empty. */
    fun energyLevel(points: Int, max: Int): EnergyLevel = when {
        points <= 0 -> EnergyLevel.EMPTY
        max <= 0 -> EnergyLevel.FULL
        points * 4 >= max * 3 -> EnergyLevel.FULL
        else -> EnergyLevel.HALF
    }
}
