// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy); see docs/SHOP-PLAN.md.
import type { SlotId, DecorFit } from './petStage';
import { GUILD_COPY_CORE } from './guildCopyCore';
import { PREMIUM_SPECIAL_ITEMS } from './premiumFood';

export type ShopItemKind = 'chip' | 'heart' | 'bg' | 'furniture' | 'emblem';

/** Moeda que compra o item. Ausente = Bits (o padrão da loja). */
export type ShopCurrency = 'bits' | 'emblems';
export type Attr = 'power' | 'harmony' | 'benevolence';

/**
 * Purchase gate. Locked items still show in the shop — darkened, with a
 * padlock; tapping them reveals HOW to unlock:
 * - 'mission': buyable after the mission (utils/missions.ts) is complete.
 * - 'subscription': claimable (free) while the quarterly cosmetic subscription is
 *   active (docs/ASSINATURA-SPEC.md, D10). Same mould as 'mission': the item shows
 *   darkened and says why — it never disappears in silence. `quarter` names the set.
 */
export type UnlockReq =
  | { kind: 'mission'; missionId: string }
  | { kind: 'subscription'; quarter: string };

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  /** Emoji — identidade do item no inventário (chip/heart usam isso como
   *  CHAVE em foodInventory, ver App.tsx handleShopBuy/handleFeed), e também
   *  o que a loja DESENHA nos consumíveis: item da pastinha é CONTEÚDO, não
   *  ícone de sistema. Cenário desenha a prévia CSS (utils/backgrounds.ts) e
   *  decoração desenha a arte pixel (utils/decorArt.ts) — por isso nenhum
   *  item precisa de ícone vetorial, e os 15 símbolos de terceiro que moravam
   *  aqui (`displayIcon`) saíram sem substituto: eram ícone decorativo. */
  icon: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  price: number;
  attr?: Attr;
  /** When present, purchasing is locked until the requirement is met. */
  unlock?: UnlockReq;
  /** Moeda do preço. Sem isto = Bits. Emblemas só compram itens da aba
   *  Torneio — as moedas não se misturam (ver utils/currencies.ts). */
  currency?: ShopCurrency;
  /** Só em kind:'furniture'. ESPAÇO do palco que o item ocupa (utils/petStage.ts).
   *  Equipar troca o que estava naquele espaço — não empilha. */
  slot?: SlotId;
  /** Só em kind:'furniture'. Em que tipo de cenário o item faz sentido. Um sofá
   *  numa planície de neve não é charme, é erro de composição. */
  fits?: DecorFit;
}

export const CHIP_BOOST = 3;   // type points (path weight only, no total/XP) granted when a chip is USED
// Chips MAIORES (D-12, ~2x o chip comum) e o Prisma (reparte 2/2/2). Só pontos de tipo.
export const BIG_CHIP_BOOST = 6;
export const PRISM_CHIP_BOOST = 2;
export const BIG_CHIP_EMOJI: Record<Attr, string> = { power: '🥊', harmony: '🎼', benevolence: '💞' };
export const PRISM_CHIP_EMOJI = '🔷';
// D-95 (19/10/2026): chip novo, +9 em CADA atributo, 2.400 Bits fixos. Reusa a arte do Prisma (sem arte nova).
export const TRIPLE_CHIP_BOOST = 9;
export const TRIPLE_CHIP_EMOJI = '💠';
export const TRIPLE_CHIP_PRICE = 2400;
// D-96: preço dos chips +100% (180→360, maiores 420→840).
export const CHIP_PRICE = 360;
export const BIG_CHIP_PRICE = 840;
export const HEART_HEAL = 1;   // hearts restored when a heart item is USED

// Inventory emojis for the consumable items that live in the Items folder.
export const CHIP_EMOJI: Record<Attr, string> = { power: '👊', harmony: '🎶', benevolence: '🤲' };
export const HEART_ITEM_EMOJI = '💗';
/** ✨ Faísca de Alma (30/10/2026, corrigida pelo dono no mesmo dia): usada nos Arquivos, restaura a ENERGIA DA HOME (a que a comida regenera e a Masmorra gasta). */
export const SPARK_ITEM_EMOJI = '✨';
/** Energia da Home restaurada por 1 Faísca (como a comida premium antiga, +5; teto = máximo do estágio). */
export const SPARK_HOME_ENERGY = 5;

// Consumables that live in the Items folder alongside food, but behave
// differently when USED: chips only add attribute points (no energy), the
// heart item only heals HP, and the Glitchtama grants a perfect day.
// Keyed by their inventory emoji.
export interface SpecialItem {
  emoji: string;
  kind: 'chip' | 'heart' | 'glitchtama' | 'premium' | 'spark';
  attr?: Attr;
  /** Pontos de tipo por atributo ao usar o chip. Ausente = só `attr` com CHIP_BOOST. */
  boosts?: Record<Attr, number>;
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
    descPt: 'Usar soma um dia de passos ao caminho da evolução', descEn: 'Use to add one day of steps to the evolution path',
  },
  [CHIP_EMOJI.power]: {
    emoji: CHIP_EMOJI.power, kind: 'chip', attr: 'power',
    namePt: 'Chip de Poder', nameEn: 'Power Chip',
    descPt: `+${CHIP_BOOST} Poder`, descEn: `+${CHIP_BOOST} Power`,
  },
  [CHIP_EMOJI.harmony]: {
    emoji: CHIP_EMOJI.harmony, kind: 'chip', attr: 'harmony',
    namePt: 'Chip de Harmonia', nameEn: 'Harmony Chip',
    descPt: `+${CHIP_BOOST} Harmonia`, descEn: `+${CHIP_BOOST} Harmony`,
  },
  [CHIP_EMOJI.benevolence]: {
    emoji: CHIP_EMOJI.benevolence, kind: 'chip', attr: 'benevolence',
    namePt: 'Chip de Benevolência', nameEn: 'Benevolence Chip',
    descPt: `+${CHIP_BOOST} Benevolência`, descEn: `+${CHIP_BOOST} Benevolence`,
  },
  [BIG_CHIP_EMOJI.power]: {
    emoji: BIG_CHIP_EMOJI.power, kind: 'chip', attr: 'power',
    boosts: { power: BIG_CHIP_BOOST, harmony: 0, benevolence: 0 },
    namePt: 'Chip Maior de Poder', nameEn: 'Major Power Chip',
    descPt: `+${BIG_CHIP_BOOST} Poder`, descEn: `+${BIG_CHIP_BOOST} Power`,
  },
  [BIG_CHIP_EMOJI.harmony]: {
    emoji: BIG_CHIP_EMOJI.harmony, kind: 'chip', attr: 'harmony',
    boosts: { power: 0, harmony: BIG_CHIP_BOOST, benevolence: 0 },
    namePt: 'Chip Maior de Harmonia', nameEn: 'Major Harmony Chip',
    descPt: `+${BIG_CHIP_BOOST} Harmonia`, descEn: `+${BIG_CHIP_BOOST} Harmony`,
  },
  [BIG_CHIP_EMOJI.benevolence]: {
    emoji: BIG_CHIP_EMOJI.benevolence, kind: 'chip', attr: 'benevolence',
    boosts: { power: 0, harmony: 0, benevolence: BIG_CHIP_BOOST },
    namePt: 'Chip Maior de Benevolência', nameEn: 'Major Benevolence Chip',
    descPt: `+${BIG_CHIP_BOOST} Benevolência`, descEn: `+${BIG_CHIP_BOOST} Benevolence`,
  },
  [PRISM_CHIP_EMOJI]: {
    emoji: PRISM_CHIP_EMOJI, kind: 'chip',
    boosts: { power: PRISM_CHIP_BOOST, harmony: PRISM_CHIP_BOOST, benevolence: PRISM_CHIP_BOOST },
    namePt: 'Chip Prisma', nameEn: 'Prism Chip',
    descPt: `+${PRISM_CHIP_BOOST} Poder, Harmonia e Benevolência`, descEn: `+${PRISM_CHIP_BOOST} Power, Harmony and Benevolence`,
  },
  [TRIPLE_CHIP_EMOJI]: {
    emoji: TRIPLE_CHIP_EMOJI, kind: 'chip',
    boosts: { power: TRIPLE_CHIP_BOOST, harmony: TRIPLE_CHIP_BOOST, benevolence: TRIPLE_CHIP_BOOST },
    namePt: 'Chip Triplo', nameEn: 'Triple Chip',
    descPt: `+${TRIPLE_CHIP_BOOST} em cada atributo`, descEn: `+${TRIPLE_CHIP_BOOST} to each attribute`,
  },
  [HEART_ITEM_EMOJI]: {
    emoji: HEART_ITEM_EMOJI, kind: 'heart',
    namePt: 'Coraçãozinho', nameEn: 'Little Heart',
    descPt: `Usar cura ${HEART_HEAL} coração`, descEn: `Use to heal ${HEART_HEAL} heart`,
  },
  [SPARK_ITEM_EMOJI]: {
    emoji: SPARK_ITEM_EMOJI, kind: 'spark',
    namePt: 'Faísca de Alma', nameEn: 'Soul Spark',
    descPt: `Restaura ${SPARK_HOME_ENERGY} de energia`, descEn: `Restores ${SPARK_HOME_ENERGY} energy`,
  },
  // Comida premium (uma por comida de categoria) — dono: `utils/premiumFood.ts`.
  ...PREMIUM_SPECIAL_ITEMS,
};

export function isSpecialItem(emoji: string): boolean {
  return emoji in SPECIAL_ITEMS;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Attribute chips — bought here, then USED from the Items folder (they only
  // raise the attribute, no energy). They steer the evolution branch. Nomes
  // e ícones seguem os 3 atributos do oráculo (ver EvolutionPath.tsx /
  // AlignmentIcons.tsx) — Poder/Harmonia/Benevolência, nomes únicos desde 29/09/2026.
  { id: 'chip-power',   kind: 'chip', icon: CHIP_EMOJI.power, attr: 'power',
    namePt: 'Chip de Poder',  nameEn: 'Power Chip',
    descPt: `+${CHIP_BOOST} Poder`, descEn: `+${CHIP_BOOST} Power`, price: CHIP_PRICE },
  { id: 'chip-harmony',    kind: 'chip', icon: CHIP_EMOJI.harmony, attr: 'harmony',
    namePt: 'Chip de Harmonia',   nameEn: 'Harmony Chip',
    descPt: `+${CHIP_BOOST} Harmonia`, descEn: `+${CHIP_BOOST} Harmony`, price: CHIP_PRICE },
  { id: 'chip-benevolence', kind: 'chip', icon: CHIP_EMOJI.benevolence, attr: 'benevolence',
    namePt: 'Chip de Benevolência', nameEn: 'Benevolence Chip',
    descPt: `+${CHIP_BOOST} Benevolência`, descEn: `+${CHIP_BOOST} Benevolence`, price: CHIP_PRICE },
  { id: 'chip-big-power', kind: 'chip', icon: BIG_CHIP_EMOJI.power, attr: 'power',
    namePt: 'Chip Maior de Poder', nameEn: 'Major Power Chip',
    descPt: `+${BIG_CHIP_BOOST} Poder`, descEn: `+${BIG_CHIP_BOOST} Power`, price: BIG_CHIP_PRICE },
  { id: 'chip-big-harmony', kind: 'chip', icon: BIG_CHIP_EMOJI.harmony, attr: 'harmony',
    namePt: 'Chip Maior de Harmonia', nameEn: 'Major Harmony Chip',
    descPt: `+${BIG_CHIP_BOOST} Harmonia`, descEn: `+${BIG_CHIP_BOOST} Harmony`, price: BIG_CHIP_PRICE },
  { id: 'chip-big-benevolence', kind: 'chip', icon: BIG_CHIP_EMOJI.benevolence, attr: 'benevolence',
    namePt: 'Chip Maior de Benevolência', nameEn: 'Major Benevolence Chip',
    descPt: `+${BIG_CHIP_BOOST} Benevolência`, descEn: `+${BIG_CHIP_BOOST} Benevolence`, price: BIG_CHIP_PRICE },
  // D-94 (19/10/2026): o Chip Prisma ('inútil') saiu da LOJA. Continua em `SPECIAL_ITEMS`
  // (catálogo de USO): quem já o tem na pastinha mantém e usa.
  { id: 'chip-triple', kind: 'chip', icon: TRIPLE_CHIP_EMOJI,
    namePt: 'Chip Triplo', nameEn: 'Triple Chip',
    descPt: `+${TRIPLE_CHIP_BOOST} em cada atributo`, descEn: `+${TRIPLE_CHIP_BOOST} to each attribute`, price: TRIPLE_CHIP_PRICE },
  // ⚰️ O CORAÇÃOZINHO NÃO É MAIS VENDIDO (06/09/2026, D7+D15). Ele custava 150
  // Bits, e Créditos compram Bits (`BITS_EXCHANGE`, 1→10): eram 15 Créditos por
  // +1 coração, sem cap — dinheiro comprando a volta do único recurso que a
  // punição tira, só que por um caminho indireto. Indireto não é melhor: é o
  // mesmo, escondido.
  //
  // O item CONTINUA existindo e curando. Ele vive em `SPECIAL_ITEMS` (abaixo),
  // que é o catálogo de USO e não o de COMPRA — por isso quem já tem um no
  // `foodInventory` não perde nada, e a `ItemsWindow` segue desenhando. A fonte
  // passa a ser só a masmorra (drop raro, teto diário), que é esforço e não
  // dinheiro.
  // (Glitchtama is deliberately NOT sold — the only way to get one is
  // clearing all 5 dungeon floors.)
  // Decoração equipável no box do pet. Cada uma ocupa um ESPAÇO do palco
  // (utils/petStage.ts) e só aparece em cenário compatível (`fits`) — equipar
  // troca o que estava naquele espaço, nunca empilha.
  //
  // INTERIORES
  { id: 'furn-sofa', kind: 'furniture', icon: '🛋️',
    slot: 'floor-left', fits: 'indoor',
    namePt: 'Sofá Pixel', nameEn: 'Pixel Sofa',
    descPt: 'Ocupa o canto esquerdo — só em cenários de interior', descEn: 'Takes the left corner — indoor scenes only', price: 100 },
  { id: 'furn-chair', kind: 'furniture', icon: '🪑',
    slot: 'floor-left', fits: 'indoor',
    namePt: 'Poltrona', nameEn: 'Armchair',
    descPt: 'Ocupa o canto esquerdo — só em cenários de interior', descEn: 'Takes the left corner — indoor scenes only', price: 120 },
  { id: 'furn-books', kind: 'furniture', icon: '📚',
    slot: 'floor-left', fits: 'indoor',
    namePt: 'Estante de Livros', nameEn: 'Bookshelf',
    descPt: 'Ocupa o canto esquerdo — só em cenários de interior', descEn: 'Takes the left corner — indoor scenes only', price: 120 },
  { id: 'furn-lamp', kind: 'furniture', icon: '💡',
    slot: 'floor-right', fits: 'indoor',
    namePt: 'Luminária', nameEn: 'Lamp',
    descPt: 'Ocupa o canto direito — só em cenários de interior', descEn: 'Takes the right corner — indoor scenes only', price: 100 },
  { id: 'furn-rug', kind: 'furniture', icon: '🐾',
    slot: 'rug', fits: 'indoor',
    namePt: 'Tapete de Patinhas', nameEn: 'Paw Print Rug',
    descPt: 'Fica no chão, no centro — o pet anda por cima', descEn: 'Lies on the floor, centered — the pet walks over it', price: 140 },
  // QUALQUER CENÁRIO
  { id: 'furn-plant', kind: 'furniture', icon: '🪴',
    slot: 'floor-right', fits: 'any',
    namePt: 'Vaso de Planta', nameEn: 'Potted Plant',
    descPt: 'Ocupa o canto direito — combina com qualquer cenário', descEn: 'Takes the right corner — fits any scene', price: 100 },
  { id: 'furn-picture', kind: 'furniture', icon: '🖼️',
    slot: 'wall', fits: 'any',
    namePt: 'Quadro do Soulmon', nameEn: 'Soulmon Portrait',
    descPt: 'Pendurado acima do pet — em cenários que tenham onde pendurar', descEn: 'Hangs above the pet — in scenes with somewhere to hang it', price: 130 },
  // EXTERIORES — o pet passa a maior parte do tempo em cenários abertos, e até
  // aqui não havia UM elemento pensado para eles (só móvel de sala).
  { id: 'furn-campfire', kind: 'furniture', icon: '🔥',
    slot: 'floor-left', fits: 'outdoor',
    namePt: 'Fogueira', nameEn: 'Campfire',
    descPt: 'Ocupa o canto esquerdo — só em cenários abertos', descEn: 'Takes the left corner — outdoor scenes only', price: 120 },
  { id: 'furn-tent', kind: 'furniture', icon: '⛺',
    slot: 'floor-left', fits: 'outdoor',
    namePt: 'Barraca', nameEn: 'Tent',
    descPt: 'Ocupa o canto esquerdo — só em cenários abertos', descEn: 'Takes the left corner — outdoor scenes only', price: 140 },
  { id: 'furn-rock', kind: 'furniture', icon: '🪨',
    slot: 'floor-right', fits: 'outdoor',
    namePt: 'Pedra Musgosa', nameEn: 'Mossy Rock',
    descPt: 'Ocupa o canto direito — só em cenários abertos', descEn: 'Takes the right corner — outdoor scenes only', price: 100 },
  // SEGUNDA LEVA (kit v1.2) — 19 peças com arte pixel de verdade
  // (utils/decorArt.ts). Ela existe por causa de um desequilíbrio medido: o
  // `rug` tinha UM item e ele era `indoor`, enquanto o pet passa a maior parte
  // do tempo em cenário aberto — quem jogava lá fora não tinha chão nenhum
  // para comprar. Os cinco primeiros abaixo fecham esse buraco.
  { id: 'furn-grass', kind: 'furniture', icon: '🌿',
    slot: 'rug', fits: 'outdoor',
    namePt: 'Tufo de Grama', nameEn: 'Grass Patch',
    descPt: 'Fica no chão, no centro — só em cenários abertos', descEn: 'Lies on the floor, centered — outdoor scenes only', price: 110 },
  { id: 'furn-sand', kind: 'furniture', icon: '🏖️',
    slot: 'rug', fits: 'outdoor',
    namePt: 'Areia Batida', nameEn: 'Packed Sand',
    descPt: 'Fica no chão, no centro — só em cenários abertos', descEn: 'Lies on the floor, centered — outdoor scenes only', price: 110 },
  { id: 'furn-stone-tiles', kind: 'furniture', icon: '🧱',
    slot: 'rug', fits: 'any',
    namePt: 'Ladrilho de Pedra', nameEn: 'Stone Tiles',
    descPt: 'Fica no chão, no centro — combina com qualquer cenário', descEn: 'Lies on the floor, centered — fits any scene', price: 130 },
  { id: 'furn-deck', kind: 'furniture', icon: '🪵',
    slot: 'rug', fits: 'any',
    namePt: 'Tábuas de Madeira', nameEn: 'Wooden Deck',
    descPt: 'Fica no chão, no centro — combina com qualquer cenário', descEn: 'Lies on the floor, centered — fits any scene', price: 130 },
  { id: 'furn-circuit-mat', kind: 'furniture', icon: '🔌',
    slot: 'rug', fits: 'any',
    namePt: 'Tapete de Circuito', nameEn: 'Circuit Mat',
    descPt: 'Fica no chão, no centro — combina com qualquer cenário', descEn: 'Lies on the floor, centered — fits any scene', price: 140 },
  { id: 'furn-arcade-cab', kind: 'furniture', icon: '🕹️',
    slot: 'floor-left', fits: 'indoor',
    namePt: 'Fliperama de Canto', nameEn: 'Corner Arcade',
    descPt: 'Ocupa o canto esquerdo — só em cenários de interior', descEn: 'Takes the left corner — indoor scenes only', price: 140 },
  { id: 'furn-cauldron', kind: 'furniture', icon: '⚗️',
    slot: 'floor-left', fits: 'any',
    namePt: 'Caldeirão Borbulhante', nameEn: 'Bubbling Cauldron',
    descPt: 'Ocupa o canto esquerdo — combina com qualquer cenário', descEn: 'Takes the left corner — fits any scene', price: 130 },
  { id: 'furn-crystal', kind: 'furniture', icon: '💎',
    slot: 'floor-left', fits: 'outdoor',
    namePt: 'Cristal Bruto', nameEn: 'Raw Crystal',
    descPt: 'Ocupa o canto esquerdo — só em cenários abertos', descEn: 'Takes the left corner — outdoor scenes only', price: 120 },
  { id: 'furn-well', kind: 'furniture', icon: '⛲',
    slot: 'floor-left', fits: 'outdoor',
    namePt: 'Poço de Pedra', nameEn: 'Stone Well',
    descPt: 'Ocupa o canto esquerdo — só em cenários abertos', descEn: 'Takes the left corner — outdoor scenes only', price: 140 },
  { id: 'furn-lantern', kind: 'furniture', icon: '🏮',
    slot: 'floor-right', fits: 'any',
    namePt: 'Lanterna de Papel', nameEn: 'Paper Lantern',
    descPt: 'Ocupa o canto direito — combina com qualquer cenário', descEn: 'Takes the right corner — fits any scene', price: 110 },
  { id: 'furn-mushrooms', kind: 'furniture', icon: '🍄',
    slot: 'floor-right', fits: 'outdoor',
    namePt: 'Cogumelos Brilhantes', nameEn: 'Glowing Mushrooms',
    descPt: 'Ocupa o canto direito — só em cenários abertos', descEn: 'Takes the right corner — outdoor scenes only', price: 110 },
  { id: 'furn-hourglass', kind: 'furniture', icon: '⏳',
    slot: 'floor-right', fits: 'any',
    namePt: 'Ampulheta', nameEn: 'Hourglass',
    descPt: 'Ocupa o canto direito — combina com qualquer cenário', descEn: 'Takes the right corner — fits any scene', price: 130 },
  { id: 'furn-food-bowl', kind: 'furniture', icon: '🥣',
    slot: 'floor-right', fits: 'any',
    namePt: 'Potinho de Comida', nameEn: 'Food Bowl',
    descPt: 'Ocupa o canto direito — combina com qualquer cenário', descEn: 'Takes the right corner — fits any scene', price: 100 },
  { id: 'furn-window', kind: 'furniture', icon: '🪟',
    slot: 'wall', fits: 'indoor',
    namePt: 'Janelinha', nameEn: 'Little Window',
    descPt: 'Pendurado acima do pet — só em cenários de interior', descEn: 'Hangs above the pet — indoor scenes only', price: 120 },
  { id: 'furn-garland', kind: 'furniture', icon: '🎏',
    slot: 'wall', fits: 'any',
    namePt: 'Varal de Bandeirinhas', nameEn: 'Bunting Garland',
    descPt: 'Pendurado acima do pet, em qualquer cenário', descEn: 'Hangs above the pet, in any scene', price: 100 },
  { id: 'furn-wind-chime', kind: 'furniture', icon: '🎐',
    slot: 'wall', fits: 'any',
    namePt: 'Sino de Vento', nameEn: 'Wind Chime',
    descPt: 'Pendurado acima do pet, em qualquer cenário', descEn: 'Hangs above the pet, in any scene', price: 110 },
  { id: 'furn-clock', kind: 'furniture', icon: '🕰️',
    slot: 'wall', fits: 'indoor',
    namePt: 'Relógio de Parede', nameEn: 'Wall Clock',
    descPt: 'Pendurado acima do pet — só em cenários de interior', descEn: 'Hangs above the pet — indoor scenes only', price: 130 },
  // Pet-box backgrounds — permanent, equippable (css in utils/backgrounds.ts)
  // bg-room is the FREE default option — pre-owned by everyone (see
  // GameStateContext.tsx), so it always shows "Equip" instead of a price.
  { id: 'bg-room', kind: 'bg', icon: '🛏️',
    namePt: 'Quarto', nameEn: 'Bedroom',
    descPt: 'Grátis — sempre disponível', descEn: 'Free — always available', price: 0 },
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
    namePt: 'Floresta Nativa', nameEn: 'Old-Growth Forest',
    descPt: 'A floresta onde toda jornada começa', descEn: 'The forest where every journey begins', price: 150 },
  { id: 'bg-ocean', kind: 'bg', icon: '🐠',
    namePt: 'Fundo do Mar', nameEn: 'Deep Sea',
    descPt: 'Profundezas azuis com bolhas subindo', descEn: 'Blue depths with rising bubbles', price: 150 },
  { id: 'bg-gameboy', kind: 'bg', icon: '🕹️',
    namePt: 'LCD Retrô', nameEn: 'Retro LCD',
    descPt: 'Tela verde monocromática de 1989', descEn: 'Monochrome green screen, 1989 style', price: 150 },
  { id: 'bg-snow', kind: 'bg', icon: '❄️',
    namePt: 'Terra Gelada', nameEn: 'Frostlands',
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
  // SEGUNDA LEVA (kit v1.2) — cenários PINTADOS, não gradiente. São os
  // primeiros com chão desenhado de verdade na linha do palco; a decoração
  // apoia neles sem truque.
  { id: 'bg-attic', kind: 'bg', icon: '🏚️',
    namePt: 'Sótão na Chuva', nameEn: 'Rainy Attic',
    descPt: 'Madeira, cobre e chuva na janela redonda', descEn: 'Wood, copper and rain on the round window', price: 180 },
  { id: 'bg-arcade', kind: 'bg', icon: '👾',
    namePt: 'Sala de Fliperama', nameEn: 'Arcade Room',
    descPt: 'Uma parede de gabinetes acesos no escuro', descEn: 'A wall of cabinets glowing in the dark', price: 180 },
  { id: 'bg-library', kind: 'bg', icon: '📖',
    namePt: 'Biblioteca Arcana', nameEn: 'Arcane Library',
    descPt: 'Estantes de pedra e velas de chama fria', descEn: 'Stone shelves and cold-flame candles', price: 200 },
  { id: 'bg-shrine', kind: 'bg', icon: '⛩️',
    namePt: 'Santuário de Pedra', nameEn: 'Stone Shrine',
    descPt: 'Portal coberto de musgo e lanternas turquesa', descEn: 'A mossy gate and turquoise lanterns', price: 200 },
  { id: 'bg-rooftop', kind: 'bg', icon: '🌃',
    namePt: 'Telhado da Cidade', nameEn: 'City Rooftop',
    descPt: 'A cidade inteira acesa atrás do parapeito', descEn: 'The whole city lit up beyond the railing', price: 200 },
  { id: 'bg-cloudsea', kind: 'bg', icon: '☁️',
    namePt: 'Mar de Nuvens', nameEn: 'Sea of Clouds',
    descPt: 'O cume acima de tudo, e nada além do céu', descEn: 'The summit above everything, and only sky beyond', price: 220 },
  { id: 'bg-observatory', kind: 'bg', icon: '🔭',
    namePt: 'Observatório', nameEn: 'Observatory',
    descPt: 'A cúpula aberta e o mapa das estrelas', descEn: 'The open dome and the star chart', price: 220 },
  { id: 'bg-swamp', kind: 'bg', icon: '🍄',
    namePt: 'Pântano Fosforescente', nameEn: 'Glowing Swamp',
    descPt: 'Raízes, esporos e cogumelos acesos na água parada', descEn: 'Roots, spores and lit mushrooms over still water', price: 220 },
  // TERCEIRA LEVA (04/10/2026) — pintados, chão na linha do palco (74%).
  { id: 'bg-lakeside', kind: 'bg', icon: '🏞️',
    namePt: 'Beira do Lago', nameEn: 'Lakeside',
    descPt: 'Juncos, lago parado e o sol se pondo atrás dos montes', descEn: 'Reeds, a still lake and the sun setting behind the hills', price: 160 },
  { id: 'bg-crystal-grove', kind: 'bg', icon: '💎',
    namePt: 'Bosque de Cristal', nameEn: 'Crystal Grove',
    descPt: 'Arcos de pedra, cristais e duas luas no vale', descEn: 'Stone arches, crystals and two moons over the valley', price: 200 },
  { id: 'bg-ember-cavern', kind: 'bg', icon: '🔥',
    namePt: 'Caverna das Brasas', nameEn: 'Ember Cavern',
    descPt: 'Cascatas de brasa numa gruta de cristal', descEn: 'Ember falls inside a crystal grotto', price: 220 },
  { id: 'bg-night-greenhouse', kind: 'bg', icon: '🌿',
    namePt: 'Estufa Noturna', nameEn: 'Night Greenhouse',
    descPt: 'Colunas de vidro, samambaias e flores acesas', descEn: 'Glass pillars, ferns and glowing flowers', price: 200 },
  { id: 'bg-cozy-loft', kind: 'bg', icon: '🪟',
    namePt: 'Sótão Aconchegante', nameEn: 'Cozy Loft',
    descPt: 'Janela redonda, ervas secando e um tapete macio', descEn: 'A round window, drying herbs and a soft rug', price: 180 },
  { id: 'bg-cloud-terrace', kind: 'bg', icon: '🌅',
    namePt: 'Terraço das Nuvens', nameEn: 'Cloud Terrace',
    descPt: 'Um mirante sobre o mar de nuvens e ilhas no céu', descEn: 'A lookout over the cloud sea and floating isles', price: 240 },
  // Mission-gated backdrops — visible from day one, locked behind achievements
  // (utils/missions.ts). Completing the mission unlocks the PURCHASE.
  { id: 'bg-mission-filecity', kind: 'bg', icon: '🏘️',
    namePt: 'Cidade do Arquivo', nameEn: 'Archive City',
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
  { id: 'bg-mission-chuva', kind: 'bg', icon: '🌧️',
    namePt: 'Chuva das Almas', nameEn: 'Soul Rain',
    descPt: 'Chuva de luz sob as pedras antigas', descEn: 'Soft light rain over the ancient stones', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-barrage-1000' } },
  { id: 'bg-mission-meada', kind: 'bg', icon: '🧵',
    namePt: 'Fio da Meada', nameEn: 'Thread Trail',
    descPt: 'Trilhas de fios dourados entre as raízes', descEn: 'Golden threads winding through the roots', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-zip-10' } },
  { id: 'bg-mission-colcha', kind: 'bg', icon: '🧶',
    namePt: 'Colcha de Retalhos', nameEn: 'Patchwork Quilt',
    descPt: 'Retalhos de luz costurados no chão', descEn: 'Patches of light stitched into the ground', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-patches-10' } },
  { id: 'bg-mission-corrida', kind: 'bg', icon: '⚡',
    namePt: 'Pista da Corrida', nameEn: 'Obstacle Track',
    descPt: 'Trilha veloz sob um céu de tempestade', descEn: 'A fast track under a stormy sky', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-dino-normal-500' } },
  { id: 'bg-mission-campo', kind: 'bg', icon: '💨',
    namePt: 'Campo de Força', nameEn: 'Force Field',
    descPt: 'Obstáculos desfeitos sob um escudo de luz', descEn: 'Obstacles broken under a light shield', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-dino-dash-30' } },
  { id: 'bg-mission-mao', kind: 'bg', icon: '✂️',
    namePt: 'Mão de Mestre', nameEn: 'Steady Hand',
    descPt: 'Mesa de pedra com marcas de vitória', descEn: 'Stone table marked with victories', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-ppt-normal-5' } },
  { id: 'bg-mission-andares', kind: 'bg', icon: '🕯️',
    namePt: 'Primeiros Andares', nameEn: 'First Floors',
    descPt: 'Escadas de pedra iluminadas por velas', descEn: 'Stone stairs lit by candles', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-rogue-floors-3' } },
  { id: 'bg-mission-fundo', kind: 'bg', icon: '🗝️',
    namePt: 'Fundo do Calabouço', nameEn: 'Deep Dungeon',
    descPt: 'O coração escuro da masmorra', descEn: 'The dark heart of the dungeon', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-rogue-floors-15' } },
  { id: 'bg-mission-habitante', kind: 'bg', icon: '🌀',
    namePt: 'Habitante da Fenda', nameEn: 'Rift Dweller',
    descPt: 'Ruínas que se formam ao redor da fenda', descEn: 'Ruins forming around the rift', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-rift-runs-15' } },
  { id: 'bg-mission-guardiao', kind: 'bg', icon: '🛡️',
    namePt: 'Guardião da Fenda', nameEn: 'Rift Warden',
    descPt: 'Portal guardado por pedras antigas', descEn: 'A portal guarded by ancient stones', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-rift-kills-500' } },
  { id: 'bg-mission-cliente', kind: 'bg', icon: '🏪',
    namePt: 'Cliente do Clã', nameEn: 'Clan Regular',
    descPt: 'Banca de mercado sob lanternas', descEn: 'A market stall under lanterns', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-clan-shop-3' } },
  { id: 'bg-mission-traco', kind: 'bg', icon: '🎨',
    namePt: 'Outro Traço', nameEn: 'Another Stroke',
    descPt: 'Ateliê de cores e pincéis', descEn: 'A studio of colors and brushes', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-regen-1' } },
  { id: 'bg-mission-espaco', kind: 'bg', icon: '🧭',
    namePt: 'Espaço Preparado', nameEn: 'Space Ready',
    descPt: 'Clareira organizada para o foco', descEn: 'A clearing set up for focus', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-focus-prepared-10' } },
  { id: 'bg-mission-ouro', kind: 'bg', icon: '🏅',
    namePt: 'Faixa de Ouro', nameEn: 'Gold Band',
    descPt: 'Pódio dourado sob céu de fim de tarde', descEn: 'Golden podium under an evening sky', price: 300,
    unlock: { kind: 'mission', missionId: 'mission-rank-gold' } },

];

/**
 * Itens do TORNEIO — comprados só com Emblemas.
 *
 * Ficam numa lista à parte (e numa aba própria) porque a regra é justamente
 * que as moedas não se misturam: quem joga minijogo não chega aqui, e quem
 * ganha no torneio não usa Emblema na loja comum.
 *
 * REGRA QUE NÃO PODE CAIR: tudo aqui é COSMÉTICO (`bg` ou `furniture`).
 * Emblemas moram no save do cliente, como os Bits — quem editar o
 * localStorage se dá quantos quiser. Isso é aceitável enquanto a aba só
 * vende enfeite; no dia em que um item de torneio der vantagem de jogo,
 * os Emblemas têm que ir para o servidor junto dos Créditos (ver
 * functions/api/_entitlements.js). Há teste travando isso.
 *
 * Escada de preços pensada para 3 Emblemas por vitória: o primeiro item sai
 * em ~5 vitórias e o último em ~23.
 */
export const TOURNAMENT_ITEMS: ShopItem[] = [
  // As duas peças mais baratas da aba, e é de propósito: o espaço da vitrine é
  // território de Emblemas (há teste travando — abri-lo pra Bits esvaziaria o
  // sentido de ganhar troféu), mas até aqui a entrada custava 25, o que deixava
  // quem tinha jogado poucas partidas com a área reservada e vazia. Um caixote
  // por 8 Emblemas é ~3 partidas.
  { id: 'furn-crate', kind: 'furniture', icon: '📦', currency: 'emblems',
    slot: 'trophy', fits: 'any',
    namePt: 'Caixote de Madeira', nameEn: 'Wooden Crate',
    descPt: 'Vitrine — exibe os troféus que você ganhou de verdade', descEn: 'Display case — shows the trophies you actually won',
    price: 8 },
  { id: 'furn-shelf-simple', kind: 'furniture', icon: '🗄️', currency: 'emblems',
    slot: 'trophy', fits: 'any',
    namePt: 'Prateleira Simples', nameEn: 'Simple Shelf',
    descPt: 'Vitrine — exibe os troféus que você ganhou de verdade', descEn: 'Display case — shows the trophies you actually won',
    price: 12 },
  { id: 'furniture-champion-banner', kind: 'furniture', icon: '🎌', currency: 'emblems',
    slot: 'wall', fits: 'any',
    namePt: 'Estandarte do Campeão', nameEn: "Champion's Banner",
    descPt: 'Pendurado acima do pet, em qualquer cenário', descEn: 'Hangs above the pet, in any scene',
    price: 15 },
  { id: 'furniture-medal-wall', kind: 'furniture', icon: '🏅', currency: 'emblems',
    slot: 'wall', fits: 'any',
    namePt: 'Mural de Medalhas', nameEn: 'Medal Wall',
    descPt: 'Uma medalha para cada luta que valeu a pena', descEn: 'One medal for every fight worth having',
    price: 20 },
  { id: 'furniture-trophy-shelf', kind: 'furniture', icon: '🏆', currency: 'emblems',
    slot: 'trophy', fits: 'any',
    namePt: 'Estante de Troféus', nameEn: 'Trophy Shelf',
    descPt: 'Vitrine — exibe os troféus que você ganhou de verdade', descEn: 'Display case — shows the trophies you actually won',
    price: 25 },
  { id: 'bg-arena-champion', kind: 'bg', icon: '🏟️', currency: 'emblems',
    namePt: 'Arena dos Campeões', nameEn: "Champions' Arena",
    descPt: 'O cenário de quem já subiu ao pódio', descEn: 'The backdrop of those who reached the podium',
    price: 40 },
  { id: 'furniture-podium', kind: 'furniture', icon: '🥇', currency: 'emblems',
    slot: 'trophy', fits: 'any',
    namePt: 'Pódio', nameEn: 'Podium',
    descPt: 'Vitrine — exibe os troféus que você ganhou de verdade', descEn: 'Display case — shows the trophies you actually won',
    price: 55 },
  { id: 'bg-arena-spotlight', kind: 'bg', icon: '🌟', currency: 'emblems',
    namePt: 'Arena sob Holofotes', nameEn: 'Spotlight Arena',
    descPt: 'A luta principal da noite — e o pet é a atração', descEn: 'The main event of the night — and the pet is the draw',
    price: 70 },
];

/**
 * Catálogo inteiro (loja comum + torneio). Use SEMPRE isto para RESOLVER um
 * item por id — procurar só em SHOP_ITEMS faz o item de torneio comprado
 * sumir na hora de renderizar (aconteceu com a mobília do torneio, que era
 * comprável e equipável mas não aparecia no box do pet).
 */
/**
 * ITENS DE CONQUISTA DA GUILDA (`docs/PLANO-GUILDA.md` §3 "Recompensas", WPG-10).
 * NUNCA à venda: sem preço, fora de `SHOP_ITEMS`/`TOURNAMENT_ITEMS` (logo, fora de
 * toda vitrine — `mercadoCatalog.stallItems`), e travados por uma `unlock` de
 * missão que NÃO existe em `MISSIONS` (`isShopItemUnlocked` → `false` para sempre),
 * então nem uma chamada direta a `handleShopBuy` os compra. O único caminho é o
 * resgate da Feira (`guildClaim` → `trophyId`), que os põe em `ownedFurniture`.
 * Entram em `ALL_SHOP_ITEMS` para o palco resolver o id e a folha "da sua roda"
 * (`components/mercado/GuildOwnedShelf.tsx`) poder equipá-los.
 *
 * Concha da Maré (`trophy-concha-mare`): a maré deixa uma concha no Bosque a cada
 * `RAID_TROPHY_EVERY` Feiras dissipadas — nomeia o ATO da roda, nunca uma pessoa.
 * Arte: placeholder em SVG (`decorArt.ts`); a leva de arte troca por
 * `assets/decor/trophy-concha-mare.png` (384², slot `trophy`).
 */
export const GUILD_SHELL_UNLOCK_MISSION = 'guild-tide-shell';
export const GUILD_ITEMS: ShopItem[] = [
  { id: 'trophy-concha-mare', kind: 'furniture', icon: '🐚', slot: 'trophy', fits: 'any',
    // Nome e descrição vêm da copy da Guilda (dono único, `guildCopyCore.ts`): nenhum literal duplicado (L3-copy).
    namePt: GUILD_COPY_CORE['guild.concha.nome'][0], nameEn: GUILD_COPY_CORE['guild.concha.nome'][1],
    descPt: GUILD_COPY_CORE['guild.concha.desc'][0], descEn: GUILD_COPY_CORE['guild.concha.desc'][1],
    price: 0,
    unlock: { kind: 'mission', missionId: GUILD_SHELL_UNLOCK_MISSION } },
];

/** É uma conquista da Guilda? Nunca comprável, venha de onde vier. */
export const isGuildReward = (item: Pick<ShopItem, 'id'>): boolean => GUILD_ITEMS.some(g => g.id === item.id);

/**
 * CONJUNTO COSMÉTICO DO TRIMESTRE da assinatura (`docs/ASSINATURA-SPEC.md`, D10).
 *
 * REGRAS QUE NÃO PODEM CAIR (há teste travando cada uma):
 *  · só `bg` e `furniture` — cosmético, como a aba Torneio;
 *  · NUNCA em `SHOP_ITEMS`/`TOURNAMENT_ITEMS` com preço (anti double-dip: o mesmo
 *    item não se vende em duas portas). `price` aqui é 0 e a única porta é o
 *    RESGATE (`applySubscriptionClaim`), liberado por `unlock.kind === 'subscription'`;
 *  · resgatou, é posse permanente: nada retira o item de `ownedBackgrounds`/
 *    `ownedFurniture` quando a assinatura acaba;
 *  · nada de Créditos, de cuidado, de atributo. Só enfeite.
 *
 * Arte: por ora REUSA a de cenários/decorações existentes (`artAliases.ts`,
 * alias de id com outro nome); a leva de arte própria troca o alias por PNG.
 */
export const SUBSCRIPTION_QUARTER = '2026-Q4';
const SUB_UNLOCK: UnlockReq = { kind: 'subscription', quarter: SUBSCRIPTION_QUARTER };
export const SUBSCRIPTION_ITEMS: ShopItem[] = [
  { id: 'bg-sub-2026q4-lago', kind: 'bg', icon: '🏮',
    namePt: 'Lago das Lanternas', nameEn: 'Lantern Lake',
    descPt: 'Do trimestre — um lago ao entardecer, com lanternas na margem', descEn: 'Of the quarter — a lake at dusk, lanterns along the shore',
    price: 0, unlock: SUB_UNLOCK },
  { id: 'bg-sub-2026q4-loft', kind: 'bg', icon: '🪟',
    namePt: 'Sótão da Lareira', nameEn: 'Hearth Loft',
    descPt: 'Do trimestre — um sótão quentinho para a época mais fria', descEn: 'Of the quarter — a warm loft for the coldest season',
    price: 0, unlock: SUB_UNLOCK },
  { id: 'furn-sub-2026q4-lanterna', kind: 'furniture', icon: '🏮',
    slot: 'floor-right', fits: 'any',
    namePt: 'Lanterna da Estação', nameEn: 'Season Lantern',
    descPt: 'Do trimestre — ocupa o canto direito, combina com qualquer cenário', descEn: 'Of the quarter — takes the right corner, fits any scene',
    price: 0, unlock: SUB_UNLOCK },
  { id: 'furn-sub-2026q4-guirlanda', kind: 'furniture', icon: '🎏',
    slot: 'wall', fits: 'any',
    namePt: 'Guirlanda do Trimestre', nameEn: 'Quarter Garland',
    descPt: 'Do trimestre — pendurada acima do pet, em qualquer cenário', descEn: 'Of the quarter — hangs above the pet, in any scene',
    price: 0, unlock: SUB_UNLOCK },
  { id: 'furn-sub-2026q4-sino', kind: 'furniture', icon: '🎐',
    slot: 'wall', fits: 'any',
    namePt: 'Sino de Vento da Estação', nameEn: 'Season Wind Chime',
    descPt: 'Do trimestre — pendurado acima do pet, em qualquer cenário', descEn: 'Of the quarter — hangs above the pet, in any scene',
    price: 0, unlock: SUB_UNLOCK },
];

/** É item da assinatura? Nunca comprável com moeda, venha de onde vier. */
export const isSubscriptionReward = (item: Pick<ShopItem, 'id'>): boolean => SUBSCRIPTION_ITEMS.some(s => s.id === item.id);

export const ALL_SHOP_ITEMS: ShopItem[] = [...SHOP_ITEMS, ...TOURNAMENT_ITEMS, ...GUILD_ITEMS, ...SUBSCRIPTION_ITEMS];
