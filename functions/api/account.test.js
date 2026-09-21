import { describe, it, expect, vi, beforeEach } from 'vitest';

// `_auth.js` fala com o endpoint JWK do Google para verificar a assinatura do
// ID token. Teste não vai à rede — então o dublê aqui responde pelo VEREDITO
// (dono / não dono / indisponível), que é o que estas rotas consomem. O
// fail-closed do `requireVerifiedOwner` de verdade é exercitado no bloco final,
// que usa o módulo REAL e não precisa de rede (sem projectId ele nega antes).
const authVerdict = { value: null };
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => authVerdict.value,
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const { onRequest } = await import('./account.js');
const realAuth = await vi.importActual('./_auth.js');

const ID = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);
const OWNER = { ok: true, email: 'quem@exemplo.com' };

/** KV de mentira com `list` — as rotas de conta varrem prefixo. */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', cursor }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
      cursor: undefined,
    }),
  };
}

const env = seed => ({ DIGIAPP_SAVES: fakeKV(seed), FIREBASE_PROJECT_ID: 'soulmon-test' });

const get = (qs) => new Request(`https://x/api/account?${qs}`);
const post = (qs, body) => new Request(`https://x/api/account?${qs}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

/** pid derivado igual ao de community.js — para semear o índice reverso. */
async function pidFor(saveId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

async function seededEnv() {
  const pid = await pidFor(ID);
  const e = env({
    [ID]: JSON.stringify({ petName: 'Bolha', soulStruggle: 'procrastinação', healthPoints: 3 }),
    [`profile:${ID}`]: JSON.stringify({ id: ID, name: 'Ana', petName: 'Bolha', pid, friends: [OTHER] }),
    [`profile:${OTHER}`]: JSON.stringify({ id: OTHER, name: 'Bia', friends: [ID, 'c'.repeat(32)] }),
    [`pid:${pid}`]: ID,
    [`gifts:${ID}`]: JSON.stringify([{ from: OTHER, bits: 10 }]),
    [`rank:2026-08:${ID}`]: JSON.stringify({ points: 12 }),
    [`rank:2026-07:${ID}`]: JSON.stringify({ points: 3 }),
    [`rank:2026-08:${OTHER}`]: JSON.stringify({ points: 99 }),
    [`ent:${ID}`]: JSON.stringify({
      tier: 'paid', credits: 40, consumedOrders: ['GPA.1234'],
      orderDetails: [{ orderId: 'GPA.1234', purchaseToken: 'tok-secreto-9876' }],
      aiLifetime: { sprite: 3 }, adDate: '2026-08-25', adCount: 2,
    }),
  });
  return { e, pid };
}

beforeEach(() => { authVerdict.value = OWNER; });

describe('account.js — exportação', () => {
  it('devolve tudo que o servidor guarda daquele usuário', async () => {
    const { e, pid } = await seededEnv();
    const res = await onRequest({ request: get(`action=export&id=${ID}`), env: e });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.account).toEqual({ saveId: ID, publicId: pid });
    expect(body.data[`${ID} (save)`].soulStruggle).toBe('procrastinação');
    expect(body.data[`profile:${ID}`].name).toBe('Ana');
    expect(body.data[`pid:${pid}`]).toBe(ID);
    expect(body.data[`gifts:${ID}`]).toHaveLength(1);
    expect(body.data[`ent:${ID}`].tier).toBe('paid');
    expect(body.data.ranks.map(r => r.season).sort()).toEqual(['2026-07', '2026-08']);
  });

  it('não vaza rank de OUTRO jogador na varredura por prefixo', async () => {
    const { e } = await seededEnv();
    const body = await (await onRequest({ request: get(`action=export&id=${ID}`), env: e })).json();
    expect(JSON.stringify(body.data.ranks)).not.toContain('99');
  });

  it('mascara o purchaseToken — exportar dado não é entregar credencial', async () => {
    const { e } = await seededEnv();
    const body = await (await onRequest({ request: get(`action=export&id=${ID}`), env: e })).json();
    expect(body.data[`ent:${ID}`].orderDetails[0].purchaseToken).toBe('***9876');
    expect(JSON.stringify(body)).not.toContain('tok-secreto-9876');
  });

  it('DECLARA o que NÃO está na exportação (psicometria/natal no localStorage, push, ord:)', async () => {
    const { e } = await seededEnv();
    const body = await (await onRequest({ request: get(`action=export&id=${ID}`), env: e })).json();
    const whats = body.naoIncluido.map(n => n.what);
    expect(whats).toContain('soulmon-profile (localStorage)');
    expect(whats).toContain('push:* / fcm:*');
    expect(whats).toContain('ord:<orderId>');
    for (const n of body.naoIncluido) {
      expect(typeof n['pt-BR']).toBe('string');
      expect(typeof n.en).toBe('string');
    }
  });

  it('conta sem nada exporta a mesma FORMA, com campos nulos — não inventa entitlement', async () => {
    const res = await onRequest({ request: get(`action=export&id=${ID}`), env: env() });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data[`${ID} (save)`]).toBeNull();
    expect(body.data[`ent:${ID}`]).toBeNull();
    expect(body.data.ranks).toEqual([]);
  });
});

describe('account.js — exclusão', () => {
  it('exige confirmação: delete-confirm sem token é recusado e NÃO apaga nada', async () => {
    const { e } = await seededEnv();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`), env: e });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('confirmation-required');
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(true);
  });

  it('token errado também é recusado', async () => {
    const { e } = await seededEnv();
    await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e });
    const res = await onRequest({
      request: post(`action=delete-confirm&id=${ID}`, { confirmToken: 'f'.repeat(32) }), env: e,
    });
    expect(res.status).toBe(409);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(true);
  });

  it('delete-request devolve token, prazo e o INVENTÁRIO do que será apagado', async () => {
    const { e, pid } = await seededEnv();
    const body = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    expect(body.confirmToken).toMatch(/^[0-9a-f]{32}$/);
    expect(body.expiresInSeconds).toBe(900);
    expect(body.plano.apaga).toEqual(expect.arrayContaining([
      `${ID} (save)`, `profile:${ID}`, `pid:${pid}`, `gifts:${ID}`, `rank:2026-08:${ID}`, `rank:2026-07:${ID}`,
    ]));
    expect(body.plano.sobrevive).toEqual(['ord:GPA.1234']);
    // Nada foi apagado ainda — pedir não é executar.
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(true);
  });

  it('confirmado: apaga o que prometeu, limpa amizade alheia e MINIMIZA o entitlement', async () => {
    const { e, pid } = await seededEnv();
    const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    expect(res.status).toBe(200);
    const s = e.DIGIAPP_SAVES.store;

    for (const k of [ID, `profile:${ID}`, `pid:${pid}`, `gifts:${ID}`, `rank:2026-08:${ID}`, `rank:2026-07:${ID}`]) {
      expect(s.has(k), `${k} deveria ter sido apagada`).toBe(false);
    }
    // O saveId não sobrevive dentro da lista de amigos de terceiro.
    expect(JSON.parse(s.get(`profile:${OTHER}`)).friends).toEqual(['c'.repeat(32)]);
    // Save de outro jogador segue intocado.
    expect(s.has(`rank:2026-08:${OTHER}`)).toBe(true);

    const ent = JSON.parse(s.get(`ent:${ID}`));
    expect(ent.tier).toBe('paid');                 // o direito pago sobrevive
    expect(ent.consumedOrders).toEqual(['GPA.1234']);
    expect(ent.aiLifetime).toEqual({});            // uso some
    expect(ent.adCount).toBe(0);
    expect(ent.accountDeletedAt).toBeGreaterThan(0);
  });

  it('o token é de uso único — repetir a confirmação não roda de novo', async () => {
    const { e } = await seededEnv();
    const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    const again = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    expect(again.status).toBe(409);
  });

  // Decisão #23 do QA GERAL: push não sobrevive à exclusão — quando o registro
  // carrega `saveId`. As chaves são hash de endpoint/token, então é varredura.
  it('apaga as inscrições de push (push:* e fcm:*) do titular e NÃO as de outro', async () => {
    const { e } = await seededEnv();
    const pushKV = fakeKV({
      'push:aaaa': JSON.stringify({ endpoint: 'https://fcm.googleapis.com/x', saveId: ID, petName: 'Bolha' }),
      'fcm:bbbb': JSON.stringify({ token: 'tok', saveId: ID }),
      'push:cccc': JSON.stringify({ endpoint: 'https://fcm.googleapis.com/y', saveId: OTHER, petName: 'Bolha' }),
      // Registro legado, sem saveId: fora do alcance — NUNCA apagado por palpite
      // (o petName igual ao do titular é isca de propósito).
      'push:dddd': JSON.stringify({ endpoint: 'https://fcm.googleapis.com/z', petName: 'Bolha' }),
      'fcm:eeee': 'não é json',
    });
    e.PUSH_SUBSCRIPTIONS = pushKV;

    const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.executado.inscricoesDePushApagadas).toBe(2);

    expect(pushKV.store.has('push:aaaa')).toBe(false);
    expect(pushKV.store.has('fcm:bbbb')).toBe(false);
    expect(pushKV.store.has('push:cccc'), 'inscrição de OUTRO jogador segue intocada').toBe(true);
    expect(pushKV.store.has('push:dddd'), 'registro sem saveId não é apagado por palpite').toBe(true);
    expect(pushKV.store.has('fcm:eeee')).toBe(true);
    // O save também foi — a varredura de push não substitui o resto.
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(false);
  });

  it('sem o binding PUSH_SUBSCRIPTIONS a exclusão segue inteira (0 apagadas, sem erro)', async () => {
    const { e } = await seededEnv();
    expect(e.PUSH_SUBSCRIPTIONS).toBeUndefined();
    const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    expect(res.status).toBe(200);
    expect((await res.json()).executado.inscricoesDePushApagadas).toBe(0);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(false);
  });

  it('save inexistente não vaza se a conta existe — mesma forma e mesmo status', async () => {
    const vazio = env();
    const cheio = (await seededEnv()).e;
    const a = await onRequest({ request: post(`action=delete-request&id=${ID}`), env: vazio });
    const b = await onRequest({ request: post(`action=delete-request&id=${ID}`), env: cheio });
    expect(a.status).toBe(b.status);
    const ja = await a.json(); const jb = await b.json();
    expect(Object.keys(ja).sort()).toEqual(Object.keys(jb).sort());
  });
});

describe('account.js — autorização é FAIL-CLOSED', () => {
  it('exclusão é RECUSADA quando a autorização não é confiável (Firebase desligado)', async () => {
    authVerdict.value = { ok: false, status: 503, reason: 'auth-unavailable' };
    const { e } = await seededEnv();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken: 'x' }), env: e });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('auth-unavailable');
    expect(body.aviso['pt-BR']).toBeTruthy();
    expect(body.aviso.en).toBeTruthy();
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(true);
  });

  it('exportação também é recusada — não existe despejo de dado sem prova de dono', async () => {
    authVerdict.value = { ok: false, status: 503, reason: 'auth-unavailable' };
    const { e } = await seededEnv();
    const res = await onRequest({ request: get(`action=export&id=${ID}`), env: e });
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('procrastinação');
  });

  it('token de OUTRA conta leva 403 e não toca no KV', async () => {
    authVerdict.value = { ok: false, status: 403, reason: 'forbidden' };
    const { e } = await seededEnv();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken: 'x' }), env: e });
    expect(res.status).toBe(403);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(true);
  });

  it('negação é IDÊNTICA para conta que existe e conta que não existe', async () => {
    authVerdict.value = { ok: false, status: 401, reason: 'unauthenticated' };
    const a = await onRequest({ request: get(`action=export&id=${ID}`), env: env() });
    const b = await onRequest({ request: get(`action=export&id=${ID}`), env: (await seededEnv()).e });
    expect(a.status).toBe(b.status);
    expect(await a.json()).toEqual(await b.json());
  });

  it('id inválido é 400 antes de qualquer coisa', async () => {
    const res = await onRequest({ request: get('action=export&id=curto'), env: env() });
    expect(res.status).toBe(400);
  });

  it('método não suportado é 405', async () => {
    const res = await onRequest({
      request: new Request(`https://x/api/account?action=export&id=${ID}`, { method: 'DELETE' }), env: env(),
    });
    expect(res.status).toBe(405);
  });
});

describe('_auth.js — requireVerifiedOwner (módulo real, sem rede)', () => {
  it('sem FIREBASE_PROJECT_ID NEGA com 503 — o oposto do fail-open de authorizeSaveAccess', async () => {
    const r = await realAuth.requireVerifiedOwner(new Request('https://x/'), {}, ID);
    expect(r).toEqual({ ok: false, status: 503, reason: 'auth-unavailable' });

    // Contraste explícito: a rota antiga, com o mesmo env, ACEITA.
    const legado = await realAuth.authorizeSaveAccess(new Request('https://x/'), {}, ID);
    expect(legado.ok).toBe(true);
  });

  it('com projectId mas sem Bearer, nega 401 sem ir à rede', async () => {
    const r = await realAuth.requireVerifiedOwner(
      new Request('https://x/'), { FIREBASE_PROJECT_ID: 'p' }, ID,
    );
    expect(r).toEqual({ ok: false, status: 401, reason: 'unauthenticated' });
  });
});
