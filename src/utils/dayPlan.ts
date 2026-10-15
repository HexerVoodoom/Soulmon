import { habitCountsOn } from './habitRhythm';
import { taskIsForToday, activityBucket } from './atividadesLista';
import { isActive } from './taskTriage';

/**
 * REAFIRMAR O DIA (15/10/2026, pedido do dono; REGISTRO §66). Pura: sem React, sem storage, sem `Date` implícito.
 *
 * Todo dia a pessoa diz o que quer fazer HOJE entre o que já cadastrou (hábitos, tarefas, agendadas que caem hoje).
 * Só o que ela marca aparece no Hoje; o que não marcou NÃO aparece e NÃO conta como falta (a virada não o julga).
 * A meta do dia (`dailyGoalFor`) e o `Missão N/G` seguem a regra de sempre — só muda o que a LISTA mostra.
 *
 * O estado é UM objeto no save (`dayPlan`), por dia do jogador (ISO `YYYY-MM-DD`):
 *  · `offered`   — os ids que o modal ofereceu (o instantâneo). Quem NASCE depois (criado no meio do dia) não está aqui e
 *                  aparece sozinho: criar é um ato do próprio dia.
 *  · `picked`    — os ids marcados.
 *  · `confirmed` — `false` = o modal abriu e foi fechado sem confirmar (a lista fica vazia, com um convite discreto).
 *
 * Esconde-se `offered − picked` no dia do plano. Plano de OUTRO dia (virou o dia e ainda não houve a reafirmação) esconde
 * tudo o que é de hoje: o dia só começa depois da confirmação. Save sem `dayPlan` (anterior a esta decisão) não esconde
 * nada: a primeira abertura grava o plano de hoje como "já reafirmado" (`migrateDayPlan`), pois a lista do dia já estava montada.
 */
export interface DayPlan {
  day: string;
  offered: string[];
  picked: string[];
  confirmed: boolean;
}

/** Teto de ids por lista (anti-save-forjado). O servidor (`functions/api/_dayPlan.js`) espelha. */
export const DAY_PLAN_MAX_IDS = 200;
const ID_RE = /^[\w:.-]{1,120}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === 'string' && ID_RE.test(x)))].slice(0, DAY_PLAN_MAX_IDS);
}

/** Higieniza o que veio do save (dado NÃO confiável). Sem forma = ausente (nunca recusa o save). */
export function sanitizeDayPlan(raw: unknown): DayPlan | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !DAY_RE.test(r.day)) return undefined;
  const offered = cleanIds(r.offered);
  const picked = cleanIds(r.picked).filter(id => offered.includes(id));
  return { day: r.day, offered, picked, confirmed: r.confirmed === true };
}

/** O que a Home precisa para filtrar a lista. */
export interface DayPlanView {
  /** Plano de outro dia: nada do que é de hoje aparece até a reafirmação. */
  hideAll: boolean;
  hidden: ReadonlySet<string>;
}
const EMPTY: ReadonlySet<string> = new Set();
export const DAY_PLAN_VIEW_OPEN: DayPlanView = { hideAll: false, hidden: EMPTY };

/** `active` = o jogador já passou do onboarding/tutorial (antes disso nada é escondido). */
export function dayPlanView(plan: DayPlan | undefined, todayIso: string, active: boolean): DayPlanView {
  if (!active || !plan) return DAY_PLAN_VIEW_OPEN;
  if (plan.day !== todayIso) return { hideAll: true, hidden: EMPTY };
  const hidden = new Set(plan.offered.filter(id => !plan.picked.includes(id)));
  return hidden.size === 0 ? DAY_PLAN_VIEW_OPEN : { hideAll: false, hidden };
}

export function isHiddenByPlan(view: DayPlanView, id: string): boolean {
  return view.hideAll || view.hidden.has(id);
}

/** Ids escondidos num dia ISO específico (a virada julga o dia que ACABOU: plano de outro dia não esconde nada ali). */
export function hiddenOnDay(plan: DayPlan | undefined, dayIso: string | null): ReadonlySet<string> {
  if (!plan || !dayIso || plan.day !== dayIso) return EMPTY;
  return new Set(plan.offered.filter(id => !plan.picked.includes(id)));
}

/** Precisa pedir a reafirmação? (há plano antigo; sem plano o `migrateDayPlan` cuida.) */
export function needsDayPlan(plan: DayPlan | undefined, todayIso: string): boolean {
  return !!plan && plan.day !== todayIso;
}

/** Convite discreto na lista vazia: o modal abriu e foi fechado sem confirmar (ou o dia virou e ainda não foi pedido). */
export function dayPlanInvite(plan: DayPlan | undefined, todayIso: string, active: boolean): boolean {
  if (!active || !plan) return false;
  return plan.day !== todayIso || (!plan.confirmed && plan.offered.length > 0);
}

/** Save anterior: a lista do dia já estava montada → hoje já está reafirmado (nada escondido). */
export function migrateDayPlan(plan: DayPlan | undefined, todayIso: string): DayPlan {
  return plan ?? { day: todayIso, offered: [], picked: [], confirmed: true };
}

export interface DayPlanCandidate {
  id: string;
  name: string;
  kind: 'habit' | 'task';
}

interface CandActivity { id: string | number; name?: string; schedule?: unknown; weekDays?: number[]; completedToday?: boolean; lastCompletedDate?: string; steps?: Array<{ completed: boolean }> }
interface CandTask { id: string | number; name?: string; completed?: boolean; startDate?: string; status?: string }

/**
 * O que cabe perguntar: o que está no Hoje e ainda não foi feito — hábitos devidos hoje, agendadas que caem hoje (ambos
 * pela mesma régua da lista, `habitCountsOn`), e as tarefas abertas de hoje. Atividade de dias específicos que NÃO cai
 * hoje não entra; o já concluído hoje também não (já está feito, aparece sempre). Sem duplicar: um id, uma linha.
 */
export function dayPlanCandidates(
  state: { activities: readonly CandActivity[]; tasks: readonly CandTask[]; habitRhythms?: Record<string, never> | Record<string, unknown> },
  now: Date,
): DayPlanCandidate[] {
  const today = now.toDateString();
  const rhythms = (state.habitRhythms ?? {}) as Record<string, Parameters<typeof habitCountsOn>[1]>;
  const seen = new Set<string>();
  const out: DayPlanCandidate[] = [];
  const push = (c: DayPlanCandidate) => { if (!seen.has(c.id)) { seen.add(c.id); out.push(c); } };
  for (const a of state.activities) {
    const id = String(a.id);
    const done = (a.steps?.length ?? 0) > 0 ? a.steps!.every(s => s.completed) : !!a.completedToday && a.lastCompletedDate === today;
    if (done) continue;
    if (!habitCountsOn(a as Parameters<typeof habitCountsOn>[0], rhythms[id], now)) continue;
    push({ id, name: a.name ?? '', kind: activityBucket(a as { schedule?: unknown; weekDays?: number[] }) === 'habit' ? 'habit' : 'task' });
  }
  for (const t of state.tasks) {
    if (t.completed || !isActive(t as Parameters<typeof isActive>[0]) || !taskIsForToday(t, now)) continue;
    push({ id: String(t.id), name: t.name ?? '', kind: 'task' });
  }
  return out;
}

/** O plano de hoje gravado AO MOSTRAR o modal ("visto" ao mostrar, REGISTRO §42): une o que já havia no dia com o que há agora. */
export function showDayPlan(prev: DayPlan | undefined, todayIso: string, candidates: readonly DayPlanCandidate[]): DayPlan {
  const same = prev && prev.day === todayIso ? prev : undefined;
  const offered = [...new Set([...(same?.offered ?? []), ...candidates.map(c => c.id)])].slice(0, DAY_PLAN_MAX_IDS);
  return { day: todayIso, offered, picked: same?.picked ?? [], confirmed: same?.confirmed ?? false };
}

/** A confirmação: grava o que foi marcado (só entre os oferecidos). */
export function confirmDayPlan(prev: DayPlan | undefined, todayIso: string, picked: readonly string[]): DayPlan {
  const base = prev && prev.day === todayIso ? prev : { day: todayIso, offered: [] as string[], picked: [] as string[], confirmed: false };
  const offered = [...new Set([...base.offered, ...picked])].slice(0, DAY_PLAN_MAX_IDS);
  return { day: todayIso, offered, picked: [...new Set(picked)].filter(id => offered.includes(id)), confirmed: true };
}
