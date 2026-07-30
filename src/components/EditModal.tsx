import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { CATEGORY_ATTRIBUTES, ATTR_COLOR, ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS, categoryLabel } from '../types/category-icons';
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
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
  canEditWeekdays?: boolean; // Se a atividade foi criada quando podia selecionar dias
}

const CATEGORIES: ActivityCategory[] = [
  'Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function EditModal({ isOpen, onClose, onSave, onDelete, initialData, theme = 'default', language = 'en-US', canEditWeekdays = true }: EditModalProps) {
  const isWin98 = theme === 'win98';
  const isPt = language === 'pt-BR';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>(CATEGORIES[0]);
  const [weekDays, setWeekDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [alarmTime, setAlarmTime] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setCategory(initialData.category as ActivityCategory);
      setWeekDays(initialData.weekDays || [0, 1, 2, 3, 4, 5, 6]);
      setSteps(initialData.steps || []);
      setAlarmTime(initialData.alarm?.time || '');
    }
  }, [isOpen, initialData]);

  const attributes = CATEGORY_ATTRIBUTES[category];
  const currentEmoji = CATEGORY_ICONS[category];

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || weekDays.length === 0) return;
    onSave({
      name, category, emoji: currentEmoji, steps, weekDays,
      alarm: alarmTime ? { time: alarmTime } : undefined,
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

  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) setWeekDays(weekDays.filter(d => d !== day));
    else setWeekDays([...weekDays, day].sort());
  };

  const txt = {
    title: isPt ? 'Editar atividade' : 'Edit Activity',
    name: isPt ? 'Nome' : 'Name',
    category: isPt ? 'Categoria' : 'Category',
    attributesLabel: isPt ? 'Atributos por atividade completa:' : 'Attributes per completed activity:',
    steps: isPt ? 'Passos' : 'Steps',
    optional: isPt ? '(opcional)' : '(optional)',
    add: isPt ? 'Adicionar' : 'Add',
    weekdays: isPt ? 'Dias da semana' : 'Weekdays',
    time: isPt ? 'Horário' : 'Time',
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
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="bg-white border-2 border-gray-400 text-black" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
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
            {canEditWeekdays && (
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
            <div>
              <div className="flex items-center gap-2 mb-3 text-black"><Bell size={16} /><span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>{txt.time} <span className="text-xs opacity-60">{txt.optional}</span></span></div>
              <div className="ml-7">
                <Input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="bg-white border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
              </div>
            </div>
          </div>
          <div className="p-6 border-t bg-[#c0c0c0] border-gray-400">
            <div className="flex gap-2 mb-3">
              <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl transition-colors bg-white border-2 border-gray-400 text-black hover:bg-gray-200" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{txt.cancel}</button>
              <button onClick={handleSave} disabled={!name.trim() || weekDays.length === 0}
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
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={inputStyle} />
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

          {canEditWeekdays && (
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

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Bell size={16} strokeWidth={2.2} color="var(--sm-muted)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-muted)' }}>{txt.time} <span style={{ opacity: 0.75, fontWeight: 500 }}>{txt.optional}</span></span>
            </div>
            <div style={{ marginLeft: 24 }}>
              <Input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'var(--sm-surface)', borderTop: '1px solid var(--sm-line)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="sm-btn sm-btn-secondary" style={{ flex: 1 }}>{txt.cancel}</button>
            <button onClick={handleSave} disabled={!name.trim() || weekDays.length === 0} className="sm-btn" style={{ flex: 1 }}>{txt.save}</button>
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
