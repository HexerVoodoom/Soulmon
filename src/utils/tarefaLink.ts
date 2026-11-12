/**
 * TAREFAS/HÁBITOS SUGERIDOS LINKADOS A RECURSOS DO JOGO (beta12 §J, `docs/BACKLOG-BETA12.md`; decisões Q1–Q9 do dono, 12/11/2026).
 *
 * Um hábito que nasceu de uma sugestão do catálogo com recurso mapeado (`data/catalogResources.ts`) mostra o recurso NA PRÓPRIA LINHA
 * ("N de M passos"; "Ir ao Caderno"; "Ir à Oficina do Foco") e, quando o recurso confirma o dia, é marcado SOZINHO (check automático).
 *
 * REGRAS (mesmas de `utils/steps.ts`, regra 1 revista pelo dono):
 *  · só marca hábito ADOTADO (`catalogId` + recurso) — sugestão não aceita nunca marca (Q1);
 *  · passo NÃO pontua sozinho: o check automático dá EXATAMENTE o que o toque manual dá, sem bônus (Q2, A11);
 *  · meta de passos = a das Configurações (`stepGoal`, padrão 7.000), não os minutos do catálogo (Q3);
 *  · idempotência: a chave `<AAAA-MM-DD>|<id>` no save (`tarefaAuto`) garante 1×/dia; recarregar, reabrir ou repetir o gatilho não
 *    refaz nada, e NUNCA desmarca (A8, A10);
 *  · caminhar abaixo da meta só mostra o contador, sem cobrança (Q9, A4); sem permissão/sensor nada muda (A3);
 *  · o "dia" dos passos é o do registro (`stepsDayKey`): passo da véspera nunca marca o dia de hoje (A9).
 *
 * Puro: sem React, sem storage, `now` por parâmetro.
 */
import type { Language } from './i18n';
import { resourceOfCatalogId } from '../data/catalogResources';
import type { CatalogResource } from '../types/activityCatalog';
import { habitCountsOn, type HabitRhythm } from './habitRhythm';
import { playerDayIso, playerDayKey, type PlayerDayAnchor } from './playerDay';
import { DEFAULT_STEP_GOAL, sanitizeStepGoal, stepsDayKey, type StepsRecord } from './steps';

/** O mínimo de uma atividade que este módulo lê (o `Activity` do save serve). */
export interface LinkableActivity {
  id: string;
  name: string;
  catalogId?: string;
  completedToday?: boolean;
  lastCompletedDate?: string;
  schedule?: unknown;
  weekDays?: number[];
}

export type AutoRecurso = 'steps' | 'caderno' | 'foco';

/** O recurso de uma atividade adotada, ou `undefined`. */
export const recursoDaAtividade = (a: Pick<LinkableActivity, 'catalogId'>): CatalogResource | undefined => resourceOfCatalogId(a.catalogId);

/** Qual gatilho automático cada recurso responde (`building:forja.oficina` = a sessão do Foco). */
export function gatilhoDoRecurso(r: CatalogResource | undefined): AutoRecurso | null {
  if (r === 'steps') return 'steps';
  if (r === 'building:forja.caderno') return 'caderno';
  if (r === 'building:forja.oficina') return 'foco';
  return null;
}

/** Id do prédio de um recurso `building:*` (para o "Ir lá"), ou `null`. */
export const predioDoRecurso = (r: CatalogResource | undefined): string | null => (r && r.startsWith('building:') ? r.slice('building:'.length) : null);

export const chaveAuto = (dia: string, id: string): string => `${dia}|${id}`;

/** Leitura tolerante do save: só strings `AAAA-MM-DD|id`. */
export function sanitizeTarefaAuto(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw.filter((k): k is string => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}\|.{1,80}$/.test(k)).slice(-40);
  return out.length ? out : undefined;
}

/** Registra a chave e solta as de outros dias (o campo não cresce). Já registrada = o MESMO array. */
export function registrarAuto(lista: readonly string[] | undefined, dia: string, id: string): string[] {
  const k = chaveAuto(dia, id);
  const hoje = (lista ?? []).filter(x => x.startsWith(`${dia}|`));
  if (hoje.includes(k)) return (lista && hoje.length === lista.length ? (lista as string[]) : hoje);
  return [...hoje, k];
}

export const jaFezAuto = (lista: readonly string[] | undefined, dia: string, id: string): boolean => (lista ?? []).includes(chaveAuto(dia, id));

/** Passos de HOJE (0 se o registro é de outro dia: nada é herdado da véspera). */
export function passosDeHoje(steps: StepsRecord | undefined, now: Date): number {
  return steps && steps.date === stepsDayKey(now) ? Math.max(0, steps.today) : 0;
}

/** O que a linha do hábito de caminhar mostra: passos de hoje e a meta (das Configurações). Só com permissão concedida. */
export function progressoDePassos(args: { steps: StepsRecord | undefined; stepGoal: number | undefined; consent: string | undefined; now: Date }): { hoje: number; meta: number } | null {
  if (args.consent !== 'granted') return null;
  return { hoje: passosDeHoje(args.steps, args.now), meta: sanitizeStepGoal(args.stepGoal ?? DEFAULT_STEP_GOAL) };
}

/** A linha "N de M passos" (PT-BR e EN). Sem cobrança: só o número. */
export function passosLinha(hoje: number, meta: number, language: Language): string {
  const f = (n: number) => n.toLocaleString(language === 'pt-BR' ? 'pt-BR' : 'en-US');
  return language === 'pt-BR' ? `${f(hoje)} de ${f(meta)} passos` : `${f(hoje)} of ${f(meta)} steps`;
}

/** Os rótulos do "Ir lá" da linha do hábito. */
export function irLaLabel(recurso: CatalogResource | undefined, language: Language): string | null {
  const pt = language === 'pt-BR';
  if (recurso === 'building:forja.caderno') return pt ? 'Ir ao Caderno' : 'Go to the Journal';
  if (recurso === 'building:forja.oficina') return pt ? 'Ir à Oficina do Foco' : 'Go to the Focus Workshop';
  return null;
}

/** O texto da tag do topo: a palavra "Tarefa" (o checkbox marcado vem desenhado) e o anúncio para leitor de tela. */
export const autoTagText = (language: Language): string => (language === 'pt-BR' ? 'Tarefa' : 'Task');
export const autoTagAria = (name: string, language: Language): string =>
  language === 'pt-BR' ? `Tarefa concluída automaticamente: ${name}` : `Task completed automatically: ${name}`;

/** A atividade já está concluída HOJE (mesma leitura de `handleToggleActivityCompletion`). */
/** BUG-04 (QA beta12): no dia do JOGADOR (`playerDayKey`), o mesmo da chave de idempotência (`playerDayIso`) — não o do aparelho. */
const feitaHoje = (a: LinkableActivity, now: Date, tz?: PlayerDayAnchor): boolean => a.completedToday === true && a.lastCompletedDate === playerDayKey(now, tz);

export interface AutoCheckArgs {
  activities: readonly LinkableActivity[];
  habitRhythms?: Record<string, HabitRhythm>;
  tarefaAuto?: readonly string[];
  now: Date;
  tz?: PlayerDayAnchor;
  /** Passos: só entra no gatilho `steps`. */
  passos?: { consent: string | undefined; steps: StepsRecord | undefined; stepGoal: number | undefined };
}

/**
 * Os ids de hábito a marcar AGORA para este gatilho: adotado (com recurso do gatilho), devido hoje, ainda não feito, sem chave de hoje.
 * `steps` ainda exige permissão concedida, registro de HOJE e passos >= meta (A3, A4, A9). Para `caderno`/`foco` o gatilho é o evento
 * real (registro guardado; sessão concluída com o hábito escolhido) e `somenteIds` restringe a quais atividades ele vale.
 */
export function atividadesParaAutoCheck(gatilho: AutoRecurso, a: AutoCheckArgs & { somenteIds?: readonly string[] }): string[] {
  if (gatilho === 'steps') {
    const p = progressoDePassos({ steps: a.passos?.steps, stepGoal: a.passos?.stepGoal, consent: a.passos?.consent, now: a.now });
    if (!p || p.hoje < p.meta) return [];
  }
  const dia = playerDayIso(a.now, a.tz);
  return a.activities.filter(act =>
    gatilhoDoRecurso(recursoDaAtividade(act)) === gatilho
    && (!a.somenteIds || a.somenteIds.includes(act.id))
    && !feitaHoje(act, a.now, a.tz)
    && !jaFezAuto(a.tarefaAuto, dia, act.id)
    && habitCountsOn(act as Parameters<typeof habitCountsOn>[0], a.habitRhythms?.[act.id], a.now),
  ).map(act => act.id);
}
