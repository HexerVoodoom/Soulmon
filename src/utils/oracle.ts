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

export type AlignmentId = 'poder' | 'harmonia' | 'benevolencia';

export type RealmId =
  | 'deserto' | 'picos' | 'oceano' | 'pantano' | 'floresta'
  | 'cavernas' | 'gelo' | 'campina' | 'akasha';

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
  alignmentScores: Record<AlignmentId, number>;
  alignmentBreakdown: Record<AlignmentId, ScoreEntry[]>;
  dominantAlignment: AlignmentId;
  realmScores: Record<RealmId, number>;
  dominantRealm: RealmId;
  personalitySummary: LText;
  archetype: ArchetypeResult;
  creature: {
    baseName: string;
    concept: LText;
    fusion: { a: LText; b: LText };  // as duas bases fundidas no corpo
    stages: CreatureStage[];
  };
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

/** Artigo indefinido em inglês (a/an) para os prompts. */
function an(word: string): string {
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
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

export const ALIGNMENT_INFO: Record<AlignmentId, { name: LText; emoji: string; profile: LText }> = {
  poder: { name: { pt: 'Poder', en: 'Power' }, emoji: '👑', profile: { pt: 'Busca conquistar, dominar desafios e deixar marca no mundo.', en: 'Seeks to conquer, master challenges and leave a mark on the world.' } },
  harmonia: { name: { pt: 'Harmonia', en: 'Harmony' }, emoji: '☯️', profile: { pt: 'Busca equilíbrio, conhecimento e o fluxo natural das coisas.', en: 'Seeks balance, knowledge and the natural flow of things.' } },
  benevolencia: { name: { pt: 'Benevolência', en: 'Benevolence' }, emoji: '🕊️', profile: { pt: 'Busca cuidar, proteger e elevar quem está ao redor.', en: 'Seeks to care for, protect and uplift those around.' } },
};

export const REALM_INFO: Record<RealmId, { name: LText; emoji: string; description: LText; scenery: string; accent: string }> = {
  deserto: {
    name: { pt: 'Deserto Árido', en: 'Arid Desert' }, emoji: '🏜️',
    description: { pt: 'Dunas escaldantes onde só os tenazes florescem.', en: 'Scorching dunes where only the tenacious thrive.' },
    scenery: 'sun-bleached dunes and cracked earth', accent: 'sand-gold and terracotta accents',
  },
  picos: {
    name: { pt: 'Picos Tempestuosos', en: 'Stormy Peaks' }, emoji: '🌩️',
    description: { pt: 'Montanhas varridas por raios e ventos uivantes.', en: 'Mountains swept by lightning and howling winds.' },
    scenery: 'jagged cliffs under thunderclouds', accent: 'storm-blue and electric-yellow accents',
  },
  oceano: {
    name: { pt: 'Oceano Profundo', en: 'Deep Ocean' }, emoji: '🌊',
    description: { pt: 'Abismos azuis cheios de segredos luminosos.', en: 'Blue abysses full of glowing secrets.' },
    scenery: 'deep sea trenches with bioluminescence', accent: 'abyssal-blue and bioluminescent-cyan accents',
  },
  pantano: {
    name: { pt: 'Pântanos Mortais', en: 'Deadly Swamps' }, emoji: '🦠',
    description: { pt: 'Brejos enevoados onde a vida e o perigo se confundem.', en: 'Misty bogs where life and danger blur together.' },
    scenery: 'foggy marshes and twisted roots', accent: 'murky-green and toxic-purple accents',
  },
  floresta: {
    name: { pt: 'Floresta Selvagem', en: 'Wild Forest' }, emoji: '🌲',
    description: { pt: 'Matas antigas que pulsam com vida indômita.', en: 'Ancient woods pulsing with untamed life.' },
    scenery: 'dense ancient woodland', accent: 'forest-green and bark-brown accents',
  },
  cavernas: {
    name: { pt: 'Cavernas Rochosas', en: 'Rocky Caverns' }, emoji: '🪨',
    description: { pt: 'Labirintos de pedra e cristais que guardam ecos antigos.', en: 'Stone labyrinths and crystals holding ancient echoes.' },
    scenery: 'crystal-studded caves', accent: 'slate-gray and amethyst accents',
  },
  gelo: {
    name: { pt: 'Desertos Gelados', en: 'Frozen Wastes' }, emoji: '🧊',
    description: { pt: 'Planícies de gelo eterno sob auroras silenciosas.', en: 'Plains of eternal ice under silent auroras.' },
    scenery: 'endless ice fields under auroras', accent: 'ice-white and glacial-blue accents',
  },
  campina: {
    name: { pt: 'Campina Serena', en: 'Serene Meadow' }, emoji: '🌼',
    description: { pt: 'Campos dourados de paz, vento morno e flores.', en: 'Golden fields of peace, warm wind and flowers.' },
    scenery: 'sunny flower meadows', accent: 'sunny-yellow and blossom-pink accents',
  },
  akasha: {
    name: { pt: 'Reino de Akasha', en: 'Akasha Realm' }, emoji: '🌗',
    description: { pt: 'Plano etéreo onde luz e sombra dançam em equilíbrio.', en: 'Ethereal plane where light and shadow dance in balance.' },
    scenery: 'ethereal void of intertwined light and shadow', accent: 'duotone gold-and-violet twilight accents',
  },
};

export const ALIGNMENT_ORDER: AlignmentId[] = ['poder', 'harmonia', 'benevolencia'];
export const REALM_ORDER: RealmId[] = ['deserto', 'picos', 'oceano', 'pantano', 'floresta', 'cavernas', 'gelo', 'campina', 'akasha'];

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

// ----- Alinhamento (poder / harmonia / benevolência) -----

const NUMBER_ALIGNMENT: Record<number, AlignmentId> = {
  1: 'poder', 2: 'harmonia', 3: 'harmonia', 4: 'poder', 5: 'harmonia', 6: 'benevolencia',
  7: 'harmonia', 8: 'poder', 9: 'benevolencia', 11: 'harmonia', 22: 'poder', 33: 'benevolencia',
};

const ZODIAC_ELEMENT_ALIGNMENT: Record<string, AlignmentId> = {
  fogo: 'poder', terra: 'harmonia', ar: 'harmonia', agua: 'benevolencia',
};

// Rato, Boi, Tigre, Coelho, Dragão, Serpente, Cavalo, Cabra, Macaco, Galo, Cão, Porco
const CHINESE_ANIMAL_ALIGNMENT: AlignmentId[] = [
  'harmonia', 'harmonia', 'poder', 'benevolencia', 'poder', 'harmonia',
  'poder', 'benevolencia', 'harmonia', 'poder', 'benevolencia', 'benevolencia',
];

const ROLE_ALIGNMENT: Record<RoleId, AlignmentId> = {
  fisico: 'poder', tanque: 'benevolencia', suporte: 'benevolencia',
  magico: 'harmonia', alcance: 'harmonia',
};

// ----- Reino: pesos de cada elemento na afinidade com cada reino -----
// realmScore = Σ (peso × pontos do elemento) + bônus de alinhamento + jitter
// determinístico do input (desempate único por pessoa).

const REALM_WEIGHTS: Record<RealmId, Partial<Record<ElementId, number>>> = {
  deserto: { fogo: 3, terra: 2, industrial: 1 },
  picos: { ar: 3, fogo: 1, industrial: 1 },
  oceano: { agua: 3, sombra: 1 },
  pantano: { agua: 2, sombra: 2, planta: 2 },
  floresta: { planta: 3, terra: 1, agua: 1 },
  cavernas: { terra: 3, sombra: 2, industrial: 1 },
  gelo: { agua: 2, ar: 2, luz: 1 },
  campina: { luz: 2, planta: 2, ar: 1 },
  akasha: { luz: 3, sombra: 3 },
};

const ALIGNMENT_REALM_BONUS: Record<AlignmentId, RealmId[]> = {
  poder: ['picos', 'deserto'],
  harmonia: ['akasha', 'cavernas'],
  benevolencia: ['campina', 'floresta'],
};

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
// 7. Criatura — bestiário de fusão, características e prompts
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

const REALM_NAME_STEMS: Record<RealmId, string[]> = {
  deserto: ['Duna', 'Sahar', 'Mira'],
  picos: ['Zeka', 'Tromu', 'Raiku'],
  oceano: ['Abyssa', 'Nauti', 'Mareo'],
  pantano: ['Boggu', 'Mirena', 'Sludge'],
  floresta: ['Sylvo', 'Bruma', 'Kodama'],
  cavernas: ['Grotta', 'Stalag', 'Ekko'],
  gelo: ['Kriona', 'Frosta', 'Boreal'],
  campina: ['Prado', 'Leana', 'Solis'],
  akasha: ['Akasha', 'Aetheri', 'Nimbra'],
};

const PERFECT_PREFIXES = ['Neo', 'Vex', 'Prime', 'Hyper'];
const MEGA_PREFIXES = ['Omega', 'Zenith', 'Ultima', 'Apex'];

// Bestiário: bases corporais para a FUSÃO. Cada criatura funde DUAS bases
// sorteadas de um pool filtrado por elemento dominante/secundário + reino —
// o horóscopo entra só como eco sutil, nunca como corpo principal.
interface CreatureBase { pt: string; en: string; elements: ElementId[]; realms: RealmId[] }

const CREATURE_BASES: CreatureBase[] = [
  { pt: 'axolote', en: 'axolotl', elements: ['agua'], realms: ['oceano', 'pantano'] },
  { pt: 'polvo', en: 'octopus', elements: ['agua', 'sombra'], realms: ['oceano'] },
  { pt: 'cavalo-marinho', en: 'seahorse', elements: ['agua'], realms: ['oceano'] },
  { pt: 'tartaruga', en: 'turtle', elements: ['agua', 'terra'], realms: ['oceano', 'campina'] },
  { pt: 'peixe-lanterna', en: 'anglerfish', elements: ['agua', 'sombra'], realms: ['oceano'] },
  { pt: 'sapo', en: 'frog', elements: ['agua', 'planta'], realms: ['pantano'] },
  { pt: 'crocodilo', en: 'crocodile', elements: ['agua'], realms: ['pantano'] },
  { pt: 'planta carnívora', en: 'venus flytrap', elements: ['planta'], realms: ['pantano'] },
  { pt: 'cogumelo', en: 'mushroom', elements: ['planta', 'sombra'], realms: ['pantano', 'floresta'] },
  { pt: 'salamandra', en: 'salamander', elements: ['fogo'], realms: ['deserto', 'pantano'] },
  { pt: 'raposa', en: 'fox', elements: ['fogo'], realms: ['floresta', 'campina'] },
  { pt: 'leão', en: 'lion', elements: ['fogo', 'luz'], realms: ['deserto', 'campina'] },
  { pt: 'escorpião', en: 'scorpion', elements: ['terra', 'sombra'], realms: ['deserto'] },
  { pt: 'escaravelho', en: 'scarab beetle', elements: ['terra', 'industrial'], realms: ['deserto'] },
  { pt: 'cacto', en: 'cactus', elements: ['planta'], realms: ['deserto'] },
  { pt: 'víbora', en: 'viper', elements: ['sombra'], realms: ['deserto', 'pantano'] },
  { pt: 'golem de pedra', en: 'stone golem', elements: ['terra'], realms: ['cavernas', 'picos'] },
  { pt: 'morcego', en: 'bat', elements: ['sombra', 'ar'], realms: ['cavernas'] },
  { pt: 'toupeira', en: 'mole', elements: ['terra'], realms: ['cavernas'] },
  { pt: 'gárgula', en: 'gargoyle', elements: ['terra', 'sombra'], realms: ['cavernas', 'picos'] },
  { pt: 'salamandra de cristal', en: 'crystal newt', elements: ['terra', 'luz'], realms: ['cavernas'] },
  { pt: 'falcão', en: 'falcon', elements: ['ar'], realms: ['picos'] },
  { pt: 'grifo', en: 'griffin', elements: ['ar', 'luz'], realms: ['picos'] },
  { pt: 'wyvern', en: 'wyvern', elements: ['ar', 'fogo'], realms: ['picos'] },
  { pt: 'carneiro-da-montanha', en: 'mountain ram', elements: ['terra'], realms: ['picos', 'gelo'] },
  { pt: 'nuvem de tempestade', en: 'living storm cloud', elements: ['ar'], realms: ['picos'] },
  { pt: 'coruja', en: 'owl', elements: ['ar', 'sombra'], realms: ['floresta'] },
  { pt: 'cervo', en: 'deer', elements: ['luz', 'planta'], realms: ['floresta', 'campina'] },
  { pt: 'lobo', en: 'wolf', elements: ['sombra'], realms: ['floresta', 'gelo'] },
  { pt: 'ent (árvore anciã)', en: 'ancient tree ent', elements: ['planta', 'terra'], realms: ['floresta'] },
  { pt: 'yeti', en: 'yeti', elements: ['agua', 'terra'], realms: ['gelo'] },
  { pt: 'pinguim', en: 'penguin', elements: ['agua'], realms: ['gelo'] },
  { pt: 'raposa-do-ártico', en: 'arctic fox', elements: ['luz', 'agua'], realms: ['gelo'] },
  { pt: 'golem de gelo', en: 'ice golem', elements: ['agua', 'industrial'], realms: ['gelo'] },
  { pt: 'coelho', en: 'rabbit', elements: ['luz'], realms: ['campina'] },
  { pt: 'abelha', en: 'bumblebee', elements: ['ar', 'planta'], realms: ['campina'] },
  { pt: 'borboleta', en: 'butterfly', elements: ['luz', 'ar'], realms: ['campina', 'akasha'] },
  { pt: 'unicórnio', en: 'unicorn', elements: ['luz'], realms: ['campina', 'akasha'] },
  { pt: 'fada', en: 'fairy', elements: ['luz', 'planta'], realms: ['akasha', 'floresta'] },
  { pt: 'esfinge', en: 'sphinx', elements: ['luz', 'sombra'], realms: ['akasha', 'deserto'] },
  { pt: 'fênix', en: 'phoenix', elements: ['fogo', 'luz'], realms: ['akasha', 'picos'] },
  { pt: 'corvo', en: 'raven', elements: ['sombra'], realms: ['akasha', 'floresta'] },
  { pt: 'quimera', en: 'chimera', elements: ['fogo', 'sombra'], realms: ['akasha', 'cavernas'] },
  { pt: 'autômato', en: 'clockwork automaton', elements: ['industrial'], realms: ['cavernas', 'akasha'] },
  { pt: 'besouro mecânico', en: 'mechanical beetle', elements: ['industrial'], realms: ['deserto', 'picos'] },
  { pt: 'dínamo vivo', en: 'living dynamo', elements: ['industrial', 'ar'], realms: ['picos'] },
];

const ELEMENT_PALETTE: Record<ElementId, string> = {
  agua: 'cool blue and teal color palette',
  fogo: 'warm red, orange and ember-yellow color palette',
  terra: 'earthy brown and ochre color palette',
  ar: 'sky blue, white and pale silver color palette',
  sombra: 'deep purple and charcoal color palette',
  luz: 'golden yellow, white and warm cream color palette',
  planta: 'leafy green and lime color palette',
  industrial: 'steel gray and gunmetal color palette',
};

// Texturas de corpo por elemento (a "pele" da fusão)
const ELEMENT_TEXTURE: Record<ElementId, string> = {
  agua: 'smooth glossy skin with small fins and droplet shapes',
  fogo: 'ember-flecked hide with tiny flame tufts',
  terra: 'cracked stone plates and pebble bumps',
  ar: 'fluffy feather-down and cloud-like puffs',
  sombra: 'sleek dark velvet fur with faint glow marks',
  luz: 'softly glowing pearl-like skin',
  planta: 'leaf-scale skin with sprouts and buds',
  industrial: 'riveted metal plates with visible gears',
};

// Características avulsas (sorteio semeado — aumentam a variedade combinatória)
const CRESTS = [
  'small curved horns', 'branching antlers', 'a fin-shaped crest', 'a sprouting leaf on the head',
  'a tiny gear halo', 'crystal spikes along the head', 'a flame tuft on the forehead', 'an icicle crown',
  'a mushroom cap hat', 'insect antennae', 'a third-eye gem on the forehead', 'a star-shaped emblem on the brow',
];

const TAILS = [
  'a stubby round tail', 'a long whip-like tail with a glowing tip', 'a leafy vine tail',
  'a segmented armored tail', 'a fluffy fan tail', 'a coiled spring tail', 'twin ribbon tails',
  'a crystal-tipped tail', 'a little flame tail', 'no tail at all',
];

// Marcas corporais por alinhamento
const ALIGNMENT_MARKING: Record<AlignmentId, string> = {
  poder: 'bold jagged war-paint stripes on the body',
  harmonia: 'concentric ring and spiral markings on the body',
  benevolencia: 'small heart and star speckle markings on the body',
};

const ROLE_MOTIF: Record<RoleId, string> = {
  suporte: 'carrying a small healing charm, kind expression',
  tanque: 'wearing chunky shield-like armor pieces, sturdy stance',
  fisico: 'with bold little claws or fists, energetic pose',
  magico: 'with a floating rune orb beside it, mystical gaze',
  alcance: 'with a tiny slingshot or shoulder cannon, focused eyes',
};

// Estilo-base dos sprites do jogo (DMC / Digital Monster Color), descrito em
// texto porque a ferramenta de imagem (Nanobanana) não aceita imagem de
// referência — o prompt precisa carregar o estilo inteiro.
const SPRITE_STYLE_BASE =
  'retro virtual pet monster sprite in the exact style of the 1997 Bandai Digital Monster LCD device sprites (Digimon Color), ' +
  'drawn on a tiny pixel grid and upscaled with hard square pixels (nearest-neighbor, no smoothing), ' +
  'flat solid colors only, no gradients, no anti-aliasing, no shading except simple two-tone, ' +
  'clean 1-pixel dark outline around the whole silhouette, stubby proportions with oversized head and big simple eyes';

const SPRITE_STYLE_END =
  'single full-body character, centered, facing slightly left, plain white background, ' +
  'no text, no watermark, no frame, no scenery, single frame';

const STAGE_SPRITE_SPEC: Record<StageId, { grid: string; colors: number; body: string }> = {
  crianca: { grid: '16x16', colors: 4, body: 'baby stage: a tiny round blob-like body, almost no limbs, huge cute eyes' },
  adulto: { grid: '24x24', colors: 6, body: 'adult stage: a small bipedal body with short limbs, confident smile' },
  perfeito: { grid: '32x32', colors: 8, body: 'perfect stage: a larger battle-ready body with elaborate details' },
  mega: { grid: '48x48', colors: 10, body: 'mega stage: an imposing final-form body with ornate details and a powerful aura' },
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

  // ----- Pontuação de alinhamento (poder / harmonia / benevolência) -----
  const alignmentScores = Object.fromEntries(ALIGNMENT_ORDER.map(a => [a, 0])) as Record<AlignmentId, number>;
  const alignmentBreakdown = Object.fromEntries(ALIGNMENT_ORDER.map(a => [a, [] as ScoreEntry[]])) as Record<AlignmentId, ScoreEntry[]>;

  addScore(alignmentScores, alignmentBreakdown, ZODIAC_ELEMENT_ALIGNMENT[sun.element], 3,
    { pt: `Signo solar (${sun.name.pt})`, en: `Sun sign (${sun.name.en})` });
  addScore(alignmentScores, alignmentBreakdown, ZODIAC_ELEMENT_ALIGNMENT[ascendant.element], 1,
    { pt: `Ascendente (${ascendant.name.pt})`, en: `Ascendant (${ascendant.name.en})` });
  addScore(alignmentScores, alignmentBreakdown, CHINESE_ANIMAL_ALIGNMENT[animalIdx], 3,
    { pt: `Animal chinês (${chinese.animal.pt})`, en: `Chinese animal (${chinese.animal.en})` });
  addScore(alignmentScores, alignmentBreakdown, chinese.yinYang === 'yang' ? 'poder' : 'harmonia', 1,
    { pt: `Polaridade ${chinese.yinYang}`, en: `${chinese.yinYang} polarity` });
  addScore(alignmentScores, alignmentBreakdown, ROLE_ALIGNMENT[dominantRole], 2,
    { pt: `Função dominante (${ROLE_INFO[dominantRole].name.pt})`, en: `Dominant role (${ROLE_INFO[dominantRole].name.en})` });
  for (const [num, pts, source] of numberContribs) {
    addScore(alignmentScores, alignmentBreakdown, NUMBER_ALIGNMENT[num], pts, source);
  }

  const sortedAlignments = [...ALIGNMENT_ORDER].sort((a, b) => alignmentScores[b] - alignmentScores[a]);
  const dominantAlignment = sortedAlignments[0];

  // ----- Pontuação de reino -----
  // Combina os 8 elementos via matriz de pesos + bônus do alinhamento + jitter
  // determinístico por pessoa (desempata de um jeito único para cada input).
  const inputKey = `${normalizeName(input.fullName)}|${input.birthDate}|${input.birthTime}|${input.birthPlace.trim().toLowerCase()}`;
  const realmScores = Object.fromEntries(REALM_ORDER.map(r => [r, 0])) as Record<RealmId, number>;
  for (const realm of REALM_ORDER) {
    let score = 0;
    for (const [el, weight] of Object.entries(REALM_WEIGHTS[realm]) as Array<[ElementId, number]>) {
      score += weight * elementScores[el];
    }
    if (ALIGNMENT_REALM_BONUS[dominantAlignment].includes(realm)) score += 3;
    score += hashString(`${inputKey}|${realm}`) % 4; // 0–3: assinatura pessoal
    realmScores[realm] = score;
  }
  const dominantRealm = [...REALM_ORDER].sort((a, b) => realmScores[b] - realmScores[a])[0];

  // ----- RNG semeado (parte criativa) -----
  const baseHash = hashString(inputKey);
  const salt = seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32((baseHash ^ salt) >>> 0);

  // ----- Arquétipo: 1 substantivo + 2 adjetivos -----
  // Pool ampliado (elemento dominante + secundário) — menos literal, mais variado.
  const nounPool = [...NOUNS_BY_ELEMENT[dominantElement], ...NOUNS_BY_ELEMENT[secondaryElement]];
  const noun = pick(rng, nounPool);
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
    pt: `${ELEMENT_INFO[dominantElement].personality.pt} No fundo é ${sunTrait.pt}, mostra-se ${ascTrait.pt}, carrega a essência de quem é ${chinTrait.pt} e a alma védica de "${vedTrait.pt}". ${ROLE_INFO[dominantRole].profile.pt} Alinhamento ${ALIGNMENT_INFO[dominantAlignment].name.pt.toLowerCase()}: ${ALIGNMENT_INFO[dominantAlignment].profile.pt.toLowerCase()}`,
    en: `${ELEMENT_INFO[dominantElement].personality.en} Deep down ${sunTrait.en}, outwardly ${ascTrait.en}, carrying the essence of someone ${chinTrait.en} and the Vedic soul of "${vedTrait.en}". ${ROLE_INFO[dominantRole].profile.en} ${ALIGNMENT_INFO[dominantAlignment].name.en} alignment: ${ALIGNMENT_INFO[dominantAlignment].profile.en.toLowerCase()}`,
  };

  // ----- Criatura: fusão de duas bases do bestiário -----
  // Pool filtrado por elemento dominante/secundário OU reino — o horóscopo
  // NÃO define o corpo; no máximo vira um aceno sutil sorteado.
  const basePool = CREATURE_BASES.filter(b =>
    b.elements.includes(dominantElement) ||
    b.elements.includes(secondaryElement) ||
    b.realms.includes(dominantRealm),
  );
  const fusionA = pick(rng, basePool);
  const poolB = basePool.filter(b => b.en !== fusionA.en);
  const fusionB = poolB.length > 0 ? pick(rng, poolB) : pick(rng, CREATURE_BASES.filter(b => b.en !== fusionA.en));

  // Características sorteadas (assinatura visual única)
  const crest = pick(rng, CRESTS);
  const tail = pick(rng, TAILS);
  const texture = ELEMENT_TEXTURE[dominantElement];
  const texture2 = ELEMENT_TEXTURE[secondaryElement];
  const marking = ALIGNMENT_MARKING[dominantAlignment];
  const realmInfo = REALM_INFO[dominantRealm];
  // Eco do horóscopo: só às vezes, e sempre sutil
  const zodiacEcho = rng() < 0.35
    ? `, and a very faint, subtle hint of ${chinese.animalEn} in the face`
    : '';

  // Nome: radical de elemento OU de reino + sílaba pessoal
  const stemPool = [
    ...ELEMENT_NAME_STEMS[dominantElement],
    ...ELEMENT_NAME_STEMS[secondaryElement],
    ...REALM_NAME_STEMS[dominantRealm],
  ];
  const stem = pick(rng, stemPool);
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
  const alignName = ALIGNMENT_INFO[dominantAlignment].name;

  const concept: LText = {
    pt: `Fusão de ${fusionA.pt} com ${fusionB.pt}, nascida no reino ${realmInfo.name.pt} ${realmInfo.emoji}. Elemento ${elName.pt} com traços de ${el2Name.pt}, alinhamento ${alignName.pt}, função ${roleName.pt} — encarnação do arquétipo "${archetype.phrase.pt}". Os astros são só o eco distante; a criatura é única.`,
    en: `A fusion of ${fusionA.en} and ${fusionB.en}, born in the ${realmInfo.name.en} realm ${realmInfo.emoji}. ${elName.en} element with ${el2Name.en} traits, ${alignName.en} alignment, ${roleName.en} role — incarnation of the archetype "${archetype.phrase.en}". The stars are only a distant echo; the creature is one of a kind.`,
  };

  const stageDescriptions: Record<StageId, LText> = {
    crianca: {
      pt: `${stageForms.crianca} é um filhotinho arredondado do reino ${realmInfo.name.pt}: uma mistura tímida de ${fusionA.pt} com ${fusionB.pt}, ainda desajeitado, com a aura de ${alignName.pt.toLowerCase()} brilhando fraquinha. ${adjRole.pt} desde o primeiro dia.`,
      en: `${stageForms.crianca} is a round little hatchling of the ${realmInfo.name.en}: a shy blend of ${fusionA.en} and ${fusionB.en}, still clumsy, its ${alignName.en.toLowerCase()} aura glowing faintly. ${adjRole.en} from day one.`,
    },
    adulto: {
      pt: `${stageForms.adulto} cresceu explorando cada canto do reino ${realmInfo.name.pt}. A fusão de ${fusionA.pt} e ${fusionB.pt} se firmou num corpo ágil de ${elName.pt}, e ele assume de vez o posto de ${roleName.pt.toLowerCase()} — ${sunTrait.pt}, como manda sua essência.`,
      en: `${stageForms.adulto} grew up exploring every corner of the ${realmInfo.name.en}. The fusion of ${fusionA.en} and ${fusionB.en} settled into an agile ${elName.en} body, and it fully claims the ${roleName.en.toLowerCase()} post — ${sunTrait.en}, true to its essence.`,
    },
    perfeito: {
      pt: `${stageForms.perfeito} atinge a forma perfeita: ${adjElement.pt} e ${adjRole.pt}, com ${el2Name.pt} entrelaçado ao corpo e as marcas de ${alignName.pt.toLowerCase()} reluzindo. É reconhecido como guardião do reino ${realmInfo.name.pt}.`,
      en: `${stageForms.perfeito} reaches its perfect form: ${adjElement.en} and ${adjRole.en}, with ${el2Name.en} woven into its body and its ${alignName.en.toLowerCase()} markings gleaming. It is hailed as a guardian of the ${realmInfo.name.en}.`,
    },
    mega: {
      pt: `${stageForms.mega} é a forma final: a lenda viva do reino ${realmInfo.name.pt}, expressão máxima do arquétipo "${archetype.phrase.pt}". Nenhuma outra criatura reúne essa mistura — ela carrega a assinatura de quem a inspirou.`,
      en: `${stageForms.mega} is the final form: the living legend of the ${realmInfo.name.en}, ultimate expression of the archetype "${archetype.phrase.en}". No other creature holds this exact blend — it bears the signature of the person who inspired it.`,
    },
  };

  const stages: CreatureStage[] = (Object.keys(STAGE_NAMES) as StageId[]).map(stage => {
    const spec = STAGE_SPRITE_SPEC[stage];
    return {
      stage,
      stageName: STAGE_NAMES[stage],
      name: stageForms[stage],
      description: stageDescriptions[stage],
      imagePrompt: [
        SPRITE_STYLE_BASE,
        `designed on a ${spec.grid} pixel grid, maximum ${spec.colors} solid colors`,
        spec.body,
        `an original monster: a fusion of ${an(fusionA.en)} and ${an(fusionB.en)}${zodiacEcho}`,
        `${texture}, with touches of ${texture2}`,
        crest,
        tail,
        marking,
        ROLE_MOTIF[dominantRole],
        `${ELEMENT_PALETTE[dominantElement]}, with ${realmInfo.accent}`,
        `a creature born in ${realmInfo.scenery} (environment for color mood only, do NOT draw the background)`,
        SPRITE_STYLE_END,
      ].join(', '),
    };
  });

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
    alignmentScores,
    alignmentBreakdown,
    dominantAlignment,
    realmScores,
    dominantRealm,
    personalitySummary,
    archetype,
    creature: {
      baseName,
      concept,
      fusion: { a: { pt: fusionA.pt, en: fusionA.en }, b: { pt: fusionB.pt, en: fusionB.en } },
      stages,
    },
  };
}
