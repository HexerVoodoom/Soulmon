// Cloudflare Worker — Scheduled push notifications for Soulmon
// Cron triggers: 10h, 16h + 22h (goodnight) — BRT (UTC-3) — e, para quem LIGOU o
// ritmo das refeições, uma passada a cada 30 min (`MEAL_TICK_CRON`).
//
// ⚠️ O TEXTO e as HORAS não moram aqui: são de `functions/api/_pushCopy.js`,
// que é o dono único das três árvores (cliente, worker, cron). Este arquivo é
// deploy MANUAL (`wrangler deploy`) e o cliente sobe sozinho — foi assim que o
// nudge das 21h ficou vivo aqui depois de ter sido removido do cliente.
//
// Sends to BOTH channels stored in the same KV namespace: `push:` keys via Web
// Push (browsers/PWA installs) and `fcm:` keys via Firebase Cloud Messaging
// (the native Android app — its WebView has no Web Push support).
//
// Required environment bindings (set in CF dashboard or wrangler.toml):
//   PUSH_SUBSCRIPTIONS       — KV namespace
//   VAPID_JWK                — Secret: full ECDSA P-256 private key as JSON string
//   VAPID_PUBLIC_KEY         — Plain text: base64url uncompressed public key
//   FIREBASE_SERVICE_ACCOUNT — Secret: full Firebase service account JSON string
//                              (Firebase Console → Project Settings → Service
//                              accounts → Generate new private key)

import { sendWebPush } from './webpush.js';
import { isAllowedPushEndpoint } from '../functions/api/_pushTargets.js';
import { getFcmAccessToken, sendFcmPush } from './fcm.js';
import { pushCopy, mealInviteCopy, mealPushKind, sleepReminderCopy, poopPushCopy } from '../functions/api/_pushCopy.js';
import {
  MEAL_KEYS, MEAL_TICK_CRON, MEAL_STEP_MIN, mealAtTick, localMinutes, inRestArc, tickOf,
} from '../functions/api/_mealRhythm.js';
import { ehTokenFcm, lembreteDeInscricao, suprimidosDeInscricao, agendaCocoDeInscricao } from '../functions/api/_pushIdentity.js';

const VAPID_PUBLIC_KEY = 'BIO7RjZ9yeknwdZPD8k8hKJ6EHqIPVap8JQNP2AR300fbpvcPEMPwRi4lvarHEeAR5hD6aawtb_QYIy4Ir16zdo';
// Endereço de contato do VAPID (RFC 8292 `sub`): é para onde o SERVIÇO DE
// PUSH escreve quando há problema de entrega — nunca aparece para o usuário.
// Era `contact@digiapp.app`, endereço de outro projeto: um aviso de entrega
// quebrada chegaria a quem não pode consertar. Decisão do dono em 07/09/2026.
// Trocar por um endereço do domínio do Soulmon quando ele existir; o campo é
// de CONTATO, não de autenticação, então a troca não invalida subscription
// nenhuma.
const CONTACT = 'mailto:mateus.sprnd@gmail.com';

// Drains every key under `prefix`, running `handle(sub, name)` for each —
// `handle` returns 'sent' | 'failed' | 'removed' (and deletes the KV entry
// itself when 'removed', mirroring the stale-subscription cleanup).
/**
 * WP1.17 — idade da criatura em dias, se a inscrição souber (`bornAt`).
 *
 * O dado morre junto com a subscription: não existe registro separado, e
 * cancelar o push apaga a idade junto. Ausente ou ilegível devolve `null`, e
 * `pushCopy` entende `null` como "copy de sempre" — nunca como dia 0.
 */
/**
 * A BASE do dia é MEIA-NOITE EM BRT (`T03:00:00Z`), não meia-noite UTC
 * (`00-skeptic-r2` #11): o cron das 22h BRT é 01:00 UTC do dia seguinte —
 * com base em UTC, quem nasceu hoje já contava `dias = 1` às 22h e recebia
 * um push no D0, que é o único dia em que ele não pode sair. O jogador
 * brasileiro é o caso principal; para fusos à frente do UTC vale a regra do
 * `-1 → 0` abaixo. `PUSH_HOURS_BRT` já assume o mesmo fuso.
 */
export const AGE_DAY_BASE_UTC = 'T03:00:00Z';

export function ageDaysOf(sub, now) {
  const nascimento = Date.parse(`${sub?.bornAt ?? ''}${AGE_DAY_BASE_UTC}`);
  if (!Number.isFinite(nascimento)) return null;
  const dias = Math.floor((now.getTime() - nascimento) / 86_400_000);
  // `bornAt` é o DIA DO JOGADOR (`playerDayKey`), e o jogador pode estar até
  // 14 h À FRENTE do UTC: o dia dele já é T enquanto o UTC ainda está em T-1
  // (ex.: Tóquio, 00:30 do dia T = 15:30 UTC de T-1). `dias` sai -1 nesse
  // caso, e -1 NÃO é "idade desconhecida" — é D0, o único dia em que o push
  // não pode sair (`_pushCopy.js`). Só `bornAt` além de um dia no futuro
  // (relógio adulterado) vira `null`. QA rodada 2, 22/09/2026.
  if (dias >= 0) return dias;
  return dias === -1 ? 0 : null;
}

async function drainPrefix(env, prefix, handle, counts) {
  let cursor;
  do {
    const list = await env.PUSH_SUBSCRIPTIONS.list({ prefix, cursor, limit: 100 });
    cursor = list.cursor;

    await Promise.allSettled(
      list.keys.map(async ({ name }) => {
        const raw = await env.PUSH_SUBSCRIPTIONS.get(name);
        if (!raw) return;

        let sub;
        try { sub = JSON.parse(raw); } catch { return; }

        try {
          const outcome = await handle(sub, name);
          counts[outcome] = (counts[outcome] || 0) + 1;
        } catch (err) {
          console.error(`${prefix} send failed for ${name}:`, err.message);
          counts.failed = (counts.failed || 0) + 1;
        }
      }),
    );
  } while (cursor);
}

/**
 * WP4.18 — o fechamento da season do Torneio.
 *
 * Os troféus de season JÁ existiam inteiros (`closeSeason` em
 * `functions/api/community.js`, as vitrines que os exibem no palco), e mesmo
 * assim só chegavam ao jogador se o DONO lembrasse de disparar a rota à mão.
 * Recompensa que depende de alguém lembrar não é recompensa: é sorte.
 *
 * Roda no 1º dia do mês (dia do BRT, que é quem define a season) e fecha a
 * season ANTERIOR. A idempotência é do servidor (`closed:<season>`), não deste
 * arquivo — cron repete, e a trava tem que morar onde a escrita acontece.
 */
export function previousSeasonBrt(date) {
  const brt = new Date(date.getTime() - 3 * 3600_000);
  const y = brt.getUTCFullYear();
  const m = brt.getUTCMonth(); // 0-11, mês CORRENTE
  const anterior = new Date(Date.UTC(y, m - 1, 1));
  return `${anterior.getUTCFullYear()}-${String(anterior.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Dia do mês em BRT — é o fuso da season, não o do UTC. */
function brtDayOfMonth(date) {
  return new Date(date.getTime() - 3 * 3600_000).getUTCDate();
}

async function closeSeasonIfDue(date, env) {
  if (brtDayOfMonth(date) !== 1) return;
  if (!env.SEASON_ADMIN_KEY || !env.APP_URL) {
    console.log('[season] SEASON_ADMIN_KEY/APP_URL ausentes — fechamento não tentado');
    return;
  }
  const season = previousSeasonBrt(date);
  try {
    const res = await fetch(`${env.APP_URL}/api/community?action=closeSeason`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ season, adminKey: env.SEASON_ADMIN_KEY }),
    });
    console.log(`[season] closeSeason ${season} → ${res.status}`);
  } catch (err) {
    console.error(`[season] closeSeason ${season} falhou:`, err.message);
  }
}

/**
 * O ritmo das refeições SUBSTITUI os convites genéricos de 10h e 16h para quem
 * o ligou (e, com janela de descanso, o "boa noite" das 22h, que o lembrete de
 * deitar já faz): somar seria a quarta, a quinta visita ao app. O teto de
 * `PUSH_DAILY_CAP` é estrutural — são estes três ceder-a-vez e mais nada — e o
 * teste `workers/mealRhythm.parity.test.js` varre as 48 passadas do dia.
 */
export function cedeAoRitmo(sub, brtHour) {
  // O lembrete de deitar também fecha a noite: com ele ligado, o "boa noite"
  // das 22h cede (não somar boa-noite + lembrete).
  if (brtHour === 22 && lembreteDeInscricao(sub?.sleep)) return true;
  if (!sub?.meals) return false;
  if (brtHour === 10 || brtHour === 16) return true;
  if (brtHour === 22 && Array.isArray(sub.meals.rest)) return true;
  return false;
}

/**
 * O LEMBRETE DE DEITAR desta inscrição neste instante, ou `null`.
 *
 * O alvo é `início − 30 min` (mesma regra de `sleepReminderAt` no cliente), mas o
 * cron só roda de 30 em 30: o push sai no passo que CONTÉM o alvo (arredondado
 * para baixo), ou seja, de 0 a 29 min ANTES — nunca depois do início da janela.
 * Mesma tag do lembrete local (`pet-sleep-reminder`): se o app estiver aberto,
 * o sistema troca uma pela outra em vez de empilhar. `null` quando: sem `sleep`
 * válido (desligado), não é o passo, ou D0.
 */
export function sleepNotifFor(sub, date) {
  const sleep = lembreteDeInscricao(sub?.sleep);
  if (!sleep) return null;
  const MIN_PER_DAY = 1440;
  const alvo = (sleep.s - 30 + MIN_PER_DAY) % MIN_PER_DAY;
  const tickAlvo = Math.floor(alvo / MEAL_STEP_MIN) * MEAL_STEP_MIN;
  if (tickOf(localMinutes(date, sleep.tz)) !== tickAlvo) return null;
  if (ageDaysOf(sub, date) === 0) return null;
  if (suprimidoHoje(sub, 'sleep', date, sleep.tz)) return null;
  return sleepReminderCopy(sub.petName, sub.language);
}

/** A passada do cron é de 30 min (`MEAL_STEP_MIN`). */
const PASSADA_MS = MEAL_STEP_MIN * 60_000;

/** Dia local da inscrição (`YYYY-MM-DD`) — semente do convite do dia. */
function dayKeyLocal(date, tz) {
  return new Date(date.getTime() + tz * 60_000).toISOString().slice(0, 10);
}

/**
 * O teto diário (REGISTRO §113) cortou `chave` HOJE? O cliente decide quais
 * pushes cabem nos `PUSH_DAILY_CAP` (cocô/fome/energia/carta têm prioridade
 * sobre refeição e lembrete de deitar) e manda o que cortou em `x = { d, k }`;
 * o worker só obedece, e SÓ no dia `d` do fuso da inscrição — amanhã vale o
 * plano novo. Sem `x` (ou de outro dia) nada é cortado: o comportamento de sempre.
 */
export function suprimidoHoje(sub, chave, date, tz) {
  const x = suprimidosDeInscricao(sub?.x);
  return !!x && Number.isInteger(tz) && x.d === dayKeyLocal(date, tz) && x.k.includes(chave);
}

/**
 * A notificação de refeição DESTA inscrição neste instante, ou `null`.
 * `null` quando: não ligou o ritmo, não é hora de refeição para ela, a hora cai
 * na janela de descanso dela, ou é o dia do nascimento (D0 nunca recebe push).
 */
export function mealNotifFor(sub, date) {
  const m = sub?.meals;
  if (!m || !Array.isArray(m.t) || !Number.isInteger(m.tz)) return null;
  const times = {};
  MEAL_KEYS.forEach((k, i) => {
    const h = Math.floor(m.t[i] / 60), mm = m.t[i] % 60;
    times[k] = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  });
  const local = localMinutes(date, m.tz);
  const meal = mealAtTick(local, times);
  if (!meal) return null;
  if (inRestArc(m.t[MEAL_KEYS.indexOf(meal)], m.rest)) return null;
  if (ageDaysOf(sub, date) === 0) return null;
  if (suprimidoHoje(sub, meal, date, m.tz)) return null;
  const kind = mealPushKind(meal, dayKeyLocal(date, m.tz));
  return mealInviteCopy(meal, kind, sub.petName, sub.language);
}

/**
 * O PUSH DE COCÔ desta inscrição neste instante, ou `null` (REGISTRO §144).
 *
 * O worker NÃO lê o save: só a AGENDA DO DIA que o cliente mandou na inscrição
 * (`poop = { d, tz, t: [[slot, instante]] }`, só instantes). O push sai na
 * 1ª passada de 30 min em ou DEPOIS do instante (arredondado PARA CIMA: o cocô
 * só "apareceu" quando o instante chegou — nunca avisar antes). Cada instante
 * cai em UMA passada só, então reexecutar a mesma passada não repete outra.
 * A tag é `poop-event-<slot>`, a do alarme local do APK e do aviso de dentro do
 * app: se dois chegarem, o sistema troca um pelo outro.
 *
 * `null` quando: sem agenda válida (inscrição antiga, toggle desligado), agenda
 * de OUTRO dia local (expirada), não é a passada do instante, D0, ou o instante
 * cai na janela de descanso (`meals.rest`; só com `sleep` assume 10 h a partir
 * do início). Nunca é cortado pelo `x`: cocô é a maior prioridade (`_pushBudget.js`).
 */
export function poopNotifFor(sub, date) {
  const agenda = agendaCocoDeInscricao(sub?.poop, date.getTime());
  if (!agenda) return null;
  if (dayKeyLocal(date, agenda.tz) !== agenda.d) return null;
  if (ageDaysOf(sub, date) === 0) return null;
  const passada = Math.round(date.getTime() / PASSADA_MS);
  const slotDaPassada = agenda.t.find(([, at]) => Math.ceil(at / PASSADA_MS) === passada);
  if (!slotDaPassada) return null;
  const [slot, at] = slotDaPassada;
  const rest = Array.isArray(sub?.meals?.rest) && Number.isInteger(sub.meals.tz) ? sub.meals.rest : null;
  if (rest && inRestArc(localMinutes(new Date(at), sub.meals.tz), rest)) return null;
  const sleep = lembreteDeInscricao(sub?.sleep);
  if (sleep && !rest && inRestArc(localMinutes(new Date(at), sleep.tz), [sleep.s, (sleep.s + 600) % 1440])) return null;
  return poopPushCopy(sub.petName, sub.language, slot);
}

/** `notifFor` devolve uma notificação, uma LISTA delas (cocô + refeição na mesma passada) ou `null`. */
function notifsDe(r) {
  return (Array.isArray(r) ? r : [r]).filter(Boolean);
}

async function entregar(env, label, notifFor, { lazyFcm = false } = {}) {
  const webPushCounts = { sent: 0, failed: 0, removed: 0 };
  const fcmCounts = { sent: 0, failed: 0, removed: 0 };

  // ── Web Push (browsers / installed PWA) ──────────────────────────────
  let vapidJWK;
  try {
    vapidJWK = JSON.parse(env.VAPID_JWK);
  } catch {
    console.error('VAPID_JWK not configured or invalid JSON — skipping Web Push');
    vapidJWK = null;
  }

  if (vapidJWK) {
    await drainPrefix(env, 'push:', async (sub, name) => {
      // Revalidação na SAÍDA: as linhas gravadas antes da allowlist entrar em
      // functions/api/subscribe.js continuam no KV com TTL de um ano. Sem
      // isto, elas seguiriam sendo alvo de fetch a cada disparo do cron.
      if (!isAllowedPushEndpoint(sub.endpoint)) {
        await env.PUSH_SUBSCRIPTIONS.delete(name);
        return 'removed';
      }
      const notifs = notifsDe(notifFor(sub));
      if (!notifs.length) return 'skipped';
      let outcome = 'sent';
      for (const notif of notifs) {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, keys: sub.keys },
          notif,
          vapidJWK,
          VAPID_PUBLIC_KEY,
          CONTACT,
        );
        if (result.status === 410 || result.status === 404) {
          await env.PUSH_SUBSCRIPTIONS.delete(name);
          return 'removed';
        }
        if (!result.ok) outcome = 'failed';
      }
      return outcome;
    }, webPushCounts);
  }

  // ── FCM (native Android app) ──────────────────────────────────────────
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT not configured or invalid JSON — skipping FCM');
    serviceAccount = null;
  }

  if (serviceAccount) {
    // Nas passadas de hora fixa o token é mintado ANTES de olhar a KV: OAuth
    // fora do ar tem de estourar o disparo (não silencioso), com o Web Push já
    // enviado. Já a passada de 30 min das refeições roda 48×/dia e na maioria
    // delas ninguém tem o que receber — ali mintar à toa é custo puro, e o erro
    // aparece na primeira entrega real.
    let accessToken = lazyFcm ? undefined : await getFcmAccessToken(serviceAccount);
    await drainPrefix(env, 'fcm:', async (sub, name) => {
      // Revalidação na SAÍDA, do mesmo jeito que o Web Push faz com a
      // allowlist de endpoint: as linhas gravadas antes de
      // `functions/api/fcm-subscribe.js` validar o token continuam na KV com
      // TTL de um ano. Um token torto devolve `INVALID_ARGUMENT` para
      // SEMPRE, e `INVALID_ARGUMENT` não era caso de remoção — a linha ficava
      // sendo tentada 3×/dia por um ano inteiro, gastando cota de FCM e
      // poluindo o contador de falhas que é o único sinal de saúde do canal.
      if (!ehTokenFcm(sub.token)) {
        await env.PUSH_SUBSCRIPTIONS.delete(name);
        return 'removed';
      }
      const notifs = notifsDe(notifFor(sub));
      if (!notifs.length) return 'skipped';
      accessToken ??= await getFcmAccessToken(serviceAccount);
      let outcome = 'sent';
      for (const notif of notifs) {
        const result = await sendFcmPush(sub.token, notif, serviceAccount.project_id, accessToken);
        if (result.ok) continue;
        // `NOT_FOUND` é o irmão de `UNREGISTERED` na v1 do FCM: o registro não
        // existe mais do lado do Google. Os dois são permanentes e por TOKEN.
        //
        // ⚠️ `INVALID_ARGUMENT` NÃO entra nesta lista de propósito. Ele também
        // sai quando o defeito é NOSSO (payload malformado por um deploy ruim),
        // e aí apagar significaria apagar TODAS as inscrições de uma vez. O
        // token torto — que é o caso legítimo dele — já foi removido acima, por
        // exame do próprio token, sem depender do que o Google respondeu.
        if (result.error === 'UNREGISTERED' || result.error === 'NOT_FOUND') {
          await env.PUSH_SUBSCRIPTIONS.delete(name);
          return 'removed';
        }
        outcome = 'failed';
      }
      return outcome;
    }, fcmCounts);
  }

  console.log(
    `[${label}] Push scheduler done — ` +
    `webpush: sent ${webPushCounts.sent}, failed ${webPushCounts.failed}, removed ${webPushCounts.removed} · ` +
    `fcm: sent ${fcmCounts.sent}, failed ${fcmCounts.failed}, removed ${fcmCounts.removed}`,
  );
}

export default {
  async scheduled(event, env) {
    const date = new Date(event.scheduledTime);

    // A passada de 30 min do RITMO DAS REFEIÇÕES. Só mexe em quem ligou (a
    // inscrição tem `meals`) e do COCÔ AGENDADO (`poop`, REGISTRO §144); o resto sai como 'skipped' sem custo de envio.
    if (event.cron === MEAL_TICK_CRON) {
      await entregar(env, `meal tick ${date.toISOString()}`, sub => [poopNotifFor(sub, date), mealNotifFor(sub, date) ?? sleepNotifFor(sub, date)], { lazyFcm: true });
      return;
    }

    const brtHour = (date.getUTCHours() - 3 + 24) % 24;

    // ⚠️ ANTES do `return` de hora sem notificação declarada: o fechamento da
    // season não é um push e não pode depender de existir cópia para a hora.
    // Uma hora só (10h BRT) para não disparar três vezes no mesmo dia — a
    // trava do servidor cobre o resto.
    if (brtHour === 10) await closeSeasonIfDue(date, env);

    // Hora sem notificação declarada em `_pushCopy.js` (ex.: um cron das 21h
    // que ficou para trás no dashboard depois do deploy) não vira mensagem
    // genérica: sai sem tocar no KV nem mintar token de FCM.
    if (!pushCopy(brtHour, 'x', 'en-US')) {
      console.log(`[BRT ${brtHour}h] sem notificação declarada — nada enviado`);
      return;
    }

    await entregar(env, `BRT ${brtHour}h`, sub =>
      cedeAoRitmo(sub, brtHour) ? null : pushCopy(brtHour, sub.petName, sub.language, ageDaysOf(sub, date)));
  },
};
