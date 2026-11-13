import { limparUtm } from '../_lib/utm.js';
import { EVENTOS, REFS } from '../_lib/evento.js';
import { json, erro, dia } from '../_lib/resp.js';

const MAX_CORPO = 1024;

// Recebe um LOTE de eventos agregados do site (allowlist em _lib/evento.js). Pais vem de request.cf, nunca do IP.
// Nada identifica a pessoa: cada linha da D1 e um contador por dia + recorte.
export async function onRequestPost({ request, env }) {
  try {
    const cl = Number(request.headers.get('content-length') || 0);
    if (cl > MAX_CORPO) return erro(400, 'corpo');
    const origens = String(env.ORIGENS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!origens.includes(request.headers.get('origin') || '')) return erro(403, 'origem');
    let c;
    try { c = JSON.parse(await request.text()); } catch { return erro(400, 'corpo'); }
    const evs = Array.isArray(c && c.e) ? [...new Set(c.e)].filter((e) => EVENTOS.includes(e)).slice(0, 20) : [];
    if (!evs.length) return erro(400, 'corpo');
    const idioma = c.idioma === 'pt-BR' ? 'pt-BR' : 'en';
    const aparelho = c.ap === 'mobile' ? 'mobile' : 'desktop';
    const ref = REFS.includes(c.ref) ? c.ref : 'outro';
    const pais = /^[A-Z]{2}$/.test(String(request.cf?.country || '')) ? request.cf.country : '';
    const u = limparUtm(c.utm);
    const st = env.DB.prepare(
      `INSERT INTO eventos_site (dia, evento, idioma, aparelho, pais, utm_source, utm_medium, utm_campaign, ref, n)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(dia, evento, idioma, aparelho, pais, utm_source, utm_medium, utm_campaign, ref) DO UPDATE SET n = n + 1`,
    );
    const d = dia();
    await env.DB.batch(evs.map((e) => st.bind(d, e, idioma, aparelho, pais, u.source || '', u.medium || '', u.campaign || '', ref)));
    return json({ ok: true });
  } catch {
    return erro(503, 'indisponivel');
  }
}

export const onRequest = () => json({ ok: false, erro: 'corpo' }, 405, { Allow: 'POST' });
