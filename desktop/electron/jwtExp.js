// `exp` LIDO DO PRÓPRIO JWT (QA rodada 2, segurança §10).
//
// O ID token do Firebase é `header.payload.assinatura`; o payload é JSON em
// base64url com `exp` em SEGUNDOS. Até 22/09/2026 o `auth-preload.js` chutava
// "+1h a partir de agora" quando o app não mandava `expiresAt` — errado para
// os dois lados: token renovado há 50 min era tratado como novo (a chamada ia
// com token vencido) e um token de 60 min era descartado cedo demais nunca.
//
// Aqui NÃO se verifica nada: a assinatura é problema do servidor. Só se lê a
// validade declarada. Módulo próprio (CJS puro, sem `electron`) para o teste
// em `node` conseguir importá-lo — o preload não importa fora do Electron.

/**
 * @param {unknown} token
 * @returns {number | null} validade em ms (epoch), ou `null` se o token não
 *   tiver a forma `a.b.c` com `exp` numérico positivo no payload.
 */
function expDoJwtMs(token) {
  try {
    const partes = String(token).split('.');
    if (partes.length !== 3) return null;
    const b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(pad, 'base64').toString('utf8'));
    const exp = Number(payload && payload.exp);
    return Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
  } catch {
    return null;
  }
}

module.exports = { expDoJwtMs };
