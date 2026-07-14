// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy); see docs/SHOP-PLAN.md.
export type ShopItemKind = 'chip' | 'heart' | 'bg';
export type Attr = 'virus' | 'data' | 'vaccine';

/**
 * Purchase gate. Locked items still show in the shop — darkened, with a
 * padlock; tapping them reveals HOW to unlock:
 * - 'mission': buyable after the mission (utils/missions.ts) is complete.
 */
export type UnlockReq = { kind: 'mission'; missionId: string };

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
  /** When present, purchasing is locked until the requirement is met. */
  unlock?: UnlockReq;
}

export const CHIP_BOOST = 3;   // attribute points granted when a chip is USED
export const HEART_HEAL = 1;   // hearts restored when a heart item is USED

// Inventory emojis for the consumable items that live in the Items folder.
export const CHIP_EMOJI: Record<Attr, string> = { virus: '🦠', data: '💾', vaccine: '💉' };
export const HEART_ITEM_EMOJI = '💗';

// Consumables that live in the Items folder alongside food, but behave
// differently when USED: chips only add attribute points (no energy), the
// heart item only heals HP, and the Glitchtama grants a perfect day.
// Keyed by their inventory emoji.
export interface SpecialItem {
  emoji: string;
  kind: 'chip' | 'heart' | 'glitchtama';
  attr?: Attr;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
}

// 🌀 Glitchtama — dropped by completing all 5 dungeon floors. Using it grants
// one perfect day (an evolution point), no questions asked.
export const GLITCHTAMA_EMOJI = '🌀';

export const SPECIAL_ITEMS: Record<string, SpecialItem> = {
  [GLITCHTAMA_EMOJI]: {
    emoji: GLITCHTAMA_EMOJI, kind: 'glitchtama',
    namePt: 'Glitchtama', nameEn: 'Glitchtama',
    descPt: 'Usar concede 1 dia perfeito (+1 ponto de evolução)', descEn: 'Use to gain 1 perfect day (+1 evolution point)',
  },
  [CHIP_EMOJI.virus]: {
    emoji: CHIP_EMOJI.virus, kind: 'chip', attr: 'virus',
    namePt: 'Chip de Vírus', nameEn: 'Virus Chip',
    descPt: `Usar dá +${CHIP_BOOST} de vírus (não enche energia)`, descEn: `Use for +${CHIP_BOOST} virus (no energy)`,
  },
  [CHIP_EMOJI.data]: {
    emoji: CHIP_EMOJI.data, kind: 'chip', attr: 'data',
    namePt: 'Chip de Dado', nameEn: 'Data Chip',
    descPt: `Usar dá +${CHIP_BOOST} de dado (não enche energia)`, descEn: `Use for +${CHIP_BOOST} data (no energy)`,
  },
  [CHIP_EMOJI.vaccine]: {
    emoji: CHIP_EMOJI.vaccine, kind: 'chip', attr: 'vaccine',
    namePt: 'Chip de Vacina', nameEn: 'Vaccine Chip',
    descPt: `Usar dá +${CHIP_BOOST} de vacina (não enche energia)`, descEn: `Use for +${CHIP_BOOST} vaccine (no energy)`,
  },
  [HEART_ITEM_EMOJI]: {
    emoji: HEART_ITEM_EMOJI, kind: 'heart',
    namePt: 'Coraçãozinho', nameEn: 'Little Heart',
    descPt: `Usar cura ${HEART_HEAL} coração`, descEn: `Use to heal ${HEART_HEAL} heart`,
  },
};

export function isSpecialItem(emoji: string): boolean {
  return emoji in SPECIAL_ITEMS;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Attribute chips — bought here, then USED from the Items folder (they only
  // raise the attribute, no energy). They steer the evolution branch.
  { id: 'chip-virus',   kind: 'chip', icon: CHIP_EMOJI.virus, attr: 'virus',
    namePt: 'Chip de Vírus',  nameEn: 'Virus Chip',
    descPt: `Vai pra pastinha; usar dá +${CHIP_BOOST} de vírus`, descEn: `Goes to Items; use for +${CHIP_BOOST} virus`, price: 120 },
  { id: 'chip-data',    kind: 'chip', icon: CHIP_EMOJI.data, attr: 'data',
    namePt: 'Chip de Dado',   nameEn: 'Data Chip',
    descPt: `Vai pra pastinha; usar dá +${CHIP_BOOST} de dado`, descEn: `Goes to Items; use for +${CHIP_BOOST} data`, price: 120 },
  { id: 'chip-vaccine', kind: 'chip', icon: CHIP_EMOJI.vaccine, attr: 'vaccine',
    namePt: 'Chip de Vacina', nameEn: 'Vaccine Chip',
    descPt: `Vai pra pastinha; usar dá +${CHIP_BOOST} de vacina`, descEn: `Goes to Items; use for +${CHIP_BOOST} vaccine`, price: 120 },
  // Heart item — the ONLY buyable HP heal. Goes to the Items folder; using it
  // restores a heart. Also drops (rarely) in the dungeon.
  { id: 'heart-item', kind: 'heart', icon: HEART_ITEM_EMOJI,
    namePt: 'Coraçãozinho', nameEn: 'Little Heart',
    descPt: `Vai pra pastinha; usar cura ${HEART_HEAL} coração`, descEn: `Goes to Items; use to heal ${HEART_HEAL} heart`, price: 150 },
  // (Glitchtama is deliberately NOT sold — the only way to get one is
  // clearing all 5 dungeon floors.)
  // Pet-box backgrounds — permanent, equippable (css in utils/backgrounds.ts)
  { id: 'bg-night',  kind: 'bg', icon: '🌌',
    namePt: 'Céu Noturno',  nameEn: 'Night Sky',
    descPt: 'Cenário estrelado para o box do pet', descEn: 'Starry backdrop for the pet box', price: 150 },
  { id: 'bg-desert', kind: 'bg', icon: '🏜️',
    namePt: 'Deserto Pixel', nameEn: 'Pixel Desert',
    descPt: 'Pôr do sol pixelado no deserto', descEn: 'Pixel sunset in the desert', price: 150 },
  { id: 'bg-matrix', kind: 'bg', icon: '🟩',
    namePt: 'Matriz Verde', nameEn: 'Green Matrix',
    descPt: 'Grade digital verde estilo matrix', descEn: 'Matrix-style green digital grid', price: 150 },
  { id: 'bg-forest', kind: 'bg', icon: '🌲',
    namePt: 'Floresta Nativa', nameEn: 'Native Forest',
    descPt: 'A floresta onde toda jornada começa', descEn: 'The forest where every journey begins', price: 150 },
  { id: 'bg-ocean', kind: 'bg', icon: '🐠',
    namePt: 'Fundo do Mar', nameEn: 'Deep Sea',
    descPt: 'Profundezas azuis com bolhas subindo', descEn: 'Blue depths with rising bubbles', price: 150 },
  { id: 'bg-gameboy', kind: 'bg', icon: '🕹️',
    namePt: 'LCD Retrô', nameEn: 'Retro LCD',
    descPt: 'Tela verde monocromática de 1989', descEn: 'Monochrome green screen, 1989 style', price: 150 },
  { id: 'bg-snow', kind: 'bg', icon: '❄️',
    namePt: 'Terra Gelada', nameEn: 'Freezeland',
    descPt: 'Planície congelada sob a neve', descEn: 'Frozen plains under falling snow', price: 180 },
  { id: 'bg-lava', kind: 'bg', icon: '🌋',
    namePt: 'Montanha de Lava', nameEn: 'Lava Mountain',
    descPt: 'Rocha escura e magma incandescente', descEn: 'Dark rock and glowing magma', price: 180 },
  { id: 'bg-sakura', kind: 'bg', icon: '🌸',
    namePt: 'Cerejeira', nameEn: 'Cherry Blossom',
    descPt: 'Pétalas cor-de-rosa ao vento', descEn: 'Pink petals drifting in the wind', price: 180 },
  { id: 'bg-toytown', kind: 'bg', icon: '🧸',
    namePt: 'Cidade dos Brinquedos', nameEn: 'Toy Town',
    descPt: 'Blocos pastel de uma cidade de brinquedo', descEn: 'Pastel blocks of a toy town', price: 200 },
  { id: 'bg-synthwave', kind: 'bg', icon: '🌆',
    namePt: 'Synthwave', nameEn: 'Synthwave',
    descPt: 'Sol neon e grade infinita anos 80', descEn: 'Neon sun over an endless 80s grid', price: 250 },
  // Mission-gated backdrops — visible from day one, locked behind achievements
  // (utils/missions.ts). Completing the mission unlocks the PURCHASE.
  { id: 'bg-mission-filecity', kind: 'bg', icon: '🏘️',
    namePt: 'Cidade do Arquivo', nameEn: 'File City',
    descPt: 'A vila onde tudo começa', descEn: 'The village where it all begins', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-champion' } },
  { id: 'bg-mission-infinity', kind: 'bg', icon: '🗻',
    namePt: 'Monte Infinito', nameEn: 'Mount Infinity',
    descPt: 'O pico final sob as estrelas', descEn: 'The final peak under the stars', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-mega' } },
  { id: 'bg-mission-coliseum', kind: 'bg', icon: '🏟️',
    namePt: 'Coliseu Digital', nameEn: 'Digital Coliseum',
    descPt: 'Arena dourada dos gladiadores', descEn: 'Golden arena of gladiators', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-kills-100' } },
  { id: 'bg-mission-abyss', kind: 'bg', icon: '🕳️',
    namePt: 'Abismo da Masmorra', nameEn: 'Dungeon Abyss',
    descPt: 'O fundo vermelho da masmorra', descEn: 'The dungeon\'s crimson depths', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-runs-3' } },
  { id: 'bg-mission-dinoland', kind: 'bg', icon: '🦕',
    namePt: 'Vale dos Dinos', nameEn: 'Dino Valley',
    descPt: 'Pôr do sol pré-histórico', descEn: 'Prehistoric sunset', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-dino-1000' } },
  { id: 'bg-mission-aurora', kind: 'bg', icon: '🌠',
    namePt: 'Aurora Digital', nameEn: 'Digital Aurora',
    descPt: 'Luzes dançando no céu polar', descEn: 'Lights dancing in the polar sky', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-perfect-30' } },
];
