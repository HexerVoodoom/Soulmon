import { Sparkles, Zap, Volume2, VolumeX } from 'lucide-react';
import iconGearGold from '../assets/soulmon/icons/icon-gear-gold.png';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  useAI: boolean;
  onToggleAI: () => void;
  soundMuted?: boolean;
  onToggleSound?: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  useAI,
  onToggleAI,
  soundMuted = false,
  onToggleSound,
  aiSettings,
  onSaveAISettings,
}: SettingsModalProps) {
  const [showAISettings, setShowAISettings] = useState(false);

  if (!isOpen) return null;

  const rowStyle: React.CSSProperties = { background: 'var(--sm-bg)', border: '1px solid var(--sm-line)' };

  return (
    <>
      {/* Overlay within app container */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl sm-card" style={{ padding: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--sm-line)' }}>
            <div className="flex items-center gap-2">
              <img src={iconGearGold} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              <h2 style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 18, color: 'var(--sm-ink)' }}>
                Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded transition-colors"
              style={{ color: 'var(--sm-muted)' }}
            >
              <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">

            {/* Sound Toggle */}
            <div className="p-4 rounded" style={rowStyle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundMuted
                    ? <VolumeX size={20} style={{ color: 'var(--sm-primary)' }} />
                    : <Volume2 size={20} style={{ color: 'var(--sm-primary)' }} />
                  }
                  <div>
                    <h3 style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--sm-ink)' }}>
                      Sound Effects
                    </h3>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'monospace', color: 'var(--sm-muted)' }}>
                      {soundMuted ? 'Muted' : 'On — task, feed, shower, evolve…'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: soundMuted ? 'var(--sm-line)' : 'var(--sm-primary)' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      !soundMuted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* AI Chat Toggle */}
            <div className="p-4 rounded" style={rowStyle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={20} style={{ color: 'var(--sm-primary)' }} />
                  <div>
                    <h3 style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--sm-ink)' }}>
                      AI Chat / Keywords
                    </h3>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'monospace', color: 'var(--sm-muted)' }}>
                      {useAI ? 'Using advanced AI (Groq)' : 'Using keyword-based responses'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleAI}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: useAI ? 'var(--sm-primary)' : 'var(--sm-line)' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useAI ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Configure AI Button */}
            <button
              onClick={() => setShowAISettings(true)}
              className="w-full p-4 rounded transition-all"
              style={rowStyle}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} style={{ color: 'var(--sm-primary)' }} />
                  <div className="text-left">
                    <h3 style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--sm-ink)' }}>
                      Configure AI
                    </h3>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'monospace', color: 'var(--sm-muted)' }}>
                      Customize companion personality
                    </p>
                  </div>
                </div>
                <span className="text-2xl" style={{ color: 'var(--sm-muted)' }}>›</span>
              </div>
            </button>

            {/* Info Note */}
            <div className="p-3 rounded text-xs" style={{ background: 'var(--sm-primary-soft)', border: '1px solid var(--sm-primary)', color: 'var(--sm-primary)', fontFamily: 'monospace' }}>
              💡 <strong>Tip:</strong> With AI Chat enabled, your companion can automatically create activities when you ask!
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4" style={{ borderTop: '1px solid var(--sm-line)' }}>
            <button
              onClick={onClose}
              className="sm-btn flex-1"
              style={{ fontFamily: 'monospace' }}
            >
              ✅ Close
            </button>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        currentSettings={aiSettings}
        onSave={onSaveAISettings}
      />
    </>
  );
}
