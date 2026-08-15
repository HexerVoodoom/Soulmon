import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import iconTrash from '../assets/soulmon/icons/icon-trash.png';
import iconBell from '../assets/soulmon/icons/icon-bell.png';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { Input } from './ui/input';
import { CATEGORY_ATTRIBUTES, ATTR_COLOR, ActivityCategory } from '../types/attributes';
import { CATEGORY_ICONS, CATEGORY_ICON_IMG, categoryLabel } from '../types/category-icons';
import { WEEKDAY_INDEXES, weekdayFull, weekdayShort } from '../utils/weekdays';
import { PixelChoiceChip } from './pixel/PixelKit';
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
  language?: Language;
  canEditWeekdays?: boolean; // Se a atividade foi criada quando podia selecionar dias
}

const CATEGORIES: ActivityCategory[] = [
  'Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness',
];

export function EditModal({ isOpen, onClose, onSave, onDelete, initialData, language = 'en-US', canEditWeekdays = true }: EditModalProps) {
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

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--sm-surface)', color: 'var(--sm-ink)',
    border: '2px solid var(--sm-line)', borderRadius: 14, padding: '10px 13px', fontSize: 14,
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--sm-muted)' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(20,15,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sm-card" style={{ background: 'var(--sm-bg)', width: '100%', maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>{txt.title}</span>
          <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}><img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} /></button>
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
                <PixelChoiceChip
                  key={cat}
                  selected={category === cat}
                  onToggle={() => setCategory(cat)}
                  icon={CATEGORY_ICON_IMG[cat]}
                >
                  {categoryLabel(cat, isPt)}
                </PixelChoiceChip>
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
                      <img src={iconTrash} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
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
                {WEEKDAY_INDEXES.map(index => (
                  <PixelChoiceChip
                    key={index}
                    shape="day"
                    selected={weekDays.includes(index)}
                    onToggle={() => toggleWeekDay(index)}
                    title={weekdayFull(index, language)}
                    ariaLabel={weekdayFull(index, language)}
                  >
                    {weekdayShort(index, language)}
                  </PixelChoiceChip>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <img src={iconBell} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-muted)' }}>{txt.time} <span style={{ opacity: 0.75, fontWeight: 500 }}>{txt.optional}</span></span>
            </div>
            <div style={{ marginLeft: 24 }}>
              <Input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'var(--sm-surface)', borderTop: '1px solid var(--sm-line)' }}>
          <div style={{ display: 'flex', gap: 14 }}>
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
