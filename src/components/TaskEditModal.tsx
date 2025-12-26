import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; emoji: string }) => void;
  initialData?: {
    name: string;
    category: string;
    emoji: string;
  };
  title?: string;
  theme?: 'default' | 'win98' | 'glitch';
}

const EMOJI_OPTIONS = [
  '💪', '📚', '🧠', '👤', '💼', '🎯',
  '🍎', '⚡', '🔥', '💎', '💥', '🎮',
  '🎨', '🎭', '🎪', '🎬', '🎸', '🎤',
  '⚽', '🏀', '🎾', '🏋️', '🧘', '🏃',
];

export function TaskEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title = 'New Task',
  theme = 'default',
}: TaskEditModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Study');
  const [emoji, setEmoji] = useState('📚');
  const isEditMode = !!initialData; // Determine if we're editing

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category as ActivityCategory);
      setEmoji(initialData.emoji);
    } else {
      setName('');
      setCategory('Study');
      setEmoji('📚');
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name, category, emoji });
    onClose();
  };

  const handleCategoryChange = (newCategory: ActivityCategory) => {
    setCategory(newCategory);
  };

  if (!isOpen) return null;

  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  // Get attribute impact for current category
  const attrs = CATEGORY_ATTRIBUTES[category];
  const total = attrs.virus + attrs.data + attrs.vaccine;
  const virusPercent = (attrs.virus / total) * 100;
  const dataPercent = (attrs.data / total) * 100;
  const vaccinePercent = (attrs.vaccine / total) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto ${
          isGlitch
            ? 'bg-[#0a0a0a] border-2 border-[#00ffff]'
            : isWin98
            ? 'bg-[#c0c0c0] win98-window'
            : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 border-b ${
            isGlitch
              ? 'border-[#00ffff]/30'
              : isWin98
              ? 'bg-gradient-to-r from-[#000080] to-[#1084d0] border-white'
              : 'border-gray-200'
          }`}
        >
          <h2
            className={`${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-white' : 'text-gray-900'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '1.0625rem', fontWeight: '500' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isGlitch
                ? 'hover:bg-[#ff0066]/20 text-[#ff0066]'
                : isWin98
                ? 'bg-[#c0c0c0] win98-button text-[#000000]'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <label
              className={`block mb-2 ${
                isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Task Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              disabled={isEditMode}
              className={`w-full px-4 py-3 rounded-xl transition-all ${
                isGlitch
                  ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/50 focus:border-[#00ffff] text-[#00ffff] placeholder-[#00ffff]/30'
                  : isWin98
                  ? 'win98-inset bg-white text-[#000000]'
                  : 'bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.9375rem', outline: 'none' }}
            />
          </div>

          {/* Category */}
          <div>
            <label
              className={`block mb-2 ${
                isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ActivityCategory)}
              disabled={isEditMode}
              className={`w-full px-4 py-3 rounded-xl transition-all ${
                isGlitch
                  ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/50 focus:border-[#00ffff] text-[#00ffff]'
                  : isWin98
                  ? 'win98-inset bg-white text-[#000000]'
                  : 'bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.9375rem', outline: 'none' }}
            >
              <option value="Health">Health</option>
              <option value="Study">Study</option>
              <option value="Social">Social</option>
              <option value="Creativity">Creativity</option>
            </select>
          </div>

          {/* Attribute Impact */}
          <div
            className={`p-4 rounded-xl ${
              isGlitch
                ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
                : isWin98
                ? 'win98-inset bg-white'
                : 'bg-gray-50'
            }`}
          >
            <p
              className={`mb-3 ${
                isGlitch ? 'text-[#00ffff]/70' : isWin98 ? 'text-[#000000]' : 'text-gray-600'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
            >
              Attribute Impact:
            </p>
            
            {/* Progress Bar */}
            <div className="h-6 rounded-full overflow-hidden flex mb-3" style={{ backgroundColor: isGlitch ? '#0a0a0a' : isWin98 ? '#808080' : '#e5e7eb' }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${virusPercent}%`,
                  backgroundColor: isGlitch ? '#ff0066' : '#ef4444',
                }}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${dataPercent}%`,
                  backgroundColor: isGlitch ? '#00ffff' : '#3b82f6',
                }}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${vaccinePercent}%`,
                  backgroundColor: isGlitch ? '#00ff00' : '#22c55e',
                }}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: isGlitch ? '#ff0066' : '#ef4444' }} />
                <span
                  className={`${
                    isGlitch ? 'text-[#ff0066]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                  {attrs.virus}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: isGlitch ? '#00ffff' : '#3b82f6' }} />
                <span
                  className={`${
                    isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                  {attrs.data}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: isGlitch ? '#00ff00' : '#22c55e' }} />
                <span
                  className={`${
                    isGlitch ? 'text-[#00ff00]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                  {attrs.vaccine}
                </span>
              </div>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label
              className={`block mb-3 ${
                isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  onClick={() => setEmoji(emojiOption)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                    emoji === emojiOption
                      ? isGlitch
                        ? 'glitch-button shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                        : isWin98
                        ? 'win98-inset bg-[#000080]'
                        : 'bg-gradient-to-br from-[#2bff95] to-teal-500 shadow-lg'
                      : isGlitch
                      ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30 hover:border-[#00ffff]/50'
                      : isWin98
                      ? 'win98-button bg-[#c0c0c0] hover:bg-[#d4d4d4]'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex gap-3 p-6 border-t ${
            isGlitch ? 'border-[#00ffff]/30' : isWin98 ? 'border-white' : 'border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl transition-all ${
              isGlitch
                ? 'bg-[#0a0a0a] border-2 border-[#ff0066]/50 text-[#ff0066] hover:bg-[#ff0066]/10'
                : isWin98
                ? 'win98-button bg-[#c0c0c0] text-[#000000]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={`flex-1 py-3 px-4 rounded-xl transition-all ${
              !name.trim()
                ? isGlitch
                  ? 'bg-[#00ffff]/10 text-[#00ffff]/30 cursor-not-allowed'
                  : isWin98
                  ? 'bg-[#808080] text-[#c0c0c0] cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isGlitch
                ? 'bg-[#00ffff] text-[#0a0a0a] hover:bg-[#00ffff]/90 border-2 border-[#00ffff]'
                : isWin98
                ? 'win98-button bg-[#000080] text-white'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            {isEditMode ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}