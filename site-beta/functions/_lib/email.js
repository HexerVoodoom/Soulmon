// Normalizacao e validacao de e-mail. Compartilhado com scripts/ (Node puro, sem dependencias).
const PERIGOSO = /^[=+\-@\t\r]/;
const FORMATO = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function emailValido(bruto) {
  if (typeof bruto !== 'string') return false;
  const e = bruto.trim();
  if (e.length < 6 || e.length > 254) return false;
  if (PERIGOSO.test(e)) return false; // injecao de formula em CSV: recusa na entrada
  if (!FORMATO.test(e)) return false;
  const [local] = e.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return true;
}

// Pontos e +tag do Gmail colapsam SO na chave de duplicata; o e-mail guardado fica como veio.
export function normalizarChave(email) {
  const e = email.trim().toLowerCase();
  const i = e.lastIndexOf('@');
  let local = e.slice(0, i);
  let dominio = e.slice(i + 1);
  if (dominio === 'gmail.com' || dominio === 'googlemail.com') {
    dominio = 'gmail.com';
    local = local.split('+')[0].replace(/\./g, '');
  }
  return local + '@' + dominio;
}

export async function hmacHex(sal, texto) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(sal), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(texto)));
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function chaveDuplicata(sal, email) {
  return hmacHex(sal, 'email:' + normalizarChave(email));
}
