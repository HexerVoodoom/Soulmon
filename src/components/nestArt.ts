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
 *      `BASE_SLOTS.nest` — 148×83, em 2× para retina, ancorado embaixo);
 *   2. acrescentar uma entrada em `NEST_ART`;
 *   3. mudar qual id o `CompanionHUD` pede.
 * Nenhuma outra linha do app muda.
 *
 * O `NestId` é o id da PEÇA (que arte), não do espaço (`BaseSlotId`, que é
 * onde ela entra) — os dois vão divergir no dia em que existir mais de um
 * berço, e juntá-los agora só adiantaria a confusão.
 */
import nestBase from '../assets/soulmon/nest-base.png';

/** Peças que sabem ocupar o espaço `nest`. */
export type NestId = 'nest-base';

export const NEST_ART: Record<NestId, string> = {
  'nest-base': nestBase,
};

/** A peça que o app põe quando o jogador não escolheu nenhuma. */
export const DEFAULT_NEST: NestId = 'nest-base';
