package com.soulmon.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetVpetTest {
    private val screen = WidgetVpet.Box(
        WidgetVpet.SCREEN_L, WidgetVpet.SCREEN_T, WidgetVpet.SCREEN_R, WidgetVpet.SCREEN_B,
    )

    private fun inside(b: WidgetVpet.Box) =
        b.l >= screen.l && b.t >= screen.t && b.r <= screen.r && b.b <= screen.b && b.w > 0 && b.h > 0

    @Test fun openingMatchesTheArtScaled() {
        assertEquals(Math.round(289 * 0.375).toInt(), WidgetVpet.SCREEN_L)
        assertEquals(Math.round(188 * 0.375).toInt(), WidgetVpet.SCREEN_T)
        assertEquals(Math.round(1245 * 0.375).toInt(), WidgetVpet.SCREEN_R)
        assertEquals(Math.round(701 * 0.375).toInt(), WidgetVpet.SCREEN_B)
    }

    @Test fun everyContentBoxStaysInsideTheScreen() {
        assertTrue(inside(WidgetVpet.sprite))
        assertTrue(inside(WidgetVpet.text))
        assertTrue(inside(WidgetVpet.iconRow))
    }

    @Test fun textDoesNotOverlapIconsOrSprite() {
        assertTrue(WidgetVpet.text.b <= WidgetVpet.iconRow.t)
        assertTrue(WidgetVpet.text.l >= WidgetVpet.sprite.r)
    }

    @Test fun twoIconsFitTheRow() {
        assertTrue(2 * WidgetVpet.ICON + WidgetVpet.ICON_GAP <= WidgetVpet.iconRow.w)
        assertTrue(WidgetVpet.ICON <= WidgetVpet.iconRow.h)
    }

    @Test fun hungerOnlyWhenTheInstantPassed() {
        assertFalse(WidgetVpet.isHungry(1000, null))
        assertFalse(WidgetVpet.isHungry(1000, 2000))
        assertTrue(WidgetVpet.isHungry(2000, 2000))
    }

    @Test fun frameNameOnlyForTheTwentyBaseElements() {
        assertEquals(20, WidgetVpet.FRAME_ELEMENTS.size)
        assertEquals("moldura_vpet_fogo", WidgetVpet.frameDrawableName("fogo"))
        assertEquals("moldura_vpet_espaco", WidgetVpet.frameDrawableName("espaco"))
        assertEquals(null, WidgetVpet.frameDrawableName(""))
        assertEquals(null, WidgetVpet.frameDrawableName(null))
        assertEquals(null, WidgetVpet.frameDrawableName("vapor"))
        assertEquals(null, WidgetVpet.frameDrawableName("../fogo"))
    }

    @Test fun missingArtFallsBackToTheDefaultCasing() {
        assertEquals(7, WidgetVpet.pickCasing(0, 7))
        assertEquals(9, WidgetVpet.pickCasing(9, 7))
    }

    @Test fun foodTierFollowsTheTwoInstants() {
        // Meat whole -> half -> bone only, by the instants the app stores.
        assertEquals(WidgetVpet.FoodTier.FED, WidgetVpet.foodTier(100, null, null))
        assertEquals(WidgetVpet.FoodTier.FED, WidgetVpet.foodTier(100, 200, 300))
        assertEquals(WidgetVpet.FoodTier.FAIR, WidgetVpet.foodTier(200, 200, 300))
        assertEquals(WidgetVpet.FoodTier.FAIR, WidgetVpet.foodTier(299, 200, 300))
        assertEquals(WidgetVpet.FoodTier.STARVING, WidgetVpet.foodTier(300, 200, 300))
        // Already below both when the app wrote them (past instants).
        assertEquals(WidgetVpet.FoodTier.STARVING, WidgetVpet.foodTier(1_000, 10, 20))
        // Old app (no starving instant): never worse than FAIR.
        assertEquals(WidgetVpet.FoodTier.FAIR, WidgetVpet.foodTier(1_000, 10, null))
    }

    @Test fun energyBoltIsDarkHalfOrFull() {
        assertEquals(WidgetVpet.EnergyLevel.EMPTY, WidgetVpet.energyLevel(0, 12))
        assertEquals(WidgetVpet.EnergyLevel.EMPTY, WidgetVpet.energyLevel(-1, 12))
        assertEquals(WidgetVpet.EnergyLevel.HALF, WidgetVpet.energyLevel(1, 12))
        assertEquals(WidgetVpet.EnergyLevel.HALF, WidgetVpet.energyLevel(6, 12))
        assertEquals(WidgetVpet.EnergyLevel.HALF, WidgetVpet.energyLevel(8, 12))
        assertEquals(WidgetVpet.EnergyLevel.FULL, WidgetVpet.energyLevel(9, 12))
        assertEquals(WidgetVpet.EnergyLevel.FULL, WidgetVpet.energyLevel(12, 12))
        assertEquals(WidgetVpet.EnergyLevel.FULL, WidgetVpet.energyLevel(15, 12))
        // Unknown cap (old app): any energy is full, none is dark.
        assertEquals(WidgetVpet.EnergyLevel.FULL, WidgetVpet.energyLevel(3, 0))
        assertEquals(WidgetVpet.EnergyLevel.EMPTY, WidgetVpet.energyLevel(0, 0))
    }

    @Test fun threeIconsFitInTheIconRow() {
        val step = WidgetVpet.ICON + WidgetVpet.ICON_GAP
        assertTrue(WidgetVpet.iconRow.l + 2 * step + WidgetVpet.ICON <= WidgetVpet.iconRow.r)
    }

    @Test fun backgroundDrawableNameIsAllowlisted() {
        assertEquals("vpet_bg_bg_room", WidgetVpet.bgDrawableName("bg-room"))
        assertEquals(null, WidgetVpet.bgDrawableName(""))
        assertEquals(null, WidgetVpet.bgDrawableName("../x"))
        assertEquals(null, WidgetVpet.bgDrawableName("room"))
    }

    @Test fun sleepZStaysInsideTheSpriteColumn() {
        assertTrue(WidgetVpet.sleepZ.l >= WidgetVpet.sprite.l && WidgetVpet.sleepZ.r <= WidgetVpet.sprite.r)
        assertTrue(WidgetVpet.sleepZ.b <= WidgetVpet.sprite.b)
    }

    // ---- Companheiro (beta12 A3): bitmap quadrado, criatura grande, mesmo LCD da moldura deslocado para baixo. ----
    private val comp = WidgetVpet.COMPANION
    private val compScreen = WidgetVpet.screenOf(comp)

    private fun insideCanvas(b: WidgetVpet.Box) = b.l >= 0 && b.t >= 0 && b.r <= comp.w && b.b <= comp.h && b.w > 0 && b.h > 0
    private fun insideCompScreen(b: WidgetVpet.Box) =
        b.l >= compScreen.l && b.t >= compScreen.t && b.r <= compScreen.r && b.b <= compScreen.b && b.w > 0 && b.h > 0

    @Test fun cageGeometryIsUntouched() {
        val cage = WidgetVpet.CAGE
        assertEquals(576, cage.w)
        assertEquals(384, cage.h)
        assertEquals(0, cage.casingY)
        assertEquals(WidgetVpet.sprite, cage.sprite)
        assertEquals(WidgetVpet.text, cage.text)
        assertEquals(WidgetVpet.iconRow, cage.iconRow)
        assertFalse(cage.spriteOverCasing)
        assertEquals(screen, WidgetVpet.screenOf(cage))
    }

    @Test fun companionCanvasIsSquareAndTheCasingFitsAtTheBottom() {
        assertEquals(comp.w, comp.h)
        assertEquals(WidgetVpet.COMPANION_SIZE, comp.w)
        assertEquals(comp.h - WidgetVpet.H, comp.casingY)
        assertEquals(WidgetVpet.H, comp.h - comp.casingY)
        assertTrue(comp.spriteOverCasing)
    }

    @Test fun companionCreatureIsMuchBiggerThanTheCages() {
        assertTrue(comp.sprite.w >= 2 * WidgetVpet.sprite.w)
        assertEquals(comp.sprite.w, comp.sprite.h)
        assertTrue(insideCanvas(comp.sprite))
        // Centred on the canvas, standing out above the device.
        assertEquals(comp.w - comp.sprite.r, comp.sprite.l)
        assertEquals(0, comp.sprite.t)
        assertTrue(comp.sprite.t < compScreen.t)
    }

    @Test fun companionTextAndIconsStayInsideTheLcd() {
        assertTrue(insideCompScreen(comp.text))
        assertTrue(insideCompScreen(comp.iconRow))
        assertTrue(insideCanvas(comp.sleepZ))
    }

    @Test fun companionTextIsBelowTheCreatureAndAboveTheIcons() {
        assertTrue(comp.text.t >= comp.sprite.b)
        assertTrue(comp.text.b <= comp.iconRow.t)
        assertTrue(comp.text.h >= 40)
    }

    @Test fun companionIconsAndSleepZFit() {
        assertTrue(WidgetVpet.iconRow.l + 0 >= 0)
        val step = WidgetVpet.ICON + WidgetVpet.ICON_GAP
        assertTrue(2 * step + WidgetVpet.ICON <= comp.iconRow.w)
        assertTrue(comp.sleepZ.l >= comp.sprite.l && comp.sleepZ.r <= comp.sprite.r && comp.sleepZ.t >= comp.sprite.t)
    }
}
