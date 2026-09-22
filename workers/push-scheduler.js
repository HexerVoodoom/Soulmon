// Cloudflare Worker — Scheduled push notifications for Soulmon
// Cron triggers: 10h, 16h + 22h (goodnight) — BRT (UTC-3)
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
import { pushCopy } from '../functions/api/_pushCopy.js';
import { ehTokenFcm } from '../functions/api/_pushIdentity.js';

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

export default {
  async scheduled(event, env) {
    const date = new Date(event.scheduledTime);
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
        const notif = pushCopy(brtHour, sub.petName, sub.language, ageDaysOf(sub, date));
        if (!notif) return 'skipped';
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
        return result.ok ? 'sent' : 'failed';
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
      const accessToken = await getFcmAccessToken(serviceAccount);
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
        const notif = pushCopy(brtHour, sub.petName, sub.language, ageDaysOf(sub, date));
        if (!notif) return 'skipped';
        const result = await sendFcmPush(sub.token, notif, serviceAccount.project_id, accessToken);
        if (result.ok) return 'sent';
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
        return 'failed';
      }, fcmCounts);
    }

    console.log(
      `[BRT ${brtHour}h] Push scheduler done — ` +
      `webpush: sent ${webPushCounts.sent}, failed ${webPushCounts.failed}, removed ${webPushCounts.removed} · ` +
      `fcm: sent ${fcmCounts.sent}, failed ${fcmCounts.failed}, removed ${fcmCounts.removed}`,
    );
  },
};
