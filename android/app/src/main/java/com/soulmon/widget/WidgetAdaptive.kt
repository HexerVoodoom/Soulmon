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
     * Widget "Soulmon" (clear): below this size only the creature fits (1x1 cell and up to ~2x1),
     * so the compact layout (sprite only, no text) is used. `0x0` = launcher reported nothing =
     * default placement (3x2) = full layout. Sizes in dp, portrait reading: minWidth x maxHeight.
     */
    fun isCompact(widthDp: Int, heightDp: Int): Boolean {
        if (widthDp <= 0 && heightDp <= 0) return false
        return widthDp < COMPACT_MIN_WIDTH_DP || heightDp < COMPACT_MIN_HEIGHT_DP
    }

    const val COMPACT_MIN_WIDTH_DP = 140
    const val COMPACT_MIN_HEIGHT_DP = 70

    /**
     * Widget "Soulmon" sem moldura (clear), beta12 A2: alem do compacto (so a criatura) e do horizontal (fala a direita), ganha o
     * VERTICAL: 1 celula de largura x 2+ de altura, com a fala ABAIXO do Soulmon. Chaves = tamanho minimo de cada layout (dp);
     * a API 31+ recebe essa lista como mapa de RemoteViews e usa o maior que cabe, [chooseClearShape] da a mesma resposta abaixo.
     */
    enum class ClearShape { COMPACT, VERTICAL, FULL }
    data class ClearKey(val widthDp: Float, val heightDp: Float, val shape: ClearShape)

    /** Celulas de launcher: n celulas ~ 70n - 30 dp (1 = 40, 2 = 110). */
    val CLEAR_KEYS = listOf(
        ClearKey(40f, 40f, ClearShape.COMPACT),
        ClearKey(40f, 110f, ClearShape.VERTICAL),
        ClearKey(COMPACT_MIN_WIDTH_DP.toFloat(), COMPACT_MIN_HEIGHT_DP.toFloat(), ClearShape.FULL),
    )

    /** Teto de altura do widget sem moldura: 4 celulas (70 * 4 - 30). Igual a `android:maxResizeHeight` do XML. */
    const val CLEAR_MAX_HEIGHT_DP = 250

    /**
     * Mesma regra do mapa de tamanhos da API 31+: o maior layout que cabe (por area); nenhum cabe = compacto. `0x0` = o launcher
     * nao informou = posicionamento padrao (3x2) = layout completo horizontal, como sempre foi.
     */
    fun chooseClearShape(widthDp: Int, heightDp: Int): ClearShape {
        if (widthDp <= 0 && heightDp <= 0) return ClearShape.FULL
        return CLEAR_KEYS
            .filter { it.widthDp <= widthDp && it.heightDp <= heightDp }
            .maxByOrNull { it.widthDp * it.heightDp }
            ?.shape ?: ClearShape.COMPACT
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
