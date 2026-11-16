// Tipos, constantes e leitura tolerante do save da incursão do Calabouço (`rogueDungeon.ts`). Separado porque o provider do save
// (`GameStateContext`, chunk de entrada) só precisa de `sanitizeRogueRun` — o motor (combate/arena) fica no chunk da tela.

/**
 * ESTRUTURA DA INCURSÃO (dono único). REGISTRO §457 (16/11/2026): 3 andares × 8 desafios (24) → 3 andares × 5 desafios (15), ~1/3 mais curta
 * (-37,5%). Os 3 andares ficam (nós do mapa, feito `rogueFloors`, missões, bônus de andar); encurta o andar. O prêmio por incursão NÃO muda:
 * cada desafio vencido vale `ROGUE_LEGACY_STEPS / ROGUE_MAX_STEPS` (= 1,6) do que valia (`rogueWinValue`, em `rogueDungeon.ts`).
 */
export const ROGUE_FLOORS = 3;
export const ROGUE_PER_FLOOR = 5;
export const ROGUE_MAX_STEPS = ROGUE_FLOORS * ROGUE_PER_FLOOR; // 15
export const ROGUE_COMBAT_EVERY = 3; // combate obrigatório no 3º desafio do andar e no último (5º)
/** Desafios do andar a partir do índice (0-based) em que o inimigo sobe 1 "andar de golpes" e 1 slot (era `k >= 4` com 8 por andar). */
export const ROGUE_LATE_FROM = 3;
/** Estrutura ANTERIOR (3×8): só para migrar saves antigos e para o valor por vitória; nunca para jogar. */
export const ROGUE_LEGACY_STEPS = 24;
/** Versão da forma da incursão no save: sem ela (ou ≠) o save é da estrutura 3×8 e `sanitizeRogueRun` converte uma vez. */
export const ROGUE_SAVE_VERSION = 2;
export const ROGUE_FLOOR_BONUS = 3;
/** Teto de score = o do servidor (`functions/api/_rankings.js`, 33): o score continua na escala antiga (vitória vale `ROGUE_LEGACY_STEPS/ROGUE_MAX_STEPS`). */
export const ROGUE_MAX_SCORE = ROGUE_LEGACY_STEPS + ROGUE_FLOORS * ROGUE_FLOOR_BONUS; // 33

export type PathKind = 'combat' | 'puzzle' | 'minigame' | 'explore';
export type BonusKind = 'power' | 'vigor' | 'heal';
export const PATH_KINDS: readonly PathKind[] = ['combat', 'puzzle', 'minigame', 'explore'];
export const BONUS_KINDS: readonly BonusKind[] = ['power', 'vigor', 'heal'];

/** Cada `power` = +6% ATK, cada `vigor` = +10% HP, cada `heal` = escudo de 15% do HP no próximo combate. */
/**
 * ESCALA DO INIMIGO nas lutas SEGUIDAS do Calabouço (dono, 28/10/2026: "batalhas fáceis, principalmente as seguidas"): além do andar,
 * o inimigo ganha +1 "andar de golpes" (`dungeonFoe`) a cada `stepsPerFloor` passos da incursão (0 = sem escala, o desenho anterior) e
 * `flat` andares fixos. Dono único; medido por `winrateModos.sim.test.ts` (meta: ~60-70% de incursões completas).
 */
export const ROGUE_FOE_RAMP = { stepsPerFloor: 1.75, flat: 2 } as const; // §457: recalibrada p/ 3×5 (completas 66,5%; eram 70,5% em 3×8; faixa do dono 60-75%)

/** §457: cada escolha vale 1,6× (24/15) o que valia, para o poder acumulado no ÚLTIMO passo ficar igual (menos escolhas, mesma força). */
export const POWER_STEP = 0.096; // era 0,06
export const VIGOR_STEP = 0.16; // era 0,10
export const HEAL_SHIELD = 0.15; // por escudo; não escala (o escudo é gasto 1 por combate e há menos combates)

export interface RogueRun {
  /** Versão da estrutura (`ROGUE_SAVE_VERSION`). Ausente = save da estrutura 3×8 (convertido na leitura). */
  v?: number;
  /** Dia do jogador (ISO) a que a incursão pertence. */
  day: string;
  /** Passos já resolvidos (vencidos ou errados), 0..24. */
  step: number;
  /** Desafios vencidos. */
  won: number;
  /** ⚰️ §239: combate perdido não encerra mais o dia; só lê save antigo. */
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
  /**
   * Vida atual da incursão como fração do HP máximo (0..1): CONTINUA de luta em luta e de andar em andar (só o reset diário a enche).
   * Opcional: save antigo não tem = vida cheia. Campo novo SEM espelho no servidor (como todo o `rogueDungeon`).
   */
  hp?: number;
  /** §239: derrota em combate. Quando a vida ficou no piso; ela recupera com o relógio a partir daqui. Sem o campo = não está recuperando. */
  hpAt?: number;
  /** §239: Bits já pagos desta incursão, para a derrota pagar o que rendeu sem pagar duas vezes no fim. */
  paidWon?: number;
}

/** Vida atual da incursão (fração 0..1); sem o campo = cheia. */
export const hpOf = (r: Pick<RogueRun, 'hp'>): number => (typeof r.hp === 'number' && Number.isFinite(r.hp) ? Math.max(0.01, Math.min(1, r.hp)) : 1);

export const emptyRun = (day: string): RogueRun => ({ v: ROGUE_SAVE_VERSION, day, step: 0, won: 0, over: false, power: 0, vigor: 0, shield: 0, bonusPending: false, paid: false });

const int = (v: unknown, max: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Leitura tolerante do save: lixo vira `undefined`; números ficam dentro dos tetos. Save da estrutura 3×8 (sem `v`) é convertido
 *  proporcionalmente para 3×5 UMA vez (idempotente: sai com `v` atual); andares concluídos e prêmio proporcional se preservam. */
export function sanitizeRogueRun(raw: unknown): RogueRun | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day)) return undefined;
  const legacy = r.v !== ROGUE_SAVE_VERSION;
  const cap = legacy ? ROGUE_LEGACY_STEPS : ROGUE_MAX_STEPS;
  const conv = (n: number): number => (legacy ? Math.min(ROGUE_MAX_STEPS, Math.round((n * ROGUE_MAX_STEPS) / ROGUE_LEGACY_STEPS)) : n);
  const step = conv(int(r.step, cap));
  const won = Math.min(conv(int(r.won, cap)), step);
  const paidWon = Math.min(conv(int(r.paidWon, cap)), won);
  return {
    v: ROGUE_SAVE_VERSION, day: r.day, step, won, over: r.over === true,
    power: conv(int(r.power, cap)), vigor: conv(int(r.vigor, cap)), shield: conv(int(r.shield, cap)),
    bonusPending: r.bonusPending === true, paid: r.paid === true,
    ...(typeof r.hp === 'number' && Number.isFinite(r.hp) && r.hp < 1 ? { hp: Math.max(0.01, Math.max(0, r.hp)) } : {}),
    ...(typeof r.hpAt === 'number' && Number.isFinite(r.hpAt) && r.hpAt > 0 ? { hpAt: r.hpAt } : {}),
    ...(paidWon > 0 ? { paidWon } : {}),
    ...(typeof r.pending === 'string' && (PATH_KINDS as readonly string[]).includes(r.pending) && r.pending !== 'combat' ? { pending: r.pending as PathKind } : {}),
  };
}
