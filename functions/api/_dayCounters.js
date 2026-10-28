/**
 * Contadores DIÁRIOS do save que o servidor guarda MONOTÔNICOS (beta-2 itens 6.1 e 4.1; REGISTRO §40):
 *   · `dungeonDaily { day, layers }` — camadas da masmorra COMEÇADAS no dia do jogador (limite diário, `src/utils/dungeonIdle.ts`);
 *   · `checkIns { day, claimed[] }`  — janelas de check-in já resgatadas no dia do jogador (`src/utils/checkIns.ts`).
 *
 * O QUE ISTO É — e o limite honesto. O save é local-first e escrito pelo cliente (ADR-006 §D5: o servidor não conhece o `GameState`),
 * então o servidor NÃO valida a descida nem decide o dia do jogador. O que ele faz é a única coisa que dá para fazer sem mover o
 * save para cá: LEMBRAR. Um contador diário só pode crescer dentro do mesmo dia e o dia só pode andar para a frente:
 *   · mesmo dia  → `layers = max(recebido, gravado)` / `claimed = união` — apagar o save local, voltar o contador ou reinstalar o app
 *     e subir a versão "limpa" NÃO devolve camada nem janela;
 *   · dia anterior ao gravado → mantém o gravado (relógio que voltou não reabre o dia);
 *   · dia mais de 1 dia à frente do dia do SERVIDOR → recusado (mantém o gravado): adiantar o relógio do aparelho só reabre o contador
 *     até o dia seguinte do servidor, nunca semanas à frente (fusos vão de UTC−12 a UTC+14, então "+1 dia" é a folga mínima honesta);
 *   · campo ausente/lixo no que chegou → mantém o gravado (omitir o campo não é um jeito de zerá-lo).
 * Não cobre: quem edita o relógio E o save no mesmo dia do servidor para o PRÓXIMO dia (ganha, no máximo, UM dia de contador por dia
 * de relógio adiantado, e os Bits/XP seguem presos aos tetos diários próprios). Pages Functions não importam de `src/`: a FORMA é
 * copiada e travada por `dayCounters.parity.test.js`.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** Mesmo teto de `DUNGEON_MAX_LAYER` (`src/utils/dungeonIdle.ts`). */
export const DUNGEON_MAX_LAYER = 999;
export const CHECKIN_SLOTS = ['morning', 'afternoon', 'night'];

/** Dia ISO (UTC) de um instante. */
export function isoDayUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** O dia mais à frente que o servidor aceita: o dele + 1. */
export function maxAcceptableDay(nowMs = Date.now()) {
  return isoDayUtc(nowMs + DAY_MS);
}

/** @param {unknown} raw @returns {{day:string,layers:number}|undefined} */
export function sanitizeDungeonDaily(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {{day?:unknown,layers?:unknown}} */ (raw);
  if (typeof r.day !== 'string' || !ISO_DAY.test(r.day) || typeof r.layers !== 'number' || !Number.isFinite(r.layers)) return undefined;
  return { day: r.day, layers: Math.min(DUNGEON_MAX_LAYER, Math.max(0, Math.floor(r.layers))) };
}

/** @param {unknown} raw @returns {{day:string,claimed:string[]}|undefined} */
export function sanitizeCheckIns(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {{day?:unknown,claimed?:unknown}} */ (raw);
  if (typeof r.day !== 'string' || !ISO_DAY.test(r.day)) return undefined;
  const claimed = Array.isArray(r.claimed) ? CHECKIN_SLOTS.filter(s => /** @type {unknown[]} */ (r.claimed).includes(s)) : [];
  return { day: r.day, claimed };
}

/** Espelho de `sanitizeArenaReroll` (`src/utils/arenaSorteio.ts`, 28/10/2026): rerolls da Arena livre no dia. @param {unknown} raw @returns {{day:string,count:number}|undefined} */
export const ARENA_REROLL_MAX_COUNT = 999;
export function sanitizeArenaReroll(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {{day?:unknown,count?:unknown}} */ (raw);
  if (typeof r.day !== 'string' || !ISO_DAY.test(r.day) || typeof r.count !== 'number' || !Number.isFinite(r.count)) return undefined;
  return { day: r.day, count: Math.min(ARENA_REROLL_MAX_COUNT, Math.max(0, Math.floor(r.count))) };
}

/**
 * Regra comum: devolve o registro que o servidor deve gravar. `merge(a, b)` junta dois registros do MESMO dia.
 * @template {{day:string}} T
 * @param {T|undefined} inc @param {T|undefined} sto @param {(a:T,b:T)=>T} merge @param {number} nowMs
 * @returns {T|undefined}
 */
function monotonic(inc, sto, merge, nowMs) {
  if (!inc) return sto;
  if (inc.day > maxAcceptableDay(nowMs)) return sto; // dia futuro demais: ignora o que chegou
  if (!sto) return inc;
  if (inc.day < sto.day) return sto;
  if (inc.day === sto.day) return merge(inc, sto);
  return inc;
}

/**
 * @param {unknown} incoming o que o cliente mandou @param {unknown} stored o que já está gravado @param {number} [nowMs]
 * @returns {{day:string,layers:number}|undefined}
 */
export function enforceDungeonDaily(incoming, stored, nowMs = Date.now()) {
  return monotonic(sanitizeDungeonDaily(incoming), sanitizeDungeonDaily(stored), (a, b) => ({ day: a.day, layers: Math.max(a.layers, b.layers) }), nowMs);
}

/**
 * @param {unknown} incoming @param {unknown} stored @param {number} [nowMs]
 * @returns {{day:string,claimed:string[]}|undefined}
 */
export function enforceCheckIns(incoming, stored, nowMs = Date.now()) {
  return monotonic(
    sanitizeCheckIns(incoming),
    sanitizeCheckIns(stored),
    (a, b) => ({ day: a.day, claimed: CHECKIN_SLOTS.filter(s => a.claimed.includes(s) || b.claimed.includes(s)) }),
    nowMs,
  );
}

/**
 * Rerolls da Arena livre: mesmo dia = o MAIOR contador (apagar o save local não devolve rerolls grátis nem baixa o preço).
 * @param {unknown} incoming @param {unknown} stored @param {number} [nowMs]
 * @returns {{day:string,count:number}|undefined}
 */
export function enforceArenaReroll(incoming, stored, nowMs = Date.now()) {
  return monotonic(sanitizeArenaReroll(incoming), sanitizeArenaReroll(stored), (a, b) => ({ day: a.day, count: Math.max(a.count, b.count) }), nowMs);
}

// ---------------------------------------------------------------------------
// LASTRO DO SCORE DO ENDLESS RIFT (QA beta3 R1/R2/R3, decisão do dono 1).
//
// O ranking `endless-rift` é MENSAL e o score é a camada ABSOLUTA mais funda do mês. Duas falhas do lastro antigo (soma de
// `dungeonDaily.layers` do save cru, `riftlayers:<mês>:<saveId>` = número):
//   · FORJÁVEL: `dungeonDaily.layers = 999` virava lastro 999 num único POST;
//   · RESTRITIVO: quem retoma perto do recorde (`startLayerFor`) já começa na camada ~R e nunca "começou R camadas" → 409.
//
// Agora o servidor ANCORA o mês: `{ n, base, rec, d, dn }`
//   · `base`  = camada em que a 1ª descida do mês COMEÇA (`startLayerFor(rec)`, sem o teto do Lv, que só deixaria a âncora MAIS
//     baixa = mais folgada). Progresso do mês = camada atingida − base + 1;
//   · `n`     = camadas COMEÇADAS no mês, contadas pelo servidor, com TAXA PLAUSÍVEL por dia (`RIFT_MAX_LAYERS_PER_DAY`; o dia é o
//     do SERVIDOR, não o do aparelho). Só cresce. Score aceito ≤ base + n − 1;
//   · `rec`   = o recorde que o SERVIDOR acredita: nasce do último mês visto (ou, na 1ª vez, do recorde que o save já trazia) e só
//     sobe, no máximo o quanto as camadas novas comprovam. Forjar `dungeonDepthRecord` no save não eleva a âncora do mês seguinte.
//   · `d/dn`  = o dia do servidor e o quanto já entrou nele (teto de taxa).
// LIMITE HONESTO: a 1ª vez que o servidor vê um recorde (conta que já jogava antes deste deploy) ele é confiado — o save é do
// cliente. A porta de saída é a REVISÃO DO DONO: o prêmio só é pago após aprovação na página GM, que mostra base/n/recorde.
// Mês = UTC do servidor (o mesmo do ranking). Valor legado (só um número = camadas somadas) segue lido como `{ n, base: 1 }`.
// ---------------------------------------------------------------------------
export const riftLayersKey = (month, saveId) => `riftlayers:${month}:${saveId}`;
const monthOf = (nowMs) => new Date(nowMs).toISOString().slice(0, 7);
const prevMonthOf = (nowMs) => { const d = new Date(nowMs); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7); };

/** Camadas COMEÇADAS por dia (do servidor) que o lastro aceita: energia é o limite real (1/camada, estágio máx. ~12/dia) — folga larga, mas finita. */
export const RIFT_MAX_LAYERS_PER_DAY = 60;
/** Espelho de `DUNGEON_MILESTONE_FLOOR` (`src/utils/dungeonIdle.ts`). */
const MILESTONE_FLOOR = 5;
/** Onde a descida começa para um recorde (espelho de `startLayerFor`, sem o teto do Lv: ver cabeçalho). */
export const riftStartLayer = (record) => 1 + MILESTONE_FLOOR * Math.floor(Math.max(0, Math.min(DUNGEON_MAX_LAYER - 1, Math.floor(Number(record) || 0))) / MILESTONE_FLOOR);

/** Quantas camadas novas a gravacao trouxe: mesmo dia = diferenca; dia novo = o contador inteiro. Nunca negativo. */
export function layersDelta(antes, depois) {
  const a = sanitizeDungeonDaily(antes);
  const d = sanitizeDungeonDaily(depois);
  if (!d) return 0;
  if (a && a.day === d.day) return Math.max(0, d.layers - a.layers);
  if (a && d.day < a.day) return 0;
  return d.layers;
}

const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : lo);

/** Lê o lastro do mês: JSON novo, número legado ou ausente. @returns {Promise<{n:number,base:number,rec:number,d:string,dn:number}|null>} */
export async function readRiftLastro(store, saveId, nowMs = Date.now(), month = monthOf(nowMs)) {
  const raw = await store.get(riftLayersKey(month, saveId));
  if (raw === null || raw === undefined) return null;
  let v = null;
  try { v = JSON.parse(raw); } catch { v = null; }
  if (typeof v === 'number') return { n: num(v, 0, 1e6), base: 1, rec: 0, d: '', dn: 0 };
  if (!v || typeof v !== 'object') return null;
  return { n: num(v.n, 0, 1e6), base: num(v.base, 1, DUNGEON_MAX_LAYER), rec: num(v.rec, 0, DUNGEON_MAX_LAYER), d: typeof v.d === 'string' ? v.d : '', dn: num(v.dn, 0, 1e6) };
}

/** Maior score aceitável no ranking do mês: `base + n − 1` (0 sem nenhuma camada começada). */
export async function readRiftLayers(store, saveId, nowMs = Date.now()) {
  const l = await readRiftLastro(store, saveId, nowMs);
  return l && l.n > 0 ? Math.min(DUNGEON_MAX_LAYER, l.base + l.n - 1) : 0;
}

/**
 * @param {{recordAntes?:unknown, recordDepois?:unknown}} [ctx] o `dungeonDepthRecord` que o save JÁ tinha gravado (antes) e o que chegou (depois).
 */
export async function bumpRiftLayers(store, saveId, antes, depois, nowMs = Date.now(), ctx = {}) {
  const delta = layersDelta(antes, depois);
  if (delta <= 0) return 0;
  const month = monthOf(nowMs);
  const day = isoDayUtc(nowMs);
  let l = await readRiftLastro(store, saveId, nowMs, month);
  const recDepois = num(ctx.recordDepois, 0, DUNGEON_MAX_LAYER);
  if (!l) {
    // 1º lastro do mês: o recorde do servidor vem do mês anterior; sem ele, é a 1ª vez que o servidor vê esta conta (confiado).
    const ant = await readRiftLastro(store, saveId, nowMs, prevMonthOf(nowMs)).catch(() => null);
    const rec0 = ant ? Math.max(ant.rec, ant.base + ant.n - 1) : num(ctx.recordAntes, 0, DUNGEON_MAX_LAYER);
    l = { n: 0, base: riftStartLayer(rec0), rec: rec0, d: day, dn: 0 };
  }
  if (l.d !== day) { l.d = day; l.dn = 0; }
  const aceito = Math.max(0, Math.min(delta, RIFT_MAX_LAYERS_PER_DAY - l.dn));
  l.n += aceito; l.dn += aceito;
  // O recorde do servidor só sobe o quanto as camadas aceitas comprovam (clear ≤ começadas).
  if (recDepois > l.rec) l.rec = Math.min(recDepois, l.rec + aceito);
  await store.put(riftLayersKey(month, saveId), JSON.stringify(l), { expirationTtl: 86400 * 70 });
  return Math.min(DUNGEON_MAX_LAYER, l.base + l.n - 1);
}
