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
 *  · sem termo de consentimento e sem a abertura (vídeo de marca + cinemática),
 *    e por isso SEM NENHUM DADO saindo (ver `installEmbedNetworkGuard`);
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

/**
 * SEM TERMO, SEM DADO (13/11/2026, condição do dono para o embed pular o termo de
 * consentimento): no `/embed` NADA sai do aparelho — nem telemetria, nem crash, nem
 * conta/login/nuvem, nem push, nem dado de visitante. Pular o termo NUNCA vale como
 * "consentiu": nenhum registro de consentimento é gravado, e a telemetria fica DESLIGADA
 * por um `isEmbedMode()` duro em `isTelemetryEnabled` (telemetry.ts, que também segura o
 * crash e o tempo de uso) e nas inscrições de push (notifications.ts).
 *
 * Este guard é a rede por baixo daqueles `if`s: instalado no boot (`main.tsx`), antes de
 * qualquer provider, e só no embed. Corta TODA chamada `fetch` a `/api/*` (503 local, como
 * o guard da demo em `demoMode.ts`) e TODO `navigator.sendBeacon` (devolve `false`: "não
 * enviado"). Fora do embed não instala nada — o app normal não muda.
 */
export const EMBED_BLOCKED_API = /^(https?:\/\/[^/]+)?\/api\//;
let embedGuardInstalled = false;
export function installEmbedNetworkGuard(): boolean {
  if (embedGuardInstalled || !isEmbedMode()) return false;
  embedGuardInstalled = true;
  if (typeof window.fetch === 'function') {
    const real = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (EMBED_BLOCKED_API.test(url)) {
        return Promise.resolve(new Response(JSON.stringify({ error: 'embed' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
      }
      return real(input, init);
    };
  }
  const nav = window.navigator as Navigator | undefined;
  if (nav && typeof nav.sendBeacon === 'function') {
    try {
      Object.defineProperty(nav, 'sendBeacon', { configurable: true, writable: true, value: () => false });
    } catch { /* navegador que não deixa redefinir: os guards duros de telemetry/push continuam valendo */ }
  }
  return true;
}

/** Só para teste. */
export function resetEmbedGuardForTest(): void {
  embedGuardInstalled = false;
}
