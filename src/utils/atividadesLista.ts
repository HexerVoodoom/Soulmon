/**
 * A LISTA DE ATIVIDADES — quem aparece onde (backlog beta-2, itens 2.1 a 2.3).
 *
 * Função PURA: não grava nada e não toca em regra de jogo. Só decide, para a
 * Home e para a tela `View all`, em qual categoria cada coisa cai:
 *
 *  · Home (hoje): `Tasks` (pontuais) e `Habits` (recorrentes devidos hoje).
 *  · View all: `Tasks`, `Habits` (a cada dia) e `Scheduled` (recorrentes em
 *    dias específicos: semanal, dias alternados, mensal).
 *
 * A recorrência continua sendo lida por `normalizeSchedule`/`habitCountsOn`
 * (`utils/habitRhythm.ts`) — nenhuma regra de data nova nasce aqui.
 */
import { normalizeSchedule } from '../types/taskModel';
import { parseDayValue } from './taskTriage';

export type ActivityBucket = 'habit' | 'scheduled';

/** Habit = todo dia; Scheduled = qualquer recorrência que não é "todo dia". */
export function activityBucket(a: { schedule?: unknown; weekDays?: number[] }): ActivityBucket {
  const s = normalizeSchedule(a as Parameters<typeof normalizeSchedule>[0]);
  if (s.kind === 'weekdays' && new Set(s.days).size >= 7) return 'habit';
  return 'scheduled';
}

/**
 * COTA DO MODO GRÁTIS (decisão do dono, 14/10/2026): só o HÁBITO DIÁRIO conta.
 * A tarefa em dias específicos é gravada como `Activity` com `schedule`, mas é
 * tarefa para o dono — não gasta vaga. Valor que não é objeto (lote de teste,
 * candidato opaco) conta como hábito, o lado conservador.
 */
export function consomeCotaDeHabito(a: unknown): boolean {
  if (a === null || typeof a !== 'object') return true;
  return activityBucket(a as { schedule?: unknown; weekDays?: number[] }) === 'habit';
}

/** Quantas atividades da lista ocupam a cota de hábitos. */
export function contaCotaDeHabitos(activities: readonly unknown[]): number {
  return activities.filter(consomeCotaDeHabito).length;
}

/**
 * Tarefa pontual é "de hoje" quando não tem data de início no futuro.
 * (`startDate` é "quando pretendo fazer" — Things 3; sem ele a tarefa está
 * aberta desde sempre e continua na Home, como já era.)
 */
export function taskIsForToday(task: { startDate?: string }, now: Date): boolean {
  if (!task.startDate) return true;
  const d = parseDayValue(task.startDate);
  if (!d) return true;
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() <= hoje.getTime();
}

/**
 * Estado aberto/recolhido de uma linha com filhos.
 *
 * Padrão: ABERTA enquanto houver filho pendente; RECOLHIDA (só o título) quando
 * todos estão concluídos. A escolha manual da pessoa vale ENQUANTO o estado de
 * conclusão for o mesmo — por isso a chave carrega `allDone`: ao concluir o
 * último filho a chave muda, a escolha antiga deixa de valer e a linha recolhe.
 */
export function ritualOpenKey(id: string, allDone: boolean): string {
  return `${id}|${allDone ? 'd' : 'p'}`;
}

export function isRitualOpen(
  overrides: Record<string, boolean> | undefined,
  id: string,
  allDone: boolean,
): boolean {
  const v = overrides?.[ritualOpenKey(id, allDone)];
  return typeof v === 'boolean' ? v : !allDone;
}

/** Lê o JSON do aparelho; qualquer lixo vira `{}` (nunca lança). */
export function parseRitualOpen(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const out: Record<string, boolean> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (k !== '__proto__' && typeof val === 'boolean') out[k] = val;
    }
    return out;
  } catch {
    return {};
  }
}

/** Teto de entradas guardadas: as mais recentes ficam (ordem de inserção). */
export const RITUAL_OPEN_MAX = 200;
export function serializeRitualOpen(o: Record<string, boolean>): string {
  const entries = Object.entries(o);
  return JSON.stringify(Object.fromEntries(entries.slice(-RITUAL_OPEN_MAX)));
}
