import { limparUtm } from '../_lib/utm.js';
import { json, erro, dia } from '../_lib/resp.js';

const MAX_CORPO = 512;

// Conta UM clique no botao do Google Group, por dia, idioma e UTM (allowlist de utm.js). Sem e-mail, IP ou identificador.
// Nunca derruba o clique do visitante: o cliente usa sendBeacon e ignora a resposta.
export async function onRequestPost({ request, env }) {
  try {
    const cl = Number(request.headers.get('content-length') || 0);
    if (cl > MAX_CORPO) return erro(400, 'corpo');
    const origens = String(env.ORIGENS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!origens.includes(request.headers.get('origin') || '')) return erro(403, 'origem');
    let c;
    try { c = JSON.parse(await request.text()); } catch { return erro(400, 'corpo'); }
    const idioma = c && c.idioma === 'pt-BR' ? 'pt-BR' : 'en';
    const u = limparUtm(c && c.utm);
    await env.DB.prepare(
      `INSERT INTO cliques_grupo (dia, idioma, utm_source, utm_medium, utm_campaign, n) VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(dia, idioma, utm_source, utm_medium, utm_campaign) DO UPDATE SET n = n + 1`,
    ).bind(dia(), idioma, u.source || '', u.medium || '', u.campaign || '').run();
    return json({ ok: true });
  } catch {
    return erro(503, 'indisponivel');
  }
}

export const onRequest = () => json({ ok: false, erro: 'corpo' }, 405, { Allow: 'POST' });
