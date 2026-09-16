import { useState, useEffect } from 'react';
import { ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS } from '../types/category-icons';
import { useHabitSchedule } from '../hooks/useItemForm';
import { CategoryChips, HabitAnchorFields, HabitScheduleFields, StepsFields } from './CreateModal';
import { UnlockNudge } from './UnlockAccountModal';
import { Field, ModalSheet, sm2Button, sm2Label } from './form/FormKit';
import type { HabitAnchor, Schedule } from '../types/taskModel';
import type { Language } from '../utils/i18n';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: string;
    emoji: string;
    steps: Step[];
    /** Escrito junto de `schedule`: é o campo que o widget Android e o app de
     *  desktop leem, e nenhum dos dois carrega o motor de recorrência novo. */
    weekDays: number[];
    alarm?: { time: string };
    schedule?: Schedule;
    anchor?: HabitAnchor;
  }) => void;
  onDelete?: () => void;
  /** O teto de hábitos ATIVOS bate aqui também (D-12).
   *
   *  Este modal é o do botão principal da tela inicial, e era por ele que o teto
   *  do modo grátis vazava inteiro: ele salvava sem perguntar nada. O portão do
   *  `App` agora recusa — e recusar em silêncio, depois de a pessoa escrever a
   *  atividade toda, seria trocar um defeito por outro. Então a mesma parede que
   *  o `CreateModal` mostra aparece aqui, com as mesmas palavras.
   *
   *  Só vale na CRIAÇÃO: editar um hábito que já existe não cria vaga nenhuma. */
  atCap?: boolean;
  /** O teto que morde é a fronteira do modo GRÁTIS (e não o teto do estágio, que
   *  o pagante também tem)? Só então o convite de compra faz sentido. */
  capIsDemoBoundary?: boolean;
  activitiesCap?: number;
  onUnlock?: () => void;
  initialData?: {
    name: string;
    category: string;
    emoji: string;
    steps?: Step[];
    weekDays?: number[];
    alarm?: { time: string };
    schedule?: Schedule;
    anchor?: HabitAnchor;
  };
  language?: Language;
  canEditWeekdays?: boolean; // Se a atividade foi criada quando podia selecionar dias
}

const CATEGORIES: ActivityCategory[] = [
  'Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness',
];

export function EditModal({
  isOpen, onClose, onSave, onDelete, initialData, language = 'en-US', canEditWeekdays = true,
  atCap = false, capIsDemoBoundary = false, activitiesCap = 0, onUnlock,
}: EditModalProps) {
  const isPt = language === 'pt-BR';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>(CATEGORIES[0]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [alarmTime, setAlarmTime] = useState('');
  const sched = useHabitSchedule({ isOpen, initial: initialData });

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setCategory(initialData.category as ActivityCategory);
      setSteps(initialData.steps || []);
      setAlarmTime(initialData.alarm?.time || '');
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim() || (canEditWeekdays && !sched.isValid)) return;
    onSave({
      name, category, emoji: CATEGORY_ICONS[category], steps,
      weekDays: canEditWeekdays ? sched.buildWeekDays() : [0, 1, 2, 3, 4, 5, 6],
      alarm: alarmTime ? { time: alarmTime } : undefined,
      schedule: canEditWeekdays ? sched.buildSchedule() : { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] },
      anchor: sched.buildAnchor(),
    });
    onClose();
  };

  const handleAddStep = () => {
    setSteps([...steps, { id: `${Date.now()}-${steps.length}`, label: '', completed: false }]);
  };
  const handleUpdateStepLabel = (id: string, label: string) => {
    setSteps(steps.map(step => step.id === id ? { ...step, label } : step));
  };
  const handleDeleteStep = (id: string) => setSteps(steps.filter(step => step.id !== id));

  // `initialData` é o que separa criar de editar: no teto, editar continua livre.
  const blocked = atCap && !initialData;
  const disabled = !name.trim() || (canEditWeekdays && !sched.isValid) || blocked;
  const capHint = capIsDemoBoundary
    ? (isPt
      ? `Modo grátis: até ${activitiesCap} hábitos ativos. Tarefas avulsas continuam sem limite; `
        + 'evoluir com seu próprio Soulmon é o que aumenta esse teto.'
      : `Free mode: up to ${activitiesCap} active habits. One-off tasks stay unlimited; `
        + 'evolving your own Soulmon is what raises this ceiling.')
    : (isPt ? `Limite atingido (${activitiesCap})` : `Limit reached (${activitiesCap})`);

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* O botão desabilitado explica o limite, mas não oferece a saída — é
          aqui, com a atividade já escrita, que a compra faz sentido. */}
      {blocked && capIsDemoBoundary && onUnlock && (
        <UnlockNudge language={language} reason="task-limit" onOpen={onUnlock} />
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={onClose} style={{ ...sm2Button('outline'), flex: 1 }}>
          {isPt ? 'Cancelar' : 'Cancel'}
        </button>
        <button type="button" onClick={handleSave} disabled={disabled}
          style={{ ...sm2Button('primary', disabled), flex: 1 }}
          title={blocked ? capHint : ''}>
          {blocked ? (isPt ? 'Limite atingido' : 'Limit reached') : (isPt ? 'Salvar' : 'Save')}
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
      title={isPt ? 'Editar atividade' : 'Edit activity'}
      onClose={onClose}
      language={language}
      footer={footer}
    >
      <div>
        <label style={sm2Label} htmlFor="sm-edit-name">{isPt ? 'Nome' : 'Name'}</label>
        <Field id="sm-edit-name" type="text" value={name} maxLength={60}
          onChange={(e) => setName(e.target.value)} />
      </div>

      {/* O card "Atributos por atividade completa" com os três +N saiu: a linha
          de "Fortalece" dentro dos chips diz o mesmo em uma linha, sem caixa. */}
      <CategoryChips category={category} setCategory={setCategory} isPt={isPt} />

      {canEditWeekdays && <HabitScheduleFields sched={sched} language={language} />}

      <HabitAnchorFields sched={sched} language={language} />

      <StepsFields steps={steps} isPt={isPt} onAdd={handleAddStep}
        onLabel={handleUpdateStepLabel} onDelete={handleDeleteStep} />

      <div>
        <label style={sm2Label} htmlFor="sm-edit-time">
          {isPt ? 'Horário (opcional)' : 'Time (optional)'}
        </label>
        <Field id="sm-edit-time" type="time" value={alarmTime}
          onChange={(e) => setAlarmTime(e.target.value)} />
      </div>
    </ModalSheet>
  );
}
