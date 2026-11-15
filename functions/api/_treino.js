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
import { BOND_MAX_LEVEL, bondLevelFor } from './_bond.js';
import { soulLevel } from './_soulXP.js';
import { maxLevelFor } from './_duel.js';
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
 * Vínculo e NÍVEL DE LUTA de um save, numa só leitura do KV (o nível = o da ficha de duelo: `soulLevel` limitado pelo teto S1 `maxLevelFor`).
 * Save ausente/ilegível = `{ bond: 0, level: null }` (sem nível: cai na faixa de Vínculo).
 */
export async function bondELevelOf(env, saveId) {
  try {
    const { value, metadata } = await kvOrThrow(env).getWithMetadata(saveId);
    if (!value || typeof value !== 'string') return { bond: 0, level: null };
    const state = JSON.parse(value);
    if (!state || typeof state !== 'object') return { bond: 0, level: null };
    const level = Math.min(soulLevel(state), Math.max(1, Math.floor(maxLevelFor(metadata?.f, Date.now()))));
    return { bond: bondLevelFor(state.totalXP), level: Number.isFinite(level) ? level : null };
  } catch {
    return { bond: 0, level: null };
  }
}

/** Fatia da lista dos que lutam perto do NÍVEL do jogador (dono, 11/11/2026: "inimigos MAJORITARIAMENTE de nível similar"). Os demais (mais fortes/fracos) dão a variedade. */
export const SPAR_NEAR_SHARE = 0.75;
/** "Nível similar": dentro de ±10% do nível do jogador, no mínimo ±2 níveis (nos níveis baixos 10% seria menos que 1 nível). */
export const sparLevelWindow = (myLevel) => Math.max(2, Math.ceil(myLevel * 0.1));

/**
 * `pool`: `[{ bond: number, level?: number, ...resto }]`. Devolve os candidatos EMBARALHADOS. Com `myLevel` (e `level` nos itens) a lista é uma
 * MISTURA: com chance `SPAR_NEAR_SHARE` a próxima vaga vai para alguém de nível similar (`sparLevelWindow`, qualquer Vínculo), senão para
 * alguém da faixa de Vínculo (±`range`, ampliada até haver ao menos `n`) que NÃO é similar — a variedade. Dentro de cada grupo vale a
 * preferência de estágio (`ESTAGIO_PESOS`, que acompanha o poder). Sem `myLevel` (ou sem `level`) = o comportamento antigo (só Vínculo).
 * Quem chama fatia os `n` primeiros (e pode pular quem não luta). Pura: o `rng` vem de fora (`() => [0,1)`).
 */
/** @param {any[]} pool @param {number} myBond @param {() => number} rng @param {number} [n] @param {number} [range] @param {string | null} [myStage] @param {number | null} [myLevel] */
export function pickSparOpponents(pool, myBond, rng, n = SPAR_PICKS, range = SPAR_BOND_RANGE, myStage = null, myLevel = null) {
  const fin = v => (Number.isFinite(v) ? v : 1);
  const mine = fin(myBond);
  const lvl = typeof myLevel === 'number' && Number.isFinite(myLevel) ? myLevel : null;
  const byLevel = lvl !== null;
  const isNear = p => lvl !== null && Number.isFinite(p.level) && Math.abs(p.level - lvl) <= sparLevelWindow(lvl);
  const inBand = r => pool.filter(p => Math.abs(fin(p.bond) - mine) <= r);
  const total = c => c.length + pool.filter(p => isNear(p) && !c.includes(p)).length;
  let r = Math.max(0, range);
  let cand = inBand(r);
  while (total(cand) < n && cand.length < pool.length && r < BOND_MAX_LEVEL) {
    r += SPAR_RANGE_STEP;
    cand = inBand(r);
  }
  if (!byLevel) return ordenarPorEstagio(cand, myStage, rng, c => c.stage);
  const near = ordenarPorEstagio(pool.filter(isNear), myStage, rng, c => c.stage);
  const far = ordenarPorEstagio(cand.filter(p => !isNear(p)), myStage, rng, c => c.stage);
  const out = [];
  let i = 0, j = 0;
  while (i < near.length || j < far.length) {
    if (i < near.length && (j >= far.length || rng() < SPAR_NEAR_SHARE)) out.push(near[i++]); else out.push(far[j++]);
  }
  return out;
}

/** Honra desta vitória: 1 ou 2, a 50%. */
export const sparHonorRoll = rng => SPAR_HONOR_MIN + (rng() < 0.5 ? 0 : SPAR_HONOR_MAX - SPAR_HONOR_MIN);

export const sparHonorKey = (id, day) => `sparHonor:${id}:${day}`;
export const sparPendingKey = id => `spar:${id}`;
export const sparDoneKey = id => `sparDone:${id}`;

/**
 * Honra de treino já creditada no dia. Contador ausente/ilegível = 0; FALHA do KV propaga (Antislop P1, §374): tratar a falha
 * como 0 reabria o teto do dia e o `put` seguinte gravava por cima.
 */
export async function readSparHonorUsed(env, id, day) {
  const raw = await kvOrThrow(env).get(sparHonorKey(id, day));
  return Math.max(0, Math.min(SPAR_HONOR_DAILY_CAP, Math.floor(Number(raw)) || 0));
}

/**
 * Credita (no contador do dia, no servidor) a Honra de UMA vitória de treino e devolve o que o app deve somar.
 * `day` = dia do JOGADOR (`playerDayOf` de `_strays.js`; zona/offset que o app informa, sem informação = UTC). Nunca por tick: só quando o resultado foi liquidado. Leitura tolerante: contador ausente/ilegível = 0; falha do KV propaga.
 * `usedLido` (opcional): o contador já lido por quem chama (o `sparMatch` lê TUDO antes de apagar o duelo aberto).
 * @returns {Promise<{ honor: number, capped: boolean }>}
 */
export async function grantSparHonor(env, id, day, rng, usedLido) {
  const key = sparHonorKey(id, day);
  const used = Number.isFinite(usedLido) ? usedLido : await readSparHonorUsed(env, id, day);
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

/** Ausente/ilegível = zerado (`sanitizeSparTicket`); FALHA do KV propaga (Antislop P1, §374): zerar aqui apagava os extras pagos no `put` seguinte. */
export async function readSparTicket(env, id, day) {
  const raw = await kvOrThrow(env).get(sparTicketKey(id, day));
  return sanitizeSparTicket(raw);
}
const writeSparTicket = (env, id, day, t) => kvOrThrow(env).put(sparTicketKey(id, day), JSON.stringify(t), { expirationTtl: 172800 });

/**
 * Compra 1 ticket extra (a cobrança em Bits é do app). Recusa no teto: `{ ok:false }`.
 * DUAS FASES (QA 2026-11-11, médio 4): `phase:'reserve'` só confere o teto e abre uma reserva curta (`sparReserve:<id>:<dia>`, TTL
 * `SPAR_RESERVE_TTL_S`), SEM conceder; o app debita e só então chama `phase:'confirm'`, que concede UMA vez (idempotente: sem reserva
 * = `{ ok:false, reason:'no-reserve' }`). Sem `phase` = contrato antigo (concede direto), para cliente que ainda não conhece as fases.
 */
export const SPAR_RESERVE_TTL_S = 120;
export const sparReserveKey = (id, day) => `sparReserve:${id}:${day}`;
export async function buySparTicket(env, id, day, phase) {
  const t = await readSparTicket(env, id, day);
  if (phase === 'reserve') {
    if (t.extra >= TREINO_EXTRA_TICKETS_MAX) return { ok: false, status: sparTicketStatus(t) };
    await kvOrThrow(env).put(sparReserveKey(id, day), String(Date.now()), { expirationTtl: SPAR_RESERVE_TTL_S + 60 });
    return { ok: true, reserved: true, status: sparTicketStatus(t) };
  }
  if (phase === 'confirm') {
    // Falha do KV PROPAGA (Antislop P1, §374): virar 'no-reserve' respondia 409 com a reserva viva, e o app (que já debitou os
    // 30 Bits) não retenta 409. Exceção vira 500 da plataforma e `confirmSparTicketComRetry` repete.
    const raw = await kvOrThrow(env).get(sparReserveKey(id, day));
    const at = Number(raw);
    if (!Number.isFinite(at) || at <= 0 || Date.now() - at > SPAR_RESERVE_TTL_S * 1000) return { ok: false, reason: 'no-reserve', status: sparTicketStatus(t) };
    // A baixa da reserva PROPAGA (§381): engolida, a reserva continuava viva e um 2º confirm concedia outro extra sem cobrança.
    await kvOrThrow(env).delete(sparReserveKey(id, day));
  }
  if (t.extra >= TREINO_EXTRA_TICKETS_MAX) return { ok: false, status: sparTicketStatus(t) };
  const next = { ...t, extra: t.extra + 1 };
  await writeSparTicket(env, id, day, next);
  return { ok: true, status: sparTicketStatus(next) };
}

/**
 * DIA FIXO DA CONTA no Treino (QA 2026-11-11, médio 3). `zone`/`off` vêm do cliente a cada pedido; alternar entre +14 h e -14 h
 * dava 2-3 "dias" no mesmo instante. A âncora é PRENDIDA no servidor (`sparTz:<id>`) e só aceita trocar depois de
 * `SPAR_TZ_LOCK_MS` (viagem real), então os contadores de Honra e tickets seguem UM dia por conta.
 */
export const SPAR_TZ_LOCK_MS = 24 * 3600 * 1000;
/** Validade da âncora no KV e a idade a partir da qual ela é regravada (mesmo valor) para não vencer em conta ativa. */
export const SPAR_TZ_TTL_S = 60 * 86400;
export const SPAR_TZ_REFRESH_MS = 30 * 86400 * 1000;
export const sparTzKey = id => `sparTz:${id}`;
export async function fixarTzTreino(env, id, tz) {
  const kv = kvOrThrow(env);
  // Pedido SEM fuso prende o UTC (QA rodada 2, R2-T1): antes devolvia `{}` sem gravar, e o 1º fuso explícito que chegasse depois
  // virava a âncora, abrindo um 2º "dia" (+20 partidas com Honra) no mesmo instante. O app sempre manda `off`; só cliente editado não manda.
  const novo = tz && (tz.zone || tz.offsetMs !== undefined) ? tz : { offsetMs: 0 };
  // A leitura PROPAGA a falha do KV (Antislop P1, §374): o `try` antigo cobria o `get` e o parse juntos, e uma falha
  // transitória trocava a âncora travada pelo fuso do pedido. Só o JSON ilegível é tolerado (vira "sem âncora").
  const raw = await kv.get(sparTzKey(id));
  let atual = null;
  try { atual = raw ? JSON.parse(raw) : null; } catch { atual = null; }
  const valido = atual && typeof atual === 'object' && (atual.zone || Number.isFinite(atual.offsetMs));
  // A gravação PROPAGA (§381): engolida, a conta seguia sem âncora e o fuso do pedido seguinte abria outro "dia".
  const grava = async v => { await kv.put(sparTzKey(id), JSON.stringify({ ...v, at: Date.now() }), { expirationTtl: SPAR_TZ_TTL_S }); return v; };
  if (!valido) return grava(novo);
  const ancora = { ...(atual.zone ? { zone: atual.zone } : {}), ...(Number.isFinite(atual.offsetMs) ? { offsetMs: atual.offsetMs } : {}) };
  const igual = novo.zone === ancora.zone && novo.offsetMs === ancora.offsetMs;
  const idade = Date.now() - (Number(atual.at) || 0);
  if (!igual && idade >= SPAR_TZ_LOCK_MS) return grava(novo);
  // R2-T2: o TTL só contava da gravação, então a âncora vencia no dia 60 mesmo em conta ativa e o truque do R2-T1 voltava.
  // Regrava o MESMO valor a cada 30 dias (no máximo 1 escrita por mês por conta).
  if (idade >= SPAR_TZ_REFRESH_MS) return grava(ancora);
  return ancora;
}

/** Gasta 1 partida liquidada. `withHonor` = ainda cabia no ticket grátis (o servidor só paga Honra nesse caso).
 *  `lido` (opcional): o ticket já lido por quem chama (o `sparMatch` lê antes de apagar o duelo aberto). */
export async function spendSparMatch(env, id, day, lido) {
  const t = lido ? sanitizeSparTicket(lido) : await readSparTicket(env, id, day);
  const withHonor = t.played < TREINO_TICKET_MATCHES;
  const next = { ...t, played: t.played + 1 };
  await writeSparTicket(env, id, day, next);
  return { withHonor, status: sparTicketStatus(next) };
}
