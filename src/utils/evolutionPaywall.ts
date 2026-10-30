/**
 * D8 (docs/PLANO-ONBOARDING-VELADO.md §6): conta grátis evolui BB -> rookie de
 * graça; a partir de rookie, evoluir exige conta paga. Fonte ÚNICA da regra:
 * `canEvolve`, `handleEvolve`, `handleEvolveRequest` e o convite chamam esta função.
 *
 * Só vale com o interruptor ONBOARDING_VELADO ligado (`velado`); desligado devolve
 * sempre `false` (comportamento atual). `accountTier` ausente = pago (save antigo
 * falha ABERTO, mesma decisão de `tierForRules` no App). Linha vermelha: isto nunca
 * toca cuidado nem HP — só o gesto de evoluir.
 *
 * Servidor: não existe validação de evolução no servidor (a evolução é 100% cliente);
 * a geração de sprite das formas já exige conta paga (`generate-sprite.js`, 402
 * `paid-tier-required`), que é o espelho natural da regra.
 */
import { isBBStage } from './bbStage';

export function evolutionPaywalled(input: {
  velado: boolean;
  accountTier: 'demo' | 'paid' | undefined;
  evolutionStage: string;
}): boolean {
  if (!input.velado) return false;
  if (input.accountTier !== 'demo') return false;
  return !isBBStage(input.evolutionStage);
}
