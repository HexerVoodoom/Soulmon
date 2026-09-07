import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  onRequest,
  onRequestGet,
  onRequestOptions,
  summarizeNorthStar,
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
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 3, funnel: 1, taskName: 'x' } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'day_active', d: DAY, p: { effort: 4, soulGoal: 'x' } }, DAY)).toBeNull();
  });

  it('recusa CAMPO desconhecido no próprio registro', () => {
    expect(sanitizeRecord({ e: 'install', d: DAY, taskName: 'ligar pro médico' }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'install', d: DAY, t: 1755600000000 }, DAY)).toBeNull();
  });

  it('recusa prop fora da faixa, não numérica, ou faltando', () => {
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 999, funnel: 1 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: '3', funnel: 1 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: {} }, DAY)).toBeNull();
    // Passo sem funil é recusado: dado que não diz de qual dos dois usuários
    // opostos veio não serve para nada (evidencia-comportamento.md §3).
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 3 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'onboarding_step', d: DAY, p: { step: 3, funnel: 1 } }, DAY)).toEqual({
      e: 'onboarding_step', d: DAY, p: { step: 3, funnel: 1 },
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
        { e: 'onboarding_step', d: DAY, p: { step: 4, funnel: 2 } },
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

  it('onboarding_step vira um contador POR PASSO E POR FUNIL — o drop-off por tela', () => {
    const agg = applyAggregate({}, [
      { e: 'onboarding_step', d: DAY, p: { step: 1, funnel: 1 } },
      { e: 'onboarding_step', d: DAY, p: { step: 1, funnel: 1 } },
      { e: 'onboarding_step', d: DAY, p: { step: 2, funnel: 1 } },
    ]);
    expect(agg['onboarding_step.demo.1']).toBe(2);
    expect(agg['onboarding_step.demo.2']).toBe(1);
    expect(agg.onboarding_step).toBe(3);
  });

  it('o MESMO passo em funis diferentes NUNCA soma na mesma chave', () => {
    const agg = applyAggregate({}, [
      { e: 'onboarding_step', d: DAY, p: { step: 7, funnel: 1 } },
      { e: 'onboarding_step', d: DAY, p: { step: 7, funnel: 2 } },
      { e: 'onboarding_step', d: DAY, p: { step: 7, funnel: 0 } },
    ]);
    expect(agg['onboarding_step.demo.7']).toBe(1);
    expect(agg['onboarding_step.paid.7']).toBe(1);
    expect(agg['onboarding_step.unknown.7']).toBe(1);
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

  // GET deixou de ser 405: virou a LEITURA do agregado (G-7). Sem segredo
  // configurado ela responde 404 — fail-closed, e 404 em vez de 401 para nao
  // confirmar o endpoint a quem esta sondando. Ver `onRequestGet`.
  it('metodo que nao e GET nem POST continua sendo 405', async () => {
    const res = await onRequest({
      request: new Request('https://x/api/metrics', { method: 'DELETE' }),
      env: env(),
    });
    expect(res.status).toBe(405);
  });

  it('grava o agregado do dia sob o prefixo m:', async () => {
    const e = env();
    const res = await onRequest({
      request: post({ v: 1, id: ID, events: [{ e: 'install', d: DAY }, { e: 'day_active', d: DAY, p: { effort: 4, tier: 1 } }] }),
      env: e,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, accepted: 2 });

    const stored = JSON.parse(e.DIGIAPP_SAVES.store.get(METRICS_PREFIX + DAY));
    expect(stored).toEqual({
      install: 1,
      day_active: 1, 'day_active.demo': 1,
      effort_sum: 4, 'effort_sum.demo': 4,
      // WP0.8: o balde sai do MESMO `effort` que já chegava — o servidor deriva a
      // faixa, nada de novo sai do aparelho. effort 4 cai na faixa 1 ("3–4").
      'effort_bucket.1': 1, 'effort_bucket.demo.1': 1,
    });
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

// ---------------------------------------------------------------------------
// A LEITURA DO AGREGADO (G-7) E A METRICA-NORTE NO SERVIDOR.
//
// G-7 era o achado mais grave do levantamento: existia dado sendo GRAVADO em
// `m:*` e nenhum leitor em lugar nenhum do repositorio. Agregado sem leitor e
// dado morto — custa TTL, custa escrita, e nao arbitra decisao nenhuma.
//
// A leitura entra como GET no MESMO arquivo (nao numa rota nova) porque a
// allowlist, o prefixo e o formato do agregado vivem aqui: um leitor noutro
// arquivo seria regra copiada (footgun 9). Ela e fechada por segredo e FALHA
// FECHADA — sem segredo configurado, a rota nao existe.
// ---------------------------------------------------------------------------

const ADMIN = 'k'.repeat(40);
const getReq = (qs = '', headers = {}) =>
  new Request(`https://x/api/metrics${qs}`, { method: 'GET', headers });

describe('G-2/G-5/G-6: o agregado separa demo de pago, motivo e caminho', () => {
  it('todo evento com tier vira um contador POR tier, e o total continua legivel', () => {
    const agg = applyAggregate({}, [
      { e: 'purchase', d: DAY, p: { tier: 1 } },
      { e: 'purchase', d: DAY, p: { tier: 2 } },
      { e: 'purchase', d: DAY, p: { tier: 2 } },
    ]);
    expect(agg.purchase).toBe(3);
    expect(agg['purchase.demo']).toBe(1);
    expect(agg['purchase.paid']).toBe(2);
  });

  it('effort_sum tambem se separa — o esforco do demo nao e o do pagante', () => {
    const agg = applyAggregate({}, [
      { e: 'day_active', d: DAY, p: { effort: 3, tier: 1 } },
      { e: 'day_active', d: DAY, p: { effort: 5, tier: 2 } },
    ]);
    expect(agg.effort_sum).toBe(8);
    expect(agg['effort_sum.demo']).toBe(3);
    expect(agg['effort_sum.paid']).toBe(5);
  });

  it('unlock_view conta por MOTIVO — os dois convites nunca somam junto', () => {
    const agg = applyAggregate({}, [
      { e: 'unlock_view', d: DAY, p: { reason: 0, tier: 1 } },
      { e: 'unlock_view', d: DAY, p: { reason: 1, tier: 1 } },
      { e: 'unlock_view', d: DAY, p: { reason: 1, tier: 1 } },
    ]);
    expect(agg['unlock_view.task_limit']).toBe(1);
    expect(agg['unlock_view.evolution']).toBe(2);
  });

  it('activity_create conta por caminho e por tipo — o vazamento fica visivel', () => {
    const agg = applyAggregate({}, [
      { e: 'activity_create', d: DAY, p: { kind: 1, path: 0, tier: 1 } },
      { e: 'activity_create', d: DAY, p: { kind: 1, path: 1, tier: 1 } },
      { e: 'activity_create', d: DAY, p: { kind: 0, path: 1, tier: 1 } },
    ]);
    // `create_modal` e o unico caminho que consulta o cap; `home_edit` e o que
    // o levantamento achou vazando. Um contador para cada, de proposito.
    expect(agg['activity_create.create_modal.habit']).toBe(1);
    expect(agg['activity_create.home_edit.habit']).toBe(1);
    expect(agg['activity_create.home_edit.task']).toBe(1);
  });

  it('demo_cap_hit conta por caminho', () => {
    const agg = applyAggregate({}, [{ e: 'demo_cap_hit', d: DAY, p: { path: 0 } }]);
    expect(agg.demo_cap_hit).toBe(1);
    expect(agg['demo_cap_hit.create_modal']).toBe(1);
  });
});

describe('A METRICA-NORTE fica LEGIVEL no agregado', () => {
  it('week_active vira histograma de goal_days, por tier', () => {
    const agg = applyAggregate({}, [
      { e: 'week_active', d: DAY, p: { active_days: 5, goal_days: 4, tier: 1 } },
      { e: 'week_active', d: DAY, p: { active_days: 3, goal_days: 1, tier: 1 } },
      { e: 'week_active', d: DAY, p: { active_days: 7, goal_days: 6, tier: 2 } },
    ]);
    expect(agg.week_active).toBe(3);
    expect(agg['week_active.goal_days.4']).toBe(1);
    expect(agg['week_active.goal_days.1']).toBe(1);
    expect(agg['week_active.demo.goal_days.4']).toBe(1);
    expect(agg['week_active.paid.goal_days.6']).toBe(1);
  });

  it('summarizeNorthStar responde "quantos ativos batem >=4 de 7"', () => {
    const totals = {
      week_active: 10,
      'week_active.goal_days.0': 2,
      'week_active.goal_days.3': 3,
      'week_active.goal_days.4': 4,
      'week_active.goal_days.7': 1,
      'week_active.demo.goal_days.4': 1,
      'week_active.paid.goal_days.4': 3,
      'week_active.paid.goal_days.7': 1,
    };
    const ns = summarizeNorthStar(totals);
    expect(ns.weekly_active).toBe(10);
    expect(ns.on_target).toBe(5);   // 4 + 1
    expect(ns.rate).toBeCloseTo(0.5, 6);
    expect(ns.by_tier.paid.on_target).toBe(4);
    expect(ns.by_tier.demo.on_target).toBe(1);
  });

  it('sem nenhum ativo a taxa e null, nunca 0 — zero sobre zero nao e "0%"', () => {
    expect(summarizeNorthStar({}).rate).toBeNull();
  });
});

describe('G-7: a rota de leitura existe, e falha FECHADA', () => {
  it('sem METRICS_ADMIN_KEY configurada a rota nem existe (404, nao 401)', async () => {
    const res = await onRequestGet({ request: getReq('?from=2026-08-01&to=2026-08-07'), env: env() });
    expect(res.status).toBe(404);
  });

  it('com segredo configurado, chave errada e 401 e nao devolve nada', async () => {
    const e = { ...env(), METRICS_ADMIN_KEY: ADMIN };
    const res = await onRequestGet({
      request: getReq('?from=2026-08-01&to=2026-08-07', { 'X-Metrics-Key': 'errada' }),
      env: e,
    });
    expect(res.status).toBe(401);
    expect(await res.json()).not.toHaveProperty('days');
  });

  it('com a chave certa devolve os dias, os totais e a metrica-norte', async () => {
    const e = {
      ...env({
        'm:2026-08-24': JSON.stringify({ install: 3, week_active: 2, 'week_active.goal_days.4': 1, 'week_active.goal_days.2': 1 }),
        'm:2026-08-25': JSON.stringify({ install: 1, day_active: 4, effort_sum: 12 }),
      }),
      METRICS_ADMIN_KEY: ADMIN,
    };
    const res = await onRequestGet({
      request: getReq('?from=2026-08-24&to=2026-08-25', { 'X-Metrics-Key': ADMIN }),
      env: e,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days['2026-08-24'].install).toBe(3);
    expect(body.totals.install).toBe(4);
    expect(body.totals.effort_sum).toBe(12);
    expect(body.north_star.weekly_active).toBe(2);
    expect(body.north_star.on_target).toBe(1);
  });

  it('a janela tem teto — ninguem varre o namespace inteiro numa requisicao', async () => {
    const e = { ...env(), METRICS_ADMIN_KEY: ADMIN };
    const res = await onRequestGet({
      request: getReq('?from=2020-01-01&to=2026-08-25', { 'X-Metrics-Key': ADMIN }),
      env: e,
    });
    expect(res.status).toBe(400);
  });

  it('so le chaves do proprio prefixo — nao ha como pedir um save alheio', async () => {
    const kv = fakeKV({ 'abc123': JSON.stringify({ secreto: 1 }) });
    const e = { DIGIAPP_SAVES: kv, METRICS_ADMIN_KEY: ADMIN };
    const lidas = [];
    const origGet = kv.get;
    kv.get = async (k, o) => { lidas.push(k); return origGet(k, o); };
    await onRequestGet({
      request: getReq('?from=2026-08-24&to=2026-08-25', { 'X-Metrics-Key': ADMIN }),
      env: e,
    });
    expect(lidas.every(k => k.startsWith(METRICS_PREFIX))).toBe(true);
  });

  it('a leitura nao devolve identidade nenhuma — o agregado nao tem onde guardar', async () => {
    const e = {
      ...env({ 'm:2026-08-24': JSON.stringify({ install: 1 }) }),
      METRICS_ADMIN_KEY: ADMIN,
    };
    const res = await onRequestGet({
      request: getReq('?from=2026-08-24&to=2026-08-24', { 'X-Metrics-Key': ADMIN }),
      env: e,
    });
    const texto = JSON.stringify(await res.json());
    expect(texto).not.toMatch(/[0-9a-f]{32}/);
  });
});

describe('allowlist fechada tambem para os eventos NOVOS', () => {
  // O valor da allowlist e recusar o que ninguem previu. Estes nomes sao
  // plausiveis, vizinhos dos que existem, e e exatamente por isso que estao
  // aqui: sao os que passariam por uma denylist.
  it.each([
    'demo_cap_reached', 'activity_created', 'week_summary',
    'task_create', 'goal_days', 'tier',
  ])('recusa o evento inventado `%s`', name => {
    expect(sanitizeRecord({ e: name, d: DAY }, DAY)).toBeNull();
    const agg = applyAggregate({}, sanitizeBatch({ v: 1, id: ID, events: [{ e: name, d: DAY }] }, DAY).events);
    expect(agg).toEqual({});
  });

  it('prop inventada num evento NOVO derruba o evento inteiro', () => {
    expect(sanitizeRecord({ e: 'activity_create', d: DAY, p: { kind: 0, path: 0, tier: 1, taskName: 'x' } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'week_active', d: DAY, p: { active_days: 3, goal_days: 1, tier: 1, mood: 2 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'demo_cap_hit', d: DAY, p: { path: 0, email: 1 } }, DAY)).toBeNull();
  });

  it('prop declarada faltando derruba o evento — meio dado nao arbitra nada', () => {
    expect(sanitizeRecord({ e: 'activity_create', d: DAY, p: { kind: 0, path: 0 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'unlock_view', d: DAY, p: { tier: 1 } }, DAY)).toBeNull();
    expect(sanitizeRecord({ e: 'purchase', d: DAY }, DAY)).toBeNull();
  });

  it('GET tambem passa por onRequest quando o runtime nao separa o metodo', async () => {
    const res = await onRequest({ request: getReq('?from=2026-08-24&to=2026-08-24'), env: env() });
    expect(res.status).toBe(404); // sem segredo configurado: fail-closed
  });
});

// ---------------------------------------------------------------------------
// TODA PROPRIEDADE DECLARADA VIRA CONTADOR.
//
// A auditoria de 06/09/2026 achou nove eventos cujas props morriam no
// `applyAggregate`: o `bump(record.e)` do topo contava o evento e a
// propriedade sumia. Isso não é economia — é custo de privacidade sem
// retorno: o dado sai do aparelho, é declarado na política em PT e EN, e não
// responde pergunta nenhuma.
//
// O caso caro era o `retained`: o WP0.2 estava VERIFICADO e a retenção
// D1/D7/D30 continuava ilegível, porque os três marcos colapsavam num
// contador único.
//
// Este é um guard de COBERTURA, não de valor: ele não sabe qual balde é o
// certo, só que a propriedade precisa aparecer em ALGUMA chave além do nome
// do evento. É o suficiente para a próxima prop acrescentada não nascer muda.
// ---------------------------------------------------------------------------
describe('nenhuma propriedade declarada morre no agregado', () => {
  /** Um valor válido para cada faixa do schema — o mínimo serve. */
  const exemplo = (schema) => {
    const p = {};
    for (const [prop, faixa] of Object.entries(schema)) p[prop] = faixa.min;
    return p;
  };

  for (const [evento, schema] of Object.entries(EVENT_SCHEMA)) {
    // Evento sem propriedade nenhuma é um contador puro (`shield_used`), e não
    // tem o que perder: o schema vem `null`/vazio e ele sai do laço.
    if (!schema || typeof schema !== 'object') continue;
    const props = Object.keys(schema).filter(k => k !== 'tier');
    if (props.length === 0) continue;
    it(`${evento} produz chave além do próprio nome`, () => {
      const agg = applyAggregate({}, [{ e: evento, d: '2026-09-07', p: exemplo(schema) }]);
      // Só o nome cru do evento é excluído. Um balde `.unknown` CONTA como
      // cobertura: ele é o que aparece quando a prop tem valor fora do rótulo,
      // e é justamente o sinal de que a propriedade foi lida.
      const chaves = Object.keys(agg).filter(k => k !== evento);
      expect(chaves.length).toBeGreaterThan(0);
    });
  }
});

describe('milestone não é confundido com tier de conta', () => {
  it('o marco de hábito vira o próprio balde, não demo/unknown', () => {
    // Enquanto a prop se chamava `tier`, a regra genérica de TIER DE CONTA a
    // capturava: o marco de 7 dias virava `milestone.demo` e o de 66 virava
    // `milestone.unknown`. Inofensivo enquanto ninguém emite; venenoso no dia
    // em que o emissor ligar, e aí o dado errado já estaria no KV por 730 dias.
    const agg = applyAggregate({}, [
      { e: 'milestone', d: '2026-09-07', p: { level: 1 } },
      { e: 'milestone', d: '2026-09-07', p: { level: 3 } },
    ]);
    expect(agg['milestone.days_1']).toBe(1);
    expect(agg['milestone.days_3']).toBe(1);
    expect(agg['milestone.demo']).toBeUndefined();
    expect(agg['milestone.unknown']).toBeUndefined();
  });
});

describe('a retenção fica legível por marco', () => {
  it('D1, D7 e D30 são baldes separados', () => {
    const agg = applyAggregate({}, [
      { e: 'retained', d: '2026-09-07', p: { bucket: 0, tier: 1 } },
      { e: 'retained', d: '2026-09-07', p: { bucket: 1, tier: 1 } },
      { e: 'retained', d: '2026-09-07', p: { bucket: 1, tier: 2 } },
    ]);
    expect(agg['retained.d1']).toBe(1);
    expect(agg['retained.d7']).toBe(2);
    expect(agg['retained.demo.d7']).toBe(1);
    expect(agg['retained.paid.d7']).toBe(1);
    expect(agg['retained.d30']).toBeUndefined();
  });
});
