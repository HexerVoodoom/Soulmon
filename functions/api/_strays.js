// DESGARRADOS DE JOGADORES (01/11/2026, REGISTRO §213) — regra do dono: desgarrado = o Soulmon de um jogador que ficou
// 90 DIAS sem entrar. Antes disto o servidor não guardava "último acesso": o `t` do metadata do save só renova a cada 30 dias
// e o `updatedAt` do perfil só muda quando o app grava o perfil. Agora:
//  · `profile.lastLoginAt` (ms) é tocado no GET do save (= abrir o app logado), no máximo 1 escrita por dia por conta
//    (`touchLastLogin`), e também a cada POST do perfil (`community.js`, action=profile);
//  · o último acesso conhecido é o MAIOR de `lastLoginAt` e `updatedAt` (perfil anterior ao campo usa só `updatedAt`);
//    sem nenhuma data → NUNCA é desgarrado (não se inventa inatividade);
//  · escondido (`publicHidden`) e jogador simulado nunca entram (consentimento de lista pública; bot não "some");
//  · EMENDA (01/11/2026): o dono volta → fica MARCADO (`strayedAt`) e continua no pool até completar todas as tarefas do
//    dia em 2 dias seguidos (`applyStrayRecovery`, recalculado no POST do save). Logar sozinho não recupera.
// O que sai para o cliente é ANÔNIMO: `sid` (hash do pid aleatório, nunca o saveId nem o pid), estágio, sprite (allowlist) e
// elemento. Sem nome, apelido, pid, amigos ou datas.
import { getProfile, putProfile } from './_profile.js';
import { spriteUrlOrNull } from './_artLine.js';
import { isSimuladoId } from './_simulados.js';

export const STRAY_INACTIVE_DAYS = 90;
export const STRAY_INACTIVE_MS = STRAY_INACTIVE_DAYS * 86_400_000;
/** Intervalo mínimo entre dois toques de `lastLoginAt` (custo: no máximo 1 escrita de KV por dia por conta). */
export const LAST_LOGIN_TOUCH_MS = 86_400_000;
/** Teto do pool devolvido por `action=strays`. */
export const STRAY_POOL_MAX = 30;

const ts = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/** Último acesso conhecido (ms) do perfil, ou 0 se não há data nenhuma. */
export function lastActiveAt(p) {
  if (!p || typeof p !== 'object') return 0;
  return Math.max(ts(p.lastLoginAt), ts(p.updatedAt));
}

/** Ficou 90+ dias sem acesso (sem olhar a marca)? */
export function isInactive(p, now) {
  const t = lastActiveAt(p);
  return t > 0 && now - t >= STRAY_INACTIVE_MS;
}

/**
 * O perfil é de um desgarrado AGORA? (puro) Emenda de 01/11/2026 (dono): a MARCA `strayedAt` gruda — voltar a logar não
 * tira; só a recuperação (2 dias completos seguidos, `applyStrayRecovery`) limpa. Sem marca, vale a inatividade de 90 dias.
 */
export function isStrayProfile(p, now, saveId = p?.id) {
  if (!p || typeof p !== 'object' || p.publicHidden === true) return false;
  if (isSimuladoId(saveId) || isSimuladoId(p.id)) return false;
  if (typeof p.pid !== 'string' || !p.pid) return false;
  if (ts(p.strayedAt) > 0) return true;
  return isInactive(p, now);
}

/** Marca `strayedAt` se o perfil está inativo há 90+ dias e ainda não tem a marca (o MESMO objeto se nada muda). */
export function markStrayIfInactive(p, now) {
  if (!p || typeof p !== 'object' || ts(p.strayedAt) > 0 || !isInactive(p, now)) return p;
  return { ...p, strayedAt: now, strayRecovery: { streak: 0, lastDay: null } };
}

/** Só os campos da marca (para atravessar a regravação do perfil). */
export function strayFieldsOf(p) {
  return p && ts(p.strayedAt) > 0 ? { strayedAt: p.strayedAt, strayRecovery: p.strayRecovery ?? { streak: 0, lastDay: null } } : {};
}

// ── Recuperação: 2 dias COMPLETOS seguidos, recalculados no servidor a partir do save enviado (POST /api/save) ──
export const STRAY_RECOVERY_DAYS = 2;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Dia do jogador (AAAA-MM-DD) do instante `ms`, pela âncora `playerDayTz` do save (zona IANA > offset > UTC). */
export function playerDayOf(ms, tz) {
  if (tz && typeof tz.zone === 'string') {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz.zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
    } catch { /* zona inválida: cai no offset */ }
  }
  const off = tz && Number.isFinite(tz.offsetMs) && Math.abs(tz.offsetMs) <= 14 * 3_600_000 ? tz.offsetMs : 0;
  return new Date(ms + off).toISOString().slice(0, 10);
}
export const prevDay = (d) => new Date(Date.parse(`${d}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Data (AAAA-MM-DD) de um texto de data (ISO ou `toDateString()` do aparelho); inválido = null. */
function dateOf(v) {
  if (typeof v !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = /^[A-Za-z]{3} ([A-Za-z]{3}) (\d{2}) (\d{4})$/.exec(v.trim());
  if (!m) return null;
  const mes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(m[1]);
  return mes < 0 ? null : `${m[3]}-${String(mes + 1).padStart(2, '0')}-${m[2]}`;
}

/**
 * O dia `day` está COMPLETO segundo o save? (puro; o servidor recalcula, não lê flag do cliente)
 *  · pelo menos 1 tarefa concluída nesse dia (`completedTasks[].completedAt`, no dia do jogador);
 *  · nenhuma tarefa pendente (`tasks[]` com `completed !== true`) com prazo (`deadline.date`) até esse dia;
 *  · todo hábito agendado nesse dia da semana (`activities[].weekDays`; vazio = todo dia) concluído nesse dia
 *    (`lastCompletedDate`).
 */
export function isDayCompleteInSave(state, day) {
  if (!state || typeof state !== 'object' || !DAY_RE.test(day)) return false;
  const tz = state.playerDayTz;
  const done = Array.isArray(state.completedTasks) ? state.completedTasks : [];
  const algumNoDia = done.some(c => {
    const t = Date.parse(c?.completedAt);
    return Number.isFinite(t) && playerDayOf(t, tz) === day;
  });
  if (!algumNoDia) return false;
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  if (tasks.some(t => t && t.completed !== true && typeof t.deadline?.date === 'string' && t.deadline.date.slice(0, 10) <= day)) return false;
  const wd = new Date(`${day}T12:00:00Z`).getUTCDay();
  const acts = Array.isArray(state.activities) ? state.activities : [];
  for (const a of acts) {
    if (!a || typeof a !== 'object') continue;
    const dias = Array.isArray(a.weekDays) ? a.weekDays : [];
    if (dias.length > 0 && !dias.includes(wd)) continue;
    if (dateOf(a.lastCompletedDate) !== day) return false;
  }
  return true;
}

/** Progresso que o jogador vê (0..2): a sequência só vale se o último dia completo é hoje ou ontem. */
export function strayRecoveryProgress(p, today) {
  const r = p?.strayRecovery;
  if (!r || typeof r.lastDay !== 'string' || !Number.isInteger(r.streak)) return 0;
  return r.lastDay === today || r.lastDay === prevDay(today) ? Math.min(r.streak, STRAY_RECOVERY_DAYS) : 0;
}

/**
 * Aplica o dia `today` do save à recuperação (puro). Sem marca ou dia incompleto = o MESMO perfil (a quebra aparece quando
 * o próximo dia completo não é o seguinte: a sequência recomeça em 1). No máximo 1 dia por data. Com 2 seguidos,
 * `strayedAt` e `strayRecovery` somem: o Soulmon sai do pool.
 */
export function applyStrayRecovery(p, state, today, now = Date.now()) {
  if (!p || ts(p.strayedAt) === 0 || !isDayCompleteInSave(state, today)) return p;
  const r = p.strayRecovery && typeof p.strayRecovery === 'object' ? p.strayRecovery : { streak: 0, lastDay: null };
  if (r.lastDay === today) return p;
  const streak = r.lastDay === prevDay(today) && Number.isInteger(r.streak) ? r.streak + 1 : 1;
  if (streak >= STRAY_RECOVERY_DAYS) {
    const { strayedAt: _a, strayRecovery: _b, ...rest } = p;
    return { ...rest, recoveredAt: now };
  }
  return { ...p, strayRecovery: { streak, lastDay: today } };
}

/** POST do save: recalcula a recuperação a partir do estado gravado. Falha nunca derruba o save. */
export async function recoverStrayFromSave(env, saveId, state, now = Date.now()) {
  try {
    const p = await getProfile(env, saveId);
    if (!p || ts(p.strayedAt) === 0) return false;
    const next = applyStrayRecovery(p, state, playerDayOf(now, state?.playerDayTz), now);
    if (next === p) return false;
    await putProfile(env, saveId, next);
    return true;
  } catch (err) {
    console.warn('strays: recuperação falhou', { saveIdPrefix: String(saveId).slice(0, 8), err: String(err) });
    return false;
  }
}

/** Id público do desgarrado: 24 hex de SHA-256 do pid (o pid é aleatório; o caminho inverso não existe). */
export async function strayIdOf(pid) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-stray:${pid}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

const STAGE = /^[A-Za-z0-9_.-]{1,40}$/;
const ELEMENT = /^[a-z][a-z0-9_-]{0,31}$/;

/** A face pública (anônima) do desgarrado. */
export async function strayView(p) {
  const out = { sid: await strayIdOf(p.pid), stage: STAGE.test(String(p.stage ?? '')) ? p.stage : 'rookie' };
  const sprite = spriteUrlOrNull(p.spriteUrl);
  if (sprite) out.spriteUrl = sprite;
  if (typeof p.element === 'string' && ELEMENT.test(p.element)) out.element = p.element;
  return out;
}

/**
 * Toca `lastLoginAt` do perfil da conta (GET do save). Sem perfil = nada (quem nunca gravou perfil não tem Soulmon público).
 * Falha nunca derruba quem chamou. Devolve `true` se escreveu.
 */
export async function touchLastLogin(env, saveId, now = Date.now()) {
  try {
    const p = await getProfile(env, saveId);
    if (!p || now - ts(p.lastLoginAt) < LAST_LOGIN_TOUCH_MS) return false;
    // Emenda (dono): quem volta depois de 90+ dias fica MARCADO antes de o acesso ser gravado; logar não recupera.
    await putProfile(env, saveId, { ...markStrayIfInactive(p, now), lastLoginAt: now });
    return true;
  } catch (err) {
    console.warn('strays: toque de último acesso falhou', { saveIdPrefix: String(saveId).slice(0, 8), err: String(err) });
    return false;
  }
}
