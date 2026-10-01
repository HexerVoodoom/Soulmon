// ---------------------------------------------------------------------------
// TELEMETRIA — recebe lotes de eventos e grava AGREGADOS DIÁRIOS na KV.
//
// Par servidor de `src/utils/telemetry.ts`. Leia os princípios lá; eles valem
// aqui com a mesma força, e três deles são responsabilidade DESTE arquivo:
//
//  1. AGREGADOS, NUNCA CONTEÚDO — e nunca a série individual. O que existe na
//     KV é uma chave por DIA (`m:YYYY-MM-DD`) com contadores somados de todo
//     mundo. Não há chave por usuário, não há lista de eventos, não há nada de
//     onde reconstruir o comportamento de uma pessoa. Isso não é uma política
//     de retenção que alguém precisa lembrar de aplicar: é a forma do dado.
//  3. PSEUDÔNIMO, NUNCA IDENTIDADE — `batch.id` é validado (formato) e
//     DESCARTADO. Ele nunca entra numa chave, num valor, nem num `console.log`.
//     O `saveId` (SHA-256 do e-mail) não aparece em lugar nenhum deste arquivo,
//     e é isso que impede religar métrica a conta.
//  5. FALHA SILENCIOSA — o cliente ignora a resposta. Ainda assim respondemos
//     com status honesto (400 em corpo malformado) porque é o que torna o
//     endpoint testável; o cliente é quem escolhe não olhar.
//  6. SEM PII DERIVÁVEL — a maior resolução aceita é o DIA, e um dia fora da
//     janela de `MAX_DAY_SKEW_DAYS` é descartado. Sem isso, um cliente com
//     relógio errado (ou alguém brincando) cria chaves arbitrárias no
//     namespace e polui o agregado que deveria arbitrar decisões de produto.
//
// O QUE ESTE AGREGADO NÃO CONSEGUE RESPONDER — e não é bug, é o desenho.
//
// A chave é `m:<dia do EVENTO>`. Não existe dia de INSTALAÇÃO em lugar nenhum,
// e portanto não existe coorte. Isso torna impossível — não difícil, impossível
// — calcular, a partir daqui:
//
//   · **retenção / sobrevivência D1, D7, D30**. Exige saber que a pessoa ativa
//     hoje é a mesma que instalou há 7 dias. O agregado só sabe "houve 40
//     `day_active` hoje" e "houve 60 `install` naquele dia"; a interseção dos
//     dois conjuntos não está guardada em lugar nenhum.
//   · **conversão em N dias** ("quantos dos que instalaram em agosto compraram
//     em até 14 dias"). Mesma razão: o `purchase` de hoje não carrega quando
//     aquela pessoa chegou.
//   · **qualquer razão numerador/denominador entre DIAS DIFERENTES sobre as
//     MESMAS pessoas.** `purchase / install` no mesmo dia é uma razão entre
//     dois grupos que não são o mesmo grupo, e ler isso como "taxa de
//     conversão" é o erro mais fácil de cometer com este JSON.
//   · **frequência por pessoa** ("quantos dias por semana o usuário médio
//     abre"). O `week_active` responde a versão SEMANAL disso porque a
//     contagem é fechada no aparelho; a versão mensal ou trimestral não.
//
// O que É legível: tudo que é uma contagem do dia, o funil por passo e por
// caminho, o esforço por tier, os dois convites de compra, os caminhos de
// criação, e a métrica-norte inteira (via `week_active`, fechado no cliente).
//
// Fechar essa lacuna exigiria carimbar o dia (ou a semana) de INSTALAÇÃO em
// cada evento — e isso reabre a discussão de privacidade que os princípios 1, 3
// e 6 já decidiram: um evento que carrega "instalei na semana X" é um passo
// concreto na direção de religar eventos à mesma pessoa. **É um trade-off do
// dono, não uma decisão de implementação, e ninguém deve implementá-lo por cima
// deste desenho sem que ele reabra o assunto.** Até lá, retenção fica ilegível,
// e este comentário existe para que isso seja uma escolha declarada em vez de
// uma surpresa para quem for ler o painel.
//
// ALLOWLIST, NUNCA DENYLIST. `EVENT_SCHEMA` enumera os eventos e, por evento,
// exatamente quais props existem e em que faixa. Qualquer coisa fora disso
// derruba o EVENTO inteiro (não "limpa o campo"): denylist esquece o campo que
// ninguém previu, que é justamente o campo pelo qual um texto de usuário
// entraria aqui.
//
// BINDING: reusa a KV de saves (`kv(env)`), com prefixo `m:` — de propósito. O aviso do
// CLAUDE.md é que `wrangler deploy` remove binding não declarado; pedir um
// namespace novo transformaria "instrumentar o funil" num risco de deploy.
// Prefixo próprio no namespace que já existe custa zero e não colide com
// `ent:`/`ord:` (`_entitlements.js`) nem com o saveId cru (32–64 hex).
//
// FRONTEIRA: `EVENT_SCHEMA` está DUPLICADO em `src/utils/telemetry.ts` —
// Pages Functions não importam de `src/`. Há teste de PARIDADE travando as duas
// cópias (footgun 9: regra copiada é regra que diverge em silêncio).
// ---------------------------------------------------------------------------

import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { kv, kvOrThrow } from './_kv.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Metrics-Key',
};

/** Prefixo da chave de agregado diário. Ver "BINDING" acima. */
export const METRICS_PREFIX = 'm:';

/**
 * Espelho do `EVENT_SCHEMA` do cliente. `null` = evento sem props.
 * Ver o teste de paridade antes de mexer em qualquer linha daqui.
 */
export const EVENT_SCHEMA = {
  install: null,
  onboarding_step: { step: { min: 0, max: 50 }, funnel: { min: 0, max: 2 } },
  demo_pick: null,
  first_task_done: { tier: { min: 0, max: 2 } },
  day_active: { effort: { min: 0, max: 500 }, tier: { min: 0, max: 2 } },
  unlock_view: { reason: { min: 0, max: 4 }, tier: { min: 0, max: 2 } },
  // WP0.9 — espelho de `src/utils/telemetry.ts` (há teste de paridade).
  purchase: { tier: { min: 0, max: 2 }, reason: { min: 0, max: 4 } },
  demo_cap_hit: { path: { min: 0, max: 4 } },
  activity_create: { kind: { min: 0, max: 1 }, path: { min: 0, max: 4 }, tier: { min: 0, max: 2 } },
  week_active: {
    active_days: { min: 1, max: 7 },
    goal_days: { min: 0, max: 7 },
    tier: { min: 0, max: 2 },
  },
  // Rodada 2/3 do PLANO-MELHORIAS (WP0.5). ESPELHO de src/utils/telemetry.ts —
  // o teste de paridade em telemetry.test.ts cai se os dois divergirem.
  reveal_seen: { has_sprite: { min: 0, max: 1 }, funnel: { min: 0, max: 2 }, duration: { min: 0, max: 3 } },
  checkin_commit: { focus_count: { min: 0, max: 3 } },
  unlock_dismiss: { reason: { min: 0, max: 4 } },
  haunted_done: null,
  checkin_shown: null,
  milestone: { level: { min: 1, max: 3 } },
  shield_used: null,
  welcome_back: { days: { min: 0, max: 3 } },
  evolve: { level: { min: 1, max: 4 } },
  dungeon_run: { floors: { min: 1, max: 5 } },
  bond_level: { level: { min: 1, max: 30 } },
  after_bad_day: { gap: { min: 0, max: 3 }, kind: { min: 0, max: 1 } },
  app_open: { source: { min: 0, max: 4 } }, // 4 = invite (?src=convite, E0 — 22/09/2026)
  push_optout: null,
  retained: { bucket: { min: 0, max: 2 }, tier: { min: 0, max: 2 } },
  // som-01 (SQUAD-SOM) — ESPELHO de src/utils/telemetry.ts. Sem `tier` de
  // propósito: a decisão do eixo sonoro não se parte por demo/pago.
  // `sound_state` é a fotografia diária (o cliente se cala quando não consegue
  // ler a preferência: evento faltando é honesto, evento no balde errado não);
  // `sound_off` é a transição por gesto, com `age` em FAIXA e nunca data.
  sound_state: { muted: { min: 0, max: 1 }, music: { min: 0, max: 1 } },
  sound_off: { age: { min: 0, max: 2 } },
  // Guilda (WPG-7, `PLANO-GUILDA.md` §10.8) — ESPELHO de src/utils/telemetry.ts.
  // Sem id de guilda, sem pid, sem saveId: só inteiros em faixa. `size` é o
  // tamanho da roda (nunca quem), `weeks` a FAIXA de permanência (0..3),
  // `kind` 0 = fio (1 reservado à semente, G3), `outcome` 0 = rodada, 1 =
  // dissipada vista, 2 = recuou vista, `level` o estágio do Bosque visto.
  guild_create: null,
  guild_join: { size: { min: 2, max: 12 } },
  guild_leave: { size: { min: 0, max: 11 }, weeks: { min: 0, max: 3 } },
  guild_thread: { kind: { min: 0, max: 1 } },
  guild_raid: { outcome: { min: 0, max: 2 } },
  guild_stage: { level: { min: 1, max: 5 } },
};

/**
 * Teto do corpo. Um lote cheio (100 eventos) dá ~4 KB; 16 KB é folga larga e
 * ainda 300× menor que o teto do save. O motivo é o mesmo do `MAX_STATE_BYTES`
 * de `save.js`: sem teto, um cliente com bug enche o namespace de graça.
 */
export const MAX_BODY_BYTES = 16 * 1024;

/** Eventos por lote. Casa com o `MAX_BATCH` do cliente. */
export const MAX_EVENTS = 100;

/**
 * Quantos dias de defasagem um evento pode ter. Existe porque a fila do cliente
 * sobrevive entre sessões: quem ficou offline uma semana ainda tem evento
 * legítimo de sete dias atrás. Além disso, o dia do cliente é LOCAL, então
 * ±1 já seria necessário só por fuso.
 */
export const MAX_DAY_SKEW_DAYS = 7;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[0-9a-f]{32}$/;

/** Teto por IP. Amortecedor de CUSTO (ver `_rateLimit.js`), não segurança. */
const RATE = { limit: 60, windowMs: 60_000 };

// ---------------------------------------------------------------------------
// Funções puras — o que os testes travam
// ---------------------------------------------------------------------------

/** Dia UTC do servidor em `YYYY-MM-DD`. */
export function serverDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Distância em dias entre dois `YYYY-MM-DD`. `NaN` se algum não for data. */
export function dayDistance(a, b) {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return NaN;
  return Math.abs(ta - tb) / 86400000;
}

/**
 * Valida um evento contra a allowlist.
 * @returns o registro saneado, ou `null` se qualquer coisa não bater.
 */
export function sanitizeRecord(record, today) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;

  const event = record.e;
  if (typeof event !== 'string') return null;
  // `Object.prototype.hasOwnProperty` e não `EVENT_SCHEMA[event]`: sem isso,
  // `e: "constructor"` acha um valor no protótipo e passa pela allowlist.
  if (!Object.prototype.hasOwnProperty.call(EVENT_SCHEMA, event)) return null;
  const schema = EVENT_SCHEMA[event];

  const day = record.d;
  if (typeof day !== 'string' || !DAY_RE.test(day)) return null;
  const skew = dayDistance(day, today);
  if (!Number.isFinite(skew) || skew > MAX_DAY_SKEW_DAYS) return null;

  // Campo desconhecido no PRÓPRIO registro (não só nas props) também derruba:
  // é por um campo extra a mais que um `taskName` chegaria aqui.
  for (const key of Object.keys(record)) {
    if (key !== 'e' && key !== 'd' && key !== 'p') return null;
  }

  const props = record.p;
  if (!schema) {
    if (props !== undefined) return null;
    return { e: event, d: day };
  }
  if (!props || typeof props !== 'object' || Array.isArray(props)) return null;

  const out = {};
  for (const key of Object.keys(props)) {
    // M4 (L2-backend): `hasOwnProperty`, como no nome do evento — sem isso,
    // `constructor`/`toString` acham uma função no protótipo e passam.
    if (!Object.prototype.hasOwnProperty.call(schema, key)) return null;
    const rule = schema[key];
    if (!rule || typeof rule !== 'object') return null;
    const raw = props[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
    const n = Math.round(raw);
    if (n < rule.min || n > rule.max) return null;
    out[key] = n;
  }
  for (const key of Object.keys(schema)) if (!(key in out)) return null;

  return { e: event, d: day, p: out };
}

/**
 * Valida o lote inteiro.
 * @returns {{ ok: true, events: Array<{ e: string, d: string, p?: object }> }
 *         | { ok: false, reason: string }} `events` já agrupados por dia.
 */
export function sanitizeBatch(body, today = serverDay()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, reason: 'body' };
  }
  if (body.v !== 1) return { ok: false, reason: 'version' };
  // O pseudônimo é validado e JOGADO FORA aqui mesmo. Ele não é lido de novo em
  // nenhum ponto abaixo desta linha — essa é a garantia inteira do princípio 3.
  if (typeof body.id !== 'string' || !ID_RE.test(body.id)) {
    return { ok: false, reason: 'id' };
  }
  if (!Array.isArray(body.events)) return { ok: false, reason: 'events' };
  if (body.events.length === 0 || body.events.length > MAX_EVENTS) {
    return { ok: false, reason: 'events' };
  }
  for (const key of Object.keys(body)) {
    if (key !== 'v' && key !== 'id' && key !== 'events') return { ok: false, reason: 'body' };
  }

  // Evento ruim NÃO derruba o lote: um cliente antigo mandando um evento que
  // não existe mais faria perder também os eventos bons que vieram junto.
  const events = [];
  for (const record of body.events) {
    const clean = sanitizeRecord(record, today);
    if (clean) events.push(clean);
  }
  return { ok: true, events };
}

/**
 * Rótulo do funil no agregado. Espelha `TELEMETRY_FUNNEL` de
 * `src/utils/telemetry.ts` (0 unknown / 1 demo / 2 paid). Sai como TEXTO na
 * chave porque quem vai ler o agregado é uma pessoa, e `onboarding_step.2.7`
 * não diz de qual dos dois usuários opostos aquele 7 é.
 */
const FUNNEL_LABEL = ['unknown', 'demo', 'paid'];

/**
 * Rótulo do TIER. Mesma razão do funil: quem vai ler `m:2026-08-24` é uma
 * pessoa, e `purchase.1` não diz se aquele 1 é de quem estava no grátis.
 * Espelha `TELEMETRY_TIER` de `src/utils/telemetry.ts`.
 */
const TIER_LABEL = ['unknown', 'demo', 'paid'];

/**
 * O balde de esforço de um dia (WP0.8). Faixas largas de propósito: o objetivo
 * é a FORMA da distribuição, não o valor exato — e faixa larga é também o que
 * impede o histograma de virar quase-identificador para quem tem um dia atípico.
 *
 *   0 → 1–2 · 1 → 3–4 · 2 → 5–6 · 3 → 7–9 · 4 → 10 ou mais
 */
export function effortBucket(effort) {
  const e = typeof effort === 'number' && Number.isFinite(effort) ? effort : 0;
  if (e <= 2) return 0;
  if (e <= 4) return 1;
  if (e <= 6) return 2;
  if (e <= 9) return 3;
  return 4;
}

/** Espelha `TELEMETRY_UNLOCK_REASON` — qual convite abriu a compra. Eram dois
 *  rótulos para um schema que já aceitava 0–3: `report` e `shop` caíam em
 *  `unknown` sem erro nenhum. */
/* `reveal_demo` (4) = o convite do reveal demo (13.19) — e a compra que sai
   dele é a do onboarding, por isso o 4 da compra continua `onboarding`. */
const REASON_LABEL = ['task_limit', 'evolution', 'report', 'shop', 'reveal_demo'];
/* WP0.9 — a compra usa os MESMOS rótulos do convite (por isso é o mesmo array
   mais o `onboarding`), para convite e compra serem comparáveis balde a balde. */
const PURCHASE_REASON_LABEL = [...REASON_LABEL.slice(0, 4), 'onboarding'];

/** Espelha `TELEMETRY_CREATE_PATH`. Os caminhos NÃO são equivalentes: só
 *  `create_modal` consulta o teto do modo demo. Ver o comentário lá. */
const PATH_LABEL = ['create_modal', 'home_edit', 'ai_chat', 'tutorial', 'onboarding'];

/** Espelha `TELEMETRY_ACTIVITY_KIND`. */
const KIND_LABEL = ['task', 'habit'];

/* WP0.2 — os marcos de retenção, na ORDEM de `RETENTION_MARKS`. */
const RETENTION_LABEL = ['d1', 'd7', 'd30'];
/* WP0.11 — de onde a abertura veio. */
const OPEN_SOURCE_LABEL = ['direct', 'push', 'widget', 'shortcut', 'invite'];
/* Faixas de dias fora (`welcome_back`) e de dias até voltar depois de um dia
   ruim (`after_bad_day`). */
const BUCKET_LABEL = ['0', '1', '2', '3'];

/** Prefixo do histograma da métrica-norte dentro do agregado. */
export const WEEK_GOAL_PREFIX = 'week_active';

/**
 * O ALVO v1 da métrica-norte: o ativo bate o PRÓPRIO objetivo em ≥4 dos 7 dias.
 * O número mora aqui porque é ele que a leitura usa para dizer "no alvo" — e
 * mudá-lo é uma decisão de produto que tem que aparecer num diff.
 */
export const NORTH_STAR_GOAL_DAYS = 4;

/**
 * Soma eventos num agregado do dia. PURA — recebe e devolve o objeto contado.
 *
 * Formato (tudo número, tudo somado sobre todos os usuários):
 *   `install`, `demo_pick`, `first_task_done`, `unlock_view`, `purchase`,
 *   `day_active`               → contagem de eventos
 *   `onboarding_step.<funil>.<n>` → quantos chegaram ao passo n em CADA funil
 *                                (demo/paid/unknown) — o drop-off por caminho
 *   `effort_sum`               → soma do peso de esforço do dia
 *
 * O north star sai daqui: `effort_sum / day_active` = peso de esforço real
 * concluído por usuário ativo. Nada mais é preciso guardar para lê-lo.
 */
export function applyAggregate(agg, events) {
  const out = { ...(agg && typeof agg === 'object' && !Array.isArray(agg) ? agg : {}) };
  const bump = (key, by = 1) => {
    const cur = typeof out[key] === 'number' && Number.isFinite(out[key]) ? out[key] : 0;
    out[key] = cur + by;
  };
  for (const record of events) {
    bump(record.e);
    const p = record.p;
    // Chave SEMPRE com o funil. Sem ele, o passo 7 do demo e o passo 7 do
    // ritual pago viravam o mesmo número — a média de duas populações que nunca
    // se encontram, que é o mesmo que não medir.
    if (record.e === 'onboarding_step') {
      const funnel = FUNNEL_LABEL[p.funnel] ?? 'unknown';
      bump(`onboarding_step.${funnel}.${p.step}`);
    }

    // O TIER, para todo evento que o carrega. Regra genérica de propósito: um
    // `if` por evento seria a mesma regra escrita seis vezes, e o sétimo evento
    // seria o que alguém esquece. O total sem sufixo continua existindo — quem
    // quiser o número agregado não precisa somar os três baldes.
    const tier = p && typeof p.tier === 'number' ? (TIER_LABEL[p.tier] ?? 'unknown') : null;
    if (tier) bump(`${record.e}.${tier}`);

    if (record.e === 'day_active') {
      bump('effort_sum', p.effort);
      // Esforço por tier: sem isto, "o pagante se esforça mais?" só se responde
      // com a média das duas populações — o defeito que o funil já corrigiu.
      if (tier) bump(`effort_sum.${tier}`, p.effort);

      /* WP0.8 — O HISTOGRAMA, porque a soma sozinha só produz MÉDIA.
         `effort_sum / day_active` era a métrica-farol do produto, e média de
         distribuição com cauda descreve ninguém: nove pessoas com esforço 1 e
         uma com 100 dão "10,9", um número que nenhuma delas viveu. A fonte
         primária de analytics do corpus estudado (Greer, GDC) proíbe isso
         nominalmente, e o leitor (`tools/metricsReport.mjs`) já avisava que a
         mediana dependia deste balde.
         Derivado NO SERVIDOR a partir do `effort` que já chega: nenhum dado
         novo sai do aparelho, nenhum evento novo, nada a declarar na política. */
      bump(`effort_bucket.${effortBucket(p.effort)}`);
      if (tier) bump(`effort_bucket.${tier}.${effortBucket(p.effort)}`);
    }

    // Os dois convites de compra contam separado. Eles testam hipóteses
    // OPOSTAS (bati num teto × quero a criatura que é minha) e somá-los produz
    // um número que não descreve nenhuma das duas.
    if (record.e === 'unlock_view') {
      bump(`unlock_view.${REASON_LABEL[p.reason] ?? 'unknown'}`);
    }
    // WP5.5: a saída declarada, pelo mesmo motivo. `dismiss / view` por convite
    // é a taxa que diz se a oferta chegou cedo demais.
    if (record.e === 'unlock_dismiss') {
      bump(`unlock_dismiss.${REASON_LABEL[p.reason] ?? 'unknown'}`);
    }

    /* ─────────────────────────────────────────────────────────────────────
       AS PROPRIEDADES QUE O AGREGADO JOGAVA FORA.

       ⚠️ Até 06/09/2026, nove eventos mandavam propriedade e ela morria aqui:
       o `bump(record.e)` do topo contava o evento e mais nada. Isso não era
       economia de espaço, era **custo de privacidade sem retorno** — a
       propriedade saía do aparelho, era declarada na política em PT e EN, e
       não virava contador nenhum.

       O caso mais caro é o `retained`: o WP0.2 está VERIFICADO e a retenção
       D1/D7/D30 continuava ILEGÍVEL, porque os três marcos colapsavam num
       contador único. "Quantos chegaram a D7" não era calculável nem com a
       chave da rota. O `app_open.source` é o segundo: o WP0.11 declara existir
       "para UMA decisão — cortar push que abre o app e não vira `day_active`",
       e sem a origem, push e abertura direta eram o mesmo número.

       Nada muda no cliente: são baldes derivados do que já chega. ───────── */
    if (record.e === 'retained' && p) {
      bump(`retained.${RETENTION_LABEL[p.bucket] ?? 'unknown'}`);
      if (tier) bump(`retained.${tier}.${RETENTION_LABEL[p.bucket] ?? 'unknown'}`);
    }
    if (record.e === 'app_open' && p) {
      bump(`app_open.${OPEN_SOURCE_LABEL[p.source] ?? 'unknown'}`);
    }
    if (record.e === 'welcome_back' && p) {
      bump(`welcome_back.${BUCKET_LABEL[p.days] ?? 'unknown'}`);
    }
    if (record.e === 'after_bad_day' && p) {
      bump(`after_bad_day.${BUCKET_LABEL[p.gap] ?? 'unknown'}`);
    }
    /* O reveal, que é o número que decide o WP1.1: o casulo está entregando a
       criatura a tempo, ou o reveal ainda é texto para a maioria? Por funil,
       porque o demo e o ritual pago são populações que nunca se encontram. */
    if (record.e === 'reveal_seen' && p) {
      const funnel = FUNNEL_LABEL[p.funnel] ?? 'unknown';
      bump(`reveal_seen.${funnel}.sprite_${p.has_sprite ? 'yes' : 'no'}`);
      bump(`reveal_seen.duration.${p.duration}`);
    }
    if (record.e === 'checkin_commit' && p) {
      bump(`checkin_commit.focus_${p.focus_count}`);
    }
    if (record.e === 'dungeon_run' && p) {
      bump(`dungeon_run.floors_${p.floors}`);
    }
    if (record.e === 'evolve' && p) {
      bump(`evolve.level_${p.level}`);
    }
    if (record.e === 'bond_level' && p) {
      bump(`bond_level.level_${p.level}`);
    }
    /* ⚠️ `milestone` usa `level`, NÃO `tier` — e a razão é um bug que quase
       aconteceu. Enquanto a propriedade se chamava `tier`, ela era capturada
       pela regra genérica de TIER DE CONTA logo acima: um hábito que cruzou 7
       dias virava `milestone.demo` e o de 66 dias virava `milestone.unknown`.
       Inofensivo enquanto ninguém emite o evento; venenoso no dia em que o
       WP2.4 ligar o emissor, e aí o dado errado já estaria no KV com TTL de
       730 dias. `level` é o nome que `evolve` e `bond_level` já usam. */
    if (record.e === 'milestone' && p) {
      bump(`milestone.days_${p.level}`);
    }
    // Guilda (WPG-7): uma faixa por prop, nunca identidade.
    if (record.e.startsWith('guild_') && p) {
      // Itera o SCHEMA, nunca as props: chave fora da allowlist não vira contador.
      const regra = EVENT_SCHEMA[record.e] || {};
      for (const k of Object.keys(regra)) if (Object.prototype.hasOwnProperty.call(p, k)) bump(`${record.e}.${k}_${p[k]}`);
    }

    /* A compra POR ORIGEM. Sem isto, todas as compras eram um número só —
       exatamente o que o WP0.9 existe para desfazer — e a taxa
       `purchase / unlock_view` por convite, que é a única forma de saber qual
       convite converte, não era calculável. */
    if (record.e === 'purchase' && p) {
      bump(`purchase.${PURCHASE_REASON_LABEL[p.reason] ?? 'unknown'}`);
    }

    if (record.e === 'demo_cap_hit') {
      bump(`demo_cap_hit.${PATH_LABEL[p.path] ?? 'unknown'}`);
    }

    // Caminho × tipo. O caminho é o que torna CONTÁVEL quantas criações do modo
    // demo passaram por fora do teto — o defeito conhecido que este arquivo
    // instrumenta e não conserta (o conserto é decisão do dono).
    if (record.e === 'activity_create') {
      const path = PATH_LABEL[p.path] ?? 'unknown';
      bump(`activity_create.${path}.${KIND_LABEL[p.kind] ?? 'unknown'}`);
    }

    // A MÉTRICA-NORTE. O cliente já fechou a semana dele (ver `trackDayClosed`
    // em `src/utils/telemetry.ts`); aqui ela vira HISTOGRAMA. Guardar o
    // histograma inteiro, e não só "bateu/não bateu", é o que permite mudar o
    // alvo (hoje ≥4 de 7) sem reinstrumentar nada nem perder o histórico.
    /* som-01 — os baldes do eixo sonoro. Derivados aqui e não no cliente, como
       todo o resto: nenhum dado novo sai do aparelho.
       ⚠️ REGRA DE USO, e não de coleta: estes contadores existem para DETECTAR
       DANO (o som está afastando o perfil "em público"? a trilha é código morto
       e bytes imortais no repo?). Eles NUNCA podem alimentar pontuação, voltar
       para o usuário como número, nem virar gatilho de reengajamento — um push
       do tipo "notamos que você desligou o som" é o app cobrando por uma
       escolha da pessoa, e é o uso que o produto proíbe por escrito
       (`squad-alpha-runs/som-01/discovery/metrica-de-som.md` §5, guardrail G6). */
    if (record.e === 'sound_state' && p) {
      bump(`sound_state.muted_${p.muted ? 'yes' : 'no'}`);
      bump(`sound_state.music_${p.music ? 'yes' : 'no'}`);
    }
    if (record.e === 'sound_off' && p) {
      bump(`sound_off.age_${p.age}`);
    }

    if (record.e === 'week_active') {
      bump(`week_active.goal_days.${p.goal_days}`);
      if (tier) bump(`week_active.${tier}.goal_days.${p.goal_days}`);
      // `active_days` saía do aparelho (declarado na política: "em quantos
      // dias você concluiu alguma coisa"), passava pelo `EVENT_SCHEMA` e
      // MORRIA aqui — custo de privacidade sem retorno, o defeito que o
      // cabeçalho deste arquivo condena. É a leitura honesta da hipótese de
      // HÁBITO de E0 ("ativo em ≥2 de 4 dias"): `goal_days` mede meta batida,
      // `active_days` mede presença. QA rodada 1, review 07 §1.4.
      if (Number.isInteger(p.active_days)) {
        bump(`week_active.active_days.${p.active_days}`);
        if (tier) bump(`week_active.${tier}.active_days.${p.active_days}`);
      }
    }
  }
  return out;
}

/**
 * Lê a MÉTRICA-NORTE de um agregado (ou da soma de vários dias).
 *
 * Responde exatamente as duas metades aprovadas:
 *   · `weekly_active` — quantas SEMANAS-usuário tiveram ≥1 item real concluído.
 *     É o denominador, e é a definição de "ativo" do plano.
 *   · `on_target`     — dessas, quantas bateram o PRÓPRIO objetivo do dia em
 *     ≥`NORTH_STAR_GOAL_DAYS` dos 7 dias.
 *
 * `rate` é `null` — nunca `0` — quando não há ativo nenhum. Zero sobre zero
 * exibido como "0%" é o jeito mais rápido de alguém decidir a partir de um
 * número que não existe, e este arquivo inteiro existe para o contrário disso.
 *
 * @param {Record<string, number>} totals agregado (ou soma de agregados).
 */
export function summarizeNorthStar(totals) {
  const t = totals && typeof totals === 'object' ? totals : {};
  const num = (k) => (typeof t[k] === 'number' && Number.isFinite(t[k]) ? t[k] : 0);

  const read = (prefix) => {
    const active = num(prefix);
    let onTarget = 0;
    for (let n = NORTH_STAR_GOAL_DAYS; n <= 7; n++) onTarget += num(`${prefix}.goal_days.${n}`);
    return { weekly_active: active, on_target: onTarget, rate: active > 0 ? onTarget / active : null };
  };

  const by_tier = {};
  for (const label of TIER_LABEL) by_tier[label] = read(`${WEEK_GOAL_PREFIX}.${label}`);
  return { ...read(WEEK_GOAL_PREFIX), goal_days_threshold: NORTH_STAR_GOAL_DAYS, by_tier };
}

/** Agrupa por dia — uma leitura+escrita de KV por dia, não por evento. */
export function groupByDay(events) {
  const byDay = new Map();
  for (const record of events) {
    if (!byDay.has(record.d)) byDay.set(record.d, []);
    byDay.get(record.d).push(record);
  }
  return byDay;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

// ---------------------------------------------------------------------------
// LEITURA DO AGREGADO (G-7)
//
// O levantamento de instrumentação achou o pior defeito possível numa métrica:
// existiam sete eventos sendo GRAVADOS em `m:*` e NENHUM leitor — nem rota, nem
// painel, nem script. Um agregado sem leitor não é dado, é custo. E enquanto
// não houvesse leitura, fechar as outras seis lacunas não mudaria nada.
//
// Escolhas, e o porquê de cada uma:
//
//  · **GET no MESMO arquivo.** A allowlist, o prefixo, os rótulos e o formato
//    do agregado vivem aqui. Um leitor noutro arquivo teria que reescrever os
//    rótulos, e regra copiada é regra que diverge em silêncio (footgun 9). Quem
//    muda `applyAggregate` vê a leitura na mesma tela.
//
//  · **Segredo, e FALHA FECHADA.** Sem `METRICS_ADMIN_KEY` a rota responde 404,
//    não 401: um 401 confirma que a rota existe. Mesmo padrão de
//    `SEASON_ADMIN_KEY` (`community.js`), que já é como este projeto protege
//    operação. Não usamos `_auth.js` de propósito — aquilo autentica um DONO DE
//    SAVE por e-mail, e ligar a leitura de métrica a uma conta de usuário
//    introduziria justamente a associação identidade↔métrica que o princípio 3
//    proíbe.
//
//  · **Janela fechada, lida chave a chave.** Nada de `list()` por prefixo: a
//    leitura enumera os dias PEDIDOS, com teto (`MAX_READ_DAYS`). Não existe
//    parâmetro por onde pedir uma chave que não seja `m:<dia>`, então nem uma
//    chamada mal-intencionada alcança um save.
//
// O que a leitura NÃO devolve, e não é esquecimento: nada por usuário, nada por
// coorte de instalação, nada de retenção. Não é limitação da rota — é a forma
// do dado, decidida no cabeçalho deste arquivo. Ver o relato do run.
// ---------------------------------------------------------------------------

/**
 * Teto da janela de leitura. ~3 meses: cobre a leitura de trimestre sem
 * transformar uma requisição em varredura do namespace.
 */
export const MAX_READ_DAYS = 92;

/** Cabeçalho do segredo de leitura. */
export const METRICS_KEY_HEADER = 'X-Metrics-Key';

/**
 * Compara em tempo (aproximadamente) constante. Não é defesa de missão crítica
 * — é o mínimo para o segredo não vazar pelo tempo do `===` num loop de sonda.
 */
function secretEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Os dias `YYYY-MM-DD` de `from` a `to`, inclusive. `null` se a janela é inválida. */
export function dayRange(from, to, max = MAX_READ_DAYS) {
  if (!DAY_RE.test(String(from)) || !DAY_RE.test(String(to))) return null;
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const count = Math.round((end - start) / 86400000) + 1;
  if (count > max) return null;
  const days = [];
  for (let i = 0; i < count; i++) days.push(new Date(start + i * 86400000).toISOString().slice(0, 10));
  return days;
}

/**
 * Soma os agregados de vários dias num total só. Pura.
 * @returns {Record<string, number>}
 */
export function mergeTotals(byDay) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const agg of Object.values(byDay || {})) {
    if (!agg || typeof agg !== 'object') continue;
    for (const [k, v] of Object.entries(agg)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

export async function onRequestGet({ request, env }) {
  // Sem segredo configurado, a rota NÃO EXISTE. Fail-closed, e 404 em vez de
  // 401 para não confirmar o endpoint a quem está sondando.
  if (!env?.METRICS_ADMIN_KEY) {
    return Response.json({ error: 'Not found' }, { status: 404, headers: CORS });
  }

  const gate = takeToken('metrics-read', clientKey(request), RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);

  const given = request.headers.get(METRICS_KEY_HEADER);
  if (!secretEquals(given ?? '', env.METRICS_ADMIN_KEY)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const days = dayRange(from, to);
  if (!days) {
    return Response.json(
      { error: 'Invalid range', max_days: MAX_READ_DAYS },
      { status: 400, headers: CORS },
    );
  }

  if (!kv(env)) {
    return Response.json({ error: 'Unavailable' }, { status: 503, headers: CORS });
  }

  const byDay = {};
  for (const day of days) {
    // Só `METRICS_PREFIX + day`. A chave é CONSTRUÍDA aqui a partir de um dia já
    // validado pelo regex — não existe caminho por onde o cliente escolha a chave.
    const agg = await kvOrThrow(env).get(METRICS_PREFIX + day, { type: 'json' }).catch(() => null);
    if (agg && typeof agg === 'object' && !Array.isArray(agg)) byDay[day] = agg;
  }

  const totals = mergeTotals(byDay);
  return Response.json({
    ok: true,
    from,
    to,
    days: byDay,
    totals,
    north_star: summarizeNorthStar(totals),
    // Dito na própria resposta, para quem ler o JSON não inferir o que ele não
    // diz: o agregado é por dia de EVENTO, nunca por coorte de instalação.
    // "Conversão em N dias" e qualquer série por usuário NÃO são calculáveis a
    // partir daqui. `retained.d1/d7/d30` EXISTE (marco cruzado, contado no
    // aparelho e emitido 1× por marco — `applyAggregate`), então a nota
    // antiga que listava "D7" como ilegível estava errada e contradizia o
    // próprio JSON que a carregava (QA rodada 1, review 07). O que continua
    // ilegível é a retenção CLÁSSICA por coorte: `d7` aqui é "voltou em algum
    // dia de D7–D29 desde a primeira carga", não "% da coorte de instalação
    // viva no 7º dia".
    notes: {
      cohort: 'nao existe: agregado por dia de evento, sem identidade nem dia de instalacao',
      retained: 'retained.d1/d7/d30 = maior marco cruzado por pessoa, emitido 1x na vida (d7 = voltou em algum dia de D7-D29); nao e retencao por coorte',
      unreadable: ['retencao por coorte de instalacao', 'conversao em N dias', 'qualquer serie por usuario'],
    },
  }, { headers: CORS });
}

export async function onRequest({ request, env }) {
  // O Pages roteia GET para `onRequestGet` sozinho quando ele existe. A
  // delegação explícita está aqui mesmo assim porque este arquivo exporta
  // `onRequest` genérico, e a ordem de precedência entre os dois é uma
  // convenção do runtime — não uma garantia visível no código. Sem esta linha,
  // uma mudança de precedência transformaria a leitura em 405 em silêncio.
  if (request.method === 'GET') return onRequestGet({ request, env });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
  }

  const gate = takeToken('metrics', clientKey(request), RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);

  // Lemos como TEXTO para poder aplicar o teto ANTES de parsear — `json()` num
  // corpo de 5 MB já custou a CPU antes de qualquer validação nossa.
  const raw = await request.text().catch(() => null);
  if (raw === null || raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: 'Invalid body' }, { status: 400, headers: CORS });
  }
  let body = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400, headers: CORS });
  }

  const result = sanitizeBatch(body);
  if (!result.ok) {
    return Response.json({ error: 'Invalid batch' }, { status: 400, headers: CORS });
  }
  // Lote válido cujos eventos foram todos recusados: 202, não erro. O cliente
  // não deve tentar de novo, e não há nada que ele possa consertar.
  if (result.events.length === 0) {
    return Response.json({ ok: true, accepted: 0 }, { status: 202, headers: CORS });
  }

  // Sem binding, a telemetria simplesmente não grava. NÃO é 500: o cliente
  // dispara e esquece, e um endpoint de métrica não tem o direito de parecer
  // uma falha do app. O `console.warn` é para quem opera, não para o usuário.
  if (!kv(env)) {
    console.warn('metrics: KV de saves não vinculada — agregado descartado');
    return Response.json({ ok: true, accepted: 0 }, { status: 202, headers: CORS });
  }

  // Read-modify-write. O KV não tem transação (mesma limitação documentada em
  // `_entitlements.js`): escritas concorrentes podem perder uma contagem. Para
  // uma métrica de produto isso é ruído aceitável — o que NÃO seria aceitável é
  // uma escrita por evento, que multiplicaria o custo de KV pelo tráfego.
  let accepted = 0;
  for (const [day, records] of groupByDay(result.events)) {
    const key = METRICS_PREFIX + day;
    try {
      const current = await kvOrThrow(env).get(key, { type: 'json' }).catch(() => null);
      const next = applyAggregate(current, records);
      // TTL de 2 anos: agregado sem dono é lixo com custo. Renovado a cada
      // escrita, então um dia ativo nunca expira no meio da coleta.
      await kvOrThrow(env).put(key, JSON.stringify(next), { expirationTtl: 86400 * 730 });
      accepted += records.length;
    } catch (err) {
      console.warn('metrics: falha ao gravar agregado', { day, error: String(err?.name ?? err) });
    }
  }

  return Response.json({ ok: true, accepted }, { headers: CORS });
}
