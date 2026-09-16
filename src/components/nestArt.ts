/**
 * ⚠️ FRONTEIRA DE TROCA DA MOBÍLIA BASE (o berço).
 *
 * Este arquivo é o ÚNICO lugar que sabe COM QUE ARTE o espaço debaixo do pet é
 * desenhado. `CompanionHUD` importa daqui e de `utils/petStage` (a caixa); não
 * importa PNG nenhum. Mesmo contrato do `components/evolution/nodeArt.tsx`: a
 * geometria mora no palco, a arte entra por fora.
 *
 * Trocar o berço por outra mobília é:
 *   1. pôr o PNG em `src/assets/soulmon/` (desenhado para a caixa declarada em
 *      `BASE_SLOTS.nest` — 220×104, em 3× exato, ancorado embaixo);
 *   2. acrescentar uma entrada em `NEST_ART`;
 *   3. mudar qual id o `CompanionHUD` pede.
 * Nenhuma outra linha do app muda.
 *
 * O `NestId` é o id da PEÇA (que arte), não do espaço (`BaseSlotId`, que é
 * onde ela entra) — os dois vão divergir no dia em que existir mais de um
 * berço, e juntá-los agora só adiantaria a confusão.
 */
import nestBase from '../assets/soulmon/nest-base.png';
import nestBasket from '../assets/soulmon/nest-basket.png';
import nestCushion from '../assets/soulmon/nest-cushion.png';
import nestCradleWide from '../assets/soulmon/nest-cradle-wide.png';

/** Peças que sabem ocupar o espaço `nest`. */
export type NestId = 'nest-base' | 'nest-basket' | 'nest-cushion' | 'nest-cradle-wide';

export const NEST_ART: Record<NestId, string> = {
  'nest-base': nestBase,
  'nest-basket': nestBasket,
  'nest-cushion': nestCushion,
  /** Berço largo e raso (entrega 2, `A12`): 660×312, 3× exato da caixa 220×104. */
  'nest-cradle-wide': nestCradleWide,
};

/** A peça que o app põe quando o jogador não escolheu nenhuma. */
export const DEFAULT_NEST: NestId = 'nest-cradle-wide';
