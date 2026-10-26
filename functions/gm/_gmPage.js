// Peças comuns das páginas GM (`/gm/soulmons`, `/gm/rift`).
//
// As Pages Functions NÃO herdam o `public/_headers`: a resposta da própria Function precisa levar os cabeçalhos de
// segurança (QA beta3 R8): `frame-ancestors 'none'` na CSP + `X-Frame-Options: DENY` (página de admin nunca em iframe de terceiro,
// senão vira alvo de clickjacking contra o botão do dono) e SRI no SDK do Firebase (CDN comprometida não injeta script na página
// que roda com o ID token do dono). Os hashes valem para a VERSÃO FIXA abaixo: trocar a versão exige recalcular (há teste que
// confere o hash contra o arquivo, quando o ambiente tem rede — senão só a forma).

export const FIREBASE_VERSION = '10.12.2';
export const FIREBASE_SRI = Object.freeze({
  app: 'sha384-AQ3POAMqIhwS81FrUH95ekxqBZHeP5tG2JfEL3+7GuTtfRLWnrRh32UxwzM+//A9',
  auth: 'sha384-TnlRYaR4JYz/lpaGuaiU61PjNberSA4vjLjtF+oRC/IkohkJqnWxw5EmDSOt1vA1',
});

/** As duas tags `<script>` do SDK (compat), com nonce, integridade e CORS anônimo. */
export function firebaseScripts(nonce) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  return `<script nonce="${nonce}" src="${base}/firebase-app-compat.js" integrity="${FIREBASE_SRI.app}" crossorigin="anonymous"></script>
<script nonce="${nonce}" src="${base}/firebase-auth-compat.js" integrity="${FIREBASE_SRI.auth}" crossorigin="anonymous"></script>`;
}

export function gmNonce() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

/** Cabeçalhos da resposta HTML de uma página GM. */
export function gmHeaders(nonce) {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}' https://www.gstatic.com https://apis.google.com; style-src 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com; frame-src https://*.firebaseapp.com https://accounts.google.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  };
}
