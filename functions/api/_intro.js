/**
 * Interruptor POR PESSOA da intro narrativa (docs/PLANO-INTRO-NARRATIVA.md §11.3), separado do
 * `ONBOARDING_VELADO`. Lista em `env.INTRO_NARRATIVA_TESTERS`: HASHES (sha256 hex de
 * `intro-tester:<email normalizado>`), separados por vírgula/espaço; nunca e-mail. Vazia/ausente = ninguém.
 * O interruptor global é o `VITE_INTRO_NARRATIVA` do build (cliente); aqui só entra o teste por pessoa.
 */
export async function introTesterHash(email) {
  const data = new TextEncoder().encode(`intro-tester:${String(email ?? '').trim().toLowerCase()}`);
  const d = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function isIntroTester(env, email) {
  const lista = String(env?.INTRO_NARRATIVA_TESTERS ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!email || lista.length === 0) return false;
  return lista.includes(await introTesterHash(email));
}
