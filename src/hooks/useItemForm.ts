import { useState, useEffect } from 'react';
import { ActivityCategory } from '../types/attributes';
import {
  DEFAULT_EFFORT,
  normalizeEffort,
  normalizeSchedule,
  weekDaysForSchedule,
  type Effort,
  type HabitAnchor,
  type Schedule,
} from '../types/taskModel';

export interface Step {
  id: string;
  label: string;
  completed: boolean;
}

export interface AlarmData {
  type: '2h' | '1h' | '30min' | 'custom';
  time?: string;
}

export interface ItemFormInitialData {
  name: string;
  category: string;
  emoji: string;
  steps?: Step[];
  deadline?: { date: string; time: string };
  alarm?: AlarmData;
  /** 1 rápida · 2 média · 3 projeto. Ausente = save antigo → padrão rápida. */
  effort?: Effort;
  /** "Quando pretendo fazer" (Things 3), distinto do prazo. YYYY-MM-DD. */
  startDate?: string;
}

interface UseItemFormProps {
  isOpen: boolean;
  initialData?: ItemFormInitialData;
  defaultCategory?: ActivityCategory;
}

const DEFAULT_CATEGORIES: ActivityCategory[] = [
  'Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness',
];

export function useItemForm({ isOpen, initialData, defaultCategory = DEFAULT_CATEGORIES[0] }: UseItemFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>(defaultCategory);
  const [steps, setSteps] = useState<Step[]>([]);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [hasAlarm, setHasAlarm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'2h' | '1h' | '30min' | null>(null);
  const [customAlarmTime, setCustomAlarmTime] = useState('');
  /* "Quando" (startDate) e "prazo" (deadline) são coisas diferentes e por isso
     moram em dois estados: só o "quando" traz a tarefa para o Hoje. Guardar os
     dois no mesmo campo é exatamente o erro que o Things 3 evita. */
  const [effort, setEffort] = useState<Effort>(DEFAULT_EFFORT);
  const [hasStart, setHasStart] = useState(false);
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category as ActivityCategory);
      setSteps(initialData.steps || []);
      setEffort(normalizeEffort(initialData.effort));
      setHasStart(!!initialData.startDate);
      setStartDate(initialData.startDate || todayIso());
      setHasDeadline(!!initialData.deadline);
      setDeadlineDate(initialData.deadline?.date || '');
      setDeadlineTime(initialData.deadline?.time || '23:59');
      setHasAlarm(!!initialData.alarm);
      if (initialData.alarm) {
        if (initialData.alarm.type !== 'custom') {
          setSelectedPreset(initialData.alarm.type);
          setCustomAlarmTime('');
        } else {
          setSelectedPreset(null);
          setCustomAlarmTime(initialData.alarm.time || '');
        }
      } else {
        setSelectedPreset(null);
        setCustomAlarmTime('');
      }
    } else {
      setName('');
      setCategory(defaultCategory);
      setSteps([]);
      setHasAlarm(false);
      setSelectedPreset(null);
      setCustomAlarmTime('');
      setHasDeadline(false);
      setDeadlineDate(todayIso());
      setDeadlineTime('23:59');
      setEffort(DEFAULT_EFFORT);
      setHasStart(false);
      setStartDate(todayIso());
    }
  }, [isOpen, initialData]);

  const calculatePresetTime = (preset: '2h' | '1h' | '30min'): string => {
    if (!hasDeadline || !deadlineTime) return '';
    const [hours, minutes] = deadlineTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const offset = preset === '2h' ? 120 : preset === '1h' ? 60 : 30;
    const resultMinutes = totalMinutes - offset;
    if (resultMinutes < 0) return '00:00';
    const h = Math.floor(resultMinutes / 60);
    const m = resultMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handlePresetClick = (preset: '2h' | '1h' | '30min') => {
    setSelectedPreset(preset);
    setCustomAlarmTime(calculatePresetTime(preset));
  };

  const handleCustomTimeChange = (time: string) => {
    setCustomAlarmTime(time);
    setSelectedPreset(null);
  };

  const handleAddStep = () => {
    setSteps(prev => [...prev, { id: `${Date.now()}-${prev.length}`, label: '', completed: false }]);
  };

  const handleUpdateStepLabel = (id: string, label: string) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, label } : step));
  };

  const handleDeleteStep = (id: string) => {
    setSteps(prev => prev.filter(step => step.id !== id));
  };

  const buildAlarm = (): AlarmData | undefined => {
    if (!customAlarmTime) return undefined;
    return { type: selectedPreset || 'custom', time: !selectedPreset ? customAlarmTime : undefined };
  };

  const buildDeadline = (): { date: string; time: string } | undefined => {
    if (!hasDeadline) return undefined;
    return { date: deadlineDate, time: deadlineTime };
  };

  const buildStartDate = (): string | undefined => {
    if (!hasStart || !startDate) return undefined;
    return startDate;
  };

  return {
    name, setName,
    category, setCategory,
    steps, setSteps,
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
  };
}

/** YYYY-MM-DD no fuso LOCAL. `toISOString()` converte para UTC e, a oeste de
 *  Greenwich, "hoje" às 22h vira amanhã — a data que o usuário vê no campo
 *  ficaria um dia à frente da que ele escolheu. */
export function todayIso(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const ALL_WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6];

export type ScheduleKind = Schedule['kind'];

export interface UseHabitScheduleProps {
  isOpen: boolean;
  initial?: { schedule?: Schedule; weekDays?: number[]; anchor?: HabitAnchor };
}

/**
 * O estado do seletor de recorrência + da âncora do hábito.
 *
 * Vive fora do `useItemForm` porque quem edita hábito (`EditModal`) não usa o
 * formulário de tarefa, e quem cria (`CreateModal`) usa os dois. Uma segunda
 * cópia divergiria em silêncio — e a divergência aqui não dá erro nenhum: o
 * hábito simplesmente passaria a cobrar num ritmo que o usuário não escolheu.
 *
 * Os três modos convivem num estado só por MODO (e não num `Schedule` único)
 * para que trocar de modo e voltar não apague o que a pessoa já tinha marcado.
 */
export function useHabitSchedule({ isOpen, initial }: UseHabitScheduleProps) {
  const [kind, setKind] = useState<ScheduleKind>('weekdays');
  const [weekDays, setWeekDays] = useState<number[]>(ALL_WEEK_DAYS);
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [everyN, setEveryN] = useState(3);
  const [fromCompletion, setFromCompletion] = useState(true);
  const [anchorAfter, setAnchorAfter] = useState('');
  const [anchorWhere, setAnchorWhere] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const s = normalizeSchedule({ schedule: initial?.schedule, weekDays: initial?.weekDays });
    setKind(s.kind);
    setWeekDays(s.kind === 'weekdays' ? s.days : (initial?.weekDays ?? ALL_WEEK_DAYS));
    setTimesPerWeek(s.kind === 'timesPerWeek' ? s.target : 3);
    setEveryN(s.kind === 'everyNDays' ? s.n : 3);
    // O padrão do "a cada N dias" é contar da CONCLUSÃO: é o único dos dois que
    // não pode acumular instância atrasada, e a pilha de atrasadas é a causa
    // nº1 documentada de abandono da categoria.
    setFromCompletion(s.kind === 'everyNDays' ? s.from === 'completion' : true);
    setAnchorAfter(initial?.anchor?.after ?? '');
    setAnchorWhere(initial?.anchor?.where ?? '');
  }, [isOpen, initial]);

  const toggleWeekDay = (day: number) => {
    setWeekDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  /** Aplica um `Schedule` vindo de fora (o Quick Add), sem perder os outros modos. */
  const applySchedule = (s: Schedule) => {
    setKind(s.kind);
    if (s.kind === 'weekdays') setWeekDays(s.days);
    else if (s.kind === 'timesPerWeek') setTimesPerWeek(s.target);
    else {
      setEveryN(s.n);
      setFromCompletion(s.from === 'completion');
    }
  };

  const buildSchedule = (): Schedule => {
    if (kind === 'timesPerWeek') return { kind: 'timesPerWeek', target: timesPerWeek };
    if (kind === 'everyNDays') {
      return { kind: 'everyNDays', n: everyN, from: fromCompletion ? 'completion' : 'schedule' };
    }
    return { kind: 'weekdays', days: weekDays };
  };

  /** `weekDays` continua sendo escrito ao lado de `schedule`: é a interface com
   *  o widget Android e com o desktop, que não carregam o motor novo. */
  const buildWeekDays = (): number[] => weekDaysForSchedule(buildSchedule());

  const buildAnchor = (): HabitAnchor | undefined => {
    const after = anchorAfter.trim();
    const where = anchorWhere.trim();
    if (!after && !where) return undefined;
    const anchor: HabitAnchor = {};
    if (after) anchor.after = after;
    if (where) anchor.where = where;
    return anchor;
  };

  /** Só o modo `weekdays` pode ficar inválido: sem nenhum dia não há hábito. */
  const isValid = kind !== 'weekdays' || weekDays.length > 0;

  return {
    kind, setKind,
    weekDays, setWeekDays, toggleWeekDay,
    timesPerWeek, setTimesPerWeek,
    everyN, setEveryN,
    fromCompletion, setFromCompletion,
    anchorAfter, setAnchorAfter,
    anchorWhere, setAnchorWhere,
    applySchedule,
    buildSchedule,
    buildWeekDays,
    buildAnchor,
    isValid,
  };
}

/** A frase montada da âncora — o que o usuário vai ler no card do hábito.
 *  Mostrar o resultado é o que transforma dois campos soltos numa
 *  implementation intention ("quando X, então Y, em Z"). */
export function anchorSentence(
  anchor: { after?: string; where?: string } | undefined,
  language: 'pt-BR' | 'en-US' | string,
): string | null {
  const after = anchor?.after?.trim();
  const where = anchor?.where?.trim();
  if (!after && !where) return null;
  const isPt = language === 'pt-BR';
  const parts: string[] = [];
  if (after) parts.push(isPt ? `Depois de ${after}` : `After ${after}`);
  if (where) parts.push(isPt ? `${after ? 'n' : 'N'}o ${where}` : `${after ? 'a' : 'A'}t ${where}`);
  return parts.join(', ') + '.';
}
