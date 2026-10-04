import { useState } from 'react';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import {
  CATEGORY_ATTRIBUTES, ATTR_INK, ATTR_LABEL,
  ActivityCategory, type BranchType,
} from '../types/attributes';
import { CATEGORY_ICONS, CATEGORY_ICON_NAME, categoryLabel } from '../types/category-icons';
import { canSelectWeekdays } from '../types/progression';
import { Language, useTranslation } from '../utils/i18n';
import { WEEKDAY_INDEXES, weekdayFull, weekdayShort } from '../utils/weekdays';
import { ROUTINE_PRESETS, presetDeRotina, type RoutinePreset } from '../types/taskModel';
import {
  CheckRow, Chip, Field, ModalSheet, Segment, sm2Button, sm2Hint, sm2Label,
} from './form/FormKit';
import {
  useItemForm, useHabitSchedule, anchorSentence, todayIso,
  type Step, type ScheduleKind,
} from '../hooks/useItemForm';
import { UnlockNudge } from './UnlockAccountModal';
import { sm2Tag } from './TaskMeta';
import { minimumViableHint } from '../utils/taskSuggestions';
import { parseQuickAdd, quickAddHint, type QuickAddResult } from '../utils/quickAdd';
import type { Effort, HabitAnchor, Schedule } from '../types/taskModel';

/**
 * ONDA 5 — o formulário de criação sobre as primitivas limpas de
 * `form/FormKit` (tokens `--sm2-*`), e o QUICK-ADD COMO CAMINHO PRIMÁRIO: uma
 * linha, os chips do que foi reconhecido, e o formulário inteiro atrás de
 * "mais opções". Os dois abertos ao mesmo tempo eram a maior fonte de poluição
 * do app.
 *
 * Os blocos de campo abaixo são exportados porque `EditModal` e `TaskEditModal`
 * desenham exatamente os mesmos — três usos reais, não abstração antecipada.
 */

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (data: {
    name: string;
    category: string;
    emoji: string;
    steps?: Step[];
    deadline?: { date: string; time: string };
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
    /** 1 rápida · 2 média · 3 projeto — a recompensa escala com isto. */
    effort?: Effort;
    /** Quando pretendo fazer (Things 3). Só isto traz a tarefa para o Hoje. */
    startDate?: string;
    status?: 'open';
    createdAt?: string;
    lastTouchedAt?: string;
  }) => void;
  onSaveActivity: (data: {
    name: string;
    category: string;
    emoji: string;
    steps: Step[];
    /** Continua sendo escrito ao lado de `schedule`: é o que o widget Android
     *  e o app de desktop leem — nenhum dos dois carrega o motor novo. */
    weekDays: number[];
    alarm?: { time: string };
    schedule?: Schedule;
    anchor?: HabitAnchor;
  }) => void;
  language?: Language;
  evolutionStage?: string;
  activitiesCount?: number;
  activitiesCap?: number;
  /** O teto que morde é a FRONTEIRA DO MODO GRÁTIS (D-12), e não o teto do
   *  estágio que o pagante também tem. Só nesse caso o convite de compra faz
   *  sentido: um pagante no teto dele não tem nada a comprar aqui. */
  capIsDemoBoundary?: boolean;
  /** Abre a oferta de desbloqueio (UnlockAccountModal). Só faz sentido junto
   *  com `capIsDemoBoundary` — é o momento em que o limite dói. */
  onUnlock?: () => void;
}

type HabitScheduleState = ReturnType<typeof useHabitSchedule>;

/**
 * O seletor de recorrência — três modos, um só lugar.
 *
 * Criação e edição precisam exatamente do mesmo controle, e uma segunda cópia
 * divergiria sem dar erro nenhum: o hábito passaria a cobrar num ritmo que o
 * usuário não escolheu, e ninguém veria isso num code review.
 */
/** I13 (02/10/2026): a dica de campo (antes um parágrafo `muted` sob o controle)
 *  vira um "?" alinhado à direita da linha. O texto continua inteiro no tooltip. */
function HintTip({ language, label, children }: { language: Language; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <InfoTip language={language} label={label} align="right" style={{ minHeight: 28 }}>{children}</InfoTip>
    </div>
  );
}

export function HabitScheduleFields({ sched, language }: { sched: HabitScheduleState; language: Language }) {
  const isPt = language === 'pt-BR';
  /** Qual preset descreve a seleção atual — `null` quando é personalizada. */
  const presetAtual = presetDeRotina(sched.weekDays);
  /** A grade só é escondida quando um preset descreve a escolha. Quem está
   *  editando algo personalizado abre com a grade JÁ aberta, senão o controle
   *  esconderia a própria configuração da pessoa. */
  const [gradeAberta, setGradeAberta] = useState(false);
  const t = {
    repeat: isPt ? 'Repetição' : 'Repeat',
    weekdays: isPt ? 'Dias da semana' : 'Weekdays',
    timesPerWeek: isPt ? 'N× por semana' : 'N× per week',
    everyNDays: isPt ? 'A cada N dias' : 'Every N days',
    timesHelp: isPt
      ? 'Você escolhe os dias na hora — um dia ruim é uma remarcação, não uma falha.'
      : 'You pick the days as you go — a bad day is a reschedule, not a failure.',
    diario: isPt ? 'Todo dia' : 'Every day',
    uteis: isPt ? 'Dias úteis' : 'Weekdays',
    leve: isPt ? 'Leve' : 'Light',
    personalizar: isPt ? 'Personalizar' : 'Customize',
    levePista: isPt ? 'Seg · Qua · Sex' : 'Mon · Wed · Fri',
    uteisPista: isPt ? 'Seg a Sex' : 'Mon to Fri',
    fromCompletion: isPt ? 'Contar de quando eu concluir' : 'Count from when I complete it',
    fromCompletionOn: isPt ? 'Nunca acumula atrasadas.' : 'It never piles up overdue copies.',
    fromCompletionOff: isPt
      ? 'Se você pular uma, a próxima já nasce atrasada.'
      : 'If you skip one, the next is already late.',
  };
  const modes: Array<[ScheduleKind, string]> = [
    ['weekdays', t.weekdays],
    ['timesPerWeek', t.timesPerWeek],
    ['everyNDays', t.everyNDays],
  ];
  return (
    <div>
      <label style={sm2Label}>{t.repeat}</label>
      <div role="radiogroup" aria-label={t.repeat} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {modes.map(([k, label]) => (
          <Segment key={k} selected={sched.kind === k} onSelect={() => sched.setKind(k)} label={label} />
        ))}
      </div>

      {/* PRESETS DE ROTINA (P4) — três escolhas de um toque no lugar de uma
          decisão de sete partes. A pesquisa do dossiê é conclusiva: ninguém
          planeja a semana num app de hábito, e nenhum benchmark resolve isso
          com um planejador; todos resolvem com preset na criação.
          A grade completa NÃO sumiu — ela fica atrás de "Personalizar", e
          abre sozinha quando os dias escolhidos não são nenhum preset (é o
          caso de quem está editando algo que já era personalizado). */}
      {sched.kind === 'weekdays' && (
        <div>
          <div role="group" aria-label={t.repeat} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['diario', 'uteis', 'leve'] as RoutinePreset[]).map(nome => (
              <Chip
                key={nome}
                selected={presetAtual === nome}
                onToggle={() => { sched.setWeekDays([...ROUTINE_PRESETS[nome]]); setGradeAberta(false); }}
                title={nome === 'uteis' ? t.uteisPista : nome === 'leve' ? t.levePista : t.diario}
                ariaLabel={t[nome]}
                style={{ padding: '0 12px' }}
              >
                {/* Chip de escolha com a PISTA em 2ª linha (canvas
                    `CriarAtividade`: "Weekdays / Mon to Fri") — em tinta,
                    12/400, nunca alfa. */}
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left' }}>
                  {t[nome]}
                  {nome !== 'diario' && (
                    <span style={{ fontSize: 'var(--sm2-text-xs)', fontWeight: 400, color: presetAtual === nome ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>
                      {nome === 'uteis' ? t.uteisPista : t.levePista}
                    </span>
                  )}
                </span>
              </Chip>
            ))}
            <Chip
              selected={gradeAberta || presetAtual === null}
              onToggle={() => setGradeAberta(v => !v)}
              title={t.personalizar}
              ariaLabel={t.personalizar}
              style={{ padding: '0 12px' }}
            >
              {t.personalizar}
            </Chip>
          </div>

          {(gradeAberta || presetAtual === null) && (
            <div
              role="group"
              aria-label={t.weekdays}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 10 }}
            >
              {WEEKDAY_INDEXES.map(index => (
                <Chip
                  key={index}
                  selected={sched.weekDays.includes(index)}
                  onToggle={() => sched.toggleWeekDay(index)}
                  title={weekdayFull(index, language)}
                  ariaLabel={weekdayFull(index, language)}
                  style={{ padding: 0, minWidth: 44 }}
                >
                  {weekdayShort(index, language)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {sched.kind === 'timesPerWeek' && (
        <div>
          <div role="radiogroup" aria-label={isPt ? 'Vezes por semana' : 'Times per week'} style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <Segment
                key={n}
                selected={sched.timesPerWeek === n}
                onSelect={() => sched.setTimesPerWeek(n)}
                ariaLabel={`${n}× ${isPt ? 'por semana' : 'per week'}`}
                label={<span className="sm2-num">{n}×</span>}
              />
            ))}
          </div>
          <HintTip language={language} label={isPt ? 'Sobre os dias da semana' : 'About the weekly days'}>{t.timesHelp}</HintTip>
        </div>
      )}

      {sched.kind === 'everyNDays' && (
        <div>
          <label style={sm2Label} htmlFor="sm-every-n">{isPt ? 'Intervalo (dias)' : 'Interval (days)'}</label>
          <Field
            id="sm-every-n"
            type="number"
            min={1}
            max={365}
            value={String(sched.everyN)}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              sched.setEveryN(Number.isFinite(n) ? Math.min(365, Math.max(1, n)) : 1);
            }}
            style={{ maxWidth: 120 }}
          />
          <div style={{ marginTop: 4 }}>
            <CheckRow checked={sched.fromCompletion} onChange={sched.setFromCompletion}>
              {t.fromCompletion}
            </CheckRow>
          </div>
          <HintTip language={language} label={isPt ? 'Sobre contar da conclusão' : 'About counting from completion'}>
            {sched.fromCompletion ? t.fromCompletionOn : t.fromCompletionOff}
          </HintTip>
        </div>
      )}
    </div>
  );
}

/** Os dois campos curtos da âncora + a frase montada. Opcional, e a UI diz. */
export function HabitAnchorFields({ sched, language }: { sched: HabitScheduleState; language: Language }) {
  const isPt = language === 'pt-BR';
  const label = isPt ? 'Âncora (opcional)' : 'Anchor (optional)';
  const afterPh = isPt ? 'Depois do café da manhã' : 'After breakfast';
  const wherePh = isPt ? 'Na mesa da cozinha' : 'At the kitchen table';
  const sentence = anchorSentence({ after: sched.anchorAfter, where: sched.anchorWhere }, language);
  return (
    <div>
      <label style={sm2Label}>{label}</label>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field type="text" maxLength={40} value={sched.anchorAfter} aria-label={afterPh}
          onChange={(e) => sched.setAnchorAfter(e.target.value)} placeholder={afterPh} />
        <Field type="text" maxLength={40} value={sched.anchorWhere} aria-label={wherePh}
          onChange={(e) => sched.setAnchorWhere(e.target.value)} placeholder={wherePh} />
      </div>
      {/* A frase montada É a explicação: dizer "quando e onde ajuda" ao lado
          dela era a mesma informação duas vezes. */}
      {sentence && <p style={{ ...sm2Hint, color: 'var(--sm2-ink)' }}>{sentence}</p>}
    </div>
  );
}

const CATEGORIES: ActivityCategory[] = [
  'Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness',
];

/** Chips de categoria com o ícone VETOR de 20 (D-A7: `CATEGORY_ICON_NAME`,
 *  todos no subset — o PNG `icon-cat-*` fora do visor saiu). */
export function CategoryChips({
  category, setCategory, isPt,
}: {
  category: ActivityCategory;
  setCategory: (c: ActivityCategory) => void;
  isPt: boolean;
}) {
  return (
    <div>
      <label style={sm2Label}>{isPt ? 'Categoria' : 'Category'}</label>
      <div role="group" aria-label={isPt ? 'Categoria' : 'Category'} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map(cat => (
          <Chip key={cat} selected={category === cat} onToggle={() => setCategory(cat)} style={{ padding: '0 12px' }}>
            <Icon name={CATEGORY_ICON_NAME[cat]} size={20} fill={category === cat ? 1 : 0} tone="inherit" />
            {categoryLabel(cat, isPt)}
          </Chip>
        ))}
      </div>
      <StrengthensLine category={category} isPt={isPt} />
    </div>
  );
}

/**
 * Uma linha para categoria → atributo → galho. Antes eram TRÊS leituras do
 * mesmo fato: os três "+N" coloridos, o "Fortalece X" e um parágrafo dizendo
 * que o atributo mais alto decide o galho.
 */
export function StrengthensLine({ category, isPt }: { category: ActivityCategory; isPt: boolean }) {
  const attributes = CATEGORY_ATTRIBUTES[category];
  const keys: BranchType[] = ['power', 'harmony', 'benevolence'];
  const top = Math.max(...keys.map(k => attributes[k]));
  const winners = keys.filter(k => attributes[k] === top);
  return (
    <p style={sm2Hint}>
      {isPt ? 'Fortalece ' : 'Strengthens '}
      {winners.map((a, i) => (
        <span key={a} style={{ color: ATTR_INK[a], fontWeight: 500 }}>
          {i > 0 ? ' · ' : ''}{isPt ? ATTR_LABEL[a].pt : ATTR_LABEL[a].en}
          {' '}<span className="sm2-num">+{attributes[a]}</span>
        </span>
      ))}
      {isPt ? ' — e é o mais alto que decide o galho da evolução.' : ' — and the highest one decides the evolution branch.'}
    </p>
  );
}

/** A lista de passos, idêntica nos três formulários. */
export function StepsFields({
  steps, isPt, onAdd, onLabel, onDelete,
}: {
  steps: Step[];
  isPt: boolean;
  onAdd: () => void;
  onLabel: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...sm2Label, marginBottom: 0 }}>{isPt ? 'Passos (opcional)' : 'Steps (optional)'}</label>
        {/* `ghost sm` 44 (canvas): ação leve em ciano, sem borda. */}
        <button type="button" onClick={onAdd} style={{ ...sm2Button('ghost', false, 'sm'), padding: '0 8px' }}>
          <Icon name="add" size={20} />{isPt ? 'Adicionar' : 'Add'}
        </button>
      </div>
      {steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step, index) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sm2-num" style={{ ...sm2Hint, margin: 0, flexShrink: 0 }}>{index + 1}.</span>
              <Field type="text" value={step.label} onChange={(e) => onLabel(step.id, e.target.value)}
                placeholder={`${isPt ? 'Passo' : 'Step'} ${index + 1}`} />
              {/* "Remove step N": alvo 44 (achado 7), `close` 24 `muted` pelado. */}
              <button type="button" onClick={() => onDelete(step.id)}
                aria-label={isPt ? `Remover passo ${index + 1}` : `Remove step ${index + 1}`}
                style={{ width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--sm2-radius-md)' }}>
                <Icon name="close" size={24} tone="muted" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Os três níveis de esforço. A dica sob cada botão já diz a escala. */
export function EffortFields({
  effort, setEffort, isPt,
}: {
  effort: Effort;
  setEffort: (e: Effort) => void;
  isPt: boolean;
}) {
  const label = isPt ? 'Esforço' : 'Effort';
  const opts: Array<[Effort, string, string]> = [
    [1, isPt ? 'Rápida' : 'Quick', isPt ? 'minutos' : 'minutes'],
    [2, isPt ? 'Média' : 'Medium', isPt ? 'uma sentada' : 'one sitting'],
    [3, isPt ? 'Projeto' : 'Project', isPt ? 'vários dias' : 'several days'],
  ];
  return (
    <div>
      <label style={sm2Label}>{label}</label>
      <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 8 }}>
        {opts.map(([value, text, hint]) => (
          <Segment key={value} selected={effort === value} onSelect={() => setEffort(value)}
            label={text} hint={hint} ariaLabel={`${text}, ${hint}`} />
        ))}
      </div>
    </div>
  );
}

export function CreateModal({ isOpen, onClose, onSaveTask, onSaveActivity, language = 'en-US', evolutionStage = 'rookie', activitiesCount = 0, activitiesCap = 2, capIsDemoBoundary = false, onUnlock }: CreateModalProps) {
  const isPt = language === 'pt-BR';
  const showWeekdayGrid = canSelectWeekdays(evolutionStage);
  const t = useTranslation(language);

  const [isSingleExecution, setIsSingleExecution] = useState(false);
  // Captura rápida: uma linha vira o formulário inteiro. Não é enfeite — se
  // cadastrar custa três telas, a pessoa para de cadastrar, e um app de tarefas
  // onde ninguém cadastra não é usado errado, é desinstalado.
  const [quickText, setQuickText] = useState('');
  const [quickTokens, setQuickTokens] = useState<string[]>([]);
  // O formulário inteiro atrás de UMA divulgação. Antes conviviam abertos a
  // captura rápida, o formulário e um segundo accordion de passos/alarme.
  const [showForm, setShowForm] = useState(false);

  const {
    name, setName,
    category, setCategory,
    steps,
    effort, setEffort,
    hasStart, setHasStart,
    startDate, setStartDate,
    buildStartDate,
    hasDeadline, setHasDeadline,
    deadlineDate, setDeadlineDate,
    deadlineTime, setDeadlineTime,
    selectedPreset,
    customAlarmTime,
    handlePresetClick,
    handleCustomTimeChange,
    handleAddStep,
    handleUpdateStepLabel,
    handleDeleteStep,
    buildAlarm,
    buildDeadline,
  } = useItemForm({ isOpen });

  const sched = useHabitSchedule({ isOpen });

  // Nudge de tarefa mínima (utils/taskSuggestions.ts): o gargalo do modelo de
  // Fogg é Habilidade, não Motivação.
  const minHint = minimumViableHint(name, isPt ? 'pt-BR' : 'en-US');

  // Tarefa avulsa (`isSingleExecution`) NUNCA bate no teto — D-12: ela é o uso
  // espontâneo, e no desenho antigo custava a mesma cota de um hábito.
  const isAtCap = !isSingleExecution && activitiesCount >= activitiesCap;
  const isBlocked = isAtCap;
  const currentEmoji = CATEGORY_ICONS[category];

  const handleSave = () => {
    if (!name.trim()) return;

    const nowIso = new Date().toISOString();
    if (isSingleExecution) {
      onSaveTask({
        name,
        category,
        emoji: currentEmoji,
        steps: steps.length > 0 ? steps : undefined,
        deadline: buildDeadline(),
        alarm: buildAlarm(),
        effort,
        startDate: buildStartDate(),
        status: 'open',
        createdAt: nowIso,
        lastTouchedAt: nowIso,
      });
    } else {
      if (showWeekdayGrid && !sched.isValid) {
        return;
      }
      // Sem o grid liberado o hábito é de todo dia — mesmo comportamento de
      // antes, agora escrito nos dois campos.
      const schedule: Schedule = showWeekdayGrid
        ? sched.buildSchedule()
        : { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
      onSaveActivity({
        name,
        category,
        emoji: currentEmoji,
        steps,
        weekDays: showWeekdayGrid ? sched.buildWeekDays() : [0, 1, 2, 3, 4, 5, 6],
        alarm: customAlarmTime ? { time: customAlarmTime } : undefined,
        schedule,
        anchor: sched.buildAnchor(),
      });
    }
    onClose();
  };

  /**
   * Aplica o que o parser entendeu ao formulário. Nada é salvo aqui: o usuário
   * VÊ o nome e os chips do que foi reconhecido antes de confirmar. Parsing
   * invisível que erra é como o app perde a confiança dele.
   */
  const applyQuickAdd = () => {
    const raw = quickText.trim();
    if (!raw) return;
    const parsed: QuickAddResult = parseQuickAdd(raw, {
      now: new Date(),
      language: isPt ? 'pt-BR' : 'en',
    });
    setName(parsed.name);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.effort) setEffort(parsed.effort);
    if (parsed.schedule) {
      setIsSingleExecution(false);
      sched.applySchedule(parsed.schedule);
    } else {
      setIsSingleExecution(true);
      // Data solta é "quando pretendo fazer", não prazo: é o que traz a tarefa
      // para o Hoje. Quem quiser prazo marca o prazo, que é outra decisão.
      if (parsed.date) {
        setHasStart(true);
        setStartDate(parsed.date);
      }
    }
    if (parsed.time) handleCustomTimeChange(parsed.time);
    setQuickTokens(parsed.tokens);
    setQuickText('');
  };

  const txt = {
    name: isPt ? 'Nome' : 'Name',
    namePlaceholder: isPt ? 'Ex: Meditar 10 minutos' : 'Ex: Meditate 10 minutes',
    quickHelp: isPt
      ? 'Enter preenche o resto. Nada é salvo até você tocar em Salvar.'
      : 'Enter fills in the rest. Nothing is saved until you hit Save.',
    moreOptions: isPt ? 'Mais opções' : 'More options',
    lessOptions: isPt ? 'Menos opções' : 'Fewer options',
    recurring: isPt ? 'Recorrente' : 'Recurring',
    oneTime: isPt ? 'Uma vez' : 'One-time',
    frequency: isPt ? 'Frequência' : 'Frequency',
    when: isPt ? 'Quando pretendo fazer' : 'When I plan to do it',
    whenHint: isPt ? 'Só o "quando" traz a tarefa para o Hoje.' : 'Only the "when" brings the task into Today.',
    deadline: isPt ? 'Prazo' : 'Deadline',
    alarm: isPt ? 'Alarme' : 'Alarm',
    before: isPt ? 'antes' : 'before',
    cancel: isPt ? 'Cancelar' : 'Cancel',
    save: isPt ? 'Salvar' : 'Save',
    limitReached: isPt ? 'Limite atingido' : 'Limit reached',
    demoCapHint: isPt
      ? `Modo grátis: até ${activitiesCap} hábitos ativos. Tarefas avulsas continuam sem limite; `
        + 'evoluir com seu próprio Soulmon é o que aumenta esse teto.'
      : `Free mode: up to ${activitiesCap} active habits. One-off tasks stay unlimited; `
        + 'evolving your own Soulmon is what raises this ceiling.',
    projectSteps: isPt
      ? 'Projeto é grande demais para uma linha só. Que tal quebrar em passos?'
      : 'A project is too big for a single line. How about breaking it into steps?',
    openSteps: isPt ? 'Adicionar passos' : 'Add steps',
  };

  const footer = (
    <>
      {/* O botão desabilitado explica o limite, mas não oferece a saída —
          é aqui, com a tarefa já escrita, que a compra faz sentido. */}
      {isAtCap && capIsDemoBoundary && onUnlock && (
        <div style={{ marginBottom: 10 }}>
          <UnlockNudge language={language} reason="task-limit" onOpen={onUnlock} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={onClose} style={{ ...sm2Button('outline'), flex: 1 }}>{txt.cancel}</button>
        {/* Save com 1.4 do Cancel (canvas): o primário é o único e é o maior. */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || (!isSingleExecution && showWeekdayGrid && !sched.isValid) || isBlocked}
          style={{ ...sm2Button('primary', !name.trim() || (!isSingleExecution && showWeekdayGrid && !sched.isValid) || isBlocked), flex: 1.4 }}
          title={isAtCap ? (capIsDemoBoundary ? txt.demoCapHint : `${txt.limitReached} (${activitiesCap})`) : ''}
        >
          {isAtCap ? txt.limitReached : txt.save}
        </button>
      </div>
    </>
  );

  return (
    <ModalSheet
      open={isOpen}
      title={isPt ? 'Nova atividade' : t.createModal.newActivity}
      onClose={onClose}
      language={language}
      footer={footer}
    >
      {/* 1. CAPTURA RÁPIDA — o caminho primário. */}
      <div>
        <Field
          id="sm-quick-add"
          type="text"
          autoComplete="off"
          aria-label={isPt ? 'Captura rápida' : 'Quick add'}
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onBlur={applyQuickAdd}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyQuickAdd(); } }}
          placeholder={quickAddHint(isPt ? 'pt-BR' : 'en')}
        />
        <HintTip language={language} label={isPt ? 'Sobre a captura rápida' : 'About quick add'}>{txt.quickHelp}</HintTip>
      </div>

      {/* O que foi entendido. Só aparece com o formulário fechado — com ele
          aberto, os próprios campos preenchidos já são a conferência. */}
      {!showForm && name.trim() && (
        <div>
          <p className="sm2-title" style={{ margin: 0, fontSize: 'var(--sm2-text-md)', fontWeight: 500 }}>{name}</p>
          {quickTokens.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {quickTokens.map((tk, i) => (
                <span key={`${tk}-${i}`} style={{ ...sm2Tag, color: 'var(--sm2-primary-ink)' }}>{tk}</span>
              ))}
            </div>
          )}
          {minHint && <p style={sm2Hint}>{minHint}</p>}
        </div>
      )}

      {/* 2. O FORMULÁRIO INTEIRO, atrás de uma divulgação só. */}
      <div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          aria-expanded={showForm}
          style={{ ...sm2Button('quiet', false, 'sm'), padding: '0 8px', alignSelf: 'flex-start' }}
        >
          <Icon name={showForm ? 'expand_less' : 'expand_more'} size={20} />
          {showForm ? txt.lessOptions : txt.moreOptions}
        </button>

        {showForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 14 }}>
            <div>
              <label style={sm2Label} htmlFor="sm-create-name">{txt.name}</label>
              <Field id="sm-create-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={txt.namePlaceholder} maxLength={60} />
              {/* Convite, não correção: some se o usuário ignorar, e a meta
                  segue sendo dele (autonomia da SDT). */}
              {minHint && <p style={sm2Hint}>{minHint}</p>}
            </div>

            <CategoryChips category={category} setCategory={setCategory} isPt={isPt} />

            <div>
              <label style={sm2Label}>{txt.frequency}</label>
              <div role="radiogroup" aria-label={txt.frequency} style={{ display: 'flex', gap: 8 }}>
                <Segment selected={!isSingleExecution} onSelect={() => setIsSingleExecution(false)} label={txt.recurring} />
                <Segment selected={isSingleExecution} onSelect={() => setIsSingleExecution(true)} label={txt.oneTime} />
              </div>
            </div>

            {!isSingleExecution && showWeekdayGrid && <HabitScheduleFields sched={sched} language={language} />}
            {!isSingleExecution && <HabitAnchorFields sched={sched} language={language} />}

            {isSingleExecution && (
              <>
                <div>
                  <EffortFields effort={effort} setEffort={setEffort} isPt={isPt} />
                  {/* Sugestão, nunca obrigação: projeto sem passos continua salvável. */}
                  {effort === 3 && steps.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ ...sm2Hint, margin: 0, flex: 1, minWidth: 180 }}>{txt.projectSteps}</span>
                      <button type="button" onClick={handleAddStep} style={{ ...sm2Button('ghost', false, 'sm'), padding: '0 8px', minWidth: 44 }}>
                        {txt.openSteps}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <CheckRow checked={hasStart} onChange={(v) => { setHasStart(v); if (v && !startDate) setStartDate(todayIso()); }}>
                    {txt.when}
                  </CheckRow>
                  {hasStart && (
                    <Field type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      aria-label={txt.when} />
                  )}
                  <HintTip language={language} label={isPt ? 'Sobre o "quando"' : 'About the "when"'}>{txt.whenHint}</HintTip>
                </div>

                <div>
                  <CheckRow checked={hasDeadline} onChange={setHasDeadline}>{txt.deadline}</CheckRow>
                  {hasDeadline && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Field type="date" value={deadlineDate} aria-label={isPt ? 'Data do prazo' : 'Deadline date'}
                        onChange={(e) => setDeadlineDate(e.target.value)} />
                      <Field type="time" value={deadlineTime} aria-label={isPt ? 'Hora do prazo' : 'Deadline time'}
                        onChange={(e) => setDeadlineTime(e.target.value)} />
                    </div>
                  )}
                </div>
              </>
            )}

            <StepsFields steps={steps} isPt={isPt} onAdd={handleAddStep}
              onLabel={handleUpdateStepLabel} onDelete={handleDeleteStep} />

            <div>
              <label style={sm2Label} htmlFor="sm-create-alarm">
                {isSingleExecution ? txt.alarm : isPt ? 'Horário (opcional)' : 'Time (optional)'}
              </label>
              {isSingleExecution && hasDeadline && (
                <div role="radiogroup" aria-label={txt.alarm} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {(['2h', '1h', '30min'] as const).map(preset => (
                    <Segment key={preset} selected={selectedPreset === preset}
                      onSelect={() => handlePresetClick(preset)} label={`${preset} ${txt.before}`} />
                  ))}
                </div>
              )}
              <Field id="sm-create-alarm" type="time" value={customAlarmTime}
                onChange={(e) => handleCustomTimeChange(e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
