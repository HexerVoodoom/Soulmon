package com.soulmon.widget

/**
 * Decisões puras de tamanho do widget grande da Home (sem Android; JUnit em `WidgetHomeLayoutTest`). Tamanhos em dp.
 * Célula de launcher ~ 70n - 30 dp. Quem manda no tamanho real é a grade do launcher; aqui só se escolhe o que cabe.
 */
object WidgetHomeLayout {
    /** Abaixo disso de altura o V-Pet sai e a lista fica com o espaço (a lista é o que se usa no widget). */
    const val PET_MIN_HEIGHT_DP = 220

    /** Tamanho mínimo de cada layout. A API 31+ recebe esta lista como mapa de RemoteViews e usa o maior que cabe. */
    data class SizeKey(val widthDp: Float, val heightDp: Float, val withPet: Boolean)

    val SIZE_KEYS = listOf(
        SizeKey(40f, 40f, false),
        SizeKey(40f, PET_MIN_HEIGHT_DP.toFloat(), true),
    )

    /** Mesma resposta do mapa da API 31+. `0x0` = o launcher não informou = posicionamento padrão (4x5) = com o V-Pet. */
    fun showPet(widthDp: Int, heightDp: Int): Boolean {
        if (widthDp <= 0 && heightDp <= 0) return true
        return heightDp >= PET_MIN_HEIGHT_DP
    }

    /** Texto das linhas e do título, por largura: estreito (2 células) menor, largo (5+) maior. */
    data class TextSpec(val taskSp: Float, val titleSp: Float)

    fun textSpec(widthDp: Int): TextSpec = when {
        widthDp <= 0 -> TextSpec(15f, 14f)
        widthDp < 200 -> TextSpec(13f, 12f)
        widthDp < 320 -> TextSpec(15f, 14f)
        else -> TextSpec(18f, 16f)
    }
}
