const URL_VERIFICA = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Retorna 'ok' | 'recusado' | 'indisponivel'.
export async function verificarTurnstile(env, token, fetchFn = fetch) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return 'recusado';
  let r;
  try {
    const corpo = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    const resp = await fetchFn(URL_VERIFICA, { method: 'POST', body: corpo });
    if (!resp.ok) return 'indisponivel';
    r = await resp.json();
  } catch {
    return 'indisponivel';
  }
  if (!r || r.success !== true) return 'recusado';
  if (r.hostname !== env.TURNSTILE_HOST) return 'recusado';
  // As chaves de teste do Turnstile não devolvem action; com secret real, a resposta nunca traz essa marca.
  if (r.action !== 'inscrever' && r.metadata?.result_with_testing_key !== true) return 'recusado';
  return 'ok';
}
