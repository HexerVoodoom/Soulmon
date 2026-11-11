// ---------------------------------------------------------------------------
// ESTÁGIO DOS OPONENTES SORTEADOS (dono, 10/11/2026): o oponente tem estágio PRÓXIMO e VARIADO em relação ao do jogador
// (antes: quem era Ultimate só via Champion). O servidor decide; nada de ranking/estágio alheio além do que o perfil
// público já mostra. Constante ÚNICA da distribuição: `ESTAGIO_PESOS` (delta de estágio do oponente − o do jogador).
// Ordem dos estágios: bb < rookie < champion < ultimate < mega < ultra (mesmo `TIERS` de `_evoFeed.js`).
// ---------------------------------------------------------------------------
import { parseStage } from './_evoFeed.js';

/** Peso de sorteio por delta de estágio. Alvo: −1 25%, igual 40%, +1 25%, +2 7%, −2 3%. Qualquer outro delta pesa `PESO_RESTO` (só entra se faltar candidato). */
export const ESTAGIO_PESOS = Object.freeze({ '-2': 0.03, '-1': 0.25, '0': 0.4, '1': 0.25, '2': 0.07 });
export const PESO_RESTO = 0.005;

/** Posição do estágio (`champion-power` → 2). Desconhecido/ausente → `null` (a ordenação ignora o estágio). `bb` conta como `rookie`. */
export function stageRankOf(id) {
  const p = parseStage(id);
  if (!p) return null;
  return Math.max(1, p.rank);
}

export const pesoDoDelta = (d) => ESTAGIO_PESOS[String(d)] ?? PESO_RESTO;

/**
 * Embaralha `items` com preferência por estágio próximo ao de `meStage` (amostragem ponderada sem reposição,
 * chave de Efraimidis–Spirakis). Sem estágio do jogador (ou do item) o peso é igual: vira embaralhamento uniforme.
 * `stageOf(item)` devolve o id de estágio do item. Pura: o `rng` vem de fora.
 */
export function ordenarPorEstagio(items, meStage, rng, stageOf) {
  const me = stageRankOf(meStage);
  return items
    .map((item) => {
      const r = stageRankOf(stageOf(item));
      const w = me === null || r === null ? 1 : pesoDoDelta(r - me);
      return { item, k: -Math.log(Math.max(rng(), 1e-12)) / w };
    })
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}
