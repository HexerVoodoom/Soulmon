/**
 * PARA ONDE A ARTE DE CADA FX OLHA, e o espelho que cada caso recebe — DONO ÚNICO (REGISTRO §151, 20/10/2026).
 *
 * O defeito que isto fecha: `BattleStage` assumia que TODA arte de FX é desenhada "para a direita" e espelhava só o
 * golpe do inimigo. A arte, porém, não é uniforme (de 155 elementos, 48 projéteis têm a cabeça à ESQUERDA e 116
 * cortes têm o bojo à esquerda), então o ataque do inimigo saía "de trás pra frente" num elemento e certo noutro, e o
 * do jogador errava nos opostos. Regra agora: o espelho NUNCA é escolhido por lado ("inimigo = espelha"); sai de
 * (para onde a arte olha) × (para onde o golpe vai), uma conta só, aqui.
 *
 * Convenção, vale para todo FX (molde: `spriteUrlFacesLeft`/`LEFT_FACING_*` em `utils/sprites.ts`):
 *  · "olha para" = a direção para onde o efeito aponta/viaja; tabela MEDIDA do PNG (`scripts/fx-facing.mjs` →
 *    `fxFacingTable.ts`, e `fxFacing.contract.test.ts` remede e reprova tabela velha) — nunca escrita à mão;
 *  · orb → a cabeça do projétil · slash → o bojo do crescente · defended → para onde o golpe recebido anda;
 *  · cast/aura/impact são simétricos por contrato (o teste mede): nunca espelham.
 * Jogador à ESQUERDA do palco (o golpe dele vai para a direita), inimigo à DIREITA (vai para a esquerda).
 */
import { FX_FACING_TABLE } from './fxFacingTable';
import { fxArtId } from './combatFx';
import type { AttackFxState } from './attackFxArt';

export type FxFacing = 'R' | 'L' | 'S';
/** Para onde o golpe vai no palco: o do jogador vai para a direita, o do inimigo para a esquerda. */
export type FxTravel = 'right' | 'left';

const STATE_INDEX = { orb: 0, slash: 1, defended: 2 } as const;
/** Os estados que têm sentido (os outros são simétricos). */
export const DIRECTIONAL_FX_STATES = ['orb', 'slash', 'defended'] as const;

/** O sentido do golpe de quem age: `me` (esquerda do palco) → direita; `foe` → esquerda. */
export const travelOf = (actor: 'me' | 'foe'): FxTravel => (actor === 'me' ? 'right' : 'left');

/** Para onde a arte que será DESENHADA (já com o fallback para o `neutro`) olha. Estados simétricos: `S`. */
export function fxFacing(elementId: string | null | undefined, estado: AttackFxState): FxFacing {
  const idx = (STATE_INDEX as Record<string, number | undefined>)[estado];
  if (idx === undefined) return 'S';
  const row = FX_FACING_TABLE[fxArtId(elementId, estado)] ?? FX_FACING_TABLE.neutro;
  const c = row?.[idx];
  return c === 'R' || c === 'L' ? c : 'S';
}

/** Espelha na horizontal para a arte apontar no sentido do golpe? (Simétrica nunca espelha.) */
export function fxMirror(elementId: string | null | undefined, estado: AttackFxState, travel: FxTravel): boolean {
  const f = fxFacing(elementId, estado);
  if (f === 'S') return false;
  return f !== (travel === 'right' ? 'R' : 'L');
}

/**
 * O projétil: gira até o alvo (`angDeg` = ângulo origem→alvo) e espelha o que for preciso. Indo para a esquerda
 * gira `ang−180` e espelha — a arte nunca fica de cabeça para baixo (antes girava 180° e a arte do inimigo saía invertida).
 */
export function orbPose(elementId: string | null | undefined, travel: FxTravel, angDeg: number): { rot: number; flip: boolean } {
  const flip = fxMirror(elementId, 'orb', travel);
  if (travel === 'right') return { rot: angDeg, flip };
  let rot = angDeg - 180;
  if (rot < -180) rot += 360;
  return { rot, flip };
}
