/**
 * QA rodada 2 (22/09/2026) — `03-negocio-r2` §5 / #3, PROVISÓRIO #55 do
 * coordenador (o dono responde): a demo tinha a MESMA cota de chat (120/dia)
 * que a conta paga. Agora `AI_LIMITS.chat.perAccountByTier` = demo 30 / paid
 * 120, lido do entitlement UMA vez em `guardAiRequest`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// Valores refeitos em 11/10/2026: custo ZERO no plano gratuito (REGISTRO §32).
describe('cota de chat por tier (provisório #55 → free tier §32)', () => {
  it('a tabela declara demo 20 / paid 100 (beta12: 20 por dia no grátis, 100 no pago — dono 12/11), e `perAccount` continua sendo o teto de quem não tem tier', () => {
    expect(AI_LIMITS.chat.perAccountByTier).toEqual({ demo: 20, paid: 100 });
    expect(AI_LIMITS.chat.perAccount).toBe(15);
  });

  it('demo: 20 chamadas passam, a 21ª é 429 ai-daily-limit', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    const { ok, ultimo } = await esgotar(env);
    expect(ok).toBe(20);
    expect(ultimo).toMatchObject({ ok: false, status: 429, reason: 'ai-daily-limit' });
  });

  it('paid: 100 chamadas passam, a 101ª é 429', async () => {
    const env = fakeEnv({ tier: 'paid', credits: 0, orderDetails: [{ orderId: 'o', grantTier: 'paid' }] });
    const { ok, ultimo } = await esgotar(env);
    expect(ok).toBe(100);
    expect(ultimo).toMatchObject({ ok: false, status: 429 });
  });

  it('conta sem entitlement gravado é demo (readEntitlement devolve demo) → 20', async () => {
    const env = fakeEnv(null);
    expect((await esgotar(env)).ok).toBe(20);
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

// BUG-03 (QA beta12): o dia do limite do chat é o dia LOCAL do jogador (cabeçalho X-Player-Day), não o UTC.
describe('chat: dia do limite = dia do jogador (BUG-03)', () => {
  // Relógio fixo: 12:00Z de 10/11 — janela válida do cabeçalho = 2026-11-10 e 2026-11-11 (UTC−12…UTC+14).
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-10T12:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });
  const reqDia = dia => new Request('https://x/api/chat', { method: 'POST', headers: dia ? { 'X-Player-Day': dia } : {} });
  const diaUtc = d => d.toISOString().slice(0, 10);
  const somaDias = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  const gasta = async (env, dia, n) => { let ok = 0; for (let i = 0; i < n; i++) { if ((await guardAiRequest(reqDia(dia), env, "chat", SAVE)).ok) ok++; } return ok; };

  it('mesmo dia UTC, mas virou o dia local do jogador: a cota é nova', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    const hoje = diaUtc(new Date());
    const ontemLocal = hoje; const amanhaLocal = somaDias(hoje, 1);
    expect(await gasta(env, ontemLocal, 25)).toBe(20);
    expect(await gasta(env, amanhaLocal, 25)).toBe(20);
  });

  it('mesmo dia local: a 21ª é recusada mesmo que o UTC tenha virado', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    const dia = somaDias(diaUtc(new Date()), 1);
    expect(await gasta(env, dia, 25)).toBe(20);
  });

  it('cabeçalho forjado (fora de UTC±1) ou malformado é ignorado: cai no dia UTC', async () => {
    const env = fakeEnv({ tier: 'demo', credits: 0 });
    expect(await gasta(env, '2020-01-01', 10)).toBe(10);
    expect(await gasta(env, 'lixo', 10)).toBe(10);
    expect(await gasta(env, null, 10)).toBe(0); // mesma chave UTC: já gastou 20
  });
});
