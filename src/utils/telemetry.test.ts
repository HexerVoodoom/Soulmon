// @vitest-environment jsdom
//
// O que estes testes existem para impedir:
//
//  - que um campo de TEXTO do usuário chegue ao corpo da requisição (o teste
//    `nome de tarefa` prova isso sobre o payload real, serializado, não sobre
//    uma intenção declarada em comentário);
//  - que a allowlist vire denylist sem ninguém notar;
//  - que o opt-out seja um botão que não desliga nada;
//  - que a fila cresça sem teto dentro do localStorage COMPARTILHADO com o save;
//  - que uma falha de rede escape e vire erro visível no app;
//  - que as duas cópias do `EVENT_SCHEMA` (cliente e servidor) divirjam em
//    silêncio — o footgun 9 do CLAUDE.md.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  track,
  flush,
  installTelemetryAutoFlush,
  isTelemetryEnabled,
  setTelemetryEnabled,
  telemetryConsentCopy,
  telemetryDayKey,
  telemetryId,
  sanitizeEvent,
  enqueueCapped,
  buildBatch,
  pendingTelemetry,
  resetTelemetryForTest,
  EVENT_SCHEMA,
  TELEMETRY_FUNNEL,
  TELEMETRY_TIER,
  TELEMETRY_PURCHASE_REASON,
  TELEMETRY_OPEN_SOURCE,
  openSourceFromUrl,
  limparOrigemDaUrl,
  drainHiddenTelemetry,
  pendingHiddenTelemetry,
  MAX_HIDDEN,
  afterBadDayGapBucket,
  revealDurationBucket,
  trackRetentionOnOpen,
  retentionBucketFor,
  TELEMETRY_UNLOCK_REASON,
  TELEMETRY_ACTIVITY_KIND,
  TELEMETRY_CREATE_PATH,
  setTelemetryTier,
  isoWeekKey,
  trackDayClosed,
  onboardingStepCode,
  isDocumentHidden,
  NEGATIVE_STEP_BASE,
  TELEMETRY_EVENTS,
  MAX_QUEUE,
  ENDPOINT,
  type TelemetryRecord,
} from './telemetry';
// A Pages Function é JS puro e não tem tipos — é justamente por não poder
// importar TS que ela carrega a segunda cópia do schema. Ver "FRONTEIRA".
// @ts-expect-error módulo JS sem declaração de tipos
import { EVENT_SCHEMA as SERVER_SCHEMA } from '../../functions/api/metrics.js';

/**
 * `localStorage` de mentira. Não é preciosismo: o node 22 expõe um
 * `globalThis.localStorage` PARCIAL (sem `setItem` utilizável sem
 * `--localstorage-file`) que ganha do jsdom, e `safeStorage` engoliria toda
 * gravação em silêncio — os testes passariam sem exercitar a fila.
 */
function installMemoryStorage() {
  const map = new Map<string, string>();
  const fake = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, String(v)); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: fake });
  return fake;
}

beforeEach(() => {
  installMemoryStorage();
  resetTelemetryForTest();
  // `sendBeacon` não existe no jsdom por padrão; o caminho exercitado aqui é o
  // `fetch` com `keepalive`, que é o mesmo que roda em navegador sem beacon.
  delete (navigator as unknown as Record<string, unknown>).sendBeacon;
});

afterEach(() => {
  vi.restoreAllMocks();
  resetTelemetryForTest();
});

// ---------------------------------------------------------------------------

describe('allowlist de eventos', () => {
  it('recusa evento que não está na allowlist', () => {
    expect(sanitizeEvent('mood_checkin')).toBeNull();
    expect(sanitizeEvent('soul_goal_answered')).toBeNull();
    expect(sanitizeEvent('')).toBeNull();
    // Não basta "não estar no objeto": propriedade herdada do protótipo também
    // precisa cair, senão `constructor`/`toString` passam pela allowlist.
    expect(sanitizeEvent('constructor')).toBeNull();
    expect(sanitizeEvent('toString')).toBeNull();
  });

  it('aceita os trinta e três eventos declarados, e só eles', () => {
    expect(TELEMETRY_EVENTS).toEqual([
      'install', 'onboarding_step', 'demo_pick', 'first_task_done', 'day_active',
      'unlock_view', 'purchase', 'demo_cap_hit', 'activity_create', 'week_active',
      // WP0.5 (rodada 2/3 do PLANO-MELHORIAS)
      'reveal_seen', 'checkin_commit', 'unlock_dismiss', 'haunted_done', 'checkin_shown', 'milestone', 'shield_used', 'welcome_back',
      'evolve', 'dungeon_run', 'bond_level',
      // WP0.10 / WP0.11 (rodada 4)
      'after_bad_day', 'app_open', 'push_optout',
      // WP0.2 (retenção fechada no aparelho)
      'retained',
      // som-01 (SQUAD-SOM) — a fotografia diária e a transição por gesto
      'sound_state', 'sound_off',
      // Guilda (WPG-7) — sem id de guilda nem pid
      'guild_create', 'guild_join', 'guild_leave', 'guild_thread', 'guild_raid', 'guild_stage',
    ]);
    expect(sanitizeEvent('install')).toEqual({ e: 'install', d: telemetryDayKey() });
  });

  it('evento sem props recusa props — não as ignora em silêncio', () => {
    expect(sanitizeEvent('install', { step: 3 })).toBeNull();
  });

  it('prop desconhecida derruba o EVENTO inteiro (allowlist, não denylist)', () => {
    expect(sanitizeEvent('onboarding_step', { step: 3, funnel: 1, taskName: 'x' })).toBeNull();
    expect(sanitizeEvent('day_active', { effort: 4, mood: 'triste' })).toBeNull();
  });

  it('prop declarada é obrigatória e precisa ser número finito na faixa', () => {
    expect(sanitizeEvent('onboarding_step', {})).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: '3', funnel: 1 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: NaN, funnel: 1 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: 999, funnel: 1 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: -1, funnel: 1 })).toBeNull();
    expect(sanitizeEvent('day_active', { effort: 9e99 })).toBeNull();
    // `funnel` é OBRIGATÓRIO como qualquer prop declarada: passo sem funil é
    // exatamente o dado inútil que o levantamento apontou.
    expect(sanitizeEvent('onboarding_step', { step: 3 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: 3, funnel: 9 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: 3, funnel: 1 })?.p).toEqual({ step: 3, funnel: 1 });
  });

  it('recusa dia fora do formato ISO (a única resolução temporal que existe)', () => {
    expect(sanitizeEvent('install', undefined, '2026-8-19')).toBeNull();
    expect(sanitizeEvent('install', undefined, String(Date.now()))).toBeNull();
    expect(sanitizeEvent('install', undefined, '2026-08-19')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('sem PII: o corpo da requisição não carrega conteúdo do usuário', () => {
  it('nome de tarefa passado como prop NÃO chega ao corpo — o evento nem sai', () => {
    const sent: string[] = [];
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response('{}'));
    }));

    // Uma fiação desatenta anexando exatamente o que nunca pode sair:
    track('first_task_done', {
      taskName: 'ligar pro oncologista da minha mãe',
      soulGoal: 'parar de me odiar',
      email: 'mateus@example.com',
      mood: 'péssimo',
    } as never);

    expect(pendingTelemetry()).toEqual([]);
    flush();
    expect(sent).toEqual([]); // não havia o que enviar

    // E o caminho legítimo, com o mesmo texto rondando o call site:
    track('first_task_done');
    flush();
    expect(sent).toHaveLength(1);
    const body = sent[0];
    for (const leak of ['oncologista', 'odiar', 'mateus@example.com', 'péssimo', 'taskName', 'soulGoal', 'email', 'mood']) {
      expect(body).not.toContain(leak);
    }
    const parsed = JSON.parse(body);
    // `tier` entra sozinho (carimbo ambiente) e é um ENUM — não é conteúdo.
    expect(parsed.events).toEqual([
      { e: 'first_task_done', d: telemetryDayKey(), p: { tier: TELEMETRY_TIER.unknown } },
    ]);
  });

  it('o corpo inteiro só tem números, enums e o pseudônimo — nada de texto livre', () => {
    const sent: string[] = [];
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response('{}'));
    }));
    track('install');
    track('onboarding_step', { step: 5, funnel: TELEMETRY_FUNNEL.paid });
    track('day_active', { effort: 4 });
    flush();

    const parsed = JSON.parse(sent[0]);
    expect(Object.keys(parsed).sort()).toEqual(['events', 'id', 'v']);
    expect(parsed.v).toBe(1);
    // Pseudônimo: 32 hex aleatórios, sem relação com e-mail nem com saveId.
    expect(parsed.id).toMatch(/^[0-9a-f]{32}$/);
    for (const record of parsed.events as TelemetryRecord[]) {
      expect(TELEMETRY_EVENTS).toContain(record.e);
      expect(record.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const value of Object.values(record.p ?? {})) expect(typeof value).toBe('number');
    }
  });

  it('o pseudônimo não deriva do e-mail nem do saveId — dois aparelhos, dois ids', () => {
    localStorage.setItem('digiapp-user-email', 'mateus@example.com');
    localStorage.setItem('digiapp-save-id', 'a'.repeat(64));
    const first = telemetryId();
    resetTelemetryForTest();
    const second = telemetryId();
    expect(first).not.toBe(second);
    expect(first).not.toContain('a'.repeat(8));
  });

  it('nenhum timestamp de precisão alta no corpo (fingerprint)', () => {
    const sent: string[] = [];
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response('{}'));
    }));
    track('install');
    track('day_active', { effort: 4 });
    flush();
    expectNoTimestamp(JSON.parse(sent[0]));
  });

  // REGRESSÃO NOMEADA — não simplifique de volta para `expect(corpo)`.
  //
  // A asserção original varria o corpo CRU com /\d{13}/. O corpo carrega o
  // pseudônimo de 32 hex (telemetry.ts:346), e sorteio de hex produz ≥13
  // dígitos decimais consecutivos em 1,83% dos ids (3.664 em 200.000 medidos
  // pelo alpha-qa). Ou seja: 1,83% de vermelho por execução de CI, sem culpa
  // nenhuma do código de produção. O id abaixo é um caso REAL reproduzido.
  it('id com 13 dígitos consecutivos NÃO reprova — o pseudônimo não é timestamp', () => {
    localStorage.setItem('soulmon-telemetry-id', '12bc7637879311510185b749ffffffff');
    const sent: string[] = [];
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response('{}'));
    }));
    track('install');
    flush();
    // O corpo cru CONTÉM 13 dígitos (é o que fazia o teste antigo piscar)...
    expect(sent[0]).toMatch(/\d{13}/);
    const parsed = JSON.parse(sent[0]);
    expect(parsed.id).toBe('12bc7637879311510185b749ffffffff');
    // ...e mesmo assim não há timestamp nenhum nos CAMPOS DO EVENTO.
    expectNoTimestamp(parsed);
  });

  // A intenção original continua coberta: reintroduzir um timestamp de verdade
  // no payload tem que reprovar, venha ele numa prop ou no campo de dia.
  it('timestamp reintroduzido no payload reprova', () => {
    const day = telemetryDayKey();
    expect(() =>
      expectNoTimestamp({ v: 1, id: 'a'.repeat(32), events: [{ e: 'install', d: day, p: { ts: 1756123456789 } }] }),
    ).toThrow();
    expect(() =>
      expectNoTimestamp({ v: 1, id: 'a'.repeat(32), events: [{ e: 'install', d: day, p: { at: 1756123456 } }] }),
    ).toThrow();
    expect(() =>
      expectNoTimestamp({ v: 1, id: 'a'.repeat(32), events: [{ e: 'install', d: new Date(1756123456789).toISOString() }] }),
    ).toThrow();
    expect(() =>
      expectNoTimestamp({ v: 1, id: 'a'.repeat(32), events: [{ e: 'install', d: day, t: 1756123456789 }] }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------

/**
 * Verifica a intenção do teste de fingerprint: **os campos do EVENTO** não
 * carregam tempo mais fino que o dia. Olha o objeto desserializado, campo a
 * campo — nunca a string crua, que inclui o pseudônimo aleatório e por isso
 * casa com /\d{13}/ por puro sorteio.
 */
function expectNoTimestamp(batch: unknown): void {
  const b = batch as { events: unknown[] };
  expect(Array.isArray(b.events)).toBe(true);
  for (const raw of b.events) {
    const record = raw as Record<string, unknown>;
    // Nenhum campo além dos três do contrato (um `t` novo seria timestamp).
    expect(Object.keys(record).sort().join(',')).toMatch(/^(d,e|d,e,p)$/);
    // Dia local, e SÓ o dia: nada de hora, minuto ou ISO completo.
    expect(record.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const [key, value] of Object.entries((record.p ?? {}) as Record<string, unknown>)) {
      expect(typeof value).toBe('number');
      // Corta epoch em ms (13 díg.) E em segundos (10 díg.): nenhuma prop
      // legítima (step, effort, dias) chega perto de 1e9.
      expect(Math.abs(value as number), `prop ${key}`).toBeLessThan(1e9);
      expect(Number.isFinite(value as number)).toBe(true);
    }
  }
}

// ---------------------------------------------------------------------------

describe('opt-out real', () => {
  it('vem ligada por padrão', () => {
    expect(isTelemetryEnabled()).toBe(true);
  });

  it('desligada: não enfileira e não envia', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);

    setTelemetryEnabled(false);
    expect(isTelemetryEnabled()).toBe(false);
    track('install');
    track('onboarding_step', { step: 2, funnel: TELEMETRY_FUNNEL.demo });
    expect(pendingTelemetry()).toEqual([]);
    flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('desligar APAGA a fila pendente — não deixa bytes esperando', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);

    track('install');
    track('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.evolution });
    expect(pendingTelemetry()).toHaveLength(2);

    setTelemetryEnabled(false);
    expect(pendingTelemetry()).toEqual([]);
    flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('religar volta a funcionar', () => {
    const fetchSpy = vi.fn((_u: string, _init?: RequestInit) => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);
    setTelemetryEnabled(false);
    setTelemetryEnabled(true);
    track('purchase', { reason: TELEMETRY_PURCHASE_REASON.onboarding });
    flush();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(ENDPOINT);
  });

  it('o texto de consentimento existe nos dois idiomas e nomeia o que nunca sai', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const copy = telemetryConsentCopy(lang);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.sent.length).toBeGreaterThan(0);
      expect(copy.never.length).toBeGreaterThan(0);
      expect(copy.toggleLabel.length).toBeGreaterThan(0);
      expect(copy.footnote.length).toBeGreaterThan(0);
    }
    // O texto PT precisa dizer as coisas por nome — "dados anônimos" não é
    // informação, é sedativo.
    const pt = telemetryConsentCopy('pt-BR');
    const never = pt.never.join(' ').toLowerCase();
    for (const term of ['tarefa', 'hábito', 'humor', 'e-mail', 'oráculo']) {
      expect(never).toContain(term);
    }
    expect(pt.footnote.toLowerCase()).toContain('desligar');
  });
});

// ---------------------------------------------------------------------------

describe('fila com teto', () => {
  it('para de crescer em MAX_QUEUE', () => {
    const queue: TelemetryRecord[] = [];
    let acc = queue;
    for (let i = 0; i < MAX_QUEUE + 50; i++) {
      acc = enqueueCapped(acc, { e: 'unlock_view', d: '2026-08-19' });
    }
    expect(acc).toHaveLength(MAX_QUEUE);
  });

  it('cheia, descarta o evento NOVO e preserva o funil antigo', () => {
    const full: TelemetryRecord[] = Array.from({ length: MAX_QUEUE }, () => ({
      e: 'install' as const, d: '2026-08-19',
    }));
    const after = enqueueCapped(full, { e: 'purchase', d: '2026-08-19' });
    expect(after).toBe(full);
    expect(after.every(r => r.e === 'install')).toBe(true);
  });

  it('o teto vale pelo caminho público também', () => {
    for (let i = 0; i < MAX_QUEUE + 20; i++) {
      track('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.taskLimit });
    }
    expect(pendingTelemetry()).toHaveLength(MAX_QUEUE);
  });

  it('o lote enviado respeita MAX_BATCH', () => {
    const many: TelemetryRecord[] = Array.from({ length: MAX_QUEUE }, () => ({
      e: 'unlock_view' as const, d: '2026-08-19',
    }));
    expect(buildBatch('0'.repeat(32), many).events).toHaveLength(100);
  });
});

// ---------------------------------------------------------------------------

describe('falha silenciosa', () => {
  it('fetch que rejeita não lança nem gera unhandled rejection', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))));
    track('install');
    expect(() => flush()).not.toThrow();
    // Deixa a microtask do `.catch` interno rodar: se o handler não existisse,
    // o vitest quebraria o teste com "unhandled rejection".
    await Promise.resolve();
    await Promise.resolve();
  });

  it('fetch que lança de forma síncrona não escapa', () => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('boom'); }));
    track('install');
    expect(() => flush()).not.toThrow();
  });

  it('sem fetch e sem beacon: não lança e não perde a fila', () => {
    vi.stubGlobal('fetch', undefined);
    track('install');
    expect(() => flush()).not.toThrow();
    expect(pendingTelemetry()).toHaveLength(1);
  });

  it('sendBeacon que recusa devolve a fila para a próxima tentativa', () => {
    (navigator as unknown as Record<string, unknown>).sendBeacon = vi.fn(() => false);
    track('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.taskLimit });
    flush();
    expect(pendingTelemetry()).toHaveLength(1);
  });

  it('sendBeacon disponível é preferido a fetch', () => {
    const beacon = vi.fn((_url: string, _body?: unknown) => true);
    (navigator as unknown as Record<string, unknown>).sendBeacon = beacon;
    const fetchSpy = vi.fn((_u: string, _init?: RequestInit) => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);
    track('purchase', { reason: TELEMETRY_PURCHASE_REASON.onboarding });
    flush();
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][0]).toBe(ENDPOINT);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pendingTelemetry()).toEqual([]);
  });

  it('localStorage bloqueado não derruba track nem flush', () => {
    const boom = () => { throw new Error('SecurityError'); };
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: boom, setItem: boom, removeItem: boom },
    });
    try {
      expect(() => track('install')).not.toThrow();
      expect(() => flush()).not.toThrow();
    } finally {
      installMemoryStorage();
    }
  });

  it('flush com fila vazia não toca na rede', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);
    flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('dedupe: o denominador não pode inflar', () => {
  it('install sai uma vez só, mesmo chamado a cada boot', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);
    track('install');
    flush();
    track('install');
    track('install');
    expect(pendingTelemetry()).toEqual([]);
  });

  it('day_active ainda não enviado é substituído pelo peso mais novo do dia', () => {
    track('day_active', { effort: 2 });
    track('day_active', { effort: 5 });
    const queue = pendingTelemetry();
    expect(queue).toHaveLength(1);
    expect(queue[0].p).toEqual({ effort: 5, tier: TELEMETRY_TIER.unknown });
  });

  it('day_active de dias diferentes convive', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 7, 19, 12));
      track('day_active', { effort: 3 });
      vi.setSystemTime(new Date(2026, 7, 20, 12));
      track('day_active', { effort: 7 });
      expect(pendingTelemetry()).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------

describe('política de privacidade ↔ EVENT_SCHEMA (WP0.3)', () => {
  it('todo evento do allowlist está nomeado em public/privacidade.html (PT e EN)', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const html = readFileSync(resolve(process.cwd(), 'public/privacidade.html'), 'utf8');
    for (const ev of Object.keys(EVENT_SCHEMA)) {
      const n = html.split(`<code>${ev}</code>`).length - 1;
      expect(n, `evento ${ev} deve aparecer na tabela PT e na EN`).toBeGreaterThanOrEqual(2);
    }
    // O número de eventos NÃO fica escrito à mão na política — ele já ficou
    // 3 eventos para trás uma vez ("sete" quando eram dez).
    expect(html).not.toMatch(/exatamente estes (sete|dez|\d+) eventos/);
    expect(html).not.toMatch(/exactly the (seven|ten|\d+) events/);
  });
});

/**
 * DIVERGÊNCIAS DECLARADAS entre o schema do cliente e o do servidor.
 *
 * O cliente é editado pela squad; `functions/api/metrics.js` é do backend
 * (fora do escopo da rodada A, 21/09/2026). Enquanto o backend não acompanha,
 * a diferença fica AQUI, com data, motivo e a linha exata a mudar — e o teste
 * abaixo falha nos DOIS sentidos: se aparecer divergência não declarada, ou se
 * o backend já acompanhou e a declaração ficou para trás (aí é apagar a linha).
 *
 * Efeito em produção enquanto durar: `app_open {source: 4}` (convite) passa no
 * cliente e é RECUSADO por `sanitizeEvent` do servidor — o evento morre em
 * silêncio, `app_open.invite` fica em zero. Não é perda de outro evento.
 */
const DIVERGENCIAS_DECLARADAS: Array<{ evento: string; prop: string; cliente: number; servidor: number; backend: string }> = [
  // (vazio em 22/09/2026: o backend acompanhou `app_open.source.max = 4` no mesmo
  // commit — a linha de `invite` saiu daqui. O mecanismo fica para a próxima.)
];

describe('paridade cliente ↔ servidor (footgun 9)', () => {
  it('os dois EVENT_SCHEMA têm exatamente os mesmos eventos', () => {
    expect(Object.keys(SERVER_SCHEMA as object).sort()).toEqual(Object.keys(EVENT_SCHEMA).sort());
  });

  it('e as mesmas props, com as mesmas faixas — fora as divergências DECLARADAS acima', () => {
    const servidor = JSON.parse(JSON.stringify(SERVER_SCHEMA)) as Record<string, Record<string, { min: number; max: number }> | null>;
    const cliente = JSON.parse(JSON.stringify(EVENT_SCHEMA)) as Record<string, Record<string, { min: number; max: number }> | null>;
    for (const d of DIVERGENCIAS_DECLARADAS) {
      const s = servidor[d.evento]?.[d.prop];
      const c = cliente[d.evento]?.[d.prop];
      expect(c?.max, `cliente ${d.evento}.${d.prop}.max`).toBe(d.cliente);
      expect(
        s?.max,
        `${d.evento}.${d.prop}.max no servidor já é ${s?.max}: o backend acompanhou — APAGUE esta linha de DIVERGENCIAS_DECLARADAS`,
      ).toBe(d.servidor);
      // Neutraliza a divergência declarada e compara o resto.
      servidor[d.evento]![d.prop] = { ...s!, max: d.cliente };
    }
    expect(servidor, 'divergência NÃO declarada entre cliente e servidor').toEqual(cliente);
  });

  it('cada divergência declarada diz a linha exata que o backend precisa mudar', () => {
    for (const d of DIVERGENCIAS_DECLARADAS) {
      expect(d.backend).toMatch(/functions\/api\/metrics\.js/);
      expect(d.backend).toMatch(/max: \d/);
    }
  });
});

// ---------------------------------------------------------------------------

describe('funil: demo e pago nunca caem no mesmo contador', () => {
  it('onboardingStepCode mapeia os ids negativos sem colidir com os positivos', () => {
    expect(onboardingStepCode(0)).toBe(0);
    expect(onboardingStepCode(35)).toBe(35); // REGISTER, o maior passo positivo
    expect(onboardingStepCode(-1)).toBe(NEGATIVE_STEP_BASE - 1); // DEMO_PICK
    expect(onboardingStepCode(-5)).toBe(NEGATIVE_STEP_BASE - 5); // AGE_BLOCK
    // Nenhum código de negativo pode cair na faixa dos positivos que existem.
    expect(onboardingStepCode(-1)).toBeGreaterThan(35);
    expect(onboardingStepCode(-99)).toBeNull();
    expect(onboardingStepCode(NaN)).toBeNull();
  });

  it('🔴 o passo negativo MAIS FUNDO ainda tem folga sobre o maior positivo', () => {
    // O TETO ANDOU E NINGUÉM MEDIU. Quando este mapeamento nasceu o passo mais
    // fundo era `AGE_BLOCK` (-5); o portão de conta trouxe mais três telas e
    // hoje o fundo é `GOOGLE_STEP` (-9) → código 36. O maior passo positivo é
    // `REGISTER`, que NÃO é um literal: vale
    // `5 + 1 + |ORACLE_QUESTIONS| + 1 + |SOUL_TEST_ITEMS| + 3`, hoje 35.
    //
    // Ou seja: a folga inteira é de UM. Um item novo no teste psicométrico
    // empurra REGISTER para 36 e ele passa a reportar o MESMO código de
    // `GOOGLE_STEP` — duas telas distintas do funil somando no mesmo contador,
    // sem erro, sem aviso, e com os dados parecendo plausíveis. É o footgun 9
    // em forma de número.
    //
    // Este teste é o alarme. Se ele ficar vermelho, a correção NÃO é afrouxar
    // a asserção: é subir `NEGATIVE_STEP_BASE` (e o `max` de `onboarding_step`
    // em `EVENT_SCHEMA`, que hoje vale exatamente a base) para longe do topo
    // dos positivos.
    const MAIS_FUNDO = -9;                  // GOOGLE_STEP, SoulmonOnboarding.tsx
    const MAIOR_POSITIVO = 35;              // REGISTER, derivado dos dois catálogos
    const codigoDoFundo = onboardingStepCode(MAIS_FUNDO);
    expect(codigoDoFundo).not.toBeNull();
    expect(codigoDoFundo!).toBeGreaterThan(MAIOR_POSITIVO);
    // E o maior positivo continua sendo o que este arquivo acredita que ele é.
    expect(onboardingStepCode(MAIOR_POSITIVO)).toBe(MAIOR_POSITIVO);
    // A allowlist tem de aceitar o código do fundo — senão a tela mais crítica
    // do funil (a primeira do app) seria descartada pelo próprio validador.
    expect(EVENT_SCHEMA.onboarding_step!.step.max).toBeGreaterThanOrEqual(codigoDoFundo!);
  });

  it('os três rótulos de funil passam pela allowlist e chegam distintos', () => {
    for (const funnel of Object.values(TELEMETRY_FUNNEL)) {
      expect(sanitizeEvent('onboarding_step', { step: 7, funnel })?.p).toEqual({ step: 7, funnel });
    }
    // O mesmo passo em funis diferentes é um registro diferente — é isso que
    // impede a média das duas populações opostas.
    const demo = sanitizeEvent('onboarding_step', { step: 7, funnel: TELEMETRY_FUNNEL.demo });
    const paid = sanitizeEvent('onboarding_step', { step: 7, funnel: TELEMETRY_FUNNEL.paid });
    expect(demo).not.toEqual(paid);
  });
});

// ---------------------------------------------------------------------------

describe('guard de segundo plano', () => {
  function oculto<T>(fn: () => T): T {
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    try {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      expect(isDocumentHidden()).toBe(true);
      return fn();
    } finally {
      Object.defineProperty(document, 'visibilityState', original ?? { value: 'visible', configurable: true });
    }
  }

  it('nada entra na fila PRINCIPAL com o app oculto — mas nada é descartado: espera na fila de oculto', () => {
    oculto(() => {
      track('install');
      track('day_active', { effort: 4 }, '2026-09-20');
      track('onboarding_step', { step: 1, funnel: TELEMETRY_FUNNEL.demo });
      expect(pendingTelemetry()).toEqual([]);
      expect(pendingHiddenTelemetry().map(r => r.e)).toEqual(['install', 'day_active', 'onboarding_step']);
    });
    // De volta à vista, o mesmo evento passa — o guard não é um opt-out oculto.
    expect(isDocumentHidden()).toBe(false);
    track('install');
    expect(pendingTelemetry()).toHaveLength(1);
  });

  it('review 07 §1.5: `day_active` gerado à meia-noite com a aba oculta chega à fila quando a aba volta, com o DIA de quando fechou', () => {
    oculto(() => {
      track('day_active', { effort: 3 }, '2026-09-20');
      expect(pendingTelemetry()).toEqual([]);
    });
    const n = drainHiddenTelemetry();
    expect(n).toBe(1);
    const q = pendingTelemetry();
    expect(q).toHaveLength(1);
    expect(q[0].e).toBe('day_active');
    expect(q[0].d).toBe('2026-09-20'); // não o dia do drain
    expect(q[0].p?.effort).toBe(3);
    expect(pendingHiddenTelemetry()).toEqual([]);
    // Idempotente: drenar de novo não duplica.
    expect(drainHiddenTelemetry()).toBe(0);
    expect(pendingTelemetry()).toHaveLength(1);
  });

  it('o drain respeita o dedupe da fila principal (ONCE_PER_DAY substitui, não duplica)', () => {
    track('day_active', { effort: 1 }, '2026-09-20');
    oculto(() => { track('day_active', { effort: 5 }, '2026-09-20'); });
    drainHiddenTelemetry();
    const dias = pendingTelemetry().filter(r => r.e === 'day_active');
    expect(dias).toHaveLength(1);
    expect(dias[0].p?.effort).toBe(5); // o fechamento vence
  });

  it('drenar com a aba AINDA oculta é no-op (senão devolveria tudo à mesma fila)', () => {
    oculto(() => {
      track('install');
      expect(drainHiddenTelemetry()).toBe(0);
      expect(pendingHiddenTelemetry()).toHaveLength(1);
    });
  });

  it('a fila de oculto tem teto e não cresce sem fim', () => {
    oculto(() => {
      for (let i = 0; i < MAX_HIDDEN + 20; i++) track('activity_create', { kind: 0, path: 0 });
      expect(pendingHiddenTelemetry().length).toBeLessThanOrEqual(MAX_HIDDEN);
    });
  });

  it('skeptic R2 #4: a fila de oculto guarda o registro SANEADO — prop de texto nunca espera no localStorage', () => {
    oculto(() => {
      // `sanitizeEvent` recusa texto: o evento morre ANTES de entrar na fila.
      track('activity_create', { kind: 0, path: 0, taskName: 'ligar pro médico' } as never);
      expect(pendingHiddenTelemetry()).toEqual([]);
      track('activity_create', { kind: 0, path: 0 });
      expect(pendingHiddenTelemetry()).toHaveLength(1);
    });
    const cru = JSON.parse(localStorage.getItem('soulmon-telemetry-hidden') ?? '[]');
    expect(cru).toEqual([{ e: 'activity_create', d: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), p: { kind: 0, path: 0, tier: 0 } }]); // o tier já carimbado
    expect(JSON.stringify(cru)).not.toContain('médico');
  });

  it('skeptic R2 #4: `ONCE_PER_DAY` deduplica na fila de oculto por (e, d) — a última vence, e o teto não descarta o fechamento', () => {
    oculto(() => {
      for (let i = 1; i <= MAX_HIDDEN + 5; i++) track('day_active', { effort: i }, '2026-09-20');
      const fila = pendingHiddenTelemetry();
      expect(fila.filter(r => r.e === 'day_active')).toHaveLength(1);
      // outro dia é outro registro
      track('day_active', { effort: 1 }, '2026-09-21');
      expect(pendingHiddenTelemetry().filter(r => r.e === 'day_active')).toHaveLength(2);
    });
    drainHiddenTelemetry();
    const d20 = pendingTelemetry().find(r => r.e === 'day_active' && r.d === '2026-09-20');
    expect(d20?.p?.effort).toBe(MAX_HIDDEN + 5);
  });

  it('desligar a telemetria apaga a fila de oculto também', () => {
    oculto(() => { track('install'); });
    expect(pendingHiddenTelemetry()).toHaveLength(1);
    setTelemetryEnabled(false);
    expect(pendingHiddenTelemetry()).toEqual([]);
  });

  it('`installTelemetryAutoFlush` drena no boot e quando a aba volta a ficar visível', () => {
    oculto(() => { track('install'); });
    const stop = installTelemetryAutoFlush();
    expect(pendingHiddenTelemetry()).toEqual([]);
    expect(pendingTelemetry().map(r => r.e)).toEqual(['install']);
    oculto(() => {
      track('day_active', { effort: 2 }, '2026-09-19');
      document.dispatchEvent(new Event('visibilitychange')); // hidden → flush (rede mockada), não drena
      expect(pendingHiddenTelemetry()).toHaveLength(1);
    });
    document.dispatchEvent(new Event('visibilitychange')); // visible → drena
    expect(pendingHiddenTelemetry()).toEqual([]);
    expect(pendingTelemetry().some(r => r.e === 'day_active' && r.d === '2026-09-19')).toBe(true);
    stop();
  });
});

// ---------------------------------------------------------------------------
// AS LACUNAS DA MÉTRICA-NORTE (G-2, G-4, G-5, G-6 e o north star em si).
//
// Este bloco existe porque `docs/PLANO-PRODUTO.md` diz, por escrito, que
// "um north star que ninguém consegue medir é um slogan". A métrica aprovada é:
//   · ATIVO  = concluiu ≥1 item real (tarefa ou hábito) NA SEMANA;
//   · ALVO   = o ativo atinge o PRÓPRIO `dailyGoalFor` em ≥4 dos 7 dias.
// Os dois são por PESSOA e por SEMANA. O agregado do servidor é por DIA e sem
// identidade — e vai continuar assim. Por isso a contagem "≥1 na semana" e
// "≥4 de 7" é fechada NO APARELHO, que é o único lugar que conhece a própria
// história sem que ninguém precise guardar uma linha do tempo de ninguém.
// ---------------------------------------------------------------------------

describe('G-2: tier ambiente — nenhum call site é responsável por lembrar dele', () => {
  it('os eventos que separam demo de pago declaram `tier` na allowlist', () => {
    const comTier = ['day_active', 'purchase', 'unlock_view', 'first_task_done',
      'activity_create', 'week_active'] as const;
    for (const e of comTier) {
      expect(EVENT_SCHEMA[e]).toHaveProperty('tier');
    }
  });

  it('`track` carimba o tier ambiente sem o call site passar nada', () => {
    setTelemetryTier('demo');
    // WP0.9: `purchase` passou a carregar `reason` (de onde veio a compra), e
    // toda prop declarada é obrigatória. O `tier` continua sendo o que o call
    // site NÃO precisa lembrar — que é o que este teste mede.
    track('purchase', { reason: TELEMETRY_PURCHASE_REASON.onboarding });
    expect(pendingTelemetry()[0]).toEqual({
      e: 'purchase',
      d: telemetryDayKey(),
      p: { reason: TELEMETRY_PURCHASE_REASON.onboarding, tier: TELEMETRY_TIER.demo },
    });
  });

  it('sem tier conhecido o evento sai como `unknown` — nunca some, nunca mente', () => {
    track('first_task_done');
    expect(pendingTelemetry()[0]?.p).toEqual({ tier: TELEMETRY_TIER.unknown });
  });

  it('o tier vale no momento do ENFILEIRAMENTO, não no do envio', () => {
    setTelemetryTier('demo');
    track('day_active', { effort: 3 });
    setTelemetryTier('paid');
    expect(pendingTelemetry()[0]?.p).toEqual({ effort: 3, tier: TELEMETRY_TIER.demo });
  });
});

describe('G-4: demo_cap_hit — o denominador da pergunta do cap', () => {
  it('existe, e diz por QUAL caminho a pessoa bateu no teto', () => {
    track('demo_cap_hit', { path: TELEMETRY_CREATE_PATH.create_modal });
    expect(pendingTelemetry()[0]).toEqual({
      e: 'demo_cap_hit', d: telemetryDayKey(), p: { path: TELEMETRY_CREATE_PATH.create_modal },
    });
  });

  it('caminho fora da faixa derruba o evento inteiro', () => {
    expect(sanitizeEvent('demo_cap_hit', { path: 99 })).toBeNull();
    expect(sanitizeEvent('demo_cap_hit', {})).toBeNull();
  });
});

describe('G-5: unlock_view separa os dois convites', () => {
  it('`task-limit` e `evolution` não caem no mesmo contador', () => {
    const limite = sanitizeEvent('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.taskLimit, tier: 1 });
    const evolucao = sanitizeEvent('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.evolution, tier: 1 });
    expect(limite?.p?.reason).toBe(0);
    expect(evolucao?.p?.reason).toBe(1);
    expect(limite).not.toEqual(evolucao);
  });

  it('unlock_view sem motivo não passa — o motivo é a razão de o evento existir', () => {
    expect(sanitizeEvent('unlock_view', { tier: 1 })).toBeNull();
  });
});

describe('G-6: activity_create — criação de atividade, com o caminho', () => {
  it('distingue tarefa de hábito e o caminho de criação', () => {
    setTelemetryTier('demo');
    track('activity_create', {
      kind: TELEMETRY_ACTIVITY_KIND.habit,
      path: TELEMETRY_CREATE_PATH.home_edit,
    });
    expect(pendingTelemetry()[0]?.p).toEqual({
      kind: TELEMETRY_ACTIVITY_KIND.habit,
      path: TELEMETRY_CREATE_PATH.home_edit,
      tier: TELEMETRY_TIER.demo,
    });
  });

  it('os caminhos são códigos distintos — o vazamento tem que ser VISÍVEL', () => {
    const codes = Object.values(TELEMETRY_CREATE_PATH);
    expect(new Set(codes).size).toBe(codes.length);
    expect(TELEMETRY_CREATE_PATH.create_modal).not.toBe(TELEMETRY_CREATE_PATH.home_edit);
  });

  it('nenhum texto do usuário tem por onde entrar', () => {
    expect(sanitizeEvent('activity_create', { kind: 0, path: 0, tier: 1, name: 'ligar pro medico' })).toBeNull();
  });
});

describe('A METRICA-NORTE: ativo na semana e >=4 de 7 no proprio objetivo', () => {
  it('isoWeekKey agrupa a semana ISO (segunda a domingo) e recusa lixo', () => {
    // 2026-08-24 é uma SEGUNDA; 2026-08-30 é o domingo da MESMA semana.
    expect(isoWeekKey('2026-08-24')).toBe(isoWeekKey('2026-08-30'));
    // 2026-08-23 é o domingo ANTERIOR — semana diferente.
    expect(isoWeekKey('2026-08-23')).not.toBe(isoWeekKey('2026-08-24'));
    expect(isoWeekKey('nao-e-data')).toBeNull();
  });

  it('só fecha a semana quando ela vira, e conta os dias no PRÓPRIO objetivo', () => {
    // Semana A: 5 dias ativos, 4 deles batendo a meta própria.
    trackDayClosed({ day: '2026-08-24', effort: 4, goalMet: true });
    trackDayClosed({ day: '2026-08-25', effort: 2, goalMet: false });
    trackDayClosed({ day: '2026-08-26', effort: 6, goalMet: true });
    trackDayClosed({ day: '2026-08-27', effort: 5, goalMet: true });
    trackDayClosed({ day: '2026-08-28', effort: 3, goalMet: true });
    // Nada de `week_active` ainda: a semana não fechou.
    expect(pendingTelemetry().filter(r => r.e === 'week_active')).toEqual([]);

    // Primeiro dia da semana seguinte: a semana A é despachada.
    trackDayClosed({ day: '2026-08-31', effort: 1, goalMet: false });
    const semana = pendingTelemetry().filter(r => r.e === 'week_active');
    expect(semana).toHaveLength(1);
    expect(semana[0].p).toEqual({
      active_days: 5, goal_days: 4, tier: TELEMETRY_TIER.unknown,
    });
    // Datado no ÚLTIMO dia ativo da semana fechada — nunca em "hoje", senão o
    // agregado do dia atual receberia a semana passada.
    expect(semana[0].d).toBe('2026-08-28');
  });

  it('dia sem esforço não conta como ativo (abrir o app não é atividade)', () => {
    trackDayClosed({ day: '2026-08-24', effort: 0, goalMet: false });
    trackDayClosed({ day: '2026-08-25', effort: 3, goalMet: true });
    trackDayClosed({ day: '2026-08-31', effort: 1, goalMet: false });
    const semana = pendingTelemetry().find(r => r.e === 'week_active');
    expect(semana?.p?.active_days).toBe(1);
    // e nenhum `day_active` foi emitido pelo dia vazio
    expect(pendingTelemetry().filter(r => r.e === 'day_active').map(r => r.d))
      .toEqual(['2026-08-25', '2026-08-31']);
  });

  it('o mesmo dia recontado não infla a semana', () => {
    trackDayClosed({ day: '2026-08-24', effort: 4, goalMet: true });
    trackDayClosed({ day: '2026-08-24', effort: 9, goalMet: true });
    trackDayClosed({ day: '2026-08-31', effort: 1, goalMet: false });
    expect(pendingTelemetry().find(r => r.e === 'week_active')?.p?.active_days).toBe(1);
  });

  it('semana sem nenhum dia ativo não gera week_active — o denominador é ATIVO', () => {
    trackDayClosed({ day: '2026-08-24', effort: 0, goalMet: false });
    trackDayClosed({ day: '2026-08-31', effort: 2, goalMet: true });
    expect(pendingTelemetry().filter(r => r.e === 'week_active')).toEqual([]);
  });

  it('a semana carrega o tier vigente NELA, não o de quem converteu depois', () => {
    setTelemetryTier('demo');
    trackDayClosed({ day: '2026-08-24', effort: 4, goalMet: true });
    setTelemetryTier('paid');
    trackDayClosed({ day: '2026-08-31', effort: 4, goalMet: true });
    expect(pendingTelemetry().find(r => r.e === 'week_active')?.p?.tier)
      .toBe(TELEMETRY_TIER.demo);
  });

  it('goal_days nunca passa de active_days', () => {
    expect(sanitizeEvent('week_active', { active_days: 2, goal_days: 5, tier: 1 })).toBeNull();
    expect(sanitizeEvent('week_active', { active_days: 5, goal_days: 2, tier: 1 })?.p)
      .toEqual({ active_days: 5, goal_days: 2, tier: 1 });
  });
});

describe('WP0.9/0.10/0.11/0.12 — os eventos novos e seus limites', () => {
  beforeEach(() => { localStorage.clear(); setTelemetryEnabled(true); });

  it('`purchase` sem `reason` é RECUSADO — prop declarada é obrigatória', () => {
    // Sem isto, a compra voltaria a ser um número só e o convite que a
    // trouxe ficaria invisível de novo.
    expect(sanitizeEvent('purchase', { tier: 1 })).toBeNull();
    expect(sanitizeEvent('purchase', { tier: 1, reason: 4 })).not.toBeNull();
    expect(sanitizeEvent('purchase', { tier: 1, reason: 5 })).toBeNull();
  });

  it('`app_open` só aceita as cinco origens (4 = convite desde 21/09/2026)', () => {
    expect(sanitizeEvent('app_open', { source: 0 })).not.toBeNull();
    expect(sanitizeEvent('app_open', { source: 3 })).not.toBeNull();
    expect(sanitizeEvent('app_open', { source: 4 })).not.toBeNull();
    expect(sanitizeEvent('app_open', { source: 5 })).toBeNull();
  });

  it('`app_open` deduplica por dia E por origem', () => {
    // Só por dia, quem abre pelo push de manhã e direto à tarde contaria uma
    // só — e a pergunta que o evento existe para responder ("o push traz
    // gente que faz alguma coisa?") ficaria sem denominador.
    track('app_open', { source: TELEMETRY_OPEN_SOURCE.push });
    track('app_open', { source: TELEMETRY_OPEN_SOURCE.push });
    track('app_open', { source: TELEMETRY_OPEN_SOURCE.direct });
    const abertos = pendingTelemetry().filter(r => r.e === 'app_open');
    expect(abertos).toHaveLength(2);
  });

  it('`?src=convite` (e `invite`) é a origem 4 — o link do E0 (review 07 §2)', () => {
    expect(openSourceFromUrl('?src=convite')).toBe(TELEMETRY_OPEN_SOURCE.invite);
    expect(openSourceFromUrl('?src=invite')).toBe(TELEMETRY_OPEN_SOURCE.invite);
    expect(TELEMETRY_OPEN_SOURCE.invite).toBe(4);
    expect(EVENT_SCHEMA.app_open!.source.max).toBe(4);
    track('app_open', { source: TELEMETRY_OPEN_SOURCE.invite });
    expect(pendingTelemetry().filter(r => r.e === 'app_open')).toHaveLength(1);
  });

  it('`limparOrigemDaUrl` apaga o `?src=` e preserva caminho e hash; sem `src`, não toca na URL', () => {
    history.replaceState(null, '', '/?src=convite&x=1#h');
    limparOrigemDaUrl();
    expect(location.search).toBe('');
    expect(location.pathname).toBe('/');
    expect(location.hash).toBe('#h');
    const spy = vi.spyOn(history, 'replaceState');
    limparOrigemDaUrl();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('`openSourceFromUrl` não deixa a URL inventar origem', () => {
    expect(openSourceFromUrl('?src=push')).toBe(TELEMETRY_OPEN_SOURCE.push);
    expect(openSourceFromUrl('?src=widget')).toBe(TELEMETRY_OPEN_SOURCE.widget);
    expect(openSourceFromUrl('')).toBe(TELEMETRY_OPEN_SOURCE.direct);
    // Origem desconhecida vira `direct` — quem manda o link não escreve a métrica.
    expect(openSourceFromUrl('?src=campanha-paga')).toBe(TELEMETRY_OPEN_SOURCE.direct);
  });

  it('`push_optout` é o FATO, sem prop nenhuma', () => {
    expect(sanitizeEvent('push_optout')).toEqual({ e: 'push_optout', d: telemetryDayKey() });
    // Motivo exigiria perguntar na saída, que é o padrão escuro recusado aqui.
    expect(sanitizeEvent('push_optout', { reason: 1 })).toBeNull();
  });

  it('`after_bad_day` é FAIXA, nunca data', () => {
    expect(afterBadDayGapBucket(1)).toBe(0);
    expect(afterBadDayGapBucket(3)).toBe(1);
    expect(afterBadDayGapBucket(7)).toBe(2);
    expect(afterBadDayGapBucket(40)).toBe(3);
    expect(sanitizeEvent('after_bad_day', { gap: 4, kind: 0 })).toBeNull();
  });

  it('`reveal_seen.duration` é faixa de 0 a 3', () => {
    expect(revealDurationBucket(2)).toBe(0);
    expect(revealDurationBucket(10)).toBe(1);
    expect(revealDurationBucket(30)).toBe(2);
    expect(revealDurationBucket(300)).toBe(3);
    expect(sanitizeEvent('reveal_seen', { has_sprite: 1, funnel: 1, duration: 4 })).toBeNull();
  });
});

describe('WP0.2 — retenção sem trair a privacidade', () => {
  beforeEach(() => { localStorage.clear(); setTelemetryEnabled(true); });

  const D = (iso: string) => new Date(`${iso}T12:00:00Z`);

  it('a primeira abertura só GRAVA o dia — não emite nada', () => {
    trackRetentionOnOpen(D('2026-09-01'));
    expect(pendingTelemetry().filter(r => r.e === 'retained')).toHaveLength(0);
  });

  it('emite o marco quando ele é cruzado', () => {
    trackRetentionOnOpen(D('2026-09-01'));
    trackRetentionOnOpen(D('2026-09-02'));
    const r = pendingTelemetry().filter(x => x.e === 'retained');
    expect(r).toHaveLength(1);
    expect(r[0].p?.bucket).toBe(0);
  });

  it('cada marco sai UMA vez na vida', () => {
    // Repetir infla a fração de retenção, e retenção inflada é pior que
    // nenhuma: mente para cima na métrica que decide se o produto continua.
    trackRetentionOnOpen(D('2026-09-01'));
    trackRetentionOnOpen(D('2026-09-02'));
    trackRetentionOnOpen(D('2026-09-03'));
    flush();
    trackRetentionOnOpen(D('2026-09-04'));
    expect(pendingTelemetry().filter(x => x.e === 'retained')).toHaveLength(0);
  });

  it('quem some 40 dias e volta emite o marco MAIOR, não os três', () => {
    trackRetentionOnOpen(D('2026-09-01'));
    trackRetentionOnOpen(D('2026-10-15'));
    const r = pendingTelemetry().filter(x => x.e === 'retained');
    expect(r).toHaveLength(1);
    expect(r[0].p?.bucket).toBe(2);
  });

  it('a DATA de instalação NUNCA aparece no corpo do lote', () => {
    // É a trava do pacote: a decisão D1/D2 foi ledger local, nada de id — a
    // data mora no aparelho e o que sai é um inteiro.
    trackRetentionOnOpen(D('2026-09-01'));
    trackRetentionOnOpen(D('2026-09-08'));
    const corpo = JSON.stringify(pendingTelemetry());
    expect(corpo).not.toContain('2026-09-01');
    expect(corpo).not.toContain('soulmon-telemetry-install');
    // E a chave existe MESMO — senão este teste passaria medindo o nada.
    expect(localStorage.getItem('soulmon-telemetry-install')).toContain('2026-09-01');
  });

  it('`retentionBucketFor` não inventa marco antes da hora', () => {
    expect(retentionBucketFor(0)).toBeNull();
    expect(retentionBucketFor(1)).toBe(0);
    expect(retentionBucketFor(6)).toBe(0);
    expect(retentionBucketFor(7)).toBe(1);
    expect(retentionBucketFor(30)).toBe(2);
    expect(retentionBucketFor(NaN)).toBeNull();
  });
});
