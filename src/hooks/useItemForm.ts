import { useState, useEffect } from 'react';
import { ActivityCategory } from '../types/attributes';

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

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category as ActivityCategory);
      setSteps(initialData.steps || []);
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
      setDeadlineDate(new Date().toISOString().split('T')[0]);
      setDeadlineTime('23:59');
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

  return {
    name, setName,
    category, setCategory,
    steps, setSteps,
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
