// ---------------------------------------------------------------------------
// FILA DO WIDGET GRANDE DA HOME — a drenagem (decisão do dono, 18/11/2026).
//
// O check do widget SÓ MARCA: o nativo grava um evento numa fila do aparelho
// (`WidgetEventQueue.kt`) e o widget mostra a tarefa riscada na hora. Nada de
// comida, XP ou Bits no widget. Quando o app abre (ou volta ao primeiro plano)
// ele lê a fila e aplica cada evento pela MESMA regra do toque na Home
// (`applyTaskCompletion`, utils/taskCompletionPay.ts).
//
// Idempotência em duas camadas:
//   1. a regra de pagamento: tarefa já marcada/concluída/ausente = no-op;
//   2. `applied`: os últimos `eid` aplicados neste aparelho (localStorage),
//      para reabrir entre a gravação e o `ack` não reaplicar um evento.
// O `ack` (apagar da fila nativa) só acontece depois que o estado foi gravado.
// ---------------------------------------------------------------------------

import type { GameState, Task } from '../contexts/GameStateContext';
import { applyTaskCompletion } from './taskCompletionPay';
import { applyHabitCompletion } from './habitCompletionPay';

/** `YYYY-MM-DD` do aparelho: o mesmo `LocalDate.now()` que o Kotlin grava em `dayKey`. */
export function localIsoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Um evento da fila nativa: `task_done` ou `habit_done` (adendo ao §478); tipo desconhecido é descartado (ack sem aplicar). */
export interface WidgetEvent {
  eid: string;
  kind: string;
  ref: string;
  dayKey?: string;
  ts?: number;
}

/** Quantos `eid` aplicados o aparelho lembra. A fila nativa tem teto de 50, então 200 sobra. */
export const WIDGET_APPLIED_CAP = 200;

const EID_RE = /^[A-Za-z0-9-]{8,64}$/;

/** Filtra o que veio do nativo: só objetos com `eid` e `ref` em forma de id. */
export function sanitizeWidgetEvents(raw: unknown): WidgetEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: WidgetEvent[] = [];
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue;
    const { eid, kind, ref, dayKey, ts } = e as Record<string, unknown>;
    if (typeof eid !== 'string' || !EID_RE.test(eid)) continue;
    if (typeof kind !== 'string' || typeof ref !== 'string' || !ref || ref.length > 200) continue;
    out.push({
      eid, kind, ref,
      ...(typeof dayKey === 'string' ? { dayKey } : {}),
      ...(typeof ts === 'number' && Number.isFinite(ts) ? { ts } : {}),
    });
  }
  return out;
}

/** Lista de `eid` aplicados lida do localStorage (qualquer lixo vira lista vazia). */
export function sanitizeApplied(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(-WIDGET_APPLIED_CAP) : [];
}

export interface WidgetDrainResult<S> {
  state: S;
  /** Todos os `eid` processados (pagos, ignorados ou descartados): é o que vai no `ack`. */
  handled: string[];
  /** O registro atualizado (o que vai para o localStorage). */
  applied: string[];
  /** O que pagou agora, na ordem da fila, para o feedback do app. Hábito: `relief`/`premium` sempre `false`. */
  paid: Array<{ kind: 'task' | 'habit'; id: string; name: string; category: Task['category']; relief: boolean; premium: boolean }>;
}

/**
 * Aplica a fila em ordem (`ts`, depois a ordem de chegada). Pura: no StrictMode
 * o updater roda 2× e dá o mesmo resultado. Sem nada a pagar, `state` é a
 * MESMA referência.
 */
export function applyWidgetEvents<S extends GameState>(state: S, events: WidgetEvent[], applied: string[], now: Date): WidgetDrainResult<S> {
  const visto = new Set(applied);
  const ordem = events.map((e, i) => ({ e, i })).sort((a, b) => (a.e.ts ?? 0) - (b.e.ts ?? 0) || a.i - b.i).map(x => x.e);
  let s = state;
  const handled: string[] = [];
  const novos: string[] = [];
  const paid: WidgetDrainResult<S>['paid'] = [];
  for (const ev of ordem) {
    handled.push(ev.eid);
    if (visto.has(ev.eid)) continue;
    visto.add(ev.eid);
    novos.push(ev.eid);
    if (ev.kind === 'habit_done') {
      // Hábito é do DIA em que foi marcado: check de ontem não conta hoje (a virada já fechou ontem sem ele).
      if (ev.dayKey !== localIsoDay(now)) continue;
      const hab = s.activities.find(a => a.id === ev.ref);
      // Com etapas, a Home fecha pelas etapas, não pelo check: o widget também não fecha.
      if (!hab || hab.steps.length > 0) continue;
      const next = applyHabitCompletion(s, ev.ref, now);
      if (next === s) continue; // já feito hoje (no app ou noutro evento)
      s = next;
      paid.push({ kind: 'habit', id: hab.id, name: hab.name, category: hab.category as Task['category'], relief: false, premium: false });
      continue;
    }
    if (ev.kind !== 'task_done') continue;
    const r = applyTaskCompletion(s, ev.ref, now);
    if (!r.paid || !r.task) continue;
    s = r.state;
    paid.push({ kind: 'task', id: r.task.id, name: r.task.name, category: r.task.category, relief: r.relief, premium: r.premium });
  }
  return { state: s, handled, applied: [...applied, ...novos].slice(-WIDGET_APPLIED_CAP), paid };
}
