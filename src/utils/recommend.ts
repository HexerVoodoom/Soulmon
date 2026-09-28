/**
 * O RECOMENDADOR — starter set do onboarding (docs/PLANO-CATALOGO-ATIVIDADES.md §3).
 *
 * Função PURA (sem React, sem localStorage, sem `Date.now()` implícito):
 * dado o mesmo perfil e o mesmo catálogo, `recommendStarterSet` sempre
 * devolve o MESMO conjunto — é isso que faz o teste determinístico e é o que
 * impede o onboarding de parecer aleatório para quem compara notas com um
 * amigo.
 *
 * O recomendador PROPÕE, nunca IMPÕE (regra do onboarding, e também a lição
 * do Finch citada no plano): a tela de "Seu ponto de partida" sempre oferece
 * troca, e aceitar é decisão do jogador.
 */
import type {
  CatalogItem,
  LifeArea,
  StruggleId,
  StrengthId,
} from '../types/activityCatalog';

export interface RecommendProfile {
  areas: LifeArea[];
  struggles: StruggleId[];
  strengths: StrengthId[];
}

/**
 * Orçamento de esforço do starter set inteiro (soma de `levels[0].effort` dos
 * itens escolhidos). "Comece pequeno" — Fogg, Lally 2010 — é a defesa direta
 * contra o padrão de sobrecarga do Habitica (ver PLANO-TAREFAS.md).
 */
export const STARTER_EFFORT_BUDGET = 4;

/** No máximo 2 itens por área no starter set — diversidade, não obsessão. */
export const STARTER_MAX_PER_AREA = 2;

function scoreItem(item: CatalogItem, profile: RecommendProfile): number {
  let score = 0;
  if (profile.areas.includes(item.area)) score += 3;
  score += item.addresses.filter((s) => profile.struggles.includes(s)).length * 2;
  score += item.leverages.filter((s) => profile.strengths.includes(s)).length * 1;
  if (item.evidence.level === 'A') score += 1;
  return score;
}

/**
 * Monta o starter set: 3–5 itens de NÍVEL 1, pontuados pelo perfil,
 * respeitando diversidade por área e o orçamento de esforço inicial.
 *
 * Determinístico: em empate de score, decide a ORDEM do catálogo (índice
 * menor primeiro) — nunca `Math.random()`. Mesmo perfil + mesmo catálogo =
 * mesmo set, sempre.
 */
export function recommendStarterSet(
  profile: RecommendProfile,
  catalog: CatalogItem[],
  n = 4,
): CatalogItem[] {
  const target = Math.max(3, Math.min(5, n));
  // V1 da revisão de psicologia (docs/reviews/2026-09-28-catalogo-psicologia.md):
  // itens `optInOnly` (protocolos de TCC) NUNCA entram no starter set
  // automático — só aparecem no navegador do catálogo, atrás do cartão de
  // aviso. Filtrar ANTES de pontuar, não depois: pontuar e descartar deixaria
  // a pontuação vazar (ex.: um item quase escolhido "empurrando" outro para
  // fora por engano de ordenação).
  const eligible = catalog.filter((item) => !item.optInOnly);
  const scored = eligible
    .map((item, index) => ({ item, index, score: scoreItem(item, profile) }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));

  const chosen: CatalogItem[] = [];
  const perArea = new Map<LifeArea, number>();
  let effortUsed = 0;
  let hasEspecifica = false;

  const fits = (item: CatalogItem) => {
    const areaCount = perArea.get(item.area) ?? 0;
    if (areaCount >= STARTER_MAX_PER_AREA) return false;
    const effort = item.levels[0].effort;
    return effortUsed + effort <= STARTER_EFFORT_BUDGET;
  };

  const take = (item: CatalogItem) => {
    chosen.push(item);
    perArea.set(item.area, (perArea.get(item.area) ?? 0) + 1);
    effortUsed += item.levels[0].effort;
    if (item.kind === 'especifica') hasEspecifica = true;
  };

  for (const { item } of scored) {
    if (chosen.length >= target) break;
    if (!fits(item)) continue;
    take(item);
  }

  // Garante ao menos 1 "especifica" (vitória rápida) quando o catálogo tiver
  // uma que caiba no orçamento — sem isso o starter set pode virar só metas
  // abrangentes, que custam mais para "sentir feito" na primeira semana.
  if (!hasEspecifica) {
    const candidate = scored.find(
      ({ item }) => item.kind === 'especifica' && !chosen.includes(item) && fits(item),
    );
    if (candidate) {
      if (chosen.length >= target && chosen.length > 3) chosen.pop();
      take(candidate.item);
    }
  }

  return chosen;
}
