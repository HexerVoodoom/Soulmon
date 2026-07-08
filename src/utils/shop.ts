// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy); see docs/SHOP-PLAN.md.
export type ShopItemKind = 'chip' | 'heart' | 'bg' | 'evo';
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

export const CHIP_BOOST = 3;   // attribute points granted when a chip is USED
export const HEART_HEAL = 1;   // hearts restored when a heart item is USED

// Inventory emojis for the consumable items that live in the Items folder.
export const CHIP_EMOJI: Record<Attr, string> = { virus: '🦠', data: '💾', vaccine: '💉' };
export const HEART_ITEM_EMOJI = '💗';

// Consumables that live in the Items folder alongside food, but behave
// differently when USED: chips only add attribute points (no energy), and the
// heart item only heals HP. Keyed by their inventory emoji.
export interface SpecialItem {
  emoji: string;
  kind: 'chip' | 'heart';
  attr?: Attr;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
}

export const SPECIAL_ITEMS: Record<string, SpecialItem> = {
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
  // Item digivolutions (Digimon World 1 style): equip one; when the pet's
  // NORMAL evolution to that level happens, the form is replaced by the item's
  // Digimon (item consumed). Next evolution continues the branch normally, and
  // degeneration returns to the correct branch form — never the item form.
  { id: 'evo-greymon', kind: 'evo', icon: '🦖', evoTarget: 'greymon', evoLevel: 'champion',
    namePt: 'Garra Cinzenta', nameEn: 'Grey Claws',
    descPt: 'A evolução para CAMPEÃO vira Greymon', descEn: 'Your CHAMPION evolution becomes Greymon', price: 450 },
  { id: 'evo-garurumon', kind: 'evo', icon: '🔷', evoTarget: 'garurumon', evoLevel: 'champion',
    namePt: 'Cristal Azul', nameEn: 'Blue Crystal',
    descPt: 'A evolução para CAMPEÃO vira Garurumon', descEn: 'Your CHAMPION evolution becomes Garurumon', price: 450 },
  { id: 'evo-meramon', kind: 'evo', icon: '🔥', evoTarget: 'meramon', evoLevel: 'champion',
    namePt: 'Bola de Fogo', nameEn: 'Fireball',
    descPt: 'A evolução para CAMPEÃO vira Meramon', descEn: 'Your CHAMPION evolution becomes Meramon', price: 450 },
  { id: 'evo-devimon', kind: 'evo', icon: '🦇', evoTarget: 'devimon', evoLevel: 'champion',
    namePt: 'Selo das Trevas', nameEn: 'Dark Seal',
    descPt: 'A evolução para CAMPEÃO vira Devimon', descEn: 'Your CHAMPION evolution becomes Devimon', price: 450 },
  { id: 'evo-angemon', kind: 'evo', icon: '🕊️', evoTarget: 'angemon', evoLevel: 'champion',
    namePt: 'Asa Branca', nameEn: 'White Wing',
    descPt: 'A evolução para CAMPEÃO vira Angemon', descEn: 'Your CHAMPION evolution becomes Angemon', price: 450 },
  { id: 'evo-birdramon', kind: 'evo', icon: '🐦', evoTarget: 'birdramon', evoLevel: 'champion',
    namePt: 'Pena de Fogo', nameEn: 'Fire Feather',
    descPt: 'A evolução para CAMPEÃO vira Birdramon', descEn: 'Your CHAMPION evolution becomes Birdramon', price: 450 },
  { id: 'evo-kabuterimon', kind: 'evo', icon: '⚡', evoTarget: 'kabuterimon', evoLevel: 'champion',
    namePt: 'Chifre Elétrico', nameEn: 'Electro Horn',
    descPt: 'A evolução para CAMPEÃO vira Kabuterimon', descEn: 'Your CHAMPION evolution becomes Kabuterimon', price: 450 },
  { id: 'evo-seadramon', kind: 'evo', icon: '🌊', evoTarget: 'seadramon', evoLevel: 'champion',
    namePt: 'Escama do Mar', nameEn: 'Sea Scale',
    descPt: 'A evolução para CAMPEÃO vira Seadramon', descEn: 'Your CHAMPION evolution becomes Seadramon', price: 450 },
  { id: 'evo-airdramon', kind: 'evo', icon: '🌪️', evoTarget: 'airdramon', evoLevel: 'champion',
    namePt: 'Espiral do Vento', nameEn: 'Wind Spiral',
    descPt: 'A evolução para CAMPEÃO vira Airdramon', descEn: 'Your CHAMPION evolution becomes Airdramon', price: 450 },
  { id: 'evo-ogremon', kind: 'evo', icon: '🦴', evoTarget: 'ogremon', evoLevel: 'champion',
    namePt: 'Clava de Osso', nameEn: 'Bone Club',
    descPt: 'A evolução para CAMPEÃO vira Ogremon', descEn: 'Your CHAMPION evolution becomes Ogremon', price: 450 },
  { id: 'evo-kuwagamon', kind: 'evo', icon: '✂️', evoTarget: 'kuwagamon', evoLevel: 'champion',
    namePt: 'Tesoura Carmesim', nameEn: 'Crimson Scissor',
    descPt: 'A evolução para CAMPEÃO vira Kuwagamon', descEn: 'Your CHAMPION evolution becomes Kuwagamon', price: 450 },
  // Numemon: the classic 1997 v-pet "failure" form — dirt cheap on purpose.
  // Lore-faithful secret: its NEXT evolution is always Monzaemon (see
  // getNextEvolution), just like Digital Monster Ver.1.
  { id: 'evo-numemon', kind: 'evo', icon: '🗑️', evoTarget: 'numemon', evoLevel: 'champion',
    namePt: 'Lixo Misterioso', nameEn: 'Mysterious Junk',
    descPt: 'A evolução para CAMPEÃO vira Numemon… confie no processo', descEn: 'Your CHAMPION evolution becomes Numemon… trust the process', price: 150 },
  { id: 'evo-monzaemon', kind: 'evo', icon: '🧸', evoTarget: 'monzaemon', evoLevel: 'ultimate',
    namePt: 'Fantasia de Monzaemon', nameEn: 'Monzaemon Suit',
    descPt: 'A evolução para PERFEITO vira Monzaemon', descEn: 'Your ULTIMATE evolution becomes Monzaemon', price: 600 },
  { id: 'evo-etemon', kind: 'evo', icon: '🍌', evoTarget: 'etemon', evoLevel: 'ultimate',
    namePt: 'Banana Dourada', nameEn: 'Golden Banana',
    descPt: 'A evolução para PERFEITO vira Etemon', descEn: 'Your ULTIMATE evolution becomes Etemon', price: 600 },
  { id: 'evo-andromon', kind: 'evo', icon: '🤖', evoTarget: 'andromon', evoLevel: 'ultimate',
    namePt: 'Núcleo Ciber', nameEn: 'Cyber Core',
    descPt: 'A evolução para PERFEITO vira Andromon', descEn: 'Your ULTIMATE evolution becomes Andromon', price: 600 },
  { id: 'evo-megadramon', kind: 'evo', icon: '🦾', evoTarget: 'megadramon', evoLevel: 'ultimate',
    namePt: 'Garra Ciborgue', nameEn: 'Cyborg Claw',
    descPt: 'A evolução para PERFEITO vira Megadramon', descEn: 'Your ULTIMATE evolution becomes Megadramon', price: 600 },
  { id: 'evo-vademon', kind: 'evo', icon: '🛸', evoTarget: 'vademon', evoLevel: 'ultimate',
    namePt: 'Disco Voador', nameEn: 'Flying Saucer',
    descPt: 'A evolução para PERFEITO vira Vademon', descEn: 'Your ULTIMATE evolution becomes Vademon', price: 600 },
  // Nanimon: the Perfect-level gag form of the old v-pets — budget priced.
  { id: 'evo-nanimon', kind: 'evo', icon: '👾', evoTarget: 'nanimon', evoLevel: 'ultimate',
    namePt: 'Invasor', nameEn: 'The Invader',
    descPt: 'A evolução para PERFEITO vira Nanimon', descEn: 'Your ULTIMATE evolution becomes Nanimon', price: 300 },
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
    descPt: 'A floresta onde todo domador começa', descEn: 'The forest where every tamer begins', price: 150 },
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
    descPt: 'Blocos pastel na cidade do Monzaemon', descEn: 'Pastel blocks in Monzaemon\'s town', price: 200 },
  { id: 'bg-synthwave', kind: 'bg', icon: '🌆',
    namePt: 'Synthwave', nameEn: 'Synthwave',
    descPt: 'Sol neon e grade infinita anos 80', descEn: 'Neon sun over an endless 80s grid', price: 250 },
];

/** Quick lookup for item-digivolution entries by id. */
export const EVO_ITEMS: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.filter(i => i.kind === 'evo').map(i => [i.id, i]),
);
