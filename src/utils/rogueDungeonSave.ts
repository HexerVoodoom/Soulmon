// Tipos, constantes e leitura tolerante do save da incursão do Calabouço (`rogueDungeon.ts`). Separado porque o provider do save
// (`GameStateContext`, chunk de entrada) só precisa de `sanitizeRogueRun` — o motor (combate/arena) fica no chunk da tela.

export const ROGUE_FLOORS = 3;
export const ROGUE_PER_FLOOR = 8;
export const ROGUE_MAX_STEPS = ROGUE_FLOORS * ROGUE_PER_FLOOR; // 24
export const ROGUE_COMBAT_EVERY = 3;
export const ROGUE_FLOOR_BONUS = 3;
export const ROGUE_MAX_SCORE = ROGUE_MAX_STEPS + ROGUE_FLOORS * ROGUE_FLOOR_BONUS; // 33 (espelho: functions/api/_rankings.js)

export type PathKind = 'combat' | 'puzzle' | 'minigame' | 'explore';
export type BonusKind = 'power' | 'vigor' | 'heal';
export const PATH_KINDS: readonly PathKind[] = ['combat', 'puzzle', 'minigame', 'explore'];
export const BONUS_KINDS: readonly BonusKind[] = ['power', 'vigor', 'heal'];

/** Cada `power` = +6% ATK, cada `vigor` = +10% HP, cada `heal` = escudo de 15% do HP no próximo combate. */
export const POWER_STEP = 0.06;
export const VIGOR_STEP = 0.1;
export const HEAL_SHIELD = 0.15;

export interface RogueRun {
  /** Dia do jogador (ISO) a que a incursão pertence. */
  day: string;
  /** Passos já resolvidos (vencidos ou errados), 0..24. */
  step: number;
  /** Desafios vencidos. */
  won: number;
  /** Combate perdido = dia encerrado. */
  over: boolean;
  power: number;
  vigor: number;
  /** Escudos de cura guardados (1 consumido por combate). */
  shield: number;
  /** Há um bônus a escolher antes do próximo passo. */
  bonusPending: boolean;
  /** Bits do fim da incursão já pagos (uma vez). */
  paid: boolean;
  /**
   * Desafio EM CURSO (gravado ao entrar nele, antes de jogar). Sair/desmontar/fechar o app sem terminar CONSOME o passo
   * (`consumePending`): nada de re-tentar o mesmo desafio de graça nem de espiar o jogo de cada caminho. Opcional: save antigo não tem.
   */
  pending?: PathKind;
}

export const emptyRun = (day: string): RogueRun => ({ day, step: 0, won: 0, over: false, power: 0, vigor: 0, shield: 0, bonusPending: false, paid: false });

const int = (v: unknown, max: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Leitura tolerante do save: lixo vira `undefined`; números ficam dentro dos tetos. */
export function sanitizeRogueRun(raw: unknown): RogueRun | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day)) return undefined;
  const step = int(r.step, ROGUE_MAX_STEPS);
  const won = Math.min(int(r.won, ROGUE_MAX_STEPS), step);
  return {
    day: r.day, step, won, over: r.over === true,
    power: int(r.power, ROGUE_MAX_STEPS), vigor: int(r.vigor, ROGUE_MAX_STEPS), shield: int(r.shield, ROGUE_MAX_STEPS),
    bonusPending: r.bonusPending === true, paid: r.paid === true,
    ...(typeof r.pending === 'string' && (PATH_KINDS as readonly string[]).includes(r.pending) && r.pending !== 'combat' ? { pending: r.pending as PathKind } : {}),
  };
}

