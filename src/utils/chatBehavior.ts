/**
 * RESUMO DE COMPORTAMENTO para o feedback do chat — AGREGADO e MINIMIZADO.
 *
 * Só CONTAGENS inteiras e categorias fixas (contrato `BEHAVIOR_SCALARS` /
 * `BEHAVIOR_MAPS` em `functions/api/chat.js`). Nenhum nome de hábito ou tarefa,
 * nenhum texto digitado, nenhum `soulGoal`: o servidor descarta o bloco inteiro
 * se vier qualquer outra chave. Só sai do aparelho quando a pessoa pergunta como
 * está indo, ou no feedback proativo (opt-in).
 */
import type { GameState } from '../contexts/GameStateContext';
import { constancy, dayKeyOf } from './habitRhythm';

export type BehaviorSummary = Partial<{
  days: number; activeDays: number; habitsTotal: number; habitsDoneToday: number; habitsDueToday: number;
  constancyPct: number; habitsSlipping: number; tasksDone: number; tasksOpen: number; restShieldsUsed: number;
  moodAvg: number; moodDays: number;
  byCategory: Record<string, number>; byPart: Record<string, number>;
}>;

const WINDOW = 7;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(Math.round(n), lo), hi);
const partOf = (h: number) => (h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : h >= 18 && h < 23 ? 'evening' : 'night');

/** "Como estou indo?" — a pergunta que autoriza mandar o resumo. */
export const FEEDBACK_ASK = /como (eu )?(t[oô]|estou|ando|vou|est[aá]) (indo|me saindo|andando)|meu (progresso|desempenho)|minha (semana|const[aâ]ncia)|feedback|how am i (doing|going)|my (progress|week|consistency)|how('s| is) my week/i;

export function buildBehaviorSummary(
  state: Pick<GameState, 'activities' | 'tasks' | 'completedTasks' | 'habitRhythms' | 'activityLog' | 'moodLog'>,
  now: Date = new Date(),
): BehaviorSummary {
  const since = new Date(now); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (WINDOW - 1));
  const inWin = (iso: string) => { const d = new Date(iso); return !Number.isNaN(d.getTime()) && d >= since && d <= now; };

  const acts = state.activities ?? [];
  const rhythms = state.habitRhythms ?? {};
  const today = dayKeyOf(now);
  let ratioSum = 0; let counted = 0; let slipping = 0; let shields = 0;
  for (const a of acts) {
    const r = rhythms[a.id];
    if (!r) continue;
    const c = constancy(r, now);
    if (c.window > 0) { ratioSum += c.ratio; counted++; }
    shields += r.shielded.filter(k => { const d = new Date(k); return !Number.isNaN(d.getTime()) && d >= since; }).length;
    const lastTwo = [1, 2].map(i => { const d = new Date(now); d.setDate(d.getDate() - i); return dayKeyOf(d); });
    if (r.missed.some(k => lastTwo.includes(k)) && !r.done.includes(today)) slipping++;
  }
  const dueToday = acts.filter(a => !a.weekDays || a.weekDays.includes(now.getDay())).length;
  const doneToday = acts.filter(a => a.completedToday).length;

  const byPart: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const activeDaySet = new Set<string>();
  for (const iso of state.activityLog ?? []) {
    if (!inWin(iso)) continue;
    byPart[partOf(new Date(iso).getHours())]++;
    activeDaySet.add(new Date(iso).toDateString());
  }
  const byCategory: Record<string, number> = {};
  let tasksDone = 0;
  for (const t of state.completedTasks ?? []) {
    if (!inWin(t.completedAt)) continue;
    tasksDone++;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
    activeDaySet.add(new Date(t.completedAt).toDateString());
  }
  const moods = (state.moodLog ?? []).slice(-WINDOW);

  const out: BehaviorSummary = {
    days: WINDOW,
    activeDays: clamp(activeDaySet.size, 0, 14),
    habitsTotal: clamp(acts.length, 0, 60),
    habitsDoneToday: clamp(doneToday, 0, 60),
    habitsDueToday: clamp(dueToday, 0, 60),
    habitsSlipping: clamp(slipping, 0, 60),
    tasksDone: clamp(tasksDone, 0, 500),
    tasksOpen: clamp((state.tasks ?? []).filter(t => !t.completed && (t.status ?? 'open') === 'open').length, 0, 500),
    restShieldsUsed: clamp(shields, 0, 14),
    byPart: Object.fromEntries(Object.entries(byPart).map(([k, v]) => [k, clamp(v, 0, 500)])),
  };
  if (counted) out.constancyPct = clamp((ratioSum / counted) * 100, 0, 100);
  if (Object.keys(byCategory).length) out.byCategory = Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, clamp(v, 0, 500)]));
  if (moods.length) { out.moodDays = clamp(moods.length, 0, 14); out.moodAvg = clamp(moods.reduce((s, m) => s + (m.mood - 1), 0) / moods.length, 0, 4); }
  return out;
}
