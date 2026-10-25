import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { LIFE_AREAS, LIFE_AREA_LABEL, type CatalogItem, type LifeArea } from '../types/activityCatalog';
import { recommendStarterSet } from './recommend';
import { withoutExisting } from './catalogChoice';

/**
 * SUGESTÕES DO "PLAN MY DAY" NA DEMO (pedido do dono, 25/10/2026). Na demo a lista nasce vazia, então o modal do dia não
 * tinha o que mostrar. Mesmas fontes do onboarding: o recomendador (`recommendStarterSet`) sobre o catálogo (`ACTIVITY_CATALOG`),
 * priorizando a área/foco do jogador (`soulGoal` guarda os rótulos das áreas) — sem foco, o conjunto inicial variado
 * (nível 1, orçamento de esforço baixo). PROPÕE, nunca cria: quem cria é o toque do jogador. Função pura.
 */
export function areasFromSoulGoal(soulGoal: string | undefined): LifeArea[] {
  const texto = (soulGoal ?? '').toLowerCase();
  if (!texto) return [];
  return LIFE_AREAS.filter(a => texto.includes(LIFE_AREA_LABEL[a].en.toLowerCase()) || texto.includes(LIFE_AREA_LABEL[a].pt.toLowerCase()));
}

export function demoDaySuggestions(
  state: { soulGoal?: string; activities?: ReadonlyArray<{ catalogId?: string | null }> },
  n = 4,
): CatalogItem[] {
  const areas = areasFromSoulGoal(state.soulGoal);
  return withoutExisting(recommendStarterSet({ areas, struggles: [], strengths: [] }, ACTIVITY_CATALOG, n), state.activities);
}
