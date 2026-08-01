// Portão das rotas que gastam DINHEIRO em API de terceiros (Groq, Higgsfield,
// Gemini).
//
// O problema que isto resolve: `/api/chat`, `/api/suggest-tasks` e
// `/api/generate-sprite` aceitavam qualquer requisição, de qualquer origem, sem
// identificação e sem teto. Um `curl` em loop gerava imagens e texto com as
// NOSSAS chaves — exatamente o custo que a monetização existe para cobrir. Pior
// no `generate-sprite`: o prompt vem do cliente, então também era um jeito de
// alguém gerar o que quisesse na nossa conta.
//
// Duas travas, porque uma só não basta:
//
//  1. **Cota por conta** (`ai:<bucket>:<saveId>:<dia>`). Vale de verdade quando
//     `FIREBASE_PROJECT_ID` estiver ligado — aí o saveId é provado por token e
//     ninguém consegue rodar em nome de outro.
//  2. **Teto global por dia** (`ai:<bucket>:@all:<dia>`). Enquanto o login não
//     for exigido, o saveId é só um hash de e-mail: um atacante inventa um novo
//     a cada chamada e a cota por conta não segura nada. O teto global não
//     impede o abuso, mas limita o PREJUÍZO — a conta do mês tem teto.
//
// Ou seja: a trava 2 é um disjuntor, não uma autenticação. A proteção de
// verdade só fecha quando o login estiver ligado (ver docs/BILLING-SETUP.md).

import { VALID_ID } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';

/**
 * Tetos por dia. Chat é barato (llama-8b) e acontece o tempo todo; geração de
 * imagem é cara e rara. Os números são conservadores de propósito: é mais fácil
 * afrouxar depois de ver o uso real do que explicar uma fatura inesperada.
 */
export const AI_LIMITS = {
  chat: { perAccount: 120, global: 20000 },
  suggest: { perAccount: 30, global: 3000 },
  sprite: { perAccount: 20, global: 400 },
};

const day = () => new Date().toISOString().slice(0, 10);
/** Some um pouco mais de um dia, para o contador sumir sozinho do KV. */
const TTL_SECONDS = 60 * 60 * 30;

async function bump(env, key, limit) {
  const raw = await env.DIGIAPP_SAVES.get(key);
  const used = Number(raw) || 0;
  if (used >= limit) return false;
  await env.DIGIAPP_SAVES.put(key, String(used + 1), { expirationTtl: TTL_SECONDS });
  return true;
}

/**
 * Libera (ou não) uma chamada de IA.
 *
 * @param {'chat'|'suggest'|'sprite'} bucket
 * @param {string|undefined} saveId  vem do corpo da requisição
 * @returns {Promise<{ ok: true } | { ok: false, status: number, reason: string }>}
 */
export async function guardAiRequest(request, env, bucket, saveId) {
  if (!env.DIGIAPP_SAVES) return { ok: false, status: 500, reason: 'storage-not-bound' };

  const limits = AI_LIMITS[bucket];
  if (!limits) return { ok: false, status: 500, reason: 'unknown-bucket' };

  if (!saveId || !VALID_ID.test(saveId)) {
    return { ok: false, status: 400, reason: 'missing-save-id' };
  }

  // Quando o login estiver ligado, isto amarra a chamada à conta de verdade.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return { ok: false, status: auth.reason === 'forbidden' ? 403 : 401, reason: auth.reason };
  }

  const today = day();
  // Global primeiro: se o teto do dia estourou, nem gasta leitura por conta.
  if (!(await bump(env, `ai:${bucket}:@all:${today}`, limits.global))) {
    return { ok: false, status: 503, reason: 'ai-daily-budget-reached' };
  }
  if (!(await bump(env, `ai:${bucket}:${saveId}:${today}`, limits.perAccount))) {
    return { ok: false, status: 429, reason: 'ai-daily-limit' };
  }
  return { ok: true };
}
