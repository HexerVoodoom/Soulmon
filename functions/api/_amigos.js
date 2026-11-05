// Amizade por convite (§243). O servidor é a única autoridade: a lista `friends` do PERFIL (saveIds) é a verdade
// e agora é MÚTUA. Ninguém entra na lista de outro sem ele aceitar.
//
// Chaves (todas por saveId, nunca saem em resposta pública):
//   freq:<saveId>   → { in: [{ from, at }], out: [saveId] }   convites recebidos e enviados, pendentes
//   gsent:<saveId>  → { day, to: [saveId] }                   presentes que ESTA conta já mandou hoje (UTC)
//   gnote:<saveId>  → { items: [{ name, bits, at }], seenAt } histórico de quem presenteou (a fila `gifts:` é destrutiva)

import { kvOrThrow } from './_kv.js';
import { getProfile, putProfile } from './_profile.js';
import { playerDayOf } from './_strays.js';

export const MAX_FRIENDS = 20;
/** Convites pendentes: enviados por uma conta e guardados para uma conta (spam e custo). */
export const MAX_OUT = 20;
export const MAX_IN = 30;
export const MAX_NOTES = 30;
export const GIFT_BITS = 20;
/** Teto de Bits que UMA conta recebe de presentes por dia do jogador dela; o excedente não credita. */
export const GIFT_DAILY_CAP = 100;
const TTL = 86400 * 400;

export const reqKey = id => `freq:${id}`;
export const sentKey = id => `gsent:${id}`;
export const noteKey = id => `gnote:${id}`;

/** Âncora do dia do jogador vinda do cliente (`zone` IANA ou `off` em ms); inválida = UTC. */
export function tzDe(zone, off) {
  const z = typeof zone === 'string' && zone.length <= 64 ? zone : undefined;
  const o = off === null || off === undefined || off === '' ? NaN : Number(off);
  return { ...(z ? { zone: z } : {}), ...(Number.isFinite(o) ? { offsetMs: o } : {}) };
}
export const diaDe = tz => playerDayOf(Date.now(), tz);
export const tzKey = id => `gtz:${id}`;
export const recvKey = id => `grecv:${id}`;
const lerJson = async (env, key, vazio) => {
  try {
    const raw = await kvOrThrow(env).get(key);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v === 'object' ? v : vazio;
  } catch { return vazio; }
};
const gravar = (env, key, v) => kvOrThrow(env).put(key, JSON.stringify(v), { expirationTtl: TTL });
const ids = a => (Array.isArray(a) ? a.filter(x => typeof x === 'string') : []);

export async function lerConvites(env, id) {
  const v = await lerJson(env, reqKey(id), { in: [], out: [] });
  return {
    in: (Array.isArray(v.in) ? v.in : []).filter(r => r && typeof r.from === 'string'),
    out: ids(v.out),
  };
}
export const gravarConvites = (env, id, v) => gravar(env, reqKey(id), { in: v.in.slice(-MAX_IN), out: v.out.slice(-MAX_OUT) });

/** Presentes mandados hoje por `id` (vazio na virada do dia). */
export async function presentesDeHoje(env, id, dia) {
  const v = await lerJson(env, sentKey(id), { day: '', to: [] });
  return v.day === dia ? ids(v.to) : [];
}
export async function marcarPresenteDeHoje(env, id, friendSave, dia) {
  const to = await presentesDeHoje(env, id, dia);
  if (!to.includes(friendSave)) to.push(friendSave);
  await gravar(env, sentKey(id), { day: dia, to });
}

/** Guarda a âncora de dia de uma conta (o teto de recebimento é medido no dia de QUEM recebe). */
export async function lembrarTz(env, id, tz) {
  if (!tz || (!tz.zone && tz.offsetMs === undefined)) return;
  const atual = await lerJson(env, tzKey(id), {});
  if (atual.zone === tz.zone && atual.offsetMs === tz.offsetMs) return;
  await gravar(env, tzKey(id), tz);
}
export async function lerTz(env, id) {
  const v = await lerJson(env, tzKey(id), {});
  return tzDe(v.zone, v.offsetMs);
}
/**
 * Reserva no teto diário de quem recebe: devolve quantos Bits valem de fato (0..bits). O excedente NÃO credita.
 * O contador é do dia do destinatário; chamar sob o lock do destinatário.
 */
export async function reservarRecebimento(env, id, bits) {
  const dia = diaDe(await lerTz(env, id));
  const v = await lerJson(env, recvKey(id), { day: '', bits: 0 });
  const ja = v.day === dia ? Math.max(0, Math.floor(Number(v.bits) || 0)) : 0;
  const credita = Math.max(0, Math.min(bits, GIFT_DAILY_CAP - ja));
  await gravar(env, recvKey(id), { day: dia, bits: ja + credita });
  return credita;
}

export async function lerNotas(env, id) {
  const v = await lerJson(env, noteKey(id), { items: [], seenAt: 0 });
  const items = (Array.isArray(v.items) ? v.items : [])
    .filter(n => n && Number.isFinite(+n.at))
    .map(n => ({ name: typeof n.name === 'string' ? n.name.slice(0, 40) : '', bits: Number.isFinite(Number(n.bits)) && Number(n.bits) >= 0 ? Math.floor(Number(n.bits)) : GIFT_BITS, at: +n.at }));
  return { items, seenAt: Number(v.seenAt) > 0 ? Number(v.seenAt) : 0 };
}
export async function anotarPresente(env, id, { name, bits = GIFT_BITS, at = Date.now() }) {
  const n = await lerNotas(env, id);
  n.items.push({ name: String(name || '').slice(0, 40), bits, at });
  await gravar(env, noteKey(id), { items: n.items.slice(-MAX_NOTES), seenAt: n.seenAt });
}
export async function marcarNotasVistas(env, id) {
  const n = await lerNotas(env, id);
  await gravar(env, noteKey(id), { items: n.items, seenAt: Date.now() });
}

const simulado = p => !!p && p.simulated === true;

/**
 * Liga os dois lados. Devolve `{ ok }` ou `{ erro }` (`mine-full` | `theirs-full`). Idempotente: já amigos = ok.
 * Simulado nunca entra em lista de ninguém por esta via.
 */
export async function ligarAmizade(env, a, b) {
  const pa = await getProfile(env, a);
  const pb = await getProfile(env, b);
  if (!pa || !pb || simulado(pa) || simulado(pb)) return { erro: 'not found' };
  pa.friends = ids(pa.friends);
  pb.friends = ids(pb.friends);
  const temA = pa.friends.includes(b);
  const temB = pb.friends.includes(a);
  if (!temA && pa.friends.length >= MAX_FRIENDS) return { erro: 'mine-full' };
  if (!temB && pb.friends.length >= MAX_FRIENDS) return { erro: 'theirs-full' };
  if (!temA) { pa.friends.push(b); await putProfile(env, a, pa); }
  if (!temB) { pb.friends.push(a); await putProfile(env, b, pb); }
  return { ok: true };
}

/** Desfaz nos DOIS lados e cancela qualquer convite pendente entre os dois. Idempotente. */
export async function desfazerAmizade(env, a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const p = await getProfile(env, x);
    if (p && ids(p.friends).includes(y)) { p.friends = ids(p.friends).filter(f => f !== y); await putProfile(env, x, p); }
    const c = await lerConvites(env, x);
    if (c.in.some(r => r.from === y) || c.out.includes(y)) {
      await gravarConvites(env, x, { in: c.in.filter(r => r.from !== y), out: c.out.filter(f => f !== y) });
    }
  }
}

/**
 * Migração idempotente (sem apagar nada): quem consta na lista de `saveId` passa a ter `saveId` na própria lista.
 * Quem está cheio (20) ou é simulado fica como estava. Devolve quantos espelhou e quantos pulou.
 */
export async function espelharAmizades(env, saveId) {
  const eu = await getProfile(env, saveId);
  let espelhados = 0;
  let pulados = 0;
  if (!eu || simulado(eu)) return { espelhados, pulados };
  for (const f of ids(eu.friends)) {
    const outro = await getProfile(env, f);
    if (!outro || simulado(outro)) { pulados++; continue; }
    const lista = ids(outro.friends);
    if (lista.includes(saveId)) continue;
    if (lista.length >= MAX_FRIENDS) { pulados++; continue; }
    outro.friends = [...lista, saveId];
    await putProfile(env, f, outro);
    espelhados++;
  }
  return { espelhados, pulados };
}
