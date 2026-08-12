// Arte pixel real das 14 peças de decoração (geradas via Higgsfield, ver
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
};
