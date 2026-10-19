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
 *
 * POLIMENTO DA HOME (14/10/2026, pedido do dono):
 *  · **Hábitos = TODO DIA; Tasks = pontual OU em dias específicos.** Hoje, `Tasks`
 *    junta as pontuais e as agendadas que caem hoje; `Habits` são as diárias.
 *  · A linha de HOJE mostra o nome e o checkbox (+ os filhos, se houver) e, só se
 *    houver, UMA linha secundária pequena com o PRAZO e o convite da assombrada
 *    (`TaskMeta lean`, decisão §46). Sem subtítulo, selo, barra, XP, adiamentos nem categoria.
 *  · `View all` (gatilho discreto + swipe) lista TODAS as tarefas e hábitos, com busca,
 *    filtro e ordem (revisão 2, A3/A4): NÃO marca nada, é o ÚNICO lugar que edita.
 *    Na Home, tocar em qualquer lugar da linha marca como feita (A1).
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Language } from '../utils/i18n';
import type { Activity, CompletedTask, Task } from '../contexts/GameStateContext';
import { normalizeSchedule } from '../types/taskModel';
import { isActive, isHaunted } from '../utils/taskTriage';
import type { HabitRhythm } from '../utils/habitRhythm';
import { Icon } from './ui/Icon';
import { BackArrow } from './ui/BackArrow';
import { useBackLayer } from '../utils/backStack';
import { activityBucket, taskIsForToday, isRitualOpen, ritualOpenKey } from '../utils/atividadesLista';
import { sm2Button } from './form/FormKit';
import { RitualPanel, RitualRow } from './pixel/RitualPanel';
import { StepRow } from './StepRow';
import { TaskMeta } from './TaskMeta';
import { habitCountsOn } from '../utils/habitRhythm';
import { isHiddenByPlan, type DayPlanView } from '../utils/dayPlan';
import { parseDayValue } from '../utils/taskTriage';


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
  /** Escolhas manuais de abrir/recolher (chave `ritualOpenKey`). Sem escolha, a
   *  linha fica ABERTA enquanto houver filho pendente e RECOLHE quando todos
   *  estão concluídos (`isRitualOpen`). */
  expanded: Record<string, boolean>;
  /** `key` = `ritualOpenKey(id, allDone)`; `open` = o estado que a pessoa quer. */
  onExpand: (key: string, open: boolean) => void;
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
  /** Beta-2 (2.4): a meta do dia (`dailyGoalFor`), só para EXIBIR no cabeçalho. */
  goal?: number;
  /** Reafirmar o dia (REGISTRO §66): o que a pessoa não marcou para hoje não aparece (o concluído sempre aparece). `onInvite` define o convite discreto. */
  dayPlan?: { view: DayPlanView; invite?: boolean; onInvite?: () => void };
}

/** Distância mínima (px) e razão horizontal/vertical do gesto que abre `View all`. */
const SWIPE_MIN_PX = 64;
const SWIPE_RATIO = 2;

export function DailyRituals({
  tasks, activities, completedTasks, habitRhythms, language, now,
  expanded, onExpand, onToggleTask, onToggleTaskStep, onEditTask, onPostponeNudge,
  onEditActivity, onToggleActivity, onUpdateStep, onRestoreTask, onCreate, ctaLabel, emptyMessage,
  variant = 'panel', dayComplete = false, goal, dayPlan,
}: DailyRitualsProps) {
  const isPt = language === 'pt-BR';
  /* Beta-2 (2.1/2.3): a Home mostra SÓ o que é de hoje, em `Tasks` e `Habits`.
     O resto (recorrência em dias específicos, tarefa com início futuro) mora na
     tela cheia `View all`, aberta pelo botão do fim da lista OU pelo gesto
     horizontal — a MESMA experiência (`allOpen`). Programada não cobra nada. */
  const [allOpen, setAllOpen] = useState(false);
  /* A tela fica montada durante a saída (o deslize de volta); em movimento reduzido
     desmonta na hora. */
  const [telaMontada, setTelaMontada] = useState(false);
  const abrirTudo = useCallback(() => { setTelaMontada(true); setAllOpen(true); }, []);
  const fecharTudo = useCallback(() => setAllOpen(false), []);
  useEffect(() => {
    if (allOpen || !telaMontada) return;
    const reduz = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduz) { setTelaMontada(false); return; }
    const id = window.setTimeout(() => setTelaMontada(false), 260);
    return () => window.clearTimeout(id);
  }, [allOpen, telaMontada]);
  useBackLayer(allOpen, fecharTudo);
  /* A4: busca + filtro + ordem do `View all`. */
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<AllFilter>('all');
  const [ordem, setOrdem] = useState<AllSort>('az');
  /* D-10: a seta inverte a ordem atual (A–Z ↔ Z–A, mais recente ↔ mais antiga, mais feito ↔ menos feito). */
  const [invertida, setInvertida] = useState(false);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipeStart = (e: ReactPointerEvent) => { swipeRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }; };
  const swipeEnd = (e: ReactPointerEvent, aoAcionar: (dx: number) => void) => {
    const s0 = swipeRef.current;
    swipeRef.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) >= SWIPE_RATIO * Math.abs(dy) && Date.now() - s0.t < 800) aoAcionar(dx);
  };

  const todayString = now.toDateString();
  const diasCurtos = isPt
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const ativas = tasks
    .filter(t => isActive(t))
    .sort((a, b) => Number(a.completed) - Number(b.completed));
  const oculto = (id: string) => !!dayPlan && isHiddenByPlan(dayPlan.view, String(id));
  const tarefas = ativas.filter(t => taskIsForToday(t, now)).filter(t => t.completed || !oculto(t.id));
  const guardadas = tasks.filter(t => !isActive(t));
  /* Concluídas HOJE (já fora de `tasks`, no histórico). Uma tarefa que acabou
     de ser marcada ainda está em `tasks` com `completed: true` por 3s — não
     pode aparecer duas vezes. */
  const idsVivos = new Set(tasks.map(t => t.id));
  const feitasHoje = completedTasks
    .filter(c => new Date(c.completedAt).toDateString() === todayString && !idsVivos.has(c.id));

  const atividades = activities.map((activity): Activity & { disponivelHoje: boolean; isComplete: boolean } => ({
    ...activity,
    disponivelHoje: habitCountsOn(activity as Parameters<typeof habitCountsOn>[0], habitRhythms?.[activity.id], now),
    isComplete: activity.steps.length > 0
      ? activity.steps.every(s => s.completed)
      : !!(activity.completedToday && activity.lastCompletedDate === todayString),
  })).map(a => (a.isComplete && !a.disponivelHoje ? { ...a, disponivelHoje: true } : a))
    .sort((a, b) => Number(a.isComplete) - Number(b.isComplete));

  /* A4: devido hoje + concluídas de hoje. O hábito fora do dia não é devido. */
  const devidos = atividades.filter(a => a.disponivelHoje && (a.isComplete || !oculto(a.id)));
  const total = tarefas.length + devidos.length + feitasHoje.length;
  const feitos = tarefas.filter(t => t.completed).length
    + devidos.filter(a => a.isComplete).length
    + feitasHoje.length;

  /* Hoje: diárias = Habits; as agendadas que caem hoje entram em Tasks. */
  const habitosHoje = devidos.filter(a => activityBucket(a) === 'habit');
  const agendadasHoje = devidos.filter(a => activityBucket(a) === 'scheduled');

  /* View all (A3/A4): TODA tarefa e hábito, para editar. Busca por nome, filtro por tipo, ordem. */
  const quandoDe = (t: Task): string => {
    const d = parseDayValue(t.startDate ?? '') ?? new Date(NaN);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(isPt ? 'pt-BR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const todasLinhas: AllLine[] = [
    ...ativas.map((t): AllLine => ({ key: `t:${t.id}`, kind: 'task', name: t.name, preview: quandoDe(t), created: createdStamp(t.id, t.createdAt), done: 0, onEdit: () => onEditTask(t.id) })),
    ...atividades.map((a): AllLine => ({
      key: `h:${a.id}`, kind: activityBucket(a) === 'habit' ? 'habit' : 'task', name: a.name,
      preview: frequencyLabel(a, isPt, diasCurtos), created: createdStamp(a.id), done: habitRhythms?.[a.id]?.totalDone ?? 0, onEdit: () => onEditActivity(a.id),
    })),
  ];
  const linhasTodas = filterAndSortLines(todasLinhas, busca, filtro, ordem, language, invertida);
  /* D-07: Tasks em cima, Habits embaixo (cada grupo com o seu cabeçalho; a ordem escolhida vale dentro do grupo). */
  const gruposTodas = groupLines(linhasTodas);

  const gavetaRotulo = isPt
    ? `Guardadas (${guardadas.length})`
    : `Put aside (${guardadas.length})`;
  const tTasks = isPt ? 'Tarefas' : 'Tasks';
  const tHabits = isPt ? 'Hábitos' : 'Habits';

  const secao = (titulo: string, key: string) => (
    <li key={`sec-${key}`} className="sm3-secao" data-ritual-section={key}><h3>{titulo}</h3></li>
  );

  const verTudo = (
    <div className="sm3-ver-tudo">
      <button type="button" data-view-all onClick={abrirTudo}>
        {isPt ? 'Ver tudo' : 'View all'}
        <Icon name="arrow_forward" size={20} />
      </button>
    </div>
  );

  /** Linha de TAREFA (pontual). Só nome + checkbox; com subitens, os filhos. O pai nunca conclui direto. */
  function renderTask(task: Task): ReactNode {
    const etapas = task.steps ?? [];
    const feitasEtapas = etapas.filter(st => st.completed).length;
    const todasFeitas = task.completed || (etapas.length > 0 && feitasEtapas === etapas.length);
    const comFilhos = etapas.length > 0 && !!onToggleTaskStep;
    const aberta = isRitualOpen(expanded, task.id, todasFeitas);
    return (
      <RitualRow
        key={task.id}
        flipKey={`t:${task.id}`}
        kind="task"
        name={task.name}
        value={task.completed ? (etapas.length || 1) : feitasEtapas}
        max={Math.max(1, etapas.length || 1)}
        done={task.completed}
        haunted={isHaunted(task, now)}
        onToggle={() => { if (!task.completed) onToggleTask(task.id); }}
        language={language}
        expandable={comFilhos}
        expanded={aberta}
        onExpand={() => onExpand(ritualOpenKey(task.id, todasFeitas), !aberta)}
        toggleLabelPt={comFilhos
          ? `${task.completed ? 'Tarefa concluída' : 'Conclua as etapas'}: ${task.name}`
          : `${task.completed ? 'Tarefa concluída' : 'Marcar tarefa como concluída'}: ${task.name}`}
        below={<TaskMeta task={task} now={now} language={language} lean />}
        toggleLabelEn={comFilhos
          ? `${task.completed ? 'Task completed' : 'Complete the steps'}: ${task.name}`
          : `${task.completed ? 'Task completed' : 'Mark task as completed'}: ${task.name}`}
      >
        {etapas.map(step => (
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
    );
  }

  /** Linha do `View all`: nome + dias em que aparece; NÃO marca, tocar abre a edição. */
  function renderEditOnly(key: string, name: string, preview: string, onEdit: () => void): ReactNode {
    return (
      <RitualRow
        key={key}
        kind="task"
        name={name}
        subtitle={preview}
        value={0}
        max={1}
        editOnly
        onEdit={onEdit}
        language={language}
      />
    );
  }

  function renderDoneTask(c: CompletedTask): ReactNode {
    return (
      <RitualRow
        key={`done-${c.id}-${c.completedAt}`}
        flipKey={`t:${c.id}`}
        kind="task"
        name={c.name}
        value={1}
        max={1}
        done
        inert
        onToggle={() => {}}
        language={language}
        toggleLabelPt={`Tarefa concluída: ${c.name}`}
        toggleLabelEn={`Task completed: ${c.name}`}
      />
    );
  }

  return (
    <>
      <div
        data-ritual-swipe
        /* `pan-y`: a rolagem vertical continua do navegador; o horizontal chega
           aqui como gesto (abre `View all`). */
        style={{ touchAction: 'pan-y' }}
        onPointerDown={swipeStart}
        onPointerUp={(e) => swipeEnd(e, (dx) => { if (dx < 0) abrirTudo(); })}
        onPointerCancel={() => { swipeRef.current = null; }}
      >
      <RitualPanel
        done={feitos}
        total={total}
        titleIconName="task_alt"
        language={language}
        ctaLabel={ctaLabel}
        onCta={onCreate}
        /* Vazio de VERDADE: nada cadastrado — um hábito fora do dia ainda é lista. */
        emptyMessage={ativas.length + atividades.length + feitasHoje.length === 0 ? emptyMessage : undefined}
        variant={variant}
        dayComplete={dayComplete}
        goal={goal}
        footer={variant === 'home' ? verTudo : undefined}
        lead={dayPlan?.invite && dayPlan.onInvite ? (
          <button
            type="button"
            data-day-plan-invite
            onClick={dayPlan.onInvite}
            style={{ ...sm2Button('outline'), width: '100%', margin: '4px 0 8px' }}
          >
            {isPt ? 'Montar o meu dia' : 'Plan my day'}
          </button>
        ) : undefined}
      >
        {(tarefas.length > 0 || feitasHoje.length > 0 || agendadasHoje.length > 0) && secao(tTasks, 'tasks')}
        {tarefas.map(task => renderTask(task))}
        {agendadasHoje.filter(a => !a.isComplete).map(activity => renderHabit(activity))}
        {agendadasHoje.filter(a => a.isComplete).map(activity => renderHabit(activity))}
        {feitasHoje.map(c => renderDoneTask(c))}

        {habitosHoje.length > 0 && secao(tHabits, 'habits')}
        {habitosHoje.filter(a => !a.isComplete).map(activity => renderHabit(activity))}
        {/* Concluídas de hoje, no fim do grupo. */}
        {habitosHoje.filter(a => a.isComplete).map(activity => renderHabit(activity))}
      </RitualPanel>
      </div>

      {telaMontada && typeof document !== 'undefined' && createPortal(
        <AllActivitiesScreen
          language={language}
          onClose={fecharTudo}
          closing={!allOpen}
          swipeStart={swipeStart}
          swipeEnd={swipeEnd}
        >
          <AllFilters
            language={language}
            busca={busca} onBusca={setBusca}
            filtro={filtro} onFiltro={setFiltro}
            ordem={ordem} onOrdem={setOrdem}
            invertida={invertida} onInvertida={setInvertida}
          />
          {linhasTodas.length > 0 ? (
            <>
              {([['tasks', tTasks, gruposTodas.tasks], ['habits', tHabits, gruposTodas.habits]] as const).map(([k, titulo, linhas]) => linhas.length > 0 && (
                <section key={k} aria-label={titulo} data-all-section={k}>
                  <h3 className="sm3-secao-h">{titulo}</h3>
                  <ul className="sm2-ritual-list">
                    {linhas.map(l => renderEditOnly(l.key, l.name, l.preview, l.onEdit))}
                  </ul>
                </section>
              ))}
            </>
          ) : (
            <p data-all-empty style={{ color: 'var(--sm2-muted)', fontSize: 'var(--sm2-text-sm)' }}>
              {busca.trim() || filtro !== 'all'
                ? (isPt ? 'Nada encontrado.' : 'Nothing found.')
                : (isPt ? 'Nenhuma tarefa ainda. Crie uma com o botão +.' : 'No tasks yet. Create one with the + button.')}
            </p>
          )}
        </AllActivitiesScreen>,
        document.body,
      )}

      {/* GAVETA DO QUE SAIU DE VISTA — fechada por padrão, em `muted` (tinta,
          não opacidade). Nada ali cobra nada (e o rótulo não precisa dizer). */}
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

  function renderHabit(activity: Activity & { disponivelHoje: boolean; isComplete: boolean }): ReactNode {
    const etapas = activity.steps ?? [];
    const feitasEtapas = etapas.filter(s => s.completed).length;
    const aberta = isRitualOpen(expanded, activity.id, activity.isComplete);
    return (
      <RitualRow
        key={activity.id}
        flipKey={`h:${activity.id}`}
        kind="habit"
        name={activity.name}
        value={etapas.length > 0 ? feitasEtapas : (activity.isComplete ? 1 : 0)}
        max={etapas.length > 0 ? etapas.length : 1}
        done={activity.isComplete}
        dimmed={!activity.disponivelHoje}
        expandable={etapas.length > 0}
        expanded={aberta}
        onExpand={() => onExpand(ritualOpenKey(activity.id, activity.isComplete), !aberta)}
        onToggle={etapas.length > 0 ? undefined : () => onToggleActivity(activity.id)}
        language={language}
        /* O check é de HOJE, e o rótulo diz isso. */
        toggleLabelPt={etapas.length > 0
          ? `${activity.isComplete ? 'Hoje concluído' : 'Conclua as etapas de hoje'}: ${activity.name}`
          : `${activity.isComplete ? 'Hoje concluído' : 'Marcar como feito hoje'}: ${activity.name}`}
        toggleLabelEn={etapas.length > 0
          ? `${activity.isComplete ? 'Done today' : "Complete today's steps"}: ${activity.name}`
          : `${activity.isComplete ? 'Done today' : 'Mark as done today'}: ${activity.name}`}
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

export type AllFilter = 'all' | 'tasks' | 'habits';
/** D-09: a ordem do botão cíclico — alfabética → criação (mais recente primeiro) → mais feito. */
export type AllSort = 'az' | 'created' | 'done';
export const ALL_SORT_CYCLE: readonly AllSort[] = ['az', 'created', 'done'];
export const nextAllSort = (s: AllSort): AllSort => ALL_SORT_CYCLE[(ALL_SORT_CYCLE.indexOf(s) + 1) % ALL_SORT_CYCLE.length];
export interface AllLine { key: string; kind: 'task' | 'habit'; name: string; preview: string; created?: number; done?: number; onEdit: () => void }

/** Quando o item nasceu (ms): `createdAt` da tarefa; senão o carimbo que vai no id (`task-1760000000000`, `activity-…`). 0 = desconhecido. */
export function createdStamp(id: string, createdAt?: string): number {
  const t = createdAt ? Date.parse(createdAt) : NaN;
  if (Number.isFinite(t)) return t;
  const m = /\d{12,}/.exec(id);
  return m ? Number(m[0]) : 0;
}

/**
 * A4: busca (sem acento/caixa) + filtro por tipo + ordem. Pura.
 * Padrão de cada ordem: A–Z; criação com o MAIS RECENTE primeiro; mais feito primeiro. `invertida` vira a lista do avesso (D-10).
 * Empate cai no nome, então a ordem não pula entre renders.
 */
export function filterAndSortLines(lines: AllLine[], busca: string, filtro: AllFilter, ordem: AllSort, language: Language, invertida = false): AllLine[] {
  const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(busca.trim());
  const loc = language === 'pt-BR' ? 'pt-BR' : 'en';
  const out = lines.filter(l =>
    (filtro === 'all' || (filtro === 'tasks' ? l.kind === 'task' : l.kind === 'habit'))
    && (!q || norm(l.name).includes(q)));
  const porNome = (a: AllLine, b: AllLine) => a.name.localeCompare(b.name, loc);
  const cmp = ordem === 'az' ? porNome
    : ordem === 'created' ? (a: AllLine, b: AllLine) => (b.created ?? 0) - (a.created ?? 0) || porNome(a, b)
    : (a: AllLine, b: AllLine) => (b.done ?? 0) - (a.done ?? 0) || porNome(a, b);
  out.sort(cmp);
  return invertida ? out.reverse() : out;
}

/** D-07: Tasks primeiro, Habits depois (a ordem de cada lista é a que veio). */
export function groupLines(lines: AllLine[]): { tasks: AllLine[]; habits: AllLine[] } {
  return { tasks: lines.filter(l => l.kind === 'task'), habits: lines.filter(l => l.kind === 'habit') };
}

/** Busca + filtro + ordem do `View all` (A4). */
function AllFilters({ language, busca, onBusca, filtro, onFiltro, ordem, onOrdem, invertida, onInvertida }: {
  language: Language; busca: string; onBusca: (v: string) => void;
  filtro: AllFilter; onFiltro: (v: AllFilter) => void; ordem: AllSort; onOrdem: (v: AllSort) => void;
  invertida: boolean; onInvertida: (v: boolean) => void;
}) {
  const isPt = language === 'pt-BR';
  const chip = (ativo: boolean): CSSProperties => ({ ...sm2Button(ativo ? 'primary' : 'outline', false, 'sm'), padding: '0 12px' });
  const filtros: [AllFilter, string][] = [['all', isPt ? 'Todas' : 'All'], ['tasks', isPt ? 'Tarefas' : 'Tasks'], ['habits', isPt ? 'Hábitos' : 'Habits']];
  const ordemRotulo: Record<AllSort, string> = {
    az: 'A–Z',
    created: isPt ? 'Recentes' : 'Newest',
    done: isPt ? 'Mais feitos' : 'Most done',
  };
  return (
    <div data-all-filters style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
      <input
        type="search"
        data-all-search
        value={busca}
        onChange={e => onBusca(e.target.value)}
        placeholder={isPt ? 'Buscar por nome' : 'Search by name'}
        aria-label={isPt ? 'Buscar por nome' : 'Search by name'}
        style={{ minHeight: 44, boxSizing: 'border-box', padding: '0 12px', borderRadius: 10, border: '1px solid var(--sm2-line)', background: 'var(--sm2-surface)', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-md)' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filtros.map(([k, rot]) => (
          <button key={k} type="button" data-all-filter={k} aria-pressed={filtro === k} onClick={() => onFiltro(k)} style={chip(filtro === k)}>{rot}</button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          <button type="button" data-all-sort={ordem} aria-label={isPt ? `Ordem: ${ordemRotulo[ordem]}` : `Sort: ${ordemRotulo[ordem]}`} onClick={() => onOrdem(nextAllSort(ordem))} style={chip(false)}>
            {ordemRotulo[ordem]}
          </button>
          <button
            type="button"
            data-all-dir={invertida ? 'reversed' : 'default'}
            aria-pressed={invertida}
            aria-label={isPt ? 'Inverter a ordem' : 'Reverse the order'}
            onClick={() => onInvertida(!invertida)}
            style={{ ...chip(invertida), padding: 0, width: 44, justifyContent: 'center' }}
          >
            {/* Seta própria (SVG): ↓ ordem normal, ↑ invertida. Não depende do subset da fonte de ícones. */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: invertida ? 'rotate(180deg)' : undefined }}>
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </button>
        </span>
      </div>
    </div>
  );
}

/**
 * A TELA CHEIA de todas as atividades (beta-2, 2.3) — `Tasks`, `Habits`,
 * `Scheduled`. Seta de voltar + `View today` levam de volta à Home; o gesto
 * horizontal para a direita também. Camada própria: o voltar do sistema fecha
 * (`useBackLayer` no pai), Esc também. As linhas são as MESMAS da Home.
 */
function AllActivitiesScreen({
  language, onClose, closing, swipeStart, swipeEnd, children,
}: {
  language: Language;
  onClose: () => void;
  closing: boolean;
  swipeStart: (e: ReactPointerEvent) => void;
  swipeEnd: (e: ReactPointerEvent, aoAcionar: (dx: number) => void) => void;
  children: ReactNode;
}) {
  const isPt = language === 'pt-BR';
  const raiz = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    raiz.current?.querySelector<HTMLButtonElement>('[data-back-arrow] button')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      ref={raiz}
      className="sm3-tudo"
      role="dialog"
      aria-modal="true"
      aria-label={isPt ? 'Todas as atividades' : 'All activities'}
      data-all-activities
      data-closing={closing || undefined}
      onPointerDown={swipeStart}
      onPointerUp={(e) => swipeEnd(e, (dx) => { if (dx > 0) onClose(); })}
    >
      <header className="sm3-tudo-head">
        <BackArrow onClick={onClose} language={language === 'pt-BR' ? 'pt-BR' : 'en-US'} style={{ margin: 0 }} />
        <button type="button" className="sm3-tudo-hoje" data-view-today onClick={onClose}>
          {isPt ? 'Ver hoje' : 'View today'}
        </button>
      </header>
      <div className="sm3-tudo-corpo">{children}</div>
    </div>
  );
}

export default DailyRituals;
