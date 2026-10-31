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

export interface EvolutionCrystal {
  v: 1;
  /** O estágio de onde partiu. Se o estágio mudou (queda, renascer), o cristal deixa de valer. */
  from: string;
  /** A forma-destino decidida NO TOQUE (o empate de galho se resolve aqui, uma vez). */
  to: string;
  branch: Branch;
  /** ISO do toque. */
  since: string;
}

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
  return { v: 1, from: r.from, to: r.to, branch, since: r.since };
}

/** O cristal que VALE agora: só se ele partiu do estágio atual. */
export function activeCrystal(state: { evolutionCrystal?: EvolutionCrystal; evolutionStage: string }): EvolutionCrystal | null {
  const c = state.evolutionCrystal;
  return c && c.from === state.evolutionStage ? c : null;
}

export function startCrystal(from: string, to: string, branch: Branch, now: Date): EvolutionCrystal {
  return { v: 1, from, to, branch, since: now.toISOString() };
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
