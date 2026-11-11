// ---------------------------------------------------------------------------
// TREINO ("Sparring") do Torneio — a 2a aba (dono, 10/11/2026): luta PvP contra outros jogadores, parecida com a
// ranqueada, mas que NÃO ranqueia (não toca placar, rank, faixa, tier, season nem `lifetimePoints`) e rende POUCA
// Honra: 1 a 2 por vitória, teto de 20 por DIA DO JOGADOR. O servidor decide tudo (lista, semente, resultado, Honra).
//
// Os oponentes NÃO saem do ranking: saem de um pool por FAIXA DE NÍVEL DO VÍNCULO (`bondLevelFor`), com um range
// MAIOR que o da ranqueada, ampliado quando a faixa tem menos de 5 candidatos. Nenhum número de ranking sai na resposta.
// Este módulo é puro/KV-only: a rota (`community.js`) só o chama.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { BOND_MAX_LEVEL } from './_bond.js';
import { ordenarPorEstagio } from './_oponenteEstagio.js';

/** Quantos oponentes a aba mostra. */
export const SPAR_PICKS = 5;
/** Faixa inicial: ±3 níveis de Vínculo em torno do seu (a ranqueada olha só os vizinhos de pontos). */
export const SPAR_BOND_RANGE = 3;
/** Quanto a faixa cresce, por lado, enquanto houver menos de `SPAR_PICKS` candidatos. */
export const SPAR_RANGE_STEP = 2;
/** Teto de perfis varridos por pedido (cada um custa 2 leituras de KV: perfil + save). */
export const SPAR_SCAN_MAX = 120;
/** Honra por vitória (sorteada no servidor) e teto por DIA do jogador. */
export const SPAR_HONOR_MIN = 1;
export const SPAR_HONOR_MAX = 2;
export const SPAR_HONOR_DAILY_CAP = 20;
/** Validade do duelo de treino aberto (a mesma folga do ranqueado, em `community.js`). */
export const SPAR_PENDING_TTL_S = 3600;

/**
 * `pool`: `[{ bond: number, ...resto }]`. Devolve os candidatos EMBARALHADOS dentro da faixa de `myBond`, ampliando
 * a faixa até haver ao menos `n` (ou até o pool todo). Quem chama fatia os `n` primeiros (e pode pular quem não luta).
 * Pura: o `rng` vem de fora (`() => [0,1)`).
 */
export function pickSparOpponents(pool, myBond, rng, n = SPAR_PICKS, range = SPAR_BOND_RANGE, myStage = null) {
  const fin = v => (Number.isFinite(v) ? v : 1);
  const mine = fin(myBond);
  let r = Math.max(0, range);
  let cand = pool.filter(p => Math.abs(fin(p.bond) - mine) <= r);
  while (cand.length < n && cand.length < pool.length && r < BOND_MAX_LEVEL) {
    r += SPAR_RANGE_STEP;
    cand = pool.filter(p => Math.abs(fin(p.bond) - mine) <= r);
  }
  // Embaralha com preferência por estágio próximo/variado ao do jogador (`ESTAGIO_PESOS`); sem `myStage`, uniforme.
  return ordenarPorEstagio(cand, myStage, rng, c => c.stage);
}

/** Honra desta vitória: 1 ou 2, a 50%. */
export const sparHonorRoll = rng => SPAR_HONOR_MIN + (rng() < 0.5 ? 0 : SPAR_HONOR_MAX - SPAR_HONOR_MIN);

export const sparHonorKey = (id, day) => `sparHonor:${id}:${day}`;
export const sparPendingKey = id => `spar:${id}`;
export const sparDoneKey = id => `sparDone:${id}`;

/**
 * Credita (no contador do dia, no servidor) a Honra de UMA vitória de treino e devolve o que o app deve somar.
 * `day` = dia do JOGADOR (`playerDayOf` de `_strays.js`; zona/offset que o app informa, sem informação = UTC). Nunca por tick: só quando o resultado foi liquidado. Leitura tolerante: contador ausente/ilegível = 0.
 * @returns {Promise<{ honor: number, capped: boolean }>}
 */
export async function grantSparHonor(env, id, day, rng) {
  const key = sparHonorKey(id, day);
  const raw = await kvOrThrow(env).get(key).catch(() => null);
  const used = Math.max(0, Math.min(SPAR_HONOR_DAILY_CAP, Math.floor(Number(raw)) || 0));
  const roll = sparHonorRoll(rng);
  const honor = Math.max(0, Math.min(roll, SPAR_HONOR_DAILY_CAP - used));
  if (honor > 0) await kvOrThrow(env).put(key, String(used + honor), { expirationTtl: 172800 });
  return { honor, capped: honor < roll };
}

// ---------------------------------------------------------------------------
// TICKETS DO TREINO (dono, 10/11/2026). Todo DIA DO JOGADOR dá 1 ticket GRÁTIS = `TREINO_TICKET_MATCHES` (20) partidas COM Honra
// (a Honra segue 1–2 por vitória, teto `SPAR_HONOR_DAILY_CAP`). Depois delas só se joga comprando ticket EXTRA: `TREINO_EXTRA_TICKET_BITS` (30)
// Bits = +20 partidas SEM Honra, no máximo `TREINO_EXTRA_TICKETS_MAX` (3) por dia (evita farm). Só Bits, nunca Créditos: o app cobra
// os Bits (ganhos) e o servidor só conta. O Treino nunca ranqueia. Registro `sparTicket:<id>:<dia>` = `{played, extra}`; leitura tolerante.
// Espelho no app: `src/utils/treinoTickets.ts` (paridade em `treino.parity.test.js`).
// ---------------------------------------------------------------------------
export const TREINO_TICKET_MATCHES = 20;
export const TREINO_EXTRA_TICKET_BITS = 30;
export const TREINO_EXTRA_TICKETS_MAX = 3;
export const sparTicketKey = (id, day) => `sparTicket:${id}:${day}`;

/** Lixo vira zero; `extra` fica em 0..MAX; `played` em 0..capacidade máxima. */
export function sanitizeSparTicket(raw) {
  let o = raw;
  if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch { o = null; } }
  const fin = v => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
  const extra = Math.min(TREINO_EXTRA_TICKETS_MAX, fin(o && o.extra));
  const played = Math.min(TREINO_TICKET_MATCHES * (1 + TREINO_EXTRA_TICKETS_MAX), fin(o && o.played));
  return { played, extra };
}

/** O que a aba mostra: partidas com Honra que restam, partidas totais que restam e se ainda dá para comprar. */
export function sparTicketStatus(t) {
  const { played, extra } = sanitizeSparTicket(t);
  const capacity = TREINO_TICKET_MATCHES * (1 + extra);
  return {
    played, extra, capacity,
    honorLeft: Math.max(0, TREINO_TICKET_MATCHES - played),
    left: Math.max(0, capacity - played),
    canBuy: extra < TREINO_EXTRA_TICKETS_MAX,
  };
}

export async function readSparTicket(env, id, day) {
  const raw = await kvOrThrow(env).get(sparTicketKey(id, day)).catch(() => null);
  return sanitizeSparTicket(raw);
}
const writeSparTicket = (env, id, day, t) => kvOrThrow(env).put(sparTicketKey(id, day), JSON.stringify(t), { expirationTtl: 172800 });

/** Compra 1 ticket extra (a cobrança em Bits é do app). Recusa no teto: `{ ok:false }`. */
export async function buySparTicket(env, id, day) {
  const t = await readSparTicket(env, id, day);
  if (t.extra >= TREINO_EXTRA_TICKETS_MAX) return { ok: false, status: sparTicketStatus(t) };
  const next = { ...t, extra: t.extra + 1 };
  await writeSparTicket(env, id, day, next);
  return { ok: true, status: sparTicketStatus(next) };
}

/** Gasta 1 partida liquidada. `withHonor` = ainda cabia no ticket grátis (o servidor só paga Honra nesse caso). */
export async function spendSparMatch(env, id, day) {
  const t = await readSparTicket(env, id, day);
  const withHonor = t.played < TREINO_TICKET_MATCHES;
  const next = { ...t, played: t.played + 1 };
  await writeSparTicket(env, id, day, next);
  return { withHonor, status: sparTicketStatus(next) };
}
