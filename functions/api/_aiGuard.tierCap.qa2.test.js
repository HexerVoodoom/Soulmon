/**
 * QA rodada 2 (22/09/2026) — `03-negocio-r2` §5 / #3, PROVISÓRIO #55 do
 * coordenador (o dono responde): a demo tinha a MESMA cota de chat (120/dia)
 * que a conta paga. Agora `AI_LIMITS.chat.perAccountByTier` = demo 30 / paid
 * 120, lido do entitlement UMA vez em `guardAiRequest`.
 */
import { describe, it, expect } from 'vitest';
import { guardAiRequest, AI_LIMITS } from './_aiGuard.js';

const SAVE = 'a'.repeat(32);
const req = () => new Request('https://x/api/chat', { method: 'POST' });

function fakeEnv(ent) {
  const store = new Map();
  if (ent) store.set(`ent:${SAVE}`, JSON.stringify(ent));
  let leiturasDoEnt = 0;
  return {
    DIGIAPP_SAVES: {
      get: async k => { if (k === `ent:${SAVE}`) leiturasDoEnt++; return store.has(k) ? store.get(k) : null; },
      put: async (k, v) => { store.set(k, v); },
    },
    _store: store,
    leiturasDoEnt: () => leiturasDoEnt,
  };
}

async function esgotar(env) {
  let ok = 0;
  for (let i = 0; i < 200; i++) {
    const r = await guardAiRequest(req(), env, 'chat', SAVE);
    if (!r.ok) return { ok, ultimo: r };
    ok++;
  }
  return { ok, ultimo: null };
}

describe('cota de chat por tier (provisório #55)', () => {
  it('a tabela declara demo 30 / paid 120, e `perAccount` continua sendo o teto de quem não tem tier', () => {
    expect(AI_LIMITS.chat.perAccountByTier).toEqual({ demo: 30, paid: 120 });
    expect(AI_LIMITS.chat.perAccount).toBe(120);
  });

  it('demo: 30 chamadas passam, a 31ª é 429 ai-daily-limit', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    const { ok, ultimo } = await esgotar(env);
    expect(ok).toBe(30);
    expect(ultimo).toMatchObject({ ok: false, status: 429, reason: 'ai-daily-limit' });
  });

  it('paid: 120 chamadas passam, a 121ª é 429', async () => {
    const env = fakeEnv({ tier: 'paid', credits: 0, orderDetails: [{ orderId: 'o', grantTier: 'paid' }] });
    const { ok, ultimo } = await esgotar(env);
    expect(ok).toBe(120);
    expect(ultimo).toMatchObject({ ok: false, status: 429 });
  });

  it('conta sem entitlement gravado é demo (readEntitlement devolve demo) → 30', async () => {
    const env = fakeEnv(null);
    expect((await esgotar(env)).ok).toBe(30);
  });

  it('o entitlement é lido UMA vez por chamada e NÃO é reescrito pelo chat', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    const antes = env._store.get(`ent:${SAVE}`);
    await guardAiRequest(req(), env, 'chat', SAVE);
    expect(env.leiturasDoEnt()).toBe(1);
    expect(env._store.get(`ent:${SAVE}`)).toBe(antes);
  });

  it('`suggest` (sem tabela por tier) continua no `perAccount` de sempre', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    let ok = 0;
    for (let i = 0; i < 100; i++) { if ((await guardAiRequest(req(), env, 'suggest', SAVE)).ok) ok++; else break; }
    expect(ok).toBe(AI_LIMITS.suggest.perAccount);
  });
});
