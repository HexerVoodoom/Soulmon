import { X, Sparkles, MessageCircle, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AISettings {
  tone: 'casual' | 'energetic' | 'calm' | 'playful';
  emojiIntensity: 'none' | 'low' | 'medium' | 'high';
  motivationStyle: 'encouraging' | 'challenging' | 'supportive' | 'balanced';
  customKeywords: string;
  temperature: number;
}

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AISettings;
  onSave: (settings: AISettings) => void;
  theme?: 'default' | 'win98' | 'glitch';
}

const defaultSettings: AISettings = {
  tone: 'casual',
  emojiIntensity: 'medium',
  motivationStyle: 'balanced',
  customKeywords: '',
  temperature: 0.85
};

export function AISettingsModal({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave,
  theme = 'default'
}: AISettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(currentSettings || defaultSettings);
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  useEffect(() => {
    setSettings(currentSettings || defaultSettings);
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl ${
        isGlitch 
          ? 'glitch-container' 
          : isWin98 
            ? 'win98-container' 
            : 'modern-container bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isGlitch
            ? 'glitch-header'
            : isWin98
              ? 'win98-header'
              : 'modern-header border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-teal-600'} />
            <h2 className={`${
              isGlitch ? 'glitch-title' : isWin98 ? 'win98-title' : 'modern-title'
            }`} style={{ fontFamily: 'monospace' }}>
              ⚙️ AI Personality
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded transition-colors ${
              isGlitch
                ? 'glitch-button'
                : isWin98
                  ? 'win98-button'
                  : 'hover:bg-gray-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={`p-4 space-y-6 ${
          isGlitch ? 'bg-[#0a0a0a]' : isWin98 ? 'bg-[#c0c0c0]' : 'bg-white'
        }`}>
          
          {/* Description */}
          <div className={`p-3 rounded border ${
            isGlitch
              ? 'bg-[#1a1a1a] border-[#00ffff] text-[#00ffff]'
              : isWin98
                ? 'bg-white border-gray-400 text-black'
                : 'bg-teal-50 border-teal-200 text-teal-900'
          }`} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            💡 Customize how your digital companion talks to you! These settings affect the AI's personality.
          </div>

          {/* Tone */}
          <div>
            <label className={`flex items-center gap-2 mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              <MessageCircle size={16} />
              Tone of Voice
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['casual', 'energetic', 'calm', 'playful'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSettings({ ...settings, tone: tone as AISettings['tone'] })}
                  className={`p-3 rounded border transition-all ${
                    settings.tone === tone
                      ? isGlitch
                        ? 'glitch-button'
                        : isWin98
                          ? 'win98-button bg-[#000080] text-white'
                          : 'bg-gradient-to-r from-[#2bff95] to-teal-500 text-black border-teal-600'
                      : isGlitch
                        ? 'bg-[#1a1a1a] border-[#00ffff] text-[#00ffff] hover:bg-[#2a2a2a]'
                        : isWin98
                          ? 'bg-white border-gray-400 text-black hover:bg-gray-100'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                >
                  {tone === 'casual' && '😊 Casual'}
                  {tone === 'energetic' && '⚡ Energetic'}
                  {tone === 'calm' && '🧘 Calm'}
                  {tone === 'playful' && '🎮 Playful'}
                </button>
              ))}
            </div>
            <p className={`text-xs mt-1 ${
              isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-gray-600' : 'text-gray-500'
            }`} style={{ fontFamily: 'monospace' }}>
              {settings.tone === 'casual' && 'Relaxed language: "hey, yeah, let\'s go"'}
              {settings.tone === 'energetic' && 'Very excited: "LET\'S GO! 🔥"'}
              {settings.tone === 'calm' && 'Peaceful and serene: "take it easy..."'}
              {settings.tone === 'playful' && 'Fun and full of jokes'}
            </p>
          </div>

          {/* Emoji Intensity */}
          <div>
            <label className={`flex items-center gap-2 mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              <Heart size={16} />
              Emoji Intensity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'none', label: 'None', emoji: '🚫' },
                { value: 'low', label: 'Low', emoji: '😊' },
                { value: 'medium', label: 'Medium', emoji: '😊✨' },
                { value: 'high', label: 'High', emoji: '😊✨🔥' }
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, emojiIntensity: value as AISettings['emojiIntensity'] })}
                  className={`p-3 rounded border transition-all ${
                    settings.emojiIntensity === value
                      ? isGlitch
                        ? 'glitch-button'
                        : isWin98
                          ? 'win98-button bg-[#000080] text-white'
                          : 'bg-gradient-to-r from-[#2bff95] to-teal-500 text-black border-teal-600'
                      : isGlitch
                        ? 'bg-[#1a1a1a] border-[#00ffff] text-[#00ffff] hover:bg-[#2a2a2a]'
                        : isWin98
                          ? 'bg-white border-gray-400 text-black hover:bg-gray-100'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                  <div>{emoji}</div>
                  <div>{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Motivation Style */}
          <div>
            <label className={`flex items-center gap-2 mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              💪 Motivation Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'encouraging', label: '🌟 Encouraging', desc: 'Always positive' },
                { value: 'challenging', label: '🔥 Challenging', desc: 'Pushes you' },
                { value: 'supportive', label: '💚 Supportive', desc: 'Very caring' },
                { value: 'balanced', label: '⚖️ Balanced', desc: 'Mix of all' }
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, motivationStyle: value as AISettings['motivationStyle'] })}
                  className={`p-3 rounded border transition-all text-left ${
                    settings.motivationStyle === value
                      ? isGlitch
                        ? 'glitch-button'
                        : isWin98
                          ? 'win98-button bg-[#000080] text-white'
                          : 'bg-gradient-to-r from-[#2bff95] to-teal-500 text-black border-teal-600'
                      : isGlitch
                        ? 'bg-[#1a1a1a] border-[#00ffff] text-[#00ffff] hover:bg-[#2a2a2a]'
                        : isWin98
                          ? 'bg-white border-gray-400 text-black hover:bg-gray-100'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                >
                  <div>{label}</div>
                  <div className="text-xs opacity-70">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Keywords */}
          <div>
            <label className={`flex items-center gap-2 mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              🏷️ Custom Keywords
            </label>
            <textarea
              value={settings.customKeywords}
              autoComplete="new-password"
              data-form-type="other"
              spellCheck="false"
              autoCapitalize="off"
              onChange={(e) => setSettings({ ...settings, customKeywords: e.target.value })}
              maxLength={500}
              placeholder="e.g., always say 'partner', avoid 'boss', use slang..."
              className={`w-full p-3 rounded border resize-none ${
                isGlitch
                  ? 'bg-[#1a1a1a] border-[#00ffff] text-[#00ffff] placeholder:text-[#ff00ff]'
                  : isWin98
                    ? 'bg-white border-gray-400 text-black'
                    : 'bg-white border-gray-300 text-gray-700'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              rows={3}
            />
            <div className="flex justify-between mt-1">
              <p className={`text-xs ${
                isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-gray-600' : 'text-gray-500'
              }`} style={{ fontFamily: 'monospace' }}>
                💡 Additional instructions to customize even more
              </p>
              <p className={`text-xs ${
                settings.customKeywords.length > 450
                  ? 'text-red-500'
                  : isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-gray-600' : 'text-gray-400'
              }`} style={{ fontFamily: 'monospace' }}>
                {settings.customKeywords.length}/500
              </p>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <label className={`flex items-center gap-2 mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'
            }`} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              🌡️ Creativity: {settings.temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={settings.temperature}
              autoComplete="new-password"
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ fontFamily: 'monospace' }}>
              <span className={isGlitch ? 'text-[#ff00ff]' : 'text-gray-500'}>Conservative</span>
              <span className={isGlitch ? 'text-[#ff00ff]' : 'text-gray-500'}>Creative</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`flex gap-2 p-4 border-t ${
          isGlitch
            ? 'bg-[#0a0a0a] border-[#00ffff]'
            : isWin98
              ? 'bg-[#c0c0c0] border-white'
              : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={handleReset}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              isGlitch
                ? 'bg-[#1a1a1a] border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#2a2a2a]'
                : isWin98
                  ? 'win98-button'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            🔄 Reset
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              isGlitch
                ? 'bg-[#1a1a1a] border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#2a2a2a]'
                : isWin98
                  ? 'win98-button'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2 px-4 rounded transition-colors ${
              isGlitch
                ? 'glitch-button primary'
                : isWin98
                  ? 'win98-button primary'
                  : 'modern-button'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            ✅ Save
          </button>
        </div>
      </div>
    </div>
  );
}

export type { AISettings };
