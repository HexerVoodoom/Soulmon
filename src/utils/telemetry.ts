// ---------------------------------------------------------------------------
// TELEMETRIA MÍNIMA — o único número do repositório capaz de arbitrar uma
// decisão de produto.
//
// Por que existe: `docs/PLANO-PRODUTO.md` (Parte 2 e Parte 5). O north star
// declarado — "peso de esforço real concluído por usuário ativo por semana" —
// é hoje um slogan, porque ninguém consegue LER o número. Três auditorias
// seguidas erraram a contagem de telas do onboarding (4, depois 12, depois 13,
// medida real: 8) porque não havia dado nenhum para arbitrar. `onboarding_step`
// é a resposta direta a esse prejuízo.
//
// PRINCÍPIOS INEGOCIÁVEIS — este arquivo existe sob eles, não apesar deles.
// O core do produto diz que o Soulmon "nunca vira um cobrador, um medidor de
// culpa, nem um score". Telemetria mal feita seria pior que telemetria nenhuma.
//
//  1. AGREGADOS, NUNCA CONTEÚDO. Jamais trafega nome de tarefa, nome de hábito,
//     texto de `soulGoal`/`soulStruggle`, humor, e-mail, nome do usuário, nem
//     qualquer resposta do oráculo. Só contadores. A garantia não é uma promessa
//     no comentário: é uma ALLOWLIST de eventos e de props (`EVENT_SCHEMA`).
//     Prop desconhecida não é removida — ela REJEITA o evento inteiro. Denylist
//     ("remova `taskName`") falha calada no dia em que alguém inventa um campo
//     novo; allowlist falha fechada, que é o lado certo de errar.
//  2. SEM SDK DE TERCEIROS. Nada de Firebase Analytics, GA, Amplitude. Usa a
//     infra que já existe: Cloudflare Pages Function + KV (`functions/api/metrics.js`).
//     SDK de terceiro é um contrato de privacidade que não escrevemos e não
//     conseguimos auditar.
//  3. PSEUDÔNIMO, NUNCA IDENTIDADE. O `saveId` é SHA-256 do e-mail e liga a
//     pessoa ao save — usá-lo aqui religaria métrica a conta. Este módulo gera
//     um id PRÓPRIO, aleatório (`crypto.getRandomValues`), local, sem nenhuma
//     relação matemática com e-mail ou saveId. Ele serve para DEDUPE LOCAL
//     (`install` uma vez na vida, `day_active` uma vez por dia) e o servidor o
//     descarta antes de qualquer escrita — a KV guarda só contadores por dia.
//  4. OPT-OUT REAL. `setTelemetryEnabled(false)` para de enviar de verdade e
//     APAGA a fila pendente. `telemetryConsentCopy` diz em português claro (e
//     inglês, que é a base) exatamente o que sai e o que nunca sai.
//  5. FALHA SILENCIOSA. Telemetria NUNCA quebra o app, nunca atrasa render,
//     nunca gera toast. Rede caiu, endpoint 404, KV fora, localStorage
//     bloqueado — o app não percebe. Todo caminho público é `try/catch` e
//     nenhum é `await`ado.
//  6. SEM PII DERIVÁVEL. Nenhum timestamp de precisão alta (milissegundo é
//     fingerprint: ordena e correlaciona usuários entre eventos). A resolução
//     máxima é o DIA, e o servidor ainda recusa dia fora de uma janela curta.
//
// FRONTEIRA: `EVENT_SCHEMA` está DUPLICADO em `functions/api/metrics.js` — as
// Pages Functions não importam de `src/`. Regra copiada é regra que diverge em
// silêncio (footgun 9), então existe teste de PARIDADE (`telemetry.test.ts`)
// que lê o arquivo do servidor e exige as mesmas chaves. Se você acrescentar um
// evento aqui, acrescente lá; o teste falha se esquecer.
// ---------------------------------------------------------------------------

import { readLocal, writeLocal, removeLocal, readJson, writeJson } from './safeStorage';

// ---------------------------------------------------------------------------
// Contrato de eventos
// ---------------------------------------------------------------------------

/** Os sete eventos. É o MÍNIMO que arbitra as decisões do plano — nada além. */
export type TelemetryEvent =
  /** Primeira abertura do app neste aparelho. Denominador de tudo. */
  | 'install'
  /** Passo do onboarding alcançado. Mede drop-off POR TELA — o dado que teria
   *  evitado três diagnósticos errados sobre o funil. */
  | 'onboarding_step'
  /** Escolheu um personagem pronto (caminho grátis). */
  | 'demo_pick'
  /** Primeira conclusão REAL. Abrir o app não conta nada (Parte 2). */
  | 'first_task_done'
  /** Abriu e concluiu ≥1 item no dia, com o PESO DE ESFORÇO do dia.
   *  `count(day_active)` = usuários ativos; `sum(effort)` = o north star. */
  | 'day_active'
  /** Viu a tela de compra. */
  | 'unlock_view'
  /** Comprou. */
  | 'purchase';

/**
 * Allowlist de props por evento. `null` = evento sem prop nenhuma.
 *
 * Os tetos numéricos não são paranoia decorativa: sem eles um cliente com bug
 * (ou alguém curioso) grava `step: 9e99` e o agregado do dia vira lixo — e um
 * agregado em que ninguém confia não arbitra decisão nenhuma, que é o problema
 * inteiro que este módulo veio resolver.
 */
export const EVENT_SCHEMA: Record<TelemetryEvent, Record<string, { min: number; max: number }> | null> = {
  install: null,
  onboarding_step: { step: { min: 0, max: 40 } },
  demo_pick: null,
  first_task_done: null,
  day_active: { effort: { min: 0, max: 500 } },
  unlock_view: null,
  purchase: null,
};

export const TELEMETRY_EVENTS = Object.keys(EVENT_SCHEMA) as TelemetryEvent[];

/** Props aceitas. Note que NÃO existe campo de texto livre — de propósito. */
export interface TelemetryProps {
  /** `onboarding_step`: índice da tela alcançada. */
  step?: number;
  /** `day_active`: peso de esforço concluído no dia (hábito=1, tarefa=effort). */
  effort?: number;
}

/** O que vai no corpo da requisição. Três campos, todos números ou enums. */
export interface TelemetryRecord {
  /** evento */
  e: TelemetryEvent;
  /** dia local, `YYYY-MM-DD`. A MAIOR resolução temporal que existe aqui. */
  d: string;
  /** props validadas pelo schema; ausente quando o evento não tem nenhuma. */
  p?: Record<string, number>;
}

/** O lote enviado ao servidor. */
export interface TelemetryBatch {
  v: 1;
  /** Pseudônimo local. O servidor valida o formato e DESCARTA — nunca vai à KV. */
  id: string;
  events: TelemetryRecord[];
}

// ---------------------------------------------------------------------------
// Limites
// ---------------------------------------------------------------------------

export const ENDPOINT = '/api/metrics';

/**
 * Teto da fila. A fila mora no localStorage (que é COMPARTILHADO com o save do
 * jogo e com o DigiApp na mesma origem — ver `safeStorage`), então uma fila sem
 * teto acaba estourando a cota e derrubando a gravação do PROGRESSO. Métrica
 * jamais pode custar o save de ninguém.
 *
 * Cheia, descartamos o evento NOVO e preservamos os antigos: o funil é a razão
 * de existir disto, e `install`/`onboarding_step` são justamente os primeiros.
 */
export const MAX_QUEUE = 200;

/** Teto por lote. Casa com o `MAX_EVENTS` do servidor. */
export const MAX_BATCH = 100;

/** Debounce do flush automático. Longo de propósito: nada aqui é urgente. */
const FLUSH_DEBOUNCE_MS = 5000;

// ---------------------------------------------------------------------------
// Chaves de storage
//
// Ficam AQUI e não em `storageKeys.ts` por uma razão de fronteira: a telemetria
// é um módulo opcional e removível — apagar este arquivo tem que apagar o
// recurso inteiro, sem deixar chave órfã no dicionário global do app.
// ---------------------------------------------------------------------------

const K_ENABLED = 'soulmon-telemetry-enabled';
const K_ID = 'soulmon-telemetry-id';
const K_QUEUE = 'soulmon-telemetry-queue';
/** Marcas de dedupe (`install`, `first_task_done`, `day_active:<dia>`). */
const K_SEEN = 'soulmon-telemetry-seen';

/** Eventos que acontecem UMA VEZ NA VIDA deste aparelho. */
const ONCE_EVER: TelemetryEvent[] = ['install', 'first_task_done'];
/** Eventos que acontecem UMA VEZ POR DIA. */
const ONCE_PER_DAY: TelemetryEvent[] = ['day_active'];

// ---------------------------------------------------------------------------
// Funções puras (o que os testes travam)
// ---------------------------------------------------------------------------

/**
 * Dia local em `YYYY-MM-DD`.
 *
 * Não reusa `dayKeyOf` (`utils/habitRhythm.ts`) porque aquele devolve
 * `toDateString()` — formato do MOTOR DE HÁBITOS, que precisa fazer aritmética
 * de dias. Aqui o formato é o da CHAVE DE AGREGADO no KV e precisa ser ISO e
 * ordenável. São dois requisitos diferentes sobre o mesmo conceito, não uma
 * regra copiada: nenhuma decisão de jogo depende deste formato.
 *
 * Local e não UTC: `day_active` descreve o dia do USUÁRIO. UTC jogaria a noite
 * de quem está em UTC−3 para o dia seguinte.
 */
export function telemetryDayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte (evento, props) no registro que TRAFEGA — ou `null` se algo não
 * bate a allowlist.
 *
 * Esta é a função que faz o princípio 1 ser verificável em vez de prometido.
 * Chame com `{ taskName: 'ligar pro médico' }` e receba `null`: não existe
 * caminho por onde um texto do usuário chegue ao corpo da requisição, porque
 * NENHUMA prop de texto é aceita, em nenhum evento.
 */
export function sanitizeEvent(
  event: string,
  props?: Record<string, unknown> | null,
  day: string = telemetryDayKey(),
): TelemetryRecord | null {
  // `hasOwnProperty` e não `EVENT_SCHEMA[event]`: sem isso, `constructor` e
  // `toString` acham um valor no PROTÓTIPO e passam pela allowlist. É o buraco
  // clássico de allowlist feita com objeto literal.
  if (!Object.prototype.hasOwnProperty.call(EVENT_SCHEMA, event)) return null;
  const schema = (EVENT_SCHEMA as Record<string, Record<string, { min: number; max: number }> | null>)[event];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;

  const keys = props ? Object.keys(props) : [];
  if (!schema) {
    // Evento sem props: mandar prop aqui é sinal de erro de fiação (ou de
    // alguém tentando anexar dado). Recusa, não ignora em silêncio.
    if (keys.length > 0) return null;
    return { e: event as TelemetryEvent, d: day };
  }

  const out: Record<string, number> = {};
  for (const key of keys) {
    const rule = schema[key];
    if (!rule) return null; // prop desconhecida REJEITA o evento inteiro
    const raw = (props as Record<string, unknown>)[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
    const n = Math.round(raw);
    if (n < rule.min || n > rule.max) return null;
    out[key] = n;
  }
  // Toda prop declarada no schema é obrigatória — `onboarding_step` sem `step`
  // não mede nada e só sujaria o agregado.
  for (const key of Object.keys(schema)) if (!(key in out)) return null;

  return { e: event as TelemetryEvent, d: day, p: out };
}

/**
 * Aplica o teto da fila. Extraída para o teste poder travar QUAL evento cai
 * quando enche (o novo, nunca o histórico do funil).
 */
export function enqueueCapped(queue: TelemetryRecord[], record: TelemetryRecord): TelemetryRecord[] {
  if (queue.length >= MAX_QUEUE) return queue;
  return [...queue, record];
}

/** Monta o corpo do lote. Nada além de `v`, `id` e os registros já saneados. */
export function buildBatch(id: string, events: TelemetryRecord[]): TelemetryBatch {
  return { v: 1, id, events: events.slice(0, MAX_BATCH) };
}

// ---------------------------------------------------------------------------
// Consentimento
// ---------------------------------------------------------------------------

export interface TelemetryConsentCopy {
  title: string;
  /** O que É enviado, item a item. */
  sent: string[];
  /** O que NUNCA é enviado. Esta lista é o motivo de o texto ser honesto. */
  never: string[];
  toggleLabel: string;
  footnote: string;
}

/**
 * O texto do opt-out. Regra do repositório: todo texto de UI nasce em inglês e
 * o par PT-BR vem junto.
 *
 * Ele descreve o que o código faz — e o código é a allowlist logo acima. Se um
 * dia alguém acrescentar um evento e não mexer aqui, este texto vira mentira;
 * é por isso que a lista `sent` fala de CONTADORES e nomeia o pseudônimo em vez
 * de dizer "dados anônimos", que é a formulação que não quer dizer nada.
 */
export function telemetryConsentCopy(language: 'pt-BR' | 'en-US'): TelemetryConsentCopy {
  if (language === 'pt-BR') {
    return {
      title: 'Estatísticas de uso',
      sent: [
        'Contadores de momentos do app: primeira abertura, qual passo do onboarding você alcançou, se escolheu um personagem pronto, sua primeira conclusão, se você abriu a tela de compra e se comprou.',
        'Uma vez por dia, um sinal de "teve atividade hoje" com o PESO de esforço concluído (um número, como 4).',
        'A data — só o dia, nunca a hora.',
        'Um identificador aleatório criado neste aparelho, sem nenhuma ligação com seu e-mail nem com seu save.',
      ],
      never: [
        'Nome de tarefa, nome de hábito ou qualquer texto que você escreveu.',
        'Suas respostas do onboarding (o que você quer melhorar, o que atrapalha) e do Oráculo.',
        'Seu humor do check-in.',
        'Seu e-mail, seu nome ou o nome do seu Soulmon.',
        'Sua localização, seus contatos ou qualquer identificador de aparelho.',
      ],
      toggleLabel: 'Enviar estatísticas de uso',
      footnote: 'Fica tudo em servidor nosso (Cloudflare) como um total por dia, somado a todo mundo — não existe uma linha do tempo sua. Nenhuma empresa de análise recebe nada. Se você desligar, o envio para de verdade e a fila que estiver aqui é apagada.',
    };
  }
  return {
    title: 'Usage stats',
    sent: [
      'Counters for app moments: first launch, which onboarding step you reached, whether you picked a ready-made character, your first completion, whether you opened the purchase screen, and whether you purchased.',
      'Once a day, a "there was activity today" signal with the effort WEIGHT you completed (a number, like 4).',
      'The date — the day only, never the time.',
      'A random identifier created on this device, with no link to your email or your save.',
    ],
    never: [
      'Task names, habit names, or any text you wrote.',
      'Your onboarding answers (what you want to improve, what gets in the way) or your Oracle answers.',
      'Your check-in mood.',
      'Your email, your name, or your Soulmon\'s name.',
      'Your location, your contacts, or any device identifier.',
    ],
    toggleLabel: 'Send usage stats',
    footnote: 'It lives on our own server (Cloudflare) as a daily total summed across everyone — there is no timeline of you. No analytics company receives anything. If you turn this off, sending really stops and whatever is queued here is deleted.',
  };
}

// ---------------------------------------------------------------------------
// Estado (localStorage via safeStorage — degrada, nunca lança)
// ---------------------------------------------------------------------------

/**
 * Ligada por padrão (opt-out), e é uma decisão consciente: só contador agregado
 * sai daqui, e um opt-IN sobre uma amostra de 5% mediria o funil dos curiosos em
 * vez do funil real — que é o mesmo defeito de não medir nada. O que torna isso
 * aceitável é o conjunto: sem conteúdo, sem identidade, e desligável de verdade.
 */
export function isTelemetryEnabled(): boolean {
  return readLocal(K_ENABLED) !== 'false';
}

/** Liga/desliga. Desligar APAGA a fila — deixar bytes esperando seria enganação. */
export function setTelemetryEnabled(on: boolean): void {
  try {
    // `silent`: é preferência, não progresso. Falhar aqui não pode queimar o
    // único aviso de storage degradado que o app tem (ver safeStorage).
    writeLocal(K_ENABLED, on ? 'true' : 'false', { silent: true });
    if (!on) {
      removeLocal(K_QUEUE, { silent: true });
      removeLocal(K_ID, { silent: true });
    }
  } catch {
    /* princípio 5 */
  }
}

/**
 * Pseudônimo local. 32 hex de `crypto.getRandomValues` — NÃO derivado de
 * e-mail, de saveId nem de nada do usuário, e por isso não religável à conta.
 * Sem `crypto` (ambiente exótico), cai em `Math.random`: um pseudônimo fraco
 * ainda é um pseudônimo, e travar o app por isso violaria o princípio 5.
 */
export function telemetryId(): string {
  const existing = readLocal(K_ID);
  if (existing && /^[0-9a-f]{32}$/.test(existing)) return existing;
  let id = '';
  try {
    const bytes = new Uint8Array(16);
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c?.getRandomValues) c.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    id = 'f'.repeat(32);
  }
  writeLocal(K_ID, id, { silent: true });
  return id;
}

function readQueue(): TelemetryRecord[] {
  const q = readJson<TelemetryRecord[]>(K_QUEUE, []);
  return Array.isArray(q) ? q : [];
}

function writeQueue(q: TelemetryRecord[]): void {
  writeJson(K_QUEUE, q, { silent: true });
}

function readSeen(): string[] {
  const s = readJson<string[]>(K_SEEN, []);
  return Array.isArray(s) ? s : [];
}

/** Marca de dedupe de um evento, ou `null` se ele pode repetir livremente. */
function seenKeyFor(record: TelemetryRecord): string | null {
  if (ONCE_EVER.includes(record.e)) return record.e;
  if (ONCE_PER_DAY.includes(record.e)) return `${record.e}:${record.d}`;
  return null;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Enfileira um evento. **Nunca lança, nunca bloqueia, nunca faz I/O de rede.**
 *
 * É idempotente onde o evento é conceitualmente único (`install`,
 * `first_task_done` uma vez na vida; `day_active` uma vez por dia), para que a
 * fiação possa chamar à vontade de dentro de um efeito do React sem inventar
 * o próprio controle — que seria regra copiada em quatro componentes.
 *
 * `day_active` ainda não enviado é SUBSTITUÍDO na fila pela chamada mais nova:
 * o peso do dia cresce ao longo do dia, e o número que interessa é o do
 * fechamento. O lugar natural de chamá-lo é a virada (`computeDailyReset`).
 */
export function track(event: TelemetryEvent, props?: TelemetryProps): void {
  try {
    if (!isTelemetryEnabled()) return;
    const record = sanitizeEvent(event, props as Record<string, unknown> | undefined);
    if (!record) return;

    const seenKey = seenKeyFor(record);
    if (seenKey && readSeen().includes(seenKey)) return;

    let queue = readQueue();
    if (record.e === 'day_active') {
      queue = queue.filter(r => !(r.e === 'day_active' && r.d === record.d));
    }
    const next = enqueueCapped(queue, record);
    if (next === queue) return; // fila cheia: descarta o novo, preserva o funil
    writeQueue(next);
    scheduleFlush();
  } catch {
    /* princípio 5: telemetria não tem permissão de falhar em voz alta */
  }
}

/** Agenda um flush preguiçoso. Nada aqui é urgente o bastante para render. */
function scheduleFlush(): void {
  try {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, FLUSH_DEBOUNCE_MS);
    // Node/worker: não segura o processo vivo por causa de métrica.
    (flushTimer as unknown as { unref?: () => void })?.unref?.();
  } catch {
    /* idem */
  }
}

/**
 * Envia o lote. Dispara e esquece — **não devolve promessa e não é `await`ável
 * de propósito**, para que nenhum call site consiga acidentalmente esperar por
 * rede antes de pintar a tela.
 *
 * `navigator.sendBeacon` quando existir (sobrevive ao fechamento da aba, que é
 * exatamente quando o último passo do onboarding é perdido); `fetch` com
 * `keepalive` como reserva.
 *
 * A fila só é limpa quando a entrega foi ACEITA pelo transporte. Beacon que
 * devolve `false` (payload acima do limite do navegador, por exemplo) devolve a
 * fila ao lugar — perder o evento é aceitável, perder em silêncio quando dava
 * para tentar de novo amanhã não é.
 */
export function flush(): void {
  try {
    if (!isTelemetryEnabled()) return;
    const queue = readQueue();
    if (queue.length === 0) return;

    const batch = buildBatch(telemetryId(), queue);
    const rest = queue.slice(batch.events.length);
    const body = JSON.stringify(batch);

    // Marca o dedupe ANTES de mandar. Reenviar um `install` porque a rede caiu
    // inflaria a métrica de instalação — e um denominador inflado é pior que um
    // evento perdido: ele mente para baixo em TODAS as taxas de conversão.
    const seen = readSeen();
    for (const record of batch.events) {
      const key = seenKeyFor(record);
      if (key && !seen.includes(key)) seen.push(key);
    }
    writeJson(K_SEEN, seen.slice(-400), { silent: true });

    writeQueue(rest);

    const nav = (globalThis as { navigator?: Navigator }).navigator;
    if (nav?.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (nav.sendBeacon(ENDPOINT, blob)) return;
      writeQueue(queue); // transporte recusou: devolve tudo para a próxima
      return;
    }

    const f = (globalThis as { fetch?: typeof fetch }).fetch;
    if (!f) {
      writeQueue(queue);
      return;
    }
    // `.catch` obrigatório: uma promessa rejeitada sem handler vira
    // `unhandledrejection`, que em alguns builds sobe como erro no console do
    // usuário — telemetria não pode aparecer nem no console.
    void f(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* princípio 5 */ });
  } catch {
    /* princípio 5 */
  }
}

/**
 * Registra o flush oportunista nos momentos em que a aba pode morrer.
 * Opcional e idempotente — quem faz a fiação chama uma vez no boot. Não é
 * efeito de import: um módulo que se pendura em `document` só por ter sido
 * importado é impossível de testar e de remover.
 */
export function installTelemetryAutoFlush(): () => void {
  const noop = () => { /* nada a desfazer */ };
  try {
    const doc = (globalThis as { document?: Document }).document;
    if (!doc?.addEventListener) return noop;
    const onHide = () => { if (doc.visibilityState === 'hidden') flush(); };
    doc.addEventListener('visibilitychange', onHide);
    return () => {
      try { doc.removeEventListener('visibilitychange', onHide); } catch { /* idem */ }
    };
  } catch {
    return noop;
  }
}

/** Só para teste — o estado real mora no localStorage de propósito. */
export function resetTelemetryForTest(): void {
  removeLocal(K_QUEUE, { silent: true });
  removeLocal(K_SEEN, { silent: true });
  removeLocal(K_ID, { silent: true });
  removeLocal(K_ENABLED, { silent: true });
  if (flushTimer !== null) {
    try { clearTimeout(flushTimer); } catch { /* idem */ }
    flushTimer = null;
  }
}

/** Só para teste/depuração — o que está esperando para ser enviado. */
export function pendingTelemetry(): TelemetryRecord[] {
  return readQueue();
}
