import { useState } from 'react';
import { Plus } from 'lucide-react';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import iconTrash from '../assets/soulmon/icons/icon-trash.png';
import iconClock from '../assets/soulmon/icons/icon-clock.png';
import iconBell from '../assets/soulmon/icons/icon-bell.png';
import { Input } from './ui/input';
import {
  CATEGORY_ATTRIBUTES, ATTR_COLOR, ATTR_ICON, ATTR_INK, ATTR_LABEL,
  ActivityCategory, type BranchType,
} from '../types/attributes';
import { CATEGORY_ICONS, CATEGORY_ICON_IMG, categoryLabel } from '../types/category-icons';
import { canSelectWeekdays } from '../types/progression';
import { Language, useTranslation } from '../utils/i18n';
import { WEEKDAY_INDEXES, weekdayFull, weekdayShort } from '../utils/weekdays';
import { PixelChoiceChip, PixelTag } from './pixel/PixelKit';
import {
  useItemForm, useHabitSchedule, anchorSentence, todayIso,
  type Step, type ScheduleKind,
} from '../hooks/useItemForm';
import { UnlockNudge } from './UnlockAccountModal';
import { minimumViableHint } from '../utils/taskSuggestions';
import { parseQuickAdd, quickAddHint, type QuickAddResult } from '../utils/quickAdd';
import type { Effort, HabitAnchor, Schedule } from '../types/taskModel';

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
  /** Monetização (utils/monetization.ts): modo demo já usou a criação de hoje. */
  demoLimitReached?: boolean;
  /** Abre a oferta de desbloqueio (UnlockAccountModal). Só faz sentido junto
   *  com demoLimitReached — é o momento em que o limite dói. */
  onUnlock?: () => void;
}

type HabitScheduleState = ReturnType<typeof useHabitSchedule>;

const fieldStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', outline: 'none' };
const fieldLabelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--sm-muted)',
};
const modeStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700,
  border: active ? '2px solid var(--sm-px-cyan)' : '2px solid color-mix(in srgb, var(--sm-px-copper) 65%, transparent)',
  backgroundColor: active ? 'var(--sm-px-cyan)' : 'var(--sm-surface)',
  color: active ? '#04211f' : 'var(--sm-ink)',
});

/**
 * O seletor de recorrência — três modos, um só lugar.
 *
 * Criação e edição precisam exatamente do mesmo controle, e uma segunda cópia
 * divergiria sem dar erro nenhum: o hábito passaria a cobrar num ritmo que o
 * usuário não escolheu, e ninguém veria isso num code review.
 */
export function HabitScheduleFields({ sched, language }: { sched: HabitScheduleState; language: Language }) {
  const isPt = language === 'pt-BR';
  const t = {
    repeat: isPt ? 'Repetição' : 'Repeat',
    weekdays: isPt ? 'Dias da semana' : 'Weekdays',
    timesPerWeek: isPt ? 'N× por semana' : 'N× per week',
    everyNDays: isPt ? 'A cada N dias' : 'Every N days',
    timesLabel: isPt ? 'Vezes por semana' : 'Times per week',
    timesHelp: isPt
      ? 'Você escolhe os dias na hora — um dia ruim é uma remarcação, não uma falha.'
      : 'You pick the days as you go — a bad day is a reschedule, not a failure.',
    everyNLabel: isPt ? 'Intervalo (dias)' : 'Interval (days)',
    fromCompletion: isPt ? 'Contar a partir de quando eu concluir' : 'Count from when I complete it',
    fromCompletionOn: (n: number) => isPt
      ? `A cada ${n} dias, contando de quando eu fizer. Nunca acumula atrasadas.`
      : `Every ${n} days, counting from when I do it. It never piles up overdue copies.`,
    fromCompletionOff: (n: number) => isPt
      ? `A cada ${n} dias a partir da data prevista — se você pular, a próxima já nasce atrasada.`
      : `Every ${n} days from the scheduled date — if you skip one, the next is already late.`,
  };
  const modes: Array<[ScheduleKind, string]> = [
    ['weekdays', t.weekdays],
    ['timesPerWeek', t.timesPerWeek],
    ['everyNDays', t.everyNDays],
  ];
  return (
    <div>
      <label style={fieldLabelStyle}>{t.repeat}</label>
      <div role="radiogroup" aria-label={t.repeat} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {modes.map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={sched.kind === k}
            onClick={() => sched.setKind(k)} style={modeStyle(sched.kind === k)}>
            {label}
          </button>
        ))}
      </div>

      {sched.kind === 'weekdays' && (
        <div>
          <label style={fieldLabelStyle}>{t.weekdays} <span style={{ color: '#e0483e' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {WEEKDAY_INDEXES.map(index => (
              <PixelChoiceChip
                key={index}
                shape="day"
                selected={sched.weekDays.includes(index)}
                onToggle={() => sched.toggleWeekDay(index)}
                title={weekdayFull(index, language)}
                ariaLabel={weekdayFull(index, language)}
              >
                {weekdayShort(index, language)}
              </PixelChoiceChip>
            ))}
          </div>
        </div>
      )}

      {sched.kind === 'timesPerWeek' && (
        <div>
          <label style={fieldLabelStyle} htmlFor="sm-times-week">{t.timesLabel}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <button key={n} type="button" role="radio" aria-checked={sched.timesPerWeek === n}
                aria-label={`${n}× ${isPt ? 'por semana' : 'per week'}`}
                onClick={() => sched.setTimesPerWeek(n)} style={modeStyle(sched.timesPerWeek === n)}>
                {n}×
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 6, lineHeight: 1.45 }}>{t.timesHelp}</p>
        </div>
      )}

      {sched.kind === 'everyNDays' && (
        <div>
          <label style={fieldLabelStyle} htmlFor="sm-every-n">{t.everyNLabel}</label>
          <Input
            id="sm-every-n"
            type="number"
            min={1}
            max={365}
            value={String(sched.everyN)}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              sched.setEveryN(Number.isFinite(n) ? Math.min(365, Math.max(1, n)) : 1);
            }}
            className="sm-px-field"
            style={{ ...fieldStyle, maxWidth: 120 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 10 }}>
            <input type="checkbox" checked={sched.fromCompletion}
              onChange={(e) => sched.setFromCompletion(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
            <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{t.fromCompletion}</span>
          </label>
          <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 6, lineHeight: 1.45 }}>
            {sched.fromCompletion ? t.fromCompletionOn(sched.everyN) : t.fromCompletionOff(sched.everyN)}
          </p>
        </div>
      )}
    </div>
  );
}

/** Os dois campos curtos da âncora + a frase montada. Opcional, e a UI diz. */
export function HabitAnchorFields({ sched, language }: { sched: HabitScheduleState; language: Language }) {
  const isPt = language === 'pt-BR';
  const t = {
    anchor: isPt ? 'Âncora' : 'Anchor',
    optional: isPt ? '(opcional)' : '(optional)',
    after: isPt ? 'Depois de...' : 'After...',
    where: isPt ? 'Onde...' : 'Where...',
    afterPh: isPt ? 'o café da manhã' : 'breakfast',
    wherePh: isPt ? 'a mesa da cozinha' : 'the kitchen table',
    help: isPt
      ? 'Dizer quando e onde aumenta muito a chance de o hábito acontecer.'
      : 'Saying when and where makes the habit far more likely to happen.',
  };
  const sentence = anchorSentence({ after: sched.anchorAfter, where: sched.anchorWhere }, language);
  return (
    <div>
      <label style={fieldLabelStyle}>
        {t.anchor} <span style={{ opacity: 0.7, fontWeight: 500 }}>{t.optional}</span>
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ ...fieldLabelStyle, fontSize: 11 }} htmlFor="sm-anchor-after">{t.after}</label>
          <Input id="sm-anchor-after" type="text" maxLength={40} value={sched.anchorAfter}
            onChange={(e) => sched.setAnchorAfter(e.target.value)} placeholder={t.afterPh}
            className="sm-px-field" style={fieldStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ ...fieldLabelStyle, fontSize: 11 }} htmlFor="sm-anchor-where">{t.where}</label>
          <Input id="sm-anchor-where" type="text" maxLength={40} value={sched.anchorWhere}
            onChange={(e) => sched.setAnchorWhere(e.target.value)} placeholder={t.wherePh}
            className="sm-px-field" style={fieldStyle} />
        </div>
      </div>
      {sentence && (
        <p style={{ fontSize: '0.8rem', color: 'var(--sm-ink)', fontWeight: 700, marginTop: 8 }}>{sentence}</p>
      )}
      <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 4, lineHeight: 1.45 }}>{t.help}</p>
    </div>
  );
}

const CATEGORIES: ActivityCategory[] = [
  'Health',
  'Creativity',
  'Discipline',
  'Study',
  'Work',
  'Social',
  'Wellness',
  'Fitness',
];


// Weekday labels and names in English

export function CreateModal({ isOpen, onClose, onSaveTask, onSaveActivity, language = 'en-US', evolutionStage = 'rookie', activitiesCount = 0, activitiesCap = 2, demoLimitReached = false, onUnlock }: CreateModalProps) {
  const isPt = language === 'pt-BR';
  const showWeekdayGrid = canSelectWeekdays(evolutionStage);
  const t = useTranslation(language);

  const [isSingleExecution, setIsSingleExecution] = useState(false);
  // Captura rápida: uma linha vira o formulário inteiro. Não é enfeite — se
  // cadastrar custa três telas, a pessoa para de cadastrar, e um app de tarefas
  // onde ninguém cadastra não é usado errado, é desinstalado.
  const [quickText, setQuickText] = useState('');
  const [quickTokens, setQuickTokens] = useState<string[]>([]);
  // Passos e alarme são opcionais e raramente usados na criação — escondidos
  // atrás de um accordion pra tela padrão não vir com tudo desdobrado de uma
  // vez (era a maior fonte da poluição visual: 2 seções inteiras sempre
  // abertas mesmo vazias).
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const isAtCap = !isSingleExecution && activitiesCount >= activitiesCap;
  const isBlocked = isAtCap || demoLimitReached;

  const attributes = CATEGORY_ATTRIBUTES[category];
  const currentEmoji = CATEGORY_ICONS[category];

  if (!isOpen) return null;

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
   * VÊ os campos preenchidos e os chips do que foi reconhecido antes de
   * confirmar. Parsing invisível que erra é como o app perde a confiança dele.
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

  // Translation helpers
  const txt = {
    name: isPt ? 'Nome' : 'Name',
    namePlaceholder: isPt ? 'Ex: Meditar 10 minutos' : 'Ex: Meditate 10 minutes',
    category: isPt ? 'Categoria' : 'Category',
    attributesLabel: isPt ? 'Atributos por atividade completa:' : 'Attributes per completed activity:',
    steps: isPt ? 'Passos' : 'Steps',
    stepsOptional: isPt ? '(opcional)' : '(optional)',
    addButton: isPt ? 'Adicionar' : 'Add',
    executeOnce: isPt ? 'Executar apenas uma vez' : 'Execute only once',
    frequency: isPt ? 'Frequência' : 'Frequency',
    recurring: isPt ? 'Recorrente' : 'Recurring',
    oneTime: isPt ? 'Uma vez' : 'One-time',
    moreOptions: isPt ? 'Passos e alarme' : 'Steps and alarm',
    weekdays: isPt ? 'Dias da semana' : 'Weekdays',
    defineDeadline: isPt ? 'Definir deadline' : 'Set deadline',
    date: isPt ? 'Data' : 'Date',
    time: isPt ? 'Hora' : 'Time',
    alarm: isPt ? 'Alarme' : 'Alarm',
    schedule: isPt ? 'Horário' : 'Schedule',
    optional: isPt ? '(opcional)' : '(optional)',
    quickOptions: isPt ? 'Opções rápidas:' : 'Quick options:',
    before: isPt ? 'antes' : 'before',
    customTime: isPt ? 'Horário customizado' : 'Custom time',
    cancel: isPt ? 'Cancelar' : 'Cancel',
    save: isPt ? 'Salvar' : 'Save',
    limitReached: isPt ? 'Limite Atingido' : 'Limit Reached',
    demoLimitReached: isPt ? 'Limite diário do demo' : 'Demo daily limit',
    demoLimitHint: isPt
      ? 'Modo demo: 1 atividade/tarefa nova por dia. Assine para criar sem limites.'
      : 'Demo mode: 1 new activity/task per day. Subscribe to create without limits.',
    quickAdd: isPt ? 'Captura rápida' : 'Quick add',
    quickAddApply: isPt ? 'Preencher' : 'Fill in',
    quickAddRead: isPt ? 'Entendi:' : 'I read:',
    quickAddCheck: isPt
      ? 'Confira e ajuste — nada foi salvo ainda.'
      : 'Check and adjust — nothing is saved yet.',
    when: isPt ? 'Quando pretendo fazer' : 'When I plan to do it',
    whenVsDeadline: isPt
      ? 'O "quando" é o dia em que você vai fazer, e só ele traz a tarefa para o Hoje; o prazo é só o dia em que ela vence.'
      : 'The "when" is the day you plan to do it, and only it brings the task into Today; the deadline is just the day it is due.',
    effort: isPt ? 'Esforço' : 'Effort',
    effortReward: isPt
      ? 'A recompensa escala com o esforço — uma tarefa grande vale mais que três triviais.'
      : 'The reward scales with effort — one big task is worth more than three trivial ones.',
    effort1: isPt ? 'Rápida' : 'Quick',
    effort2: isPt ? 'Média' : 'Medium',
    effort3: isPt ? 'Projeto' : 'Project',
    effort1Hint: isPt ? 'minutos' : 'minutes',
    effort2Hint: isPt ? 'uma sentada' : 'one sitting',
    effort3Hint: isPt ? 'vários dias' : 'several days',
    projectSteps: isPt
      ? 'Projeto é grande demais para uma linha só. Que tal quebrar em passos? (opcional)'
      : 'A project is too big for a single line. How about breaking it into steps? (optional)',
    openSteps: isPt ? 'Adicionar passos' : 'Add steps',
    strengthens: isPt ? 'Fortalece' : 'Strengthens',
    branchHint: isPt
      ? 'É o atributo mais alto que decide o galho da árvore de evolução do seu Soulmon.'
      : 'The highest attribute is what decides the branch of your Soulmon evolution tree.',
  };

  // O atributo dominante da categoria. A conexão categoria → atributo → galho
  // existia só no código, e ela é o melhor argumento do produto.
  const attrKeys: BranchType[] = ['virus', 'data', 'vaccine'];
  const topAttrValue = Math.max(...attrKeys.map(k => attributes[k]));
  const topAttrs = attrKeys.filter(k => attributes[k] === topAttrValue);

  const inputStyle: React.CSSProperties = {
    /* Visual mora em .sm-px-field (kit); aqui só layout. */
    width: '100%', boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--sm-muted)' };
  const segment = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', textAlign: 'center', cursor: 'pointer',
    border: active ? '2px solid var(--sm-px-cyan)' : '2px solid color-mix(in srgb, var(--sm-px-copper) 65%, transparent)',
    backgroundColor: active ? 'var(--sm-px-cyan)' : 'var(--sm-surface)',
    color: active ? '#04211f' : 'var(--sm-ink)',
    fontSize: 13, fontWeight: 700,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(4, 18, 20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sm-card" style={{ backgroundColor: 'var(--sm-bg)', width: '100%', maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'Nova atividade' : t.createModal.newActivity}
          </span>
          <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}>
            <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Captura rápida — o campo que decide se o sistema sobrevive à
              segunda semana. Fica no TOPO porque é o caminho normal; o
              formulário abaixo é a conferência, não o trabalho. */}
          <div>
            <label style={labelStyle} htmlFor="sm-quick-add">{txt.quickAdd}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                id="sm-quick-add"
                type="text"
                autoComplete="off"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyQuickAdd(); } }}
                placeholder={quickAddHint(isPt ? 'pt-BR' : 'en')}
                className="sm-px-field"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={applyQuickAdd} disabled={!quickText.trim()}
                className="sm-btn sm-btn-secondary" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
                {txt.quickAddApply}
              </button>
            </div>
            {quickTokens.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sm-muted)' }}>{txt.quickAddRead}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {quickTokens.map((tk, i) => (
                    <PixelTag key={`${tk}-${i}`}>{tk}</PixelTag>
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 6 }}>{txt.quickAddCheck}</p>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>{txt.name}</label>
            <Input type="text" autoComplete="new-password" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={txt.namePlaceholder} maxLength={60} className="sm-px-field" style={inputStyle} />
            {/* Convite, não correção: some se o usuário ignorar, e a meta segue
                sendo dele (autonomia da SDT). */}
            {minHint && (
              <p style={{ fontSize: '0.74rem', color: 'var(--sm-muted)', marginTop: 6, lineHeight: 1.45 }}>💡 {minHint}</p>
            )}
          </div>

          {/* Category — chips (mesmo estilo do resto do app), com o preview
              de atributo grudado embaixo em vez de virar um card à parte:
              é informação secundária, não merece seção própria. */}
          <div>
            <label style={labelStyle}>{txt.category}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <PixelChoiceChip
                  key={cat}
                  selected={category === cat}
                  onToggle={() => setCategory(cat)}
                  icon={CATEGORY_ICON_IMG[cat]}
                >
                  {categoryLabel(cat, isPt)}
                </PixelChoiceChip>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {(['virus', 'data', 'vaccine'] as const).map(a => (
                <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: ATTR_COLOR[a] }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ATTR_COLOR[a] }} />
                  +{attributes[a]}
                </span>
              ))}
            </div>
            {/* Categoria → atributo → galho da evolução. A conexão existia só
                no código, e ela é o melhor argumento do produto. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sm-muted)' }}>{txt.strengthens}</span>
              {topAttrs.map(a => (
                <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: ATTR_INK[a] }}>
                  <img src={ATTR_ICON[a]} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  {isPt ? ATTR_LABEL[a].pt : ATTR_LABEL[a].en}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 4, lineHeight: 1.45 }}>{txt.branchHint}</p>
          </div>

          {/* Frequência — controle único (recorrente/uma vez) em vez de
              checkbox solto; mesma decisão, forma mais fácil de escanear. */}
          <div>
            <label style={labelStyle}>{txt.frequency}</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setIsSingleExecution(false)} style={segment(!isSingleExecution)}>
                {txt.recurring}
              </button>
              <button type="button" onClick={() => setIsSingleExecution(true)} style={segment(isSingleExecution)}>
                {txt.oneTime}
              </button>
            </div>
          </div>

          {/* Recorrência — três modos, dias-da-semana como padrão. */}
          {!isSingleExecution && showWeekdayGrid && (
            <HabitScheduleFields sched={sched} language={language} />
          )}

          {/* Âncora do hábito (implementation intention). Sempre opcional. */}
          {!isSingleExecution && (
            <HabitAnchorFields sched={sched} language={language} />
          )}

          {/* Esforço — só tarefas. Padrão Rápida. */}
          {isSingleExecution && (
            <div>
              <label style={labelStyle}>{txt.effort}</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {([
                  [1, txt.effort1, txt.effort1Hint],
                  [2, txt.effort2, txt.effort2Hint],
                  [3, txt.effort3, txt.effort3Hint],
                ] as const).map(([value, label, hint]) => {
                  const active = effort === value;
                  return (
                    <button key={value} type="button" role="radio" aria-checked={active}
                      onClick={() => setEffort(value as Effort)}
                      style={{ ...segment(active), display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 4px' }}>
                      <span>{label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.8 }}>{hint}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 6, lineHeight: 1.45 }}>{txt.effortReward}</p>
              {/* Sugestão, nunca obrigação: projeto sem passos continua salvável. */}
              {effort === 3 && steps.length === 0 && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--sm-muted)', lineHeight: 1.45 }}>💡 {txt.projectSteps}</span>
                  <button type="button" onClick={() => { setShowAdvanced(true); handleAddStep(); }}
                    className="sm-btn sm-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    {txt.openSteps}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* "Quando" — separado do prazo, e é só ele que traz para o Hoje. */}
          {isSingleExecution && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: hasStart ? 10 : 0 }}>
                <input type="checkbox" checked={hasStart} onChange={(e) => { setHasStart(e.target.checked); if (e.target.checked && !startDate) setStartDate(todayIso()); }}
                  style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
                <img src={iconClock} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{txt.when}</span>
              </label>
              {hasStart && (
                <div style={{ marginLeft: 28 }}>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="sm-px-field" style={inputStyle} />
                </div>
              )}
              <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', marginTop: 6, lineHeight: 1.45 }}>{txt.whenVsDeadline}</p>
            </div>
          )}

          {/* Deadline */}
          {isSingleExecution && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: hasDeadline ? 10 : 0 }}>
                <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
                <img src={iconClock} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{txt.defineDeadline}</span>
              </label>
              {hasDeadline && (
                <div style={{ display: 'flex', gap: 10, marginLeft: 28 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>{txt.date}</label>
                    <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="sm-px-field" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>{txt.time}</label>
                    <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="sm-px-field" style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passos e alarme — accordion. As duas seções mais raramente
              usadas na criação (a maioria das tarefas não precisa de nenhuma
              das duas) não vêm mais abertas por padrão. */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--sm-primary)', fontSize: 13, fontWeight: 700 }}>
              <span style={{ display: 'inline-block', transition: 'transform .15s ease', transform: showAdvanced ? 'rotate(90deg)' : 'none' }}>▸</span>
              {txt.moreOptions}
            </button>

            {showAdvanced && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
                {/* Steps */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      {txt.steps} <span style={{ opacity: 0.7, fontWeight: 500 }}>{txt.stepsOptional}</span>
                    </label>
                    <button onClick={handleAddStep} className="sm-btn sm-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                      <Plus size={14} strokeWidth={2.4} />{txt.addButton}
                    </button>
                  </div>
                  {steps.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {steps.map((step, index) => (
                        <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--sm-muted)', flexShrink: 0 }}>{index + 1}.</span>
                          <Input type="text" value={step.label} onChange={(e) => handleUpdateStepLabel(step.id, e.target.value)}
                            placeholder={`${isPt ? 'Passo' : 'Step'} ${index + 1}`} className="sm-px-field" style={{ ...inputStyle, padding: '8px 11px' }} />
                          <button onClick={() => handleDeleteStep(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0, color: '#e0483e' }}>
                            <img src={iconTrash} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timer/Alarm */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <img src={iconBell} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-muted)' }}>
                      {isSingleExecution ? txt.alarm : txt.schedule}
                    </span>
                  </div>
                  <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {isSingleExecution && hasDeadline && (
                      <div>
                        <label style={{ ...labelStyle, fontSize: 11 }}>{txt.quickOptions}</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['2h', '1h', '30min'] as const).map(preset => {
                            const active = selectedPreset === preset;
                            return (
                              <button key={preset} type="button" onClick={() => handlePresetClick(preset)}
                                style={{
                                  flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                                  border: active ? '2px solid var(--sm-primary)' : '2px solid var(--sm-line)',
                                  background: active ? 'var(--sm-primary)' : 'var(--sm-surface)',
                                  color: active ? 'var(--sm-btn-text)' : 'var(--sm-ink)',
                                }}>
                                {preset} {txt.before}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={{ ...labelStyle, fontSize: 11 }}>{txt.customTime}</label>
                      <Input type="time" value={customAlarmTime} onChange={(e) => handleCustomTimeChange(e.target.value)} className="sm-px-field" style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: 16, background: 'var(--sm-surface)', borderTop: '1px solid var(--sm-line)' }}>
          {/* O botão desabilitado explica o limite, mas não oferece a saída —
              é aqui, com a tarefa já escrita, que a compra faz sentido. */}
          {demoLimitReached && onUnlock && (
            <div style={{ marginBottom: 10 }}>
              <UnlockNudge language={language} reason="task-limit" onOpen={onUnlock} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 14 }}>
          <button onClick={onClose} className="sm-btn sm-btn-secondary" style={{ flex: 1 }}>{txt.cancel}</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || (!isSingleExecution && showWeekdayGrid && !sched.isValid) || isBlocked}
            className="sm-btn" style={{ flex: 1 }}
            title={isAtCap ? `${txt.limitReached} (${activitiesCap})` : demoLimitReached ? txt.demoLimitHint : ''}
          >
            {isAtCap ? txt.limitReached : demoLimitReached ? txt.demoLimitReached : txt.save}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
