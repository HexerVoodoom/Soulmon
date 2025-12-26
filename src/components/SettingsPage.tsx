import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';

interface SettingsPageProps {
  useAI: boolean;
  onToggleAI: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  theme: 'default' | 'win98' | 'glitch';
  onChangeTheme: (theme: 'default' | 'win98' | 'glitch') => void;
}

export function SettingsPage({
  useAI,
  onToggleAI,
  aiSettings,
  onSaveAISettings,
  theme,
  onChangeTheme,
}: SettingsPageProps) {
  const [showAISettings, setShowAISettings] = useState(false);
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  return (
    <>
      <div className="space-y-6">
        {/* AI Settings */}
        <div
          className={`p-6 rounded-2xl ${
            isGlitch
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
              : isWin98
              ? 'win98-button bg-white'
              : 'bg-white shadow-sm ring-1 ring-gray-200/50'
          }`}
        >
          <h3
            className={`mb-3 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            🤖 Inteligência Artificial
          </h3>
          
          <div className="mb-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span
                className={`${
                  isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {useAI ? 'AI Chat' : 'Keywords Only'}
              </span>
              <div
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  useAI
                    ? isGlitch
                      ? 'bg-[#00ffff]'
                      : isWin98
                      ? 'bg-[#000080]'
                      : 'bg-teal-500'
                    : isGlitch
                    ? 'bg-[#ff0066]/30'
                    : isWin98
                    ? 'bg-[#808080]'
                    : 'bg-gray-300'
                }`}
                onClick={onToggleAI}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    useAI ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
            <p
              className={`text-xs mt-2 ${
                isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              {useAI
                ? 'Seu digimon usa IA para conversas personalizadas'
                : 'Mensagens baseadas apenas em palavras-chave'
              }
            </p>
          </div>

          <button
            onClick={() => setShowAISettings(true)}
            className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              isGlitch
                ? 'bg-[#00ffff] text-[#0a0a0a] hover:bg-[#00ffff]/90 border-2 border-[#00ffff]'
                : isWin98
                ? 'win98-button bg-[#c0c0c0] text-[#000000]'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: '500' }}
          >
            <span>⚙️</span>
            <span>Configurar IA</span>
          </button>
        </div>

        {/* Theme Settings */}
        <div
          className={`p-6 rounded-2xl ${
            isGlitch
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
              : isWin98
              ? 'win98-button bg-white'
              : 'bg-white shadow-sm ring-1 ring-gray-200/50'
          }`}
        >
          <h3
            className={`mb-5 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            🎨 Skin Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onChangeTheme('default')}
              className={`py-4 px-3 rounded-xl transition-all flex flex-col items-center gap-2 ${
                theme === 'default'
                  ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span style={{ fontSize: '1.75rem' }}>✨</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: '500' }}>
                Modern
              </span>
            </button>
            <button
              onClick={() => onChangeTheme('win98')}
              className={`py-4 px-3 rounded-xl transition-all flex flex-col items-center gap-2 ${
                theme === 'win98'
                  ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span style={{ fontSize: '1.75rem' }}>🖥️</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: '500' }}>
                Win98
              </span>
            </button>
            <button
              onClick={() => onChangeTheme('glitch')}
              className={`py-4 px-3 rounded-xl transition-all flex flex-col items-center gap-2 ${
                theme === 'glitch'
                  ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span style={{ fontSize: '1.75rem' }}>⚡</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold' }}>
                Glitch
              </span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div
          className={`p-6 rounded-2xl ${
            isGlitch
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
              : isWin98
              ? 'win98-button bg-white'
              : 'bg-white shadow-sm ring-1 ring-gray-200/50'
          }`}
        >
          <h3
            className={`mb-3 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            ℹ️ Sobre o App
          </h3>
          <div className="space-y-2">
            <p
              className={`${
                isGlitch ? 'text-[#00ffff]/80' : isWin98 ? 'text-[#000000]' : 'text-gray-600'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            >
              <strong>DigiApp</strong> v1.0.2
            </p>
            <p
              className={`${
                isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
            >
              Aplicativo gamificado de produtividade com companheiro digital evolutivo
            </p>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        aiSettings={aiSettings}
        onSave={(settings) => {
          onSaveAISettings(settings);
          setShowAISettings(false);
        }}
      />
    </>
  );
}
