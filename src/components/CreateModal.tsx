import { useState } from 'react';
import { X, Plus, Trash2, Clock, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { CATEGORY_ATTRIBUTES, ATTR_COLOR, ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS, categoryLabel } from '../types/category-icons';
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
  evolutionStage?: string;
  activitiesCount?: number;
  activitiesCap?: number;
  /** Monetização (utils/monetization.ts): modo demo já usou a criação de hoje. */
  demoLimitReached?: boolean;
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

export function CreateModal({ isOpen, onClose, onSaveTask, onSaveActivity, theme = 'default', language = 'en-US', evolutionStage = 'digiegg', activitiesCount = 0, activitiesCap = 2, demoLimitReached = false }: CreateModalProps) {
  const isWin98 = theme === 'win98';
  const isPt = language === 'pt-BR';
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
  const isBlocked = isAtCap || demoLimitReached;

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
    name: isPt ? 'Nome' : 'Name',
    namePlaceholder: isPt ? 'Ex: Meditar 10 minutos' : 'Ex: Meditate 10 minutes',
    category: isPt ? 'Categoria' : 'Category',
    attributesLabel: isPt ? 'Atributos por atividade completa:' : 'Attributes per completed activity:',
    steps: isPt ? 'Passos' : 'Steps',
    stepsOptional: isPt ? '(opcional)' : '(optional)',
    addButton: isPt ? 'Adicionar' : 'Add',
    executeOnce: isPt ? 'Executar apenas uma vez' : 'Execute only once',
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
  };

  if (isWin98) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-[#c0c0c0] border-2 border-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-400">
            <h2 className="text-black" style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 'bold' }}>
              {`➕ ${t.createModal.newActivity}`}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg transition-colors text-black hover:bg-gray-300">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-5 bg-[#c0c0c0]">
            <div>
              <label className="block mb-2 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.name}</label>
              <Input type="text" autoComplete="new-password" value={name} onChange={(e) => setName(e.target.value)} placeholder={txt.namePlaceholder} maxLength={60}
                className="bg-white border-2 border-gray-400 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label className="block mb-2 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white border-2 border-gray-400 text-black focus:ring-blue-500"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                ))}
              </select>
            </div>
            <div className="p-4 rounded-lg bg-white border-2 border-gray-400">
              <div className="mb-2 text-black" style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '500' }}>{txt.attributesLabel}</div>
              <div className="flex gap-3">
                {(['virus', 'data', 'vaccine'] as const).map(a => (
                  <div key={a} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: ATTR_COLOR[a] }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: ATTR_COLOR[a], fontWeight: 'bold' }}>+{attributes[a]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                  {txt.steps} <span className="text-xs ml-1 opacity-60">{txt.stepsOptional}</span>
                </label>
                <button onClick={handleAddStep} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors bg-[#000080] text-white hover:bg-[#000060]" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  <Plus size={14} />{txt.addButton}
                </button>
              </div>
              {steps.length > 0 && (
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="text-xs text-black" style={{ fontFamily: 'monospace' }}>{index + 1}.</span>
                      <Input type="text" value={step.label} onChange={(e) => handleUpdateStepLabel(step.id, e.target.value)} placeholder={`Step ${index + 1}`}
                        className="flex-1 bg-white border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
                      <button onClick={() => handleDeleteStep(step.id)} className="p-2 rounded-lg transition-colors text-black hover:bg-gray-300"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isSingleExecution} onChange={(e) => setIsSingleExecution(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span className="text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{txt.executeOnce}</span>
              </label>
            </div>
            {!isSingleExecution && showWeekdayGrid && (
              <div>
                <label className="block mb-2 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.weekdays} <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <button key={index} onClick={() => toggleWeekDay(index)}
                      className={`py-2 rounded-lg transition-all ${weekDays.includes(index) ? 'bg-[#000080] text-white border-2 border-white' : 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'}`}
                      style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold' }} title={WEEKDAY_FULL[index]}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isSingleExecution && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <Clock size={16} className="text-black" />
                  <span className="text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{txt.defineDeadline}</span>
                </label>
                {hasDeadline && (
                  <div className="ml-7 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block mb-1 text-xs text-black" style={{ fontFamily: 'monospace' }}>{txt.date}</label>
                        <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="bg-white border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1 text-xs text-black" style={{ fontFamily: 'monospace' }}>{txt.time}</label>
                        <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="bg-white border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-3 text-black">
                <Bell size={16} />
                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{isSingleExecution ? txt.alarm : txt.schedule} <span className="text-xs opacity-60">{txt.optional}</span></span>
              </div>
              <div className="ml-7 space-y-3">
                {isSingleExecution && hasDeadline && (
                  <div>
                    <label className="block mb-2 text-xs text-black" style={{ fontFamily: 'monospace' }}>{txt.quickOptions}:</label>
                    <div className="flex gap-2">
                      {(['2h', '1h', '30min'] as const).map(preset => (
                        <button key={preset} type="button" onClick={() => handlePresetClick(preset)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all ${selectedPreset === preset ? 'bg-[#000080] text-white border-2 border-white' : 'bg-white border-2 border-gray-400 text-black hover:bg-gray-200'}`}
                          style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {preset} {txt.before}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block mb-1 text-xs text-black" style={{ fontFamily: 'monospace' }}>{txt.customTime}:</label>
                  <Input type="time" value={customAlarmTime} onChange={(e) => handleCustomTimeChange(e.target.value)} className="bg-white border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 p-6 border-t bg-[#c0c0c0] border-gray-400">
            <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl transition-colors bg-white border-2 border-gray-400 text-black hover:bg-gray-200" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{txt.cancel}</button>
            <button onClick={handleSave} disabled={!name.trim() || (!isSingleExecution && showWeekdayGrid && weekDays.length === 0) || isBlocked}
              className="flex-1 py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#000080] text-white hover:bg-[#000060]"
              style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
              title={isAtCap ? `Limite de atividades atingido (${activitiesCap})` : demoLimitReached ? txt.demoLimitHint : ''}>
              {isAtCap ? txt.limitReached : demoLimitReached ? txt.demoLimitReached : txt.save}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Tema padrão (Soulmon design system, sm-*) ----
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#fff', color: 'var(--sm-ink)',
    border: '2px solid var(--sm-line)', borderRadius: 14, padding: '10px 13px', fontSize: 14,
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--sm-muted)' };
  const chip = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999,
    border: active ? '2px solid var(--sm-primary)' : '2px solid var(--sm-line)',
    background: active ? 'var(--sm-primary-soft)' : '#fff',
    color: active ? 'var(--sm-primary)' : 'var(--sm-ink)',
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(20,15,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sm-card" style={{ background: 'var(--sm-bg)', width: '100%', maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'Nova atividade' : t.createModal.newActivity}
          </span>
          <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>{txt.name}</label>
            <Input type="text" autoComplete="new-password" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={txt.namePlaceholder} maxLength={60} style={inputStyle} />
          </div>

          {/* Category — chips (mesmo estilo do resto do app) */}
          <div>
            <label style={labelStyle}>{txt.category}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} style={chip(category === cat)}>
                  <span>{CATEGORY_ICONS[cat]}</span>{categoryLabel(cat, isPt)}
                </button>
              ))}
            </div>
          </div>

          {/* Attribute Preview */}
          <div className="sm-card" style={{ padding: 12, background: 'var(--sm-surface)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--sm-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {txt.attributesLabel}
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              {(['virus', 'data', 'vaccine'] as const).map(a => (
                <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: ATTR_COLOR[a] }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ATTR_COLOR[a] }} />
                  +{attributes[a]}
                </span>
              ))}
            </div>
          </div>

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
                      placeholder={`${isPt ? 'Passo' : 'Step'} ${index + 1}`} style={{ ...inputStyle, padding: '8px 11px' }} />
                    <button onClick={() => handleDeleteStep(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0, color: '#e0483e' }}>
                      <Trash2 size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Single Execution Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={isSingleExecution} onChange={(e) => setIsSingleExecution(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
            <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{txt.executeOnce}</span>
          </label>

          {/* Week Days */}
          {!isSingleExecution && showWeekdayGrid && (
            <div>
              <label style={labelStyle}>{txt.weekdays} <span style={{ color: '#e0483e' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = weekDays.includes(index);
                  return (
                    <button key={index} onClick={() => toggleWeekDay(index)} title={WEEKDAY_FULL[index]}
                      style={{
                        padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: active ? '2px solid var(--sm-primary)' : '2px solid var(--sm-line)',
                        background: active ? 'var(--sm-primary)' : '#fff',
                        color: active ? '#fff' : 'var(--sm-ink)',
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deadline */}
          {isSingleExecution && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: hasDeadline ? 10 : 0 }}>
                <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
                <Clock size={16} strokeWidth={2.2} color="var(--sm-muted)" />
                <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{txt.defineDeadline}</span>
              </label>
              {hasDeadline && (
                <div style={{ display: 'flex', gap: 10, marginLeft: 28 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>{txt.date}</label>
                    <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>{txt.time}</label>
                    <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timer/Alarm */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Bell size={16} strokeWidth={2.2} color="var(--sm-muted)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-muted)' }}>
                {isSingleExecution ? txt.alarm : txt.schedule} <span style={{ opacity: 0.75, fontWeight: 500 }}>{txt.optional}</span>
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
                            background: active ? 'var(--sm-primary)' : '#fff',
                            color: active ? '#fff' : 'var(--sm-ink)',
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
                <Input type="time" value={customAlarmTime} onChange={(e) => handleCustomTimeChange(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: 16, background: 'var(--sm-surface)', borderTop: '1px solid var(--sm-line)' }}>
          <button onClick={onClose} className="sm-btn sm-btn-secondary" style={{ flex: 1 }}>{txt.cancel}</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || (!isSingleExecution && showWeekdayGrid && weekDays.length === 0) || isBlocked}
            className="sm-btn" style={{ flex: 1 }}
            title={isAtCap ? `${txt.limitReached} (${activitiesCap})` : demoLimitReached ? txt.demoLimitHint : ''}
          >
            {isAtCap ? txt.limitReached : demoLimitReached ? txt.demoLimitReached : txt.save}
          </button>
        </div>
      </div>
    </div>
  );
}
