// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy); see docs/SHOP-PLAN.md.
export type ShopItemKind = 'chip' | 'emblem' | 'bg' | 'evo';
export type Attr = 'virus' | 'data' | 'vaccine';

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  icon: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  price: number;
  attr?: Attr;
  /** Item digivolution: the form it produces and at which evolution level it triggers. */
  evoTarget?: string;
  evoLevel?: 'champion' | 'ultimate';
}

export const CHIP_BOOST = 3; // attribute points granted per chip

export const SHOP_ITEMS: ShopItem[] = [
  // Consumable attribute chips — nudge the evolution branch
  { id: 'chip-virus',   kind: 'chip', icon: '🦠', attr: 'virus',
    namePt: 'Chip de Vírus',  nameEn: 'Virus Chip',
    descPt: `+${CHIP_BOOST} pontos de vírus na hora`, descEn: `+${CHIP_BOOST} virus points instantly`, price: 40 },
  { id: 'chip-data',    kind: 'chip', icon: '💾', attr: 'data',
    namePt: 'Chip de Dado',   nameEn: 'Data Chip',
    descPt: `+${CHIP_BOOST} pontos de dado na hora`, descEn: `+${CHIP_BOOST} data points instantly`, price: 40 },
  { id: 'chip-vaccine', kind: 'chip', icon: '💉', attr: 'vaccine',
    namePt: 'Chip de Vacina', nameEn: 'Vaccine Chip',
    descPt: `+${CHIP_BOOST} pontos de vacina na hora`, descEn: `+${CHIP_BOOST} vaccine points instantly`, price: 40 },
  // Emblems — force the branch of the NEXT digivolution (consumed on evolve)
  { id: 'emblem-virus',   kind: 'emblem', icon: '🟣', attr: 'virus',
    namePt: 'Emblema do Vírus',  nameEn: 'Virus Emblem',
    descPt: 'Próxima digivolução será do galho VÍRUS', descEn: 'Next digivolution takes the VIRUS branch', price: 120 },
  { id: 'emblem-data',    kind: 'emblem', icon: '🔵', attr: 'data',
    namePt: 'Emblema do Dado',   nameEn: 'Data Emblem',
    descPt: 'Próxima digivolução será do galho DADO', descEn: 'Next digivolution takes the DATA branch', price: 120 },
  { id: 'emblem-vaccine', kind: 'emblem', icon: '🟡', attr: 'vaccine',
    namePt: 'Emblema da Vacina', nameEn: 'Vaccine Emblem',
    descPt: 'Próxima digivolução será do galho VACINA', descEn: 'Next digivolution takes the VACCINE branch', price: 120 },
  // Item digivolutions (Digimon World 1 style): equip one; when the pet's
  // NORMAL evolution to that level happens, the form is replaced by the item's
  // Digimon (item consumed). Next evolution continues the branch normally, and
  // degeneration returns to the correct branch form — never the item form.
  { id: 'evo-greymon', kind: 'evo', icon: '🦖', evoTarget: 'greymon', evoLevel: 'champion',
    namePt: 'Garra Cinzenta', nameEn: 'Grey Claws',
    descPt: 'A evolução para CAMPEÃO vira Greymon', descEn: 'Your CHAMPION evolution becomes Greymon', price: 180 },
  { id: 'evo-garurumon', kind: 'evo', icon: '🔷', evoTarget: 'garurumon', evoLevel: 'champion',
    namePt: 'Cristal Azul', nameEn: 'Blue Crystal',
    descPt: 'A evolução para CAMPEÃO vira Garurumon', descEn: 'Your CHAMPION evolution becomes Garurumon', price: 180 },
  { id: 'evo-meramon', kind: 'evo', icon: '🔥', evoTarget: 'meramon', evoLevel: 'champion',
    namePt: 'Bola de Fogo', nameEn: 'Fireball',
    descPt: 'A evolução para CAMPEÃO vira Meramon', descEn: 'Your CHAMPION evolution becomes Meramon', price: 180 },
  { id: 'evo-monzaemon', kind: 'evo', icon: '🧸', evoTarget: 'monzaemon', evoLevel: 'ultimate',
    namePt: 'Fantasia de Monzaemon', nameEn: 'Monzaemon Suit',
    descPt: 'A evolução para PERFEITO vira Monzaemon', descEn: 'Your ULTIMATE evolution becomes Monzaemon', price: 220 },
  { id: 'evo-etemon', kind: 'evo', icon: '🍌', evoTarget: 'etemon', evoLevel: 'ultimate',
    namePt: 'Banana Dourada', nameEn: 'Golden Banana',
    descPt: 'A evolução para PERFEITO vira Etemon', descEn: 'Your ULTIMATE evolution becomes Etemon', price: 220 },
  // Pet-box backgrounds — permanent, equippable (css in utils/backgrounds.ts)
  { id: 'bg-night',  kind: 'bg', icon: '🌌',
    namePt: 'Céu Noturno',  nameEn: 'Night Sky',
    descPt: 'Cenário estrelado para o box do pet', descEn: 'Starry backdrop for the pet box', price: 50 },
  { id: 'bg-desert', kind: 'bg', icon: '🏜️',
    namePt: 'Deserto Pixel', nameEn: 'Pixel Desert',
    descPt: 'Pôr do sol pixelado no deserto', descEn: 'Pixel sunset in the desert', price: 50 },
  { id: 'bg-matrix', kind: 'bg', icon: '🟩',
    namePt: 'Matriz Verde', nameEn: 'Green Matrix',
    descPt: 'Grade digital verde estilo matrix', descEn: 'Matrix-style green digital grid', price: 50 },
];

/** Quick lookup for item-digivolution entries by id. */
export const EVO_ITEMS: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.filter(i => i.kind === 'evo').map(i => [i.id, i]),
);
