package com.soulmon.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Tamanhos do widget grande da Home (parte pura). */
class WidgetHomeLayoutTest {
    @Test fun petOnlyWhenTallEnough() {
        assertTrue(WidgetHomeLayout.showPet(0, 0)) // launcher nao informou = 4x5 padrao
        assertTrue(WidgetHomeLayout.showPet(250, 320))
        assertTrue(WidgetHomeLayout.showPet(110, WidgetHomeLayout.PET_MIN_HEIGHT_DP))
        assertFalse(WidgetHomeLayout.showPet(250, 180))
    }

    @Test fun sizeMapAgreesWithChoice() {
        // A API 31+ usa o maior layout que cabe; o pre-31 usa showPet. As duas respostas batem.
        for ((w, h) in listOf(110 to 180, 110 to 250, 250 to 320, 530 to 670, 250 to 200)) {
            val key = WidgetHomeLayout.SIZE_KEYS.filter { it.widthDp <= w && it.heightDp <= h }.maxByOrNull { it.widthDp * it.heightDp }
            assertEquals(WidgetHomeLayout.showPet(w, h), key?.withPet ?: false)
        }
    }

    @Test fun textGrowsWithWidth() {
        val narrow = WidgetHomeLayout.textSpec(110).taskSp
        val mid = WidgetHomeLayout.textSpec(250).taskSp
        val wide = WidgetHomeLayout.textSpec(400).taskSp
        assertTrue(narrow < mid && mid < wide)
        assertEquals(mid, WidgetHomeLayout.textSpec(0).taskSp, 0f)
    }
}
