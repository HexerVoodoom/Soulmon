/**
 * Lógica pura do duelo 2x1 da intro narrativa (plano docs/PLANO-INTRO-NARRATIVA.md D-08/D-09, N4).
 * Roteirizado e determinístico: o Soulmon do jogador e o aliado do ancião contra o Soulmon do Desfeito.
 * O inimigo tem vantagem (muita vida) e SÓ ataca o aliado do ancião; o Soulmon do jogador nunca perde
 * vida e o jogador nunca falha. A luta corta quando a vida do aliado chega a 1/3 ou menos. Sem save,
 * sem servidor, sem recompensa.
 */
export interface DueloState {
  /** Aliado do ancião: o único que sofre dano. */
  aliado: number;
  /** Soulmon do jogador: nunca perde vida. */
  jogador: number;
  inimigo: number;
  rodada: number;
}

export const DUELO_MAX = { aliado: 60, jogador: 40, inimigo: 140 } as const;
export const DUELO_CORTE = 1 / 3;
/** Dano do inimigo no aliado, por rodada (cicla). */
export const DANO_INIMIGO = [8, 9, 7, 9, 8] as const;

export const duelStart = (): DueloState => ({ ...DUELO_MAX, rodada: 0 });

/** A luta corta quando o aliado chega a 1/3 da vida ou menos. */
export const aliadoCortou = (s: DueloState): boolean => s.aliado <= Math.ceil(DUELO_MAX.aliado * DUELO_CORTE);

export interface Rodada { state: DueloState; danoNoInimigo: number; danoNoAliado: number }

/** Uma rodada: o Soulmon do jogador e o aliado golpeiam; o inimigo revida no aliado. Depois do corte, não muda nada. */
export function duelRodada(s: DueloState): Rodada {
  if (aliadoCortou(s)) return { state: s, danoNoInimigo: 0, danoNoAliado: 0 };
  const golpeJogador = 9 + (s.rodada % 3);
  const golpeAliado = 7;
  const inimigo = Math.max(1, s.inimigo - golpeJogador - golpeAliado);
  const dano = DANO_INIMIGO[s.rodada % DANO_INIMIGO.length];
  const aliado = Math.max(1, s.aliado - dano);
  return {
    state: { aliado, jogador: s.jogador, inimigo, rodada: s.rodada + 1 },
    danoNoInimigo: s.inimigo - inimigo,
    danoNoAliado: s.aliado - aliado,
  };
}
