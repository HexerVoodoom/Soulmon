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
// TRÊS travas, porque duas não bastavam:
//
//  1. **Cota por conta e por DIA** (`ai:<bucket>:<saveId>:<dia>`). Disjuntor de
//     loop. Vale de verdade quando `FIREBASE_PROJECT_ID` estiver ligado — aí o
//     saveId é provado por token e ninguém roda em nome de outro.
//  2. **Teto por conta VITALÍCIO** (`ent:<saveId>.aiLifetime.<bucket>`, só
//     `sprite` hoje). Vive no registro que só o servidor escreve e **não tem
//     TTL**: teto vitalício que expira não é vitalício. É o único número que
//     casa custo (recorrente enquanto a conta viver) com receita (única, de
//     R$ 29,90). Ver `squad-alpha-runs/soulmon-02/custo-geracao-sprite.md` §3.
//  3. **Teto global**, por DIA para texto e por **MÊS** para imagem
//     (`ai:<bucket>:@all:<dia>` / `ai:<bucket>:@all:<AAAA-MM>`). Enquanto o
//     login não for exigido, o saveId é só um hash de e-mail: um atacante
//     inventa um novo a cada chamada e a cota por conta não segura nada. O teto
//     global não impede o abuso, mas limita o PREJUÍZO.
//
// Por que o global de imagem é MENSAL: `global: 400` por DIA equivalia a
// R$ 1.212/mês (400 × R$ 0,101) contra um orçamento declarado de R$ 200/mês —
// seis vezes. `globalMonth: 800` é exatamente a cota do plano Higgsfield
// Starter (US$ 15 ≈ R$ 81/mês, fixos), o que transforma o orçamento num
// **pré-pago**: ao acabar, o servidor devolve 503 e o cliente cai na arte de
// reserva, que já é um estado desenhado. Pré-pago não estoura.
//
// **FAIL-CLOSED, e isso é a regra.** Contador que não dá para ler RECUSA (503).
// O fail-open do `_auth.js` (`if (!projectId) return { ok: true }`) é o defeito
// que a auditoria achou: variável desligada virou porta aberta. Numa rota que
// queima dinheiro real, a dúvida nega.

import { VALID_ID, readEntitlement, writeEntitlement } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';

/**
 * Tetos. Chat é barato (llama-8b) e acontece o tempo todo; geração de imagem é
 * cara, rara e permanente — por isso só ela tem teto vitalício e janela mensal.
 *
 * - `perAccount`      → por conta, por DIA.
 * - `perAccountLifetime` → por conta, PARA SEMPRE (opcional; só `sprite`).
 * - `global`          → todas as contas, por DIA.
 * - `globalMonth`     → todas as contas, por MÊS (substitui `global` quando existe).
 */
export const AI_LIMITS = {
  chat: { perAccount: 120, global: 20000 },
  suggest: { perAccount: 30, global: 3000 },
  // 6/dia = o maior lote possível (empate triplo = 3) + retentativas do dia.
  // 20 vitalício = 14 do pior caso da spec + 6 de folga ⇒ R$ 2,02 por conta,
  // para sempre, 6,8 % de R$ 29,90.
  sprite: { perAccount: 6, perAccountLifetime: 20, globalMonth: 800 },
};

const day = (now = new Date()) => now.toISOString().slice(0, 10);
/** Janela MENSAL — `2026-08`. A virada de mês troca a chave, e o contador
 *  antigo morre sozinho pelo TTL. Nada de "reset" a rodar em lugar nenhum. */
const month = (now = new Date()) => now.toISOString().slice(0, 7);

/** Some um pouco mais de um dia, para o contador diário sumir sozinho do KV. */
const TTL_SECONDS = 60 * 60 * 30;
/** Um mês + folga: a chave do mês precisa sobreviver ao mês inteiro. */
const MONTH_TTL_SECONDS = 60 * 60 * 24 * 40;

/**
 * Mensagens de recusa. Chegam a alguém que **pagou** — então são honestas sobre
 * o que aconteceu e nunca soam como punição (CLAUDE.md: o Soulmon encoraja,
 * nunca cobra). PT-BR + EN, sempre os dois.
 */
export const AI_REFUSAL_MESSAGES = {
  'sprite-lifetime-cap': {
    'pt-BR': 'Seu Soulmon já recebeu toda a arte que esta jornada guardava para ele. As formas que vierem aparecem com a arte de reserva — e ela vale igual.',
    en: 'Your Soulmon has already received all the art this journey held for it. Any forms from here on show up with their reserve art — and it counts just the same.',
  },
  'ai-daily-limit': {
    'pt-BR': 'Por hoje já desenhamos bastante para o seu Soulmon. Amanhã a gente continua de onde parou.',
    en: "We've drawn plenty for your Soulmon today. Tomorrow we pick up right where we left off.",
  },
  'ai-monthly-budget-reached': {
    'pt-BR': 'O ateliê está descansando até o mês virar. Seu Soulmon segue inteiro com a arte de reserva, sem perder nada do caminho.',
    en: 'The studio is resting until the month turns over. Your Soulmon carries on whole with its reserve art, losing nothing along the way.',
  },
  'ai-daily-budget-reached': {
    'pt-BR': 'O ateliê já rendeu bastante hoje. Amanhã ele abre de novo.',
    en: 'The studio has given plenty today. It opens again tomorrow.',
  },
  'ai-quota-unavailable': {
    'pt-BR': 'Não conseguimos conferir a sua cota agora, e preferimos não arriscar cobrar você duas vezes. Tente de novo daqui a pouco.',
    en: "We couldn't check your quota right now, and we'd rather not risk charging you twice. Please try again in a little while.",
  },
};

const refuse = (status, reason) => ({
  ok: false,
  status,
  reason,
  ...(AI_REFUSAL_MESSAGES[reason] ? { message: AI_REFUSAL_MESSAGES[reason] } : {}),
});

/**
 * Lê um contador do KV. **Lança** quando o valor existe e não é número — dado
 * ilegível é o mesmo que contador ausente, e contador ausente não libera nada.
 */
async function readCounter(env, key) {
  const raw = await env.DIGIAPP_SAVES.get(key);
  if (raw === null || raw === undefined) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`contador ilegível em ${key}: ${raw}`);
  return n;
}

/** Quantas unidades este bucket já gastou VITALICIAMENTE nesta conta. */
function lifetimeUsed(ent, bucket) {
  const n = Number(ent?.aiLifetime?.[bucket] ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new Error('contador vitalício ilegível');
  return n;
}

/**
 * Libera (ou não) uma chamada de IA — e, quando libera, **debita**.
 *
 * A ordem é: lê os três contadores → confere os três → só então incrementa.
 * Conferir e incrementar em cascata faria uma requisição recusada no 3º teto
 * já ter consumido os dois primeiros — cota queimada por chamada que não
 * aconteceu.
 *
 * O vitalício é conferido PRIMEIRO porque é o único irreversível: uma conta que
 * já estourou não pode consumir a cota mensal (que é a fatura de todo mundo)
 * batendo na porta que já fechou.
 *
 * @param {'chat'|'suggest'|'sprite'} bucket
 * @param {string|undefined} saveId  vem do corpo da requisição
 * @param {number} units  quantas gerações esta chamada vai custar (a recusa de
 *   conteúdo refaz o pedido com `promptFallback` e por isso custa 2).
 * @returns {Promise<{ ok: true } | { ok: false, status: number, reason: string, message?: object }>}
 */
export async function guardAiRequest(request, env, bucket, saveId, units = 1) {
  if (!env.DIGIAPP_SAVES) return refuse(500, 'storage-not-bound');

  const limits = AI_LIMITS[bucket];
  if (!limits) return refuse(500, 'unknown-bucket');

  if (!saveId || !VALID_ID.test(saveId)) {
    return refuse(400, 'missing-save-id');
  }

  // Quando o login estiver ligado, isto amarra a chamada à conta de verdade.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return { ok: false, status: auth.reason === 'forbidden' ? 403 : 401, reason: auth.reason };
  }

  const now = new Date();
  const today = day(now);
  const thisMonth = month(now);
  const usesMonth = typeof limits.globalMonth === 'number';
  const globalKey = usesMonth
    ? `ai:${bucket}:@all:${thisMonth}`
    : `ai:${bucket}:@all:${today}`;
  const globalLimit = usesMonth ? limits.globalMonth : limits.global;
  const globalTtl = usesMonth ? MONTH_TTL_SECONDS : TTL_SECONDS;
  const accountKey = `ai:${bucket}:${saveId}:${today}`;
  const hasLifetime = typeof limits.perAccountLifetime === 'number';

  let ent = null;
  let usedLifetime = 0;
  let usedGlobal = 0;
  let usedAccount = 0;
  try {
    if (hasLifetime) {
      ent = await readEntitlement(env, saveId);
      usedLifetime = lifetimeUsed(ent, bucket);
    }
    usedGlobal = await readCounter(env, globalKey);
    usedAccount = await readCounter(env, accountKey);
  } catch (err) {
    // Não deu para saber quanto já foi gasto → não gasta mais. FAIL-CLOSED.
    console.error('aiGuard: contador ilegível, recusando', err?.message);
    return refuse(503, 'ai-quota-unavailable');
  }

  if (hasLifetime && usedLifetime + units > limits.perAccountLifetime) {
    return refuse(402, 'sprite-lifetime-cap');
  }
  if (usedAccount + units > limits.perAccount) {
    return refuse(429, 'ai-daily-limit');
  }
  if (usedGlobal + units > globalLimit) {
    return refuse(503, usesMonth ? 'ai-monthly-budget-reached' : 'ai-daily-budget-reached');
  }

  try {
    if (hasLifetime) {
      ent.aiLifetime = { ...(ent.aiLifetime || {}), [bucket]: usedLifetime + units };
      await writeEntitlement(env, saveId, ent);
    }
    await env.DIGIAPP_SAVES.put(globalKey, String(usedGlobal + units), { expirationTtl: globalTtl });
    await env.DIGIAPP_SAVES.put(accountKey, String(usedAccount + units), { expirationTtl: TTL_SECONDS });
  } catch (err) {
    // Débito que não gravou é chamada sem teto. Recusa.
    console.error('aiGuard: falha ao debitar cota, recusando', err?.message);
    return refuse(503, 'ai-quota-unavailable');
  }

  return { ok: true };
}
