// ============================================================================
// Oráculo de Criaturas — motor místico do DigiApp (feature provisória)
// ----------------------------------------------------------------------------
// A partir de nome completo + data + hora + local de nascimento, calcula:
//   1. Numerologia pitagórica (caminho de vida, expressão, motivação, impressão)
//   2. Zodíaco ocidental tropical (signo solar + ascendente APROXIMADO pela hora)
//   3. Horóscopo chinês (animal, elemento fixo, yin/yang — ano novo ~4 de fev.)
//   4. Horóscopo védico/indiano (rashi sideral, datas de sankranti)
// Desses dados, pontua 8 elementos (água/fogo/terra/ar/sombra/luz/planta/
// industrial) e 5 funções (suporte/tanque/dano físico/mágico/longo alcance),
// condensa tudo em um arquétipo (substantivo + 2 adjetivos) e gera uma criatura
// estilo v-pet com 4 estágios (criança/adulto/perfeito/mega), cada um com
// descrição PT/EN e prompt de imagem (sprite 8-bit) pronto para copiar.
//
// Determinismo: os mapas/pontuações dependem SÓ do input. A parte criativa
// (arquétipo, nome e detalhes da criatura) usa um RNG semeado por
// hash(input) XOR salt — mesmo salt = mesmo resultado; salt novo = variação.
// ============================================================================

export type ElementId =
  | 'agua' | 'fogo' | 'terra' | 'ar'
  | 'sombra' | 'luz' | 'planta' | 'industrial';

export type RoleId = 'suporte' | 'tanque' | 'fisico' | 'magico' | 'alcance';

export type StageId = 'crianca' | 'adulto' | 'perfeito' | 'mega';

/** Texto bilíngue (o app sempre exibe PT-BR e EN). */
export interface LText { pt: string; en: string }

export interface OracleInput {
  fullName: string;
  birthDate: string;  // 'YYYY-MM-DD'
  birthTime: string;  // 'HH:MM'
  birthPlace: string;
}

export interface NumerologyResult {
  lifePath: number;    // caminho de vida (data)
  expression: number;  // expressão/destino (todas as letras)
  soulUrge: number;    // motivação (vogais)
  personality: number; // impressão (consoantes)
  meanings: { lifePath: LText; expression: LText; soulUrge: LText; personality: LText };
}

export interface SignInfo {
  id: string;
  name: LText;
  element: ElementId;          // fogo/terra/ar/agua
  modality: 'cardinal' | 'fixo' | 'mutavel';
  traits: LText[];
}

export interface ChineseResult {
  animal: LText;
  animalEn: string;            // p/ prompts de imagem
  element: LText;              // Madeira/Fogo/Terra/Metal/Água
  yinYang: 'yin' | 'yang';
  traits: LText[];
}

export interface VedicResult {
  rashi: string;               // nome sânscrito
  equivalent: LText;           // signo equivalente ocidental
  element: ElementId;
  traits: LText[];
}

export interface ScoreEntry { source: LText; points: number }

export interface ArchetypeResult {
  noun: LText;
  nounEn: string;
  adjectives: [LText, LText];
  phrase: LText;               // "Fênix protetora e indomável"
}

export interface CreatureStage {
  stage: StageId;
  stageName: LText;
  name: string;                // nome da forma (ex.: "Pyrachi")
  description: LText;
  imagePrompt: string;         // EN — prompt pronto p/ gerador de imagem
}

export interface OracleResult {
  input: OracleInput;
  seed: number;                // salt usado — repassar para reproduzir
  numerology: NumerologyResult;
  western: { sun: SignInfo; ascendant: SignInfo };
  chinese: ChineseResult;
  vedic: VedicResult;
  elementScores: Record<ElementId, number>;
  elementBreakdown: Record<ElementId, ScoreEntry[]>;
  dominantElement: ElementId;
  secondaryElement: ElementId;
  roleScores: Record<RoleId, number>;
  roleBreakdown: Record<RoleId, ScoreEntry[]>;
  dominantRole: RoleId;
  personalitySummary: LText;
  archetype: ArchetypeResult;
  creature: { baseName: string; concept: LText; stages: CreatureStage[] };
}

// ---------------------------------------------------------------------------
// Utilidades: hash + RNG semeado
// ---------------------------------------------------------------------------

/** FNV-1a 32 bits — hash estável do input p/ semear o RNG. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — RNG determinístico pequeno. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

// ---------------------------------------------------------------------------
// 1. Numerologia pitagórica
// ---------------------------------------------------------------------------

const PYTHAGOREAN: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Remove acentos e tudo que não for A-Z. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

/** Reduz a um dígito, preservando números mestres 11/22/33. */
export function reduceNumber(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return n;
}

function sumLetters(name: string, filter?: (letter: string) => boolean): number {
  let total = 0;
  for (const ch of normalizeName(name)) {
    if (filter && !filter(ch)) continue;
    total += PYTHAGOREAN[ch] ?? 0;
  }
  return reduceNumber(total);
}

const NUMBER_MEANINGS: Record<number, LText> = {
  1: { pt: 'Pioneirismo, liderança e iniciativa — abre caminhos sozinho.', en: 'Pioneering spirit, leadership and initiative — opens paths alone.' },
  2: { pt: 'Diplomacia, sensibilidade e parceria — a força do cuidado.', en: 'Diplomacy, sensitivity and partnership — the strength of care.' },
  3: { pt: 'Criatividade, comunicação e alegria contagiante.', en: 'Creativity, communication and contagious joy.' },
  4: { pt: 'Estrutura, disciplina e construção sólida — alicerce de tudo.', en: 'Structure, discipline and solid building — the foundation of everything.' },
  5: { pt: 'Liberdade, movimento e sede de aventura.', en: 'Freedom, movement and thirst for adventure.' },
  6: { pt: 'Harmonia, proteção do lar e amor que nutre.', en: 'Harmony, protection of home and nurturing love.' },
  7: { pt: 'Mistério, introspecção e busca pelo oculto.', en: 'Mystery, introspection and the search for the hidden.' },
  8: { pt: 'Poder, ambição e domínio do mundo material.', en: 'Power, ambition and mastery of the material world.' },
  9: { pt: 'Compaixão universal, sabedoria e desapego.', en: 'Universal compassion, wisdom and detachment.' },
  11: { pt: 'Intuição elevada e inspiração — mestre visionário.', en: 'Heightened intuition and inspiration — visionary master.' },
  22: { pt: 'O construtor mestre — transforma sonhos em estruturas reais.', en: 'The master builder — turns dreams into real structures.' },
  33: { pt: 'O mestre curador — amor incondicional em ação.', en: 'The master healer — unconditional love in action.' },
};

export function computeNumerology(fullName: string, birthDate: string): NumerologyResult {
  const [y, m, d] = birthDate.split('-').map(Number);
  const lifePath = reduceNumber(reduceNumber(d) + reduceNumber(m) + reduceNumber(y));
  const expression = sumLetters(fullName);
  const soulUrge = sumLetters(fullName, ch => VOWELS.has(ch));
  const personality = sumLetters(fullName, ch => !VOWELS.has(ch));
  return {
    lifePath, expression, soulUrge, personality,
    meanings: {
      lifePath: NUMBER_MEANINGS[lifePath],
      expression: NUMBER_MEANINGS[expression],
      soulUrge: NUMBER_MEANINGS[soulUrge],
      personality: NUMBER_MEANINGS[personality],
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Zodíaco ocidental (tropical)
// ---------------------------------------------------------------------------

interface SignDef {
  id: string;
  name: LText;
  element: ElementId;
  modality: 'cardinal' | 'fixo' | 'mutavel';
  from: [number, number]; // [mês, dia] inclusivo
  traits: LText[];
}

// Ordem zodiacal começando em Áries; `from` é o início do signo.
const SIGNS: SignDef[] = [
  { id: 'aries', name: { pt: 'Áries', en: 'Aries' }, element: 'fogo', modality: 'cardinal', from: [3, 21], traits: [
    { pt: 'corajoso e direto', en: 'brave and direct' },
    { pt: 'impulsivo, primeiro a agir', en: 'impulsive, first to act' },
    { pt: 'competitivo por natureza', en: 'competitive by nature' },
  ] },
  { id: 'touro', name: { pt: 'Touro', en: 'Taurus' }, element: 'terra', modality: 'fixo', from: [4, 20], traits: [
    { pt: 'firme e persistente', en: 'steady and persistent' },
    { pt: 'protetor do que ama', en: 'protective of what it loves' },
    { pt: 'paciente, mas imovível quando decide', en: 'patient, yet immovable once decided' },
  ] },
  { id: 'gemeos', name: { pt: 'Gêmeos', en: 'Gemini' }, element: 'ar', modality: 'mutavel', from: [5, 21], traits: [
    { pt: 'curioso e comunicativo', en: 'curious and communicative' },
    { pt: 'mente rápida, mil ideias', en: 'quick mind, a thousand ideas' },
    { pt: 'versátil e brincalhão', en: 'versatile and playful' },
  ] },
  { id: 'cancer', name: { pt: 'Câncer', en: 'Cancer' }, element: 'agua', modality: 'cardinal', from: [6, 21], traits: [
    { pt: 'cuidador nato, memória afetiva', en: 'natural caretaker, emotional memory' },
    { pt: 'intuitivo e protetor', en: 'intuitive and protective' },
    { pt: 'sensível, casca dura por fora', en: 'sensitive, hard shell outside' },
  ] },
  { id: 'leao', name: { pt: 'Leão', en: 'Leo' }, element: 'fogo', modality: 'fixo', from: [7, 23], traits: [
    { pt: 'generoso e teatral', en: 'generous and theatrical' },
    { pt: 'lidera pelo carisma', en: 'leads through charisma' },
    { pt: 'coração quente, orgulho maior ainda', en: 'warm heart, even bigger pride' },
  ] },
  { id: 'virgem', name: { pt: 'Virgem', en: 'Virgo' }, element: 'terra', modality: 'mutavel', from: [8, 23], traits: [
    { pt: 'analítico e prestativo', en: 'analytical and helpful' },
    { pt: 'perfeccionista dos detalhes', en: 'perfectionist of details' },
    { pt: 'cura pelo cuidado prático', en: 'heals through practical care' },
  ] },
  { id: 'libra', name: { pt: 'Libra', en: 'Libra' }, element: 'ar', modality: 'cardinal', from: [9, 23], traits: [
    { pt: 'diplomata e harmonizador', en: 'diplomat and harmonizer' },
    { pt: 'senso estético apurado', en: 'refined aesthetic sense' },
    { pt: 'busca equilíbrio em tudo', en: 'seeks balance in everything' },
  ] },
  { id: 'escorpiao', name: { pt: 'Escorpião', en: 'Scorpio' }, element: 'agua', modality: 'fixo', from: [10, 23], traits: [
    { pt: 'intenso e magnético', en: 'intense and magnetic' },
    { pt: 'estrategista das profundezas', en: 'strategist of the depths' },
    { pt: 'renasce das próprias cinzas', en: 'reborn from its own ashes' },
  ] },
  { id: 'sagitario', name: { pt: 'Sagitário', en: 'Sagittarius' }, element: 'fogo', modality: 'mutavel', from: [11, 22], traits: [
    { pt: 'aventureiro e otimista', en: 'adventurous and optimistic' },
    { pt: 'flecha certeira em alvos distantes', en: 'sure arrow at distant targets' },
    { pt: 'filósofo viajante', en: 'traveling philosopher' },
  ] },
  { id: 'capricornio', name: { pt: 'Capricórnio', en: 'Capricorn' }, element: 'terra', modality: 'cardinal', from: [12, 22], traits: [
    { pt: 'ambicioso e resiliente', en: 'ambitious and resilient' },
    { pt: 'escala montanhas com paciência', en: 'climbs mountains with patience' },
    { pt: 'responsável e estratégico', en: 'responsible and strategic' },
  ] },
  { id: 'aquario', name: { pt: 'Aquário', en: 'Aquarius' }, element: 'ar', modality: 'fixo', from: [1, 20], traits: [
    { pt: 'visionário e original', en: 'visionary and original' },
    { pt: 'rebelde com causa coletiva', en: 'rebel with a collective cause' },
    { pt: 'mente de inventor', en: 'inventor\'s mind' },
  ] },
  { id: 'peixes', name: { pt: 'Peixes', en: 'Pisces' }, element: 'agua', modality: 'mutavel', from: [2, 19], traits: [
    { pt: 'sonhador e empático', en: 'dreamy and empathetic' },
    { pt: 'nada entre mundos', en: 'swims between worlds' },
    { pt: 'imaginação sem margens', en: 'boundless imagination' },
  ] },
];

export function westernSunSign(month: number, day: number): SignInfo {
  // Método direto por faixas (evita ambiguidade do wrap de ano).
  const ranges: Array<[number, number, number, number, number]> = [
    // [mesIni, diaIni, mesFim, diaFim, indexEmSIGNS]
    [3, 21, 4, 19, 0], [4, 20, 5, 20, 1], [5, 21, 6, 20, 2], [6, 21, 7, 22, 3],
    [7, 23, 8, 22, 4], [8, 23, 9, 22, 5], [9, 23, 10, 22, 6], [10, 23, 11, 21, 7],
    [11, 22, 12, 21, 8], [12, 22, 12, 31, 9], [1, 1, 1, 19, 9], [1, 20, 2, 18, 10],
    [2, 19, 3, 20, 11],
  ];
  for (const [m1, d1, m2, d2, idx] of ranges) {
    const afterStart = month > m1 || (month === m1 && day >= d1);
    const beforeEnd = month < m2 || (month === m2 && day <= d2);
    if (afterStart && beforeEnd) {
      const s = SIGNS[idx];
      return { id: s.id, name: s.name, element: s.element, modality: s.modality, traits: s.traits };
    }
  }
  const s = SIGNS[0];
  return { id: s.id, name: s.name, element: s.element, modality: s.modality, traits: s.traits };
}

/**
 * Ascendente APROXIMADO (método solar simplificado): o ascendente muda a cada
 * ~2h; assumindo o Sol no ascendente ao nascer do dia (~6h), avança um signo
 * a cada 2 horas a partir daí. É estimativa lúdica, não substitui mapa real.
 */
export function approximateAscendant(sunSignId: string, hour: number, minute: number): SignInfo {
  const sunIdx = SIGNS.findIndex(s => s.id === sunSignId);
  const hoursFromSunrise = (hour + minute / 60 - 6 + 24) % 24;
  const offset = Math.floor(hoursFromSunrise / 2);
  const s = SIGNS[(sunIdx + offset) % 12];
  return { id: s.id, name: s.name, element: s.element, modality: s.modality, traits: s.traits };
}

// ---------------------------------------------------------------------------
// 3. Horóscopo chinês
// ---------------------------------------------------------------------------

const CHINESE_ANIMALS: Array<{ name: LText; en: string; traits: LText[] }> = [
  { name: { pt: 'Rato', en: 'Rat' }, en: 'rat', traits: [{ pt: 'esperto e adaptável', en: 'clever and adaptable' }] },
  { name: { pt: 'Boi', en: 'Ox' }, en: 'ox', traits: [{ pt: 'trabalhador e confiável', en: 'hardworking and reliable' }] },
  { name: { pt: 'Tigre', en: 'Tiger' }, en: 'tiger', traits: [{ pt: 'destemido e imponente', en: 'fearless and imposing' }] },
  { name: { pt: 'Coelho', en: 'Rabbit' }, en: 'rabbit', traits: [{ pt: 'gentil e diplomático', en: 'gentle and diplomatic' }] },
  { name: { pt: 'Dragão', en: 'Dragon' }, en: 'dragon', traits: [{ pt: 'carismático e poderoso', en: 'charismatic and powerful' }] },
  { name: { pt: 'Serpente', en: 'Snake' }, en: 'snake', traits: [{ pt: 'sábio e misterioso', en: 'wise and mysterious' }] },
  { name: { pt: 'Cavalo', en: 'Horse' }, en: 'horse', traits: [{ pt: 'livre e enérgico', en: 'free and energetic' }] },
  { name: { pt: 'Cabra', en: 'Goat' }, en: 'goat', traits: [{ pt: 'criativo e acolhedor', en: 'creative and welcoming' }] },
  { name: { pt: 'Macaco', en: 'Monkey' }, en: 'monkey', traits: [{ pt: 'engenhoso e brincalhão', en: 'ingenious and playful' }] },
  { name: { pt: 'Galo', en: 'Rooster' }, en: 'rooster', traits: [{ pt: 'observador e confiante', en: 'observant and confident' }] },
  { name: { pt: 'Cão', en: 'Dog' }, en: 'dog', traits: [{ pt: 'leal e justo', en: 'loyal and fair' }] },
  { name: { pt: 'Porco', en: 'Pig' }, en: 'pig', traits: [{ pt: 'generoso e sincero', en: 'generous and sincere' }] },
];

const CHINESE_ELEMENTS: LText[] = [
  { pt: 'Madeira', en: 'Wood' }, { pt: 'Fogo', en: 'Fire' }, { pt: 'Terra', en: 'Earth' },
  { pt: 'Metal', en: 'Metal' }, { pt: 'Água', en: 'Water' },
];

export function computeChinese(year: number, month: number, day: number): ChineseResult {
  // Ano novo chinês varia (21/jan–20/fev); usamos 4/fev como corte aproximado.
  const effYear = (month < 2 || (month === 2 && day < 4)) ? year - 1 : year;
  const animalIdx = ((effYear - 4) % 12 + 12) % 12;
  const elementIdx = Math.floor((((effYear - 4) % 10 + 10) % 10) / 2);
  const animal = CHINESE_ANIMALS[animalIdx];
  return {
    animal: animal.name,
    animalEn: animal.en,
    element: CHINESE_ELEMENTS[elementIdx],
    yinYang: effYear % 2 === 0 ? 'yang' : 'yin',
    traits: animal.traits,
  };
}

// ---------------------------------------------------------------------------
// 4. Horóscopo védico (sideral, datas de sankranti aproximadas)
// ---------------------------------------------------------------------------

const VEDIC_SIGNS: Array<{ rashi: string; equivalent: LText; element: ElementId; from: [number, number]; traits: LText[] }> = [
  { rashi: 'Mesha', equivalent: { pt: 'Áries', en: 'Aries' }, element: 'fogo', from: [4, 14], traits: [{ pt: 'espírito guerreiro', en: 'warrior spirit' }] },
  { rashi: 'Vrishabha', equivalent: { pt: 'Touro', en: 'Taurus' }, element: 'terra', from: [5, 15], traits: [{ pt: 'força serena', en: 'serene strength' }] },
  { rashi: 'Mithuna', equivalent: { pt: 'Gêmeos', en: 'Gemini' }, element: 'ar', from: [6, 15], traits: [{ pt: 'mente dupla e ágil', en: 'dual, agile mind' }] },
  { rashi: 'Karka', equivalent: { pt: 'Câncer', en: 'Cancer' }, element: 'agua', from: [7, 16], traits: [{ pt: 'coração que abriga', en: 'sheltering heart' }] },
  { rashi: 'Simha', equivalent: { pt: 'Leão', en: 'Leo' }, element: 'fogo', from: [8, 17], traits: [{ pt: 'brilho real', en: 'royal radiance' }] },
  { rashi: 'Kanya', equivalent: { pt: 'Virgem', en: 'Virgo' }, element: 'terra', from: [9, 17], traits: [{ pt: 'precisão devota', en: 'devoted precision' }] },
  { rashi: 'Tula', equivalent: { pt: 'Libra', en: 'Libra' }, element: 'ar', from: [10, 17], traits: [{ pt: 'balança da justiça', en: 'scales of justice' }] },
  { rashi: 'Vrischika', equivalent: { pt: 'Escorpião', en: 'Scorpio' }, element: 'agua', from: [11, 16], traits: [{ pt: 'poder oculto', en: 'hidden power' }] },
  { rashi: 'Dhanu', equivalent: { pt: 'Sagitário', en: 'Sagittarius' }, element: 'fogo', from: [12, 16], traits: [{ pt: 'flecha do dharma', en: 'arrow of dharma' }] },
  { rashi: 'Makara', equivalent: { pt: 'Capricórnio', en: 'Capricorn' }, element: 'terra', from: [1, 14], traits: [{ pt: 'escalada disciplinada', en: 'disciplined climb' }] },
  { rashi: 'Kumbha', equivalent: { pt: 'Aquário', en: 'Aquarius' }, element: 'ar', from: [2, 13], traits: [{ pt: 'vaso do conhecimento', en: 'vessel of knowledge' }] },
  { rashi: 'Meena', equivalent: { pt: 'Peixes', en: 'Pisces' }, element: 'agua', from: [3, 14], traits: [{ pt: 'oceano interior', en: 'inner ocean' }] },
];

export function computeVedic(month: number, day: number): VedicResult {
  // Encontra o último sankranti <= data em ordem de calendário; datas antes
  // do primeiro sankranti do ano (14/jan) pertencem a Dhanu (começou 16/dez).
  const ord = (m: number, d: number) => m * 100 + d;
  const target = ord(month, day);
  let best = -1;
  let bestOrd = -1;
  for (let i = 0; i < VEDIC_SIGNS.length; i++) {
    const [fm, fd] = VEDIC_SIGNS[i].from;
    const o = ord(fm, fd);
    if (o <= target && o > bestOrd) {
      best = i;
      bestOrd = o;
    }
  }
  if (best === -1) best = VEDIC_SIGNS.findIndex(v => v.rashi === 'Dhanu');
  const v = VEDIC_SIGNS[best];
  return { rashi: v.rashi, equivalent: v.equivalent, element: v.element, traits: v.traits };
}

// ---------------------------------------------------------------------------
// 5. Pontuação de elementos e funções
// ---------------------------------------------------------------------------

export const ELEMENT_INFO: Record<ElementId, { name: LText; emoji: string; personality: LText }> = {
  agua: { name: { pt: 'Água', en: 'Water' }, emoji: '💧', personality: { pt: 'Fluido, empático e profundo — sente antes de entender e cura pela presença.', en: 'Fluid, empathetic and deep — feels before understanding and heals through presence.' } },
  fogo: { name: { pt: 'Fogo', en: 'Fire' }, emoji: '🔥', personality: { pt: 'Ardente, apaixonado e inquieto — inspira e incendeia quem está por perto.', en: 'Burning, passionate and restless — inspires and ignites those around.' } },
  terra: { name: { pt: 'Terra', en: 'Earth' }, emoji: '⛰️', personality: { pt: 'Sólido, leal e prático — a rocha em que os outros se apoiam.', en: 'Solid, loyal and practical — the rock others lean on.' } },
  ar: { name: { pt: 'Ar', en: 'Air' }, emoji: '🌪️', personality: { pt: 'Livre, curioso e veloz — vive de ideias e nunca fica parado.', en: 'Free, curious and swift — lives on ideas and never stands still.' } },
  sombra: { name: { pt: 'Sombra', en: 'Shadow' }, emoji: '🌑', personality: { pt: 'Misterioso, estrategista e introspectivo — enxerga o que ninguém vê.', en: 'Mysterious, strategic and introspective — sees what no one else sees.' } },
  luz: { name: { pt: 'Luz', en: 'Light' }, emoji: '✨', personality: { pt: 'Radiante, otimista e inspirador — guia os outros pelo exemplo.', en: 'Radiant, optimistic and inspiring — guides others by example.' } },
  planta: { name: { pt: 'Planta', en: 'Plant' }, emoji: '🌿', personality: { pt: 'Paciente, nutridor e resiliente — cresce devagar e floresce sempre.', en: 'Patient, nurturing and resilient — grows slowly and always blooms.' } },
  industrial: { name: { pt: 'Industrial', en: 'Industrial' }, emoji: '⚙️', personality: { pt: 'Engenhoso, preciso e incansável — constrói o futuro peça por peça.', en: 'Ingenious, precise and tireless — builds the future piece by piece.' } },
};

export const ROLE_INFO: Record<RoleId, { name: LText; emoji: string; profile: LText }> = {
  suporte: { name: { pt: 'Suporte', en: 'Support' }, emoji: '💖', profile: { pt: 'Perfil cuidador: fortalece, cura e mantém o grupo de pé.', en: 'Caretaker profile: strengthens, heals and keeps the group standing.' } },
  tanque: { name: { pt: 'Tanque', en: 'Tank' }, emoji: '🛡️', profile: { pt: 'Perfil protetor: se coloca na frente e absorve o perigo pelos outros.', en: 'Protector profile: stands in front and absorbs danger for others.' } },
  fisico: { name: { pt: 'Dano físico', en: 'Physical damage' }, emoji: '⚔️', profile: { pt: 'Perfil competitivo: combate corpo a corpo, direto e implacável.', en: 'Competitive profile: melee combat, direct and relentless.' } },
  magico: { name: { pt: 'Dano mágico', en: 'Magic damage' }, emoji: '🔮', profile: { pt: 'Perfil arcano: canaliza forças invisíveis e vence pela mente.', en: 'Arcane profile: channels unseen forces and wins through the mind.' } },
  alcance: { name: { pt: 'Longo alcance', en: 'Long range' }, emoji: '🏹', profile: { pt: 'Perfil observador: age à distância, com precisão e timing.', en: 'Observer profile: acts from afar, with precision and timing.' } },
};

// Afinidades da numerologia
const NUMBER_ELEMENTS: Record<number, ElementId[]> = {
  1: ['fogo', 'luz'], 2: ['agua', 'luz'], 3: ['ar', 'luz'], 4: ['terra', 'industrial'],
  5: ['ar', 'fogo'], 6: ['planta', 'agua'], 7: ['sombra', 'agua'], 8: ['industrial', 'terra'],
  9: ['luz', 'fogo'], 11: ['luz', 'ar'], 22: ['industrial', 'terra'], 33: ['luz', 'planta'],
};

const NUMBER_ROLES: Record<number, RoleId> = {
  1: 'fisico', 2: 'suporte', 3: 'alcance', 4: 'tanque', 5: 'alcance', 6: 'suporte',
  7: 'magico', 8: 'tanque', 9: 'magico', 11: 'magico', 22: 'tanque', 33: 'suporte',
};

// Elemento zodiacal → função
const ZODIAC_ELEMENT_ROLE: Record<string, RoleId> = {
  fogo: 'fisico', terra: 'tanque', ar: 'alcance', agua: 'suporte',
};

const MODALITY_ROLE: Record<string, RoleId> = {
  cardinal: 'fisico', fixo: 'tanque', mutavel: 'suporte',
};

const CHINESE_ANIMAL_ROLE: RoleId[] = [
  'alcance',  // Rato
  'tanque',   // Boi
  'fisico',   // Tigre
  'suporte',  // Coelho
  'magico',   // Dragão
  'magico',   // Serpente
  'fisico',   // Cavalo
  'suporte',  // Cabra
  'alcance',  // Macaco
  'alcance',  // Galo
  'tanque',   // Cão
  'suporte',  // Porco
];

const CHINESE_ELEMENT_MAP: ElementId[] = ['planta', 'fogo', 'terra', 'industrial', 'agua'];

export const ELEMENT_ORDER: ElementId[] = ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial'];
export const ROLE_ORDER: RoleId[] = ['suporte', 'tanque', 'fisico', 'magico', 'alcance'];

// ---------------------------------------------------------------------------
// 6. Arquétipo — bancos de palavras
// ---------------------------------------------------------------------------

const NOUNS_BY_ELEMENT: Record<ElementId, Array<{ pt: string; en: string }>> = {
  agua: [
    { pt: 'Sereia', en: 'mermaid' }, { pt: 'Leviatã', en: 'leviathan' }, { pt: 'Maré', en: 'tide' },
    { pt: 'Água-viva', en: 'jellyfish' }, { pt: 'Nascente', en: 'spring well' }, { pt: 'Kraken', en: 'kraken' },
  ],
  fogo: [
    { pt: 'Fênix', en: 'phoenix' }, { pt: 'Salamandra', en: 'salamander' }, { pt: 'Vulcão', en: 'volcano' },
    { pt: 'Braseiro', en: 'brazier' }, { pt: 'Cometa', en: 'comet' }, { pt: 'Dragão', en: 'dragon' },
  ],
  terra: [
    { pt: 'Golem', en: 'golem' }, { pt: 'Montanha', en: 'mountain' }, { pt: 'Cristal', en: 'crystal' },
    { pt: 'Urso', en: 'bear' }, { pt: 'Fortaleza', en: 'fortress' }, { pt: 'Menir', en: 'menhir' },
  ],
  ar: [
    { pt: 'Grifo', en: 'griffin' }, { pt: 'Ventania', en: 'gale' }, { pt: 'Pipa', en: 'kite' },
    { pt: 'Falcão', en: 'falcon' }, { pt: 'Nuvem', en: 'cloud' }, { pt: 'Zéfiro', en: 'zephyr' },
  ],
  sombra: [
    { pt: 'Eclipse', en: 'eclipse' }, { pt: 'Corvo', en: 'raven' }, { pt: 'Lanterna', en: 'lantern' },
    { pt: 'Esfinge', en: 'sphinx' }, { pt: 'Névoa', en: 'mist' }, { pt: 'Pantera', en: 'panther' },
  ],
  luz: [
    { pt: 'Farol', en: 'lighthouse' }, { pt: 'Unicórnio', en: 'unicorn' }, { pt: 'Aurora', en: 'aurora' },
    { pt: 'Estrela', en: 'star' }, { pt: 'Prisma', en: 'prism' }, { pt: 'Vaga-lume', en: 'firefly' },
  ],
  planta: [
    { pt: 'Mandrágora', en: 'mandrake' }, { pt: 'Carvalho', en: 'oak tree' }, { pt: 'Vitória-régia', en: 'giant water lily' },
    { pt: 'Cacto', en: 'cactus' }, { pt: 'Cogumelo', en: 'mushroom' }, { pt: 'Bambu', en: 'bamboo' },
  ],
  industrial: [
    { pt: 'Autômato', en: 'automaton' }, { pt: 'Engrenagem', en: 'gear' }, { pt: 'Dínamo', en: 'dynamo' },
    { pt: 'Relógio', en: 'clockwork' }, { pt: 'Locomotiva', en: 'locomotive' }, { pt: 'Satélite', en: 'satellite' },
  ],
};

// Adjetivos por função (concordância neutra impossível em PT — usamos formas que
// funcionam razoavelmente com os substantivos do banco; ajuste fino é estético).
const ADJECTIVES_BY_ROLE: Record<RoleId, LText[]> = {
  suporte: [
    { pt: 'acolhedor(a)', en: 'nurturing' }, { pt: 'gentil', en: 'gentle' }, { pt: 'devotado(a)', en: 'devoted' },
    { pt: 'curador(a)', en: 'healing' }, { pt: 'leal', en: 'loyal' },
  ],
  tanque: [
    { pt: 'inabalável', en: 'unshakable' }, { pt: 'protetor(a)', en: 'protective' }, { pt: 'colossal', en: 'colossal' },
    { pt: 'firme', en: 'steadfast' }, { pt: 'blindado(a)', en: 'armored' },
  ],
  fisico: [
    { pt: 'feroz', en: 'fierce' }, { pt: 'indomável', en: 'untamable' }, { pt: 'veloz', en: 'swift' },
    { pt: 'implacável', en: 'relentless' }, { pt: 'valente', en: 'valiant' },
  ],
  magico: [
    { pt: 'arcano(a)', en: 'arcane' }, { pt: 'enigmático(a)', en: 'enigmatic' }, { pt: 'hipnótico(a)', en: 'hypnotic' },
    { pt: 'visionário(a)', en: 'visionary' }, { pt: 'etéreo(a)', en: 'ethereal' },
  ],
  alcance: [
    { pt: 'certeiro(a)', en: 'sharp-eyed' }, { pt: 'paciente', en: 'patient' }, { pt: 'vigilante', en: 'watchful' },
    { pt: 'astuto(a)', en: 'cunning' }, { pt: 'preciso(a)', en: 'precise' },
  ],
};

const ADJECTIVES_BY_ELEMENT: Record<ElementId, LText[]> = {
  agua: [{ pt: 'profundo(a)', en: 'deep' }, { pt: 'sereno(a)', en: 'serene' }, { pt: 'fluido(a)', en: 'flowing' }],
  fogo: [{ pt: 'ardente', en: 'blazing' }, { pt: 'incandescente', en: 'incandescent' }, { pt: 'fervoroso(a)', en: 'fervent' }],
  terra: [{ pt: 'ancestral', en: 'ancient' }, { pt: 'sólido(a)', en: 'solid' }, { pt: 'fértil', en: 'fertile' }],
  ar: [{ pt: 'ligeiro(a)', en: 'nimble' }, { pt: 'etéreo(a)', en: 'airy' }, { pt: 'imprevisível', en: 'unpredictable' }],
  sombra: [{ pt: 'noturno(a)', en: 'nocturnal' }, { pt: 'oculto(a)', en: 'hidden' }, { pt: 'insondável', en: 'unfathomable' }],
  luz: [{ pt: 'radiante', en: 'radiant' }, { pt: 'cintilante', en: 'shimmering' }, { pt: 'benevolente', en: 'benevolent' }],
  planta: [{ pt: 'florescente', en: 'blooming' }, { pt: 'perene', en: 'evergreen' }, { pt: 'silvestre', en: 'wild-grown' }],
  industrial: [{ pt: 'cromado(a)', en: 'chrome-plated' }, { pt: 'incansável', en: 'tireless' }, { pt: 'engenhoso(a)', en: 'ingenious' }],
};

// ---------------------------------------------------------------------------
// 7. Criatura — nomes e prompts
// ---------------------------------------------------------------------------

const ELEMENT_NAME_STEMS: Record<ElementId, string[]> = {
  agua: ['Aqua', 'Hydro', 'Maris', 'Nixa'],
  fogo: ['Pyra', 'Igni', 'Flare', 'Vulko'],
  terra: ['Terra', 'Gaio', 'Rocko', 'Petra'],
  ar: ['Aero', 'Zephy', 'Venti', 'Skye'],
  sombra: ['Umbra', 'Nykta', 'Noxi', 'Krow'],
  luz: ['Lumi', 'Solari', 'Astra', 'Helio'],
  planta: ['Flora', 'Verdi', 'Sylva', 'Thorn'],
  industrial: ['Mecha', 'Gear', 'Volta', 'Ferro'],
};

const PERFECT_PREFIXES = ['Neo', 'Vex', 'Prime', 'Hyper'];
const MEGA_PREFIXES = ['Omega', 'Zenith', 'Ultima', 'Apex'];

const ELEMENT_PALETTE: Record<ElementId, string> = {
  agua: 'cool blue and teal color palette with aqua highlights',
  fogo: 'warm red, orange and ember-yellow color palette',
  terra: 'earthy brown, ochre and moss-green color palette',
  ar: 'sky blue, white and pale silver color palette',
  sombra: 'deep purple, charcoal black and violet-glow color palette',
  luz: 'golden yellow, white and warm cream color palette',
  planta: 'leafy green, lime and petal-pink color palette',
  industrial: 'steel gray, gunmetal and neon-accent color palette',
};

const ELEMENT_BODY: Record<ElementId, string> = {
  agua: 'droplet-smooth body with fin and wave details',
  fogo: 'flame-crested body with glowing ember patterns',
  terra: 'sturdy rocky body with crystal or stone plates',
  ar: 'feather-light body with wing tufts and cloud puffs',
  sombra: 'sleek shadowy body with a mysterious glowing eye or crescent marks',
  luz: 'glowing body with halo, star or sunbeam ornaments',
  planta: 'leafy body with sprout, vine and flower-bud details',
  industrial: 'mechanical body with visible gears, bolts and antenna parts',
};

const ROLE_MOTIF: Record<RoleId, string> = {
  suporte: 'carrying a small healing charm or ribbon, kind expression',
  tanque: 'wearing chunky shield-like armor plates, sturdy stance',
  fisico: 'with bold claws or fists ready for close combat, energetic pose',
  magico: 'with floating runes or a tiny staff, mystical aura',
  alcance: 'with a small bow, slingshot or shoulder cannon, focused gaze',
};

const STAGE_DESCRIPTOR: Record<StageId, string> = {
  crianca: 'baby stage: a tiny, round, blob-like chibi monster, very cute and simple, minimal limbs',
  adulto: 'adult stage: a medium-sized bipedal monster, confident and friendly, more defined features',
  perfeito: 'perfect stage: a large, impressive evolved monster with elaborate details and battle-ready look',
  mega: 'mega stage: a majestic final-form monster, epic silhouette, ornate details and a powerful aura',
};

export const STAGE_NAMES: Record<StageId, LText> = {
  crianca: { pt: 'Criança', en: 'Child' },
  adulto: { pt: 'Adulto', en: 'Adult' },
  perfeito: { pt: 'Perfeito', en: 'Perfect' },
  mega: { pt: 'Mega', en: 'Mega' },
};

// ---------------------------------------------------------------------------
// 8. Geração principal
// ---------------------------------------------------------------------------

function addScore<K extends string>(
  scores: Record<K, number>,
  breakdown: Record<K, ScoreEntry[]>,
  key: K,
  points: number,
  source: LText,
) {
  scores[key] += points;
  breakdown[key].push({ source, points });
}

export function generateOracle(input: OracleInput, seed?: number): OracleResult {
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = (input.birthTime || '12:00').split(':').map(Number);

  const numerology = computeNumerology(input.fullName, input.birthDate);
  const sun = westernSunSign(month, day);
  const ascendant = approximateAscendant(sun.id, hour, minute);
  const chinese = computeChinese(year, month, day);
  const vedic = computeVedic(month, day);

  // ----- Pontuação de elementos -----
  const elementScores = Object.fromEntries(ELEMENT_ORDER.map(e => [e, 0])) as Record<ElementId, number>;
  const elementBreakdown = Object.fromEntries(ELEMENT_ORDER.map(e => [e, [] as ScoreEntry[]])) as Record<ElementId, ScoreEntry[]>;

  addScore(elementScores, elementBreakdown, sun.element, 3,
    { pt: `Signo solar (${sun.name.pt})`, en: `Sun sign (${sun.name.en})` });
  addScore(elementScores, elementBreakdown, ascendant.element, 2,
    { pt: `Ascendente aproximado (${ascendant.name.pt})`, en: `Approximate ascendant (${ascendant.name.en})` });
  addScore(elementScores, elementBreakdown, vedic.element, 2,
    { pt: `Rashi védico (${vedic.rashi})`, en: `Vedic rashi (${vedic.rashi})` });

  const chineseElementIdx = CHINESE_ELEMENTS.findIndex(e => e.pt === chinese.element.pt);
  addScore(elementScores, elementBreakdown, CHINESE_ELEMENT_MAP[chineseElementIdx], 3,
    { pt: `Elemento chinês (${chinese.element.pt})`, en: `Chinese element (${chinese.element.en})` });

  addScore(elementScores, elementBreakdown, chinese.yinYang === 'yin' ? 'sombra' : 'luz', 2,
    { pt: `Polaridade chinesa (${chinese.yinYang})`, en: `Chinese polarity (${chinese.yinYang})` });

  const bornAtNight = hour < 6 || hour >= 18;
  addScore(elementScores, elementBreakdown, bornAtNight ? 'sombra' : 'luz', 2,
    bornAtNight
      ? { pt: 'Nascimento noturno', en: 'Night birth' }
      : { pt: 'Nascimento diurno', en: 'Day birth' });

  const numberContribs: Array<[number, number, LText]> = [
    [numerology.lifePath, 3, { pt: `Caminho de vida ${numerology.lifePath}`, en: `Life path ${numerology.lifePath}` }],
    [numerology.expression, 2, { pt: `Número de expressão ${numerology.expression}`, en: `Expression number ${numerology.expression}` }],
    [numerology.soulUrge, 1, { pt: `Motivação ${numerology.soulUrge}`, en: `Soul urge ${numerology.soulUrge}` }],
    [numerology.personality, 1, { pt: `Impressão ${numerology.personality}`, en: `Personality ${numerology.personality}` }],
  ];
  for (const [num, pts, source] of numberContribs) {
    const [primary, secondary] = NUMBER_ELEMENTS[num];
    addScore(elementScores, elementBreakdown, primary, pts, source);
    if (pts > 1) addScore(elementScores, elementBreakdown, secondary, 1, source);
  }

  // Local de nascimento: um toque místico determinístico (+1 em um elemento)
  const placeElement = ELEMENT_ORDER[hashString(input.birthPlace.trim().toLowerCase()) % ELEMENT_ORDER.length];
  addScore(elementScores, elementBreakdown, placeElement, 1,
    { pt: 'Eco do local de nascimento', en: 'Echo of the birthplace' });

  const sortedElements = [...ELEMENT_ORDER].sort((a, b) => elementScores[b] - elementScores[a]);
  const dominantElement = sortedElements[0];
  const secondaryElement = sortedElements[1];

  // ----- Pontuação de funções -----
  const roleScores = Object.fromEntries(ROLE_ORDER.map(r => [r, 0])) as Record<RoleId, number>;
  const roleBreakdown = Object.fromEntries(ROLE_ORDER.map(r => [r, [] as ScoreEntry[]])) as Record<RoleId, ScoreEntry[]>;

  addScore(roleScores, roleBreakdown, ZODIAC_ELEMENT_ROLE[sun.element], 3,
    { pt: `Elemento do signo solar (${sun.name.pt})`, en: `Sun sign element (${sun.name.en})` });
  addScore(roleScores, roleBreakdown, MODALITY_ROLE[sun.modality], 2,
    { pt: `Modalidade ${sun.modality}`, en: `${sun.modality} modality` });
  addScore(roleScores, roleBreakdown, ZODIAC_ELEMENT_ROLE[ascendant.element], 1,
    { pt: `Ascendente (${ascendant.name.pt})`, en: `Ascendant (${ascendant.name.en})` });

  const animalIdx = CHINESE_ANIMALS.findIndex(a => a.en === chinese.animalEn);
  addScore(roleScores, roleBreakdown, CHINESE_ANIMAL_ROLE[animalIdx], 3,
    { pt: `Animal chinês (${chinese.animal.pt})`, en: `Chinese animal (${chinese.animal.en})` });

  addScore(roleScores, roleBreakdown, ZODIAC_ELEMENT_ROLE[vedic.element], 1,
    { pt: `Rashi védico (${vedic.rashi})`, en: `Vedic rashi (${vedic.rashi})` });

  for (const [num, pts, source] of numberContribs) {
    addScore(roleScores, roleBreakdown, NUMBER_ROLES[num], pts, source);
  }

  // Sombra puxa dano mágico; industrial puxa longo alcance (afinidade temática)
  if (dominantElement === 'sombra') {
    addScore(roleScores, roleBreakdown, 'magico', 2, { pt: 'Elemento dominante Sombra', en: 'Dominant Shadow element' });
  }
  if (dominantElement === 'industrial') {
    addScore(roleScores, roleBreakdown, 'alcance', 2, { pt: 'Elemento dominante Industrial', en: 'Dominant Industrial element' });
  }
  if (dominantElement === 'planta') {
    addScore(roleScores, roleBreakdown, 'suporte', 2, { pt: 'Elemento dominante Planta', en: 'Dominant Plant element' });
  }
  if (dominantElement === 'luz') {
    addScore(roleScores, roleBreakdown, 'suporte', 1, { pt: 'Elemento dominante Luz', en: 'Dominant Light element' });
  }

  const sortedRoles = [...ROLE_ORDER].sort((a, b) => roleScores[b] - roleScores[a]);
  const dominantRole = sortedRoles[0];

  // ----- RNG semeado (parte criativa) -----
  const baseHash = hashString(
    `${normalizeName(input.fullName)}|${input.birthDate}|${input.birthTime}|${input.birthPlace.trim().toLowerCase()}`,
  );
  const salt = seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32((baseHash ^ salt) >>> 0);

  // ----- Arquétipo: 1 substantivo + 2 adjetivos -----
  const noun = pick(rng, NOUNS_BY_ELEMENT[dominantElement]);
  const adjRole = pick(rng, ADJECTIVES_BY_ROLE[dominantRole]);
  const adjElement = pick(rng, ADJECTIVES_BY_ELEMENT[secondaryElement]);
  const archetype: ArchetypeResult = {
    noun: { pt: noun.pt, en: noun.en },
    nounEn: noun.en,
    adjectives: [adjRole, adjElement],
    phrase: {
      pt: `${noun.pt} ${adjRole.pt} e ${adjElement.pt}`,
      en: `${adjRole.en} and ${adjElement.en} ${noun.en}`,
    },
  };

  // ----- Resumo de personalidade -----
  const sunTrait = pick(rng, sun.traits);
  const ascTrait = pick(rng, ascendant.traits);
  const chinTrait = chinese.traits[0];
  const vedTrait = vedic.traits[0];
  const personalitySummary: LText = {
    pt: `${ELEMENT_INFO[dominantElement].personality.pt} No fundo é ${sunTrait.pt}, mostra-se ${ascTrait.pt}, carrega a essência de quem é ${chinTrait.pt} e a alma védica de "${vedTrait.pt}". ${ROLE_INFO[dominantRole].profile.pt}`,
    en: `${ELEMENT_INFO[dominantElement].personality.en} Deep down ${sunTrait.en}, outwardly ${ascTrait.en}, carrying the essence of someone ${chinTrait.en} and the Vedic soul of "${vedTrait.en}". ${ROLE_INFO[dominantRole].profile.en}`,
  };

  // ----- Criatura + estágios -----
  const stem = pick(rng, ELEMENT_NAME_STEMS[dominantElement]);
  const nameLetters = normalizeName(input.fullName);
  const nameSyllable = nameLetters
    ? (nameLetters[0] + (nameLetters.slice(1).match(/[AEIOU]/)?.[0] ?? 'a')).toLowerCase()
    : 'mo';
  const baseName = (stem + nameSyllable).replace(/(.)\1+/g, '$1');

  const perfectPrefix = pick(rng, PERFECT_PREFIXES);
  const megaPrefix = pick(rng, MEGA_PREFIXES);
  const stageForms: Record<StageId, string> = {
    crianca: `${baseName}chi`,
    adulto: `${baseName}mon`,
    perfeito: `${perfectPrefix}${baseName}mon`,
    mega: `${megaPrefix}${baseName}mon`,
  };

  const elName = ELEMENT_INFO[dominantElement].name;
  const el2Name = ELEMENT_INFO[secondaryElement].name;
  const roleName = ROLE_INFO[dominantRole].name;

  const concept: LText = {
    pt: `Criatura de ${elName.pt} com traços de ${el2Name.pt}, função ${roleName.pt}, encarnação do arquétipo "${archetype.phrase.pt}" — inspirada no espírito do ${chinese.animal.pt} e no signo de ${sun.name.pt}.`,
    en: `A ${elName.en} creature with ${el2Name.en} traits, ${roleName.en} role, incarnation of the archetype "${archetype.phrase.en}" — inspired by the spirit of the ${chinese.animal.en} and the sign of ${sun.name.en}.`,
  };

  const stageDescriptions: Record<StageId, LText> = {
    crianca: {
      pt: `${stageForms.crianca} é um filhote pequenino e arredondado de ${elName.pt}, ainda tímido, que já demonstra o instinto de ${roleName.pt.toLowerCase()}. Lembra um(a) ${noun.pt} em miniatura: ${adjRole.pt} desde o primeiro dia.`,
      en: `${stageForms.crianca} is a tiny, round ${elName.en} baby, still shy, already showing its ${roleName.en.toLowerCase()} instinct. It resembles a miniature ${noun.en}: ${adjRole.en} from day one.`,
    },
    adulto: {
      pt: `${stageForms.adulto} cresceu confiante: um(a) ${noun.pt} jovem de ${elName.pt}, ${sunTrait.pt}, que assume de vez o papel de ${roleName.pt.toLowerCase()} do grupo. Traços de ${el2Name.pt} começam a aparecer no corpo.`,
      en: `${stageForms.adulto} has grown confident: a young ${elName.en} ${noun.en}, ${sunTrait.en}, fully embracing its role as the group's ${roleName.en.toLowerCase()}. ${el2Name.en} traits start to show on its body.`,
    },
    perfeito: {
      pt: `${stageForms.perfeito} atinge a forma perfeita: imponente, ${adjElement.pt} e ${adjRole.pt}, mescla ${elName.pt} e ${el2Name.pt} em um corpo elaborado, digno do espírito do ${chinese.animal.pt}.`,
      en: `${stageForms.perfeito} reaches its perfect form: imposing, ${adjElement.en} and ${adjRole.en}, blending ${elName.en} and ${el2Name.en} into an elaborate body worthy of the ${chinese.animal.en}'s spirit.`,
    },
    mega: {
      pt: `${stageForms.mega} é a forma final: um(a) ${noun.pt} lendário(a) de ${elName.pt}, aura colossal, guardião(ã) supremo(a) do papel de ${roleName.pt.toLowerCase()} — a expressão máxima do arquétipo "${archetype.phrase.pt}".`,
      en: `${stageForms.mega} is the final form: a legendary ${elName.en} ${noun.en} with a colossal aura, supreme guardian of the ${roleName.en.toLowerCase()} role — the ultimate expression of the archetype "${archetype.phrase.en}".`,
    },
  };

  const stages: CreatureStage[] = (Object.keys(STAGE_NAMES) as StageId[]).map(stage => ({
    stage,
    stageName: STAGE_NAMES[stage],
    name: stageForms[stage],
    description: stageDescriptions[stage],
    imagePrompt: [
      `8-bit retro pixel art sprite in classic Tamagotchi / Digimon virtual pet style`,
      STAGE_DESCRIPTOR[stage],
      `a ${archetype.adjectives[0].en} monster inspired by a ${archetype.nounEn} with a subtle ${chinese.animalEn} motif`,
      ELEMENT_BODY[dominantElement],
      `hints of ${ELEMENT_INFO[secondaryElement].name.en.toLowerCase()} element`,
      ROLE_MOTIF[dominantRole],
      ELEMENT_PALETTE[dominantElement],
      `chunky pixels, thick dark outline, big expressive eyes, full body, centered, plain white background, no text, sprite sheet style single frame`,
    ].join(', '),
  }));

  return {
    input,
    seed: salt,
    numerology,
    western: { sun, ascendant },
    chinese,
    vedic,
    elementScores,
    elementBreakdown,
    dominantElement,
    secondaryElement,
    roleScores,
    roleBreakdown,
    dominantRole,
    personalitySummary,
    archetype,
    creature: { baseName, concept, stages },
  };
}
