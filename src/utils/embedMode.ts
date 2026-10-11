/**
 * MODO EMBED — dono único do predicado "estou embutido no site do dono?".
 *
 * `/embed` é servido pelo MESMO deploy do app (o SPA fallback devolve o
 * `index.html`), para o portfólio do dono embutir a demo local num `<iframe>`.
 * O critério é o CAMINHO, e não `window.self !== window.top`: o caminho é o que
 * o `public/_headers` e o `public/sw.js` também enxergam, então os três lados
 * (cabeçalho que libera o frame, service worker que não intercepta, app que
 * pula o portão) concordam por construção. Ninguém compara `pathname` à mão.
 *
 * O que muda no embed (e só isso):
 *  · abre direto na escolha dos 5 iniciais da DEMO local — sem portão de login;
 *  · não pede permissão de notificação (num iframe de outra origem o navegador
 *    nega em silêncio e o pedido só gastaria o "uma vez" do dono);
 *  · o service worker não intercepta `/embed` (ver `public/sw.js`).
 *
 * A demo em si (salva só no aparelho, sem XP/compra/PvP) é de `demoMode.ts`.
 * O storage particionado de iframe de outra origem já degrada por
 * `safeStorage.ts` (nunca lança; o jogo segue em memória).
 */
export const EMBED_PATH = '/embed';

/** Módulo folha: recebe o `pathname` por parâmetro para ser testável. */
export function isEmbedPath(pathname: string): boolean {
  // Só o caminho exato: `/embed/` NÃO casa a regra de `_headers` (mede-se 'x-frame-options: DENY').
  return pathname === EMBED_PATH;
}

export function isEmbedMode(): boolean {
  try {
    return typeof window !== 'undefined' && isEmbedPath(window.location.pathname);
  } catch {
    return false;
  }
}
