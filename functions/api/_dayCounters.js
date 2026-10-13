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
