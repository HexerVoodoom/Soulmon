import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';
import { Language, useTranslation, getLanguageName, getLanguageFlag } from '../utils/i18n';
import { Bell, BellOff, Copy, Check } from 'lucide-react';
import { requestNotificationPermission, checkNotificationPermission } from '../utils/notifications';
import { InstallPrompt } from './InstallPrompt';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { cloudLoad } from '../utils/cloudSave';

interface SettingsPageProps {
  useAI: boolean;
  onToggleAI: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  theme: 'default' | 'win98' | 'glitch';
  onChangeTheme: (theme: 'default' | 'win98' | 'glitch') => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onOpenGuide: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onRestoreFromCloud: (saveId: string) => Promise<boolean>;
  onLoginWithEmail: (email: string) => Promise<'loaded' | 'created'>;
}

export function SettingsPage({
  useAI,
  onToggleAI,
  aiSettings,
  onSaveAISettings,
  theme,
  onChangeTheme,
  language,
  onChangeLanguage,
  onOpenGuide,
  notificationsEnabled,
  onToggleNotifications,
  onRestoreFromCloud,
  onLoginWithEmail,
}: SettingsPageProps) {
  const [showAISettings, setShowAISettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [emailInput, setEmailInput] = useState('');
  // Auto-sleep schedule (self-contained: read/written straight to localStorage;
  // the App-level effect picks changes up on its next minute tick)
  const [autoSleepEnabled, setAutoSleepEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_ENABLED) === 'true');
  const [autoSleepStart, setAutoSleepStart] = useState(() => localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_START) || '23:00');
  const [autoSleepEnd, setAutoSleepEnd] = useState(() => localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_END) || '07:00');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'loaded' | 'created' | 'err'>('idle');
  const savedEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) ?? null;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleLogin = async () => {
    const email = emailInput.trim();
    if (!isValidEmail(email)) { setLoginStatus('err'); return; }
    setLoginStatus('loading');
    try {
      const result = await onLoginWithEmail(email);
      setLoginStatus(result); // 'loaded' | 'created' — page reloads right after
    } catch {
      setLoginStatus('err');
    }
  };
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const t = useTranslation(language);
  const saveId = localStorage.getItem(STORAGE_KEYS.SAVE_ID) ?? null;
  const lastSyncRaw = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC);
  const lastSyncLabel = lastSyncRaw
    ? new Date(lastSyncRaw).toLocaleString(language === 'pt-BR' ? 'pt-BR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  const handleCopy = () => {
    if (!saveId) return;
    navigator.clipboard.writeText(saveId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRestore = async () => {
    const id = restoreInput.trim();
    if (!id) return;
    setRestoreStatus('loading');
    const ok = await onRestoreFromCloud(id);
    setRestoreStatus(ok ? 'ok' : 'err');
    if (!ok) setTimeout(() => setRestoreStatus('idle'), 3000);
  };

  return (
    <>
      <div className="space-y-6">
        {/* PWA Install */}
        <InstallPrompt theme={theme} language={language} />

        {/* Cloud Save */}
        <div className={`p-6 rounded-2xl ${isGlitch ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30' : isWin98 ? 'win98-button bg-white' : 'bg-white shadow-sm ring-1 ring-gray-200/50'}`}>
          <h3 className={`mb-3 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'}`} style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}>
            ☁️ {language === 'pt-BR' ? 'Backup na nuvem' : 'Cloud backup'}
          </h3>
          <p className={`mb-4 text-xs ${isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
            {language === 'pt-BR'
              ? 'Entre com seu e-mail para sincronizar o mesmo progresso em qualquer dispositivo (navegador e app).'
              : 'Sign in with your email to sync the same progress across any device (browser and app).'}
          </p>

          {/* Email login — same email = same save everywhere */}
          <div className="mb-5">
            {savedEmail && (
              <p className={`mb-1 text-[11px] ${isGlitch ? 'text-[#00ffff]/70' : isWin98 ? 'text-[#000080]' : 'text-teal-600'}`} style={{ fontFamily: 'monospace' }}>
                {language === 'pt-BR' ? `conectado: ${savedEmail}` : `signed in: ${savedEmail}`}
              </p>
            )}
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); if (loginStatus === 'err') setLoginStatus('idle'); }}
              placeholder={savedEmail ?? (language === 'pt-BR' ? 'seu@email.com' : 'your@email.com')}
              className={`w-full text-xs px-3 py-2 rounded-lg outline-none mb-2 ${isGlitch ? 'bg-[#001a00] text-[#00ffff] border border-[#00ffff]/30' : isWin98 ? 'border border-gray-400 bg-white' : 'border border-gray-200 bg-gray-50'}`}
              style={{ fontFamily: 'monospace' }}
            />
            <button
              onClick={handleLogin}
              disabled={!emailInput.trim() || loginStatus === 'loading'}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${isGlitch ? 'bg-[#00ffff] text-[#0a0a0a]' : isWin98 ? 'win98-button' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              style={{ fontFamily: 'monospace' }}
            >
              {loginStatus === 'loading'
                ? (language === 'pt-BR' ? 'sincronizando...' : 'syncing...')
                : (language === 'pt-BR' ? 'Entrar / Sincronizar' : 'Sign in / Sync')}
            </button>
            {loginStatus === 'err' && (
              <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'monospace' }}>
                {language === 'pt-BR' ? 'E-mail inválido ou falha ao sincronizar.' : 'Invalid email or sync failed.'}
              </p>
            )}
            {loginStatus === 'created' && (
              <p className="text-green-500 text-xs mt-1" style={{ fontFamily: 'monospace' }}>
                {language === 'pt-BR' ? 'Conta criada — progresso atual salvo neste e-mail.' : 'Account created — current progress saved to this email.'}
              </p>
            )}
            {loginStatus === 'loaded' && (
              <p className="text-green-500 text-xs mt-1" style={{ fontFamily: 'monospace' }}>
                {language === 'pt-BR' ? 'Progresso carregado deste e-mail!' : 'Progress loaded from this email!'}
              </p>
            )}
          </div>

          <p className={`mb-3 text-[11px] ${isGlitch ? 'text-[#00ffff]/40' : isWin98 ? 'text-[#808080]' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
            {language === 'pt-BR'
              ? 'Ou use o código de recuperação manual abaixo.'
              : 'Or use the manual recovery code below.'}
          </p>

          {saveId && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs ${isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
                  {language === 'pt-BR' ? 'Código de recuperação:' : 'Recovery code:'}
                </p>
                {lastSyncLabel && (
                  <p className={`text-[10px] ${isGlitch ? 'text-[#00ffff]/40' : isWin98 ? 'text-[#808080]' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
                    {language === 'pt-BR' ? `sync: ${lastSyncLabel}` : `synced: ${lastSyncLabel}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className={`flex-1 text-xs px-3 py-2 rounded-lg break-all ${isGlitch ? 'bg-[#001a00] text-[#00ffff]' : isWin98 ? 'bg-[#c0c0c0] text-black border border-gray-400' : 'bg-gray-100 text-gray-700'}`} style={{ fontFamily: 'monospace' }}>
                  {saveId}
                </code>
                <button onClick={handleCopy} className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isGlitch ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : isWin98 ? 'win98-button' : 'text-gray-500 hover:bg-gray-100'}`} aria-label="Copy">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className={`text-xs ${isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
              {language === 'pt-BR' ? 'Restaurar a partir de um código:' : 'Restore from a code:'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={restoreInput}
                onChange={e => setRestoreInput(e.target.value)}
                placeholder={language === 'pt-BR' ? 'cole o código aqui' : 'paste code here'}
                className={`flex-1 text-xs px-3 py-2 rounded-lg outline-none ${isGlitch ? 'bg-[#001a00] text-[#00ffff] border border-[#00ffff]/30' : isWin98 ? 'border border-gray-400 bg-white' : 'border border-gray-200 bg-gray-50'}`}
                style={{ fontFamily: 'monospace' }}
              />
              <button
                onClick={handleRestore}
                disabled={!restoreInput.trim() || restoreStatus === 'loading'}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${isGlitch ? 'bg-[#00ffff] text-[#0a0a0a]' : isWin98 ? 'win98-button' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                style={{ fontFamily: 'monospace' }}
              >
                {restoreStatus === 'loading' ? '...' : restoreStatus === 'ok' ? '✓' : restoreStatus === 'err' ? '✗' : language === 'pt-BR' ? 'restaurar' : 'restore'}
              </button>
            </div>
            {restoreStatus === 'err' && (
              <p className="text-red-500 text-xs" style={{ fontFamily: 'monospace' }}>
                {language === 'pt-BR' ? 'Código não encontrado.' : 'Code not found.'}
              </p>
            )}
          </div>
        </div>

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

        {/* Auto-sleep schedule */}
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
            className={`mb-3 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'}`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            💤 {language === 'pt-BR' ? 'Sono automático' : 'Auto sleep'}
          </h3>
          <p
            className={`mb-5 text-xs ${isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'}`}
            style={{ fontFamily: 'monospace' }}
          >
            {language === 'pt-BR'
              ? 'O pet dorme e acorda sozinho nesse horário. Dormindo, ele não faz cocô.'
              : 'The pet sleeps and wakes on this schedule. It never poops while asleep.'}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-700'}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {autoSleepEnabled
                ? (language === 'pt-BR' ? 'Ativado' : 'Enabled')
                : (language === 'pt-BR' ? 'Desativado' : 'Disabled')}
            </span>
            <div
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                autoSleepEnabled
                  ? isGlitch ? 'bg-[#00ffff]' : isWin98 ? 'bg-[#000080]' : 'bg-teal-500'
                  : isGlitch ? 'bg-[#ff0066]/30' : isWin98 ? 'bg-[#808080]' : 'bg-gray-300'
              }`}
              onClick={() => {
                setAutoSleepEnabled(prev => {
                  const next = !prev;
                  localStorage.setItem(STORAGE_KEYS.AUTO_SLEEP_ENABLED, next ? 'true' : 'false');
                  return next;
                });
              }}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                autoSleepEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </div>
          </div>
          {autoSleepEnabled && (
            <div className="flex items-center gap-3">
              {([
                { label: language === 'pt-BR' ? 'Dormir' : 'Sleep', value: autoSleepStart, set: setAutoSleepStart, key: STORAGE_KEYS.AUTO_SLEEP_START },
                { label: language === 'pt-BR' ? 'Acordar' : 'Wake', value: autoSleepEnd, set: setAutoSleepEnd, key: STORAGE_KEYS.AUTO_SLEEP_END },
              ] as const).map(f => (
                <label key={f.label} className="flex items-center gap-2">
                  <span className={`text-xs ${isGlitch ? 'text-[#00ffff]/70' : isWin98 ? 'text-black' : 'text-gray-500'}`}
                        style={{ fontFamily: 'monospace' }}>
                    {f.label}
                  </span>
                  <input
                    type="time"
                    value={f.value}
                    onChange={e => { f.set(e.target.value); localStorage.setItem(f.key, e.target.value); }}
                    className={`px-2 py-1 rounded-md border text-sm ${
                      isGlitch
                        ? 'bg-[#0f0f0f] border-[#1f3a3a] text-[#00ffff]'
                        : isWin98
                          ? 'bg-white border-gray-400 text-black'
                          : 'bg-white border-gray-200 text-gray-700'
                    }`}
                    style={{ fontFamily: 'monospace' }}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Language */}
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
            🌐 {t.settings.language}
          </h3>
          <p
            className={`mb-4 text-xs ${
              isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {t.settings.languageDescription}
          </p>
          <div className="flex gap-2">
            {(['en-US', 'pt-BR'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onChangeLanguage(lang)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  language === lang
                    ? isGlitch
                      ? 'bg-[#00ffff] text-[#0a0a0a] border-2 border-[#00ffff]'
                      : isWin98
                      ? 'bg-[#000080] text-white border-2 border-[#000080]'
                      : 'bg-teal-500 text-white shadow-sm'
                    : isGlitch
                    ? 'bg-transparent text-[#00ffff]/60 border border-[#00ffff]/30 hover:border-[#00ffff]/60'
                    : isWin98
                    ? 'win98-button bg-[#c0c0c0] text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{ fontFamily: 'monospace' }}
                aria-pressed={language === lang}
              >
                <span>{getLanguageFlag(lang)}</span>
                <span>{getLanguageName(lang)}</span>
              </button>
            ))}
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
