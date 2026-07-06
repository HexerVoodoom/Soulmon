// Cloudflare Worker — Scheduled push notifications for DigiApp
// Cron triggers: 10h, 16h, 21h (task reminders) + 22h (goodnight) — BRT (UTC-3)
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
import { getFcmAccessToken, sendFcmPush } from './fcm.js';

const VAPID_PUBLIC_KEY = 'BK2MsJZtN6ancQBtKZYLFxe_avXfIPqRs28szlgRXJGfQcJlrd4wtBhzMr6t2zPvz7HUeJv-jpleDaNfmRZIlXY';
const CONTACT = 'mailto:contact@digiapp.app';

function getNotification(brtHour, digimonName, language) {
  const ispt = language === 'pt-BR';
  const name = digimonName || 'DigiMon';

  if (brtHour === 22) {
    return {
      title: `🌙 ${name} está desejando boa noite`,
      body: ispt ? 'Durma bem! Até amanhã 😴' : 'Sleep well! See you tomorrow 😴',
      tag: 'pet-goodnight',
    };
  }
  if (brtHour === 21) {
    return {
      title: ispt ? `⏰ ${name} está preocupado!` : `⏰ ${name} is worried!`,
      body: ispt
        ? 'Ainda dá tempo! Complete suas tarefas antes de dormir 🌙'
        : "Still time! Complete your tasks before bed 🌙",
      tag: 'pet-nudge-21',
    };
  }
  if (brtHour === 16) {
    return {
      title: ispt ? `📋 ${name} está te lembrando!` : `📋 ${name} is reminding you!`,
      body: ispt ? 'Suas tarefas ainda estão esperando! 🎯' : 'Your tasks are still waiting! 🎯',
      tag: 'pet-nudge-16',
    };
  }
  return {
    title: ispt ? `☀️ ${name} diz bom dia!` : `☀️ ${name} says good morning!`,
    body: ispt ? 'Vamos começar o dia com foco! 💪' : "Let's start the day focused! 💪",
    tag: 'pet-nudge-10',
  };
}

// Drains every key under `prefix`, running `handle(sub, name)` for each —
// `handle` returns 'sent' | 'failed' | 'removed' (and deletes the KV entry
// itself when 'removed', mirroring the stale-subscription cleanup).
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

export default {
  async scheduled(event, env) {
    const date = new Date(event.scheduledTime);
    const brtHour = (date.getUTCHours() - 3 + 24) % 24;

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
        const notif = getNotification(brtHour, sub.digimonName, sub.language);
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
        const notif = getNotification(brtHour, sub.digimonName, sub.language);
        const result = await sendFcmPush(sub.token, notif, serviceAccount.project_id, accessToken);
        if (result.ok) return 'sent';
        if (result.error === 'UNREGISTERED') {
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
