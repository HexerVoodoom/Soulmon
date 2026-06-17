import { useState } from 'react';
import { X, Plus, Trash2, Clock, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS } from '../types/category-icons';
import { canSelectWeekdays } from '../types/progression';
import { Language, useTranslation } from '../utils/i18n';
import { useItemForm, type Step } from '../hooks/useItemForm';

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
  }) => void;
  onSaveActivity: (data: { 
    name: string; 
    category: string; 
    emoji: string; 
    steps: Step[];
    weekDays: number[];
    alarm?: { time: string };
  }) => void;
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
  isOnboarding?: boolean;
  evolutionStage?: string;
  activitiesCount?: number;
  activitiesCap?: number;
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
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CreateModal({ isOpen, onClose, onSaveTask, onSaveActivity, theme = 'default', language = 'en-US', isOnboarding = false, evolutionStage = 'digiegg', activitiesCount = 0, activitiesCap = 2 }: CreateModalProps) {
  const isWin98 = theme === 'win98';
  const showWeekdayGrid = canSelectWeekdays(evolutionStage);
  const t = useTranslation(language);
  
  const [isSingleExecution, setIsSingleExecution] = useState(false);
  const [weekDays, setWeekDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const {
    name, setName,
    category, setCategory,
    steps,
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
  } = useItemForm({ isOpen });

  const isAtCap = !isSingleExecution && activitiesCount >= activitiesCap;

  const attributes = CATEGORY_ATTRIBUTES[category];
  const currentEmoji = CATEGORY_ICONS[category];

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    if (isSingleExecution) {
      onSaveTask({
        name,
        category,
        emoji: currentEmoji,
        steps: steps.length > 0 ? steps : undefined,
        deadline: buildDeadline(),
        alarm: buildAlarm(),
      });
    } else {
      if (showWeekdayGrid && weekDays.length === 0) {
        alert('Select at least one weekday');
        return;
      }
      onSaveActivity({
        name,
        category,
        emoji: currentEmoji,
        steps,
        weekDays: showWeekdayGrid ? weekDays : [0, 1, 2, 3, 4, 5, 6],
        alarm: customAlarmTime ? { time: customAlarmTime } : undefined,
      });
    }
    onClose();
  };

  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter(d => d !== day));
    } else {
      setWeekDays([...weekDays, day].sort());
    }
  };

  // Translation helpers
  const txt = {
    name: language === 'pt-BR' ? 'Nome' : 'Name',
    namePlaceholder: language === 'pt-BR' ? 'Ex: Meditar 10 minutos' : 'Ex: Meditate 10 minutes',
    category: language === 'pt-BR' ? 'Categoria' : 'Category',
    attributesLabel: language === 'pt-BR' ? 'Atributos por atividade completa:' : 'Attributes per completed activity:',
    stepsOptional: language === 'pt-BR' ? '(opcional)' : '(optional)',
    addButton: language === 'pt-BR' ? 'Adicionar' : 'Add',
    executeOnce: language === 'pt-BR' ? 'Executar apenas uma vez' : 'Execute only once',
    weekdays: language === 'pt-BR' ? 'Dias da semana' : 'Weekdays',
    defineDeadline: language === 'pt-BR' ? 'Definir deadline' : 'Set deadline',
    date: language === 'pt-BR' ? 'Data' : 'Date',
    time: language === 'pt-BR' ? 'Hora' : 'Time',
    alarm: language === 'pt-BR' ? 'Alarme' : 'Alarm',
    schedule: language === 'pt-BR' ? 'Horário' : 'Schedule',
    quickOptions: language === 'pt-BR' ? 'Opções rápidas:' : 'Quick options:',
    customTime: language === 'pt-BR' ? 'Horário customizado' : 'Custom time',
    cancel: language === 'pt-BR' ? 'Cancelar' : 'Cancel',
    save: language === 'pt-BR' ? 'Salvar' : 'Save',
    createAndStart: language === 'pt-BR' ? 'Criar e Começar' : 'Create and Start',
    limitReached: language === 'pt-BR' ? 'Limite Atingido' : 'Limit Reached',
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
            {isOnboarding ? `✨ ${language === 'pt-BR' ? 'Crie sua primeira atividade' : 'Create your first activity'}` : `➕ ${t.createModal.newActivity}`}
          </h2>
          {!isOnboarding && (
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
          )}
        </div>

        {/* Content */}
        <div className={`p-6 space-y-5 ${isWin98 ? 'bg-[#c0c0c0]' : 'bg-white'}`}>
          {/* Name */}
          <div>
            <label className={`block mb-2 ${
              isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
              {txt.name}
            </label>
            <Input
              type="text"
              autoComplete="new-password"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={txt.namePlaceholder}
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
              {txt.category}
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

          {/* Attribute Preview - POR ATIVIDADE TODA */}
          <div className={`p-4 rounded-lg ${
            isWin98 
              ? 'bg-white border-2 border-gray-400' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`mb-2 ${
              isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '500' }}>
              {txt.attributesLabel}
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

          {/* Steps - LOGO ABAIXO DOS ATRIBUTOS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`${
                isWin98 ? 'text-black' : 'text-gray-700'
              }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                Steps 
                <span className="text-xs ml-1 opacity-60">{txt.stepsOptional}</span>
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
                {txt.addButton}
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

          {/* Single Execution Checkbox */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSingleExecution}
                onChange={(e) => setIsSingleExecution(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className={isWin98 ? 'text-black' : 'text-gray-700'} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {txt.executeOnce}
              </span>
            </label>
          </div>

          {/* Week Days (only if NOT single execution AND can select weekdays) */}
          {!isSingleExecution && showWeekdayGrid && (
            <div>
              <label className={`block mb-2 ${
                isWin98 ? 'text-black' : 'text-gray-700'
              }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                {txt.weekdays} <span className="text-red-500">*</span>
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

          {/* Deadline (only for single execution) */}
          {isSingleExecution && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={hasDeadline}
                  onChange={(e) => setHasDeadline(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <Clock size={16} className={isWin98 ? 'text-black' : 'text-gray-700'} />
                <span className={isWin98 ? 'text-black' : 'text-gray-700'} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {txt.defineDeadline}
                </span>
              </label>

              {hasDeadline && (
                <div className="ml-7 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className={`block mb-1 text-xs ${isWin98 ? 'text-black' : 'text-gray-600'}`} style={{ fontFamily: 'monospace' }}>
                        {txt.date}
                      </label>
                      <Input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className={isWin98 ? 'bg-white border-2 border-gray-400' : 'border-gray-300'}
                        style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={`block mb-1 text-xs ${isWin98 ? 'text-black' : 'text-gray-600'}`} style={{ fontFamily: 'monospace' }}>
                        {txt.time}
                      </label>
                      <Input
                        type="time"
                        value={deadlineTime}
                        onChange={(e) => setDeadlineTime(e.target.value)}
                        className={isWin98 ? 'bg-white border-2 border-gray-400' : 'border-gray-300'}
                        style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timer/Alarm - SEMPRE DISPONÍVEL (última etapa) */}
          <div>
            <div className={`flex items-center gap-2 mb-3 ${isWin98 ? 'text-black' : 'text-gray-700'}`}>
              <Bell size={16} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                {isSingleExecution ? txt.alarm : txt.schedule} <span className="text-xs opacity-60">(opcional)</span>
              </span>
            </div>

            <div className="ml-7 space-y-3">
              {/* Presets - só para single execution */}
              {isSingleExecution && hasDeadline && (
                <div>
                  <label className={`block mb-2 text-xs ${isWin98 ? 'text-black' : 'text-gray-600'}`} style={{ fontFamily: 'monospace' }}>
                    {txt.quickOptions}:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetClick('2h')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all ${
                        selectedPreset === '2h'
                          ? isWin98
                            ? 'bg-[#000080] text-white border-2 border-white'
                            : 'bg-teal-500 text-white'
                          : isWin98
                          ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                    >
                      2h antes
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetClick('1h')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all ${
                        selectedPreset === '1h'
                          ? isWin98
                            ? 'bg-[#000080] text-white border-2 border-white'
                            : 'bg-teal-500 text-white'
                          : isWin98
                          ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                    >
                      1h antes
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetClick('30min')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all ${
                        selectedPreset === '30min'
                          ? isWin98
                            ? 'bg-[#000080] text-white border-2 border-white'
                            : 'bg-teal-500 text-white'
                          : isWin98
                          ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                    >
                      30min antes
                    </button>
                  </div>
                </div>
              )}

              {/* Campo customizado - sempre disponível */}
              <div>
                <label className={`block mb-1 text-xs ${isWin98 ? 'text-black' : 'text-gray-600'}`} style={{ fontFamily: 'monospace' }}>
                  {txt.customTime}:
                </label>
                <Input
                  type="time"
                  value={customAlarmTime}
                  onChange={(e) => handleCustomTimeChange(e.target.value)}
                  className={isWin98 ? 'bg-white border-2 border-gray-400' : 'border-gray-300'}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex gap-2 p-6 border-t ${
          isWin98 
            ? 'bg-[#c0c0c0] border-gray-400' 
            : 'bg-white border-gray-200'
        }`}>
          {!isOnboarding && (
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-colors ${
                isWin98
                  ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
            >
              {txt.cancel}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim() || (!isSingleExecution && showWeekdayGrid && weekDays.length === 0) || isAtCap}
            className={`flex-1 py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isWin98
                ? 'bg-[#000080] text-white hover:bg-[#000060]'
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
            title={isAtCap ? `Limite de atividades atingido (${activitiesCap})` : ''}
          >
            {isOnboarding ? txt.createAndStart : isAtCap ? txt.limitReached : txt.save}
          </button>
        </div>
      </div>
    </div>
  );
}
