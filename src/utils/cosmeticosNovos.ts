// ---------------------------------------------------------------------------
// COSMÉTICOS NOVOS — temas e elementos (lote de 04/11/2026, dono: "mais variedade de cor").
//
// Catálogo ÚNICO das 108 peças planejadas em `docs/ASSETS-A-GERAR.md` (32 cenários, 32 molduras,
// 44 decorações). Cada peça só ENTRA NO JOGO quando o arquivo de arte existe — a arte é a porta:
//   · cenário   `assets/backgrounds/<id>.webp` (+ miniatura `thumbs/<id>.png`)
//   · moldura   `assets/soulmon/molduras/<id>.png`
//   · decoração `assets/decor/<id>.webp`
// Para instalar as peças que faltam: gerar a imagem, rodar `node scripts/instalar-cosmeticos.mjs`
// (converte de E:/Soulmon-assets/cosmeticos/) e pronto — nenhum outro arquivo de código muda. Peça
// sem arte não aparece na loja, não entra no mapa de arte e não pesa nos contratos.
//
// Regras herdadas: cosmético puro (não toca economia); exclusivo de elemento (`element`) só aparece
// à venda para Soulmon desse elemento e a posse é permanente (`utils/elementExclusive.ts`).
// ---------------------------------------------------------------------------
import type { SlotId, DecorFit } from './petStage';
import { COSMETICOS_NOVOS_CORES } from './cosmeticosNovosCores';

export type CosmeticoKind = 'bg' | 'frame' | 'furn';

interface Tema { id: string; pt: string; en: string; icon: string; bg: number; frame: number }
const TEMAS: Record<string, Tema> = {
  lava: { id: 'lava', pt: 'Lava', en: 'Lava', icon: '🌋', bg: 660, frame: 900 },
  cerejeira: { id: 'cerejeira', pt: 'Cerejeira', en: 'Cherry blossom', icon: '🌸', bg: 600, frame: 900 },
  mar: { id: 'mar', pt: 'Mar profundo', en: 'Deep sea', icon: '🌊', bg: 720, frame: 900 },
  neve: { id: 'neve', pt: 'Neve', en: 'Snow', icon: '❄️', bg: 600, frame: 900 },
  jardim: { id: 'jardim', pt: 'Jardim florido', en: 'Flower garden', icon: '🌷', bg: 600, frame: 900 },
  ruinas: { id: 'ruinas', pt: 'Ruínas', en: 'Ruins', icon: '🏚️', bg: 660, frame: 900 },
};
/** Tema pelo 2º trecho do id (`bg-mar-profundo-...` → `mar`). */
const temaDe = (id: string): Tema => TEMAS[id.split('-')[1]];

/** Elemento → [nome PT, nome EN, emoji]. As chaves são os ids de elemento do jogo (`ClassElementId`). */
const ELEMENTOS: Record<string, readonly [string, string, string]> = {
  fogo: ['Fogo', 'Fire', '🔥'], agua: ['Água', 'Water', '💧'], terra: ['Terra', 'Earth', '⛰️'], ar: ['Ar', 'Air', '💨'],
  eletricidade: ['Eletricidade', 'Electricity', '⚡'], arcano: ['Arcano', 'Arcane', '🔮'], sombra: ['Sombra', 'Shadow', '🌑'],
  luz: ['Luz', 'Light', '☀️'], vileza: ['Vileza', 'Vileness', '☠️'], morte: ['Morte', 'Death', '⚰️'], vida: ['Vida', 'Life', '🌱'],
  vigor: ['Vigor', 'Vigor', '💪'], marcial: ['Marcial', 'Martial', '🥋'], tempo: ['Tempo', 'Time', '⏳'], som: ['Som', 'Sound', '🔔'],
  gravidade: ['Gravidade', 'Gravity', '⚫'], espaco: ['Espaço', 'Space', '🌌'], fada: ['Fada', 'Fairy', '🧚'],
  industrial: ['Industrial', 'Industrial', '🏭'], planta: ['Planta', 'Plant', '🌿'],
};

/** Decoração (PT, EN) por id. Os `furn-el-*` são a peça de cada elemento. */
const NOMES_FURN: Record<string, readonly [string, string]> = {
  'furn-lava-altar-de-magma': ['Altar de Magma', 'Magma Altar'], 'furn-lava-flor-de-brasa': ['Flor de Brasa', 'Ember Flower'],
  'furn-lava-chao-de-basalto': ['Chão de Basalto', 'Basalt Floor'], 'furn-lava-estandarte-de-cinza': ['Estandarte de Cinza', 'Ash Banner'],
  'furn-cerejeira-cerejeira-ana': ['Cerejeira Anã', 'Dwarf Cherry Tree'], 'furn-cerejeira-lanterna-de-petalas': ['Lanterna de Pétalas', 'Petal Lantern'],
  'furn-cerejeira-tapete-de-petalas': ['Tapete de Pétalas', 'Petal Carpet'], 'furn-cerejeira-galho-pendente': ['Galho Pendente', 'Hanging Branch'],
  'furn-mar-profundo-anemona-gigante': ['Anêmona Gigante', 'Giant Anemone'], 'furn-mar-profundo-concha-perolada': ['Concha Perolada', 'Pearl Shell'],
  'furn-mar-profundo-areia-abissal': ['Areia Abissal', 'Abyssal Sand'], 'furn-mar-profundo-agua-viva-pendente': ['Água-viva Pendente', 'Hanging Jellyfish'],
  'furn-neve-pinheiro-nevado': ['Pinheiro Nevado', 'Snowy Pine'], 'furn-neve-boneco-de-gelo': ['Boneco de Gelo', 'Ice Golem'],
  'furn-neve-neve-fofa': ['Neve Fofa', 'Soft Snow'], 'furn-neve-pingentes-de-gelo': ['Pingentes de Gelo', 'Icicles'],
  'furn-jardim-arco-de-flores': ['Arco de Flores', 'Flower Arch'], 'furn-jardim-regador-encantado': ['Regador Encantado', 'Enchanted Watering Can'],
  'furn-jardim-canteiro-redondo': ['Canteiro Redondo', 'Round Flowerbed'], 'furn-jardim-vaso-suspenso': ['Vaso Suspenso', 'Hanging Basket'],
  'furn-ruinas-carro-engolido': ['Carro Engolido', 'Overgrown Car'], 'furn-ruinas-placa-torta': ['Placa Torta', 'Bent Sign'],
  'furn-ruinas-asfalto-rachado': ['Asfalto Rachado', 'Cracked Asphalt'], 'furn-ruinas-fiacao-com-musgo': ['Fiação com Musgo', 'Mossy Wiring'],
  'furn-el-fogo': ['Braseiro Eterno', 'Eternal Brazier'], 'furn-el-agua': ['Bacia de Água', 'Water Basin'],
  'furn-el-terra': ['Pedras em Equilíbrio', 'Balanced Stones'], 'furn-el-ar': ['Cata-vento de Penas', 'Feather Pinwheel'],
  'furn-el-eletricidade': ['Haste de Cristal', 'Crystal Rod'], 'furn-el-arcano': ['Grimório Flutuante', 'Floating Grimoire'],
  'furn-el-sombra': ['Espelho Escuro', 'Dark Mirror'], 'furn-el-luz': ['Orbe de Sol', 'Sun Orb'],
  'furn-el-vileza': ['Cálice Rachado', 'Cracked Goblet'], 'furn-el-morte': ['Lápide com Flor', 'Gravestone with Flower'],
  'furn-el-vida': ['Broto no Berço de Raízes', 'Seedling Cradle'], 'furn-el-vigor': ['Pedra de Treino', 'Training Stone'],
  'furn-el-marcial': ['Boneco de Treino', 'Training Dummy'], 'furn-el-tempo': ['Relógio de Sol', 'Sundial'],
  'furn-el-som': ['Sino de Cristal', 'Crystal Bell'], 'furn-el-gravidade': ['Rocha Flutuante', 'Floating Boulder'],
  'furn-el-espaco': ['Planeta em Miniatura', 'Miniature Planet'], 'furn-el-fada': ['Casinha de Cogumelo', 'Mushroom Cottage'],
  'furn-el-industrial': ['Cabeça de Autômato', 'Automaton Head'], 'furn-el-planta': ['Planta Carnívora Calma', 'Calm Carnivorous Plant'],
};

/** Cenários temáticos: [nome PT, nome EN, descrição PT, descrição EN]. Os `bg-el-*` seguem `BG_EL_DESC`. */
const NOMES_BG: Record<string, readonly [string, string, string, string]> = {
  'bg-lava-caldeira-viva': ['Caldeira Viva', 'Living Caldera', 'Rios de lava entre colunas de basalto, de noite', 'Lava rivers between basalt columns, at night'],
  'bg-lava-jardim-de-cinzas': ['Jardim de Cinzas', 'Ash Garden', 'Flores de brasa nascendo da lava fria', 'Ember flowers growing from cooled lava'],
  'bg-cerejeira-bosque-de-cerejeiras': ['Bosque de Cerejeiras', 'Cherry Grove', 'Pétalas ao vento e lanternas de espírito ao entardecer', 'Drifting petals and spirit lanterns at dusk'],
  'bg-cerejeira-templo-das-petalas': ['Templo das Pétalas', 'Petal Shrine', 'Um santuário quieto sob uma cerejeira enorme', 'A quiet shrine under a huge sakura'],
  'bg-mar-profundo-fossa-abissal': ['Fossa Abissal', 'Abyssal Trench', 'O fundo do mar, escuro e cheio de luzes vivas', 'The dark deep sea, full of living lights'],
  'bg-mar-profundo-recife-de-luz': ['Recife de Luz', 'Reef of Light', 'Coral aceso e águas-vivas à deriva', 'Glowing coral and drifting jellyfish'],
  'bg-neve-tundra-aurora': ['Tundra da Aurora', 'Aurora Tundra', 'Neve a perder de vista sob a aurora', 'Endless snow under the aurora'],
  'bg-neve-lago-congelado': ['Lago Congelado', 'Frozen Lake', 'Gelo azul e pinheiros nevados', 'Blue ice and snowy pines'],
  'bg-jardim-campina-em-flor': ['Campina em Flor', 'Blooming Meadow', 'Um campo de flores de todas as cores', 'A meadow of flowers in every colour'],
  'bg-jardim-jardim-suspenso': ['Jardim Suspenso', 'Hanging Garden', 'Terraços floridos pendurados no ar', 'Flowering terraces hanging in the air'],
  'bg-ruinas-cidade-engolida': ['Cidade Engolida', 'Swallowed City', 'Prédios tomados por musgo e flores', 'Buildings taken over by moss and flowers'],
  'bg-ruinas-metro-esquecido': ['Metrô Esquecido', 'Forgotten Subway', 'Túneis antigos com fungos acesos', 'Old tunnels with glowing fungi'],
};
const BG_EL_DESC: Record<string, readonly [string, string]> = {
  fogo: ['Uma forja de chama viva numa gruta de pedra', 'A forge of living flame in a stone hollow'],
  agua: ['Gruta de cachoeira com luz ondulando', 'A waterfall grotto with rippling light'],
  terra: ['Cânion de pedra em camadas e raízes gigantes', 'A canyon of layered stone and giant roots'],
  ar: ['Picos acima das nuvens, com fitas de vento', 'Peaks above the clouds with wind ribbons'],
  eletricidade: ['Platô de tempestade com raios entre torres de cristal', 'A storm plateau with lightning between crystal spires'],
  arcano: ['Biblioteca flutuante de runas e glifos em órbita', 'A floating library of runes and orbiting glyphs'],
  sombra: ['Floresta sem lua, com fiapos de sombra à deriva', 'A moonless forest with drifting shadow wisps'],
  luz: ['Santuário de mármore com feixes de luz dourada', 'A marble sanctuary with shafts of golden light'],
  vileza: ['Pântano envenenado com ídolos de espinhos', 'A poisoned marsh with thorny idols'],
  morte: ['Jardim quieto com flores pálidas entre pedras velhas', 'A quiet garden of pale flowers among old stones'],
  vida: ['Uma nascente sagrada onde uma grande árvore floresce', 'A sacred spring where a great tree blooms'],
  vigor: ['Terraço de treino ao nascer do sol', 'A sunrise training terrace on the mountain'],
  marcial: ['Pátio de dojo antigo com folhas caídas', 'An old dojo courtyard with fallen leaves'],
  tempo: ['Deserto de areia flutuante sob duas luas', 'A desert of floating sand under twin moons'],
  som: ['Vale de tubos de cristal que ressoam', 'A valley of giant resonating crystal pipes'],
  gravidade: ['Campo de rochas flutuantes em torno de uma esfera escura', 'A field of levitating boulders around a dark sphere'],
  espaco: ['Plataforma cósmica entre nebulosas e planetas', 'A cosmic platform among nebulae and planets'],
  fada: ['Círculo de cogumelos acesos numa clareira ao crepúsculo', 'A fairy circle of glowing mushrooms at twilight'],
  industrial: ['Fundição antiga de cobre e cristal, a natureza voltando', 'An ancient foundry of copper and crystal, nature growing back'],
  planta: ['Copa de selva com folhas gigantes e luz verde', 'A jungle canopy with giant leaves and green light'],
};

const NOMES_FRAME: Record<string, readonly [string, string]> = {
  'frame-lava-basalto-rachado': ['Basalto Rachado', 'Cracked Basalt'], 'frame-lava-coroa-de-brasas': ['Coroa de Brasas', 'Ember Crown'],
  'frame-cerejeira-galhos-em-flor': ['Galhos em Flor', 'Blooming Branches'], 'frame-cerejeira-petalas-em-espiral': ['Pétalas em Espiral', 'Petal Spiral'],
  'frame-mar-profundo-coral-e-concha': ['Coral e Concha', 'Coral and Shell'], 'frame-mar-profundo-tentaculos-de-luz': ['Tentáculos de Luz', 'Tentacles of Light'],
  'frame-neve-geada-cristalina': ['Geada Cristalina', 'Crystal Frost'], 'frame-neve-coroa-de-pinheiro': ['Coroa de Pinheiro', 'Pine Crown'],
  'frame-jardim-guirlanda-silvestre': ['Guirlanda Silvestre', 'Wild Garland'], 'frame-jardim-hera-e-margaridas': ['Hera e Margaridas', 'Ivy and Daisies'],
  'frame-ruinas-concreto-e-vergalhao': ['Concreto e Vergalhão', 'Concrete and Rebar'], 'frame-ruinas-sucata-florida': ['Sucata Florida', 'Flowering Scrap'],
};

/** Caixa-contrato do slot (utils/petStage.ts) e faixa de preço (utils/decorPrices.ts: price = 100 × tier). */
const SLOT_FURN: Record<string, { slot: SlotId; w: number; h: number; tier: 2 | 3 | 5 }> = {
  'floor-left': { slot: 'floor-left', w: 56, h: 56, tier: 3 },
  'floor-right': { slot: 'floor-right', w: 48, h: 52, tier: 3 },
  rug: { slot: 'rug', w: 104, h: 16, tier: 2 },
  wall: { slot: 'wall', w: 56, h: 40, tier: 3 },
};
const ORDEM_EL = Object.keys(ELEMENTOS);

/**
 * Elementos DERIVADOS com cenário próprio na loja (15/11/2026, REGISTRO §408): mesmo padrão dos `bg-el-*` dos 20 base
 * (exclusivo do elemento, 720 moedas), mas o id é o do par. `petHasElement` casa o id exato, então só Soulmon de
 * Queimada (planta+fogo) vê este cenário à venda.
 */
const BG_EL_DERIVADOS: Record<string, readonly [string, string, string, string, string]> = {
  queimada: ['Queimada', 'Wildfire', '🔥', 'Vulcão em brasa, flores de lava e uma árvore em chamas', 'A glowing volcano, lava blossoms and a burning tree'],
};

export interface CosmeticoNovo {
  id: string;
  kind: CosmeticoKind;
  icon: string;
  namePt: string; nameEn: string;
  descPt: string; descEn: string;
  price: number;
  /** Exclusivo de elemento (`utils/elementExclusive.ts`). */
  element?: string;
  /** Só `furn`. */
  slot?: SlotId;
  fits?: DecorFit;
  /** Só `furn`: faixa de preço (`100 × tier`). */
  tier?: 2 | 3 | 5;
  /** Só `furn`: caixa-contrato (px) do slot — a arte instalada é a caixa × `DECOR_ART_SCALE`. */
  box?: { w: number; h: number };
  /** Só `bg`: cor de base atrás da pintura (média dos 32 px de baixo; gerada pelo instalador). */
  baseColor?: string;
}

/** Arte de decoração é a caixa-contrato × 3 (× 2 no tapete), como a das 33 peças anteriores. */
export const DECOR_ART_SCALE = (slot: SlotId): number => (slot === 'rug' ? 2 : 3);

function build(): CosmeticoNovo[] {
  const out: CosmeticoNovo[] = [];
  for (const [id, [pt, en, dPt, dEn]] of Object.entries(NOMES_BG)) {
    out.push({ id, kind: 'bg', icon: temaDe(id).icon, namePt: pt, nameEn: en, descPt: dPt, descEn: dEn, price: temaDe(id).bg });
  }
  for (const [id, [pt, en]] of Object.entries(NOMES_FRAME)) {
    const t = temaDe(id);
    out.push({ id, kind: 'frame', icon: t.icon, namePt: pt, nameEn: en, descPt: `Moldura do tema ${t.pt}`, descEn: `${t.en} themed frame`, price: t.frame });
  }
  for (const [el, [pt, en, icon]] of Object.entries(ELEMENTOS)) {
    const [dPt, dEn] = BG_EL_DESC[el];
    out.push({ id: `bg-el-${el}`, kind: 'bg', icon, namePt: `Domínio de ${pt}`, nameEn: `${en} Realm`, descPt: dPt, descEn: dEn, price: 720, element: el });
    out.push({ id: `frame-el-${el}`, kind: 'frame', icon, namePt: `Anel de ${pt}`, nameEn: `${en} Ring`, descPt: `Moldura exclusiva de ${pt}`, descEn: `${en}-exclusive frame`, price: 1200, element: el });
  }
  for (const [el, [pt, en, icon, dPt, dEn]] of Object.entries(BG_EL_DERIVADOS)) {
    out.push({ id: `bg-el-${el}`, kind: 'bg', icon, namePt: `Domínio de ${pt}`, nameEn: `${en} Realm`, descPt: dPt, descEn: dEn, price: 720, element: el });
  }
  const furn = (id: string, slotKey: string, icon: string, el?: string): CosmeticoNovo => {
    const s = SLOT_FURN[slotKey];
    const [pt, en] = NOMES_FURN[id];
    const lado = s.slot === 'floor-left' ? ['o canto esquerdo', 'the left corner']
      : s.slot === 'floor-right' ? ['o canto direito', 'the right corner']
      : s.slot === 'rug' ? ['o chão, no centro', 'the floor, centered'] : ['a parede ou o ar', 'the wall or the air'];
    const tier = el ? 5 : s.tier;
    return {
      id, kind: 'furn', icon, namePt: pt, nameEn: en,
      descPt: `Ocupa ${lado[0]} — combina com qualquer cenário`, descEn: `Takes ${lado[1]} — fits any scene`,
      price: 100 * tier, element: el, slot: s.slot, fits: 'any', tier, box: { w: s.w, h: s.h },
    };
  };
  for (const tema of Object.values(TEMAS)) {
    const ids = Object.keys(NOMES_FURN).filter(i => i.startsWith(`furn-${tema.id}-`));
    ['floor-left', 'floor-right', 'rug', 'wall'].forEach((sk, i) => { if (ids[i]) out.push(furn(ids[i], sk, tema.icon)); });
  }
  ORDEM_EL.forEach((el, i) => out.push(furn(`furn-el-${el}`, i % 2 === 0 ? 'floor-left' : 'floor-right', ELEMENTOS[el][2], el)));
  for (const c of out) if (c.kind === 'bg') c.baseColor = COSMETICOS_NOVOS_CORES[c.id];
  return out;
}

/** O catálogo inteiro planejado (inclui peça ainda sem arte). */
export const COSMETICOS_PLANEJADOS: readonly CosmeticoNovo[] = build();

const ARTE_BG = import.meta.glob('../assets/backgrounds/bg-*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const ARTE_DECOR = import.meta.glob('../assets/decor/furn-*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const ARTE_FRAME = import.meta.glob('../assets/soulmon/molduras/frame-*.png', { eager: false }) as Record<string, unknown>;

const idDe = (path: string): string => /\/([a-z0-9-]+)\.(?:webp|png)$/.exec(path)![1];
export const ARTE_BG_NOVOS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(ARTE_BG).map(([p, u]) => [idDe(p), u]));
export const ARTE_DECOR_NOVOS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(ARTE_DECOR).map(([p, u]) => [idDe(p), u]));
const ARTE_FRAME_IDS = new Set(Object.keys(ARTE_FRAME).map(idDe));

/** As peças com arte instalada — só estas existem para o jogo. */
export const COSMETICOS_NOVOS: readonly CosmeticoNovo[] = COSMETICOS_PLANEJADOS.filter(c =>
  c.kind === 'bg' ? !!ARTE_BG_NOVOS[c.id] : c.kind === 'furn' ? !!ARTE_DECOR_NOVOS[c.id] : ARTE_FRAME_IDS.has(c.id));
