import { ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS } from '../types/category-icons';
import { useItemForm, todayIso } from '../hooks/useItemForm';
import type { Language } from '../utils/i18n';
import type { Effort } from '../types/taskModel';
import { CategoryChips, EffortFields, StepsFields } from './CreateModal';
import { CheckRow, Field, ModalSheet, Segment, sm2Button, sm2Hint, sm2Label } from './form/FormKit';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: string;
    emoji: string;
    steps?: { id: string; label: string; completed: boolean }[];
    deadline?: { date: string; time: string };
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
    effort?: Effort;
    /** Quando pretendo fazer — só isto traz a tarefa para o Hoje. */
    startDate?: string;
    lastTouchedAt?: string;
  }) => void;
  onDelete?: () => void;
  title?: string;
  initialData?: {
    name: string;
    category: string;
    emoji: string;
    steps?: { id: string; label: string; completed: boolean }[];
    deadline?: { date: string; time: string };
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
    effort?: Effort;
    startDate?: string;
  };
  language?: Language;
}

export function TaskEditModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  title,
  initialData,
  language = 'en-US',
}: TaskEditModalProps) {
  const isPt = language === 'pt-BR';

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
    hasAlarm, setHasAlarm,
    selectedPreset,
    customAlarmTime,
    handlePresetClick,
    handleCustomTimeChange,
    handleAddStep,
    handleUpdateStepLabel,
    handleDeleteStep,
    buildAlarm,
    buildDeadline,
  } = useItemForm({ isOpen, initialData });

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      category,
      emoji: CATEGORY_ICONS[category as ActivityCategory],
      steps: steps.length > 0 ? steps : undefined,
      deadline: buildDeadline(),
      alarm: hasAlarm ? buildAlarm() : undefined,
      effort,
      startDate: buildStartDate(),
      lastTouchedAt: new Date().toISOString(),
    });
    onClose();
  };

  const txt = {
    when: isPt ? 'Quando pretendo fazer' : 'When I plan to do it',
    whenHint: isPt ? 'Só o "quando" traz a tarefa para o Hoje.' : 'Only the "when" brings the task into Today.',
    deadline: isPt ? 'Prazo' : 'Deadline',
    alarm: isPt ? 'Alarme' : 'Alarm',
    before: isPt ? 'antes' : 'before',
    projectSteps: isPt
      ? 'Projeto é grande demais para uma linha só. Que tal quebrar em passos?'
      : 'A project is too big for a single line. How about breaking it into steps?',
    add: isPt ? 'Adicionar' : 'Add',
  };

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={onClose} style={{ ...sm2Button('ghost'), flex: 1 }}>
          {isPt ? 'Cancelar' : 'Cancel'}
        </button>
        <button type="button" onClick={handleSave} disabled={!name.trim()}
          style={{ ...sm2Button('primary', !name.trim()), flex: 1 }}>
          {isPt ? 'Salvar' : 'Save'}
        </button>
      </div>
      {onDelete && (
        <button type="button" onClick={onDelete}
          style={{ ...sm2Button('quiet'), width: '100%', color: 'var(--sm2-danger-ink)' }}>
          {isPt ? 'Excluir' : 'Delete'}
        </button>
      )}
    </div>
  );

  return (
    <ModalSheet
      open={isOpen}
      title={title ?? (isPt ? 'Editar tarefa' : 'Edit task')}
      onClose={onClose}
      language={language}
      footer={footer}
    >
      <div>
        <label style={sm2Label} htmlFor="sm-task-name">{isPt ? 'Nome' : 'Name'}</label>
        <Field id="sm-task-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <CategoryChips category={category} setCategory={setCategory} isPt={isPt} />

      {/* Esforço — a recompensa escala com ISTO, nunca com a contagem. */}
      <div>
        <EffortFields effort={effort} setEffort={setEffort} isPt={isPt} />
        {/* Sugestão, nunca obrigação. */}
        {effort === 3 && steps.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ ...sm2Hint, margin: 0, flex: 1, minWidth: 180 }}>{txt.projectSteps}</span>
            <button type="button" onClick={handleAddStep} style={{ ...sm2Button('ghost'), padding: '6px 12px' }}>
              {txt.add}
            </button>
          </div>
        )}
      </div>

      <StepsFields steps={steps} isPt={isPt} onAdd={handleAddStep}
        onLabel={handleUpdateStepLabel} onDelete={handleDeleteStep} />

      <div>
        <CheckRow checked={hasStart} onChange={(v) => { setHasStart(v); if (v && !startDate) setStartDate(todayIso()); }}>
          {txt.when}
        </CheckRow>
        {hasStart && (
          <Field type="date" value={startDate} aria-label={txt.when}
            onChange={(e) => setStartDate(e.target.value)} />
        )}
        <p style={sm2Hint}>{txt.whenHint}</p>
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

      <div>
        <CheckRow checked={hasAlarm} onChange={setHasAlarm}>{txt.alarm}</CheckRow>
        {hasAlarm && (
          <>
            {hasDeadline && (
              <div role="radiogroup" aria-label={txt.alarm} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {(['2h', '1h', '30min'] as const).map(preset => (
                  <Segment key={preset} selected={selectedPreset === preset}
                    onSelect={() => handlePresetClick(preset)} label={`${preset} ${txt.before}`} />
                ))}
              </div>
            )}
            <Field type="time" value={customAlarmTime} aria-label={txt.alarm}
              onChange={(e) => handleCustomTimeChange(e.target.value)} />
          </>
        )}
      </div>
    </ModalSheet>
  );
}
