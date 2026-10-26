import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';
import { AI_LIMITS } from './_aiGuard.js';
import { SPRITE_REGEN, reserveRegen, refundRegen, completeRegen } from './_spriteRegen.js';
import { usarTetosDeSpriteDeProducao } from '../../src/test/tetosSprite.js';

// "Gerar de novo" a aparência (rodada 5, REGISTRO §34b): débito idempotente por opId ANTES de gerar, devolução em falha, cota mensal por forma,
// só conta paga, sem saldo. Roda com os tetos de produção (1 geração gratuita por forma), para provar que a regeração PAGA não depende deles.
usarTetosDeSpriteDeProducao();

const SAVE = 'abcdefgh12345678';
const FORM = 'rookie';
const OP1 = 'op-aaaaaaaa-0001';
const OP2 = 'op-bbbbbbbb-0002';

function fakeEnv(ent = {}) {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', credits: 120, aiForms: { [FORM]: 1 }, aiLifetime: { sprite: 1 }, ...ent }));
  const env = {
    GEMINI_API_KEY: 'k', SPRITE_GEMINI_IMAGE: '1',
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
      delete: async k => { store.delete(k); },
      getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    },
  };
  env._store = store;
  return env;
}
const entDe = env => JSON.parse(env._store.get(ENT_PREFIX + SAVE));

const req = (extra = {}) => new Request('https://soulmon.test/api/generate-sprite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'um bicho fofo', id: SAVE, formId: FORM, regenPaid: true, opId: OP1, ...extra }),
});

const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });
const geminiRecusa = () => new Response(JSON.stringify({ promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
const gemini500 = () => new Response('boom', { status: 500 });

let chamadasDeIA;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
  chamadasDeIA = [];
  vi.stubGlobal('fetch', vi.fn(async url => { chamadasDeIA.push(String(url)); return geminiOk(); }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('regeração paga: os números e a regra', () => {
  it('50 Créditos, 1 por forma por mês — e AI_LIMITS.sprite segue com a forma de produção (a 1ª geração gratuita não mudou)', () => {
    expect(SPRITE_REGEN).toEqual({ costCredits: 50, perFormPerMonth: 1 });
    expect(AI_LIMITS.sprite).toEqual({ perAccount: 6, perAccountLifetime: 15, perFormLifetime: 1, globalMonth: 800, globalDay: 40 });
  });
});

describe('regeração paga: débito ANTES, idempotente por opId', () => {
  it('sucesso: debita 50 uma vez, gera 1 imagem, marca a forma no mês e devolve o saldo novo', async () => {
    const env = fakeEnv();
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(200);
    const corpo = await res.json();
    expect(corpo).toMatchObject({ regen: true, credits: 70 });
    expect(corpo.image).toMatch(/\/api\/sprite-image\?k=/);
    expect(chamadasDeIA).toHaveLength(1);
    const ent = entDe(env);
    expect(ent.credits).toBe(70);
    expect(ent.aiRegen).toEqual({ [FORM]: '2026-08' });
    expect(ent.regenOps[OP1]).toMatchObject({ s: 'done', f: FORM, m: '2026-08' });
    // A regeração paga NÃO gasta o vitalício nem o teto por forma da 1ª geração gratuita.
    expect(ent.aiLifetime.sprite).toBe(1);
    expect(ent.aiForms[FORM]).toBe(1);
  });

  it('o MESMO opId repetido não debita nem gera de novo: devolve a imagem do gesto', async () => {
    const env = fakeEnv();
    const a = await (await onRequestPost({ request: req(), env })).json();
    const res2 = await onRequestPost({ request: req(), env });
    expect(res2.status).toBe(200);
    const b = await res2.json();
    expect(b).toMatchObject({ image: a.image, cached: true, regen: true });
    expect(chamadasDeIA).toHaveLength(1);
    expect(entDe(env).credits).toBe(70);
  });

  it('o débito sai ANTES da chamada de IA (o provedor vê o saldo já descontado)', async () => {
    const env = fakeEnv();
    let saldoNaChamada = null;
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); saldoNaChamada = entDe(env).credits; return geminiOk(); });
    expect((await onRequestPost({ request: req(), env })).status).toBe(200);
    expect(saldoNaChamada).toBe(70);
  });

  it('reserveRegen direto: repetir o opId nunca debita duas vezes', async () => {
    const env = fakeEnv();
    const a = await reserveRegen(env, SAVE, FORM, OP1, Date.now());
    const b = await reserveRegen(env, SAVE, FORM, OP1, Date.now());
    expect(a).toMatchObject({ ok: true, credits: 70 });
    expect(b).toMatchObject({ ok: false, status: 409, reason: 'regen-duplicate' });
    expect(entDe(env).credits).toBe(70);
  });

  it('opId ausente ou malformado é 400 e nada é cobrado nem gerado', async () => {
    for (const opId of [undefined, '', 'curto', 'tem espaço e !!!!!', 'x'.repeat(65), 12345678]) {
      const env = fakeEnv();
      const res = await onRequestPost({ request: req({ opId }), env });
      expect(res.status, String(opId)).toBe(400);
      expect((await res.json()).error).toBe('regen-op-id-required');
      expect(entDe(env).credits).toBe(120);
    }
    expect(chamadasDeIA).toEqual([]);
  });
});

describe('regeração paga: o débito VOLTA quando a geração falha (idempotente)', () => {
  it('falha do provedor (500): devolve os 50 e a cota do mês; o gesto fica refunded', async () => {
    const env = fakeEnv();
    fetch.mockImplementation(async url => { chamadasDeIA.push(String(url)); return gemini500(); });
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(500);
    const ent = entDe(env);
    expect(ent.credits).toBe(120);
    expect(ent.aiRegen).toEqual({});
    expect(ent.regenOps[OP1].s).toBe('refunded');
    // Dá para tentar de novo no mesmo mês (a cota voltou) com um opId novo.
    fetch.mockImplementation(async url => { chamadasDeIA.push(String(url)); return geminiOk(); });
    const de_novo = await onRequestPost({ request: req({ opId: OP2 }), env });
    expect(de_novo.status).toBe(200);
    expect(entDe(env).credits).toBe(70);
  });

  it('recusa de conteúdo sem imagem: também devolve (não saiu desenho)', async () => {
    const env = fakeEnv();
    fetch.mockImplementation(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).not.toBe(200);
    expect(entDe(env).credits).toBe(120);
    expect(entDe(env).regenOps[OP1].s).toBe('refunded');
  });

  it('refundRegen é idempotente: chamar duas vezes devolve uma vez só, e nunca devolve um gesto já entregue', async () => {
    const env = fakeEnv();
    await reserveRegen(env, SAVE, FORM, OP1, Date.now());
    expect(await refundRegen(env, SAVE, OP1)).toMatchObject({ refunded: true, credits: 120 });
    expect(await refundRegen(env, SAVE, OP1)).toEqual({ refunded: false });
    expect(entDe(env).credits).toBe(120);
    await reserveRegen(env, SAVE, FORM, OP2, Date.now());
    await completeRegen(env, SAVE, OP2);
    expect(await refundRegen(env, SAVE, OP2)).toEqual({ refunded: false });
    expect(entDe(env).credits).toBe(70);
  });

  it('recusa do teto de volume (diário por conta) depois do débito: devolve', async () => {
    const env = fakeEnv();
    const hoje = '2026-08-10';
    env._store.set(`ai:sprite:${SAVE}:${hoje}`, '6');
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(429);
    expect(entDe(env).credits).toBe(120);
    expect(entDe(env).regenOps[OP1].s).toBe('refunded');
    expect(chamadasDeIA).toEqual([]);
  });

  it('gesto cobrado que ficou preso (Worker caiu) e passou de 5 min: a repetição devolve e não gera', async () => {
    const env = fakeEnv();
    await reserveRegen(env, SAVE, FORM, OP1, Date.now());
    vi.setSystemTime(new Date('2026-08-10T12:06:00Z'));
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('regen-refunded');
    expect(entDe(env).credits).toBe(120);
    expect(chamadasDeIA).toEqual([]);
  });
});

describe('regeração paga: 1 por forma por MÊS', () => {
  it('a 2ª no mesmo mês é 429 regen-monthly-limit, sem cobrar nem gerar', async () => {
    const env = fakeEnv();
    expect((await onRequestPost({ request: req(), env })).status).toBe(200);
    const res = await onRequestPost({ request: req({ opId: OP2 }), env });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('regen-monthly-limit');
    expect(entDe(env).credits).toBe(70);
    expect(chamadasDeIA).toHaveLength(1);
  });

  it('outra forma no mesmo mês é livre; a mesma forma no mês seguinte também', async () => {
    const env = fakeEnv({ aiForms: { [FORM]: 1, 'champion-power': 1 } });
    expect((await onRequestPost({ request: req(), env })).status).toBe(200);
    expect((await onRequestPost({ request: req({ formId: 'champion-power', opId: OP2 }), env })).status).toBe(200);
    expect(entDe(env).credits).toBe(20);
    vi.setSystemTime(new Date('2026-09-01T00:00:01Z'));
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ ...entDe(env), credits: 100 }));
    expect((await onRequestPost({ request: req({ opId: 'op-cccccccc-0003' }), env })).status).toBe(200);
    expect(entDe(env).credits).toBe(50);
  });

  it('a cota do mês sobrevive a "apagar o save": ela mora no ent do servidor, não no save do cliente', async () => {
    const env = fakeEnv({ aiRegen: { [FORM]: '2026-08' } });
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(429);
  });

  it('exige uma 1ª geração da forma (a regeração não é um jeito de pagar pela gratuita)', async () => {
    const env = fakeEnv({ aiForms: {} });
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('regen-needs-first-generation');
    expect(entDe(env).credits).toBe(120);
    expect(chamadasDeIA).toEqual([]);
  });
});

describe('regeração paga: só conta paga e só com saldo', () => {
  it('conta demo: 402 paid-tier-required, nada cobrado, nada gerado', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 500 });
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('paid-tier-required');
    expect(entDe(env).credits).toBe(500);
    expect(chamadasDeIA).toEqual([]);
  });

  it('sem saldo (49): 402 insufficient-credits, nada cobrado, nada gerado, cota intacta', async () => {
    const env = fakeEnv({ credits: 49 });
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('insufficient-credits');
    const ent = entDe(env);
    expect(ent.credits).toBe(49);
    expect(ent.aiRegen ?? {}).toEqual({});
    expect(chamadasDeIA).toEqual([]);
  });

  it('saldo exato (50) basta e zera', async () => {
    const env = fakeEnv({ credits: 50 });
    expect((await onRequestPost({ request: req(), env })).status).toBe(200);
    expect(entDe(env).credits).toBe(0);
  });
});

describe('regeração paga: kill-switch próprio', () => {
  it('SPRITE_REGEN_DISABLED desliga só a regeração paga, antes de qualquer débito', async () => {
    const env = fakeEnv();
    env.SPRITE_REGEN_DISABLED = '1';
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('sprite-regen-disabled');
    expect(entDe(env).credits).toBe(120);
    expect(chamadasDeIA).toEqual([]);
    // A geração gratuita continua passando.
    const livre = new Request('https://soulmon.test/api/generate-sprite', { method: 'POST', body: JSON.stringify({ prompt: 'um bicho fofo', id: SAVE, formId: 'champion-power' }) });
    expect((await onRequestPost({ request: livre, env })).status).toBe(200);
  });
});

describe('regeração paga: a geração gratuita segue como era', () => {
  it('sem regenPaid nada muda: cache devolvido sem cobrar Créditos', async () => {
    const env = fakeEnv();
    const sem = { prompt: 'um bicho fofo', id: SAVE, formId: 'champion-power' };
    const r = await onRequestPost({ request: new Request('https://soulmon.test/api/generate-sprite', { method: 'POST', body: JSON.stringify(sem) }), env });
    expect(r.status).toBe(200);
    expect(entDe(env).credits).toBe(120);
    expect(entDe(env).regenOps).toBeUndefined();
  });
});
