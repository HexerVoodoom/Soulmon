import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { onRequestPost, onRequest as onRequestInscrever } from '../../functions/api/inscrever.js';
import { onRequestGet, onRequest as onRequestVagas } from '../../functions/api/vagas.js';
import { gerarCsv, resumoRelogio, resumoConversao } from '../../scripts/exportar.mjs';
import { remover } from '../../scripts/remover.mjs';
import { limparAntigos } from '../../scripts/limpar-antigos.mjs';
import { proximaLeva, marcar } from '../../scripts/proxima-leva.mjs';
import { chaveDuplicata } from '../../functions/_lib/email.js';

const SAL = 'sal-de-teste';
const ORIGEM = 'https://soulmon.pages.dev';

function novoDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const m of ['0001_inscritos.sql', '0002_conversao.sql', '0003_limpeza.sql']) sqlite.exec(readFileSync(new URL('../../migrations/' + m, import.meta.url), 'utf8'));
  const d1 = {
    prepare(sql) {
      const mk = (args) => ({
        bind: (...a) => mk(a),
        async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
        async first() { return sqlite.prepare(sql).get(...args) ?? null; },
        async all() { return { results: sqlite.prepare(sql).all(...args) }; },
      });
      return mk([]);
    },
  };
  const run = (sql) => (/^\s*SELECT/i.test(sql) ? sqlite.prepare(sql).all() : (sqlite.exec(sql), []));
  return { sqlite, d1, run };
}

let db, env, esperando, fetchFn, resendCorpos;
const tsOk = { success: true, hostname: 'soulmon.pages.dev', action: 'inscrever' };

function stubFetch(ts = tsOk) {
  resendCorpos = [];
  fetchFn = vi.fn(async (url, init) => {
    if (String(url).includes('siteverify')) return new Response(JSON.stringify(ts), { status: 200 });
    if (String(url).includes('resend')) { resendCorpos.push(init.body); return new Response('{}', { status: 200 }); }
    throw new Error('fetch inesperado');
  });
}

async function post(corpo = {}, { ip = '1.1.1.1', headers = {}, raw } = {}) {
  esperando = [];
  const body = raw ?? JSON.stringify({
    email: 'ana@example.com', idioma: 'pt-BR', aceitePrivacidade: true, maior18: true,
    turnstile: 'tok', site: '', utm: {}, ...corpo,
  });
  const request = new Request('https://soulmon.pages.dev/api/inscrever', {
    method: 'POST', body,
    headers: { 'content-type': 'application/json', origin: ORIGEM, 'cf-connecting-ip': ip, ...headers },
  });
  const res = await onRequestPost({ request, env, fetchFn, waitUntil: (p) => esperando.push(p) });
  await Promise.all(esperando);
  return { status: res.status, texto: await res.text() };
}

const count = (w = '1=1') => db.sqlite.prepare('SELECT COUNT(*) n FROM inscritos WHERE ' + w).get().n;

beforeEach(() => {
  db = novoDb();
  env = { DB: db.d1, LEVA_VAGAS: '3', TETO_DIA: '100', ORIGENS: ORIGEM, TURNSTILE_HOST: 'soulmon.pages.dev',
    TURNSTILE_SECRET: 's', HASH_SALT: SAL, RESEND_API_KEY: 'k', NOTIFICAR_PARA: 'rev@example.com' };
  stubFetch();
});

describe('POST /api/inscrever', () => {
  it('dois POSTs do mesmo e-mail: corpo identico e uma linha so', async () => {
    const a = await post();
    const b = await post();
    expect(a).toEqual(b);
    expect(a.texto).toBe('{"ok":true}');
    expect(count()).toBe(1);
  });

  it('Gmail: pontos e + colapsam so na chave; e-mail guardado fica como veio', async () => {
    await post({ email: 'Jo.Ao+x@gmail.com' });
    await post({ email: 'joao@gmail.com' });
    expect(count()).toBe(1);
    expect(db.sqlite.prepare('SELECT email FROM inscritos').get().email).toBe('Jo.Ao+x@gmail.com');
    await post({ email: 'jo.ao@outro.com' });
    await post({ email: 'joao@outro.com' });
    expect(count()).toBe(3);
  });

  it('sem token nao insere', async () => {
    const r = await post({ turnstile: '' });
    expect(r.status).toBe(403);
    expect(count()).toBe(0);
  });

  it('hostname errado e action errada recusam', async () => {
    stubFetch({ ...tsOk, hostname: 'evil.example' });
    expect((await post()).status).toBe(403);
    stubFetch({ ...tsOk, action: 'login' });
    expect((await post()).status).toBe(403);
    expect(count()).toBe(0);
  });

  it('origem errada, content-type errado, corpo grande', async () => {
    expect((await post({}, { headers: { origin: 'https://evil.example' } })).texto).toContain('origem');
    expect((await post({}, { headers: { 'content-type': 'text/plain' } })).status).toBe(400);
    expect((await post({ email: 'a'.repeat(3000) + '@x.com' })).status).toBe(400);
  });

  it('e-mail com formula e aceite faltando', async () => {
    expect((await post({ email: '=cmd@example.com' })).texto).toContain('email');
    expect((await post({ email: '+a@example.com' })).status).toBe(400);
    expect((await post({ maior18: false })).texto).toContain('aceite');
    expect(count()).toBe(0);
  });

  it('honeypot preenchido: 200 sem gravar', async () => {
    const r = await post({ site: 'x' });
    expect(r.status).toBe(200);
    expect(count()).toBe(0);
  });

  it('honeypot: qualquer valor nao vazio, de qualquer tipo, da 200 sem gravar', async () => {
    for (const v of ['x', ' ', 1, 0, true, false, {}, [], ['x'], { a: 1 }]) {
      const r = await post({ site: v });
      expect(r.status).toBe(200);
      expect(r.texto).toBe('{"ok":true}');
    }
    expect(count()).toBe(0);
    // vazio de verdade nao e honeypot
    expect((await post({ site: '' })).status).toBe(200);
    expect(count()).toBe(1);
  });

  it('hash de IP de dias anteriores e apagado antes do Turnstile, mesmo em tentativa recusada', async () => {
    db.sqlite.exec("INSERT INTO limite_ip (chave, dia, n) VALUES ('velho', '2020-01-01', 3)");
    const r = await post({ turnstile: '' });
    expect(r.status).toBe(403);
    expect(db.sqlite.prepare("SELECT COUNT(*) n FROM limite_ip WHERE dia = '2020-01-01'").get().n).toBe(0);
  });

  it('rate limit por IP retorna 429', async () => {
    let ultimo;
    for (let i = 0; i < 31; i++) ultimo = await post({ email: 'u' + i + '@example.com' });
    expect(ultimo.status).toBe(429);
  });

  it('teto diario retorna 503 teto', async () => {
    env.TETO_DIA = '1';
    await post({ email: 'a1@example.com' });
    const r = await post({ email: 'a2@example.com' }, { ip: '2.2.2.2' });
    expect(r.status).toBe(503);
    expect(r.texto).toContain('teto');
  });

  it('UTM: allowlist de source/medium; campanha pelo padrao [a-z0-9-_]{1,40} sem @', async () => {
    const utm = async (u, ip) => {
      db.sqlite.exec('DELETE FROM inscritos');
      await post({ utm: u }, { ip });
      const l = db.sqlite.prepare('SELECT utm_source s, utm_medium m, utm_campaign c FROM inscritos').get();
      return { ...l };
    };
    for (const [i, f] of ['youtube', 'tiktok', 'reddit', 'instagram'].entries()) {
      expect((await utm({ source: f }, '4.4.5.' + i)).s).toBe(f);
    }
    expect((await utm({ source: 'twitter' }, '4.4.5.9')).s).toBe('outro');
    expect(await utm({ source: 'instagram', medium: '<script>', campaign: 'xp@to' }, '4.4.4.1')).toEqual({ s: 'instagram', m: 'outro', c: 'outro' });
    for (const m of ['cpc', 'paid', 'social', 'comunidade', 'grupo', 'video', 'outro']) {
      expect((await utm({ medium: m }, '4.4.4.2')).m).toBe(m);
    }
    expect((await utm({ medium: 'email' }, '4.4.4.3')).m).toBe('outro');
    expect((await utm({ campaign: 'Lancamento_2-x' }, '4.4.4.4')).c).toBe('lancamento_2-x');
    expect((await utm({ campaign: 'a'.repeat(41) }, '4.4.4.5')).c).toBe('outro');
    // comecar por - ou _ derrubaria a exportacao (CSV recusa campo que comeca com -)
    expect((await utm({ campaign: '-1' }, '4.4.4.6')).c).toBe('outro');
    expect(await utm({}, '4.4.4.7')).toEqual({ s: null, m: null, c: null });
  });

  it('conversao: UPSERT agregado em form_success e form_error, sem identificador', async () => {
    await post({ email: 'c1@example.com' });
    await post({ email: 'c1@example.com' });
    await post({ email: 'ruim' });
    const l = db.sqlite.prepare('SELECT dia, evento, n FROM conversao ORDER BY evento').all().map((x) => ({ ...x }));
    expect(l.map((x) => [x.evento, x.n])).toEqual([['form_error', 1], ['form_success', 2]]);
    expect(Object.keys(l[0])).toEqual(['dia', 'evento', 'n']);
    expect(resumoConversao(l)).toContain('sucesso 2 | erro 1');
  });

  it('toda resposta /api/* tem nosniff e no-store, inclusive 405 e erros', async () => {
    const reqs = [
      await onRequestInscrever({ request: new Request(ORIGEM + '/api/inscrever', { method: 'GET' }) }),
      await onRequestVagas({ request: new Request(ORIGEM + '/api/vagas', { method: 'POST' }) }),
      await onRequestGet({ env }),
      await onRequestPost({ request: new Request(ORIGEM + '/api/inscrever', { method: 'POST', body: '{}', headers: { 'content-type': 'text/plain' } }), env, fetchFn }),
    ];
    expect(reqs.map((r) => r.status)).toEqual([405, 405, 200, 400]);
    for (const r of reqs) {
      expect(r.headers.get('x-content-type-options')).toBe('nosniff');
      expect(r.headers.get('cache-control')).toBe('no-store');
    }
  });

  it('notificacao Resend sem e-mail do inscrito, teto de 20/dia', async () => {
    for (let i = 0; i < 22; i++) await post({ email: 'n' + i + '@example.com' }, { ip: '9.9.9.' + i });
    expect(resendCorpos.length).toBe(20);
    expect(resendCorpos.join('')).not.toMatch(/n\d+@example\.com/);
    expect(JSON.parse(resendCorpos[0]).from).toContain('onboarding@resend.dev');
  });

  it('falha do Resend nao derruba o cadastro', async () => {
    fetchFn = vi.fn(async (u) => {
      if (String(u).includes('siteverify')) return new Response(JSON.stringify(tsOk));
      throw new Error('rede');
    });
    expect((await post()).status).toBe(200);
    expect(count()).toBe(1);
  });

  it('nenhum log contem e-mail, IP ou token', async () => {
    const spy = vi.spyOn(console, 'log');
    await post({ email: 'segredo@example.com' }, { ip: '8.8.4.4' });
    await post({ email: 'segredo@example.com', turnstile: '' });
    await post({ email: '=x@example.com' });
    const tudo = spy.mock.calls.flat().join('\n');
    spy.mockRestore();
    expect(tudo.length).toBeGreaterThan(0);
    expect(tudo).not.toMatch(/segredo|8\.8\.4\.4|example\.com/);
  });
});

describe('GET /api/vagas', () => {
  const vagas = async () => {
    const r = await onRequestGet({ env });
    return { ...(await r.json()), cache: r.headers.get('cache-control') };
  };

  it('estado vem so da variavel; inscricoes nao mudam; nenhum numero exposto', async () => {
    const r = await vagas();
    expect(r).toMatchObject({ estado: 'abertas', cache: 'no-store' });
    expect(r.restantes).toBeUndefined();
    await post({ email: 'a@example.com' }, { ip: '3.3.3.3' });
    expect((await vagas()).estado).toBe('abertas');
    const e = await onRequestGet({ env: { ...env, LEVA_ESTADO: 'espera' } });
    expect(await e.json()).toEqual({ estado: 'espera' });
  });
});

describe('scripts', () => {
  it('remover apaga de verdade: SELECT vazio (inclusive variante Gmail)', async () => {
    await post({ email: 'Zé.x@gmail.com'.replace('é', 'e') });
    expect(count()).toBe(1);
    expect(await remover(db.run, 'zex@gmail.com', SAL)).toBe(true);
    expect(db.sqlite.prepare('SELECT * FROM inscritos').all()).toEqual([]);
  });

  it('exportar aborta com campo iniciado por = + - @', () => {
    const base = { id: 1, email: 'a@example.com', idioma: 'en' };
    for (const mau of ['=1+1', '+1', '-1', '@x', '\tx', '\rx']) {
      expect(() => gerarCsv([{ ...base, utm_source: mau }])).toThrow(/abortada/);
    }
    const csv = gerarCsv([{ ...base, utm_campaign: 'a,"b"' }]);
    expect(csv).toContain('"a,""b"""');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('proxima-leva: fila por id, sem marcar nao grava, expirados em 7 dias', async () => {
    for (let i = 1; i <= 4; i++) await post({ email: 'p' + i + '@example.com' }, { ip: '5.5.5.' + i });
    const agora = new Date('2026-11-20T00:00:00Z');
    let r = proximaLeva(db.run, 2, { agora });
    expect(r.linhaBetaEmails).toBe('p1@example.com,p2@example.com');
    expect(count('convidado_em IS NOT NULL')).toBe(0);
    r = proximaLeva(db.run, 2, { agora, marcar: true, leva: 1 });
    expect(count('convidado_em IS NOT NULL')).toBe(2);
    db.sqlite.exec("UPDATE inscritos SET convidado_em='2026-11-05T00:00:00Z' WHERE id=1");
    db.sqlite.exec("UPDATE inscritos SET convidado_em='2026-11-19T00:00:00Z', instalou_em='x' WHERE id=2");
    r = proximaLeva(db.run, 1, { agora });
    expect(r.expirados.map((l) => l.id)).toEqual([1]);
    expect(r.linhaBetaEmails).toBe('p3@example.com');
  });

  it('opt-in/ativo e resumo do relogio 12x14', async () => {
    await post({ email: 'q@example.com' });
    const agora = new Date('2026-11-20T00:00:00Z');
    expect(await marcar(db.run, 'optin', 'q@example.com', SAL, agora)).toBe(true);
    const linhas = db.sqlite.prepare('SELECT * FROM inscritos').all();
    expect(resumoRelogio(linhas, '2026-11-20')).toContain('ativos agora: 1');
    expect(resumoRelogio(linhas, '2026-12-05')).toContain('ativos agora: 0');
  });

  it('chave de duplicata e HMAC, nao o e-mail', async () => {
    await post();
    const k = db.sqlite.prepare('SELECT chave FROM inscritos').get().chave;
    expect(k).toBe(await chaveDuplicata(SAL, 'ana@example.com'));
    expect(k).not.toContain('ana');
  });
});

describe('retencao de 12 meses', () => {
  const semear = () => {
    db = novoDb();
    const ins = db.sqlite.prepare("INSERT INTO inscritos (email, chave, idioma, politica_versao, aceite_em, criado_dia) VALUES (?, ?, 'pt-BR', 'v1', 'x', date('now', ?))");
    ins.run('velho@example.com', 'k1', '-13 months'); ins.run('novo@example.com', 'k2', '-1 months');
  };
  it('script apaga so o de 13 meses', () => {
    semear();
    expect(limparAntigos(db.run)).toBe(1);
    expect(db.sqlite.prepare('SELECT email FROM inscritos').all().map((r) => r.email)).toEqual(['novo@example.com']);
  });
  it('schema sem novidades nem removido_em', () => {
    db = novoDb();
    const cols = db.sqlite.prepare('PRAGMA table_info(inscritos)').all().map((c) => c.name);
    expect(cols).not.toContain('novidades'); expect(cols).not.toContain('removido_em');
  });
});
