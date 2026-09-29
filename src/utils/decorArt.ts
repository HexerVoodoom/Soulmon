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

/**
 * PLACEHOLDER da Concha da Maré (`trophy-concha-mare`, conquista da Guilda): um leque de
 * lajes (concha) em petróleo, veio turquesa e presilha de cobre, na paleta do Visor — sem
 * rosto, sem magenta/roxo/rosa. A leva de arte troca esta linha por
 * `assets/decor/trophy-concha-mare.png` (mesma convenção das demais peças).
 */
const CONCHA_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64" shape-rendering="crispEdges">'
  + '<path d="M8 46 L14 24 L24 14 L40 14 L50 24 L56 46 Z" fill="#1E5A5A" stroke="#061414" stroke-width="2"/>'
  + '<path d="M32 46 L32 16 M32 46 L20 20 M32 46 L44 20 M32 46 L13 30 M32 46 L51 30" stroke="#6EFFFB" stroke-width="2" fill="none"/>'
  + '<rect x="26" y="46" width="12" height="6" fill="#B87333" stroke="#061414" stroke-width="2"/>'
  + '</svg>',
);

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
  'trophy-concha-mare': CONCHA_PLACEHOLDER,
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
