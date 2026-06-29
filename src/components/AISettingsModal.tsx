import { X, Sparkles } from 'lucide-react';
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

  const handleSave = () => { onSave(settings); onClose(); };
  const handleReset = () => setSettings(defaultSettings);

  const mono = { fontFamily: 'monospace' as const };

  // Shared option-button styling (selected vs not) per theme — clean & minimal.
  const optionClass = (selected: boolean) =>
    `px-3 py-2.5 rounded-md border text-left transition-colors ${
      selected
        ? isGlitch
          ? 'bg-[#002a2a] border-[#00ffff] text-[#00ffff]'
          : isWin98
            ? 'win98-button bg-[#000080] text-white'
            : 'bg-teal-50 border-teal-500 text-teal-700'
        : isGlitch
          ? 'bg-[#0f0f0f] border-[#1f3a3a] text-[#7fdede] hover:border-[#00ffff]'
          : isWin98
            ? 'bg-white border-gray-400 text-black hover:bg-gray-100'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
    }`;

  const labelClass = `block mb-2 text-xs uppercase tracking-wide ${
    isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-500'
  }`;

  const hintClass = `text-xs mt-1.5 ${
    isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-600' : 'text-gray-400'
  }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-xl shadow-2xl ${
        isGlitch ? 'glitch-container' : isWin98 ? 'win98-container' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isGlitch ? 'glitch-header' : isWin98 ? 'win98-header' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-teal-600'} />
            <h2 className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}
                style={{ ...mono, fontSize: '0.95rem', fontWeight: 600 }}>
              AI Personality
            </h2>
          </div>
          <button onClick={onClose}
            className={`p-1.5 rounded-md transition-colors ${isGlitch ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : isWin98 ? 'win98-button' : 'text-gray-400 hover:bg-gray-100'}`}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className={`px-5 py-5 space-y-6 ${isGlitch ? 'bg-[#0a0a0a]' : isWin98 ? 'bg-[#c0c0c0]' : 'bg-white'}`}>

          {/* Tone */}
          <div>
            <label className={labelClass} style={mono}>Tone of voice</label>
            <div className="grid grid-cols-2 gap-2">
              {(['casual', 'energetic', 'calm', 'playful'] as const).map((tone) => (
                <button key={tone} onClick={() => setSettings({ ...settings, tone })}
                  className={optionClass(settings.tone === tone)} style={{ ...mono, fontSize: '0.85rem' }}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </button>
              ))}
            </div>
            <p className={hintClass} style={mono}>
              {settings.tone === 'casual' && 'Relaxed: "hey", "yeah", "let\'s go"'}
              {settings.tone === 'energetic' && 'Very excited, uses caps'}
              {settings.tone === 'calm' && 'Peaceful and serene'}
              {settings.tone === 'playful' && 'Fun, with the occasional joke'}
            </p>
          </div>

          {/* Emoji intensity */}
          <div>
            <label className={labelClass} style={mono}>Emoji usage</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: 'none', label: 'None' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ] as const).map(({ value, label }) => (
                <button key={value} onClick={() => setSettings({ ...settings, emojiIntensity: value })}
                  className={`text-center ${optionClass(settings.emojiIntensity === value)}`} style={{ ...mono, fontSize: '0.8rem' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Motivation style */}
          <div>
            <label className={labelClass} style={mono}>Motivation style</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'encouraging', label: 'Encouraging', desc: 'Always positive' },
                { value: 'challenging', label: 'Challenging', desc: 'Pushes you' },
                { value: 'supportive', label: 'Supportive', desc: 'Very caring' },
                { value: 'balanced', label: 'Balanced', desc: 'A mix of all' },
              ] as const).map(({ value, label, desc }) => (
                <button key={value} onClick={() => setSettings({ ...settings, motivationStyle: value })}
                  className={optionClass(settings.motivationStyle === value)} style={{ ...mono, fontSize: '0.85rem' }}>
                  <div>{label}</div>
                  <div className="text-xs opacity-60">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom instructions */}
          <div>
            <label className={labelClass} style={mono}>Custom instructions</label>
            <textarea
              value={settings.customKeywords}
              autoComplete="new-password"
              data-form-type="other"
              spellCheck="false"
              autoCapitalize="off"
              onChange={(e) => setSettings({ ...settings, customKeywords: e.target.value })}
              maxLength={500}
              placeholder="e.g. always call me 'partner', avoid 'boss'..."
              rows={3}
              className={`w-full px-3 py-2.5 rounded-md border resize-none outline-none ${
                isGlitch
                  ? 'bg-[#0f0f0f] border-[#1f3a3a] text-[#00ffff] placeholder:text-[#3a6a6a] focus:border-[#00ffff]'
                  : isWin98
                    ? 'bg-white border-gray-400 text-black'
                    : 'bg-white border-gray-200 text-gray-700 placeholder:text-gray-300 focus:border-teal-400'
              }`}
              style={{ ...mono, fontSize: '0.85rem' }}
            />
            <div className="flex justify-end">
              <p className={`text-xs mt-1 ${settings.customKeywords.length > 450 ? 'text-red-500' : isGlitch ? 'text-[#5fbcbc]' : 'text-gray-400'}`} style={mono}>
                {settings.customKeywords.length}/500
              </p>
            </div>
          </div>

          {/* Creativity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass.replace('mb-2', '')} style={mono}>Creativity</label>
              <span className={`text-xs ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-700'}`} style={mono}>
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range" min="0.5" max="1.0" step="0.05"
              value={settings.temperature}
              autoComplete="new-password"
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full accent-teal-500"
            />
            <div className="flex justify-between text-xs mt-1" style={mono}>
              <span className={isGlitch ? 'text-[#5fbcbc]' : 'text-gray-400'}>Consistent</span>
              <span className={isGlitch ? 'text-[#5fbcbc]' : 'text-gray-400'}>Creative</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`flex gap-2 px-5 py-4 border-t ${
          isGlitch ? 'bg-[#0a0a0a] border-[#1f3a3a]' : isWin98 ? 'bg-[#c0c0c0] border-white' : 'bg-white border-gray-100'
        }`}>
          <button onClick={handleReset}
            className={`py-2 px-4 rounded-md text-sm transition-colors ${
              isGlitch ? 'text-[#5fbcbc] hover:text-[#00ffff]' : isWin98 ? 'win98-button' : 'text-gray-500 hover:bg-gray-100'
            }`} style={{ ...mono, fontWeight: 600 }}>
            Reset
          </button>
          <div className="flex-1" />
          <button onClick={onClose}
            className={`py-2 px-4 rounded-md text-sm transition-colors ${
              isGlitch ? 'text-[#5fbcbc] hover:text-[#00ffff]' : isWin98 ? 'win98-button' : 'text-gray-600 hover:bg-gray-100'
            }`} style={{ ...mono, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSave}
            className={`py-2 px-5 rounded-md text-sm transition-colors ${
              isGlitch ? 'glitch-button primary' : isWin98 ? 'win98-button primary' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`} style={{ ...mono, fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export type { AISettings };
