import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS } from '../types/category-icons';

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
    weekDays: number[];
    alarm?: { time: string };
  }) => void;
  onDelete?: () => void;
  initialData?: { 
    name: string; 
    category: string; 
    emoji: string; 
    steps?: Step[];
    weekDays?: number[];
    alarm?: { time: string };
  };
  theme?: 'default' | 'win98';
  canEditWeekdays?: boolean; // Se a atividade foi criada quando podia selecionar dias
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

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function EditModal({ isOpen, onClose, onSave, onDelete, initialData, theme = 'default', canEditWeekdays = true }: EditModalProps) {
  const isWin98 = theme === 'win98';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>(CATEGORIES[0]);
  const [weekDays, setWeekDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default: todos os dias marcados
  const [steps, setSteps] = useState<Step[]>([]);
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setCategory(initialData.category as ActivityCategory);
      setWeekDays(initialData.weekDays || [0, 1, 2, 3, 4, 5, 6]); // Default: todos os dias
      setSteps(initialData.steps || []);
      setHasAlarm(!!initialData.alarm);
      setAlarmTime(initialData.alarm?.time || '');
    }
  }, [isOpen, initialData]);

  const attributes = CATEGORY_ATTRIBUTES[category];
  const currentEmoji = CATEGORY_ICONS[category];

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || weekDays.length === 0) {
      alert('Name and at least one weekday are required');
      return;
    }

    const saveData: any = {
      name,
      category,
      emoji: currentEmoji,
      steps,
      weekDays,
    };

    // Salva o alarme se houver um horário definido
    if (alarmTime) {
      saveData.alarm = { time: alarmTime };
    }

    onSave(saveData);
    onClose();
  };

  const handleAddStep = () => {
    const newStep: Step = {
      id: `${Date.now()}-${steps.length}`,
      label: '',
      completed: false,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStepLabel = (id: string, label: string) => {
    setSteps(steps.map(step => step.id === id ? { ...step, label } : step));
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter(d => d !== day));
    } else {
      setWeekDays([...weekDays, day].sort());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full max-h-[90vh] overflow-y-auto ${
        isWin98 
          ? 'bg-[#c0c0c0] border-2 border-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(0,0,0,0.8)]' 
          : 'bg-white rounded-2xl shadow-xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${
          isWin98 
            ? 'border-b-2 border-gray-400' 
            : 'border-b border-gray-200'
        }`}>
          <h2 className={`${
            isWin98 
              ? 'text-black' 
              : 'text-gray-900'
          }`} style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 'bold' }}>
            ✏️ Edit Activity
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isWin98 
                ? 'text-black hover:bg-gray-300' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 space-y-5 ${isWin98 ? 'bg-[#c0c0c0]' : 'bg-white'}`}>
          {/* Name */}
          <div>
            <label className={`block mb-2 ${
              isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={
                isWin98
                  ? 'bg-white border-2 border-gray-400 text-black'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'
              }
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className={`block mb-2 ${
              isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                isWin98
                  ? 'bg-white border-2 border-gray-400 text-black focus:ring-blue-500'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat]} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Attribute Preview */}
          <div className={`p-4 rounded-lg ${
            isWin98 
              ? 'bg-white border-2 border-gray-400' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`mb-2 ${
              isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '500' }}>
              Attributes per completed activity:
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#22A900' }} />
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    background: '#22A900',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}
                >
                  +{attributes.virus}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#009ED8' }} />
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    background: '#009ED8',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}
                >
                  +{attributes.data}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#E69600' }} />
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    background: '#E69600',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}
                >
                  +{attributes.vaccine}
                </span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`${
                isWin98 ? 'text-black' : 'text-gray-700'
              }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                Steps 
                <span className="text-xs ml-1 opacity-60">(optional)</span>
              </label>
              <button
                onClick={handleAddStep}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isWin98
                    ? 'bg-[#000080] text-white hover:bg-[#000060]'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
                style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <span className={`text-xs ${isWin98 ? 'text-black' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
                      {index + 1}.
                    </span>
                    <Input
                      type="text"
                      value={step.label}
                      onChange={(e) => handleUpdateStepLabel(step.id, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className={`flex-1 ${
                        isWin98 ? 'bg-white border-2 border-gray-400' : 'border-gray-300'
                      }`}
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isWin98
                          ? 'text-black hover:bg-gray-300'
                          : 'text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Week Days - Only show if canEditWeekdays */}
          {canEditWeekdays && (
            <div>
              <label className={`block mb-2 ${
                isWin98 ? 'text-black' : 'text-gray-700'
              }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                Weekdays <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAY_LABELS.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => toggleWeekDay(index)}
                    className={`py-2 rounded-lg transition-all ${
                      weekDays.includes(index)
                        ? isWin98
                          ? 'bg-[#000080] text-white border-2 border-white'
                          : 'bg-teal-500 text-white'
                        : isWin98
                          ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold' }}
                    title={WEEKDAY_FULL[index]}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alarm - sempre visível */}
          <div>
            <div className={`flex items-center gap-2 mb-3 ${isWin98 ? 'text-black' : 'text-gray-700'}`}>
              <Bell size={16} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                Time <span className="text-xs opacity-60">(optional)</span>
              </span>
            </div>

            <div className="ml-7">
              <label className={`block mb-1 text-xs ${isWin98 ? 'text-black' : 'text-gray-600'}`} style={{ fontFamily: 'monospace' }}>
                Time:
              </label>
              <Input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className={isWin98 ? 'bg-white border-2 border-gray-400' : 'border-gray-300'}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${
          isWin98 
            ? 'bg-[#c0c0c0] border-gray-400' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex gap-2 mb-3">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-colors ${
                isWin98
                  ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || weekDays.length === 0}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isWin98
                  ? 'bg-[#000080] text-white hover:bg-[#000060]'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
              style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
            >
              Save
            </button>
          </div>
          
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full py-2 text-red-500 hover:text-red-700 transition-colors"
              style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 'bold' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
