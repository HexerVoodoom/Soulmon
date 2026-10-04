// ============================================================================
// Oráculo de Criaturas — motor místico do Soulmon (feature provisória)
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

// O perfil de alma é o motor NOVO da leitura (utils/soulProfile/) — 20 itens
// psicométricos + mapa astral real + numerologia completa. Importado só como
// TIPO de propósito: o tipo some na compilação, então a `astronomy-engine`
// não entra no bundle por este arquivo. Quem calcula o perfil é a UI, por
// import dinâmico, e passa o resultado pronto (JSON puro) aqui dentro.
import type { SoulProfile } from './soulProfile/profile';

export type { SoulProfile };

// Tipos das famílias (só tipo — some na compilação). Os DADOS vêm por
// parâmetro: ver `generateOracleAsync` / `FamiliasOraculo`.
import type { CreatureFamily, Subfamily } from './oracle/familias';

/** O que `generateOracleWithFamilies` precisa do módulo `./oracle/familias`
 *  (o próprio namespace do `import()` satisfaz este tipo). */
export interface FamiliasOraculo {
  CREATURE_FAMILIES: CreatureFamily[];
  MOTIVO_ELEMENTO_CLASSE: Record<string, { en: string; pt: string; familias: string[] }>;
}

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
  /** "Qual sua criatura favorita?" (1-2 palavras, onboarding) — NÃO substitui
   *  o conceito gerado (diferente de petDescription): só é injetada como
   *  prefixo literal antes dele no prompt de imagem, em TODOS os 11
   *  estágios. Opcional — o usuário pode optar por não influenciar. */
  favoriteCreature?: string;
  /**
   * RENASCIMENTO (`utils/rebirth.ts`): as três escolhas da cerimônia. Só
   * existem para quem chegou ao ultra, pagou e renasceu — é a recompensa por
   * ter subido a escada inteira, e a única entrada do oráculo em que o
   * jogador ESCOLHE em vez de responder. Os nomes chegam já traduzidos e
   * higienizados; este módulo não valida catálogo (quem valida é
   * `applyRebirth`, na entrada).
   */
  rebirth?: {
    criatura: string; escolaNome: string; elementoNome: string;
    /** Fase 3 (decisão 1): o traço herdado do ciclo anterior
     *  (`utils/rebirth.ts` › `herancaDoCiclo`). Preenche o elemento
     *  SECUNDÁRIO quando a leitura não deu nenhum e entra nas 11 formas do
     *  prompt — nunca substitui o dominante. */
    herdado?: { elemento: ElementId };
  };
  /**
   * Inspiração vinda do bestiário (utils/soulProfile/bestiary/select.ts):
   * a DESCRIÇÃO da criatura escolhida (sem o nome), cuja função é uma só —
   * alimentar a máquina de famílias com as menções de bicho que ela sabe
   * ler. NÃO substitui a descrição do usuário (petDescription vence), NÃO
   * entra na bio e NÃO entra em prompt de imagem. Só o pipeline
   * (soulProfile/pipeline.ts) preenche isto.
   */
  bestiaryInspiration?: {
    texto: string;
    familia: string | null;
    biologia: string[];
    /**
     * O NOME da criatura-inspiração (a base, sem prefixo procedural nem
     * elemento) — ⚠️ **passou a entrar no prompt em 27/09/2026, por decisão
     * do dono.** Até então ele era removido de propósito e havia teste
     * travando isso.
     *
     * Entra **só na 1ª variante** (`imagePrompt`, a que cita as referências
     * de gênero). O `imagePromptFallback` continua sem ele — e é esse par
     * que dá o fallback que o dono pediu: tenta COM o nome; se o provedor
     * recusar por política de conteúdo (`isRefusal`, em
     * `functions/api/generate-sprite.js`), a 2ª tentativa vai sem.
     * Quem decide não somos nós nem uma lista nossa: é o provedor, e a
     * recusa dele já tem caminho tratado.
     */
    nome?: string;
  };
  /**
   * Nome do companheiro inicial capturado (achado de 28/09/2026 — LOOP 1 da
   * revisão do sistema de criação: `ficha/capture.ts` calcula a captura de
   * verdade, mecânica REAL copiada do class-system, e o resultado morria
   * sempre em `App.tsx`/`SoulmonOnboarding.tsx`, que descartavam `companion`
   * na desestruturação de `generateOracleComplete`). Vocabulário próprio do
   * dono (`HexerVoodoom/Class-System`, sem risco de PI — não é o bestiário de
   * terceiro). Só entra na bio quando NÃO há `petDescription` (a bio deixa de
   * ser texto do próprio jogador para virar a frase gerada — nunca mistura
   * as duas fontes). PT+EN desde a Fase 3 (`ficha/companheiro.ts`) — a frase
   * EN saía com o nome em PT ("Bonded with a Lobo Cinzento companion").
   */
  companionName?: LText;
  /**
   * Achado de 28/09/2026: `pipeline.ts` já calcula uma LINHAGEM de inspiração
   * do bestiário — um pick por estágio, encadeado por proximidade de espécie
   * (`selectBestiaryLineage`, testado) — mas até aqui só o pick do primeiro
   * estágio alimentava alguma coisa; os outros quatro eram descartados. Este
   * campo é a BASE (mesma extração de `baseDeInspiracao`) do pick de CADA
   * estágio, opcional e só usado se presente. Varia só o `inspiracao` do
   * `imagePrompt` (1ª tentativa) de cada estágio — nunca nome, família ou
   * bio, que continuam vindo do estágio 0 (`bestiaryInspiration`), para o
   * jogador nunca ver a identidade "mudar de bicho" no texto. Sem este
   * campo, todo estágio cai no nome único de sempre.
   */
  bestiaryLineageNomes?: {
    rookie?: string; champion?: string; perfeito?: string; mega?: string; ultra?: string;
  };
  /**
   * Classe REAL da criatura — arquétipo do class-system (`ficha/classTitle.ts`,
   * motor real, `calcularProgressao`), calculada a partir da ficha ULTRA (a
   * mais concentrada — 100% de arquétipo pleno medido lá) e constante nos 11
   * prompts, mesmo tratamento de `identity`/`dominantClass` logo abaixo. Só
   * ENTRA NO PROMPT de sprite como um traço a mais (mais detalhe = sprite
   * mais específico) — NUNCA em nome, bio ou descrição por forma; o dono
   * pediu explicitamente que a classe não apareça pro jogador em lugar
   * nenhum da UI. Só o pipeline (soulProfile/pipeline.ts) preenche isto —
   * a UI (caminho legado, OraclePage) nunca tem acesso ao motor pesado, que
   * só é alcançado por import dinâmico.
   *
   * Contrato por TIPO (Oráculo Fase 2, PR 6): aqui é `never` — quem monta um
   * `OracleInput` (UI, rascunho salvo, testes) não pode preencher. O campo
   * real vive em `OracleInputWithClass`, que só o pipeline constrói.
   */
  promptClassFlavor?: never;
  /**
   * Leitura ROBUSTA (utils/soulProfile/). Quando presente, ela SUBSTITUI a
   * leitura antiga — signo solar, ascendente aproximado pela hora, horóscopo
   * chinês, rashi védico, 4 números e as 6 perguntas do `ORACLE_QUESTIONS` —
   * como origem dos 4 eixos. Ausente = caminho legado, que continua valendo
   * para os perfis já salvos no aparelho de quem jogou antes desta troca
   * (o reroll relê o mesmo `SOULMON_PROFILE` gravado no onboarding).
   *
   * O que ela NÃO muda: nada da máquina criativa daqui pra baixo. Preferências,
   * descrição do pet, overrides, arquétipo, famílias e as 11 formas continuam
   * exatamente iguais — a criatura de um mesmo par (eixos, seed) sai idêntica
   * pelos dois caminhos.
   */
  soulProfile?: SoulProfile;
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
  /** champion/perfeito/mega existem em 3 LINHAS, uma por tipo (Poder/Harmonia/
   *  Benevolência). rookie e ultra não têm branch. */
  branch?: AlignmentId;
  stageName: LText;
  name: string;                // nome da forma (ex.: "FangPyramon")
  description: LText;
  /** EN — prompt pronto p/ gerador de imagem. É a PRIMEIRA tentativa e cita as
   *  referências de gênero (ver composeSpritePrompts). */
  imagePrompt: string;
  /** EN — mesmo prompt SEM as referências de franquia. Segunda tentativa,
   *  usada quando o gerador RECUSA a primeira por política de conteúdo. */
  imagePromptFallback: string;
}

// O núcleo leve mora em `oracle/base.ts` (o chunk de entrada importa de lá); reexportado aqui.
import { creatureFormId, hashString, mulberry32, ELEMENT_INFO, STAGE_NAMES } from './oracle/base';
export { creatureFormId, hashString, mulberry32, ELEMENT_INFO, STAGE_NAMES };

export interface OracleResult {
  input: OracleInputSync | OracleInputWithClass; // o do pipeline guarda promptClassFlavor
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
    /** Descrição narrativa breve e rica do personagem (arquétipo + poder +
     *  efeito). Constante em toda a espécie; a descrição livre do pet
     *  substitui esse texto quando informada. */
    bio: LText;
    fusion: { a: LText; b: LText };  // as duas bases fundidas no corpo
    /** Família da criatura: 2 slots. O 1º é dominante; o 2º tem impacto menor
     *  e, na maioria das vezes, repete a mesma família (mono). Raramente é uma
     *  2ª família distinta e, mais raro ainda, um OBJETO (só no 2º slot). */
    family: FamilyResult;
    stages: CreatureStage[];
  };
}

export interface FamilySlot {
  family: LText;      // ex.: "Dinossauro"
  subfamily: LText;   // ex.: "Ceratopsídeo"
  noun: LText;        // criatura concreta p/ o conceito, ex.: "triceratops"
  isObject: boolean;  // true quando o slot é um objeto (só possível no 2º)
}
export interface FamilyResult {
  primary: FamilySlot;
  secondary: FamilySlot;
  mono: boolean;      // true = mesma família nos dois slots
}

// ---------------------------------------------------------------------------
// Utilidades: hash + RNG semeado
// ---------------------------------------------------------------------------

export function pick<T>(rng: () => number, arr: T[]): T {
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

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Remove acentos e tudo que não for A-Z. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

/** Reduz a um dígito, preservando números mestres 11/22/33. */
/** Primeira letra maiúscula — para trechos concatenados DEPOIS de um ponto
 *  final (a apoteose do mega saía "…armadura negra. apoteose de monarca…"). */
export function upperFirstText(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function reduceNumber(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return n;
}

/**
 * Soma pitagórica das letras. NUNCA devolve 0 — as tabelas de leitura
 * (NUMBER_ELEMENTS/ROLES/ALIGNMENT) são indexadas de 1 a 9, e um 0 estourava
 * a geração inteira com "undefined is not iterable".
 *
 * Isso não era teórico: `normalizeName` só preserva A–Z, então TODO nome
 * escrito em cirílico, CJK, árabe ou grego somava 0 — e a pessoa ficava presa
 * no ritual, sem conseguir criar personagem nenhum (o app é vendido em EN).
 * Nomes latinos só de vogais ("Aia") zeravam o número de personalidade pelo
 * mesmo caminho. Quando não há letra latina que conte, o número vem do HASH
 * do nome original: o nome continua influenciando a leitura (é o ponto da
 * numerologia) em vez de virar uma constante ou um crash.
 */
function sumLetters(name: string, filter?: (letter: string) => boolean): number {
  let total = 0;
  for (const ch of normalizeName(name)) {
    if (filter && !filter(ch)) continue;
    total += PYTHAGOREAN[ch] ?? 0;
  }
  if (total === 0) {
    const marca = filter ? (filter('A') ? 'vogais' : 'consoantes') : 'expressao';
    return (hashString(`${name}|${marca}`) % 9) + 1;
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
  // data inválida/vazia (NaN) também não pode zerar: mesmo motivo do sumLetters
  const somaData = reduceNumber(d) + reduceNumber(m) + reduceNumber(y);
  const lifePath = Number.isFinite(somaData) && somaData > 0
    ? reduceNumber(somaData)
    : (hashString(`${birthDate}|lifepath`) % 9) + 1;
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

/**
 * Signo (nome PT do mapa astral, ex.: "Escorpião") → SignInfo do jogo.
 *
 * O `SignInfo` carrega as falas que alimentam o resumo de personalidade, e o
 * mapa astral real devolve só o nome do signo. Este é o único ponto de
 * costura entre os dois — as tabelas de traços continuam morando aqui.
 */
export function signInfoByName(namePt: string): SignInfo | null {
  const s = SIGNS.find(sign => sign.name.pt === namePt);
  return s ? { id: s.id, name: s.name, element: s.element, modality: s.modality, traits: s.traits } : null;
}

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

export const CHINESE_ANIMALS: Array<{ name: LText; en: string; traits: LText[] }> = [
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

export const CHINESE_ELEMENTS: LText[] = [
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

export const ROLE_INFO: Record<RoleId, { name: LText; emoji: string; profile: LText }> = {
  suporte: { name: { pt: 'Suporte', en: 'Support' }, emoji: '💖', profile: { pt: 'Perfil cuidador: fortalece, cura e mantém o grupo de pé.', en: 'Caretaker profile: strengthens, heals and keeps the group standing.' } },
  tanque: { name: { pt: 'Tanque', en: 'Tank' }, emoji: '🛡️', profile: { pt: 'Perfil protetor: se coloca na frente e absorve o perigo pelos outros.', en: 'Protector profile: stands in front and absorbs danger for others.' } },
  fisico: { name: { pt: 'Dano físico', en: 'Physical damage' }, emoji: '⚔️', profile: { pt: 'Perfil competitivo: combate corpo a corpo, direto e implacável.', en: 'Competitive profile: melee combat, direct and relentless.' } },
  magico: { name: { pt: 'Dano mágico', en: 'Magic damage' }, emoji: '🔮', profile: { pt: 'Perfil arcano: canaliza forças invisíveis e vence pela mente.', en: 'Arcane profile: channels unseen forces and wins through the mind.' } },
  alcance: { name: { pt: 'Longo alcance', en: 'Long range' }, emoji: '🏹', profile: { pt: 'Perfil observador: age à distância, com precisão e timing.', en: 'Observer profile: acts from afar, with precision and timing.' } },
};

// Alinhamento = o "atributo" da criatura, equivalente direto ao Soulmon:
// Poder · Harmonia · Benevolência (eram Vírus/Dado/Vacina até 29/09/2026). Tem MUITO peso
// visual: define silhueta, olhos e viés de paleta em todos os estágios.
export const ALIGNMENT_INFO: Record<AlignmentId, { name: LText; emoji: string; profile: LText; attribute: LText }> = {
  poder: {
    name: { pt: 'Poder', en: 'Power' }, emoji: '👑',
    profile: { pt: 'Busca conquistar, dominar desafios e deixar marca no mundo.', en: 'Seeks to conquer, master challenges and leave a mark on the world.' },
    attribute: { pt: 'Poder', en: 'Power' },
  },
  harmonia: {
    name: { pt: 'Harmonia', en: 'Harmony' }, emoji: '☯️',
    profile: { pt: 'Busca equilíbrio, conhecimento e o fluxo natural das coisas.', en: 'Seeks balance, knowledge and the natural flow of things.' },
    attribute: { pt: 'Harmonia', en: 'Harmony' },
  },
  benevolencia: {
    name: { pt: 'Benevolência', en: 'Benevolence' }, emoji: '🕊️',
    profile: { pt: 'Busca cuidar, proteger e elevar quem está ao redor.', en: 'Seeks to care for, protect and uplift those around.' },
    attribute: { pt: 'Benevolência', en: 'Benevolence' },
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
    name: { pt: 'Pântanos Mortais', en: 'Deadly Swamps' }, emoji: '🐊',
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
export const NUMBER_ELEMENTS: Record<number, ElementId[]> = {
  1: ['fogo', 'luz'], 2: ['agua', 'luz'], 3: ['ar', 'luz'], 4: ['terra', 'industrial'],
  5: ['ar', 'fogo'], 6: ['planta', 'agua'], 7: ['sombra', 'agua'], 8: ['industrial', 'terra'],
  9: ['luz', 'fogo'], 11: ['luz', 'ar'], 22: ['industrial', 'terra'], 33: ['luz', 'planta'],
};

export const NUMBER_ROLES: Record<number, RoleId> = {
  1: 'fisico', 2: 'suporte', 3: 'alcance', 4: 'tanque', 5: 'alcance', 6: 'suporte',
  7: 'magico', 8: 'tanque', 9: 'magico', 11: 'magico', 22: 'tanque', 33: 'suporte',
};

// Elemento zodiacal → função
export const ZODIAC_ELEMENT_ROLE: Record<string, RoleId> = {
  fogo: 'fisico', terra: 'tanque', ar: 'alcance', agua: 'suporte',
};

export const MODALITY_ROLE: Record<string, RoleId> = {
  cardinal: 'fisico', fixo: 'tanque', mutavel: 'suporte',
};

export const CHINESE_ANIMAL_ROLE: RoleId[] = [
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

export const CHINESE_ELEMENT_MAP: ElementId[] = ['planta', 'fogo', 'terra', 'industrial', 'agua'];

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
  /**
   * WP1.11 — o que esta pergunta ALIMENTA. Feedback de origem: o ritual
   * pedia seis respostas e não dizia o que fazia com nenhuma delas, então
   * ele lia como formulário em vez de leitura.
   *
   * ⚠️ TRAVA, e ela é o pacote inteiro: o hint diz DE ONDE a resposta entra
   * (papel, alinhamento, elemento, reino), **nunca como a criatura vai ser**.
   * "Isso decide o papel dela" é origem; "isso deixa ela teimosa" é um alvo,
   * e alvo transforma a leitura num formulário de otimização — a pessoa passa
   * a responder o que rende o bicho que ela quer, e a leitura deixa de ser
   * sobre ela. Há teste rejeitando o vocabulário de personalidade fechada.
   */
  hint?: LText;
}

export const ORACLE_QUESTIONS: OracleQuestion[] = [
  {
    id: 'grupo',
    hint: { pt: 'Isto alimenta o PAPEL dela — como ela se posiciona.', en: 'This feeds her ROLE — how she stands.' },
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
    hint: { pt: 'Isto alimenta o ALINHAMENTO — de onde vem a força dela.', en: 'This feeds the ALIGNMENT — where her strength comes from.' },
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
    hint: { pt: 'Isto alimenta o ELEMENTO — a matéria de que ela é feita.', en: 'This feeds the ELEMENT — what she is made of.' },
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
    hint: { pt: 'Isto alimenta o ELEMENTO e o ritmo dela.', en: 'This feeds the ELEMENT and her rhythm.' },
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
    hint: { pt: 'Isto alimenta o REINO — de onde ela vem.', en: 'This feeds the REALM — where she comes from.' },
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
    hint: { pt: 'Isto alimenta o ALINHAMENTO e o PAPEL.', en: 'This feeds the ALIGNMENT and the ROLE.' },
    text: { pt: 'Diante de um conflito injusto, você...', en: 'Facing an unfair conflict, you...' },
    options: [
      { id: 'enfrenta', text: { pt: 'Enfrenta de frente, custe o que custar', en: 'Face it head-on, whatever it takes' }, effects: { alignments: { poder: 3 }, roles: { fisico: 2 } } },
      { id: 'media', text: { pt: 'Media e busca o meio-termo justo', en: 'Mediate and seek the fair middle ground' }, effects: { alignments: { harmonia: 3 }, roles: { suporte: 1 } } },
      { id: 'defende', text: { pt: 'Defende quem não pode se defender', en: 'Defend those who cannot defend themselves' }, effects: { alignments: { benevolencia: 3 }, roles: { tanque: 2 } } },
      { id: 'estrategia', text: { pt: 'Age por trás, com estratégia', en: 'Act from behind the scenes, strategically' }, effects: { alignments: { poder: 1, harmonia: 1 }, elements: { sombra: 2 }, roles: { alcance: 1 } } },
    ],
  },
];

/**
 * Escala do efeito do ritual por chave, para que NENHUM elemento/caminho
 * ganhe só por aparecer em mais opções das perguntas. ⚠️ Achado do Loop B
 * (28/09/2026): com respostas uniformes, o ganho esperado por pessoa era
 * sombra 2,42 · ar 1,67 · luz 1,37 · … · industrial 0,75 (sombra em 6
 * opções, industrial em 1), e harmonia 4,15 contra benevolência 3,0 — o
 * ritual inclinava a população inteira antes de qualquer resposta dizer algo
 * da pessoa. A escala = média esperada ÷ esperado da chave: cada resposta
 * continua apontando o MESMO elemento/caminho, só a moeda é igualada.
 * Derivada das próprias perguntas (não é tabela à mão): mudar uma opção
 * recalibra sozinha. Usada pelo caminho do perfil novo em `generateOracle`
 * e por `soulProfile/ritualAnswers.ts` — o caminho legado fica intocado.
 */
function escalaDoRitual<K extends string>(chaves: readonly K[], efeito: (fx: QuestionEffects) => Partial<Record<K, number>> | undefined): Record<K, number> {
  const esperado = Object.fromEntries(chaves.map(k => [k, 0])) as Record<K, number>;
  for (const q of ORACLE_QUESTIONS) {
    for (const o of q.options) {
      for (const [k, v] of Object.entries(efeito(o.effects) ?? {}) as Array<[K, number]>) {
        if (k in esperado) esperado[k] += v / q.options.length;
      }
    }
  }
  const presentes = chaves.filter(k => esperado[k] > 0);
  const media = presentes.reduce((s, k) => s + esperado[k], 0) / (presentes.length || 1);
  return Object.fromEntries(chaves.map(k => [k, esperado[k] > 0 ? media / esperado[k] : 1])) as Record<K, number>;
}

// `/* @__PURE__ */`: sem ele o Rollup não descarta ORACLE_QUESTIONS (copy longa) do chunk de entrada.
export const RITUAL_ELEMENT_SCALE = /* @__PURE__ */ escalaDoRitual(ELEMENT_ORDER, fx => fx.elements);
/** Ver o uso em `generateOracle` (caminho do perfil novo). Pontos de share
 *  (a média de um elemento é 12,5). */
export const ELEMENT_DOMINANCE_COMPENSATION: Record<ElementId, number> = {
  agua: 0.2, fogo: -0.8, terra: -0.5, ar: -0.9, sombra: 1.2, luz: 0.1, planta: 0.5, industrial: 0.6,
};
// `/* @__PURE__ */`: sem ele o Rollup não descarta ORACLE_QUESTIONS (copy longa) do chunk de entrada.
export const RITUAL_ALIGNMENT_SCALE = /* @__PURE__ */ escalaDoRitual(ALIGNMENT_ORDER, fx => fx.alignments);
/** Mesma lógica para os REINOS (floresta esperava 1,17 por pessoa, akasha 0,17). */
// `/* @__PURE__ */`: sem ele o Rollup não descarta ORACLE_QUESTIONS (copy longa) do chunk de entrada.
export const RITUAL_REALM_SCALE = /* @__PURE__ */ escalaDoRitual(REALM_ORDER, fx => fx.realms);

/** Caminho do ritual: `curto` = só as 6 perguntas; `longo` = + os 20 itens. */
export type CaminhoRitual = 'curto' | 'longo';
/**
 * Compensação de DOMINÂNCIA de papel e reino, no mesmo espírito de
 * `ELEMENT_DOMINANCE_COMPENSATION`, mas POR CAMINHO do ritual. ⚠️ Fase 1 do
 * Oráculo (28/09/2026): a auditoria (`npm run oraculo:auditoria`, seeds de
 * validação) mediu papel 1,89× e reino 2,75× — `magico` ~26% contra
 * `alcance` ~11%, e `akasha`/`floresta` ~16% contra `cavernas`/`deserto`
 * ~7%. A forma do viés é DIFERENTE nos dois caminhos (sem os 20 itens todo
 * traço fica em 50 e só `akasha` sobra; com eles, `floresta` sobe e
 * `cavernas`/`deserto` caem), então uma tabela só não fecha os dois.
 * Unidades: pontos de share (média 20 num papel, ~11 num reino), somados
 * ANTES do ritual e da normalização. Calibrado por simulação com a seed de
 * CALIBRAÇÃO 20260928 (N=3000 por caminho), validado pela auditoria.
 * Exportado mutável só para o script de calibração; ninguém mais escreve.
 */
export const ROLE_DOMINANCE_COMPENSATION: Record<CaminhoRitual, Record<RoleId, number>> = {
  curto: { suporte: 0.46, tanque: -0.49, fisico: 0.39, magico: -0.71, alcance: 0.35 },
  longo: { suporte: -0.27, tanque: -0.18, fisico: 1.52, magico: -1.66, alcance: 0.58 },
};
export const ELEMENT_PATH_COMPENSATION: Record<CaminhoRitual, Record<ElementId, number>> = {
  curto: { agua: 0, fogo: 0, terra: 0, ar: 0, sombra: 0, luz: 0, planta: 0, industrial: 0 },
  longo: { agua: -0.45, fogo: 1.05, terra: 0.65, ar: -0.1, sombra: 0.93, luz: -0.82, planta: -0.73, industrial: -0.53 },
};
export const REALM_DOMINANCE_COMPENSATION: Record<CaminhoRitual, Record<RealmId, number>> = {
  curto: { deserto: 0.51, picos: 0.21, oceano: 0.05, pantano: -0.03, floresta: 0.01, cavernas: 0, gelo: -0.12, campina: 0.16, akasha: -0.79 },
  longo: { deserto: 1.31, picos: 0.39, oceano: 0.02, pantano: -0.07, floresta: -0.5, cavernas: 0.53, gelo: -0.38, campina: -0.27, akasha: -1.03 },
};

// ----- Alinhamento (poder / harmonia / benevolência) -----

export const NUMBER_ALIGNMENT: Record<number, AlignmentId> = {
  1: 'poder', 2: 'harmonia', 3: 'harmonia', 4: 'poder', 5: 'harmonia', 6: 'benevolencia',
  7: 'harmonia', 8: 'poder', 9: 'benevolencia', 11: 'harmonia', 22: 'poder', 33: 'benevolencia',
};

export const ZODIAC_ELEMENT_ALIGNMENT: Record<string, AlignmentId> = {
  fogo: 'poder', terra: 'harmonia', ar: 'harmonia', agua: 'benevolencia',
};

// Rato, Boi, Tigre, Coelho, Dragão, Serpente, Cavalo, Cabra, Macaco, Galo, Cão, Porco
export const CHINESE_ANIMAL_ALIGNMENT: AlignmentId[] = [
  'harmonia', 'harmonia', 'poder', 'benevolencia', 'poder', 'harmonia',
  'poder', 'benevolencia', 'harmonia', 'poder', 'benevolencia', 'benevolencia',
];

export const ROLE_ALIGNMENT: Record<RoleId, AlignmentId> = {
  fisico: 'poder', tanque: 'benevolencia', suporte: 'benevolencia',
  magico: 'harmonia', alcance: 'harmonia',
};

// ----- Reino: pesos de cada elemento na afinidade com cada reino -----
// realmScore = Σ (peso × pontos do elemento) + bônus de alinhamento + jitter
// determinístico do input (desempate único por pessoa).

// Os pesos de CADA reino somam 6. Antes não somavam: deserto/pantano/
// cavernas/akasha somavam 6 e picos/floresta/gelo/campina somavam 5 (oceano,
// o pior, somava 4) — um teto estruturalmente menor que o dos concorrentes,
// independente da pessoa. Em simulação isso deixava o oceano literalmente
// inalcançável (0 de 2000 perfis) e os outros quatro muito atrás. Com todos
// somando 6, nenhum reino leva vantagem embutida na tabela; a diferença de
// frequência passa a vir de quão comuns são os elementos que ele pede, que é
// o que a tabela deveria estar dizendo.
export const REALM_WEIGHTS: Record<RealmId, Partial<Record<ElementId, number>>> = {
  deserto: { fogo: 3, terra: 2, industrial: 1 },
  picos: { ar: 3, fogo: 2, industrial: 1 },
  oceano: { agua: 4, sombra: 2 },
  pantano: { agua: 2, sombra: 2, planta: 2 },
  floresta: { planta: 3, terra: 2, agua: 1 },
  cavernas: { terra: 3, sombra: 2, industrial: 1 },
  gelo: { agua: 3, ar: 2, luz: 1 },
  campina: { luz: 2, planta: 2, ar: 2 },
  akasha: { luz: 3, sombra: 3 },
};



/**
 * Gera a leitura carregando as famílias visuais sob demanda (`import()`) —
 * é o caminho de PRODUÇÃO: mantém `CREATURE_FAMILIES` fora do chunk de
 * entrada. Mesma seed → mesma saída que `generateOracleWithFamilies`.
 */
/** Entrada sem classe calculada — UI, rascunho, testes, caminho legado. */
export type OracleInputSync = OracleInput;
/** Entrada do pipeline: a classe real já foi calculada (`computeClassTitle`).
 *  A chave é OBRIGATÓRIA — `undefined` é decisão explícita ("sem traço de
 *  arquétipo"), nunca esquecimento. */
export type OracleInputWithClass = Omit<OracleInput, 'promptClassFlavor'> & {
  promptClassFlavor: string | undefined; // EN, curto (ex.: "Volcanologist")
};

// `generateOracleAsync` mora em `oracle/gerar.ts` (04/10/2026): o `App.tsx` o chama por
// `import()`, e um `import()` de ESTE módulo — que o App também importa estático —
// faz o Rollup manter o módulo inteiro (namespace completo) no chunk de entrada.
export { generateOracleAsync } from './oracle/gerar';

