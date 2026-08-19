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

  it('aceita os sete eventos declarados, e só eles', () => {
    expect(TELEMETRY_EVENTS).toEqual([
      'install', 'onboarding_step', 'demo_pick', 'first_task_done',
      'day_active', 'unlock_view', 'purchase',
    ]);
    expect(sanitizeEvent('install')).toEqual({ e: 'install', d: telemetryDayKey() });
  });

  it('evento sem props recusa props — não as ignora em silêncio', () => {
    expect(sanitizeEvent('install', { step: 3 })).toBeNull();
  });

  it('prop desconhecida derruba o EVENTO inteiro (allowlist, não denylist)', () => {
    expect(sanitizeEvent('onboarding_step', { step: 3, taskName: 'x' })).toBeNull();
    expect(sanitizeEvent('day_active', { effort: 4, mood: 'triste' })).toBeNull();
  });

  it('prop declarada é obrigatória e precisa ser número finito na faixa', () => {
    expect(sanitizeEvent('onboarding_step', {})).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: '3' })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: NaN })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: 999 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: -1 })).toBeNull();
    expect(sanitizeEvent('day_active', { effort: 9e99 })).toBeNull();
    expect(sanitizeEvent('onboarding_step', { step: 3 })?.p).toEqual({ step: 3 });
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
    expect(parsed.events).toEqual([{ e: 'first_task_done', d: telemetryDayKey() }]);
  });

  it('o corpo inteiro só tem números, enums e o pseudônimo — nada de texto livre', () => {
    const sent: string[] = [];
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response('{}'));
    }));
    track('install');
    track('onboarding_step', { step: 5 });
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
    flush();
    // Nenhum número com cara de epoch ms (13 dígitos) em lugar nenhum.
    expect(sent[0]).not.toMatch(/\d{13}/);
  });
});

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
    track('onboarding_step', { step: 2 });
    expect(pendingTelemetry()).toEqual([]);
    flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('desligar APAGA a fila pendente — não deixa bytes esperando', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);

    track('install');
    track('unlock_view');
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
    track('purchase');
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
    for (let i = 0; i < MAX_QUEUE + 20; i++) track('unlock_view');
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
    track('unlock_view');
    flush();
    expect(pendingTelemetry()).toHaveLength(1);
  });

  it('sendBeacon disponível é preferido a fetch', () => {
    const beacon = vi.fn((_url: string, _body?: unknown) => true);
    (navigator as unknown as Record<string, unknown>).sendBeacon = beacon;
    const fetchSpy = vi.fn((_u: string, _init?: RequestInit) => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchSpy);
    track('purchase');
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
    expect(queue[0].p).toEqual({ effort: 5 });
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

describe('paridade cliente ↔ servidor (footgun 9)', () => {
  it('os dois EVENT_SCHEMA têm exatamente os mesmos eventos', () => {
    expect(Object.keys(SERVER_SCHEMA as object).sort()).toEqual(Object.keys(EVENT_SCHEMA).sort());
  });

  it('e as mesmas props, com as mesmas faixas', () => {
    expect(JSON.parse(JSON.stringify(SERVER_SCHEMA))).toEqual(JSON.parse(JSON.stringify(EVENT_SCHEMA)));
  });
});
