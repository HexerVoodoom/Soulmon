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

/**
 * O PERFIL DO ONBOARDING que vai para o save (`gameState.onboardingProfile`,
 * 01/10/2026): as FORÇAS e o que ATRAPALHA, com os MESMOS ids do catálogo
 * (`types/activityCatalog.ts`) das perguntas do onboarding. Quem lê é a
 * personalidade do Soulmon (`derivePersonality`, frente de Configurações) —
 * ids, nunca rótulos: o rótulo muda com o idioma, o id não.
 *
 * Pura e defensiva: só strings, sem duplicata, no máximo 3 de cada (o teto
 * da pergunta). Sem escolha nenhuma devolve `undefined` — save sem o campo é
 * o jeito honesto de dizer "não foi respondido" (onboarding antigo, upgrade).
 */
export interface OnboardingProfile {
  strengths: string[];
  struggles: string[];
}
export function onboardingProfileFrom(
  choice: { strengths?: readonly unknown[]; struggles?: readonly unknown[] } | undefined | null,
): OnboardingProfile | undefined {
  // `Array.isArray` e não `?? []`: do save da nuvem pode vir qualquer coisa.
  const limpa = (v: unknown) =>
    [...new Set((Array.isArray(v) ? v : []).filter((x): x is string => typeof x === 'string'))].slice(0, 3);
  const strengths = limpa(choice?.strengths);
  const struggles = limpa(choice?.struggles);
  if (strengths.length === 0 && struggles.length === 0) return undefined;
  return { strengths, struggles };
}
