/**
 * TROCA DE REGRA — a lógica pura do jogo de separar cartas
 * (`docs/BENCHMARK-MINIJOGOS.md` §6.4, formato DCCS/Wisconsin).
 *
 * Cada carta tem DUAS dimensões binárias, as duas visíveis:
 *  · FORMA — criatura jovem (arte rookie/champion) ou crescida (ultimate/mega);
 *  · LUGAR — fundo de céu (claro) ou de gruta (escuro).
 * A regra vigente diz qual dimensão manda. Os dois destinos carregam as duas
 * dimensões CRUZADAS (esquerda = jovem · céu, direita = crescida · gruta), então
 * uma carta "jovem na gruta" vai para lados diferentes conforme a regra.
 *
 * A regra troca depois de 5 a 8 acertos na regra atual (sorteado). Errar não
 * zera nada: só não conta como acerto. Tudo aqui é puro — o sorteio vem de
 * `rng` por parâmetro, para o teste fixar a sequência.
 */
import { DUNGEON_LINE_SPRITES } from '../sprites';

export type Forma = 'young' | 'grown';
export type Lugar = 'sky' | 'cave';
export type TrocaRule = 'forma' | 'lugar';
export type TrocaSide = 'left' | 'right';
export type ArtTier = 'rookie' | 'champion' | 'ultimate' | 'mega';

export interface TrocaCard {
  id: number;
  line: string;
  tier: ArtTier;
  forma: Forma;
  lugar: Lugar;
}

/** Duração da sessão (ms). */
export const TROCA_SESSION_MS = 60_000;
/** Cartas por sessão. */
export const TROCA_DECK_SIZE = 30;
/** A regra troca depois de N acertos, N sorteado neste intervalo (inclusivo). */
export const TROCA_SWITCH_MIN = 5;
export const TROCA_SWITCH_MAX = 8;
/** Teto de Bits de uma sessão. */
/** Acertos por Bit. */
export const TROCA_CORRECT_PER_BIT = 5;
/** O teto É o que uma rodada alcança (30 cartas ÷ 5) — balanço de 30/09/2026:
 *  era 10, inalcançável, e a folha anunciava "até 10 Bits" que ninguém via. */
export const TROCA_MAX_BITS = Math.floor(TROCA_DECK_SIZE / TROCA_CORRECT_PER_BIT);
/** Fração de cartas "em conflito" (as duas dimensões apontam lados opostos). */
export const TROCA_CONFLICT_RATIO = 0.7;

export type Rng = () => number;

/** Bits de uma sessão: 1 a cada 5 acertos, teto 10. */
export function trocaBits(correct: number): number {
  const n = Math.floor(Math.max(0, correct) / TROCA_CORRECT_PER_BIT);
  return Math.min(TROCA_MAX_BITS, n);
}

/** O lado certo da carta sob a regra. */
export function sideFor(card: Pick<TrocaCard, 'forma' | 'lugar'>, rule: TrocaRule): TrocaSide {
  if (rule === 'forma') return card.forma === 'young' ? 'left' : 'right';
  return card.lugar === 'sky' ? 'left' : 'right';
}

export function isCorrect(card: Pick<TrocaCard, 'forma' | 'lugar'>, rule: TrocaRule, side: TrocaSide): boolean {
  return sideFor(card, rule) === side;
}

/** As duas dimensões apontam lados diferentes? (só essas separam as regras) */
export function isConflict(card: Pick<TrocaCard, 'forma' | 'lugar'>): boolean {
  return sideFor(card, 'forma') !== sideFor(card, 'lugar');
}

const pick = <T,>(arr: readonly T[], rng: Rng): T => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

/**
 * O baralho da sessão. ~70% das cartas em conflito; nenhuma carta repete a
 * combinação (forma, lugar) da anterior três vezes seguidas, para o lado
 * certo não virar padrão decorável.
 */
export function buildDeck(size: number, rng: Rng, lines: readonly string[] = Object.keys(DUNGEON_LINE_SPRITES)): TrocaCard[] {
  const deck: TrocaCard[] = [];
  for (let i = 0; i < size; i++) {
    const conflict = rng() < TROCA_CONFLICT_RATIO;
    let forma: Forma = rng() < 0.5 ? 'young' : 'grown';
    let lugar: Lugar = conflict ? (forma === 'young' ? 'cave' : 'sky') : (forma === 'young' ? 'sky' : 'cave');
    const a = deck[i - 1];
    const b = deck[i - 2];
    if (a && b && a.forma === forma && b.forma === forma && a.lugar === lugar && b.lugar === lugar) {
      forma = forma === 'young' ? 'grown' : 'young';
      lugar = lugar === 'sky' ? 'cave' : 'sky';
    }
    const tier: ArtTier = forma === 'young'
      ? (rng() < 0.5 ? 'rookie' : 'champion')
      : (rng() < 0.5 ? 'ultimate' : 'mega');
    deck.push({ id: i, line: pick(lines, rng), tier, forma, lugar });
  }
  return deck;
}

/** Quantos acertos até a próxima troca (5..8). */
export function nextSwitchAfter(rng: Rng): number {
  const span = TROCA_SWITCH_MAX - TROCA_SWITCH_MIN + 1;
  return TROCA_SWITCH_MIN + Math.min(span - 1, Math.floor(rng() * span));
}

export interface TrocaState {
  rule: TrocaRule;
  /** Acertos desde a última troca de regra. */
  streak: number;
  /** Acertos que disparam a próxima troca. */
  switchAt: number;
  /** Cartas já separadas (certas ou não). */
  dealt: number;
  correct: number;
  /** Quantas vezes a regra já trocou (a UI usa para pulsar a pista). */
  switches: number;
}

export function initialTrocaState(rng: Rng, rule: TrocaRule = 'forma'): TrocaState {
  return { rule, streak: 0, switchAt: nextSwitchAfter(rng), dealt: 0, correct: 0, switches: 0 };
}

export interface SortResult {
  state: TrocaState;
  correct: boolean;
  switched: boolean;
}

/** Aplica uma separação. Errar não zera a sequência — só não soma. */
export function applySort(state: TrocaState, card: TrocaCard, side: TrocaSide, rng: Rng): SortResult {
  const ok = isCorrect(card, state.rule, side);
  let next: TrocaState = {
    ...state,
    dealt: state.dealt + 1,
    correct: state.correct + (ok ? 1 : 0),
    streak: state.streak + (ok ? 1 : 0),
  };
  let switched = false;
  if (ok && next.streak >= next.switchAt) {
    next = {
      ...next,
      rule: next.rule === 'forma' ? 'lugar' : 'forma',
      streak: 0,
      switchAt: nextSwitchAfter(rng),
      switches: next.switches + 1,
    };
    switched = true;
  }
  return { state: next, correct: ok, switched };
}

/** A sessão acabou? (baralho inteiro ou tempo) */
export function trocaOver(state: TrocaState, elapsedMs: number, deckSize = TROCA_DECK_SIZE): boolean {
  return state.dealt >= deckSize || elapsedMs >= TROCA_SESSION_MS;
}

/** RNG determinístico (mulberry32) — para teste e para quem quiser semente. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
