/**
 * EVENTOS CONFIRMADOS DAS MISSÕES (12/11/2026, REGISTRO §309): o servidor guarda o que VIU acontecer e reconfere o save contra isso.
 *
 * As semanais `journal-days` e `focus-days`, a de presente `gift-sent` e a diária `d-presente` eram contadas SÓ no app (o save é
 * local-first). Agora cada uma tem um evento que o servidor presenciou, num razão por semana (`mval:<id>:<semana>:<tipo>`):
 *   · `j` journal — dias com uma entrada do Caderno SALVA (o servidor vê só o `day`/`id` da entrada, nunca o texto; a entrada
 *     viaja no mesmo POST do save, então o razão é gravado antes da conferência);
 *   · `f` foco    — dias em que a jornada do foco foi CONCLUÍDA com recibo (`/api/focus-journey`, o `<sid>:done` do razão `fjd:`);
 *   · `g` presente — presentes ACEITOS pelo servidor (`/api/community?action=gift`), contagem por dia do remetente.
 *
 * `enforceMissionEvents` roda no POST do save e só aperta o que chega:
 *   · contagem = max(gravado, min(recebido, confirmado)) — nunca sobe além do que o razão confirma, nunca desce abaixo do já gravado
 *     (monotônico: o progresso legítimo anterior à regra e o resgate já pago não somem);
 *   · resgate (`claimed`) novo só entra com a contagem confirmada >= alvo; o já gravado fica (nada paga de novo, nada é revogado);
 *   · 1 contagem por dia no máximo para journal e foco: o razão é uma lista de DIAS sem repetição;
 *   · a chave legada `friend-visit` (virou `gift-sent`) só vale se já estava gravada, senão seria um atalho para o contador novo.
 * Limite honesto (como `_dayCounters.js`): o saldo de Emblemas é escrito pelo cliente; o servidor garante o PROGRESSO e o RESGATE
 * registrados no save, não o saldo. Pages Functions não importam de `src/`: alvos e ids são copiados e travados por
 * `missionEvents.parity.test.js`.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_KEY = /^\d{4}-W\d{2}$/;
const DAY_MS = 86_400_000;
const LEDGER_TTL = 86_400 * 45;
const GIFT_DAY_CAP = 99;

/** Semanais validadas: id -> tipo do razão + alvo (espelho de `weeklyMissions.ts`). */
export const WEEKLY_VALIDATED = {
  'journal-days': { kind: 'j', target: 3 },
  'focus-days': { kind: 'f', target: 3 },
  'gift-sent': { kind: 'g', target: 1 },
};
/** A diária validada: id, evento e alvo (espelho de `dailyMissions.ts`). */
export const DAILY_VALIDATED = { id: 'd-presente', event: 'presente', target: 1 };
/** Missoes de NPC que contam o MESMO evento `presente` (12/11/2026, REGISTRO secao 314): Zumi (2) e Papus (1); espelho de `npcMissions.ts`. */
export const DAILY_VALIDATED_EXTRA = [
  { id: 'n-zumi', event: 'presente', target: 2 },
  { id: 'n-papus', event: 'presente', target: 1 },
];
/** Id antigo de `gift-sent` (migração do app, 11/11/2026). */
export const LEGACY_WEEKLY = 'friend-visit';

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/** @param {unknown} v @returns {v is Record<string, any>} */
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Dia ISO de um dia do app: `YYYY-MM-DD` ou o `toDateString()` do dia do jogador ("Wed Nov 11 2026"); inválido = null. */
export function toIsoDay(v) {
  if (typeof v !== 'string' || v.length === 0 || v.length > 40) return null;
  if (ISO_DAY.test(v)) {
    const t = Date.parse(`${v}T00:00:00Z`);
    return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v ? v : null;
  }
  const t = Date.parse(`${v} UTC`);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

/** Semana ISO 8601 de um dia ISO (espelho de `isoWeekKey`, `src/utils/offerMoment.ts`). */
export function isoWeekOf(isoDay) {
  const t = Date.parse(`${isoDay}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3);
  const isoYear = d.getUTCFullYear();
  const ft = new Date(Date.UTC(isoYear, 0, 4));
  ft.setUTCDate(ft.getUTCDate() - ((ft.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((d.getTime() - ft.getTime()) / (7 * DAY_MS));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

const key = (saveId, week, kind) => `mval:${saveId}:${week}:${kind}`;

async function lerRazao(store, saveId, week, kind) {
  let raw = null;
  try { raw = JSON.parse((await store.get(key(saveId, week, kind))) || 'null'); } catch { raw = null; }
  if (kind === 'g') {
    const out = {};
    if (isObj(raw)) for (const [d, n] of Object.entries(raw)) if (ISO_DAY.test(d) && Number.isFinite(n) && n > 0) out[d] = Math.min(GIFT_DAY_CAP, Math.floor(n));
    return out;
  }
  return Array.isArray(raw) ? [...new Set(raw.filter((d) => typeof d === 'string' && ISO_DAY.test(d)))] : [];
}

/** A janela do dia aceito: o `strict` vale ±36 h do relógio do servidor (foco/presente, que gravam no ato); o `lax` aceita até 7 dias para trás (journal salvo offline e sincronizado depois). */
function diaAceito(isoDay, nowMs, lax) {
  const t = Date.parse(`${isoDay}T12:00:00Z`);
  if (!Number.isFinite(t)) return false;
  return t <= nowMs + 36 * 3_600_000 && t >= nowMs - (lax ? 8 * DAY_MS : 36 * 3_600_000);
}

/**
 * Registra UM evento confirmado. `j`/`f`: o dia entra uma vez (idempotente); `g`: soma 1 no dia (teto 99).
 * Devolve `true` se gravou algo novo. Melhor esforço para o chamador (um erro de KV aqui não pode derrubar o foco, o presente ou o save).
 * @param {{get: Function, put: Function}} store @param {string} saveId @param {'j'|'f'|'g'} kind @param {string} dia ISO ou dia do jogador @param {number} [nowMs]
 */
export async function recordMissionEvent(store, saveId, kind, dia, nowMs = Date.now()) {
  const iso = toIsoDay(dia);
  if (!iso || !diaAceito(iso, nowMs, kind === 'j')) return false;
  const week = isoWeekOf(iso);
  if (!week) return false;
  const atual = await lerRazao(store, saveId, week, kind);
  if (kind === 'g') {
    const n = atual[iso] ?? 0;
    if (n >= GIFT_DAY_CAP) return false;
    await store.put(key(saveId, week, kind), JSON.stringify({ ...atual, [iso]: n + 1 }), { expirationTtl: LEDGER_TTL });
    return true;
  }
  const dias = /** @type {string[]} */ (atual);
  if (dias.includes(iso)) return false;
  await store.put(key(saveId, week, kind), JSON.stringify([...dias, iso].sort()), { expirationTtl: LEDGER_TTL });
  return true;
}

/** Journal: registra os dias das entradas do Caderno que chegaram no save (só `day`; o texto nunca é lido). @param {unknown} caderno */
export async function recordJournalDays(store, saveId, caderno, nowMs = Date.now()) {
  if (!Array.isArray(caderno)) return;
  const dias = new Set();
  for (const e of caderno) {
    const d = isObj(e) ? toIsoDay(e.day) : null;
    if (d && diaAceito(d, nowMs, true)) dias.add(d);
  }
  for (const d of dias) await recordMissionEvent(store, saveId, 'j', d, nowMs);
}

/** O que o servidor confirma na semana: { 'journal-days': n, 'focus-days': n, 'gift-sent': n } (lê só os tipos pedidos). */
async function confirmadoSemana(store, saveId, week, ids) {
  const out = {};
  for (const id of ids) {
    const { kind } = WEEKLY_VALIDATED[id];
    const r = await lerRazao(store, saveId, week, kind);
    out[id] = kind === 'g' ? Object.values(r).reduce((a, n) => a + n, 0) : r.length;
  }
  return out;
}

/** @param {unknown} counts @param {string} id */
const cnt = (counts, id) => (isObj(counts) && Number.isFinite(counts[id]) && counts[id] > 0 ? Math.floor(counts[id]) : 0);
/** @param {unknown} v @returns {string[]} */
const lista = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

/**
 * Aperta `weeklyMissions` contra o razão. `gravado` = o `weeklyMissions` do save já gravado. Devolve o objeto a gravar (ou o que veio, sem forma).
 * @param {unknown} incoming @param {unknown} gravado
 */
export async function enforceWeeklyMissions(store, saveId, incoming, gravado) {
  if (!isObj(incoming) || typeof incoming.week !== 'string' || !WEEK_KEY.test(incoming.week)) return incoming;
  const base = isObj(gravado) && gravado.week === incoming.week ? gravado : { counts: {}, claimed: [] };
  const baseCounts = isObj(base.counts) ? base.counts : {};
  const baseClaimed = lista(base.claimed);
  const counts = isObj(incoming.counts) ? { ...incoming.counts } : {};
  let claimed = lista(incoming.claimed);
  // `friend-visit` (legado): só vale o que já estava gravado, senão migraria para `gift-sent` sem evento.
  if (has(counts, LEGACY_WEEKLY)) {
    const g = cnt(baseCounts, LEGACY_WEEKLY);
    if (g > 0) counts[LEGACY_WEEKLY] = Math.min(cnt(counts, LEGACY_WEEKLY), g); else delete counts[LEGACY_WEEKLY];
  }
  claimed = claimed.filter((x) => x !== LEGACY_WEEKLY || baseClaimed.includes(LEGACY_WEEKLY));
  const ids = Object.keys(WEEKLY_VALIDATED).filter((id) => cnt(counts, id) > 0 || claimed.includes(id));
  const confirmado = ids.length ? await confirmadoSemana(store, saveId, incoming.week, ids) : {};
  const legado = (id) => (id === 'gift-sent' ? cnt(baseCounts, LEGACY_WEEKLY) : 0);
  for (const id of Object.keys(WEEKLY_VALIDATED)) {
    const { target } = WEEKLY_VALIDATED[id];
    const baseN = Math.max(cnt(baseCounts, id), legado(id));
    const n = Math.max(baseN, Math.min(cnt(counts, id), confirmado[id] ?? 0));
    if (n > 0) counts[id] = n; else delete counts[id];
    const pagoAntes = baseClaimed.includes(id) || (id === 'gift-sent' && baseClaimed.includes(LEGACY_WEEKLY));
    if (claimed.includes(id) && !pagoAntes && n < target) claimed = claimed.filter((x) => x !== id);
  }
  return { ...incoming, counts, claimed: [...new Set(claimed)] };
}

/**
 * Aperta `dailyMissions` contra o razão de presentes (`d-presente`). `gravado` = o `dailyMissions` já gravado.
 * @param {unknown} incoming @param {unknown} gravado
 */
export async function enforceDailyMissions(store, saveId, incoming, gravado) {
  if (!isObj(incoming) || typeof incoming.day !== 'string') return incoming;
  const { event } = DAILY_VALIDATED;
  const todas = [DAILY_VALIDATED, ...DAILY_VALIDATED_EXTRA];
  const counts = isObj(incoming.counts) ? { ...incoming.counts } : {};
  let claimed = lista(incoming.claimed);
  if (cnt(counts, event) === 0 && !todas.some((v) => claimed.includes(v.id))) return incoming;
  const baseMesmoDia = isObj(gravado) && gravado.day === incoming.day;
  const baseN = baseMesmoDia ? cnt(gravado.counts, event) : 0;
  const pagoAntes = (id) => baseMesmoDia && lista(gravado.claimed).includes(id);
  const iso = toIsoDay(incoming.day);
  const week = iso ? isoWeekOf(iso) : null;
  const confirmado = iso && week ? ((await lerRazao(store, saveId, week, 'g'))[iso] ?? 0) : 0;
  const n = Math.max(baseN, Math.min(cnt(counts, event), confirmado));
  if (n > 0) counts[event] = n; else delete counts[event];
  for (const v of todas) if (claimed.includes(v.id) && !pagoAntes(v.id) && n < v.target) claimed = claimed.filter((x) => x !== v.id);
  return { ...incoming, counts, claimed: [...new Set(claimed)] };
}
