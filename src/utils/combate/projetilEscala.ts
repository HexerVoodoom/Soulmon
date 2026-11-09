/**
 * Escala do projétil por PERSPECTIVA (só visual; não mexe em dano nem balanço).
 *
 * A câmera é baixa: o jogador fica mais perto, o inimigo mais longe. Logo:
 *  · usuário → inimigo (afasta): o projétil comum cresce ~10% no trajeto (1,00 → 1,10).
 *  · inimigo → usuário (aproxima): sai ~10% maior e diminui ~10% (1,10 → 1,00).
 *  · corte À DISTÂNCIA, usuário → inimigo: sai pequeno (`CUT_START`) e cresce até o tamanho do corte do melee (1,00).
 *    (a lâmina "nasce" no conjurador e se revela até o tamanho de impacto).
 *  · corte à distância, inimigo → usuário: simétrico ao comum — sai ~10% maior e encolhe pouco (1,10 → 1,00);
 *    como o alvo é o jogador (perto), o corte já sai grande e só assenta no tamanho final.
 * Os extremos viram variáveis CSS (`--s0`/`--s1`) do keyframe `sm-bs-fly-persp` (src/index.css); `projectileScale`
 * é a mesma interpolação em JS, para teste e para quem precisar do valor num progresso.
 */
export type ProjectileKind = 'orb' | 'cut';
export type ProjectileDir = 'toFoe' | 'toMe';

export const PERSP_GROW = 1.1;
/** Corte à distância nasce quase invisível e cresce até 100% no trajeto, nos DOIS sentidos (dono, 09/11/2026). */
export const CUT_START = 0.05;

/** Escala inicial e final (relativas ao tamanho-base da arte). */
export function projectileScaleRange(kind: ProjectileKind, dir: ProjectileDir): { from: number; to: number } {
  if (kind === 'cut') return { from: CUT_START, to: 1 };
  return dir === 'toMe' ? { from: PERSP_GROW, to: 1 } : { from: 1, to: PERSP_GROW };
}

/** Escala no progresso `t` (0..1, limitado) do trajeto, interpolação linear. */
export function projectileScale(kind: ProjectileKind, dir: ProjectileDir, t: number): number {
  const { from, to } = projectileScaleRange(kind, dir);
  const p = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  return from + (to - from) * p;
}
