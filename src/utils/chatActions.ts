/**
 * AÇÕES PROPOSTAS DO CHAT — lado do CLIENTE.
 *
 * O servidor (`functions/api/_chatActions.js`) já valida; esta é a SEGUNDA trava,
 * a última antes de tocar no save: o cliente não confia em nada que chegue pela
 * rede, nem do próprio servidor. O modelo nunca escreve no save — o app mostra
 * um cartão (`ChatActionCard`) e só grava pelas mesmas portas que a UI usa
 * (`commitHabitCreate` / `commitTaskCreate`, em `App.tsx`), que carregam o teto
 * do demo, o teto de estágio e a telemetria.
 *
 * Schema e paridade com o servidor: docs/CHAT-SOULMON.md.
 */
import type { ActivityCategory } from '../types/attributes';
import type { Effort, Schedule } from '../types/taskModel';
import type { Activity, Task } from '../contexts/GameStateContext';

export const CHAT_CATEGORIES: readonly ActivityCategory[] = ['Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness'];
export const MAX_CHAT_ACTIONS = 2;
export const MAX_CHAT_NAME = 60;

export type CreateTaskAction = { type: 'create_task'; task: { name: string; category: ActivityCategory; effort: Effort; date?: string } };
export type CreateHabitAction = { type: 'create_habit'; habit: { name: string; category: ActivityCategory; schedule: Schedule; time?: string } };
export type PoseAction = { type: 'flip_soulmon' } | { type: 'fly' } | { type: 'land' };
export type CreateAction = CreateTaskAction | CreateHabitAction;
export type ChatAction = CreateAction | PoseAction;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Caracteres que não entram em nome: controle, separadores de linha Unicode e marcação. */
function badChar(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c < 32 || c === 127 || c === 0x2028 || c === 0x2029 || '<>{}`|\\[]'.includes(ch);
}

function name(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = Array.from(v).map(ch => (badChar(ch) ? ' ' : ch)).join('').replace(/\s+/g, ' ').trim().slice(0, MAX_CHAT_NAME).trim();
  return t || null;
}
const cat = (v: unknown): ActivityCategory | null => (CHAT_CATEGORIES as readonly unknown[]).includes(v) ? (v as ActivityCategory) : null;
const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
const time = (v: unknown): string | undefined => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : undefined);
const date = (v: unknown): string | undefined => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : undefined;
};

function schedule(v: unknown): Schedule | null {
  if (!isObj(v)) return null;
  if (v.kind === 'weekdays') {
    if (!Array.isArray(v.days) || v.days.length === 0 || v.days.length > 7) return null;
    if (!v.days.every(d => isInt(d, 0, 6)) || new Set(v.days).size !== v.days.length) return null;
    return { kind: 'weekdays', days: [...(v.days as number[])].sort((a, b) => a - b) };
  }
  if (v.kind === 'timesPerWeek') return isInt(v.target, 1, 7) ? { kind: 'timesPerWeek', target: v.target } : null;
  if (v.kind === 'everyNDays') return isInt(v.n, 2, 60) ? { kind: 'everyNDays', n: v.n, from: 'completion' } : null;
  return null;
}

/** Uma ação crua → ação segura, ou `null`. Campo desconhecido é descartado. */
export function parseChatAction(raw: unknown): ChatAction | null {
  if (!isObj(raw)) return null;
  switch (raw.type) {
    case 'flip_soulmon': case 'fly': case 'land':
      return { type: raw.type };
    case 'create_task': {
      const t = raw.task;
      if (!isObj(t)) return null;
      const n = name(t.name);
      const c = cat(t.category);
      if (!n || !c) return null;
      const effort: Effort = t.effort === 2 || t.effort === 3 ? t.effort : 1;
      const d = date(t.date);
      return { type: 'create_task', task: { name: n, category: c, effort, ...(d ? { date: d } : {}) } };
    }
    case 'create_habit': {
      const h = raw.habit;
      if (!isObj(h)) return null;
      const n = name(h.name);
      const c = cat(h.category);
      const s = schedule(h.schedule);
      if (!n || !c || !s) return null;
      const tm = time(h.time);
      return { type: 'create_habit', habit: { name: n, category: c, schedule: s, ...(tm ? { time: tm } : {}) } };
    }
    default:
      return null;
  }
}

/** A lista inteira da resposta: máx. `MAX_CHAT_ACTIONS`, o resto cai fora. */
export function parseChatActions(raw: unknown): ChatAction[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatAction[] = [];
  for (const r of raw) {
    const a = parseChatAction(r);
    if (a && out.length < MAX_CHAT_ACTIONS) out.push(a);
  }
  return out;
}

export const isCreateAction = (a: ChatAction): a is CreateAction => a.type === 'create_task' || a.type === 'create_habit';

const DAY_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function describeSchedule(s: Schedule, pt: boolean): string {
  if (s.kind === 'weekdays') {
    if (s.days.length === 7) return pt ? 'todo dia' : 'every day';
    return (pt ? DAY_PT : DAY_EN).filter((_, i) => s.days.includes(i)).join(', ');
  }
  if (s.kind === 'timesPerWeek') return pt ? `${s.target}× por semana` : `${s.target}× a week`;
  return pt ? `a cada ${s.n} dias` : `every ${s.n} days`;
}

/** Texto do cartão: "Criar hábito “Beber água” — todo dia às 9:00?" */
export function describeAction(a: CreateAction, pt: boolean): string {
  if (a.type === 'create_habit') {
    const at = a.habit.time ? (pt ? ` às ${a.habit.time}` : ` at ${a.habit.time}`) : '';
    return pt
      ? `Criar hábito “${a.habit.name}” — ${describeSchedule(a.habit.schedule, true)}${at}?`
      : `Create habit “${a.habit.name}” — ${describeSchedule(a.habit.schedule, false)}${at}?`;
  }
  const when = a.task.date ? (pt ? ` para ${a.task.date}` : ` for ${a.task.date}`) : '';
  return pt ? `Criar tarefa “${a.task.name}”${when}?` : `Create task “${a.task.name}”${when}?`;
}

/** Renomeia a proposta (o "Editar" do cartão). Revalida o nome. */
export function renameAction<T extends CreateAction>(a: T, newName: string): T | null {
  const n = name(newName);
  if (!n) return null;
  return a.type === 'create_habit'
    ? ({ ...a, habit: { ...a.habit, name: n } } as T)
    : ({ ...a, task: { ...a.task, name: n } } as T);
}

export function buildHabit(a: CreateHabitAction, emoji: string, weekDaysFor: (s: Schedule) => number[], id = `activity-${Date.now()}`): Activity {
  return {
    id,
    name: a.habit.name,
    category: a.habit.category,
    emoji,
    steps: [],
    // `weekDays` E `schedule` juntos (mesma regra do `handleQuickAdd`): o campo
    // antigo é o que o widget Android e o overlay de desktop leem.
    weekDays: weekDaysFor(a.habit.schedule),
    schedule: a.habit.schedule,
    ...(a.habit.time ? { alarm: { time: a.habit.time } } : {}),
  };
}

export function buildTask(a: CreateTaskAction, emoji: string, now = new Date(), id = `task-${Date.now()}`): Task {
  const iso = now.toISOString();
  return {
    id,
    name: a.task.name,
    category: a.task.category,
    emoji,
    completed: false,
    startDate: a.task.date,
    effort: a.task.effort,
    status: 'open',
    createdAt: iso,
    lastTouchedAt: iso,
  };
}
