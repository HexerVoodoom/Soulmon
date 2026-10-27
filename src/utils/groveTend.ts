/**
 * A REGRA DE CUIDAR DO BOSQUE (pedido do dono, 27/10/2026): aguar/defender so liberam com a meta do dia cumprida — a MESMA
 * regra que antes autorizava "firmar o fio" (`dailyDone >= heartGoalFor`, em peso de esforco; o App calcula e manda
 * `metaDoDiaCumprida`/`fioGoal`). Aqui so mora a conta de quanto falta e a fala de Lilia. Fora de `guildCopy` de proposito:
 * a regua "sem cobranca" da Guilda veta "faltam" para QUEM NAO VEIO; aqui e a tarefa da propria pessoa, em tom de convite.
 */
import type { Language } from './i18n';

export interface TendGate {
  liberado: boolean;
  /** Quantas restam (>= 1 quando bloqueado). */
  restam: number;
  /** Nomes das que faltam, so quando poucas (<= 2) e conhecidas. */
  nomes: string[];
}

export function tendGate(p: { metaCumprida: boolean; goal?: { done: number; heart: number }; pendentes?: string[] }): TendGate {
  if (p.metaCumprida) return { liberado: true, restam: 0, nomes: [] };
  const pend = p.pendentes ?? [];
  const peso = p.goal ? Math.ceil(p.goal.heart - p.goal.done) : 0;
  const restam = Math.max(1, peso > 0 ? peso : pend.length);
  return { liberado: false, restam, nomes: restam <= 2 && pend.length >= restam ? pend.slice(0, restam) : [] };
}

const pt = (l: Language) => l === 'pt-BR';

/** A linha curta perto do CTA, antes do toque. */
export function tendLinhaAntes(l: Language, restam: number): string {
  return pt(l) ? `Termine as tarefas de hoje para cuidar do Bosque (faltam ${restam})` : `Finish today's tasks to tend the Grove (${restam} left)`;
}

/** A fala de Lilia quando a pessoa toca sem ter concluido. */
export function tendFalaLilia(l: Language, g: TendGate): string {
  const [a, b] = g.nomes;
  if (g.nomes.length === 2) return pt(l) ? `Você ainda precisa terminar ${a} e ${b} para cuidar do Bosque` : `You still need to finish ${a} and ${b} to tend the Grove`;
  if (g.nomes.length === 1) return pt(l) ? `Você ainda precisa terminar ${a} para cuidar do Bosque` : `You still need to finish ${a} to tend the Grove`;
  if (pt(l)) return g.restam === 1 ? 'Falta 1 tarefa para você poder cuidar do Bosque' : `Faltam ${g.restam} tarefas para você poder cuidar do Bosque`;
  return g.restam === 1 ? 'You still need to finish 1 task to tend the Grove' : `You still need to finish ${g.restam} tasks to tend the Grove`;
}
