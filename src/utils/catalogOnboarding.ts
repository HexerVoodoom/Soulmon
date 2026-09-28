/**
 * O CONVITE DO CATÁLOGO — uma vez só, novo OU antigo (F3 do
 * `docs/PLANO-CATALOGO-ATIVIDADES.md`; decisão do dono, 28/09/2026: "jogadores
 * antigos REFAZEM o onboarding na próxima abertura... não apagar atividades
 * existentes; elas continuam como legado").
 *
 * Em vez de threadear um estado novo dentro do ritual do Oráculo
 * (`SoulmonOnboarding.tsx`, GOAL_STEP/STRUGGLE_STEP — uma máquina de estados
 * já delicada, com ids negativos e histórico de bugs de reordenação), este
 * convite roda como um INTERSTICIAL da fila única do `App.tsx`
 * (`src/components/filaDeAvisos.contract.test.ts`). O MESMO mecanismo serve
 * o jogador novo (que nunca viu isto) e o jogador antigo (idem) — não existem
 * dois caminhos que possam divergir.
 *
 * Função PURA: sem localStorage, sem `Date.now()` implícito.
 */

/** Uma vez só: a flag persiste no SAVE, nunca no localStorage (mesmo motivo
 *  de `careCaps.ts` — dois aparelhos com o mesmo save não podem divergir). */
export interface CatalogOnboardingState {
  catalogOnboardingSeenAt?: string;
}

/** Precisa mostrar o convite? Só quando a flag nunca foi gravada. */
export function needsCatalogOnboarding(state: CatalogOnboardingState): boolean {
  return !state.catalogOnboardingSeenAt;
}

/** Grava a flag (chamado tanto ao confirmar o starter set quanto ao pular —
 *  pular também é uma resposta, e a régua é "uma vez", não "uma vez que
 *  aceite"). Idempotente: chamar duas vezes não perde a data da primeira. */
export function markCatalogOnboardingSeen<T extends CatalogOnboardingState>(state: T, now: Date): T {
  if (state.catalogOnboardingSeenAt) return state;
  return { ...state, catalogOnboardingSeenAt: now.toISOString() };
}
