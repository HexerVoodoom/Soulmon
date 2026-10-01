// Arte pixel real das 33 peças de decoração (geradas via Higgsfield, ver
// docs/BRIEF-ARTE-DECORACAO.md). Cada PNG foi desenhado EXATAMENTE para a
// caixa do slot que ocupa (DECOR_SLOTS em utils/petStage.ts) — nada aqui
// redimensiona de forma não-uniforme, só encaixa.
import furnSofa from '../assets/decor/furn-sofa.png';
import furnChair from '../assets/decor/furn-chair.png';
import furnBooks from '../assets/decor/furn-books.png';
import furnLamp from '../assets/decor/furn-lamp.png';
import furnRug from '../assets/decor/furn-rug.png';
import furnPlant from '../assets/decor/furn-plant.png';
import furnPicture from '../assets/decor/furn-picture.png';
import furnCampfire from '../assets/decor/furn-campfire.png';
import furnTent from '../assets/decor/furn-tent.png';
import furnRock from '../assets/decor/furn-rock.png';
import furnitureChampionBanner from '../assets/decor/furniture-champion-banner.png';
import furnitureMedalWall from '../assets/decor/furniture-medal-wall.png';
import furnitureTrophyShelf from '../assets/decor/furniture-trophy-shelf.png';
import furniturePodium from '../assets/decor/furniture-podium.png';
// Segunda leva (kit v1.2) — 19 peças, ver docs/BRIEF-ARTE-DECORACAO.md.
import furnGrass from '../assets/decor/furn-grass.png';
import furnSand from '../assets/decor/furn-sand.png';
import furnStoneTiles from '../assets/decor/furn-stone-tiles.png';
import furnDeck from '../assets/decor/furn-deck.png';
import furnCircuitMat from '../assets/decor/furn-circuit-mat.png';
import furnArcadeCab from '../assets/decor/furn-arcade-cab.png';
import furnCauldron from '../assets/decor/furn-cauldron.png';
import furnCrystal from '../assets/decor/furn-crystal.png';
import furnWell from '../assets/decor/furn-well.png';
import furnLantern from '../assets/decor/furn-lantern.png';
import furnMushrooms from '../assets/decor/furn-mushrooms.png';
import furnHourglass from '../assets/decor/furn-hourglass.png';
import furnFoodBowl from '../assets/decor/furn-food-bowl.png';
import furnShelfSimple from '../assets/decor/furn-shelf-simple.png';
import furnCrate from '../assets/decor/furn-crate.png';
import furnWindow from '../assets/decor/furn-window.png';
import furnGarland from '../assets/decor/furn-garland.png';
import furnWindChime from '../assets/decor/furn-wind-chime.png';
import furnClock from '../assets/decor/furn-clock.png';

// Concha da Maré (`trophy-concha-mare`, conquista da Guilda) — arte real da rodada 3
// (30/09/2026, 92×100), no lugar do placeholder em SVG que vivia aqui.
import trophyConchaMare from '../assets/decor/trophy-concha-mare.png';

/** Chave = id do item em utils/shop.ts (kind: 'furniture'). */
export const DECOR_ART: Record<string, string> = {
  'furn-sofa': furnSofa,
  'furn-chair': furnChair,
  'furn-books': furnBooks,
  'furn-lamp': furnLamp,
  'furn-rug': furnRug,
  'furn-plant': furnPlant,
  'furn-picture': furnPicture,
  'furn-campfire': furnCampfire,
  'furn-tent': furnTent,
  'furn-rock': furnRock,
  'furniture-champion-banner': furnitureChampionBanner,
  'furniture-medal-wall': furnitureMedalWall,
  'furniture-trophy-shelf': furnitureTrophyShelf,
  'furniture-podium': furniturePodium,
  'trophy-concha-mare': trophyConchaMare,
  'furn-grass': furnGrass,
  'furn-sand': furnSand,
  'furn-stone-tiles': furnStoneTiles,
  'furn-deck': furnDeck,
  'furn-circuit-mat': furnCircuitMat,
  'furn-arcade-cab': furnArcadeCab,
  'furn-cauldron': furnCauldron,
  'furn-crystal': furnCrystal,
  'furn-well': furnWell,
  'furn-lantern': furnLantern,
  'furn-mushrooms': furnMushrooms,
  'furn-hourglass': furnHourglass,
  'furn-food-bowl': furnFoodBowl,
  'furn-shelf-simple': furnShelfSimple,
  'furn-crate': furnCrate,
  'furn-window': furnWindow,
  'furn-garland': furnGarland,
  'furn-wind-chime': furnWindChime,
  'furn-clock': furnClock,
};
