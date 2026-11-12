/**
 * O OBJETIVO ANUAL (docs/PLANO-OBJETIVO-ANUAL.md)
 * ===============================================
 *
 * Modelo, limites e sanitização do `purpose` do GameState. Funções PURAS: o
 * tempo entra por parâmetro e o dia é sempre a data LOCAL do aparelho (a mesma
 * de `habitRhythm`).
 *
 * Regras de produto que moram aqui:
 *  - O texto do jogador é guardado como ele escreveu (só aparado e limitado).
 *  - `firstCreatedAt` NUNCA muda quando o objetivo muda: é a âncora do
 *    semestre/ano e do id idempotente do cosmético.
 *  - Nada aqui julga o jogador: revisão perdida não vira dívida.
 */

/** Tetos iguais aos do formulário (e aos do prompt do chat). */
export const PURPOSE_GOAL_MAX = 200;
export const PURPOSE_GOAL_MIN = 3;
export const PURPOSE_PHRASE_MAX = 120;
export const PURPOSE_MOTIVE_CUSTOM_MAX = 80;
export const PURPOSE_PLAN_MAX = 120;
export const PURPOSE_NOTE_MAX = 300;
export const PURPOSE_MAX_PRIORITIES = 3;
const MAX_AREAS = 12;
const MAX_HISTORY = 20;
const MAX_REVIEWS = 60;
const MAX_MILESTONES = 40;
const MAX_MONTHS = 120;
const MAX_ACTIVITIES_PER_MONTH = 80;

/** Os 11 motivos autônomos (SDT) + "outro". A ORDEM é a da tela. */
export const MOTIVE_KEYS = [
  'health', 'family', 'freedom', 'growth', 'calm', 'meaning',
  'curiosity', 'pride', 'contribution', 'joy', 'security', 'other',
] as const;
export type MotiveKey = (typeof MOTIVE_KEYS)[number];

export const OBSTACLE_KEYS = ['time', 'energy', 'forget', 'mood', 'focus', 'others', 'start', 'other'] as const;
export type ObstacleKey = (typeof OBSTACLE_KEYS)[number];

export const PERCEIVED_KEYS = ['closer', 'same', 'farther', 'unsure'] as const;
export type Perceived = (typeof PERCEIVED_KEYS)[number];

export const DECISION_KEYS = ['keep', 'adjust', 'change'] as const;
export type ReviewDecision = (typeof DECISION_KEYS)[number];

export type ReviewKind = 'week' | 'month' | 'semester' | 'year';
export type MilestoneStatus = 'open' | 'done' | 'partial' | 'not';

export interface PurposeGoal {
  text: string;
  areas: string[];
  /** dayKey local `YYYY-MM-DD` */
  createdAt: string;
  status: 'active' | 'archived';
}

export interface PurposeMotive {
  key: MotiveKey;
  customText?: string;
  phrase?: string;
}

export interface PurposePlan {
  obstacleKey: ObstacleKey;
  obstacleText?: string;
  response: string;
}

export interface PurposeMilestone {
  id: string;
  period: 'month' | 'semester';
  label: string;
  status: MilestoneStatus;
  createdAt: string;
}

export interface PurposeReview {
  id: string;
  kind: ReviewKind;
  /** dayKey local `YYYY-MM-DD` */
  at: string;
  /** `YYYY-MM` / `YYYY-Sn` / `YYYY-Wnn` / `YYYY`: o período que a revisão cobre. */
  period?: string;
  perceived?: Perceived;
  obstacles: ObstacleKey[];
  decision?: ReviewDecision;
  note?: string;
}

/** feitas / oportunidades de um hábito em um mês. */
export interface MonthCell { done: number; due: number }
export type MonthlyAgg = Record<string, Record<string, MonthCell>>;

export interface Purpose {
  goal?: PurposeGoal;
  /** Âncora de 6/12 meses. Não muda quando o objetivo muda. */
  firstCreatedAt?: string;
  history: PurposeGoal[];
  motive?: PurposeMotive;
  motiveHistory: PurposeMotive[];
  plan?: PurposePlan;
  priorities: string[];
  milestones: PurposeMilestone[];
  reviews: PurposeReview[];
  monthlyAgg: MonthlyAgg;
  prefs: { voiceReminder: boolean };
  promptedExisting?: boolean;
  /** Ids de concessão já pagos (ex.: `semester:2026-S1`). Idempotência do cosmético. */
  grants: string[];
  /** dayKey da última fala de lembrete do porquê (máx. 1 por semana). */
  lastVoiceAt?: string;
  /** Convites de revisão dispensados (`mês:2026-10`, `semester:C1`): o card some e só volta no próximo ciclo. */
  dismissed: string[];
}

/** A semanal é anotação leve: guarda só as últimas 12 para não empurrar as revisões grandes para fora do teto. */
export function trimReviews(list: PurposeReview[]): PurposeReview[] {
  const weeks = list.filter(r => r.kind === 'week').slice(-12);
  const rest = list.filter(r => r.kind !== 'week').slice(-MAX_REVIEWS);
  return [...rest, ...weeks].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

export function emptyPurpose(): Purpose {
  return {
    history: [], motiveHistory: [], priorities: [], milestones: [], reviews: [],
    monthlyAgg: {}, prefs: { voiceReminder: true }, grants: [], dismissed: [],
  };
}

// ── dia local ───────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` LOCAL. */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** `YYYY-MM` LOCAL. */
export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
export function parseLocalDay(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
}

// ── sanitização (load do save) ──────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const dayStr = (v: unknown): string => (typeof v === 'string' && parseLocalDay(v) ? v : '');
const oneOf = <T extends string>(list: readonly T[], v: unknown): T | undefined =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : undefined;
const safeId = (v: unknown): string => (typeof v === 'string' && /^[\w.:-]{1,64}$/.test(v) ? v : '');

function cleanGoal(v: unknown): PurposeGoal | undefined {
  if (!isObj(v)) return undefined;
  const t = text(v.text, PURPOSE_GOAL_MAX);
  const createdAt = dayStr(v.createdAt);
  if (t.length < PURPOSE_GOAL_MIN || !createdAt) return undefined;
  const areas = Array.isArray(v.areas) ? v.areas.map(a => text(a, 40)).filter(Boolean).slice(0, MAX_AREAS) : [];
  return { text: t, areas, createdAt, status: v.status === 'archived' ? 'archived' : 'active' };
}

function cleanMotive(v: unknown): PurposeMotive | undefined {
  if (!isObj(v)) return undefined;
  const key = oneOf(MOTIVE_KEYS, v.key);
  if (!key) return undefined;
  const customText = text(v.customText, PURPOSE_MOTIVE_CUSTOM_MAX);
  const phrase = text(v.phrase, PURPOSE_PHRASE_MAX);
  return { key, ...(customText ? { customText } : {}), ...(phrase ? { phrase } : {}) };
}

function cleanPlan(v: unknown): PurposePlan | undefined {
  if (!isObj(v)) return undefined;
  const obstacleKey = oneOf(OBSTACLE_KEYS, v.obstacleKey);
  const response = text(v.response, PURPOSE_PLAN_MAX);
  if (!obstacleKey || !response) return undefined;
  const obstacleText = text(v.obstacleText, PURPOSE_PLAN_MAX);
  return { obstacleKey, ...(obstacleText ? { obstacleText } : {}), response };
}

function cleanMonthlyAgg(v: unknown): MonthlyAgg {
  const out: MonthlyAgg = {};
  if (!isObj(v)) return out;
  const months = Object.keys(v).filter(k => /^\d{4}-\d{2}$/.test(k)).sort().slice(-MAX_MONTHS);
  for (const mk of months) {
    const cells = v[mk];
    if (!isObj(cells)) continue;
    const row: Record<string, MonthCell> = {};
    for (const id of Object.keys(cells).slice(0, MAX_ACTIVITIES_PER_MONTH)) {
      const c = cells[id];
      if (!safeId(id) || !isObj(c)) continue;
      const due = Math.max(0, Math.min(366, Math.floor(Number(c.due) || 0)));
      const done = Math.max(0, Math.min(due, Math.floor(Number(c.done) || 0)));
      row[id] = { done, due };
    }
    out[mk] = row;
  }
  return out;
}

/** Aceita qualquer lixo. Devolve `undefined` quando não é objeto (o campo continua ausente). */
export function sanitizePurpose(raw: unknown): Purpose | undefined {
  if (!isObj(raw)) return undefined;
  const base = emptyPurpose();
  const goal = cleanGoal(raw.goal);
  const history = (Array.isArray(raw.history) ? raw.history : []).map(cleanGoal).filter((g): g is PurposeGoal => !!g).slice(-MAX_HISTORY);
  const motive = cleanMotive(raw.motive);
  const motiveHistory = (Array.isArray(raw.motiveHistory) ? raw.motiveHistory : []).map(cleanMotive).filter((m): m is PurposeMotive => !!m).slice(-MAX_HISTORY);
  const plan = cleanPlan(raw.plan);
  const priorities = Array.isArray(raw.priorities)
    ? [...new Set(raw.priorities.map(safeId).filter(Boolean))].slice(0, PURPOSE_MAX_PRIORITIES)
    : [];
  const milestones: PurposeMilestone[] = [];
  for (const m of Array.isArray(raw.milestones) ? raw.milestones : []) {
    if (!isObj(m)) continue;
    const id = safeId(m.id); const label = text(m.label, PURPOSE_PLAN_MAX); const createdAt = dayStr(m.createdAt);
    const period = m.period === 'semester' ? 'semester' : m.period === 'month' ? 'month' : null;
    if (!id || !label || !createdAt || !period) continue;
    milestones.push({ id, period, label, createdAt, status: oneOf(['open', 'done', 'partial', 'not'] as const, m.status) ?? 'open' });
  }
  const reviews: PurposeReview[] = [];
  for (const r of Array.isArray(raw.reviews) ? raw.reviews : []) {
    if (!isObj(r)) continue;
    const id = safeId(r.id); const at = dayStr(r.at); const kind = oneOf(['week', 'month', 'semester', 'year'] as const, r.kind);
    if (!id || !at || !kind) continue;
    const obstacles = Array.isArray(r.obstacles) ? [...new Set(r.obstacles.map(o => oneOf(OBSTACLE_KEYS, o)).filter((o): o is ObstacleKey => !!o))].slice(0, 4) : [];
    const perceived = oneOf(PERCEIVED_KEYS, r.perceived);
    const decision = oneOf(DECISION_KEYS, r.decision);
    const note = text(r.note, PURPOSE_NOTE_MAX);
    const period = text(r.period, 12);
    reviews.push({ id, kind, at, obstacles, ...(period ? { period } : {}), ...(perceived ? { perceived } : {}), ...(decision ? { decision } : {}), ...(note ? { note } : {}) });
  }
  const prefs = isObj(raw.prefs) ? { voiceReminder: raw.prefs.voiceReminder !== false } : base.prefs;
  const firstCreatedAt = dayStr(raw.firstCreatedAt) || goal?.createdAt || history[0]?.createdAt || undefined;
  const lastVoiceAt = dayStr(raw.lastVoiceAt);
  return {
    ...base,
    ...(goal ? { goal } : {}),
    ...(firstCreatedAt ? { firstCreatedAt } : {}),
    history,
    ...(motive ? { motive } : {}),
    motiveHistory,
    ...(plan ? { plan } : {}),
    priorities,
    milestones: milestones.slice(-MAX_MILESTONES),
    reviews: trimReviews(reviews),
    monthlyAgg: cleanMonthlyAgg(raw.monthlyAgg),
    prefs,
    ...(raw.promptedExisting === true ? { promptedExisting: true } : {}),
    grants: Array.isArray(raw.grants) ? [...new Set(raw.grants.map(safeId).filter(Boolean))].slice(-20) : [],
    ...(lastVoiceAt ? { lastVoiceAt } : {}),
    dismissed: Array.isArray(raw.dismissed) ? [...new Set(raw.dismissed.map(safeId).filter(Boolean))].slice(-20) : [],
  };
}

// ── edição (sempre guarda histórico) ────────────────────────────────────────

/** Define/edita o objetivo. Texto novo arquiva o anterior no histórico. */
export function setGoal(p: Purpose | undefined, input: { text: string; areas: string[] }, now: Date): Purpose {
  const cur = p ?? emptyPurpose();
  const t = text(input.text, PURPOSE_GOAL_MAX);
  if (t.length < PURPOSE_GOAL_MIN) return cur;
  const day = localDayKey(now);
  const areas = input.areas.map(a => text(a, 40)).filter(Boolean).slice(0, MAX_AREAS);
  if (cur.goal && cur.goal.text === t) return { ...cur, goal: { ...cur.goal, areas } };
  const history = cur.goal ? [...cur.history, { ...cur.goal, status: 'archived' as const }].slice(-MAX_HISTORY) : cur.history;
  return { ...cur, goal: { text: t, areas, createdAt: day, status: 'active' }, history, firstCreatedAt: cur.firstCreatedAt ?? day };
}

export function setMotive(p: Purpose | undefined, input: { key: MotiveKey; customText?: string; phrase?: string }): Purpose {
  const cur = p ?? emptyPurpose();
  const next = cleanMotive(input);
  if (!next) return cur;
  const same = cur.motive && JSON.stringify(cur.motive) === JSON.stringify(next);
  const motiveHistory = cur.motive && !same ? [...cur.motiveHistory, cur.motive].slice(-MAX_HISTORY) : cur.motiveHistory;
  return { ...cur, motive: next, motiveHistory };
}

export function setPlan(p: Purpose | undefined, input: PurposePlan | undefined): Purpose {
  const cur = p ?? emptyPurpose();
  const { plan: _old, ...rest } = cur;
  const next = cleanPlan(input);
  return next ? { ...rest, plan: next } : rest;
}

/** Até 3. Devolve `ok:false` na 4ª (a tela mostra o aviso). */
export function togglePriority(p: Purpose | undefined, activityId: string): { purpose: Purpose; ok: boolean } {
  const cur = p ?? emptyPurpose();
  if (cur.priorities.includes(activityId)) return { purpose: { ...cur, priorities: cur.priorities.filter(i => i !== activityId) }, ok: true };
  if (cur.priorities.length >= PURPOSE_MAX_PRIORITIES) return { purpose: cur, ok: false };
  return { purpose: { ...cur, priorities: [...cur.priorities, activityId] }, ok: true };
}
