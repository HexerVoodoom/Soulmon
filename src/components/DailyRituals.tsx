/**
 * A LISTA DO DIA — o painel "Daily rituals" da Home e a gaveta do que saiu de
 * vista, sobre o canvas ATIVIDADES (identidade, `docs/design/wireframes/
 * atividades/identidade/`, DECISÕES §20).
 *
 * Puramente apresentacional: recebe o save (tarefas, hábitos, histórico de
 * hoje, ritmos) e os handlers; quem grava é o `App`. Regras que ele obedece:
 *
 *  · **Só as ATIVAS entram na lista.** `someday` e `dropped` existem
 *    justamente para tirar um item do campo de atenção sem apagá-lo; elas
 *    ficam na gaveta "Put aside", em `muted`, com "Bring back" 44.
 *  · **"feitos/total" = DEVIDO HOJE + concluídas de hoje** (A4, achado 5). O
 *    hábito fora do dia não entra no total; a tarefa concluída hoje continua
 *    na lista (riscada, inerte, no fim) até a virada — `completeTask` a tira
 *    de `tasks`, e sem isto o contador esquecia o que a pessoa acabou de fazer.
 *  · **"N/M steps" só com N ≥ 1** (A7, piso E5): antes do primeiro passo é
 *    "M steps" — "0/3" é fatura, não dado.
 *  · **Esmaecer é tinta** (`muted`), nunca `opacity` — na linha, na gaveta e
 *    no `<details>`.
 *  · Ordem: tarefas ativas, hábitos devidos hoje, hábitos fora do dia,
 *    concluídas de hoje por último.
 */
import { useState, type ReactNode } from 'react';
import type { Language } from '../utils/i18n';
import type { Activity, CompletedTask, Task } from '../contexts/GameStateContext';
import type { ActivityCategory } from '../types/attributes';
import { normalizeSchedule } from '../types/taskModel';
import { categoryLabel } from '../types/category-icons';
import { isActive, isHaunted } from '../utils/taskTriage';
import { weeklyProgress, type HabitRhythm } from '../utils/habitRhythm';
import { Icon } from './ui/Icon';
import { sm2Button } from './form/FormKit';
import { RitualPanel, RitualRow } from './pixel/RitualPanel';
import { TaskMeta, sm2Tag } from './TaskMeta';
import { StepRow } from './StepRow';
import { bondXP } from '../utils/bond';
import { habitTier, milestoneReached, weekChip } from '../utils/habitRhythm';
import { HABIT_WEIGHT } from '../types/taskModel';
import { effortOf } from '../utils/taskTriage';


/**
 * O rótulo de frequência de um hábito na lista.
 *
 * Lê o `schedule` (fonte da verdade da recorrência) e NUNCA o `weekDays`, que
 * para os modos flexíveis é preenchido com a semana inteira só para o widget
 * Android e o app de desktop — que não carregam o motor novo — continuarem
 * enxergando o item. Ler o campo antigo aqui fazia "3× por semana" e "a cada 2
 * dias" aparecerem como "Todo dia": o app anunciava uma cobrança diária que a
 * regra não faz.
 */
export function frequencyLabel(
  activity: { schedule?: unknown; weekDays?: number[] },
  isPt: boolean,
  diasCurtos: string[],
): string {
  const s = normalizeSchedule(activity as Parameters<typeof normalizeSchedule>[0]);
  if (s.kind === 'timesPerWeek') {
    return isPt ? `${s.target}× por semana` : `${s.target}× per week`;
  }
  if (s.kind === 'everyNDays') {
    const base = isPt ? `A cada ${s.n} dia${s.n > 1 ? 's' : ''}` : `Every ${s.n} day${s.n > 1 ? 's' : ''}`;
    // O sufixo importa: é a diferença entre acumular atrasadas e não acumular.
    return s.from === 'completion'
      ? `${base} ${isPt ? '(após concluir)' : '(after completion)'}`
      : base;
  }
  const dias = s.days;
  if (dias.length === 7) return isPt ? 'Todo dia' : 'Every day';
  if (dias.length === 5 && [1, 2, 3, 4, 5].every(d => dias.includes(d))) return isPt ? 'Dias úteis' : 'Weekdays';
  if (dias.length === 0) return isPt ? 'Avulsa' : 'One-off';
  return dias.map(d => diasCurtos[d]).join(' · ');
}

/** "3 steps" antes do primeiro passo; "1/3 steps" depois (A7). */
export function stepsLabel(done: number, total: number, isPt: boolean): string {
  const word = isPt ? 'etapas' : 'steps';
  return done >= 1 ? `${done}/${total} ${word}` : `${total} ${word}`;
}

export interface DailyRitualsProps {
  tasks: Task[];
  activities: Activity[];
  completedTasks: CompletedTask[];
  /** ⚰️ D3 (01/10/2026): a linha não desenha mais a constância. Ficam
   *  opcionais para não quebrar quem ainda passa. */
  habitRhythms?: Record<string, HabitRhythm>;
  hideMetrics?: boolean;
  language: Language;
  now: Date;
  expanded: Record<string, boolean>;
  onExpand: (activityId: string) => void;
  onToggleTask: (taskId: string) => void;
  /** Subitem de uma tarefa (o último fecha a tarefa — quem fecha é o App). */
  onToggleTaskStep?: (taskId: string, stepId: string) => void;
  onEditTask: (taskId: string) => void;
  onPostponeNudge: (taskId: string) => void;
  onEditActivity: (activityId: string) => void;
  onToggleActivity: (activityId: string) => void;
  onUpdateStep: (activityId: string, stepId: string) => void;
  onRestoreTask: (taskId: string) => void;
  onCreate: () => void;
  ctaLabel: string;
  emptyMessage: string;
  /** Home B (minimal-ui F2): cabeçalho "Hoje N/M" + botão "+" no lugar do CTA largo. */
  variant?: 'panel' | 'home';
  /** Home B: o selo "Dia completo" (regra da virada, `completeDayReached`). */
  dayComplete?: boolean;
}

export function DailyRituals({
  tasks, activities, completedTasks, habitRhythms, language, now,
  expanded, onExpand, onToggleTask, onToggleTaskStep, onEditTask, onPostponeNudge,
  onEditActivity, onToggleActivity, onUpdateStep, onRestoreTask, onCreate, ctaLabel, emptyMessage,
  variant = 'panel', dayComplete = false,
}: DailyRitualsProps) {
  const isPt = language === 'pt-BR';
  /* Home em abas (11/10/2026): "Hoje" = o que é do dia; "Semanal" = o que se mede
     por semana (`timesPerWeek`). Só muda QUAL lista aparece — o contador N/M, a
     meta e o dia completo seguem contando tudo, como antes. */
  const [aba, setAba] = useState<'today' | 'weekly'>('today');
  const today = now.getDay(); // 0 = domingo, 6 = sábado
  const todayString = now.toDateString();
  const diasCurtos = isPt
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const tarefas = tasks
    .filter(t => isActive(t))
    .sort((a, b) => Number(a.completed) - Number(b.completed));
  const guardadas = tasks.filter(t => !isActive(t));
  /* Concluídas HOJE (já fora de `tasks`, no histórico). Uma tarefa que acabou
     de ser marcada ainda está em `tasks` com `completed: true` por 3s — não
     pode aparecer duas vezes. */
  const idsVivos = new Set(tasks.map(t => t.id));
  const feitasHoje = completedTasks
    .filter(c => new Date(c.completedAt).toDateString() === todayString && !idsVivos.has(c.id));

  const ehSemanal = (a: Activity) => normalizeSchedule(a as Parameters<typeof normalizeSchedule>[0]).kind === 'timesPerWeek';
  const comAbas = variant === 'home';
  const naAbaSemanal = comAbas && aba === 'weekly';
  const atividades = [
    ...activities.filter(a => a.weekDays?.includes(today)),
    ...activities.filter(a => !a.weekDays?.includes(today)),
  ].map((activity): Activity & { disponivelHoje: boolean; isComplete: boolean; xpEarned: number } => ({
    ...activity,
    disponivelHoje: !!activity.weekDays?.includes(today),
    isComplete: activity.steps.length > 0
      ? activity.steps.every(s => s.completed)
      : !!(activity.completedToday && activity.lastCompletedDate === todayString),
    xpEarned: (() => {
      const feito = activity.steps.length > 0
        ? activity.steps.every(s => s.completed)
        : !!(activity.completedToday && activity.lastCompletedDate === todayString);
      // Já feito: `totalDone` já contém a conclusão de hoje. Por fazer: a PRÉVIA
      // conta a que está para acontecer (+1), a mesma conta do `withHabitCompletion`.
      const after = Math.max(0, (habitRhythms?.[activity.id]?.totalDone ?? 0) + (feito ? 0 : 1));
      const base = bondXP({ kind: 'completion', weight: HABIT_WEIGHT, habitTier: habitTier(after) });
      const milestone = milestoneReached(Math.max(0, after - 1), after);
      return base + (milestone ? bondXP({ kind: 'habitMilestone', days: after }) : 0);
    })(),
  })).sort((a, b) => Number(a.isComplete) - Number(b.isComplete));

  /* A4: devido hoje + concluídas de hoje. O hábito fora do dia não é devido. */
  const devidos = atividades.filter(a => a.disponivelHoje);
  const total = tarefas.length + devidos.length + feitasHoje.length;
  const feitos = tarefas.filter(t => t.completed).length
    + devidos.filter(a => a.isComplete).length
    + feitasHoje.length;

  const gavetaRotulo = isPt
    ? `Guardadas (${guardadas.length}) — não cobram nada`
    : `Put aside (${guardadas.length}) — these ask nothing of you`;

  return (
    <>
      <RitualPanel
        done={feitos}
        total={total}
        titleIconName="task_alt"
        language={language}
        ctaLabel={ctaLabel}
        onCta={onCreate}
        /* Vazio de VERDADE: nada cadastrado — um hábito fora do dia ainda é lista. */
        emptyMessage={tarefas.length + atividades.length + feitasHoje.length === 0 ? emptyMessage : undefined}
        variant={variant}
        dayComplete={dayComplete}
      >
        {comAbas && (
          <div role="tablist" aria-label={isPt ? 'Visão da lista' : 'List view'} data-home-tabs style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {(['today', 'weekly'] as const).map(k => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={aba === k}
                data-home-tab={k}
                onClick={() => setAba(k)}
                style={{ ...sm2Button(aba === k ? 'primary' : 'quiet', false, 'sm'), flex: 1 }}
              >
                {k === 'today' ? (isPt ? 'Hoje' : 'Today') : (isPt ? 'Semanal' : 'Weekly')}
              </button>
            ))}
          </div>
        )}
        {naAbaSemanal && atividades.filter(a => ehSemanal(a)).length === 0 && (
          <p data-home-weekly-empty style={{ margin: 0, fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-muted)' }}>
            {isPt
              ? 'Nada medido por semana ainda. Um hábito de "N vezes por semana" aparece aqui.'
              : 'Nothing measured by the week yet. A "times per week" habit shows up here.'}
          </p>
        )}
        {(naAbaSemanal ? [] : tarefas).map(task => (
          <RitualRow
            key={task.id}
            flipKey={`t:${task.id}`}
            kind="task"
            name={task.name}
            subtitle={`${task.category
            ? categoryLabel(task.category as ActivityCategory, isPt)
              : (isPt ? 'Tarefa avulsa' : 'One-off task')}${(task.steps?.length ?? 0) > 0 ? ` · ${stepsLabel((task.steps ?? []).filter(st => st.completed).length, task.steps?.length ?? 0, isPt)}` : ''}${` · +${bondXP({ kind: 'completion', weight: effortOf(task) })} ${isPt ? 'XP base' : 'base XP'}`}`}
            value={task.completed ? (task.steps?.length ?? 1) : (task.steps ?? []).filter(st => st.completed).length}
            max={Math.max(1, task.steps?.length ?? 1)}
            done={task.completed}
            haunted={isHaunted(task, now)}
            onToggle={() => { if (!task.completed) onToggleTask(task.id); }}
            onEdit={() => onEditTask(task.id)}
            language={language}
            expandable={(task.steps?.length ?? 0) > 0 && !!onToggleTaskStep}
            expanded={!!expanded[task.id]}
            onExpand={() => onExpand(task.id)}
            toggleLabelPt={`${task.completed ? 'Tarefa concluída' : 'Marcar tarefa como concluída'}: ${task.name}`}
            toggleLabelEn={`${task.completed ? 'Task completed' : 'Mark task as completed'}: ${task.name}`}
            below={(
              /* Prazo, esforço, "adiada 4×" e o convite da assombrada — dado
                 honesto, nunca acusação (TaskMeta.tsx). */
              <TaskMeta task={task} now={now} language={language} onPostponeNudge={onPostponeNudge} />
            )}
          >
            {(task.steps ?? []).map(step => (
              <StepRow
                key={step.id}
                id={step.id}
                label={step.label}
                completed={step.completed}
                onToggle={(stepId) => onToggleTaskStep?.(task.id, stepId)}
                language={language}
              />
            ))}
          </RitualRow>
        ))}

        {atividades.filter(a => !a.isComplete && (!comAbas || ehSemanal(a) === naAbaSemanal)).map(activity => renderHabit(activity))}

        {/* Concluídas de hoje, no fim: hábitos feitos e tarefas do histórico. */}
        {atividades.filter(a => a.isComplete && (!comAbas || ehSemanal(a) === naAbaSemanal)).map(activity => renderHabit(activity))}
        {(naAbaSemanal ? [] : feitasHoje).map(c => (
          <RitualRow
            key={`done-${c.id}-${c.completedAt}`}
            flipKey={`t:${c.id}`}
            kind="task"
            name={c.name}
            subtitle={`${c.category ? categoryLabel(c.category, isPt) : (isPt ? 'Tarefa avulsa' : 'One-off task')} · ${isPt ? 'feita hoje' : 'done today'} · +${bondXP({ kind: 'completion', weight: effortOf(c) })} ${isPt ? 'XP base' : 'base XP'}`}
            value={1}
            max={1}
            done
            inert
            onToggle={() => {}}
            onEdit={() => {}}
            language={language}
            toggleLabelPt={`Tarefa concluída: ${c.name}`}
            toggleLabelEn={`Task completed: ${c.name}`}
          />
        ))}
      </RitualPanel>

      {/* GAVETA DO QUE SAIU DE VISTA — fechada por padrão, em `muted` (tinta,
          não opacidade), e diz em uma linha que nada ali cobra nada. */}
      {guardadas.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary
            className="sm2-details-summary"
            style={{ ...sm2Button('quiet', false, 'sm'), width: '100%', justifyContent: 'flex-start', padding: '0 8px', listStyle: 'none' }}
          >
            <Icon name="expand_more" size={24} className="sm2-details-chevron" />
            {gavetaRotulo}
          </summary>
          <ul style={{ listStyle: 'none', padding: '4px 0 0 8px', margin: 0 }}>
            {guardadas.map(t => (
              <li
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, minHeight: 44,
                  fontFamily: 'var(--sm2-font-text)',
                }}
              >
                <Icon name="task_alt" size={24} tone="muted" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--sm2-text-sm)', lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-ink)' }}>{t.name}</span>
                <span style={{ fontSize: 'var(--sm2-text-xs)', lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-muted)' }}>
                  {t.status === 'dropped'
                    ? (isPt ? 'deixada pra lá' : 'let go')
                    : t.wakeOn
                      ? (isPt ? `volta em ${t.wakeOn.split('-').reverse().join('/')}` : `back on ${t.wakeOn}`)
                      : (isPt ? 'algum dia' : 'someday')}
                </span>
                <button
                  type="button"
                  style={{ ...sm2Button('ghost', false, 'sm'), padding: '0 12px' }}
                  onClick={() => onRestoreTask(t.id)}
                >
                  {isPt ? 'Retomar' : 'Bring back'}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );

  function renderWeekChip(activity: Activity & { disponivelHoje: boolean }): ReactNode {
    const chip = weekChip(habitRhythms?.[activity.id], normalizeSchedule(activity as Parameters<typeof normalizeSchedule>[0]), now);
    if (!chip) return null;
    return (
      <span data-week-chip style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={sm2Tag}>
          {isPt ? `Semana: ${chip.done} de ${chip.target}` : `This week: ${chip.done} of ${chip.target}`}
        </span>
        <span className="sm2-ritual-sub" data-today-only>
          {isPt ? 'O check vale só para hoje' : 'The check counts today only'}
        </span>
      </span>
    );
  }

  function renderHabit(activity: Activity & { disponivelHoje: boolean; isComplete: boolean; xpEarned: number }): ReactNode {
    const etapas = activity.steps ?? [];
    const feitasEtapas = etapas.filter(s => s.completed).length;
    const freq = frequencyLabel(activity, isPt, diasCurtos);
    // Prévia ANTES de concluir (11/10/2026, pedido do dono): o valor aparece sempre;
    // hábito fora do dia não é devido, então não promete nada.
    const xp = activity.isComplete || activity.disponivelHoje ? ` · +${activity.xpEarned} ${isPt ? 'XP base' : 'base XP'}` : '';
    const semana = ehSemanal(activity) && habitRhythms?.[activity.id]
      ? weeklyProgress(habitRhythms[activity.id], (activity as { schedule?: never }).schedule as never, now)
      : null;
    const progSemana = semana && semana.target > 0 ? ` · ${semana.done}/${semana.target} ${isPt ? 'na semana' : 'this week'}` : '';
    const subtitulo = etapas.length > 0
      ? `${freq} · ${stepsLabel(feitasEtapas, etapas.length, isPt)}${progSemana}${xp}`
      : `${freq}${progSemana}${xp}`;
    return (
      <RitualRow
        key={activity.id}
        flipKey={`h:${activity.id}`}
        kind="habit"
        name={activity.name}
        subtitle={subtitulo}
        value={etapas.length > 0 ? feitasEtapas : (activity.isComplete ? 1 : 0)}
        max={etapas.length > 0 ? etapas.length : 1}
        done={activity.isComplete}
        dimmed={!activity.disponivelHoje}
        onEdit={() => onEditActivity(activity.id)}
        expandable={etapas.length > 0}
        expanded={!!expanded[activity.id]}
        onExpand={() => onExpand(activity.id)}
        onToggle={etapas.length > 0 ? undefined : () => onToggleActivity(activity.id)}
        language={language}
        /* O check é de HOJE, e o rótulo diz isso; o progresso da semana é um
           chip À PARTE (só exibição — não mexe em constância nem pontuação). */
        toggleLabelPt={`${activity.isComplete ? 'Hoje concluído' : 'Marcar como feito hoje'}: ${activity.name}`}
        toggleLabelEn={`${activity.isComplete ? 'Done today' : 'Mark as done today'}: ${activity.name}`}
        below={renderWeekChip(activity)}
        /* D2+D3 (navegação do dono, 01/10/2026): a janela de 7 tracejada +
           a bolinha/folha de maturidade (`HabitConstancy compact`) SAIU da
           linha — o dono leu a folha como "botão de editar" e o tracejado
           como ruído que não comunica. A constância continua viva no motor
           (`habitRhythm.ts`), no check-in (glifo `eco` dos hábitos de hoje),
           no relatório semanal e na edição do hábito; só não ocupa a lista. */
      >
        {etapas.map(step => (
          <StepRow
            key={step.id}
            id={step.id}
            label={step.label}
            completed={step.completed}
            onToggle={activity.disponivelHoje ? (stepId) => onUpdateStep(activity.id, stepId) : () => {}}
            disabled={!activity.disponivelHoje}
            language={language}
          />
        ))}
      </RitualRow>
    );
  }
}

export default DailyRituals;
