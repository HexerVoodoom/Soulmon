import { emailValido, chaveDuplicata, hmacHex } from '../_lib/email.js';
import { limparUtm } from '../_lib/utm.js';
import { verificarTurnstile } from '../_lib/turnstile.js';
import { notificar } from '../_lib/notificar.js';
import { json, erro, dia } from '../_lib/resp.js';

const MAX_CORPO = 2048;
const LIMITE_IP_DIA = 30;
let limpezaDia = ''; // por isolate: a limpeza de 12 meses roda no maximo 1 vez por dia
const log = (o) => console.log(JSON.stringify(o)); // nunca incluir e-mail, IP ou token

// Contagem agregada por dia e evento (PLANO §15). Sem identificador; nunca derruba a resposta.
async function contar(env, hoje, evento) {
  try {
    await env.DB.prepare('INSERT INTO conversao (dia, evento, n) VALUES (?, ?, 1) ON CONFLICT(dia, evento) DO UPDATE SET n = n + 1').bind(hoje, evento).run();
  } catch { /* contagem e opcional */ }
}

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const fetchFn = ctx.fetchFn || fetch;
  const hoje = dia();
  try {
    // 1. tamanho, Content-Type, Origin exato
    const cl = Number(request.headers.get('content-length') || 0);
    if (cl > MAX_CORPO) return erro(400, 'corpo');
    const ct = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (ct !== 'application/json') return erro(400, 'corpo');
    const origens = String(env.ORIGENS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!origens.includes(request.headers.get('origin') || '')) return erro(403, 'origem');

    // Retencao do hash de IP: apagado na primeira tentativa do dia seguinte, valida ou nao
    // (antes do Turnstile, para valer mesmo com tentativas recusadas).
    await env.DB.prepare('DELETE FROM limite_ip WHERE dia < ?').bind(hoje).run();

    // Retencao de 12 meses: DELETE real, oportunista (sem cron em Pages Functions), usa idx_inscritos_dia.
    if (limpezaDia !== hoje) {
      limpezaDia = hoje;
      try { await env.DB.prepare("DELETE FROM inscritos WHERE criado_dia < date('now','-12 months')").run(); } catch { limpezaDia = ''; }
    }

    const texto = await request.text();
    if (new TextEncoder().encode(texto).length > MAX_CORPO) return erro(400, 'corpo');
    let c;
    try { c = JSON.parse(texto); } catch { return erro(400, 'corpo'); }
    if (!c || typeof c !== 'object' || Array.isArray(c)) return erro(400, 'corpo');

    // 2. honeypot (resposta igual a sucesso, sem gravar) e Turnstile
    // qualquer valor nao vazio, de qualquer tipo, e robo
    if (c.site !== undefined && c.site !== null && c.site !== '') { log({ evento: 'honeypot' }); return json({ ok: true }); }
    const ts = await verificarTurnstile(env, c.turnstile, fetchFn);
    if (ts === 'indisponivel') return erro(503, 'indisponivel');
    if (ts !== 'ok') { log({ evento: 'form_error', motivo: 'turnstile' }); await contar(env, hoje, 'form_error'); return erro(403, 'turnstile'); }

    // 3. rate limit por HMAC(ip, sal+dia)
    const ip = request.headers.get('cf-connecting-ip') || 'sem-ip';
    const chaveIp = await hmacHex(env.HASH_SALT, 'ip:' + hoje + ':' + ip);
    const lim = await env.DB.prepare(
      'INSERT INTO limite_ip (chave, dia, n) VALUES (?, ?, 1) ON CONFLICT(chave) DO UPDATE SET n = n + 1 RETURNING n',
    ).bind(chaveIp, hoje).first();
    if (lim.n > LIMITE_IP_DIA) { log({ evento: 'form_error', motivo: 'limite' }); await contar(env, hoje, 'form_error'); return erro(429, 'limite'); }

    // 4. valida e-mail e aceites
    if (!emailValido(c.email)) { log({ evento: 'form_error', motivo: 'email' }); await contar(env, hoje, 'form_error'); return erro(400, 'email'); }
    if (c.aceitePrivacidade !== true || c.maior18 !== true) { log({ evento: 'form_error', motivo: 'aceite' }); await contar(env, hoje, 'form_error'); return erro(400, 'aceite'); }
    if (c.idioma !== 'pt-BR' && c.idioma !== 'en') return erro(400, 'corpo');

    // teto global do dia (503 honesto)
    const teto = Number.parseInt(env.TETO_DIA, 10);
    const hojeN = await env.DB.prepare('SELECT COUNT(*) AS n FROM inscritos WHERE criado_dia = ?').bind(hoje).first();
    if (!Number.isInteger(teto) || hojeN.n >= teto) { log({ evento: 'form_error', motivo: 'teto' }); await contar(env, hoje, 'form_error'); return erro(503, 'teto'); }

    // 5. INSERT idempotente
    const email = c.email.trim();
    const chave = await chaveDuplicata(env.HASH_SALT, email);
    const u = limparUtm(c.utm);
    const ins = await env.DB.prepare(
      `INSERT INTO inscritos (email, chave, idioma, utm_source, utm_medium, utm_campaign, politica_versao, aceite_em, criado_dia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(chave) DO NOTHING`,
    ).bind(email, chave, c.idioma, u.source, u.medium, u.campaign, env.POLITICA_VERSAO || 'v1',
      new Date().toISOString(), hoje).run();
    const novo = ins.meta && ins.meta.changes > 0;
    log({ evento: 'form_success', novo });
    await contar(env, hoje, 'form_success');

    // 7. notificacao fora do caminho critico
    if (novo) {
      const total = (await env.DB.prepare('SELECT COUNT(*) AS n FROM inscritos').first()).n;
      const p = notificar(env, hoje, total, fetchFn);
      if (ctx.waitUntil) ctx.waitUntil(p); else await p;
    }
    return json({ ok: true }); // identico para novo e repetido
  } catch {
    log({ evento: 'erro_interno' });
    return erro(503, 'indisponivel');
  }
}

export const onRequest = () => json({ ok: false, erro: 'corpo' }, 405, { Allow: 'POST' });
