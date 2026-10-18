// ---------------------------------------------------------------------------
// A PRAÇA DO CLÃ (D-10, D-11). Ambiente coletivo com 4 slots de decoração e o
// PRESENTE diário entre membros. Tudo ADITIVO: chaves KV próprias (`claPraca*`),
// nenhum campo do blob do grupo é tocado.
//
// REGRAS:
//  · qualquer membro põe/troca/tira um item de decoração em qualquer slot; o
//    servidor guarda QUEM pôs (`by`, saveId — a vista só devolve o id opaco);
//  · PRESENTE: A -> B sem custo, 1x por dia do jogador por par (A->B). O 2º
//    envio no mesmo dia é 409. O SERVIDOR sorteia o item (o remetente nunca
//    escolhe nem vê). B resgata (claim) e o app aplica no save;
//  · G-01 (dar recurso sem tarefa é "perdão extra"): chip + comida somam <= 5%
//    da tabela (`PRESENTE_PESOS`, há teste); o comum é decoração e moeda pequena;
//  · escritor único por chave: `claPresOut` só o remetente escreve, `claPresIn`
//    só o destinatário escreve, o blob dos slots é last-write-wins (decoração).
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { CASA_ITEM_RE } from './_casa.js';

export const PRACA_TTL = 86400 * 120;
export const PRACA_SLOTS = 4;
/** Um presente fica à espera de B por este número de dias do jogador (incluindo o do envio). */
export const PRESENTE_VALE_DIAS = 3;
export const PRESENTE_RESGATADOS_MAX = 60;

export const pracaKey = gid => `claPraca:${gid}`;
export const presOutKey = (gid, from, to) => `claPresOut:${gid}:${from}:${to}`;
export const presInKey = (gid, to) => `claPresIn:${gid}:${to}`;

/** Decorações de presente (ids existentes em `utils/shop.ts`, cosméticos de loja). */
export const PRESENTE_DECOR = Object.freeze([
  'furn-plant', 'furn-lamp', 'furn-books', 'furn-rug', 'furn-picture', 'furn-lantern',
  'furn-mushrooms', 'furn-rock', 'furn-campfire', 'furn-food-bowl',
]);
export const PRESENTE_BITS_MIN = 5;
export const PRESENTE_BITS_MAX = 15;
export const PRESENTE_CHIPS = Object.freeze(['chip-power', 'chip-harmony', 'chip-benevolence']);

/**
 * Tabela de pesos (soma 1000). chip 2,5% + comida 2,5% = 5,0% (teto G-01).
 * Mexer aqui exige manter `chip + comida <= 50`; o teste reprova.
 */
export const PRESENTE_PESOS = Object.freeze({ decor: 560, bits: 390, chip: 25, food: 25 });

/** RNG de produção (Web Crypto). Nos testes, passe um RNG com seed. */
export function rngSeguro() {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] / 4294967296;
}

/** Escolhe uma chave de `{k: peso}` com `r` em [0,1). Determinístico dado `r`. */
export function sortearPonderado(pesos, r) {
  const ks = Object.keys(pesos);
  const total = ks.reduce((s, k) => s + pesos[k], 0);
  let x = Math.min(Math.max(r, 0), 0.999999999) * total;
  for (const k of ks) { if (x < pesos[k]) return k; x -= pesos[k]; }
  return ks[ks.length - 1];
}

/**
 * Sorteia UM presente. `rng()` devolve [0,1). Forma: `{kind:'decor',id}` |
 * `{kind:'bits',amount}` | `{kind:'chip',id}` | `{kind:'food'}`.
 */
export function sortearPresente(rng = rngSeguro) {
  const kind = sortearPonderado(PRESENTE_PESOS, rng());
  if (kind === 'decor') return { kind, id: PRESENTE_DECOR[Math.floor(rng() * PRESENTE_DECOR.length) % PRESENTE_DECOR.length] };
  if (kind === 'bits') return { kind, amount: PRESENTE_BITS_MIN + (Math.floor(rng() * (PRESENTE_BITS_MAX - PRESENTE_BITS_MIN + 1)) % (PRESENTE_BITS_MAX - PRESENTE_BITS_MIN + 1)) };
  if (kind === 'chip') return { kind, id: PRESENTE_CHIPS[Math.floor(rng() * PRESENTE_CHIPS.length) % PRESENTE_CHIPS.length] };
  return { kind: 'food' };
}

/** Item de presente vindo do KV (não confiável) -> forma válida ou null. */
export function normalizarPresente(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.kind === 'decor' && PRESENTE_DECOR.includes(p.id)) return { kind: 'decor', id: p.id };
  if (p.kind === 'bits' && Number.isInteger(p.amount) && p.amount >= PRESENTE_BITS_MIN && p.amount <= PRESENTE_BITS_MAX) return { kind: 'bits', amount: p.amount };
  if (p.kind === 'chip' && PRESENTE_CHIPS.includes(p.id)) return { kind: 'chip', id: p.id };
  if (p.kind === 'food') return { kind: 'food' };
  return null;
}

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
const numDia = d => Math.round(Date.parse(`${d}T00:00:00Z`) / 86400000);

/** O presente de `day` ainda vale em `hoje`? (janela de `PRESENTE_VALE_DIAS`). */
export const presenteVale = (day, hoje) => DIA_RE.test(day) && numDia(hoje) - numDia(day) >= 0 && numDia(hoje) - numDia(day) < PRESENTE_VALE_DIAS;

const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };

// ------------------------------- slots -------------------------------------

export function normalizarPraca(r) {
  const arr = Array.isArray(r?.slots) ? r.slots : [];
  const slots = Array.from({ length: PRACA_SLOTS }, (_, i) => {
    const s = arr[i];
    if (!s || typeof s.item !== 'string' || !CASA_ITEM_RE.test(s.item)) return null;
    return { item: s.item, by: typeof s.by === 'string' ? s.by : null, day: typeof s.day === 'string' ? s.day : null };
  });
  return { v: 1, slots };
}

export async function lerPraca(env, gid) {
  return normalizarPraca(parse(await kvOrThrow(env).get(pracaKey(gid))));
}

/**
 * Põe (ou tira, com `item === null`) o item de um slot 0..3.
 * Devolve `undefined` se slot/item são inválidos.
 */
export async function definirSlotPraca(env, gid, save, day, slot, item) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= PRACA_SLOTS) return undefined;
  if (item !== null && !(typeof item === 'string' && CASA_ITEM_RE.test(item))) return undefined;
  const p = await lerPraca(env, gid);
  p.slots[slot] = item === null ? null : { item, by: save, day };
  await kvOrThrow(env).put(pracaKey(gid), JSON.stringify(p), { expirationTtl: PRACA_TTL });
  return p;
}

// ------------------------------ presente -----------------------------------

async function lerSaida(env, gid, from, to) {
  const r = parse(await kvOrThrow(env).get(presOutKey(gid, from, to)));
  const gifts = (Array.isArray(r?.gifts) ? r.gifts : [])
    .map(g => ({ day: g?.day, item: normalizarPresente(g?.item) }))
    .filter(g => DIA_RE.test(g.day) && g.item);
  return { gifts };
}

async function lerResgatados(env, gid, to) {
  const r = parse(await kvOrThrow(env).get(presInKey(gid, to)));
  return { claimed: (Array.isArray(r?.claimed) ? r.claimed : []).filter(x => typeof x === 'string').slice(-PRESENTE_RESGATADOS_MAX) };
}

export const idDoPresente = (from, day) => `${from}|${day}`;

/**
 * A envia a B. 1x por dia por par. O servidor sorteia. Devolve
 * `{ ok:true }` ou `{ ok:false, reason:'self'|'already-sent' }`.
 */
export async function enviarPresente(env, gid, from, to, day, rng = rngSeguro) {
  if (from === to) return { ok: false, reason: 'self' };
  const s = await lerSaida(env, gid, from, to);
  if (s.gifts.some(g => g.day === day)) return { ok: false, reason: 'already-sent' };
  const item = sortearPresente(rng);
  const gifts = [...s.gifts.filter(g => presenteVale(g.day, day)), { day, item }].slice(-PRESENTE_VALE_DIAS);
  await kvOrThrow(env).put(presOutKey(gid, from, to), JSON.stringify({ v: 1, gifts }), { expirationTtl: 86400 * (PRESENTE_VALE_DIAS + 1) });
  return { ok: true };
}

/** Quem eu já presenteei HOJE (saves). Só leituras do que EU escrevi. */
export async function enviadosHoje(env, gid, from, members, day) {
  const out = [];
  for (const to of members) {
    if (to === from) continue;
    if ((await lerSaida(env, gid, from, to)).gifts.some(g => g.day === day)) out.push(to);
  }
  return out;
}

/** Presentes à espera de `to`: `[{ from, day, item }]`, do mais antigo ao mais novo. */
export async function presentesPendentes(env, gid, to, members, hoje) {
  const { claimed } = await lerResgatados(env, gid, to);
  const lista = [];
  for (const from of members) {
    if (from === to) continue;
    for (const g of (await lerSaida(env, gid, from, to)).gifts) {
      if (presenteVale(g.day, hoje) && !claimed.includes(idDoPresente(from, g.day))) lista.push({ from, day: g.day, item: g.item });
    }
  }
  return lista.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/**
 * B resgata o presente de `from` do `day`. Devolve `{ ok:true, item, receipt }`
 * ou `{ ok:false }` (nada a resgatar / já resgatado). O recibo é determinístico
 * por presente: o app credita UMA vez por recibo (mesmo cuidado do `guildClaim`).
 */
export async function resgatarPresente(env, gid, to, members, from, day, hoje) {
  const p = (await presentesPendentes(env, gid, to, members, hoje)).find(x => x.from === from && x.day === day);
  if (!p) return { ok: false };
  const { claimed } = await lerResgatados(env, gid, to);
  const id = idDoPresente(from, day);
  await kvOrThrow(env).put(presInKey(gid, to), JSON.stringify({ v: 1, claimed: [...claimed, id].slice(-PRESENTE_RESGATADOS_MAX) }), { expirationTtl: PRACA_TTL });
  return { ok: true, item: p.item, receipt: id };
}

/**
 * A VISTA da praça. `ids`: `{ [save]: idOpaco }`. Nunca sai saveId. O presente
 * pendente mostra de quem veio (id opaco) e o item; `mine.sentToday` lista os
 * ids opacos que EU já presenteei hoje.
 */
export async function vistaDaPraca(env, gid, eu, members, ids, hoje) {
  const praca = await lerPraca(env, gid);
  const pend = await presentesPendentes(env, gid, eu, members, hoje);
  const enviados = await enviadosHoje(env, gid, eu, members, hoje);
  return {
    slots: praca.slots.map((s, i) => (s ? { slot: i, item: s.item, by: s.by && ids[s.by] ? ids[s.by] : null, mine: s.by === eu } : { slot: i, item: null, by: null, mine: false })),
    gifts: pend.map(p => ({ from: ids[p.from], day: p.day, item: p.item, id: `${ids[p.from]}|${p.day}` })),
    mine: { sentToday: enviados.map(s => ids[s]) },
  };
}
