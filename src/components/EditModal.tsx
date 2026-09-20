import { useState, useEffect } from 'react';
import { ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS } from '../types/category-icons';
import { useHabitSchedule } from '../hooks/useItemForm';
import { CategoryChips, HabitAnchorFields, HabitScheduleFields, StepsFields } from './CreateModal';
import { Field, ModalSheet, SM2_SHADOW_CARD, sm2Button, sm2Label } from './form/FormKit';
import { HabitConstancy } from './HabitConstancy';
import { normalizeSchedule, type HabitAnchor, type Schedule } from '../types/taskModel';
import type { HabitRhythm } from '../utils/habitRhythm';
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
  /**
   * A FICHA do hábito (canvas Atividades `FichaHabito`, ATIV-11…13): janela
   * de 7 + "N of the last 7" + maturidade + escudos como posse, num card no
   * topo da folha. Só na EDIÇÃO — a criação vive no `CreateModal` (A1: um
   * modal de criação só; o teto do demo não bate aqui, ATIV-18 saiu).
   */
  rhythm?: HabitRhythm;
  now?: Date;
  hideMetrics?: boolean;
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
  rhythm, now, hideMetrics = false,
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

  const disabled = !name.trim() || (canEditWeekdays && !sched.isValid);

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onClose} style={{ ...sm2Button('outline'), flex: 1 }}>
          {isPt ? 'Cancelar' : 'Cancel'}
        </button>
        <button type="button" onClick={handleSave} disabled={disabled}
          style={{ ...sm2Button('primary', disabled), flex: 1.4 }}>
          {isPt ? 'Salvar' : 'Save'}
        </button>
      </div>
      {/* `quiet` + `danger-ink`: é o TEXTO de uma ação destrutiva, não um
          alerta — o único `danger` do canvas; abaixo e separado do primário. */}
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
      {/* A FICHA — card SIS-03 no topo (FichaHabito). Só com ritmo: um
          hábito sem histórico ainda não tem o que mostrar além da linha. */}
      {rhythm && initialData && (
        <section
          aria-label={isPt ? 'Ficha do hábito' : 'Habit card'}
          style={{
            backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)',
            borderRadius: 'var(--sm2-radius-md)', padding: 12, boxShadow: SM2_SHADOW_CARD,
          }}
        >
          <HabitConstancy
            rhythm={rhythm}
            schedule={normalizeSchedule(initialData)}
            now={now ?? new Date()}
            language={language}
            hideMetrics={hideMetrics}
          />
        </section>
      )}

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
