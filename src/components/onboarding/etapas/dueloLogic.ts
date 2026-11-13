/**
 * Lógica pura do duelo do onboarding (PLANO-ONBOARDING-VELADO §3 cena 7, D16).
 * Dupla (jogador + BB) ao lado do ancião Velado contra o Desfeito e o Soulmon-pesadelo.
 * Regras: quem toma dano é SEMPRE o lado do ancião; o jogador e o BB dele nunca perdem HP;
 * a luta corta quando o HP total do inimigo cai a ~1/3. Sem servidor, sem save, sem recompensa.
 */
export type DueloActor = 'desfeito' | 'pesadelo';
export type DueloVictim = 'anciao' | 'anciaoSoulmon';

export interface DueloState {
  /** HP do lado do ancião (único que sofre dano). */
  anciao: number;
  anciaoSoulmon: number;
  /** HP do inimigo. */
  desfeito: number;
  pesadelo: number;
  turn: number;
}

export const DUELO_MAX = { anciao: 60, anciaoSoulmon: 60, desfeito: 45, pesadelo: 45 } as const;
export const DUELO_CUT_FRACTION = 1 / 3;

export function duelStart(): DueloState {
  return { ...DUELO_MAX, turn: 0 };
}

export const enemyHp = (s: DueloState) => s.desfeito + s.pesadelo;
export const enemyMaxHp = () => DUELO_MAX.desfeito + DUELO_MAX.pesadelo;
/** A luta corta quando o inimigo cai a ~1/3 da vida. */
export const duelCut = (s: DueloState) => enemyHp(s) <= Math.ceil(enemyMaxHp() * DUELO_CUT_FRACTION);

/** Golpe da dupla no inimigo: alterna entre os dois, determinístico. */
export function duelPlayerStrike(s: DueloState): DueloState {
  if (duelCut(s)) return s;
  const dmg = 9 + (s.turn % 3); // 9,10,11
  const onDesfeito = s.desfeito > 0 && (s.turn % 2 === 0 || s.pesadelo <= 0);
  return {
    ...s,
    desfeito: onDesfeito ? Math.max(0, s.desfeito - dmg) : s.desfeito,
    pesadelo: onDesfeito ? s.pesadelo : Math.max(0, s.pesadelo - dmg),
    turn: s.turn + 1,
  };
}

/** Contra-ataque do inimigo: a vítima é SEMPRE do lado do ancião, e o HP nunca zera (piso 1). */
export function duelFoeStrike(s: DueloState): { state: DueloState; victim: DueloVictim; by: DueloActor } {
  const by: DueloActor = s.turn % 2 === 0 ? 'desfeito' : 'pesadelo';
  const victim: DueloVictim = s.turn % 2 === 0 ? 'anciao' : 'anciaoSoulmon';
  const dmg = 5;
  return { state: { ...s, [victim]: Math.max(1, s[victim] - dmg) }, victim, by };
}
