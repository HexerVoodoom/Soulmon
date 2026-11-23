/**
 * O CRISTAL DA EVOLUÇÃO (pedido do dono, 31/10/2026 — REGISTRO §208).
 *
 * O fluxo: a barra de Fragmentos chega a 100% → aparece o botão Evoluir (Home e
 * Centro de Evolução) → o toque põe o Soulmon NO CRISTAL. É a primeira etapa
 * real da evolução: enquanto ele está no cristal a forma nova é desenhada (o
 * lote de sprite da forma-destino parte AGORA, não antes). No cristal ele fica
 * PARADO na Home. Quando a arte fica pronta, a cerimônia nova (o cristal treme,
 * racha em luz turquesa, estilhaça e revela) toca e a evolução é commitada.
 *
 * Bloqueios (decisão do dono): SÓ Masmorra (Calabouço), Fenda Sem Fim, Feira,
 * Grove e Arena (Torneio + Arena livre). Todo o resto — cuidar, tarefas,
 * minijogos, Passeio — segue funcionando.
 *
 * Falha: o cristal NUNCA prende para sempre. Se a geração falha, o teto bate,
 * ou nada chega em `CRYSTAL_STUCK_MS`, a fase vira `falhou`: o jogador pode
 * tentar de novo ou seguir com a arte de reserva.
 *
 * Este módulo é PURO: o `App.tsx` só delega.
 */
import type { Branch } from './evolutionTarget';
import { hasSprite, isAccountCapped, isFormCapped, type SpriteLibrary } from './spriteLibrary';
import { altSpriteKey, elementoDaForma, type FormasAlt } from './formasAlternativas';
import type { ElementoJornada } from './elementoJornada';

export interface EvolutionCrystal {
  v: 1;
  /** O estágio de onde partiu. Se o estágio mudou (queda, renascer), o cristal deixa de valer. */
  from: string;
  /** A forma-destino decidida NO TOQUE (o empate de galho se resolve aqui, uma vez). */
  to: string;
  branch: Branch;
  /** ISO do toque. */
  since: string;
  /**
   * A chave de acervo da forma-destino, CONGELADA no toque (`forma` ou `forma@elemento`). Recalculada a cada render ela mudava quando a própria arte
   * recém-chegada entrava no acervo, e o lote da forma partia uma 2ª vez (REGISTRO §404). Ausente = cristal anterior a esta correção: recalcula.
   */
  key?: string;
}

const KEY_RE = /^(?:ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))(?:@[a-z_]{2,24})?$/;

export type CrystalPhase = 'gerando' | 'falhou' | 'pronto';

/** Sem arte nova depois disto, o cristal oferece seguir com a arte de reserva (nunca prende). */
export const CRYSTAL_STUCK_MS = 10 * 60 * 1000;

/** Os prédios fechados enquanto ele está no cristal (`area.lote`). */
export const CRYSTAL_BLOCKED_LOTS: readonly string[] = [
  'exploracao.dungeon', // Masmorra (Calabouço)
  'exploracao.fenda',   // Fenda Sem Fim
  'hall.feira',
  'hall.grove',
  'arena.torneio',
  'arena.duelo',        // Arena livre
  'arena.guerra',       // Guerra de Clãs (dono, 31/10)
];

export function crystalBlocksLot(area: string, lotId: string | null | undefined): boolean {
  return !!lotId && CRYSTAL_BLOCKED_LOTS.includes(`${area}.${lotId}`);
}

export function crystalRefusalText(isPt: boolean): string {
  return isPt
    ? 'Seu Soulmon está no cristal, evoluindo. Volte aqui depois da transformação.'
    : 'Your Soulmon is in the crystal, evolving. Come back after the transformation.';
}

const BRANCHES: readonly string[] = ['power', 'harmony', 'benevolence'];

/** Lê o campo do save sem confiar nele. */
export function sanitizeCrystal(raw: unknown): EvolutionCrystal | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.from !== 'string' || typeof r.to !== 'string' || typeof r.since !== 'string') return undefined;
  if (!r.from || !r.to || r.from === r.to) return undefined;
  const branch = typeof r.branch === 'string' && BRANCHES.includes(r.branch) ? (r.branch as Branch) : 'harmony';
  const key = typeof r.key === 'string' && KEY_RE.test(r.key) && r.key.split('@')[0] === r.to ? r.key : undefined;
  return { v: 1, from: r.from, to: r.to, branch, since: r.since, ...(key ? { key } : {}) };
}

/** O cristal que VALE agora: só se ele partiu do estágio atual. */
export function activeCrystal(state: { evolutionCrystal?: EvolutionCrystal; evolutionStage: string }): EvolutionCrystal | null {
  const c = state.evolutionCrystal;
  return c && c.from === state.evolutionStage ? c : null;
}

export function startCrystal(from: string, to: string, branch: Branch, now: Date, key?: string): EvolutionCrystal {
  return { v: 1, from, to, branch, since: now.toISOString(), ...(key ? { key } : {}) };
}

export interface CrystalPhaseInput {
  crystal: EvolutionCrystal;
  library: SpriteLibrary;
  /** Este save gera arte própria para a forma-destino? (sem árvore / demo / corvo = não). */
  canGenerate: boolean;
  /** Formas sendo desenhadas agora (`useSpriteGeneration().generating`). */
  generating: readonly string[];
  now: number;
  /** "Seguir sem a arte nova", já escolhido pelo jogador. */
  skipped?: boolean;
}

export function crystalPhase(i: CrystalPhaseInput): CrystalPhase {
  const { crystal, library } = i;
  if (i.skipped || !i.canGenerate) return 'pronto';
  if (hasSprite(library, crystal.to)) return 'pronto';
  // Teto (da conta ou da forma): não vai chegar arte nova — a reserva é o piso, nunca erro.
  if (isAccountCapped(library) || isFormCapped(library, crystal.to)) return 'pronto';
  if (i.generating.includes(crystal.to)) return 'gerando';
  if (library.failures[crystal.to]) return 'falhou';
  const t = Date.parse(crystal.since);
  if (Number.isFinite(t) && i.now - t >= CRYSTAL_STUCK_MS) return 'falhou';
  return 'gerando';
}

/** O que a chave do cristal lê do save. */
export interface CrystalKeyState {
  evolutionCrystal?: EvolutionCrystal;
  evolutionStage: string;
  evolutionPotion?: string;
  elementoJornada?: ElementoJornada;
  formasAlt?: FormasAlt;
}

/** A chave de acervo da forma-destino do cristal (`forma` ou `forma@elemento`); `null` sem cristal ativo. Congelada no toque (`EvolutionCrystal.key`). */
export function crystalSpriteKey(state: CrystalKeyState, library: SpriteLibrary): string | null {
  const c = activeCrystal(state);
  if (!c) return null;
  if (c.key) return c.key;
  return altSpriteKey(c.to, state.evolutionPotion || elementoDaForma(state.elementoJornada, c.to), state.formasAlt, library);
}

/** O cristal do TOQUE, já com a chave de acervo congelada (REGISTRO §404). `elementoJornada` = o registro JÁ com o elemento da forma-destino. */
export function startCrystalFrozen(
  state: Omit<CrystalKeyState, 'evolutionCrystal'>, library: SpriteLibrary, to: string, branch: Branch, now: Date,
): EvolutionCrystal {
  const base = startCrystal(state.evolutionStage, to, branch, now);
  const key = crystalSpriteKey({ ...state, evolutionCrystal: base }, library);
  return key ? { ...base, key } : base;
}
