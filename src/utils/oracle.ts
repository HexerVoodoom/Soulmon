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

export type StageId = 'rookie' | 'champion' | 'perfeito' | 'mega' | 'ultra';

/** Texto bilíngue (o app sempre exibe PT-BR e EN). */
export interface LText { pt: string; en: string }

export interface OraclePreferences {
  element?: ElementId;
  realm?: RealmId;
  alignment?: AlignmentId;
}

export interface OracleInput {
  fullName: string;
  birthDate: string;  // 'YYYY-MM-DD'
  birthTime: string;  // 'HH:MM'
  birthPlace: string;
  /** Respostas do quiz de personalidade (id da pergunta → id da opção). */
  answers?: Record<string, string>;
  /** Preferências diretas OPCIONAIS — pesam 25% no eixo correspondente. */
  preferences?: OraclePreferences;
  /** Descrição livre de como o usuário imagina o pet — pesa 50% (por
   *  palavras-chave) e é injetada no prompt de imagem. Opcional. */
  petDescription?: string;
}

/**
 * Ajustes manuais do usuário: sobrescrevem os VENCEDORES de cada eixo antes
 * da geração criativa (arquétipo + criatura). As pontuações/barras continuam
 * sendo a "leitura" pura dos astros — só o resultado final muda.
 */
export interface OracleOverrides {
  dominantElement?: ElementId;
  /** ElementId força um secundário; null força elemento ÚNICO; undefined = automático. */
  secondaryElement?: ElementId | null;
  dominantRole?: RoleId;
  dominantAlignment?: AlignmentId;
  dominantRealm?: RealmId;
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
  /** champion/perfeito/mega existem em 3 LINHAS, uma por tipo (Vírus/Data/
   *  Vacina). rookie e ultra não têm branch. */
  branch?: AlignmentId;
  stageName: LText;
  name: string;                // nome da forma (ex.: "FangPyramon")
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
  /** null = criatura de elemento ÚNICO (só há secundário se a pontuação for próxima). */
  secondaryElement: ElementId | null;
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

// Alinhamento = o "atributo" da criatura, equivalente direto ao Digimon:
// Poder ≈ Vírus · Harmonia ≈ Data · Benevolência ≈ Vacina. Tem MUITO peso
// visual: define silhueta, olhos e viés de paleta em todos os estágios.
export const ALIGNMENT_INFO: Record<AlignmentId, { name: LText; emoji: string; profile: LText; attribute: LText }> = {
  poder: {
    name: { pt: 'Poder', en: 'Power' }, emoji: '👑',
    profile: { pt: 'Busca conquistar, dominar desafios e deixar marca no mundo.', en: 'Seeks to conquer, master challenges and leave a mark on the world.' },
    attribute: { pt: 'Vírus', en: 'Virus' },
  },
  harmonia: {
    name: { pt: 'Harmonia', en: 'Harmony' }, emoji: '☯️',
    profile: { pt: 'Busca equilíbrio, conhecimento e o fluxo natural das coisas.', en: 'Seeks balance, knowledge and the natural flow of things.' },
    attribute: { pt: 'Data', en: 'Data' },
  },
  benevolencia: {
    name: { pt: 'Benevolência', en: 'Benevolence' }, emoji: '🕊️',
    profile: { pt: 'Busca cuidar, proteger e elevar quem está ao redor.', en: 'Seeks to care for, protect and uplift those around.' },
    attribute: { pt: 'Vacina', en: 'Vaccine' },
  },
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

// ---------------------------------------------------------------------------
// Quiz de personalidade — as respostas pontuam direto nos eixos (fazem parte
// da "leitura", junto com numerologia e astrologia).
// ---------------------------------------------------------------------------

export interface QuestionEffects {
  elements?: Partial<Record<ElementId, number>>;
  roles?: Partial<Record<RoleId, number>>;
  alignments?: Partial<Record<AlignmentId, number>>;
  realms?: Partial<Record<RealmId, number>>;
}

export interface OracleQuestion {
  id: string;
  text: LText;
  options: Array<{ id: string; text: LText; effects: QuestionEffects }>;
}

export const ORACLE_QUESTIONS: OracleQuestion[] = [
  {
    id: 'grupo',
    text: { pt: 'Num grupo, você costuma ser quem...', en: 'In a group, you are usually the one who...' },
    options: [
      { id: 'protege', text: { pt: 'Protege e segura as pontas', en: 'Protects and holds the line' }, effects: { roles: { tanque: 4 }, alignments: { benevolencia: 2 }, elements: { terra: 2 } } },
      { id: 'cuida', text: { pt: 'Cuida e apoia todo mundo', en: 'Cares for and supports everyone' }, effects: { roles: { suporte: 4 }, alignments: { benevolencia: 3 }, elements: { agua: 1, luz: 1 } } },
      { id: 'ataca', text: { pt: 'Vai pra cima e resolve no braço', en: 'Charges in and solves it head-on' }, effects: { roles: { fisico: 4 }, alignments: { poder: 3 }, elements: { fogo: 2 } } },
      { id: 'planeja', text: { pt: 'Planeja e enxerga o todo', en: 'Plans and sees the big picture' }, effects: { roles: { magico: 4 }, alignments: { harmonia: 3 }, elements: { sombra: 1, ar: 1 } } },
      { id: 'observa', text: { pt: 'Observa e age na hora certa', en: 'Watches and strikes at the right time' }, effects: { roles: { alcance: 4 }, alignments: { harmonia: 2 }, elements: { ar: 1, sombra: 1 } } },
    ],
  },
  {
    id: 'objetivo',
    text: { pt: 'Seu objetivo de vida se parece mais com...', en: 'Your life goal looks most like...' },
    options: [
      { id: 'conquistar', text: { pt: 'Conquistar e deixar minha marca', en: 'Conquering and leaving my mark' }, effects: { alignments: { poder: 4 }, elements: { fogo: 1 }, roles: { fisico: 1 } } },
      { id: 'sabedoria', text: { pt: 'Entender o mundo e me equilibrar', en: 'Understanding the world and finding balance' }, effects: { alignments: { harmonia: 4 }, elements: { luz: 1 }, roles: { magico: 1 } } },
      { id: 'cuidar', text: { pt: 'Cuidar de quem eu amo e elevar os outros', en: 'Caring for my loved ones and uplifting others' }, effects: { alignments: { benevolencia: 4 }, elements: { planta: 1 }, roles: { suporte: 1 } } },
      { id: 'liberdade', text: { pt: 'Ser livre e viver aventuras', en: 'Being free and living adventures' }, effects: { alignments: { harmonia: 2, poder: 1 }, elements: { ar: 2 }, roles: { alcance: 1 } } },
    ],
  },
  {
    id: 'pressao',
    text: { pt: 'Sob pressão, você...', en: 'Under pressure, you...' },
    options: [
      { id: 'explode', text: { pt: 'Explode e resolve com intensidade', en: 'Explode and solve with intensity' }, effects: { elements: { fogo: 3 }, alignments: { poder: 2 } } },
      { id: 'flui', text: { pt: 'Mantém a calma e flui com a situação', en: 'Stay calm and flow with it' }, effects: { elements: { agua: 3 }, alignments: { harmonia: 2 } } },
      { id: 'firme', text: { pt: 'Fica firme, sem se abalar', en: 'Stand firm, unshaken' }, effects: { elements: { terra: 3 }, roles: { tanque: 2 } } },
      { id: 'improvisa', text: { pt: 'Improvisa rápido e muda de rota', en: 'Improvise fast and change course' }, effects: { elements: { ar: 3 }, roles: { alcance: 1 } } },
      { id: 'recolhe', text: { pt: 'Se recolhe, analisa e volta com um plano', en: 'Withdraw, analyze and return with a plan' }, effects: { elements: { sombra: 3 }, roles: { magico: 2 } } },
    ],
  },
  {
    id: 'energia',
    text: { pt: 'O que te dá mais energia?', en: 'What energizes you the most?' },
    options: [
      { id: 'sol', text: { pt: 'Sol, gente e movimento', en: 'Sun, people and motion' }, effects: { elements: { luz: 3 }, alignments: { benevolencia: 1 } } },
      { id: 'noite', text: { pt: 'Noite, silêncio e mistério', en: 'Night, silence and mystery' }, effects: { elements: { sombra: 3 }, alignments: { harmonia: 1 } } },
      { id: 'natureza', text: { pt: 'Natureza, plantas e bichos', en: 'Nature, plants and animals' }, effects: { elements: { planta: 3 }, realms: { floresta: 2 } } },
      { id: 'tecnologia', text: { pt: 'Tecnologia, máquinas e sistemas', en: 'Technology, machines and systems' }, effects: { elements: { industrial: 3 }, roles: { alcance: 1 } } },
    ],
  },
  {
    id: 'lugar',
    text: { pt: 'Onde você se imagina vivendo?', en: 'Where do you imagine yourself living?' },
    options: [
      { id: 'praia', text: { pt: 'Perto do mar', en: 'Near the sea' }, effects: { realms: { oceano: 4 }, elements: { agua: 1 } } },
      { id: 'montanha', text: { pt: 'No alto das montanhas', en: 'High in the mountains' }, effects: { realms: { picos: 4 }, elements: { ar: 1 } } },
      { id: 'floresta', text: { pt: 'No meio da mata', en: 'Deep in the woods' }, effects: { realms: { floresta: 4 }, elements: { planta: 1 } } },
      { id: 'campo', text: { pt: 'Num campo tranquilo', en: 'In a peaceful field' }, effects: { realms: { campina: 4 }, elements: { luz: 1 } } },
      { id: 'extremos', text: { pt: 'Em lugares extremos (deserto, gelo...)', en: 'In extreme places (desert, ice...)' }, effects: { realms: { deserto: 2, gelo: 2 }, alignments: { poder: 1 } } },
      { id: 'oculto', text: { pt: 'Num lugar secreto (caverna, brejo, outro plano)', en: 'Somewhere hidden (cave, marsh, another plane)' }, effects: { realms: { cavernas: 2, pantano: 1, akasha: 1 }, elements: { sombra: 1 } } },
    ],
  },
  {
    id: 'conflito',
    text: { pt: 'Diante de um conflito injusto, você...', en: 'Facing an unfair conflict, you...' },
    options: [
      { id: 'enfrenta', text: { pt: 'Enfrenta de frente, custe o que custar', en: 'Face it head-on, whatever it takes' }, effects: { alignments: { poder: 3 }, roles: { fisico: 2 } } },
      { id: 'media', text: { pt: 'Media e busca o meio-termo justo', en: 'Mediate and seek the fair middle ground' }, effects: { alignments: { harmonia: 3 }, roles: { suporte: 1 } } },
      { id: 'defende', text: { pt: 'Defende quem não pode se defender', en: 'Defend those who cannot defend themselves' }, effects: { alignments: { benevolencia: 3 }, roles: { tanque: 2 } } },
      { id: 'estrategia', text: { pt: 'Age por trás, com estratégia', en: 'Act from behind the scenes, strategically' }, effects: { alignments: { poder: 1, harmonia: 1 }, elements: { sombra: 2 }, roles: { alcance: 1 } } },
    ],
  },
];

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

// Prefixos de nome por LINHA de evolução (uma linha por tipo) — o nome conta
// a história: Fang→War→Zeed (Vírus), Sage→Meta→Aeon (Data), Holy→Arch→Seraph
// (Vacina), e o Ultra é sempre Omni_.
const CHAMPION_PREFIXES: Record<AlignmentId, string[]> = {
  poder: ['Fang', 'Dark', 'Rage', 'Grim'],
  harmonia: ['Sage', 'Rune', 'Gale', 'Echo'],
  benevolencia: ['Holy', 'Sol', 'Aegis', 'Bell'],
};
const PERFECT_STAGE_PREFIXES: Record<AlignmentId, string[]> = {
  poder: ['War', 'Chaos', 'Doom'],
  harmonia: ['Meta', 'Astra', 'Prime'],
  benevolencia: ['Arch', 'Radiant', 'Lumen'],
};
const MEGA_STAGE_PREFIXES: Record<AlignmentId, string[]> = {
  poder: ['Zeed', 'Omega', 'Abyss'],
  harmonia: ['Aeon', 'Zenith', 'Cosmo'],
  benevolencia: ['Seraph', 'Ultima', 'Elysium'],
};

// ---------------------------------------------------------------------------
// POOL DE FORMAS DE EVOLUÇÃO por nível — arquétipos corporais no espírito dos
// Digimon (e um pouco de Pokémon): shapes variados por estágio, com afinidade
// de tipo (alignments) e de elemento (elements). Vazio = serve para qualquer.
// A forma é sorteada por linha, sem repetir entre as 9 evoluções.
// ---------------------------------------------------------------------------

interface EvoShape { pt: string; en: string; elements: ElementId[]; alignments: AlignmentId[] }

const CHAMPION_SHAPES: EvoShape[] = [
  { pt: 'dinossauro tirano bípede com elmo de caveira', en: 'a bipedal tyrant dinosaur with a horned skull helm', elements: ['fogo', 'terra'], alignments: ['poder'] },
  { pt: 'fera lupina selvagem de quatro patas', en: 'a savage four-legged wolf beast with bristling fur', elements: ['sombra', 'agua'], alignments: ['poder', 'harmonia'] },
  { pt: 'ogro brutamontes com clava de osso', en: 'a hulking ogre brute swinging a bone club', elements: ['terra'], alignments: ['poder'] },
  { pt: 'guerreiro demônio de asas rasgadas', en: 'a horned demon warrior with tattered wings', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'predador marinho de barbatanas-navalha', en: 'a razor-finned sea predator with a harpoon snout', elements: ['agua'], alignments: ['poder'] },
  { pt: 'serpente venenosa de capuz', en: 'a hooded venomous serpent with dripping fangs', elements: ['sombra', 'planta'], alignments: ['poder'] },
  { pt: 'planta carnívora ambulante', en: 'a walking carnivorous plant with snapping jaw-buds', elements: ['planta'], alignments: ['poder'] },
  { pt: 'fera elegante de cauda-lâmina', en: 'a sleek quadruped beast with a blade-tipped tail', elements: [], alignments: ['harmonia'] },
  { pt: 'inseto blindado de chifre elétrico', en: 'a giant armored insect with a crackling electric horn', elements: ['industrial', 'ar'], alignments: ['harmonia'] },
  { pt: 'coruja-fera de asas rúnicas', en: 'a great owl beast with rune-marked wings', elements: ['ar', 'sombra'], alignments: ['harmonia'] },
  { pt: 'golem sentinela de pedra', en: 'a stone golem sentinel with glowing core lines', elements: ['terra'], alignments: ['harmonia'] },
  { pt: 'raposa mística de várias caudas', en: 'a mystic fox with multiple flowing tails', elements: ['sombra', 'luz'], alignments: ['harmonia'] },
  { pt: 'autômato andarilho de engrenagens', en: 'a clockwork walker automaton with brass joints', elements: ['industrial'], alignments: ['harmonia'] },
  { pt: 'dragão-marinho de coral', en: 'a coral sea-dragon with gem-like eyes', elements: ['agua'], alignments: ['harmonia'] },
  { pt: 'corcel alado nobre', en: 'a noble winged stallion with a shining mane', elements: ['luz', 'ar'], alignments: ['benevolencia'] },
  { pt: 'cão de guarda em armadura de bronze', en: 'a loyal guardian hound in bronze armor', elements: ['luz', 'terra'], alignments: ['benevolencia'] },
  { pt: 'lutador angélico de bastão sagrado', en: 'an angelic fighter wielding a sacred staff', elements: ['luz'], alignments: ['benevolencia'] },
  { pt: 'dragão-flor de asas de pétala', en: 'a flower dragon with petal wings', elements: ['planta'], alignments: ['benevolencia'] },
  { pt: 'yeti guardião das neves', en: 'a gentle snow yeti guardian with icicle bracers', elements: ['agua', 'terra'], alignments: ['benevolencia'] },
  { pt: 'ave-canora gigante da alvorada', en: 'a giant dawn songbird with radiant tail feathers', elements: ['ar', 'luz'], alignments: ['benevolencia'] },
  { pt: 'fera de juba flamejante', en: 'a proud beast with a blazing flame mane', elements: ['fogo'], alignments: [] },
  { pt: 'raptor relâmpago', en: 'a lightning raptor crackling with static', elements: ['ar', 'industrial'], alignments: [] },
  { pt: 'marionete assombrada', en: 'a haunted marionette with living strings', elements: ['sombra', 'industrial'], alignments: ['poder', 'harmonia'] },
  { pt: 'tartaruga guerreira de rio', en: 'a river turtle warrior with a shell-shield', elements: ['agua', 'terra'], alignments: [] },
];

const PERFECT_SHAPES: EvoShape[] = [
  { pt: 'dino ciborgue com canhão no peito', en: 'a cyborg dinosaur with a metal chest cannon and one mechanical arm', elements: ['industrial', 'fogo'], alignments: ['poder'] },
  { pt: 'nobre vampiro de capa alta', en: 'a vampire noble with a high-collared cape and piercing gaze', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'general demônio de seis braços', en: 'a six-armed demon general gripping many weapons', elements: ['sombra', 'fogo'], alignments: ['poder'] },
  { pt: 'ceifador espectral de foice', en: 'a spectral reaper wraith carrying a great scythe', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'leviatã couraçado colossal', en: 'a colossal armored leviathan breaching the deep', elements: ['agua'], alignments: ['poder'] },
  { pt: 'minotauro de guerra acorrentado', en: 'a chained war minotaur with cracked horns', elements: ['terra', 'fogo'], alignments: ['poder'] },
  { pt: 'cavaleiro de armadura completa', en: 'a full-plate armored knight with a greatsword', elements: ['industrial', 'terra'], alignments: ['harmonia', 'benevolencia'] },
  { pt: 'besouro-samurai senhor da lâmina', en: 'a samurai beetle lord with katana-shaped horn blades', elements: ['industrial', 'planta'], alignments: ['harmonia'] },
  { pt: 'mago dos espelhos', en: 'a mirror mage whose body reflects like polished glass', elements: ['luz', 'agua'], alignments: ['harmonia'] },
  { pt: 'místico do planetário', en: 'an orrery mystic with tiny planets orbiting its shoulders', elements: ['luz', 'sombra'], alignments: ['harmonia'] },
  { pt: 'esfinge enigmática', en: 'an enigmatic sphinx posing eternal riddles', elements: ['luz', 'terra'], alignments: ['harmonia'] },
  { pt: 'atirador ciborgue de precisão', en: 'a precision cyborg gunner frame with a long-barrel arm', elements: ['industrial'], alignments: ['harmonia'] },
  { pt: 'rainha-inseto da colmeia', en: 'a regal insect queen with layered wing veils', elements: ['planta', 'ar'], alignments: ['harmonia'] },
  { pt: 'valquíria de lança luminosa', en: 'a valkyrie with a luminous lance and winged helm', elements: ['luz', 'ar'], alignments: ['benevolencia'] },
  { pt: 'sumo-sacerdote bestial', en: 'a beastly high priest in ceremonial vestments', elements: ['luz'], alignments: ['benevolencia'] },
  { pt: 'paladino canino de escudo duplo', en: 'a canine paladin bearing twin shields', elements: ['luz', 'terra'], alignments: ['benevolencia'] },
  { pt: 'rainha do jardim vivo', en: 'a garden queen whose gown blooms with living flowers', elements: ['planta'], alignments: ['benevolencia'] },
  { pt: 'dama da geleira', en: 'a glacier maiden crowned with aurora ice', elements: ['agua', 'luz'], alignments: ['benevolencia'] },
  { pt: 'harpia rainha das tempestades', en: 'a storm harpy queen wreathed in lightning', elements: ['ar'], alignments: [] },
  { pt: 'ancião treant de galhos sábios', en: 'an elder treant with wise branching antlers', elements: ['planta', 'terra'], alignments: [] },
  { pt: 'juggernaut de magma', en: 'a magma juggernaut with molten armor seams', elements: ['fogo', 'terra'], alignments: [] },
];

const MEGA_SHAPES: EvoShape[] = [
  { pt: 'dragão soberano de armadura negra', en: 'a dragon overlord clad in black spiked armor', elements: ['fogo', 'sombra'], alignments: ['poder'] },
  { pt: 'deus-demônio do abismo', en: 'an abyssal demon god wreathed in dark flames', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'deus da guerra berserker de machados gêmeos', en: 'a berserker war god swinging twin great-axes', elements: ['fogo', 'terra'], alignments: ['poder'] },
  { pt: 'serpente do fim que morde o horizonte', en: 'a doom serpent vast enough to bite the horizon', elements: ['agua', 'sombra'], alignments: ['poder'] },
  { pt: 'kaiju de ferro fumegante', en: 'a smoldering iron kaiju with furnace eyes', elements: ['industrial', 'fogo'], alignments: ['poder'] },
  { pt: 'lorde lobisomem da lua de sangue', en: 'a blood-moon werewolf lord in shredded regalia', elements: ['sombra'], alignments: ['poder'] },
  { pt: 'dragão cósmico da ordem', en: 'a cosmic dragon whose scales map the constellations', elements: ['luz', 'ar'], alignments: ['harmonia'] },
  { pt: 'divindade-máquina de anéis orbitais', en: 'a machine deity with orbital rings and a satellite halo', elements: ['industrial'], alignments: ['harmonia'] },
  { pt: 'soberano do tempo com auréola de relógio', en: 'a time sovereign crowned with a clockwork halo', elements: ['industrial', 'luz'], alignments: ['harmonia'] },
  { pt: 'imperador-fera dos sábios', en: 'a sage emperor beast draped in scholar silks', elements: ['terra', 'luz'], alignments: ['harmonia'] },
  { pt: 'imperatriz-esfinge estelar', en: 'a star sphinx empress with galaxy-pattern wings', elements: ['sombra', 'luz'], alignments: ['harmonia'] },
  { pt: 'duelista divino de mercúrio', en: 'a quicksilver divine duelist with liquid-metal blades', elements: ['agua', 'industrial'], alignments: ['harmonia'] },
  { pt: 'cavaleiro sagrado de branco e ouro', en: 'a holy knight in white-and-gold plate armor with a cape', elements: ['luz'], alignments: ['benevolencia'] },
  { pt: 'serafim de dez asas', en: 'a ten-winged seraph radiating gentle light', elements: ['luz', 'ar'], alignments: ['benevolencia'] },
  { pt: 'deusa da vida do jardim eterno', en: 'a life goddess of the eternal garden trailing blossoms', elements: ['planta', 'luz'], alignments: ['benevolencia'] },
  { pt: 'imperador fênix solar', en: 'a solar phoenix emperor with a corona crest', elements: ['fogo', 'luz'], alignments: ['benevolencia'] },
  { pt: 'colosso guardião da cidadela', en: 'a citadel guardian colossus sheltering a tiny town on its back', elements: ['terra'], alignments: ['benevolencia'] },
  { pt: 'soberana curadora dos oceanos', en: 'an ocean sovereign healer robed in living tides', elements: ['agua'], alignments: ['benevolencia'] },
  { pt: 'avatar da árvore-mundo', en: 'a world-tree avatar with continents of moss on its shoulders', elements: ['planta', 'terra'], alignments: [] },
  { pt: 'deus-cervo da aurora', en: 'an aurora stag god with antlers of northern lights', elements: ['luz', 'agua'], alignments: [] },
  { pt: 'fera de duas almas yin-yang', en: 'a twin-souled yin-yang beast, half light and half shadow', elements: ['luz', 'sombra'], alignments: [] },
];

/** Sorteia uma forma de evolução: prioriza afinidade de tipo e de elemento,
 *  nunca repete forma entre as 9 evoluções da mesma criatura. */
function pickShape(
  rng: () => number,
  pool: EvoShape[],
  branch: AlignmentId,
  elements: ElementId[],
  used: Set<string>,
): EvoShape {
  let candidates = pool.filter(s => !used.has(s.en) && (s.alignments.length === 0 || s.alignments.includes(branch)));
  const elMatches = candidates.filter(s => s.elements.length === 0 || s.elements.some(e => elements.includes(e)));
  if (elMatches.length >= 2) candidates = elMatches;
  if (candidates.length === 0) candidates = pool.filter(s => !used.has(s.en));
  if (candidates.length === 0) candidates = pool;
  const shape = pick(rng, candidates);
  used.add(shape.en);
  return shape;
}

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
  { pt: 'tubarão', en: 'shark', elements: ['agua'], realms: ['oceano'] },
  { pt: 'enguia elétrica', en: 'electric eel', elements: ['agua', 'industrial'], realms: ['oceano', 'pantano'] },
  { pt: 'caranguejo', en: 'crab', elements: ['agua', 'terra'], realms: ['oceano'] },
  { pt: 'louva-a-deus', en: 'praying mantis', elements: ['planta'], realms: ['floresta', 'campina'] },
  { pt: 'javali', en: 'wild boar', elements: ['terra'], realms: ['floresta'] },
  { pt: 'texugo', en: 'badger', elements: ['terra'], realms: ['floresta', 'cavernas'] },
  { pt: 'camaleão', en: 'chameleon', elements: ['planta', 'sombra'], realms: ['floresta', 'pantano'] },
  { pt: 'gato selvagem', en: 'wildcat', elements: ['sombra', 'fogo'], realms: ['floresta', 'deserto'] },
  { pt: 'águia', en: 'eagle', elements: ['ar', 'luz'], realms: ['picos'] },
  { pt: 'mangusto', en: 'mongoose', elements: ['fogo'], realms: ['deserto', 'campina'] },
  { pt: 'tatu', en: 'armadillo', elements: ['terra'], realms: ['deserto', 'campina'] },
  { pt: 'alce', en: 'moose', elements: ['terra', 'planta'], realms: ['gelo', 'floresta'] },
  { pt: 'foca', en: 'seal', elements: ['agua'], realms: ['gelo', 'oceano'] },
  { pt: 'salamandra de neon', en: 'neon axolotl', elements: ['industrial', 'agua'], realms: ['akasha', 'oceano'] },
  { pt: 'gênio de fumaça', en: 'smoke djinn', elements: ['sombra', 'ar'], realms: ['akasha', 'deserto'] },
  { pt: 'carbúnculo', en: 'carbuncle', elements: ['luz', 'terra'], realms: ['akasha', 'cavernas'] },
  { pt: 'ouriço', en: 'hedgehog', elements: ['terra', 'planta'], realms: ['campina', 'floresta'] },
  // Pedidos comuns na descrição livre do pet — precisam existir p/ casar por nome
  { pt: 'dragão', en: 'dragon', elements: ['fogo'], realms: ['picos', 'cavernas'] },
  { pt: 'urso', en: 'bear', elements: ['terra'], realms: ['floresta', 'gelo'] },
  { pt: 'gato', en: 'cat', elements: ['sombra'], realms: ['campina', 'akasha'] },
  { pt: 'cachorro', en: 'dog', elements: ['luz'], realms: ['campina'] },
  { pt: 'dinossauro', en: 'dinosaur', elements: ['terra', 'fogo'], realms: ['deserto', 'floresta'] },
  { pt: 'macaco', en: 'monkey', elements: ['planta'], realms: ['floresta'] },
  { pt: 'panda', en: 'panda', elements: ['planta', 'terra'], realms: ['floresta'] },
];

// POOLS por elemento: paletas e texturas variadas (sorteio semeado)
const ELEMENT_PALETTES: Record<ElementId, string[]> = {
  agua: [
    'cool blue and teal color palette',
    'deep navy and seafoam color palette',
    'turquoise and pearl-white color palette',
  ],
  fogo: [
    'warm red, orange and ember-yellow color palette',
    'crimson and charcoal-smoke color palette',
    'sunset orange and molten-gold color palette',
  ],
  terra: [
    'earthy brown and ochre color palette',
    'clay-red and sandstone color palette',
    'moss-brown and slate color palette',
  ],
  ar: [
    'sky blue, white and pale silver color palette',
    'cloud-white and periwinkle color palette',
    'pale gray-blue and silver-lining color palette',
  ],
  sombra: [
    'deep purple and charcoal color palette',
    'midnight blue and smoky black color palette',
    'dark violet and ash-gray color palette',
  ],
  luz: [
    'golden yellow, white and warm cream color palette',
    'dawn-pink and radiant white color palette',
    'amber and ivory color palette',
  ],
  planta: [
    'leafy green and lime color palette',
    'deep fern and blossom-pink color palette',
    'sage green and sunflower color palette',
  ],
  industrial: [
    'steel gray and gunmetal color palette',
    'brass and copper machinery color palette',
    'chrome and hazard-yellow color palette',
  ],
};

const ELEMENT_TEXTURES: Record<ElementId, string[]> = {
  agua: [
    'smooth glossy skin with small fins and droplet shapes',
    'scaled hide with rippling wave patterns',
    'translucent jelly-like body parts with bubble details',
    'sleek wet-look coat with tide-line markings',
  ],
  fogo: [
    'ember-flecked hide with tiny flame tufts',
    'charcoal-cracked skin glowing from within',
    'smoldering fur with sparks at the tips',
    'smooth magma-vein patterns across the body',
  ],
  terra: [
    'cracked stone plates and pebble bumps',
    'compact clay body with carved groove patterns',
    'crystal shards growing from the shoulders and back',
    'sandy hide with fossil-like spiral marks',
  ],
  ar: [
    'fluffy feather-down and cloud-like puffs',
    'streamlined body with wind-groove lines',
    'wispy tufts that trail like small contrails',
    'light plumage with layered feather rows',
  ],
  sombra: [
    'sleek dark velvet fur with faint glow marks',
    'smoky edges that fade like mist',
    'ink-black patches with tiny star-like specks',
    'matte shadowy carapace with a single glowing seam',
  ],
  luz: [
    'softly glowing pearl-like skin',
    'prism-scale patches that catch the light',
    'radiant fur with a faint halo shimmer',
    'stained-glass-like translucent panels on the body',
  ],
  planta: [
    'leaf-scale skin with sprouts and buds',
    'bark-plated limbs with moss patches',
    'petal-layered coat with a flower bud somewhere',
    'vine-wrapped body with tiny berries',
  ],
  industrial: [
    'riveted metal plates with visible gears',
    'segmented chassis with piston joints',
    'brass clockwork panels with a small wind-up key',
    'wired body with blinking indicator lights',
  ],
};

// Características avulsas (sorteio semeado — aumentam a variedade combinatória)
const CRESTS = [
  'small curved horns', 'branching antlers', 'a fin-shaped crest', 'a sprouting leaf on the head',
  'a tiny gear halo', 'crystal spikes along the head', 'a flame tuft on the forehead', 'an icicle crown',
  'a mushroom cap hat', 'insect antennae', 'a third-eye gem on the forehead', 'a star-shaped emblem on the brow',
  'a single spiral unicorn nub', 'a mohawk of stiff bristles', 'droopy long ears like a hood',
  'a cracked half-mask over one eye', 'a floating tiny crown that never touches the head', 'twin feather plumes',
  'a bone-white skull cap', 'a glowing rune etched on the forehead',
];

const TAILS = [
  'a stubby round tail', 'a long whip-like tail with a glowing tip', 'a leafy vine tail',
  'a segmented armored tail', 'a fluffy fan tail', 'a coiled spring tail', 'twin ribbon tails',
  'a crystal-tipped tail', 'a little flame tail', 'no tail at all',
  'a paddle-shaped swimming tail', 'a scorpion-curl tail held high', 'a peacock-fan tail kept folded',
  'a plug-and-cable tail', 'a fox-brush tail with a pale tip', 'a chain-link tail ending in a tiny weight',
];

// Marcas corporais por alinhamento (pool)
const ALIGNMENT_MARKINGS: Record<AlignmentId, string[]> = {
  poder: [
    'bold jagged war-paint stripes on the body',
    'claw-slash markings raked across the flank',
    'cracked-glass fracture lines glowing faintly',
    'tally-mark scratches counting victories',
  ],
  harmonia: [
    'concentric ring and spiral markings on the body',
    'perfectly symmetric mandala patterns on the back',
    'thin meridian lines tracing the body like a map',
    'yin-yang teardrop marks on the shoulders',
  ],
  benevolencia: [
    'small heart and star speckle markings on the body',
    'soft cloud-and-sun patches on the chest',
    'a pale guardian sigil over the heart',
    'freckle constellations that form a smile',
  ],
};

const ROLE_MOTIFS: Record<RoleId, string[]> = {
  suporte: [
    'carrying a small healing charm, kind expression',
    'a first-aid pouch slung across the body, attentive eyes',
    'a tiny bell that chimes to rally allies, gentle look',
  ],
  tanque: [
    'wearing chunky shield-like armor pieces, sturdy stance',
    'a heavy collar-guard and knuckle plates, grounded pose',
    'one oversized armored shoulder it leans into, stoic look',
  ],
  fisico: [
    'with bold little claws or fists, energetic pose',
    'wrapped sparring bandages on the paws, bouncing on its feet',
    'a cracked training dummy strap as a trophy, eager grin',
  ],
  magico: [
    'with a floating rune orb beside it, mystical gaze',
    'a spellbook page tucked under one arm, knowing look',
    'faint glyphs circling one raised paw, focused eyes',
  ],
  alcance: [
    'with a tiny slingshot or shoulder cannon, focused eyes',
    'a spotting scope held to one eye, patient posture',
    'a bandolier of pebble-ammo across the chest, steady aim',
  ],
};

// ---------------------------------------------------------------------------
// Descrição livre do pet — palavras-chave (PT/EN) que pontuam nos eixos.
// A descrição também é injetada crua no prompt (50% de peso).
// ---------------------------------------------------------------------------

const DESC_KEYWORDS: {
  elements: Record<ElementId, string[]>;
  realms: Record<RealmId, string[]>;
  alignments: Record<AlignmentId, string[]>;
  roles: Record<RoleId, string[]>;
} = {
  elements: {
    agua: ['agua', 'mar', 'oceano', 'peixe', 'azul', 'chuva', 'rio', 'onda', 'aquatic', 'water', 'sea', 'fish', 'blue', 'rain', 'wave'],
    fogo: ['fogo', 'chama', 'lava', 'brasa', 'vermelho', 'quente', 'vulcao', 'fire', 'flame', 'ember', 'red', 'burn', 'volcano'],
    terra: ['terra', 'pedra', 'rocha', 'montanha', 'marrom', 'cristal', 'areia', 'earth', 'stone', 'rock', 'brown', 'crystal', 'sand'],
    ar: ['vento', 'voar', 'asas', 'ceu', 'nuvem', 'passaro', 'leve', 'wind', 'fly', 'wings', 'sky', 'cloud', 'bird', 'feather'],
    sombra: ['sombra', 'escuro', 'noite', 'roxo', 'preto', 'misterio', 'lua', 'shadow', 'dark', 'night', 'purple', 'black', 'moon', 'mist'],
    luz: ['luz', 'brilho', 'dourado', 'sol', 'estrela', 'sagrado', 'anjo', 'light', 'glow', 'golden', 'sun', 'star', 'holy', 'angel'],
    planta: ['planta', 'folha', 'flor', 'verde', 'arvore', 'musgo', 'semente', 'plant', 'leaf', 'flower', 'green', 'tree', 'moss', 'seed'],
    industrial: ['metal', 'robo', 'maquina', 'engrenagem', 'cromado', 'aco', 'cyber', 'robot', 'machine', 'gear', 'chrome', 'steel', 'mech', 'tech'],
  },
  realms: {
    deserto: ['deserto', 'duna', 'arido', 'desert', 'dune', 'arid'],
    picos: ['pico', 'tempestade', 'raio', 'trovao', 'montanha', 'peak', 'storm', 'lightning', 'thunder'],
    oceano: ['oceano', 'abissal', 'profundo', 'mar', 'ocean', 'abyss', 'deep sea'],
    pantano: ['pantano', 'brejo', 'lodo', 'veneno', 'toxico', 'swamp', 'marsh', 'bog', 'poison', 'toxic'],
    floresta: ['floresta', 'mata', 'selva', 'bosque', 'forest', 'jungle', 'woods'],
    cavernas: ['caverna', 'gruta', 'subterraneo', 'cave', 'cavern', 'underground'],
    gelo: ['gelo', 'neve', 'frio', 'congelado', 'artico', 'ice', 'snow', 'cold', 'frozen', 'arctic'],
    campina: ['campo', 'campina', 'prado', 'jardim', 'meadow', 'field', 'garden', 'prairie'],
    akasha: ['espirito', 'etereo', 'cosmico', 'astral', 'dimensao', 'spirit', 'ethereal', 'cosmic', 'astral', 'void'],
  },
  alignments: {
    poder: ['feroz', 'bravo', 'selvagem', 'garra', 'presa', 'espinho', 'assustador', 'forte', 'fierce', 'wild', 'savage', 'claw', 'fang', 'spike', 'scary', 'strong', 'demon', 'demonio'],
    harmonia: ['calmo', 'sereno', 'sabio', 'equilibrado', 'zen', 'inteligente', 'calm', 'serene', 'wise', 'balanced', 'smart', 'neutral'],
    benevolencia: ['fofo', 'gentil', 'protetor', 'amoroso', 'heroi', 'nobre', 'bondoso', 'cute', 'gentle', 'protective', 'loving', 'hero', 'noble', 'kind'],
  },
  roles: {
    suporte: ['curar', 'cuidar', 'apoiar', 'heal', 'care', 'support'],
    tanque: ['escudo', 'armadura', 'defender', 'proteger', 'shield', 'armor', 'defend', 'protect', 'tank'],
    fisico: ['lutar', 'garras', 'punho', 'briga', 'fight', 'punch', 'melee', 'brawl'],
    magico: ['magia', 'feitico', 'runa', 'arcano', 'magic', 'spell', 'rune', 'arcane', 'wizard', 'mago'],
    alcance: ['arco', 'flecha', 'canhao', 'atirar', 'longe', 'bow', 'arrow', 'cannon', 'shoot', 'sniper', 'ranged'],
  },
};

/** Normaliza texto para casar palavras-chave (minúsculas, sem acento). */
function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function countKeywordHits<K extends string>(text: string, dict: Record<K, string[]>, keys: K[]): Record<K, number> {
  const hits = Object.fromEntries(keys.map(k => [k, 0])) as Record<K, number>;
  for (const key of keys) {
    for (const kw of dict[key]) {
      if (text.includes(kw)) hits[key] += 1;
    }
  }
  return hits;
}

// Estilo-base dos sprites, descrito em texto porque a ferramenta de imagem
// (Nanobanana) não aceita imagem de referência. Lições aprendidas:
// 1. Modelos genéricos tratam "pixel art" como ilustração com filtro — o
//    estilo precisa DOMINAR o prompt (vem primeiro e é repetido no fim).
// 2. Detalhe demais briga com o grid: descrição rica ⇒ ilustração rica.
//    Por isso os prompts pedem SIMPLIFICAÇÃO radical e listam pouquíssimas
//    características por forma.
const SPRITE_STYLE_BASE =
  'pixel art sprite, authentic 8-bit retro style, exactly like an original 1997 Tamagotchi / Digimon ' +
  'virtual pet LCD creature or a Game Boy Color monster sprite';

// Grid mínimo real de v-pet: 16x16 e pouquíssimas cores em TODOS os estágios
// (nos v-pets originais até o mega é 16x16 — a evolução é o DESENHO mudar).
const SPRITE_SPEC =
  'drawn on a tiny 16x16 pixel grid, shown enlarged with big clearly visible square pixels ' +
  '(hard nearest-neighbor edges), maximum 4 flat solid colors plus black outline';

// Âncora de simplificação — vem DEPOIS da descrição para reancorar o estilo
const SPRITE_SIMPLIFY =
  'IMPORTANT: extremely simplified — at 16x16 only the 2 or 3 most essential features can exist, ' +
  'omit every fine detail, no shading, no gradients, no anti-aliasing, no smooth curves, ' +
  'blocky chunky forms, oversized head, eyes are 1-2 dark pixels';

const SPRITE_STYLE_END =
  'single full-body sprite centered on a plain white background, no text, no watermark, no frame, ' +
  'the final image must look like a zoomed-in screenshot of a real retro handheld game sprite, ' +
  'NOT a detailed illustration';

// ----- Progressão conceitual -----
// Cada estágio é uma TRANSFORMAÇÃO de conceito, não um "crescimento":
//   criança  = forma larval adormecida (só a herança da base A visível)
//   adulto   = despertar da fusão (base B emerge, plano corporal definido)
//   perfeito = metamorfose de função (vira um "ofício" encarnado + elemento
//              secundário materializado + emblema do reino)
//   mega     = apoteose do alinhamento (regalia + corpo transmutado no elemento)
// O núcleo persiste: mesmo rosto, mesma crista-assinatura, mesma família de cores.

const BODY_PLANS: Array<{ en: string; pt: string }> = [
  { en: 'small bipedal', pt: 'bípede compacto' },
  { en: 'sturdy quadruped', pt: 'quadrúpede robusto' },
  { en: 'winged bipedal', pt: 'bípede alado' },
  { en: 'serpentine coiled', pt: 'serpentino enrolado' },
  { en: 'floating levitating', pt: 'flutuante' },
];

const ROLE_METAMORPHS: Record<RoleId, Array<{ en: string; pt: string }>> = {
  tanque: [
    { en: 'a bulwark knight: heavy segmented armor plates, massive pauldrons and one arm shaped like a tower shield', pt: 'cavaleiro-baluarte: placas de armadura segmentada, ombreiras massivas e um braço em forma de escudo-torre' },
    { en: 'a living fortress: castle-wall plating, battlement ridges along the back and a gate-like chest guard', pt: 'fortaleza viva: blindagem de muralha, ameias ao longo das costas e um protetor de peito em forma de portão' },
    { en: 'an immovable colossus: dense oversized forearms planted like pillars and a low unshakable stance', pt: 'colosso imóvel: antebraços densos e desproporcionais fincados como pilares e postura baixa inabalável' },
  ],
  suporte: [
    { en: 'a radiant cleric: flowing vestment drapes, a relic censer and small floating healing orbs', pt: 'clérigo radiante: vestes esvoaçantes, um turíbulo-relíquia e pequenos orbes de cura flutuantes' },
    { en: 'a field medic spirit: satchels of remedies, bandage wraps and a stretcher-tail for carrying allies', pt: 'espírito de médico de campo: bolsas de remédios, faixas enroladas e uma cauda-maca para carregar aliados' },
    { en: 'a hearth keeper: a warm lantern staff, a cloak that shelters smaller creatures and steam of comfort rising', pt: 'guardião da lareira: cajado-lanterna aquecido, manto que abriga criaturas menores e vapor de conforto subindo' },
  ],
  fisico: [
    { en: 'a battle master: reinforced gauntlets, blade-like limb edges and a fierce combat stance', pt: 'mestre de batalha: manoplas reforçadas, membros com bordas de lâmina e postura feroz de combate' },
    { en: 'a martial-arts adept: wrapped fists, a training-belt sash and a coiled ready-to-strike pose', pt: 'adepto de artes marciais: punhos enfaixados, faixa de treinamento e pose enrolada pronta pro golpe' },
    { en: 'a wild brawler: cracked knuckle guards, a torn cape and claw marks raked across its own armor', pt: 'brigador selvagem: proteções de punho rachadas, capa rasgada e marcas de garra riscadas na própria armadura' },
  ],
  magico: [
    { en: 'an arcane sage: rune-etched robe folds, a floating grimoire and glowing sigils orbiting the body', pt: 'sábio arcano: dobras de manto gravadas com runas, um grimório flutuante e sigilos brilhantes orbitando o corpo' },
    { en: 'an elemental conduit: energy channels glowing along the limbs and a focusing crystal at the chest', pt: 'condutor elemental: canais de energia brilhando pelos membros e um cristal focalizador no peito' },
    { en: 'a hex weaver: threads of spell-light between the fingers and charm talismans hanging from the crest', pt: 'tecelão de feitiços: fios de luz-mágica entre os dedos e talismãs pendurados na crista' },
  ],
  alcance: [
    { en: 'a sharpshooter: a long arm-cannon, a targeting visor over one eye and stabilizer fins', pt: 'atirador de elite: um longo canhão no braço, visor de mira sobre um olho e aletas estabilizadoras' },
    { en: 'a phantom archer: an energy bow grown from the forearm and a quiver of light arrows on the back', pt: 'arqueiro fantasma: um arco de energia crescido do antebraço e uma aljava de flechas de luz nas costas' },
    { en: 'an artillery frame: shoulder-mounted launchers, ammo-belt details and fold-out bipod legs', pt: 'chassi de artilharia: lançadores nos ombros, detalhes de cinto de munição e pernas-bipé dobráveis' },
  ],
};

// O elemento vira matéria física no estágio perfeito (pool por elemento)
const ELEMENT_MANIFESTS: Record<ElementId, Array<{ en: string; pt: string }>> = {
  agua: [
    { en: 'flowing water veils and liquid ribbons around the limbs', pt: 'véus de água corrente e fitas líquidas nos membros' },
    { en: 'a living tide that swirls around its feet', pt: 'uma maré viva que rodopia em volta dos pés' },
    { en: 'frost-and-spray armor condensing over the shoulders', pt: 'armadura de bruma e respingo condensada nos ombros' },
  ],
  fogo: [
    { en: 'magma plating and glowing ember vents on the shoulders', pt: 'placas de magma e aberturas de brasa nos ombros' },
    { en: 'a mane of controlled flame down the spine', pt: 'uma juba de chama controlada ao longo da espinha' },
    { en: 'twin torch-tips burning at the elbows', pt: 'duas pontas de tocha ardendo nos cotovelos' },
  ],
  terra: [
    { en: 'heavy stone slabs growing from the back and forearms', pt: 'lajes de pedra crescendo das costas e antebraços' },
    { en: 'floating orbiting boulders bound to its will', pt: 'pedregulhos flutuantes orbitando sob seu comando' },
    { en: 'crystal gauntlets crusted over the fists', pt: 'manoplas de cristal incrustadas nos punhos' },
  ],
  ar: [
    { en: 'wind-swept plumes and small cyclone rings around the arms', pt: 'plumas ao vento e pequenos anéis de ciclone nos braços' },
    { en: 'a personal whirlwind that lifts it slightly off the ground', pt: 'um redemoinho pessoal que o ergue de leve do chão' },
    { en: 'blade-thin air currents visible as white streaks', pt: 'correntes de ar finas como lâminas, visíveis em riscos brancos' },
  ],
  sombra: [
    { en: 'smoky shadow trails and a dark mist cloak', pt: 'rastros de sombra fumegante e um manto de névoa escura' },
    { en: 'its own shadow moving independently as a second pair of arms', pt: 'a própria sombra se movendo sozinha como um segundo par de braços' },
    { en: 'a veil of dusk that dims the light around it', pt: 'um véu de crepúsculo que escurece a luz ao redor' },
  ],
  luz: [
    { en: 'shards of solid light forming a broken halo', pt: 'estilhaços de luz sólida formando uma auréola partida' },
    { en: 'sunbeam ribbons woven through its limbs', pt: 'fitas de raio de sol trançadas nos membros' },
    { en: 'a constellation of small stars orbiting the crest', pt: 'uma constelação de estrelinhas orbitando a crista' },
  ],
  planta: [
    { en: 'blooming vines, bark guards and flower buds along the body', pt: 'vinhas floridas, proteções de casca e botões de flor pelo corpo' },
    { en: 'a small living garden sprouting along the spine', pt: 'um pequeno jardim vivo brotando ao longo da espinha' },
    { en: 'root-whips coiled around the forearms', pt: 'chicotes de raiz enrolados nos antebraços' },
  ],
  industrial: [
    { en: 'bolted mechanical augments, pistons and antenna arrays', pt: 'implementos mecânicos parafusados, pistões e antenas' },
    { en: 'deployable turbine wings folded on the back', pt: 'asas-turbina retráteis dobradas nas costas' },
    { en: 'a humming power core visible in the chest', pt: 'um núcleo de energia zumbindo visível no peito' },
  ],
};

// Linguagem de design por alinhamento — entra CEDO no prompt e em TODOS os
// estágios, como o atributo dos Digimon (Vírus/Data/Vacina). POOL grande por
// tipo: nem todo Vírus é demoníaco, mas é sempre mais feroz, voraz e
// perspicaz; nem todo Vacina é angelical, mas é sempre nobre e protetor.
const ALIGNMENT_DESIGNS: Record<AlignmentId, string[]> = {
  poder: [
    'VIRUS-attribute design language: jagged asymmetric silhouette, sharp angular spikes, small fangs and pointed claws, mischievous fierce eyes with narrow pupils, one aggressive blood-red accent, villainous but charming look',
    'VIRUS-attribute design language: apex-predator build, lean muscular stance ready to pounce, slit predatory eyes, scratch-mark motifs, one deep crimson accent, wild untamed look',
    'VIRUS-attribute design language: gladiator bearing, battle-scarred details, cracked horn or chipped ear, confident smirk with one visible fang, burnt-orange war accent, veteran brawler look',
    'VIRUS-attribute design language: cunning trickster energy, sly grin, sharp angular ears or fins, mismatched asymmetric details, one toxic-purple accent, streetwise rogue look',
    'VIRUS-attribute design language: stormy berserker energy, bristling fur or plating standing on end, wild wide fierce eyes, jagged lightning-shaped marks, one hot magenta accent, untamable look',
    'VIRUS-attribute design language: silent hunter poise, low crouched stance, cold calculating narrow eyes, arrow-sharp silhouette edges, one dark scarlet accent, ruthless precision look',
  ],
  harmonia: [
    'DATA-attribute design language: clean symmetric silhouette, balanced geometric shapes with smooth rounded edges, calm focused intelligent eyes, one cool cyan accent, composed scholarly look',
    'DATA-attribute design language: wandering-monk simplicity, minimal serene lines, half-closed meditative eyes, circular zen motifs, one soft jade accent, tranquil sage look',
    'DATA-attribute design language: inventor-tinkerer energy, tidy modular body segments, bright curious round eyes, subtle blueprint-line marks, one teal accent, clever craftsman look',
    'DATA-attribute design language: stargazer poise, upright contemplative posture, deep thoughtful eyes, tiny constellation dot patterns, one indigo accent, quiet oracle look',
    'DATA-attribute design language: tactician bearing, neat symmetric armor lines, sharp attentive eyes scanning ahead, chessboard-like subtle patterning, one emerald accent, strategist look',
    'DATA-attribute design language: flowing dancer grace, smooth continuous curves, gentle balanced expression, ripple and wave motifs, one aquamarine accent, effortless equilibrium look',
  ],
  benevolencia: [
    'VACCINE-attribute design language: noble heroic silhouette, soft rounded shapes with upright proud posture, big kind sparkling eyes, white and gold highlights, knightly guardian look',
    'VACCINE-attribute design language: gentle-healer warmth, plump huggable proportions, warm smiling eyes, ribbon or bandage motifs, cream and rose-gold highlights, caretaker look',
    'VACCINE-attribute design language: loyal-shepherd bearing, sturdy dependable frame, soft attentive eyes always watching over others, bell or lantern charm, ivory and amber highlights, protector look',
    'VACCINE-attribute design language: cheerful-champion energy, bouncy confident posture, bright optimistic eyes, star and medal motifs, sunny yellow and white highlights, inspiring hero look',
    'VACCINE-attribute design language: serene-priestess aura, flowing graceful lines, calm compassionate eyes, subtle halo or petal ornaments, pearl and pale-gold highlights, blessed look',
    'VACCINE-attribute design language: big-brother bulk, broad gentle frame that shields smaller creatures, soft brave eyes, shield and heart motifs, silver and warm-white highlights, dependable look',
  ],
};

// O atributo já aparece na forma bebê (pool por tipo)
const ALIGNMENT_BABY_HINTS: Record<AlignmentId, string[]> = {
  poder: [
    'even the baby form already shows tiny fangs and a mischievous smirk',
    'even the baby form already crouches like a tiny predator, eyes locked on a target',
    'even the baby form already has one little crooked spike and a defiant pout',
    'even the baby form already growls adorably, bristling when approached',
  ],
  harmonia: [
    'even the baby form already looks calm, symmetric and quietly observant',
    'even the baby form already sits in a tiny meditative pose',
    'even the baby form already tilts its head, studying everything with curious eyes',
    'even the baby form already arranges things around it in neat little patterns',
  ],
  benevolencia: [
    'even the baby form already has kind sparkling eyes and a soft bright glow',
    'even the baby form already tries to hug everything nearby',
    'even the baby form already stands between danger and smaller creatures',
    'even the baby form already offers little gifts with a warm smile',
  ],
};

// Traços de temperamento por alinhamento (usados nos TEXTOS das descrições —
// substituem qualquer menção simbólica a signos/horóscopo)
const ALIGNMENT_TRAIT_WORDS: Record<AlignmentId, LText[]> = {
  poder: [
    { pt: 'feroz e perspicaz', en: 'fierce and sharp-witted' },
    { pt: 'voraz e destemido', en: 'voracious and fearless' },
    { pt: 'implacável quando provocado', en: 'relentless when provoked' },
    { pt: 'audaz e territorial', en: 'bold and territorial' },
  ],
  harmonia: [
    { pt: 'sereno e observador', en: 'serene and observant' },
    { pt: 'curioso e equilibrado', en: 'curious and balanced' },
    { pt: 'paciente e engenhoso', en: 'patient and resourceful' },
    { pt: 'contemplativo e preciso', en: 'contemplative and precise' },
  ],
  benevolencia: [
    { pt: 'gentil e protetor', en: 'gentle and protective' },
    { pt: 'leal até o fim', en: 'loyal to the end' },
    { pt: 'acolhedor e corajoso', en: 'warm-hearted and brave' },
    { pt: 'altruísta e vigilante', en: 'selfless and watchful' },
  ],
};

const MEGA_REGALIAS: Record<AlignmentId, Array<{ en: string; pt: string }>> = {
  poder: [
    { en: 'warlord-monarch apotheosis: a crown-like crest, a tattered banner-cape and one oversized weapon-arm', pt: 'apoteose de monarca da guerra: crista em coroa, capa-estandarte esfarrapada e um braço-arma desproporcional' },
    { en: 'apex-predator apotheosis: a colossal beast frame, saber fangs and trophy scars worn like medals', pt: 'apoteose de predador supremo: corpo colossal de fera, presas de sabre e cicatrizes-troféu exibidas como medalhas' },
    { en: 'grand-gladiator apotheosis: spiked champion armor, a chained gauntlet and an arena-champion stance', pt: 'apoteose de grande gladiador: armadura de campeão com espinhos, manopla acorrentada e postura de campeão de arena' },
    { en: 'storm-tyrant apotheosis: crackling energy horns, a mantle of living lightning and thunderous presence', pt: 'apoteose de tirano da tempestade: chifres de energia crepitante, manto de relâmpago vivo e presença trovejante' },
  ],
  harmonia: [
    { en: 'celestial arbiter apotheosis: detached floating body segments, orbiting rings and a serene extra pair of eyes', pt: 'apoteose de árbitro celeste: segmentos do corpo flutuando separados, anéis em órbita e um sereno par extra de olhos' },
    { en: 'grand-sage apotheosis: a levitating lotus throne of energy, flowing scholar robes and a third-eye gem', pt: 'apoteose de grande sábio: trono de lótus de energia levitante, vestes de erudito esvoaçantes e joia de terceiro olho' },
    { en: 'world-clock apotheosis: rotating orrery rings around the body and planetary orbs in orbit', pt: 'apoteose de relógio do mundo: anéis de planetário girando ao redor do corpo e esferas planetárias em órbita' },
    { en: 'perfect-form apotheosis: an impossibly clean geometric body of pure balance, hovering in stillness', pt: 'apoteose da forma perfeita: corpo geométrico de equilíbrio puro, pairando em quietude absoluta' },
  ],
  benevolencia: [
    { en: 'guardian seraph apotheosis: a protective mantle of layered wings, a soft aureole and open embracing arms', pt: 'apoteose de serafim guardião: manto protetor de asas em camadas, auréola suave e braços abertos que acolhem' },
    { en: 'holy-paladin apotheosis: radiant plate armor, a banner of hope and a greatshield planted at its side', pt: 'apoteose de paladino sagrado: armadura de placas radiante, estandarte da esperança e escudo enorme fincado ao lado' },
    { en: 'great-shepherd apotheosis: a colossal gentle frame that smaller creatures shelter beneath, lantern staff in hand', pt: 'apoteose de grande pastor: corpo colossal e gentil sob o qual criaturas menores se abrigam, cajado-lanterna na mão' },
    { en: 'life-fountain apotheosis: healing springs flowing from the shoulders and blooming flowers in its footsteps', pt: 'apoteose de fonte da vida: nascentes curativas fluindo dos ombros e flores brotando por onde pisa' },
  ],
};

const REALM_EMBLEMS: Record<RealmId, Array<{ en: string; pt: string }>> = {
  deserto: [
    { en: 'a sun-disc emblem', pt: 'um emblema de disco solar' },
    { en: 'a scarab-seal emblem', pt: 'um emblema de selo de escaravelho' },
    { en: 'a mirage-eye emblem', pt: 'um emblema de olho de miragem' },
  ],
  picos: [
    { en: 'a storm-bolt emblem', pt: 'um emblema de raio' },
    { en: 'a summit-peak emblem', pt: 'um emblema de pico nevado' },
    { en: 'a wind-spiral emblem', pt: 'um emblema de espiral de vento' },
  ],
  oceano: [
    { en: 'a tide-crest emblem', pt: 'um emblema de crista de maré' },
    { en: 'a nautilus-spiral emblem', pt: 'um emblema de espiral de náutilo' },
    { en: 'an abyssal-lantern emblem', pt: 'um emblema de lanterna abissal' },
  ],
  pantano: [
    { en: 'a miasma-orchid emblem', pt: 'um emblema de orquídea do miasma' },
    { en: 'a will-o-wisp emblem', pt: 'um emblema de fogo-fátuo' },
    { en: 'a twisted-root emblem', pt: 'um emblema de raiz retorcida' },
  ],
  floresta: [
    { en: 'a wild-antler emblem', pt: 'um emblema de galhada selvagem' },
    { en: 'an ancient-leaf emblem', pt: 'um emblema de folha ancestral' },
    { en: 'a beast-claw emblem', pt: 'um emblema de garra de fera' },
  ],
  cavernas: [
    { en: 'a geode emblem', pt: 'um emblema de geodo' },
    { en: 'a stalactite-fang emblem', pt: 'um emblema de presa de estalactite' },
    { en: 'an echo-rune emblem', pt: 'um emblema de runa do eco' },
  ],
  gelo: [
    { en: 'a snowflake-sigil emblem', pt: 'um emblema de floco de neve' },
    { en: 'an aurora-arc emblem', pt: 'um emblema de arco de aurora' },
    { en: 'a frozen-star emblem', pt: 'um emblema de estrela congelada' },
  ],
  campina: [
    { en: 'a golden-bloom emblem', pt: 'um emblema de flor dourada' },
    { en: 'a honeycomb emblem', pt: 'um emblema de favo de mel' },
    { en: 'a morning-dew emblem', pt: 'um emblema de orvalho da manhã' },
  ],
  akasha: [
    { en: 'a twin-crescent emblem of light and shadow', pt: 'um emblema de crescentes gêmeos de luz e sombra' },
    { en: 'an all-seeing-prism emblem', pt: 'um emblema de prisma onisciente' },
    { en: 'an infinity-loop emblem', pt: 'um emblema de laço do infinito' },
  ],
};

// Acentos de cor por reino (pool — complementa a paleta do elemento)
const REALM_ACCENTS: Record<RealmId, string[]> = {
  deserto: ['sand-gold and terracotta accents', 'dune-beige and cactus-green accents', 'sunset-copper accents'],
  picos: ['storm-blue and electric-yellow accents', 'granite-gray and lightning-white accents', 'thundercloud-violet accents'],
  oceano: ['abyssal-blue and bioluminescent-cyan accents', 'coral-pink and deep-teal accents', 'pearl and kelp-green accents'],
  pantano: ['murky-green and toxic-purple accents', 'bog-brown and firefly-yellow accents', 'moss and orchid-violet accents'],
  floresta: ['forest-green and bark-brown accents', 'fern and mushroom-red accents', 'canopy-emerald and acorn accents'],
  cavernas: ['slate-gray and amethyst accents', 'obsidian and glowworm-blue accents', 'copper-vein and quartz accents'],
  gelo: ['ice-white and glacial-blue accents', 'aurora-green and frost-lilac accents', 'polar-silver accents'],
  campina: ['sunny-yellow and blossom-pink accents', 'wheat-gold and sky accents', 'clover-green and daisy-white accents'],
  akasha: ['duotone gold-and-violet twilight accents', 'starlight-silver and void-purple accents', 'dawn-and-dusk gradient accents'],
};

export const STAGE_NAMES: Record<StageId, LText> = {
  rookie: { pt: 'Rookie', en: 'Rookie' },
  champion: { pt: 'Champion', en: 'Champion' },
  perfeito: { pt: 'Perfeito', en: 'Perfect' },
  mega: { pt: 'Mega', en: 'Mega' },
  ultra: { pt: 'Ultra', en: 'Ultra' },
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

export function generateOracle(input: OracleInput, seed?: number, overrides?: OracleOverrides): OracleResult {
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

  // Respostas do quiz somam na LEITURA (fazem parte da base, como os astros)
  const answerSource: LText = { pt: 'Suas respostas', en: 'Your answers' };
  const questionEffects: QuestionEffects[] = [];
  if (input.answers) {
    for (const q of ORACLE_QUESTIONS) {
      const chosen = q.options.find(o => o.id === input.answers?.[q.id]);
      if (chosen) questionEffects.push(chosen.effects);
    }
  }
  for (const fx of questionEffects) {
    for (const [el, pts] of Object.entries(fx.elements ?? {}) as Array<[ElementId, number]>) {
      addScore(elementScores, elementBreakdown, el, pts, answerSource);
    }
  }

  const baseSortedElements = [...ELEMENT_ORDER].sort((a, b) => elementScores[b] - elementScores[a]);
  const baseDominantElement = baseSortedElements[0];

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
  if (baseDominantElement === 'sombra') {
    addScore(roleScores, roleBreakdown, 'magico', 2, { pt: 'Elemento dominante Sombra', en: 'Dominant Shadow element' });
  }
  if (baseDominantElement === 'industrial') {
    addScore(roleScores, roleBreakdown, 'alcance', 2, { pt: 'Elemento dominante Industrial', en: 'Dominant Industrial element' });
  }
  if (baseDominantElement === 'planta') {
    addScore(roleScores, roleBreakdown, 'suporte', 2, { pt: 'Elemento dominante Planta', en: 'Dominant Plant element' });
  }
  if (baseDominantElement === 'luz') {
    addScore(roleScores, roleBreakdown, 'suporte', 1, { pt: 'Elemento dominante Luz', en: 'Dominant Light element' });
  }

  for (const fx of questionEffects) {
    for (const [role, pts] of Object.entries(fx.roles ?? {}) as Array<[RoleId, number]>) {
      addScore(roleScores, roleBreakdown, role, pts, answerSource);
    }
  }

  const sortedRoles = [...ROLE_ORDER].sort((a, b) => roleScores[b] - roleScores[a]);
  let dominantRole = sortedRoles[0];

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
  for (const fx of questionEffects) {
    for (const [al, pts] of Object.entries(fx.alignments ?? {}) as Array<[AlignmentId, number]>) {
      addScore(alignmentScores, alignmentBreakdown, al, pts, answerSource);
    }
  }

  const baseSortedAlignments = [...ALIGNMENT_ORDER].sort((a, b) => alignmentScores[b] - alignmentScores[a]);
  const baseDominantAlignment = baseSortedAlignments[0];

  // ----- Pontuação de reino -----
  // Matriz de pesos sobre os elementos + bônus do alinhamento + respostas do
  // quiz + jitter determinístico por pessoa (desempate único por input).
  const inputKey = [
    normalizeName(input.fullName), input.birthDate, input.birthTime,
    input.birthPlace.trim().toLowerCase(),
    JSON.stringify(input.answers ?? {}), JSON.stringify(input.preferences ?? {}),
    (input.petDescription ?? '').trim().toLowerCase(),
  ].join('|');
  const realmScores = Object.fromEntries(REALM_ORDER.map(r => [r, 0])) as Record<RealmId, number>;
  for (const realm of REALM_ORDER) {
    let score = 0;
    for (const [el, weight] of Object.entries(REALM_WEIGHTS[realm]) as Array<[ElementId, number]>) {
      score += weight * elementScores[el];
    }
    if (ALIGNMENT_REALM_BONUS[baseDominantAlignment].includes(realm)) score += 3;
    for (const fx of questionEffects) {
      score += (fx.realms?.[realm] ?? 0) * 3; // quiz pesa forte no reino
    }
    score += hashString(`${inputKey}|${realm}`) % 4; // 0–3: assinatura pessoal
    realmScores[realm] = score;
  }

  // ----- Combinação de pesos: leitura + preferências (25%) + descrição (50%) -----
  // Sem preferências e sem descrição → 100% leitura (astros + numerologia + quiz).
  const descText = input.petDescription?.trim() ? normalizeText(input.petDescription) : '';
  const descHits = {
    elements: descText ? countKeywordHits(descText, DESC_KEYWORDS.elements, ELEMENT_ORDER) : null,
    realms: descText ? countKeywordHits(descText, DESC_KEYWORDS.realms, REALM_ORDER) : null,
    alignments: descText ? countKeywordHits(descText, DESC_KEYWORDS.alignments, ALIGNMENT_ORDER) : null,
    roles: descText ? countKeywordHits(descText, DESC_KEYWORDS.roles, ROLE_ORDER) : null,
  };

  function combineAxis<K extends string>(
    base: Record<K, number>,
    order: K[],
    pref: K | undefined,
    hits: Record<K, number> | null,
  ): Record<K, number> {
    const totalBase = order.reduce((s, k) => s + base[k], 0) || 1;
    const totalHits = hits ? order.reduce((s, k) => s + hits[k], 0) : 0;
    const wPref = pref ? 0.25 : 0;
    const wDesc = totalHits > 0 ? 0.5 : 0;
    const wBase = 1 - wPref - wDesc;
    const out = {} as Record<K, number>;
    for (const k of order) {
      let f = wBase * (base[k] / totalBase);
      if (pref && k === pref) f += wPref;
      if (hits && totalHits > 0) f += wDesc * (hits[k] / totalHits);
      out[k] = Math.round(f * 100);
    }
    return out;
  }

  const finalElementScores = combineAxis(elementScores, ELEMENT_ORDER, input.preferences?.element, descHits.elements);
  const finalRoleScores = combineAxis(roleScores, ROLE_ORDER, undefined, descHits.roles);
  const finalAlignmentScores = combineAxis(alignmentScores, ALIGNMENT_ORDER, input.preferences?.alignment, descHits.alignments);
  const finalRealmScores = combineAxis(realmScores, REALM_ORDER, input.preferences?.realm, descHits.realms);

  // Registra as influências extras no breakdown (transparência)
  if (input.preferences?.element) {
    addScore(elementScores, elementBreakdown, input.preferences.element, 0,
      { pt: 'Preferência direta (25%)', en: 'Direct preference (25%)' });
  }
  if (descText) {
    addScore(elementScores, elementBreakdown,
      [...ELEMENT_ORDER].sort((a, b) => (descHits.elements?.[b] ?? 0) - (descHits.elements?.[a] ?? 0))[0], 0,
      { pt: 'Descrição do pet (50%)', en: 'Pet description (50%)' });
  }

  const sortedElements = [...ELEMENT_ORDER].sort((a, b) => finalElementScores[b] - finalElementScores[a]);
  let dominantElement = sortedElements[0];
  // Elemento ÚNICO por padrão; só há um segundo elemento se a pontuação for
  // próxima da do primeiro (≥ 75%).
  let secondaryElement: ElementId | null =
    finalElementScores[sortedElements[1]] >= finalElementScores[sortedElements[0]] * 0.75
      ? sortedElements[1]
      : null;

  dominantRole = [...ROLE_ORDER].sort((a, b) => finalRoleScores[b] - finalRoleScores[a])[0];
  let dominantAlignment = [...ALIGNMENT_ORDER].sort((a, b) => finalAlignmentScores[b] - finalAlignmentScores[a])[0];
  let dominantRealm = [...REALM_ORDER].sort((a, b) => finalRealmScores[b] - finalRealmScores[a])[0];

  // ----- Ajustes manuais do usuário (override direto dos vencedores) -----
  if (overrides) {
    dominantElement = overrides.dominantElement ?? dominantElement;
    if (overrides.secondaryElement !== undefined) secondaryElement = overrides.secondaryElement; // pode ser null (único)
    if (secondaryElement === dominantElement) {
      secondaryElement = sortedElements.find(e => e !== dominantElement) ?? null;
    }
    dominantRole = overrides.dominantRole ?? dominantRole;
    dominantAlignment = overrides.dominantAlignment ?? dominantAlignment;
    dominantRealm = overrides.dominantRealm ?? dominantRealm;
  }

  // ----- RNG semeado (parte criativa) -----
  const baseHash = hashString(inputKey);
  const salt = seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32((baseHash ^ salt) >>> 0);

  // ----- Arquétipo: 1 substantivo + 2 adjetivos -----
  const nounPool = [
    ...NOUNS_BY_ELEMENT[dominantElement],
    ...(secondaryElement ? NOUNS_BY_ELEMENT[secondaryElement] : []),
  ];
  const noun = pick(rng, nounPool);
  const adjRole = pick(rng, ADJECTIVES_BY_ROLE[dominantRole]);
  const adjElement = pick(rng, ADJECTIVES_BY_ELEMENT[secondaryElement ?? dominantElement]);
  const archetype: ArchetypeResult = {
    noun: { pt: noun.pt, en: noun.en },
    nounEn: noun.en,
    adjectives: [adjRole, adjElement],
    phrase: {
      pt: `${noun.pt} ${adjRole.pt} e ${adjElement.pt}`,
      en: `${adjRole.en} and ${adjElement.en} ${noun.en}`,
    },
  };

  // ----- Resumo de personalidade (deduzida dos astros + numerologia + quiz;
  // os símbolos ficam SÓ aqui — a criatura não os representa) -----
  const sunTrait = pick(rng, sun.traits);
  const ascTrait = pick(rng, ascendant.traits);
  const chinTrait = chinese.traits[0];
  const vedTrait = vedic.traits[0];
  const personalitySummary: LText = {
    pt: `${ELEMENT_INFO[dominantElement].personality.pt} No fundo é ${sunTrait.pt}, mostra-se ${ascTrait.pt}, carrega a essência de quem é ${chinTrait.pt} e a alma védica de "${vedTrait.pt}". ${ROLE_INFO[dominantRole].profile.pt} Alinhamento ${ALIGNMENT_INFO[dominantAlignment].name.pt.toLowerCase()}: ${ALIGNMENT_INFO[dominantAlignment].profile.pt.toLowerCase()}`,
    en: `${ELEMENT_INFO[dominantElement].personality.en} Deep down ${sunTrait.en}, outwardly ${ascTrait.en}, carrying the essence of someone ${chinTrait.en} and the Vedic soul of "${vedTrait.en}". ${ROLE_INFO[dominantRole].profile.en} ${ALIGNMENT_INFO[dominantAlignment].name.en} alignment: ${ALIGNMENT_INFO[dominantAlignment].profile.en.toLowerCase()}`,
  };

  // ----- Criatura: fusão de duas bases do bestiário -----
  // Bases citadas na DESCRIÇÃO DO PET têm prioridade máxima; depois, pool
  // filtrado por elemento(s) OU reino. O horóscopo NUNCA aparece no corpo.
  const mentionedBases = descText
    ? CREATURE_BASES.filter(b => descText.includes(normalizeText(b.pt)) || descText.includes(normalizeText(b.en)))
    : [];
  const basePool = CREATURE_BASES.filter(b =>
    b.elements.includes(dominantElement) ||
    (secondaryElement !== null && b.elements.includes(secondaryElement)) ||
    b.realms.includes(dominantRealm),
  );
  const fusionA = mentionedBases[0] ?? pick(rng, basePool);
  const poolB = (mentionedBases[1] ? [mentionedBases[1]] : basePool).filter(b => b.en !== fusionA.en);
  const fusionB = poolB.length > 0 ? pick(rng, poolB) : pick(rng, CREATURE_BASES.filter(b => b.en !== fusionA.en));

  // Características sorteadas dos POOLS (assinatura visual única).
  // Nota: em 16x16 não cabem textura/cauda/marcas — esses pools continuam
  // existindo para descrições e para um futuro "modo HD", mas os prompts de
  // sprite carregam só o essencial (design do tipo, fusão, crista, paleta).
  const alignDesign = pick(rng, ALIGNMENT_DESIGNS[dominantAlignment]);
  const babyHint = pick(rng, ALIGNMENT_BABY_HINTS[dominantAlignment]);
  const alignTrait = pick(rng, ALIGNMENT_TRAIT_WORDS[dominantAlignment]);
  const crest = pick(rng, CRESTS);
  const palette = pick(rng, ELEMENT_PALETTES[dominantElement]);
  const realmInfo = REALM_INFO[dominantRealm];
  const realmAccent = pick(rng, REALM_ACCENTS[dominantRealm]);
  const emblem = pick(rng, REALM_EMBLEMS[dominantRealm]);
  const roleMotif = pick(rng, ROLE_MOTIFS[dominantRole]);

  // Visão do dono (descrição livre) — injetada crua no prompt, com prioridade
  const ownerVision = input.petDescription?.trim()
    ? `the owner's own vision of this pet, HIGH PRIORITY: "${input.petDescription.trim().replace(/\s+/g, ' ').slice(0, 300)}"`
    : null;

  // Nome: radical de elemento(s) OU de reino + sílaba pessoal
  const stemPool = [
    ...ELEMENT_NAME_STEMS[dominantElement],
    ...(secondaryElement ? ELEMENT_NAME_STEMS[secondaryElement] : []),
    ...REALM_NAME_STEMS[dominantRealm],
  ];
  const stem = pick(rng, stemPool);
  const nameLetters = normalizeName(input.fullName);
  const nameSyllable = nameLetters
    ? (nameLetters[0] + (nameLetters.slice(1).match(/[AEIOU]/)?.[0] ?? 'a')).toLowerCase()
    : 'mo';
  const baseName = (stem + nameSyllable).replace(/(.)\1+/g, '$1');

  const rookieName = `${baseName}mon`;

  const elName = ELEMENT_INFO[dominantElement].name;
  const el2Name = secondaryElement ? ELEMENT_INFO[secondaryElement].name : null;
  const roleName = ROLE_INFO[dominantRole].name;
  const alignName = ALIGNMENT_INFO[dominantAlignment].name;

  const attribute = ALIGNMENT_INFO[dominantAlignment].attribute;
  const elementPhrase = {
    pt: el2Name ? `Elemento ${elName.pt} com traços de ${el2Name.pt}` : `Elemento ${elName.pt} puro`,
    en: el2Name ? `${elName.en} element with ${el2Name.en} traits` : `pure ${elName.en} element`,
  };
  const concept: LText = {
    pt: `Fusão de ${fusionA.pt} com ${fusionB.pt}, nascida no reino ${realmInfo.name.pt} ${realmInfo.emoji}. ${elementPhrase.pt}, alinhamento ${alignName.pt} (atributo ${attribute.pt}), função ${roleName.pt} — encarnação do arquétipo "${archetype.phrase.pt}". Do rookie partem 3 linhas de evolução (Vírus, Data e Vacina), e os três Megas se fundem no Ultra.`,
    en: `A fusion of ${fusionA.en} and ${fusionB.en}, born in the ${realmInfo.name.en} realm ${realmInfo.emoji}. ${elementPhrase.en}, ${alignName.en} alignment (${attribute.en} attribute), ${roleName.en} role — incarnation of the archetype "${archetype.phrase.en}". From the rookie, 3 evolution lines branch out (Virus, Data and Vaccine), and the three Megas fuse into the Ultra.`,
  };

  // Núcleo visual compartilhado por TODOS os estágios (identidade da espécie).
  // A linguagem de tipo NÃO entra aqui: cada linha usa a do seu atributo.
  const sharedCore = [
    ...(ownerVision ? [ownerVision] : []),
    `an original monster species: a fusion of ${an(fusionA.en)} and ${an(fusionB.en)}`,
    `signature crest present in every evolution stage: ${crest}`,
    `${palette}, with ${realmAccent}`,
  ];
  const buildPrompt = (parts: string[]) =>
    [SPRITE_STYLE_BASE, SPRITE_SPEC, ...parts, SPRITE_SIMPLIFY, SPRITE_STYLE_END].join(', ');

  const stages: CreatureStage[] = [];

  // ----- Rookie: forma base ÚNICA (usa o tipo dominante da leitura) -----
  stages.push({
    stage: 'rookie',
    stageName: STAGE_NAMES.rookie,
    name: rookieName,
    description: {
      pt: `${rookieName} é a forma base: um monstrinho pequeno e simples em que a fusão de ${fusionA.pt} com ${fusionB.pt} já aparece — ${alignTrait.pt}, ${adjRole.pt} desde o primeiro dia. Todas as 3 linhas de evolução partem daqui.`,
      en: `${rookieName} is the base form: a small, simple little monster where the fusion of ${fusionA.en} and ${fusionB.en} already shows — ${alignTrait.en}, ${adjRole.en} from day one. All 3 evolution lines branch from here.`,
    },
    imagePrompt: buildPrompt([
      alignDesign,
      ...sharedCore,
      'rookie stage: a small, round, cute and simple monster, the base form of every evolution line',
      babyHint,
      `light starter gear: ${roleMotif}`,
    ]),
  });

  // ----- 3 linhas de evolução: champion → perfeito → mega por TIPO -----
  const usedShapes = new Set<string>();
  const petElements: ElementId[] = [dominantElement, ...(secondaryElement ? [secondaryElement] : [])];
  const megaShapeByBranch = {} as Record<AlignmentId, EvoShape>;

  for (const branch of ALIGNMENT_ORDER) {
    const bInfo = ALIGNMENT_INFO[branch];
    const bDesign = pick(rng, ALIGNMENT_DESIGNS[branch]);
    const bTrait = pick(rng, ALIGNMENT_TRAIT_WORDS[branch]);
    const bManifest = pick(rng, ELEMENT_MANIFESTS[secondaryElement ?? dominantElement]);
    const bRegalia = pick(rng, MEGA_REGALIAS[branch]);
    const champShape = pickShape(rng, CHAMPION_SHAPES, branch, petElements, usedShapes);
    const perfShape = pickShape(rng, PERFECT_SHAPES, branch, petElements, usedShapes);
    const megaShape = pickShape(rng, MEGA_SHAPES, branch, petElements, usedShapes);
    megaShapeByBranch[branch] = megaShape;

    const champName = `${pick(rng, CHAMPION_PREFIXES[branch])}${baseName}mon`;
    const perfName = `${pick(rng, PERFECT_STAGE_PREFIXES[branch])}${baseName}mon`;
    const megaName = `${pick(rng, MEGA_STAGE_PREFIXES[branch])}${baseName}mon`;
    const linePt = `linha ${bInfo.name.pt} (${bInfo.attribute.pt})`;
    const lineEn = `${bInfo.name.en} (${bInfo.attribute.en}) line`;

    stages.push({
      stage: 'champion',
      branch,
      stageName: STAGE_NAMES.champion,
      name: champName,
      description: {
        pt: `${champName} — Champion da ${linePt}: ${rookieName} evolui para ${champShape.pt}, ${bTrait.pt}. Maior e mais selvagem, mas com o mesmo rosto e a mesma crista.`,
        en: `${champName} — Champion of the ${lineEn}: ${rookieName} evolves into ${champShape.en}, ${bTrait.en}. Bigger and wilder, yet with the same face and crest.`,
      },
      imagePrompt: buildPrompt([
        bDesign,
        ...sharedCore,
        `champion stage of the ${bInfo.attribute.en} evolution line: it evolves into ${champShape.en}`,
        'clearly bigger and wilder than the rookie stage, yet the same face and signature crest',
      ]),
    });

    stages.push({
      stage: 'perfeito',
      branch,
      stageName: STAGE_NAMES.perfeito,
      name: perfName,
      description: {
        pt: `${perfName} — Perfeito da ${linePt}: metamorfose completa — vira ${perfShape.pt}. Seu elemento se materializa (${bManifest.pt}) e ${emblem.pt} do reino ${realmInfo.name.pt} marca o corpo. Mesmo rosto, mesma crista.`,
        en: `${perfName} — Perfect of the ${lineEn}: full metamorphosis — it becomes ${perfShape.en}. Its element materializes (${bManifest.en}) and ${emblem.en} of the ${realmInfo.name.en} marks its body. Same face, same crest.`,
      },
      imagePrompt: buildPrompt([
        bDesign,
        ...sharedCore,
        `perfect stage of the ${bInfo.attribute.en} evolution line — a conceptual metamorphosis, NOT just a grown-up champion`,
        `it transforms into ${perfShape.en}`,
        `its element materializes physically: ${bManifest.en}`,
        'a silhouette clearly different from the champion form, same face and signature crest',
      ]),
    });

    stages.push({
      stage: 'mega',
      branch,
      stageName: STAGE_NAMES.mega,
      name: megaName,
      description: {
        pt: `${megaName} — Mega da ${linePt}: a apoteose — ascende como ${megaShape.pt}. ${bRegalia.pt}. O corpo se transmuta parcialmente em ${elName.pt} vivo.`,
        en: `${megaName} — Mega of the ${lineEn}: the apotheosis — it ascends as ${megaShape.en}. ${bRegalia.en.split(':')[0]}. Its body partially transmutes into living ${elName.en}.`,
      },
      imagePrompt: buildPrompt([
        bDesign,
        ...sharedCore,
        `mega stage — the final apotheosis of the ${bInfo.attribute.en} evolution line, a radical transformation with a completely new silhouette`,
        `it ascends as ${megaShape.en}`,
        bRegalia.en.split(':')[0],
        'same face, same signature crest and same color family as all previous stages',
      ]),
    });
  }

  // ----- Ultra: a fusão dos 3 Megas (o ápice absoluto) -----
  const ultraName = `Omni${baseName}mon`;
  stages.push({
    stage: 'ultra',
    stageName: STAGE_NAMES.ultra,
    name: ultraName,
    description: {
      pt: `${ultraName} é o Ultra: a fusão dos três Megas — ${megaShapeByBranch.poder.pt}, ${megaShapeByBranch.harmonia.pt} e ${megaShapeByBranch.benevolencia.pt} — em um único ser transcendente que une a ferocidade do Vírus, o equilíbrio do Data e a nobreza da Vacina. O ápice absoluto do arquétipo "${archetype.phrase.pt}".`,
      en: `${ultraName} is the Ultra: the fusion of the three Megas — ${megaShapeByBranch.poder.en}, ${megaShapeByBranch.harmonia.en} and ${megaShapeByBranch.benevolencia.en} — into a single transcendent being uniting Virus ferocity, Data balance and Vaccine nobility. The absolute apex of the archetype "${archetype.phrase.en}".`,
    },
    imagePrompt: buildPrompt([
      'ULTRA stage — the supreme final form: a fusion of its three mega forms into one transcendent being',
      `merging these three mega bodies into one design: ${megaShapeByBranch.poder.en}; ${megaShapeByBranch.harmonia.en}; ${megaShapeByBranch.benevolencia.en}`,
      'unifying VIRUS-attribute ferocity, DATA-attribute balance and VACCINE-attribute nobility in a single silhouette',
      ...sharedCore,
      'same face and signature crest as every previous stage — the same soul at its absolute apex',
    ]),
  });

  return {
    input,
    seed: salt,
    numerology,
    western: { sun, ascendant },
    chinese,
    vedic,
    // Pontuações FINAIS (leitura + preferências 25% + descrição 50%), 0–100
    elementScores: finalElementScores,
    elementBreakdown,
    dominantElement,
    secondaryElement,
    roleScores: finalRoleScores,
    roleBreakdown,
    dominantRole,
    alignmentScores: finalAlignmentScores,
    alignmentBreakdown,
    dominantAlignment,
    realmScores: finalRealmScores,
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
