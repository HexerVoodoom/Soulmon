import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  onRequest,
  onRequestOptions,
  sanitizeRecord,
  sanitizeBatch,
  applyAggregate,
  groupByDay,
  serverDay,
  dayDistance,
  EVENT_SCHEMA,
  METRICS_PREFIX,
  MAX_BODY_BYTES,
  MAX_EVENTS,
  MAX_DAY_SKEW_DAYS,
} from './metrics.js';
import { resetRateLimits } from './_rateLimit.js';

// O endpoint de métrica é o único lugar do servidor que recebe dado de
// COMPORTAMENTO. A garantia que estes testes travam não é "a gente lembra de
// não mandar PII": é que a allowlist recusa qualquer coisa que não seja um dos
// sete eventos com as props declaradas, e que o que chega à KV é um CONTADOR
// POR DIA e nunca a série de ninguém.

const ID = '0'.repeat(32);
const DAY = serverDay();

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async (k, opts) => {
      const raw = store.get(k) ?? null;
      if (raw === null) return null;
      return opts?.type === 'json' ? JSON.parse(raw) : raw;
    },
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
  };
}

const env = (seed) => ({ DIGIAPP_SAVES: fakeKV(seed) });

const post = (body, { rawBody } = {}) => new Request('https://x/api/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: rawBody ?? JSON.stringify(body),
});

afterEach(() => {
  resetRateLimits();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------

describe('allowlist de eventos (nunca denylist)', () => {
  it('recusa evento desconhecido', () => {
    expect(sanitizeRecord({ e: 'mood_checkin', d: DAY }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'oracle_answer', d: DAY }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 42, d: DAY }, DAY)).toBeNull();
  });

  it('recusa evento herdado do protótipo (o buraco clássico da allowlist)', () => {
    expect(sanitizeRecord({ e: 'constructor', d: DAY }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'hasOwnProperty', d: DAY }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: '__proto__', d: DAY }, DAY)).toBeNull();
  });

  it('recusa prop desconhecida derrubando o evento inteiro', () => {
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 3, taskName: 'x' } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'day_active', d: DAY, p: { effort: 4, soulGoal: 'x' } }, DAY)).toBeNull();
  });

  it('recusa CAMPO desconhecido no próprio registro', () => {
    expect(sanitizeRecord({ e: 'install', d: DAY, taskName: 'ligar pro médico' }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'install', d: DAY, t: 1755600000000 }, DAY)).toBeNull();
  });

  it('recusa prop fora da faixa, não numérica, ou faltando', () => {
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 999 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: '3' } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: {} }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 3 } }, DAY)).toEqual({
      e: 'onboarding_step', d: DAY, p: { step: 3 },
    });
  });

  it('evento sem schema recusa props', () => {
    expect(sanitizeRecord({ e: 'install', d: DAY, p: { step: 1 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'install', d: DAY }, DAY)).toEqual({ e: 'install', d: DAY });
  });

  it('todos os sete eventos declarados passam', () => {
    for (const event of Object.keys(EVENT_SCHEMA)) {
      const schema = EVENT_SCHEMA[event];
      const p = schema ? Object.fromEntries(Object.keys(schema).map(k => [k, 1])) : undefined;
      const record = p ? { e: event, d: DAY, p } : { e: event, d: DAY };
      expect(sanitizeRecord(record, DAY)).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------

describe('resolução de tempo: dia, e só o dia', () => {
  it('recusa formato que não é YYYY-MM-DD', () => {
    expect(sanitizeRecord({ e: 'install', d: '2026-8-19' }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'install', d: '2026-08-19T13:45:12.345Z' }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'install', d: 1755600000000 }, DAY)).toBeNull();
  });

  it('aceita defasagem dentro da janela (fila offline) e recusa fora', () => {
    const today = '2026-08-19';
    expect(sanitizeRecord({ e: 'install', d: '2026-08-13' }, today)).not.toBeNull();
    expect(sanitizeRecord({ e: 'install', d: '2026-08-26' }, today)).not.toBeNull();
    expect(sanitizeRecord({ e: 'install', d: '2026-07-01' }, today)).toBeNull();
    expect(sanitizeRecord({ e: 'install', d: '2030-01-01' }, today)).toBeNull();
    expect(dayDistance('2026-08-19', '2026-08-12')).toBe(MAX_DAY_SKEW_DAYS);
  });
});

// ---------------------------------------------------------------------------

describe('lote', () => {
  it('recusa versão, id e forma erradas', () => {
    expect(sanitizeBatch(null, DAY).ok).toBe(false);
    expect(sanitizeBatch([], DAY).ok).toBe(false);
    expect(sanitizeBatch({ v: 2, id: ID, events: [] }, DAY).ok).toBe(false);
    expect(sanitizeBatch({ v: 1, id: 'mateus@example.com', events: [{ e: 'install', d: DAY }] }, DAY).ok).toBe(false);
    expect(sanitizeBatch({ v: 1, id: ID, events: {} }, DAY).ok).toBe(false);
    expect(sanitizeBatch({ v: 1, id: ID, events: [] }, DAY).ok).toBe(false);
  });

  it('recusa campo desconhecido no lote (por onde um e-mail entraria)', () => {
    const batch = { v: 1, id: ID, events: [{ e: 'install', d: DAY }], email: 'a@b.c' };
    expect(sanitizeBatch(batch, DAY).ok).toBe(false);
  });

  it('recusa lote acima de MAX_EVENTS', () => {
    const events = Array.from({ length: MAX_EVENTS + 1 }, () => ({ e: 'install', d: DAY }));
    expect(sanitizeBatch({ v: 1, id: ID, events }, DAY).ok).toBe(false);
  });

  it('um evento ruim não derruba os bons que vieram junto', () => {
    const result = sanitizeBatch({
      v: 1,
      id: ID,
      events: [
        { e: 'install', d: DAY },
        { e: 'evento_do_futuro', d: DAY },
        { e: 'onboarding_step', d: DAY, p: { step: 4 } },
      ],
    }, DAY);
    expect(result.ok).toBe(true);
    expect(result.events).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------

describe('agregado diário — nunca a série de ninguém', () => {
  it('soma contadores por evento', () => {
    const agg = applyAggregate(null, [
      { e: 'install', d: DAY },
      { e: 'install', d: DAY },
      { e: 'purchase', d: DAY },
    ]);
    expect(agg).toEqual({ install: 2, purchase: 1 });
  });

  it('onboarding_step vira um contador POR PASSO — o drop-off por tela', () => {
    const agg = applyAggregate({}, [
      { e: 'onboarding_step', d: DAY, p: { step: 1 } },
      { e: 'onboarding_step', d: DAY, p: { step: 1 } },
      { e: 'onboarding_step', d: DAY, p: { step: 2 } },
    ]);
    expect(agg['onboarding_step.1']).toBe(2);
    expect(agg['onboarding_step.2']).toBe(1);
    expect(agg.onboarding_step).toBe(3);
  });

  it('day_active dá o north star: effort_sum / day_active', () => {
    const agg = applyAggregate({}, [
      { e: 'day_active', d: DAY, p: { effort: 3 } },
      { e: 'day_active', d: DAY, p: { effort: 5 } },
    ]);
    expect(agg.day_active).toBe(2);
    expect(agg.effort_sum).toBe(8);
    expect(agg.effort_sum / agg.day_active).toBe(4);
  });

  it('acumula sobre o agregado que já estava na KV', () => {
    expect(applyAggregate({ install: 10 }, [{ e: 'install', d: DAY }]).install).toBe(11);
  });

  it('agregado corrompido na KV não propaga NaN', () => {
    expect(applyAggregate({ install: 'muitos' }, [{ e: 'install', d: DAY }]).install).toBe(1);
    expect(applyAggregate('lixo', [{ e: 'install', d: DAY }])).toEqual({ install: 1 });
  });

  it('agrupa por dia — uma escrita de KV por dia, não por evento', () => {
    const grouped = groupByDay([
      { e: 'install', d: '2026-08-19' },
      { e: 'purchase', d: '2026-08-19' },
      { e: 'install', d: '2026-08-18' },
    ]);
    expect([...grouped.keys()].sort()).toEqual(['2026-08-18', '2026-08-19']);
    expect(grouped.get('2026-08-19')).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------

describe('handler', () => {
  it('OPTIONS responde com CORS', async () => {
    const res = await onRequestOptions();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('GET não é permitido', async () => {
    const res = await onRequest({ request: new Request('https://x/api/metrics'), env: env() });
    expect(res.status).toBe(405);
  });

  it('grava o agregado do dia sob o prefixo m:', async () => {
    const e = env();
    const res = await onRequest({
      request: post({ v: 1, id: ID, events: [{ e: 'install', d: DAY }, { e: 'day_active', d: DAY, p: { effort: 4 } }] }),
      env: e,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, accepted: 2 });

    const stored = JSON.parse(e.DIGIAPP_SAVES.store.get(METRICS_PREFIX + DAY));
    expect(stored).toEqual({ install: 1, day_active: 1, effort_sum: 4 });
    // Uma chave por DIA. Nada de chave por usuário nem série individual.
    expect([...e.DIGIAPP_SAVES.store.keys()]).toEqual([METRICS_PREFIX + DAY]);
  });

  it('o pseudônimo NÃO chega à KV — nada é religável à conta', async () => {
    const e = env();
    await onRequest({ request: post({ v: 1, id: 'abcdef01'.repeat(4), events: [{ e: 'install', d: DAY }] }), env: e });
    const dump = JSON.stringify([...e.DIGIAPP_SAVES.store.entries()]);
    expect(dump).not.toContain('abcdef01');
    expect(dump).not.toContain('id');
  });

  it('recusa corpo acima do teto ANTES de parsear', async () => {
    const e = env();
    const res = await onRequest({ request: post(null, { rawBody: 'x'.repeat(MAX_BODY_BYTES + 1) }), env: e });
    expect(res.status).toBe(400);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('recusa JSON inválido', async () => {
    const res = await onRequest({ request: post(null, { rawBody: '{nope' }), env: env() });
    expect(res.status).toBe(400);
  });

  it('lote válido com todos os eventos recusados responde 202 e não grava', async () => {
    const e = env();
    const res = await onRequest({
      request: post({ v: 1, id: ID, events: [{ e: 'nao_existe', d: DAY }] }),
      env: e,
    });
    expect(res.status).toBe(202);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('sem binding de KV não é 500 — telemetria não pode parecer falha do app', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await onRequest({ request: post({ v: 1, id: ID, events: [{ e: 'install', d: DAY }] }), env: {} });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, accepted: 0 });
  });

  it('KV que explode não derruba a requisição', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = {
      DIGIAPP_SAVES: {
        get: async () => { throw new Error('kv down'); },
        put: async () => { throw new Error('kv down'); },
      },
    };
    const res = await onRequest({ request: post({ v: 1, id: ID, events: [{ e: 'install', d: DAY }] }), env: broken });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, accepted: 0 });
  });

  it('não colide com as chaves de save nem de entitlement', () => {
    expect(METRICS_PREFIX).toBe('m:');
    expect(METRICS_PREFIX + DAY).not.toMatch(/^(ent:|ord:)/);
    // saveId é 32–64 de [a-zA-Z0-9_-]; `m:2026-08-19` tem `:` e não colide.
    expect(/^[a-zA-Z0-9_-]{8,64}$/.test(METRICS_PREFIX + DAY)).toBe(false);
  });
});
