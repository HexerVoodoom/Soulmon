import { X, Plus, Trash2, Clock, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { CATEGORY_ATTRIBUTES, ATTR_COLOR, ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS, categoryLabel } from '../types/category-icons';
import { useItemForm } from '../hooks/useItemForm';
import type { Language } from '../utils/i18n';

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
  };
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

const CATEGORIES: ActivityCategory[] = [
  'Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness',
];

export function TaskEditModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  title,
  initialData,
  theme = 'default',
  language = 'en-US',
}: TaskEditModalProps) {
  const isWin98 = theme === 'win98';
  const isPt = language === 'pt-BR';

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
  } = useItemForm({ isOpen, initialData });

  const attributes = CATEGORY_ATTRIBUTES[category];
  const currentEmoji = CATEGORY_ICONS[category];

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      category,
      emoji: currentEmoji,
      steps: steps.length > 0 ? steps : undefined,
      deadline: buildDeadline(),
      alarm: hasAlarm ? buildAlarm() : undefined,
    });
    onClose();
  };

  const txt = {
    title: title ?? (isPt ? 'Editar tarefa' : 'Edit Task'),
    name: isPt ? 'Nome' : 'Name',
    category: isPt ? 'Categoria' : 'Category',
    attributesLabel: isPt ? 'Atributos por atividade completa:' : 'Attributes per completed activity:',
    steps: isPt ? 'Passos' : 'Steps',
    optional: isPt ? '(opcional)' : '(optional)',
    add: isPt ? 'Adicionar' : 'Add',
    setDeadline: isPt ? 'Definir deadline' : 'Set deadline',
    date: isPt ? 'Data' : 'Date',
    time: isPt ? 'Hora' : 'Time',
    alarm: isPt ? 'Alarme' : 'Alarm',
    quickOptions: isPt ? 'Opções rápidas:' : 'Quick options:',
    before: isPt ? 'antes' : 'before',
    customTime: isPt ? 'Horário customizado' : 'Custom time',
    cancel: isPt ? 'Cancelar' : 'Cancel',
    save: isPt ? 'Salvar' : 'Save',
    delete: isPt ? 'Excluir' : 'Delete',
  };

  if (isWin98) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-[#c0c0c0] border-2 border-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-400">
            <h2 className="text-black" style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 'bold' }}>✏️ {txt.title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg transition-colors text-black hover:bg-gray-300"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-5 bg-[#c0c0c0]">
            <div>
              <label className="block mb-2 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.name}</label>
              <Input type="text" autoComplete="new-password" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white border-2 border-gray-400 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label className="block mb-2 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white border-2 border-gray-400 text-black focus:ring-blue-500"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>)}
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
                <label className="text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.steps} <span className="text-xs ml-1 opacity-60">{txt.optional}</span></label>
                <button onClick={handleAddStep} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors bg-[#000080] text-white hover:bg-[#000060]" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}><Plus size={14} />{txt.add}</button>
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
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <Clock size={16} className="text-black" />
                <span className="text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{txt.setDeadline}</span>
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
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={hasAlarm} onChange={(e) => setHasAlarm(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <Bell size={16} className="text-black" />
                <span className="text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{txt.alarm}</span>
              </label>
              {hasAlarm && (
                <div className="ml-7 space-y-3">
                  {hasDeadline && (
                    <div>
                      <label className="block mb-2 text-xs text-black" style={{ fontFamily: 'monospace' }}>{txt.quickOptions}</label>
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
                    <input type="time" autoComplete="new-password" value={customAlarmTime} onChange={(e) => handleCustomTimeChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 border-t bg-[#c0c0c0] border-gray-400">
            <div className="flex gap-2 mb-3">
              <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl transition-colors bg-white border-2 border-gray-400 text-black hover:bg-gray-200" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{txt.cancel}</button>
              <button onClick={handleSave} disabled={!name.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#000080] text-white hover:bg-[#000060]"
                style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{txt.save}</button>
            </div>
            {onDelete && (
              <button onClick={onDelete} className="w-full py-2 text-red-500 hover:text-red-700 transition-colors" style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 'bold' }}>{txt.delete}</button>
            )}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>{txt.title}</span>
          <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}><X size={18} strokeWidth={2.4} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{txt.name}</label>
            <Input type="text" autoComplete="new-password" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

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

          <div className="sm-card" style={{ padding: 12, background: 'var(--sm-surface)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--sm-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{txt.attributesLabel}</p>
            <div style={{ display: 'flex', gap: 14 }}>
              {(['virus', 'data', 'vaccine'] as const).map(a => (
                <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: ATTR_COLOR[a] }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ATTR_COLOR[a] }} />+{attributes[a]}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{txt.steps} <span style={{ opacity: 0.7, fontWeight: 500 }}>{txt.optional}</span></label>
              <button onClick={handleAddStep} className="sm-btn sm-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}><Plus size={14} strokeWidth={2.4} />{txt.add}</button>
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

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: hasDeadline ? 10 : 0 }}>
              <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
              <Clock size={16} strokeWidth={2.2} color="var(--sm-muted)" />
              <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{txt.setDeadline}</span>
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

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: hasAlarm ? 10 : 0 }}>
              <input type="checkbox" checked={hasAlarm} onChange={(e) => setHasAlarm(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--sm-primary)' }} />
              <Bell size={16} strokeWidth={2.2} color="var(--sm-muted)" />
              <span style={{ fontSize: 13.5, color: 'var(--sm-ink)', fontWeight: 600 }}>{txt.alarm}</span>
            </label>
            {hasAlarm && (
              <div style={{ marginLeft: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hasDeadline && (
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
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'var(--sm-surface)', borderTop: '1px solid var(--sm-line)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="sm-btn sm-btn-secondary" style={{ flex: 1 }}>{txt.cancel}</button>
            <button onClick={handleSave} disabled={!name.trim()} className="sm-btn" style={{ flex: 1 }}>{txt.save}</button>
          </div>
          {onDelete && (
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#e0483e', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '4px 0' }}>
              {txt.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
