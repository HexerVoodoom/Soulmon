// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy); see docs/SHOP-PLAN.md.
export type ShopItemKind = 'chip' | 'emblem' | 'bg';
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
