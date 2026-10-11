/**
 * OFICINA DO FOCO — a SESSÃO em etapas (10/10/2026, `docs/PLANO-OFICINA-FOCO.md` §9).
 *
 * Máquina de estados PURA (sem React, sem storage, relógio sempre por parâmetro). Dono único de:
 * a ordem das etapas, as escolhas do planejamento (dois minutos, Eisenhower, sapo, se-então,
 * brain dump), a LISTA ORGANIZADA que sai delas (`buildPlan`) e a normalização da sessão salva.
 *
 * Regras que não se negociam aqui:
 *  · Planejar NUNCA mexe nas tarefas do jogo: esta máquina só LÊ `{id, name, completed}`. A ordem da
 *    Home não muda; concluir é o handler real do App (injetado na folha), nunca uma cópia.
 *  · Cada etapa é pulável: pular não apaga o que já foi escolhido, só avança.
 *  · A recompensa de concluir o processo não olha contagem de tarefas (`canCompleteSession` só exige
 *    que exista um plano e um nome) — o teto diário mora em `focusExpedition.ts`.
 */
import { FOCO_MODES, type FocoModeId } from './focoTimer';
import { isFocusEnvironmentId, type FocusEnvironmentId } from './focusExpedition';

export const STEP_ORDER = ['preparar', 'ritmo', 'dois-minutos', 'eisenhower', 'sapo', 'se-entao', 'esvaziar', 'revisar'] as const;
export type StepId = typeof STEP_ORDER[number];
export const QUADRANTS = ['do', 'schedule', 'delegate', 'drop'] as const;
export type Quadrant = typeof QUADRANTS[number];

export const MAX_TWO_MIN = 5;
export const MAX_POOL = 40;
export const DUMP_MINUTE_OPTIONS = [3, 5, 10] as const;
export const DEFAULT_DUMP_MINUTES = 5;
export const MAX_NAME = 60;
export const MAX_TEXT = 2000;

export interface PlanTask { id: string; name: string; completed: boolean }
export type PlanTag = 'quick' | 'frog' | Quadrant;
export interface PlanItem { id: string; name: string; tags: PlanTag[] }

export interface SessionDraft {
  name: string;
  mode: FocoModeId;
  environment: FocusEnvironmentId | '';
  prepChecked: Record<string, boolean>;
  /** Ids escolhidos para a regra dos dois minutos, na ordem do toque. */
  twoMin: string[];
  /** Quadrante de Eisenhower por tarefa. */
  matrix: Record<string, Quadrant>;
  /** O sapo: a tarefa mais difícil. Vazio = nenhuma. */
  frog: string;
  ifThen: { cue: string; action: string };
  dump: string;
  dumpMinutes: number;
}

export interface FocoSession extends SessionDraft {
  id: string;
  day: string;
  status: 'ready' | 'completed';
  completedCycles: number;
  /** A lista organizada, congelada ao salvar (os nomes sobrevivem à tarefa sumir da Home). */
  plan: PlanItem[];
  /** Quem já foi marcada AQUI (a conclusão de verdade é do App; isto só desenha o ✓ sem esperar). */
  doneIds: string[];
}

export const emptyDraft = (): SessionDraft => ({
  name: '', mode: 'p25', environment: '', prepChecked: {}, twoMin: [], matrix: {}, frog: '',
  ifThen: { cue: '', action: '' }, dump: '', dumpMinutes: DEFAULT_DUMP_MINUTES,
});

// ── Navegação ────────────────────────────────────────────────────────────────
export const stepNumber = (id: StepId): number => STEP_ORDER.indexOf(id) + 1;
export const nextStep = (id: StepId): StepId => STEP_ORDER[Math.min(STEP_ORDER.length - 1, STEP_ORDER.indexOf(id) + 1)];
export const prevStep = (id: StepId): StepId => STEP_ORDER[Math.max(0, STEP_ORDER.indexOf(id) - 1)];
/** Pular é avançar sem tocar no rascunho — existe como função para o teste afirmar isso. */
export const skipStep = nextStep;

// ── Escolhas ─────────────────────────────────────────────────────────────────
/** Toca para marcar/desmarcar; passa de `MAX_TWO_MIN` e o toque novo é ignorado (a regra é "pequenas"). */
export function toggleTwoMin(d: SessionDraft, id: string): SessionDraft {
  if (d.twoMin.includes(id)) return { ...d, twoMin: d.twoMin.filter(x => x !== id) };
  if (d.twoMin.length >= MAX_TWO_MIN) return d;
  return { ...d, twoMin: [...d.twoMin, id] };
}

/** `null` limpa a escolha daquela tarefa. */
export function setQuadrant(d: SessionDraft, id: string, q: Quadrant | null): SessionDraft {
  const matrix = { ...d.matrix };
  if (q === null) delete matrix[id]; else matrix[id] = q;
  return { ...d, matrix };
}

/** Tocar no sapo de novo o solta. */
export const setFrog = (d: SessionDraft, id: string): SessionDraft => ({ ...d, frog: d.frog === id ? '' : id });

const rank = (q: Quadrant) => QUADRANTS.indexOf(q);

/** Tarefas já classificadas, em ordem de prioridade (quadrante; empate = ordem original da lista). */
export function matrixOrder(d: SessionDraft, tasks: readonly PlanTask[]): Array<PlanTask & { quadrant: Quadrant }> {
  return tasks
    .map((t, i) => ({ t, i, q: d.matrix[t.id] }))
    .filter((x): x is { t: PlanTask; i: number; q: Quadrant } => !!x.q && !x.t.completed)
    .sort((a, b) => rank(a.q) - rank(b.q) || a.i - b.i)
    .map(x => ({ ...x.t, quadrant: x.q }));
}

/**
 * A lista organizada. Ordem: (1) dois minutos, na ordem do toque — aquecimento que tira o pequeno do
 * caminho; (2) o sapo; (3) o resto por quadrante (fazer → agendar → delegar). "Deixar de lado" sai da
 * lista, a menos que a pessoa também tenha tocado nela como dois-minutos/sapo (o toque explícito vence).
 */
export function buildPlan(d: SessionDraft, tasks: readonly PlanTask[]): PlanItem[] {
  const open = new Map(tasks.filter(t => !t.completed).map(t => [t.id, t]));
  const out = new Map<string, PlanItem>();
  const add = (id: string, tag: PlanTag) => {
    const t = open.get(id);
    if (!t) return;
    const cur = out.get(id);
    if (cur) { if (!cur.tags.includes(tag)) cur.tags.push(tag); } else out.set(id, { id, name: t.name, tags: [tag] });
  };
  for (const id of d.twoMin) add(id, 'quick');
  if (d.frog) add(d.frog, 'frog');
  for (const t of matrixOrder(d, tasks)) {
    if (t.quadrant === 'drop' && !out.has(t.id)) continue;
    add(t.id, t.quadrant);
  }
  return [...out.values()];
}

export const dumpMs = (minutes: number): number => Math.max(1, Math.min(30, Math.floor(minutes) || DEFAULT_DUMP_MINUTES)) * 60_000;
export const startDump = (now: number, minutes: number): number => now + dumpMs(minutes);
export const dumpRemaining = (endAt: number | null, now: number): number => (endAt === null ? 0 : Math.max(0, endAt - now));

// ── Salvar / concluir ────────────────────────────────────────────────────────
export const canSave = (d: SessionDraft): boolean => d.name.trim().length > 0 && isFocusEnvironmentId(d.environment);

/** Concluir o PROCESSO exige um plano e a sessão pronta — nunca um número de tarefas. */
export const canCompleteSession = (s: FocoSession): boolean => s.status === 'ready' && s.plan.length > 0;

export function saveSession(d: SessionDraft, tasks: readonly PlanTask[], meta: { id: string; day: string; prev?: FocoSession | null }): FocoSession | null {
  if (!canSave(d)) return null;
  return {
    ...d, name: d.name.trim().slice(0, MAX_NAME), ifThen: { cue: d.ifThen.cue.slice(0, 200), action: d.ifThen.action.slice(0, 200) },
    dump: d.dump.slice(0, MAX_TEXT),
    id: meta.prev?.id ?? meta.id, day: meta.prev?.day ?? meta.day,
    status: meta.prev?.status === 'completed' ? 'completed' : 'ready',
    completedCycles: meta.prev?.completedCycles ?? 0,
    plan: buildPlan(d, tasks),
    doneIds: meta.prev?.doneIds ?? [],
  };
}

export const markDone = (s: FocoSession, id: string): FocoSession =>
  s.doneIds.includes(id) || !s.plan.some(p => p.id === id) ? s : { ...s, doneIds: [...s.doneIds, id] };
export const completeSession = (s: FocoSession): FocoSession => (canCompleteSession(s) ? { ...s, status: 'completed' } : s);
export const toDraft = (s: FocoSession): SessionDraft => ({
  name: s.name, mode: s.mode, environment: s.environment, prepChecked: s.prepChecked, twoMin: s.twoMin,
  matrix: s.matrix, frog: s.frog, ifThen: s.ifThen, dump: s.dump, dumpMinutes: s.dumpMinutes,
});
export const lengthLabel = (mode: FocoModeId): string => `${FOCO_MODES[mode].focusMin}/${FOCO_MODES[mode].breakMin}`;

// ── Lixo no storage nunca derruba a folha ────────────────────────────────────
const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
const ids = (v: unknown, max: number): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 80))].slice(0, max) : []);

export function normalizeSession(raw: unknown): FocoSession | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.day !== 'string' || (r.status !== 'ready' && r.status !== 'completed')) return null;
  if (r.mode !== 'p25' && r.mode !== 'p50') return null;
  const matrix: Record<string, Quadrant> = {};
  if (r.matrix && typeof r.matrix === 'object' && !Array.isArray(r.matrix)) {
    for (const [k, v] of Object.entries(r.matrix as Record<string, unknown>)) if ((QUADRANTS as readonly unknown[]).includes(v) && k.length <= 80) matrix[k] = v as Quadrant;
  }
  const prep: Record<string, boolean> = {};
  if (r.prepChecked && typeof r.prepChecked === 'object' && !Array.isArray(r.prepChecked)) {
    for (const [k, v] of Object.entries(r.prepChecked as Record<string, unknown>)) if (v === true && k.length <= 30) prep[k] = true;
  }
  const plan: PlanItem[] = Array.isArray(r.plan)
    ? r.plan.flatMap((p): PlanItem[] => {
        const o = p as Record<string, unknown> | null;
        if (!o || typeof o.id !== 'string' || typeof o.name !== 'string') return [];
        const tags = Array.isArray(o.tags) ? o.tags.filter((t): t is PlanTag => t === 'quick' || t === 'frog' || (QUADRANTS as readonly unknown[]).includes(t)) : [];
        return [{ id: o.id.slice(0, 80), name: o.name.slice(0, 200), tags }];
      }).slice(0, MAX_POOL)
    : [];
  const it = (r.ifThen && typeof r.ifThen === 'object' ? r.ifThen : {}) as Record<string, unknown>;
  const cycles = Number(r.completedCycles);
  const minutes = Number(r.dumpMinutes);
  return {
    id: r.id.slice(0, 80), name: str(r.name, MAX_NAME), day: r.day.slice(0, 10), status: r.status, mode: r.mode,
    environment: isFocusEnvironmentId(r.environment) ? r.environment : '',
    prepChecked: prep, twoMin: ids(r.twoMin, MAX_TWO_MIN), matrix, frog: str(r.frog, 80),
    ifThen: { cue: str(it.cue, 200), action: str(it.action, 200) }, dump: str(r.dump, MAX_TEXT),
    dumpMinutes: (DUMP_MINUTE_OPTIONS as readonly number[]).includes(minutes) ? minutes : DEFAULT_DUMP_MINUTES,
    completedCycles: Number.isFinite(cycles) ? Math.max(0, Math.min(99, Math.floor(cycles))) : 0,
    plan, doneIds: ids(r.doneIds, MAX_POOL),
  };
}

// ── Registro mínimo das sessões concluídas (local; várias por dia; sem total, sem placar) ─────────
export interface DoneSession { id: string; day: string; name: string }
export const HISTORY_KEEP = 20;
export function normalizeHistory(raw: unknown): DoneSession[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): DoneSession[] => {
    const o = x as Record<string, unknown> | null;
    return o && typeof o.id === 'string' && typeof o.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.day) && typeof o.name === 'string'
      ? [{ id: o.id.slice(0, 80), day: o.day, name: o.name.slice(0, MAX_NAME) }] : [];
  }).slice(-HISTORY_KEEP);
}
/** Idempotente por id: concluir duas vezes a mesma sessão não duplica a linha. */
export const recordDone = (list: readonly DoneSession[], s: FocoSession): DoneSession[] =>
  list.some(d => d.id === s.id) ? [...list] : [...list, { id: s.id, day: s.day, name: s.name }].slice(-HISTORY_KEEP);
export const doneToday = (list: readonly DoneSession[], day: string): DoneSession[] => list.filter(d => d.day === day);
