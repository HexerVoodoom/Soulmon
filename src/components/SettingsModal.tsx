import { X, Settings, Sparkles, Zap, Volume2, VolumeX } from 'lucide-react';
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

  return (
    <>
      {/* Overlay within app container */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl modern-container bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b modern-header border-gray-200">
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-teal-600" />
              <h2 className="modern-title" style={{ fontFamily: 'monospace' }}>
                ⚙️ Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded transition-colors hover:bg-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 bg-white">
            
            {/* Sound Toggle */}
            <div className="p-4 rounded border bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundMuted
                    ? <VolumeX size={20} className="text-teal-600" />
                    : <Volume2 size={20} className="text-teal-600" />
                  }
                  <div>
                    <h3 className="text-gray-900" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      Sound Effects
                    </h3>
                    <p className="text-xs mt-0.5 text-gray-500" style={{ fontFamily: 'monospace' }}>
                      {soundMuted ? 'Muted' : 'On — task, feed, shower, evolve…'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    !soundMuted
                      ? 'bg-gradient-to-r from-[#2bff95] to-teal-500'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      !soundMuted
                        ? 'translate-x-6 bg-black'
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* AI Chat Toggle */}
            <div className="p-4 rounded border bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={20} className="text-teal-600" />
                  <div>
                    <h3 className="text-gray-900" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      AI Chat / Keywords
                    </h3>
                    <p className="text-xs mt-0.5 text-gray-500" style={{ fontFamily: 'monospace' }}>
                      {useAI ? 'Using advanced AI (Groq)' : 'Using keyword-based responses'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleAI}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useAI
                      ? 'bg-gradient-to-r from-[#2bff95] to-teal-500'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      useAI 
                        ? 'translate-x-6 bg-black' 
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Configure AI Button */}
            <button
              onClick={() => setShowAISettings(true)}
              className="w-full p-4 rounded border transition-all bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-teal-600" />
                  <div className="text-left">
                    <h3 className="text-gray-900" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      Configure AI
                    </h3>
                    <p className="text-xs mt-0.5 text-gray-500" style={{ fontFamily: 'monospace' }}>
                      Customize companion personality
                    </p>
                  </div>
                </div>
                <span className="text-2xl text-gray-400">›</span>
              </div>
            </button>

            {/* Info Note */}
            <div className="p-3 rounded border text-xs bg-teal-50 border-teal-200 text-teal-900" style={{ fontFamily: 'monospace' }}>
              💡 <strong>Tip:</strong> With AI Chat enabled, your companion can automatically create activities when you ask!
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t bg-gray-50 border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded transition-colors modern-button"
              style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
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
