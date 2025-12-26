import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; emoji: string; steps: Step[] }) => void;
  onDelete?: () => void; // New prop for delete functionality
  initialData?: { name: string; category: string; emoji: string; steps?: Step[] };
  title?: string;
  showSteps?: boolean;
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

const EMOJI_OPTIONS = ['💪', '📚', '🎨', '🧘', '💼', '🎯', '🌱', '⚡', '🔥', '💎', '🌟', '🎮'];

export function EditModal({ isOpen, onClose, onSave, onDelete, initialData, title = 'Edit Activity', showSteps = false }: EditModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>(CATEGORIES[0]);
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [steps, setSteps] = useState<Step[]>([]);
  const isEditMode = !!initialData; // Determine if we're editing

  // Update state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setCategory((initialData?.category as ActivityCategory) || CATEGORIES[0]);
      setEmoji(initialData?.emoji || EMOJI_OPTIONS[0]);
      setSteps(initialData?.steps || []);
    }
  }, [isOpen, initialData]);

  const attributes = CATEGORY_ATTRIBUTES[category];
  const total = attributes.virus + attributes.data + attributes.vaccine;
  const virusPercent = (attributes.virus / total) * 100;
  const dataPercent = (attributes.data / total) * 100;
  const vaccinePercent = (attributes.vaccine / total) * 100;

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name, category, emoji, steps });
      onClose();
    }
  };

  const handleAddStep = () => {
    const newStep: Step = {
      id: `${Date.now()}-${steps.length}`,
      label: `Step ${steps.length + 1}`,
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-gray-900 mb-4">{title}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              Activity Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter activity name"
              className="w-full"
              style={{ fontFamily: 'monospace' }}
              disabled={isEditMode}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-900"
              style={{ fontFamily: 'monospace' }}
              disabled={isEditMode}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            
            {/* Attribute Preview */}
            <div className="mt-3 bg-gray-100 rounded-xl p-3 border border-gray-200">
              <p className="text-gray-700 mb-2" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                Attribute Impact:
              </p>
              <div className="h-4 rounded-full overflow-hidden flex mb-2 border border-gray-200">
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ width: `${virusPercent}%` }}
                />
                <div 
                  className="bg-blue-500 transition-all duration-300"
                  style={{ width: `${dataPercent}%` }}
                />
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ width: `${vaccinePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ fontFamily: 'monospace' }}>
                <span className="text-red-600">🦠 {attributes.virus}</span>
                <span className="text-blue-600">💾 {attributes.data}</span>
                <span className="text-green-600">💉 {attributes.vaccine}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  onClick={() => setEmoji(emojiOption)}
                  className={`
                    aspect-square rounded-xl border text-2xl transition-all
                    ${emoji === emojiOption
                      ? 'border-gray-300 bg-gray-200 shadow-sm'
                      : 'border-gray-200 bg-gray-100 hover:border-gray-300 hover:bg-gray-200'
                    }
                  `}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          {/* Steps Section - Only shown if showSteps is true */}
          {showSteps && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-700" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  Steps/Tasks
                </label>
                <button
                  onClick={handleAddStep}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                  <Plus size={14} />
                  Add Step
                </button>
              </div>

              <div className="space-y-2">
                {steps.length === 0 ? (
                  <p className="text-gray-500 text-center py-3" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    No steps yet. Click "Add Step" to create one.
                  </p>
                ) : (
                  steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="text-gray-600" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {index + 1}.
                      </span>
                      <Input
                        value={step.label}
                        onChange={(e) => handleUpdateStepLabel(step.id, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        className="flex-1"
                        style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      />
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-xl border-gray-200 hover:bg-gray-100"
            >
              Cancel
            </Button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center"
                title="Delete Activity"
              >
                <Trash2 size={20} />
              </button>
            )}
            <Button
              onClick={handleSave}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}