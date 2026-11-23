// A JORNADA DO FOCO (§247): o servidor é o relógio e o caixa.
//
//   GET  /api/focus-journey?id=               → { active, ledger, grants, now }
//   POST /api/focus-journey?id= { action, … }  → start {mode, env, keys, day} | pause | resume | claim | end
//
// Dono autenticado (`authorizeSaveAccess`). Registro ativo em `fj:<id>`; razão do dia em `fjd:<id>:<dia>` com o que foi pago por
// recibo (`<sid>:<k>`, `<sid>:done`). Pagar é idempotente: o mesmo recibo nunca paga duas vezes, e o cliente credita no save só o
// recibo que ainda não está em `journeyCredited`. A 1ª conclusão do dia devolve a chave da masmorra (`dungeonKeyDay`).
import { authorizeSaveAccess } from './_auth.js';
import { kv } from './_kv.js';
import { VALID_ID } from './_entitlements.js';
import { recordMissionEvent } from './_missionEvents.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import {
  JOURNEY_KEYS, JOURNEY_MAX_PAUSES, JOURNEY_MODES, capLoot, chestLoot, completionLoot, emptyLedger, journeyChests, journeyProgress,
} from './_focusJourney.js';

const headers = { 'Cache-Control': 'no-store' };
const json = (body, status = 200) => Response.json(body, { status, headers });
const ENVS = ['forest', 'shore', 'cavern', 'garden', 'workshop', 'observatory'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TTL = 86400 * 3;

async function lerJson(store, key) {
  try { return JSON.parse((await store.get(key)) || 'null'); } catch { return null; }
}
async function lerRazao(store, id, day) {
  const r = await lerJson(store, `fjd:${id}:${day}`);
  const base = emptyLedger(day);
  if (!r || typeof r !== 'object') return { ...base, grants: {} };
  return {
    day, items: Number(r.items) || 0, ess: Number(r.ess) || 0, done: Number(r.done) || 0,
    claims: Array.isArray(r.claims) ? r.claims.filter(x => typeof x === 'string') : [],
    grants: r.grants && typeof r.grants === 'object' ? r.grants : {},
  };
}
const gravar = (store, key, v) => store.put(key, JSON.stringify(v), { expirationTtl: TTL });

/** O dia do jogador mandado pelo cliente vale se estiver a no máximo 1 dia do UTC do servidor. */
function diaValido(day, now) {
  if (typeof day !== 'string' || !DAY.test(day)) return false;
  return Math.abs(Date.parse(`${day}T12:00:00Z`) - now) <= 36 * 3_600_000;
}

/** Paga os baús alcançados e, com o foco completo e `concluir`, a conclusão. Muta `fj` e `razao`. */
function pagar(fj, razao, now, concluir) {
  const p = journeyProgress(fj, now);
  let dungeonKeyDay;
  let concluiu = false;
  for (const ch of journeyChests(fj.seed, fj.mode)) {
    if (ch.at > p) continue;
    const id = `${fj.sid}:${ch.k}`;
    const r = capLoot(razao, id, chestLoot(fj.seed, ch, fj.keys, fj.env));
    if (r.ledger !== razao) { Object.assign(razao, r.ledger); razao.grants[id] = r.granted; }
  }
  const doneId = `${fj.sid}:done`;
  if (concluir && p >= 1 && !razao.claims.includes(doneId)) {
    const nth = razao.done + 1;
    const r = capLoot(razao, doneId, completionLoot(fj.seed, nth, fj.env));
    Object.assign(razao, r.ledger, { done: nth });
    razao.grants[doneId] = r.granted;
    concluiu = true;
    if (nth === 1) dungeonKeyDay = fj.day;
  }
  return { progress: p, dungeonKeyDay, concluiu };
}

const publico = (razao) => ({ ledger: { day: razao.day, items: razao.items, ess: razao.ess, done: razao.done }, grants: razao.grants });

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!VALID_ID.test(id)) return json({ error: 'invalid id' }, 400);
  const g = takeToken('focus-journey', clientKey(request), { limit: 60, windowMs: 60_000 });
  if (!g.ok) return tooManyRequests(g.retryAfter);
  const auth = await authorizeSaveAccess(request, env, id);
  if (!auth.ok) return json({ error: auth.reason || 'forbidden' }, auth.status || 403);
  const store = kv(env);
  if (!store) return json({ error: 'Unavailable' }, 503);
  const now = Date.now();
  const fj = await lerJson(store, `fj:${id}`);

  if (request.method === 'GET') {
    const day = url.searchParams.get('day');
    const razao = await lerRazao(store, id, diaValido(day, now) ? day : (fj?.day ?? new Date(now).toISOString().slice(0, 10)));
    return json({ active: fj, ...publico(razao), now });
  }
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  let body = null;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  const action = body?.action;

  if (action === 'start') {
    if (fj) return json({ error: 'active', active: fj, now }, 409);
    const { mode, env: cena, keys, day } = body;
    if (!(mode in JOURNEY_MODES) || !ENVS.includes(cena) || !diaValido(day, now)) return json({ error: 'invalid' }, 400);
    const chaves = Array.isArray(keys) ? [...new Set(keys.filter(k => JOURNEY_KEYS.includes(k)))] : [];
    const rec = {
      sid: crypto.randomUUID().slice(0, 18), seed: crypto.getRandomValues(new Uint32Array(1))[0],
      mode, env: cena, keys: chaves, day, startAt: now, pausedMs: 0, pausedAt: null, pauses: 0,
    };
    await gravar(store, `fj:${id}`, rec);
    return json({ active: rec, now });
  }
  if (!fj) return json({ error: 'no-active' }, 404);

  if (action === 'pause') {
    if (fj.pausedAt === null && fj.pauses < JOURNEY_MAX_PAUSES && journeyProgress(fj, now) < 1) {
      fj.pausedAt = now; fj.pauses += 1;
      await gravar(store, `fj:${id}`, fj);
    }
    return json({ active: fj, now });
  }
  if (action === 'resume') {
    if (fj.pausedAt !== null) { fj.pausedMs += Math.max(0, now - fj.pausedAt); fj.pausedAt = null; await gravar(store, `fj:${id}`, fj); }
    return json({ active: fj, now });
  }
  if (action === 'claim' || action === 'end') {
    const razao = await lerRazao(store, id, fj.day);
    const { progress, dungeonKeyDay, concluiu } = pagar(fj, razao, now, action === 'claim');
    await gravar(store, `fjd:${id}:${fj.day}`, razao);
    // Semanal "Complete a Focus Workshop em 3 dias" (REGISTRO §309): o dia da jornada concluida COM recibo entra no razao (1 por dia). Melhor esforco.
    if (concluiu) { try { await recordMissionEvent(store, id, 'f', fj.day, now); } catch { /* o razao das missoes nao pode derrubar o pagamento */ } }
    const terminou = action === 'end' || (progress >= 1 && razao.claims.includes(`${fj.sid}:done`));
    if (terminou) await store.delete(`fj:${id}`);
    return json({ active: terminou ? null : fj, ...publico(razao), ...(dungeonKeyDay ? { dungeonKeyDay } : {}), now });
  }
  return json({ error: 'unknown action' }, 400);
}
