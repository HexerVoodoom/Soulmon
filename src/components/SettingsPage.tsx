import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';
import { Language, useTranslation } from '../utils/i18n';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission, checkNotificationPermission } from '../utils/notifications';

interface SettingsPageProps {
  useAI: boolean;
  onToggleAI: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  theme: 'default' | 'win98' | 'glitch';
  onChangeTheme: (theme: 'default' | 'win98' | 'glitch') => void;
  onOpenGuide: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export function SettingsPage({
  useAI,
  onToggleAI,
  aiSettings,
  onSaveAISettings,
  theme,
  onChangeTheme,
  onOpenGuide,
  notificationsEnabled,
  onToggleNotifications,
}: SettingsPageProps) {
  const language: Language = 'en-US';
  const [showAISettings, setShowAISettings] = useState(false);
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const t = useTranslation(language);

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
            🤖 {t.settings.ai}
          </h3>
          
          <div className="mb-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span
                className={`${
                  isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {useAI ? t.settings.aiChatEnabled : t.settings.keywordsOnly}
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
                ? t.settings.aiDescriptionEnabled
                : t.settings.aiDescriptionDisabled
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
            <span>{t.settings.configureAI}</span>
          </button>
        </div>

        {/* Guide */}
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
            📖 {t.settings.guide}
          </h3>
          
          <p
            className={`mb-5 text-xs ${
              isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {t.settings.guideDescription}
          </p>

          <button
            onClick={onOpenGuide}
            className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              isGlitch
                ? 'bg-[#00ffff] text-[#0a0a0a] hover:bg-[#00ffff]/90 border-2 border-[#00ffff]'
                : isWin98
                ? 'win98-button bg-[#c0c0c0] text-[#000000]'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
            }`}
            style={{ fontFamily: 'monospace', fontWeight: '500' }}
          >
            <span>📚</span>
            <span>{t.settings.openGuide}</span>
          </button>
        </div>

        {/* Notifications */}
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
            🔔 {t.settings.notifications}
          </h3>
          
          <p
            className={`mb-5 text-xs ${
              isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {t.settings.notificationsDescription}
          </p>

          <div className="flex items-center justify-between cursor-pointer">
            <span
              className={`${
                isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'
              }`}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            >
              {notificationsEnabled ? t.settings.notificationsEnabled : t.settings.notificationsDisabled}
            </span>
            <div
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notificationsEnabled
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
              onClick={onToggleNotifications}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
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
            ℹ️ {t.settings.about}
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
              {t.settings.aboutDescription}
            </p>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        currentSettings={aiSettings}
        onSave={(settings) => {
          onSaveAISettings(settings);
          setShowAISettings(false);
        }}
        theme={theme}
      />
    </>
  );
}
