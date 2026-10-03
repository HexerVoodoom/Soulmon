import { SLOT_ORDER, DECOR_SLOTS, decorFitsSetting, type DecorFit } from './petStage';
import type { PetBackground } from './backgrounds';

/**
 * AS REGRAS DA DECORAÇÃO, EM UM LUGAR SÓ (D2, 02/10/2026, navegação do dono:
 * "hoje há limite de itens? restrição? alguma decoração exige um background?").
 *
 * Esta é a regra REAL, lida do código — não uma política nova:
 *
 *  · LIMITE: um item por ESPAÇO do palco (`SLOT_ORDER`: chão, canto esquerdo,
 *    vitrine, canto direito, parede) → no máximo `DECOR_MAX_TOTAL` peças ao
 *    mesmo tempo. Equipar numa casa ocupada TROCA, não empilha
 *    (`applyDecorEquip`). Não existe limite de quantas peças a pessoa POSSUI.
 *  · EQUIPAR é livre: o save aceita qualquer peça em qualquer cenário. A
 *    restrição é só de EXIBIÇÃO (`PetStageDecor`): a peça fica guardada e
 *    volta quando o cenário serve.
 *  · O que decide se a peça APARECE no cenário atual (`decorBlockReason`):
 *      1. o cenário precisa ter um cenário equipado (sem cenário o palco é a
 *         própria página, sem chão em que apoiar);
 *      2. o cenário não pode ser `void` (matriz, fundo do mar: sem chão);
 *      3. o cenário precisa oferecer o ESPAÇO da peça (`bg.slots`) — cenário
 *         de céu aberto não tem parede;
 *      4. a peça precisa servir ao TIPO do cenário (`item.fits`): sofá só em
 *         interior, fogueira só ao ar livre; `any` serve a todos.
 *    Todas são regras de COMPOSIÇÃO DE ARTE (a peça é desenhada para uma
 *    perspectiva de chão e de parede), não de economia — por isso não mudam
 *    sem decisão do dono (`REGISTRO-DE-DECISOES.md`).
 */

/** Quantas peças cabem ao mesmo tempo: uma por espaço do palco. */
export const DECOR_MAX_TOTAL = SLOT_ORDER.length;

/** Por que a peça NÃO aparece no cenário atual (`null` = aparece). */
export type DecorBlockReason = 'no-scene' | 'void-scene' | 'no-slot' | 'indoor-only' | 'outdoor-only';

export function decorBlockReason(
  item: { slot?: import('./petStage').SlotId; fits?: DecorFit },
  bg: Pick<PetBackground, 'setting' | 'slots'> | null | undefined,
): DecorBlockReason | null {
  if (!item.slot) return null;
  if (!bg) return 'no-scene';
  if (bg.setting === 'void') return 'void-scene';
  if (!bg.slots.includes(item.slot)) return 'no-slot';
  const fits = item.fits ?? 'any';
  if (!decorFitsSetting(fits, bg.setting)) return fits === 'indoor' ? 'indoor-only' : 'outdoor-only';
  return null;
}

/** O motivo em palavras, para a linha do item (nunca em tom de cobrança). */
export function decorReasonText(reason: DecorBlockReason, isPt: boolean): string {
  switch (reason) {
    case 'no-scene': return isPt ? 'Sem cenário equipado, a decoração não aparece.' : 'With no scene equipped, decor does not show.';
    case 'void-scene': return isPt ? 'Este cenário não tem chão — nenhuma decoração aparece nele.' : 'This scene has no floor — no decor shows in it.';
    case 'no-slot': return isPt ? 'Este cenário não tem onde pendurar — a peça espera outro cenário.' : 'This scene has nowhere to hang it — the piece waits for another scene.';
    case 'indoor-only': return isPt ? 'Só aparece em cenários de interior — o atual é aberto.' : 'Shows only in indoor scenes — the current one is outdoors.';
    case 'outdoor-only': return isPt ? 'Só aparece em cenários abertos — o atual é de interior.' : 'Shows only in outdoor scenes — the current one is indoors.';
  }
}

/**
 * A PÍLULA "interno / externo" da peça (I6, 02/10/2026): o `fits` dela em
 * palavra curta, nos dois idiomas. `any` (ou ausente) = serve a qualquer cenário.
 */
export function decorFitLabel(fits: DecorFit | undefined, isPt: boolean): { fit: DecorFit; text: string } {
  const fit: DecorFit = fits ?? 'any';
  if (fit === 'indoor') return { fit, text: isPt ? 'Interno' : 'Indoor' };
  if (fit === 'outdoor') return { fit, text: isPt ? 'Externo' : 'Outdoor' };
  return { fit, text: isPt ? 'Qualquer' : 'Any' };
}

/** A linha de regra do topo da decoração (limite + restrições), nos dois idiomas. */
export function decorRuleText(isPt: boolean): { limit: string; scenes: string } {
  const names = SLOT_ORDER.map(id => (isPt ? DECOR_SLOTS[id].namePt : DECOR_SLOTS[id].nameEn).toLowerCase()).join(', ');
  return isPt
    ? {
        limit: `Cabe 1 peça por espaço — até ${DECOR_MAX_TOTAL} ao mesmo tempo (${names}). Equipar troca a que já estava lá.`,
        scenes: 'Qualquer peça pode ser equipada em qualquer cenário, mas só aparece onde serve: peças de interior em cenários de interior, peças ao ar livre em cenários abertos, e a parede só em cenários que têm onde pendurar.',
      }
    : {
        limit: `1 piece per spot — up to ${DECOR_MAX_TOTAL} at once (${names}). Equipping replaces what was there.`,
        scenes: 'Any piece can be equipped in any scene, but it only shows where it fits: indoor pieces in indoor scenes, outdoor pieces in open scenes, and the wall only in scenes with somewhere to hang it.',
      };
}
