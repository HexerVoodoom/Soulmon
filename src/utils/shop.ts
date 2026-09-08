// 🛒 Shop catalog — bought with minigame points (gamePoints).
// Effects are applied in App.tsx (handleShopBuy); see docs/SHOP-PLAN.md.
import type { SlotId, DecorFit } from './petStage';

export type ShopItemKind = 'chip' | 'heart' | 'bg' | 'furniture' | 'emblem';

/** Moeda que compra o item. Ausente = Bits (o padrão da loja). */
export type ShopCurrency = 'bits' | 'emblems';
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
    descPt: 'Usar concede 1 dia completo (+1 ponto de evolução)', descEn: 'Use to gain 1 complete day (+1 evolution point)',
  },
  [CHIP_EMOJI.virus]: {
    emoji: CHIP_EMOJI.virus, kind: 'chip', attr: 'virus',
    namePt: 'Chip de Poder', nameEn: 'Power Chip',
    descPt: `Usar dá +${CHIP_BOOST} de Poder (não enche energia)`, descEn: `Use for +${CHIP_BOOST} Power (no energy)`,
  },
  [CHIP_EMOJI.data]: {
    emoji: CHIP_EMOJI.data, kind: 'chip', attr: 'data',
    namePt: 'Chip de Harmonia', nameEn: 'Harmony Chip',
    descPt: `Usar dá +${CHIP_BOOST} de Harmonia (não enche energia)`, descEn: `Use for +${CHIP_BOOST} Harmony (no energy)`,
  },
  [CHIP_EMOJI.vaccine]: {
    emoji: CHIP_EMOJI.vaccine, kind: 'chip', attr: 'vaccine',
    namePt: 'Chip de Benevolência', nameEn: 'Benevolence Chip',
    descPt: `Usar dá +${CHIP_BOOST} de Benevolência (não enche energia)`, descEn: `Use for +${CHIP_BOOST} Benevolence (no energy)`,
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
  // raise the attribute, no energy). They steer the evolution branch. Nomes
  // e ícones seguem os 3 atributos do oráculo (ver EvolutionPath.tsx /
  // AlignmentIcons.tsx) — Poder/Harmonia/Benevolência, não mais Vírus/Dado/Vacina.
  { id: 'chip-virus',   kind: 'chip', icon: CHIP_EMOJI.virus, attr: 'virus',
    namePt: 'Chip de Poder',  nameEn: 'Power Chip',
    descPt: `Vai pra pastinha; usar dá +${CHIP_BOOST} de Poder`, descEn: `Goes to Items; use for +${CHIP_BOOST} Power`, price: 120 },
  { id: 'chip-data',    kind: 'chip', icon: CHIP_EMOJI.data, attr: 'data',
    namePt: 'Chip de Harmonia',   nameEn: 'Harmony Chip',
    descPt: `Vai pra pastinha; usar dá +${CHIP_BOOST} de Harmonia`, descEn: `Goes to Items; use for +${CHIP_BOOST} Harmony`, price: 120 },
  { id: 'chip-vaccine', kind: 'chip', icon: CHIP_EMOJI.vaccine, attr: 'vaccine',
    namePt: 'Chip de Benevolência', nameEn: 'Benevolence Chip',
    descPt: `Vai pra pastinha; usar dá +${CHIP_BOOST} de Benevolência`, descEn: `Goes to Items; use for +${CHIP_BOOST} Benevolence`, price: 120 },
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
export const ALL_SHOP_ITEMS: ShopItem[] = [...SHOP_ITEMS, ...TOURNAMENT_ITEMS];
