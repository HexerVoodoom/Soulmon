// Cloudflare Worker — Scheduled push notifications for DigiApp
// Cron triggers: 10h, 16h, 21h (task reminders) + 22h (goodnight) — BRT (UTC-3)
//
// Required environment bindings (set in CF dashboard or wrangler.toml):
//   PUSH_SUBSCRIPTIONS  — KV namespace
//   VAPID_JWK           — Secret: full ECDSA P-256 private key as JSON string
//   VAPID_PUBLIC_KEY    — Plain text: base64url uncompressed public key

import { sendWebPush } from './webpush.js';

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

export default {
  async scheduled(event, env) {
    const date = new Date(event.scheduledTime);
    const brtHour = (date.getUTCHours() - 3 + 24) % 24;

    let vapidJWK;
    try {
      vapidJWK = JSON.parse(env.VAPID_JWK);
    } catch {
      console.error('VAPID_JWK not configured or invalid JSON');
      return;
    }

    let cursor;
    let totalSent = 0;
    let totalFailed = 0;
    let totalRemoved = 0;

    do {
      const list = await env.PUSH_SUBSCRIPTIONS.list({ prefix: 'push:', cursor, limit: 100 });
      cursor = list.cursor;

      await Promise.allSettled(
        list.keys.map(async ({ name }) => {
          const raw = await env.PUSH_SUBSCRIPTIONS.get(name);
          if (!raw) return;

          let sub;
          try { sub = JSON.parse(raw); } catch { return; }

          const notif = getNotification(brtHour, sub.digimonName, sub.language);

          try {
            const result = await sendWebPush(
              { endpoint: sub.endpoint, keys: sub.keys },
              notif,
              vapidJWK,
              VAPID_PUBLIC_KEY,
              CONTACT,
            );

            if (result.status === 410 || result.status === 404) {
              await env.PUSH_SUBSCRIPTIONS.delete(name);
              totalRemoved++;
            } else if (result.ok) {
              totalSent++;
            } else {
              totalFailed++;
            }
          } catch (err) {
            console.error(`Push failed for ${name}:`, err.message);
            totalFailed++;
          }
        }),
      );
    } while (cursor);

    console.log(
      `[BRT ${brtHour}h] Push scheduler done — sent: ${totalSent}, failed: ${totalFailed}, removed: ${totalRemoved}`,
    );
  },
};
