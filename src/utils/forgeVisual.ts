/**
 * O VISUAL do Soulsmith por nível (REGISTRO §88, D2): o sprite da peça troca a cada `LEVELS_PER_VISUAL_TIER` níveis.
 * Cobre (a arte original da peça, níveis 1–3) → bronze → prata → núcleo dourado → prismático (níveis 13–15, o máximo).
 * O 5º degrau (prismático) é a definição de produto para "o que vem depois do dourado" — ver "Dúvidas abertas" da revisão 2.
 * Módulo PURO: só decide o NOME da arte (`equipArt.ts` carrega `eq-<slot>-t<tier>-n<2..5>.png`; o degrau 1 é o PNG original).
 */
import { FORGE_MAX_LEVEL } from './forge';

export const LEVELS_PER_VISUAL_TIER = 3;
export const VISUAL_TIERS = ['cobre', 'bronze', 'prata', 'dourado', 'prismatico'] as const;

/** O degrau visual (1..5) do nível `level`; nível fora de 1..max é preso (0 = peça não possuída → degrau 1). */
export function visualTier(level: number): number {
  const l = Math.min(FORGE_MAX_LEVEL, Math.max(1, Math.floor(level) || 1));
  return Math.min(VISUAL_TIERS.length, 1 + Math.floor((l - 1) / LEVELS_PER_VISUAL_TIER));
}

/** O nome da arte (chave de `loadEquipArt`) da peça `pieceId` no nível `level`. */
export function forgeArtName(pieceId: string, level: number): string {
  const t = visualTier(level);
  return t === 1 ? pieceId : `${pieceId}-n${t}`;
}
