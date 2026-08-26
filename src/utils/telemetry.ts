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
// A MÉTRICA-NORTE, e como ela ficou legível sem afrouxar nada do que está
// acima: `docs/PLANO-PRODUTO.md` diz que "um north star que ninguém consegue
// medir é um slogan". A métrica aprovada é por PESSOA e por SEMANA — "concluiu
// ≥1 item real na semana" e "bateu o próprio `dailyGoalFor` em ≥4 dos 7 dias"
// — e um agregado diário anônimo não consegue calcular nenhuma das duas.
// A resposta NÃO foi guardar série por usuário: foi mover a contagem para o
// aparelho (`trackDayClosed`) e mandar só o resultado fechado (`week_active`,
// dois inteiros de 0 a 7). Ver o bloco "A MÉTRICA-NORTE" mais abaixo.
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

/** Os eventos. É o MÍNIMO que arbitra as decisões do plano — nada além. */
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
  /** Viu a tela de compra — e por qual dos dois convites (`reason`). */
  | 'unlock_view'
  /** Comprou. */
  | 'purchase'
  /** Bateu no teto diário de criação do modo demo. É o DENOMINADOR da pergunta
   *  "o cap é a fronteira certa?": sem ele, `unlock_view` de `task-limit` é um
   *  numerador sem denominador, e nenhuma taxa é calculável. */
  | 'demo_cap_hit'
  /** Criou uma atividade (tarefa ou hábito), com o CAMINHO por onde criou.
   *  O caminho existe porque os caminhos de criação NÃO são equivalentes: um
   *  consulta o teto do demo e os outros não (ver `TELEMETRY_CREATE_PATH`). */
  | 'activity_create'
  /** A SEMANA fechada de um usuário ativo: quantos dias ele concluiu ≥1 item
   *  real e em quantos ele bateu o PRÓPRIO objetivo do dia. É a métrica-norte
   *  inteira, e é o único evento cuja unidade é a SEMANA. Ver `trackDayClosed`. */
  | 'week_active';

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
  onboarding_step: { step: { min: 0, max: 45 }, funnel: { min: 0, max: 2 } },
  demo_pick: null,
  first_task_done: { tier: { min: 0, max: 2 } },
  day_active: { effort: { min: 0, max: 500 }, tier: { min: 0, max: 2 } },
  unlock_view: { reason: { min: 0, max: 1 }, tier: { min: 0, max: 2 } },
  purchase: { tier: { min: 0, max: 2 } },
  demo_cap_hit: { path: { min: 0, max: 4 } },
  activity_create: { kind: { min: 0, max: 1 }, path: { min: 0, max: 4 }, tier: { min: 0, max: 2 } },
  week_active: {
    active_days: { min: 1, max: 7 },
    goal_days: { min: 0, max: 7 },
    tier: { min: 0, max: 2 },
  },
};

export const TELEMETRY_EVENTS = Object.keys(EVENT_SCHEMA) as TelemetryEvent[];

/**
 * Qual dos DOIS funis o passo pertence. Os dois usuários são opostos (demo
 * grátis de 4 telas × ritual pago de 8+ telas) e somá-los no mesmo contador
 * produz um número que não descreve nenhum dos dois — o `onboarding_step` sem
 * esta prop mede a média de duas populações que nunca se encontram.
 *
 * `unknown` existe porque a intro é ANTERIOR à bifurcação: forçar um rótulo
 * ali seria inventar o caminho de quem ainda não escolheu.
 */
export const TELEMETRY_FUNNEL = { unknown: 0, demo: 1, paid: 2 } as const;
export type TelemetryFunnel = typeof TELEMETRY_FUNNEL[keyof typeof TELEMETRY_FUNNEL];

/**
 * O TIER da conta no momento do evento. Códigos IGUAIS aos do funil de
 * propósito — é o mesmo eixo demo × pago, lido em dois momentos diferentes da
 * vida do usuário (o funil descreve por qual onboarding ele passou; o tier,
 * o que ele É agora, inclusive depois de converter). Duas escalas para o mesmo
 * eixo dariam dois vocabulários para um conceito só.
 *
 * `unknown` não é preguiça: existe janela real (boot, onboarding antes da
 * bifurcação) em que o app ainda não sabe o tier, e rotular isso de `demo`
 * seria inventar população. Um `unknown` visível no agregado é um defeito de
 * fiação que se ENXERGA; um `demo` inventado é um número errado que passa.
 */
export const TELEMETRY_TIER = { unknown: 0, demo: 1, paid: 2 } as const;
export type TelemetryTier = typeof TELEMETRY_TIER[keyof typeof TELEMETRY_TIER];

/**
 * Por qual dos DOIS convites a tela de compra foi aberta (`UnlockReason` de
 * `components/UnlockAccountModal.tsx`). Sem isto, o convite do teto de criação
 * e o convite da árvore de evolução caem no mesmo contador — exatamente o
 * defeito da média-de-duas-populações que o `funnel` já resolveu para o
 * `onboarding_step`. Só que aqui é pior: os dois convites testam HIPÓTESES
 * OPOSTAS sobre por que alguém paga.
 */
export const TELEMETRY_UNLOCK_REASON = { taskLimit: 0, evolution: 1 } as const;

/** Tarefa (item com prazo) × hábito (item recorrente). */
export const TELEMETRY_ACTIVITY_KIND = { task: 0, habit: 1 } as const;

/**
 * Por ONDE a atividade foi criada. Esta prop é a mais importante do
 * `activity_create`, e a razão é desconfortável: os caminhos NÃO se comportam
 * igual. Só `create_modal` consulta `canCreateDemoTaskToday()`; `home_edit`
 * (o botão principal da tela inicial), `ai_chat` e `tutorial` criam sem
 * consultar teto nenhum.
 *
 * Isso é um defeito conhecido e ele NÃO é consertado aqui — o conserto isolado
 * apertaria o modo grátis e está esperando decisão do dono. O que este código
 * faz é tornar o desvio CONTÁVEL: com estes rótulos, "quantas criações do demo
 * passaram por fora do teto" vira uma divisão, e a decisão para de depender de
 * quem leu o código por último.
 */
export const TELEMETRY_CREATE_PATH = {
  /** `CreateModal` — o ÚNICO que hoje consulta o teto do demo. */
  create_modal: 0,
  /** `EditModal` aberto pelo `+ adicionar` da tela inicial — não consulta. */
  home_edit: 1,
  /** Criação por sugestão da IA no chat — não consulta. */
  ai_chat: 2,
  /** Lote do tutorial — não consulta (provavelmente de propósito). */
  tutorial: 3,
  /** Criação durante o onboarding, antes de o jogo começar. */
  onboarding: 4,
} as const;

/**
 * Passos do onboarding são ids do componente e alguns são NEGATIVOS de
 * propósito (`DEMO_PICK`, `GOAL_STEP`, `STRUGGLE_STEP`, `CONSENT_STEP`,
 * `AGE_BLOCK` — ver `SoulmonOnboarding.tsx`), para telas novas não renumerarem
 * o ritual. A allowlist só aceita número não-negativo dentro de faixa, então o
 * id vira um CÓDIGO estável aqui, num lugar só: `-1 → 44 … -5 → 40`, acima do
 * maior passo positivo que existe (REGISTER = 35). Mapear em cada call site
 * seria regra copiada (footgun 9).
 */
export const NEGATIVE_STEP_BASE = 45;
export function onboardingStepCode(step: number): number | null {
  if (!Number.isFinite(step)) return null;
  const code = step < 0 ? NEGATIVE_STEP_BASE + step : step;
  return code >= 0 && code <= NEGATIVE_STEP_BASE ? code : null;
}

/** Props aceitas. Note que NÃO existe campo de texto livre — de propósito. */
export interface TelemetryProps {
  /** `onboarding_step`: índice da tela alcançada (já como código, ver
   *  `onboardingStepCode`). */
  step?: number;
  /** `onboarding_step`: qual funil (`TELEMETRY_FUNNEL`). Demo e pago NUNCA
   *  podem cair no mesmo contador. */
  funnel?: number;
  /** `day_active`: peso de esforço concluído no dia (hábito=1, tarefa=effort). */
  effort?: number;
  /** Tier da conta (`TELEMETRY_TIER`). **Não passe isto à mão** — `track`
   *  carimba sozinho a partir de `setTelemetryTier`. O campo existe aqui só
   *  para o `week_active` poder despachar o tier ARQUIVADO da semana fechada,
   *  que não é o de hoje. */
  tier?: number;
  /** `unlock_view`: qual convite (`TELEMETRY_UNLOCK_REASON`). */
  reason?: number;
  /** `activity_create`: tarefa ou hábito (`TELEMETRY_ACTIVITY_KIND`). */
  kind?: number;
  /** `activity_create` e `demo_cap_hit`: por onde (`TELEMETRY_CREATE_PATH`). */
  path?: number;
  /** `week_active`: dias com ≥1 item real concluído na semana fechada. */
  active_days?: number;
  /** `week_active`: dias, dentre os ativos, em que bateu o próprio objetivo. */
  goal_days?: number;
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
/** Tier ambiente (ver `setTelemetryTier`). Um número, nada mais. */
const K_TIER = 'soulmon-telemetry-tier';
/** Contagem da semana EM CURSO (ver `trackDayClosed`). Nunca sai daqui. */
const K_WEEK = 'soulmon-telemetry-week';

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
 * Chave da SEMANA ISO de um dia `YYYY-MM-DD`, no formato `YYYY-Www`.
 *
 * A métrica-norte é semanal ("concluiu ≥1 item real NA SEMANA", "≥4 dos 7
 * dias"), então precisa de uma fronteira de semana que não dependa de o
 * usuário ter aberto o app. ISO (segunda a domingo) e não "os últimos 7 dias":
 * janela deslizante faz a mesma pessoa ser contada em semanas sobrepostas, e
 * "4 de 7" deixa de ter denominador fixo.
 *
 * A chave NUNCA é enviada — ela só existe no aparelho, para saber quando a
 * semana virou. O que trafega é o `week_active` já fechado.
 */
export function isoWeekKey(day: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  // Algoritmo ISO-8601: anda até a QUINTA-feira da semana; o ano dela é o ano
  // ISO (é o que faz a virada de ano cair na semana certa em vez de criar uma
  // "semana 53" fantasma que quebraria a comparação de igualdade).
  const dayNum = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const isoYear = d.getUTCFullYear();
  const firstThursday = Date.UTC(isoYear, 0, 4);
  const ft = new Date(firstThursday);
  ft.setUTCDate(ft.getUTCDate() - ((ft.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((d.getTime() - ft.getTime()) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
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

  // Invariante ENTRE props — a faixa por campo não a alcança. Um `week_active`
  // com mais dias no objetivo do que dias ativos é aritmeticamente impossível,
  // e deixá-lo passar contaminaria justamente o numerador da métrica-norte.
  if (event === 'week_active' && out.goal_days > out.active_days) return null;

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
        'Contadores de momentos do app: primeira abertura, qual passo do onboarding você alcançou e por qual caminho (grátis ou completo), se escolheu um personagem pronto, sua primeira conclusão, se você abriu a tela de compra (e por qual convite), e se comprou.',
        'Se você está no modo grátis ou no completo — só isso, sem nada da sua conta.',
        'Quando você cria uma atividade: se foi tarefa ou hábito e por qual tela — nunca o que ela é.',
        'Se você bateu no limite diário de criação do modo grátis.',
        'Uma vez por dia, um sinal de "teve atividade hoje" com o PESO de esforço concluído (um número, como 4).',
        'Uma vez por semana, dois números de 0 a 7: em quantos dias você concluiu alguma coisa e em quantos alcançou a sua meta do dia. A contagem é feita aqui no aparelho; o que sai são só esses dois números.',
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
      'Counters for app moments: first launch, which onboarding step you reached and which path you took (free or full), whether you picked a ready-made character, your first completion, whether you opened the purchase screen (and which invite brought you there), and whether you purchased.',
      'Whether you are on the free or the full mode — that alone, nothing else from your account.',
      'When you create an activity: whether it was a task or a habit, and from which screen — never what it is.',
      'Whether you hit the free mode\'s daily creation limit.',
      'Once a day, a "there was activity today" signal with the effort WEIGHT you completed (a number, like 4).',
      'Once a week, two numbers from 0 to 7: on how many days you completed something, and on how many you reached your own daily goal. The counting happens here on your device; only those two numbers leave it.',
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
      // A contagem da semana também some. Ela nunca saiu do aparelho, mas
      // "desliguei e ele continuou contando meus dias" é uma frase que o opt-out
      // não pode deixar verdadeira.
      removeLocal(K_WEEK, { silent: true });
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

/**
 * Declara o TIER da conta. Chame uma vez, de um efeito sobre
 * `gameState.accountTier` — e em nenhum outro lugar.
 *
 * Por que ambiente e não prop de call site: o tier é a mesma resposta para
 * TODOS os eventos, vinda de uma fonte única (`gameState.accountTier`). Pedir
 * que cada `track` a repita é regra copiada (footgun 9) com a pior falha
 * possível: o dia em que um call site esquece, o evento não some — ele entra no
 * balde errado, e um número errado é pior que um número faltando, porque
 * ninguém percebe.
 *
 * `null` volta para `unknown`, que é o estado honesto antes de o app saber.
 */
export function setTelemetryTier(tier: 'demo' | 'paid' | null | undefined): void {
  try {
    const code = tier === 'demo' ? TELEMETRY_TIER.demo
      : tier === 'paid' ? TELEMETRY_TIER.paid
        : TELEMETRY_TIER.unknown;
    writeLocal(K_TIER, String(code), { silent: true });
  } catch {
    /* princípio 5 */
  }
}

/** O tier ambiente vigente. `unknown` quando ninguém declarou. */
export function telemetryTier(): number {
  const raw = Number(readLocal(K_TIER));
  return raw === TELEMETRY_TIER.demo || raw === TELEMETRY_TIER.paid ? raw : TELEMETRY_TIER.unknown;
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
 * O app está em SEGUNDO PLANO?
 *
 * Vive aqui, e não em cada call site, pelo mesmo motivo do dedupe: quatro
 * componentes checando `document.hidden` por conta própria é regra copiada
 * (footgun 9). O `CompanionHUD` já faz isso para a fala idle; evento disparado
 * com o app oculto é dado sujo (a virada do dia roda num timer de 30s que não
 * para quando a aba some) e bateria queimada por métrica.
 *
 * Ambiente sem `document` (Node, teste de servidor) NÃO é "oculto": lá não
 * existe segundo plano nenhum.
 */
export function isDocumentHidden(): boolean {
  try {
    const doc = (globalThis as { document?: Document }).document;
    return !!doc && doc.visibilityState === 'hidden';
  } catch {
    return false;
  }
}

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
export function track(event: TelemetryEvent, props?: TelemetryProps, day?: string): void {
  try {
    if (!isTelemetryEnabled()) return;
    // Segundo plano não gera evento (ver `isDocumentHidden`). O `flush` de
    // saída continua valendo — o que está na fila foi enfileirado com o app
    // à vista.
    if (isDocumentHidden()) return;

    // Carimbo do tier: aqui, um lugar só, e no ENFILEIRAMENTO — não no envio.
    // A diferença importa: quem compra dispara `purchase` e converte no mesmo
    // segundo; carimbar no flush marcaria a compra como vinda de um pagante,
    // e a taxa de conversão do demo iria a zero por construção.
    const schema = EVENT_SCHEMA[event];
    const withTier = schema && 'tier' in schema && (!props || props.tier === undefined)
      ? { ...props, tier: telemetryTier() }
      : props;

    const record = sanitizeEvent(event, withTier as Record<string, unknown> | undefined, day ?? telemetryDayKey());
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

// ---------------------------------------------------------------------------
// A MÉTRICA-NORTE — e por que ela é fechada NO APARELHO
//
// A métrica aprovada tem duas metades, e as DUAS são por PESSOA e por SEMANA:
//   · ATIVO = concluiu ≥1 item real (tarefa ou hábito) na semana;
//   · ALVO  = o ativo atinge o PRÓPRIO `dailyGoalFor` em ≥4 dos 7 dias.
//
// Nenhuma das duas sai do agregado de hoje, e não é por falta de contador: é
// por forma do dado. `m:YYYY-MM-DD` guarda somas do DIA sobre TODO MUNDO, sem
// identidade. "≥1 na semana" exige saber se o Fulano de terça é o mesmo de
// sexta; "≥4 de 7" exige comparar cada dia com o objetivo DAQUELA pessoa (que
// muda com o estágio e com o que ela cadastrou). Ler isso no servidor exigiria
// guardar uma série por usuário — que é exatamente o que os princípios 1, 3 e 6
// proíbem, e com razão.
//
// A saída não é afrouxar a privacidade: é mover a CONTAGEM para o único lugar
// que já conhece a própria história sem precisar guardá-la em lugar nenhum — o
// aparelho. O ledger abaixo vive no localStorage, nunca é enviado, e o que
// trafega é um `week_active` com dois inteiros de 0 a 7. O servidor ganha o
// histograma inteiro sem ganhar uma linha do tempo de ninguém.
//
// LIMITE, declarado em vez de escondido: a semana W só é despachada no primeiro
// fechamento de dia da semana W+1. Quem abandona o app nunca despacha a última
// semana, então o histograma é levemente enviesado a favor de quem ficou. Isso
// é aceitável para "o ativo médio bate o objetivo?" e seria inaceitável para
// retenção — e retenção continua ilegível por outra razão (ver G-3 no relato).
// ---------------------------------------------------------------------------

/** A semana EM CURSO, no aparelho. `d` são os dias ATIVOS já contados. */
interface WeekLedger {
  /** Chave ISO da semana (`isoWeekKey`). */
  w: string;
  /** Dias ativos da semana, sem repetição. */
  d: string[];
  /** Quantos desses dias bateram o próprio objetivo. */
  g: number;
  /** Tier vigente DURANTE a semana. Arquivado aqui porque quem converte na
   *  quarta não deve reetiquetar como "pago" a semana que viveu como demo. */
  t: number;
}

function readWeekLedger(): WeekLedger | null {
  const raw = readJson<WeekLedger | null>(K_WEEK, null);
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.w !== 'string' || !Array.isArray(raw.d)) return null;
  return { w: raw.w, d: raw.d.filter(x => typeof x === 'string'), g: Number(raw.g) || 0, t: Number(raw.t) || 0 };
}

/** Despacha uma semana FECHADA, se ela teve ao menos um dia ativo. */
function flushWeekLedger(ledger: WeekLedger | null): void {
  if (!ledger || ledger.d.length === 0) return; // semana sem atividade não é ativo
  const active = Math.min(ledger.d.length, 7);
  const goal = Math.min(ledger.g, active);
  // Datado no ÚLTIMO dia ativo da semana que fechou, e não em "hoje": o
  // agregado é por dia, e jogar a semana passada no balde de hoje deslocaria o
  // histórico. O servidor recusa defasagem acima de `MAX_DAY_SKEW_DAYS` — quem
  // some por um mês perde essa semana, e perder é melhor que datar errado.
  const last = [...ledger.d].sort().pop();
  track('week_active', { active_days: active, goal_days: goal, tier: ledger.t }, last);
}

/**
 * O fechamento de UM dia. É o único ponto de fiação da métrica-norte: chame na
 * virada do dia, com o relatório já fechado (`lastDayReport`).
 *
 * Faz duas coisas de uma vez de propósito — `day_active` e a contagem da semana
 * nascem do MESMO fato ("o dia X fechou com esforço E e a meta era M"). Dois
 * pontos de fiação para um fato só é como se chega a um `day_active` que existe
 * e a uma semana que não fecha.
 *
 * @param day     dia fechado, `YYYY-MM-DD` (nunca "hoje": é o dia que virou).
 * @param effort  peso de esforço concluído. `0` = dia NÃO ativo.
 * @param goalMet o esforço alcançou o `dailyGoalFor` DAQUELA pessoa naquele dia.
 */
export function trackDayClosed({ day, effort, goalMet }: {
  day: string; effort: number; goalMet: boolean;
}): void {
  try {
    const week = isoWeekKey(day);
    if (!week) return;
    const active = Number.isFinite(effort) && effort > 0;

    let ledger = readWeekLedger();
    if (!ledger || ledger.w !== week) {
      // A semana virou: despacha a anterior ANTES de abrir a nova. Um dia
      // atrasado de duas semanas atrás também cai aqui e fecha o que havia —
      // o que é o comportamento certo, porque a semana antiga já acabou.
      flushWeekLedger(ledger);
      ledger = { w: week, d: [], g: 0, t: telemetryTier() };
    }

    if (active) {
      // `day_active` primeiro: ele é o evento DIÁRIO e tem dedupe próprio.
      track('day_active', { effort }, day);
      if (!ledger.d.includes(day)) {
        ledger.d.push(day);
        if (goalMet) ledger.g += 1;
      }
      // O tier da semana é o do PRIMEIRO dia ativo dela — quem converteu no
      // meio ainda viveu a semana como demo até ali.
      if (ledger.d.length === 1) ledger.t = telemetryTier();
    }
    writeJson(K_WEEK, ledger, { silent: true });
  } catch {
    /* princípio 5 */
  }
}

/** Só para teste/depuração — a semana em curso, que NUNCA é enviada. */
export function pendingWeekLedger(): WeekLedger | null {
  return readWeekLedger();
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
  removeLocal(K_TIER, { silent: true });
  removeLocal(K_WEEK, { silent: true });
  if (flushTimer !== null) {
    try { clearTimeout(flushTimer); } catch { /* idem */ }
    flushTimer = null;
  }
}

/** Só para teste/depuração — o que está esperando para ser enviado. */
export function pendingTelemetry(): TelemetryRecord[] {
  return readQueue();
}
