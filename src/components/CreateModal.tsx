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

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (data: { name: string; category: string; emoji: string }) => void;
  onSaveActivity: (data: { name: string; category: string; emoji: string; steps: Step[] }) => void;
  theme?: 'default' | 'win98' | 'glitch';
  isOnboarding?: boolean; // New prop for onboarding mode
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

export function CreateModal({ isOpen, onClose, onSaveTask, onSaveActivity, theme = 'default', isOnboarding = false }: CreateModalProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>(CATEGORIES[0]);
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [isActivity, setIsActivity] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory(CATEGORIES[0]);
      setEmoji(EMOJI_OPTIONS[0]);
      setIsActivity(false);
      setSteps([]);
    }
  }, [isOpen]);

  const attributes = CATEGORY_ATTRIBUTES[category];
  const total = attributes.virus + attributes.data + attributes.vaccine;
  const virusPercent = (attributes.virus / total) * 100;
  const dataPercent = (attributes.data / total) * 100;
  const vaccinePercent = (attributes.vaccine / total) * 100;

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      if (isActivity) {
        onSaveActivity({ name, category, emoji, steps });
      } else {
        onSaveTask({ name, category, emoji });
      }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full max-h-[90vh] overflow-y-auto ${
        isGlitch 
          ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#00ffff] shadow-[0_0_30px_rgba(0,255,255,0.5)]' 
          : isWin98 
            ? 'bg-[#c0c0c0] border-2 border-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(0,0,0,0.8)]' 
            : 'bg-white rounded-2xl shadow-xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${
          isGlitch 
            ? 'border-b-2 border-[#00ffff]' 
            : isWin98 
              ? 'bg-gradient-to-r from-[#000080] to-[#1084d0] border-b-2 border-white' 
              : 'border-b border-gray-200'
        }`}>
          <h2 className={`${
            isGlitch 
              ? 'text-[#00ffff] text-shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
              : isWin98 
                ? 'text-white' 
                : 'text-gray-900'
          }`} style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '1.125rem' }}>
            {isOnboarding ? 'Create your first task / activity' : (isActivity ? 'New Activity' : 'New Task')}
          </h2>
          {!isOnboarding && (
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                isGlitch 
                  ? 'text-[#ff00ff] hover:bg-[#ff00ff]/20' 
                  : isWin98 
                    ? 'text-white hover:bg-black/20' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Type Toggle */}
          <div className={`flex items-center gap-4 p-3 rounded-lg ${
            isGlitch 
              ? 'bg-[#0a0a0a] border border-[#00ffff]/30' 
              : isWin98 
                ? 'bg-white border-2 border-gray-400' 
                : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="typeTask"
                name="itemType"
                checked={!isActivity}
                onChange={() => setIsActivity(false)}
                className="w-4 h-4 cursor-pointer"
              />
              <label 
                htmlFor="typeTask" 
                className={`cursor-pointer select-none ${
                  isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: !isActivity ? '600' : '400' }}
              >
                Task
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="typeActivity"
                name="itemType"
                checked={isActivity}
                onChange={() => setIsActivity(true)}
                className="w-4 h-4 cursor-pointer"
              />
              <label 
                htmlFor="typeActivity" 
                className={`cursor-pointer select-none ${
                  isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: isActivity ? '600' : '400' }}
              >
                Activity
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={`block mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isActivity ? 'e.g. Morning Routine' : 'e.g. Read 20 pages'}
              className={
                isGlitch
                  ? 'bg-[#0a0a0a] border-2 border-[#00ffff] text-[#00ffff] placeholder-[#00ffff]/40'
                  : isWin98
                    ? 'bg-white border-2 border-gray-400 text-black'
                    : ''
              }
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {/* Emoji */}
          <div>
            <label className={`block mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  onClick={() => setEmoji(emojiOption)}
                  className={`p-3 rounded-lg text-2xl transition-all ${
                    emoji === emojiOption
                      ? isGlitch
                        ? 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                        : isWin98
                          ? 'bg-[#000080] border-2 border-white'
                          : 'bg-gradient-to-r from-[#3e4753] to-[#687991] shadow-lg'
                      : isGlitch
                        ? 'bg-[#0a0a0a] border border-[#00ffff]/30 hover:border-[#00ffff]'
                        : isWin98
                          ? 'bg-white border-2 border-gray-400 hover:bg-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={`block mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                isGlitch
                  ? 'bg-[#0a0a0a] border-2 border-[#00ffff] text-[#00ffff] focus:ring-[#ff00ff]'
                  : isWin98
                    ? 'bg-white border-2 border-gray-400 text-black focus:ring-[#000080]'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-teal-500'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Attribute Preview */}
          <div className={`p-4 rounded-lg ${
            isGlitch 
              ? 'bg-[#0a0a0a] border border-[#00ffff]/30' 
              : isWin98 
                ? 'bg-white border-2 border-gray-400' 
                : 'bg-gray-50'
          }`}>
            <div className={`mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '500' }}>
              Attributes per {isActivity ? 'step' : 'task'}:
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    background: isGlitch ? '#ff0000' : '#22A900',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '600'
                  }}
                >
                  Virus: +{attributes.virus}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full" style={{ 
                    width: `${virusPercent}%`,
                    background: '#22A900'
                  }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    background: isGlitch ? '#0099ff' : '#009ED8',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '600'
                  }}
                >
                  Data: +{attributes.data}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full" style={{ 
                    width: `${dataPercent}%`,
                    background: '#009ED8'
                  }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    background: isGlitch ? '#00ff00' : '#E69600',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '600'
                  }}
                >
                  Vaccine: +{attributes.vaccine}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full" style={{ 
                    width: `${vaccinePercent}%`,
                    background: '#E69600'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Steps Section (only if isActivity) */}
          {isActivity && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={`${
                  isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
                }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}>
                  Steps ({steps.length})
                </label>
                <button
                  onClick={handleAddStep}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                    isGlitch
                      ? 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black hover:opacity-90'
                      : isWin98
                        ? 'bg-[#c0c0c0] border-2 border-white hover:bg-[#d0d0d0] text-black'
                        : 'bg-gradient-to-r from-[#3e4753] to-[#687991] text-white hover:brightness-110'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '600' }}
                >
                  <Plus size={14} />
                  Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {steps.map((step, index) => (
                  <div key={step.id} className={`flex items-center gap-2 p-2 rounded-lg ${
                    isGlitch 
                      ? 'bg-[#0a0a0a] border border-[#00ffff]/30' 
                      : isWin98 
                        ? 'bg-white border-2 border-gray-400' 
                        : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs ${
                      isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-500'
                    }`} style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {index + 1}.
                    </span>
                    <Input
                      value={step.label}
                      onChange={(e) => handleUpdateStepLabel(step.id, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className={`flex-1 ${
                        isGlitch
                          ? 'bg-[#0a0a0a] border border-[#00ffff]/30 text-[#00ffff] placeholder-[#00ffff]/40'
                          : isWin98
                            ? 'bg-white border border-gray-400 text-black'
                            : 'bg-white'
                      }`}
                      style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    />
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className={`p-1.5 rounded transition-colors ${
                        isGlitch
                          ? 'text-[#ff00ff] hover:bg-[#ff00ff]/20'
                          : isWin98
                            ? 'text-red-700 hover:bg-red-100'
                            : 'text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {steps.length === 0 && (
                  <div className={`text-center py-8 ${
                    isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-gray-500' : 'text-gray-400'
                  }`} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    No steps added yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-6 ${
          isGlitch 
            ? 'border-t-2 border-[#00ffff]' 
            : isWin98 
              ? 'border-t-2 border-white' 
              : 'border-t border-gray-200'
        }`}>
          {!isOnboarding && (
            <Button
              onClick={onClose}
              variant="outline"
              className={`flex-1 ${
                isGlitch
                  ? 'bg-transparent border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/20'
                  : isWin98
                    ? 'bg-[#c0c0c0] border-2 border-white text-black hover:bg-[#d0d0d0]'
                    : ''
              }`}
              style={{ fontFamily: 'monospace', fontWeight: '600' }}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!name.trim() || (isActivity && steps.length === 0)}
            className={`${
              isOnboarding ? 'w-full' : 'flex-1'
            } ${
              isGlitch
                ? 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black hover:opacity-90 disabled:opacity-50'
                : isWin98
                  ? 'bg-[#000080] text-white border-2 border-white hover:bg-[#0000a0] disabled:bg-gray-400'
                  : 'bg-gradient-to-r from-[#3e4753] to-[#687991] text-white hover:brightness-110 disabled:opacity-50'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: '600' }}
          >
            {isActivity ? 'Create Activity' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  );
}