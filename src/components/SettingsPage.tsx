import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';
import { Language, useTranslation, getLanguageName, getLanguageFlag } from '../utils/i18n';
import { Bell, BellOff, Copy, Check, Cloud, Bot, BookOpen, Moon, Globe, Info } from 'lucide-react';
import { requestNotificationPermission, checkNotificationPermission } from '../utils/notifications';
import { AccountSection } from './AccountSection';
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
  onChangeLanguage,
  language,
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

  // Estilos compartilhados do tema padrão (sm-* design system)
  const cardClass = isGlitch ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30 p-6 rounded-2xl' : isWin98 ? 'win98-button bg-white p-6 rounded-2xl' : 'sm-card p-6';
  const headingStyle: React.CSSProperties = isGlitch
    ? { fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: 500, color: '#00ffff' }
    : isWin98
      ? { fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: 500, color: '#000' }
      : { fontSize: '1rem', fontWeight: 700, color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 8 };
  const bodyTextStyle: React.CSSProperties = isGlitch
    ? { fontFamily: 'monospace', color: 'rgba(0,255,255,0.6)' }
    : isWin98
      ? { fontFamily: 'monospace', color: '#808080' }
      : { color: 'var(--sm-muted)', fontSize: '0.8125rem' };
  const inputClass = isGlitch
    ? 'bg-[#001a00] text-[#00ffff] border border-[#00ffff]/30'
    : isWin98
      ? 'border border-gray-400 bg-white'
      : 'border';
  const inputStyle: React.CSSProperties = isGlitch || isWin98
    ? { fontFamily: 'monospace' }
    : { background: 'var(--sm-bg)', borderColor: 'var(--sm-line)', color: 'var(--sm-ink)' };
  const primaryBtnClass = isGlitch
    ? 'bg-[#00ffff] text-[#0a0a0a]'
    : isWin98
      ? 'win98-button'
      : 'sm-btn';
  const toggleOnBg = isGlitch ? '#00ffff' : isWin98 ? '#000080' : 'var(--sm-primary)';
  const toggleOffBg = isGlitch ? 'rgba(255,0,102,0.3)' : isWin98 ? '#808080' : 'var(--sm-line)';

  const iconWrap = (Icon: typeof Bell, color: string, bg: string) =>
    !isGlitch && !isWin98 ? (
      <span style={{ width: 28, height: 28, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} strokeWidth={2.2} />
      </span>
    ) : null;

  return (
    <>
      <div className="space-y-4">
        {/* PWA Install */}
        <InstallPrompt theme={theme} language={language} />

        {/* Cloud Save */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? '☁️ ' : iconWrap(Cloud, '#009ED8', '#e3f4fc')}
            {language === 'pt-BR' ? 'Backup na nuvem' : 'Cloud backup'}
          </h3>
          <p className="mb-4" style={bodyTextStyle}>
            {language === 'pt-BR'
              ? 'Entre com seu e-mail para sincronizar o mesmo progresso em qualquer dispositivo (navegador e app).'
              : 'Sign in with your email to sync the same progress across any device (browser and app).'}
          </p>

          {/* Email login — same email = same save everywhere */}
          <div className="mb-5">
            {savedEmail && (
              <p className={`mb-1 text-[11px] ${isGlitch ? 'text-[#00ffff]/70' : isWin98 ? 'text-[#000080]' : ''}`}
                 style={isGlitch || isWin98 ? { fontFamily: 'monospace' } : { color: 'var(--sm-primary)' }}>
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
              className={`w-full text-sm px-3 py-2.5 rounded-xl outline-none mb-2 ${inputClass}`}
              style={inputStyle}
            />
            <button
              onClick={handleLogin}
              disabled={!emailInput.trim() || loginStatus === 'loading'}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${primaryBtnClass}`}
              style={isGlitch || isWin98 ? { fontFamily: 'monospace' } : undefined}
            >
              {loginStatus === 'loading'
                ? (language === 'pt-BR' ? 'sincronizando...' : 'syncing...')
                : (language === 'pt-BR' ? 'Entrar / Sincronizar' : 'Sign in / Sync')}
            </button>
            {loginStatus === 'err' && (
              <p className="text-red-500 text-xs mt-1">
                {language === 'pt-BR' ? 'E-mail inválido ou falha ao sincronizar.' : 'Invalid email or sync failed.'}
              </p>
            )}
            {loginStatus === 'created' && (
              <p className="text-green-500 text-xs mt-1">
                {language === 'pt-BR' ? 'Conta criada — progresso atual salvo neste e-mail.' : 'Account created — current progress saved to this email.'}
              </p>
            )}
            {loginStatus === 'loaded' && (
              <p className="text-green-500 text-xs mt-1">
                {language === 'pt-BR' ? 'Progresso carregado deste e-mail!' : 'Progress loaded from this email!'}
              </p>
            )}
          </div>

          <p className="mb-3 text-xs" style={isGlitch ? { fontFamily: 'monospace', color: 'rgba(0,255,255,0.4)' } : isWin98 ? { fontFamily: 'monospace', color: '#808080' } : { color: 'var(--sm-muted)' }}>
            {language === 'pt-BR'
              ? 'Ou use o código de recuperação manual abaixo.'
              : 'Or use the manual recovery code below.'}
          </p>

          {saveId && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs" style={isGlitch || isWin98 ? { fontFamily: 'monospace', color: isGlitch ? 'rgba(0,255,255,0.5)' : '#808080' } : { color: 'var(--sm-muted)' }}>
                  {language === 'pt-BR' ? 'Código de recuperação:' : 'Recovery code:'}
                </p>
                {lastSyncLabel && (
                  <p className="text-[10px]" style={isGlitch || isWin98 ? { fontFamily: 'monospace', color: isGlitch ? 'rgba(0,255,255,0.4)' : '#808080' } : { color: 'var(--sm-muted)' }}>
                    {language === 'pt-BR' ? `sync: ${lastSyncLabel}` : `synced: ${lastSyncLabel}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className={`flex-1 text-xs px-3 py-2 rounded-xl break-all ${isGlitch ? 'bg-[#001a00] text-[#00ffff]' : isWin98 ? 'bg-[#c0c0c0] text-black border border-gray-400' : ''}`}
                      style={isGlitch || isWin98 ? { fontFamily: 'monospace' } : { background: 'var(--sm-bg)', color: 'var(--sm-ink)' }}>
                  {saveId}
                </code>
                <button onClick={handleCopy} className={`flex-shrink-0 p-2 rounded-xl transition-colors ${isGlitch ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : isWin98 ? 'win98-button' : ''}`}
                        style={!isGlitch && !isWin98 ? { color: 'var(--sm-muted)', background: 'var(--sm-bg)' } : undefined} aria-label="Copy">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs" style={isGlitch || isWin98 ? { fontFamily: 'monospace', color: isGlitch ? 'rgba(0,255,255,0.5)' : '#808080' } : { color: 'var(--sm-muted)' }}>
              {language === 'pt-BR' ? 'Restaurar a partir de um código:' : 'Restore from a code:'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={restoreInput}
                onChange={e => setRestoreInput(e.target.value)}
                placeholder={language === 'pt-BR' ? 'cole o código aqui' : 'paste code here'}
                className={`flex-1 text-xs px-3 py-2 rounded-xl outline-none ${inputClass}`}
                style={inputStyle}
              />
              <button
                onClick={handleRestore}
                disabled={!restoreInput.trim() || restoreStatus === 'loading'}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${primaryBtnClass}`}
                style={isGlitch || isWin98 ? { fontFamily: 'monospace' } : undefined}
              >
                {restoreStatus === 'loading' ? '...' : restoreStatus === 'ok' ? '✓' : restoreStatus === 'err' ? '✗' : language === 'pt-BR' ? 'restaurar' : 'restore'}
              </button>
            </div>
            {restoreStatus === 'err' && (
              <p className="text-red-500 text-xs">
                {language === 'pt-BR' ? 'Código não encontrado.' : 'Code not found.'}
              </p>
            )}
          </div>
        </div>

        {/* Conta e compras — restaurar compras é exigência da Play */}
        <AccountSection language={language} theme={theme} />

        {/* AI Settings */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? '🤖 ' : iconWrap(Bot, '#6d5bd0', '#efecfb')}
            {t.settings.ai}
          </h3>

          <div className="mb-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span style={isGlitch || isWin98 ? { fontFamily: 'monospace', fontSize: '0.875rem', color: isGlitch ? '#00ffff' : '#000' } : { fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
                {useAI ? t.settings.aiChatEnabled : t.settings.keywordsOnly}
              </span>
              <div
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{ background: useAI ? toggleOnBg : toggleOffBg }}
                onClick={onToggleAI}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${useAI ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>
            <p className="text-xs mt-2" style={bodyTextStyle}>
              {useAI ? t.settings.aiDescriptionEnabled : t.settings.aiDescriptionDisabled}
            </p>
          </div>

          <button
            onClick={() => setShowAISettings(true)}
            className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${primaryBtnClass}`}
            style={isGlitch || isWin98 ? { fontFamily: 'monospace', fontWeight: 500 } : { fontWeight: 700 }}
          >
            {(isGlitch || isWin98) && <span>⚙️</span>}
            <span>{t.settings.configureAI}</span>
          </button>
        </div>

        {/* Guide */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? '📖 ' : iconWrap(BookOpen, '#d9a441', '#fbf1dd')}
            {t.settings.guide}
          </h3>

          <p className="mb-5" style={bodyTextStyle}>
            {t.settings.guideDescription}
          </p>

          <button
            onClick={onOpenGuide}
            className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${primaryBtnClass}`}
            style={isGlitch || isWin98 ? { fontFamily: 'monospace', fontWeight: 500 } : { fontWeight: 700 }}
          >
            {(isGlitch || isWin98) && <span>📚</span>}
            <span>{t.settings.openGuide}</span>
          </button>
        </div>

        {/* Notifications */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? '🔔 ' : iconWrap(notificationsEnabled ? Bell : BellOff, '#e0483e', '#fde8e6')}
            {t.settings.notifications}
          </h3>

          <p className="mb-5" style={bodyTextStyle}>
            {t.settings.notificationsDescription}
          </p>

          <div className="flex items-center justify-between cursor-pointer">
            <span style={isGlitch || isWin98 ? { fontFamily: 'monospace', fontSize: '0.875rem', color: isGlitch ? '#00ffff' : '#000' } : { fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
              {notificationsEnabled ? t.settings.notificationsEnabled : t.settings.notificationsDisabled}
            </span>
            <div
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: notificationsEnabled ? toggleOnBg : toggleOffBg }}
              onClick={onToggleNotifications}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>

        {/* Auto-sleep schedule */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? '💤 ' : iconWrap(Moon, '#6b7280', '#eef0f3')}
            {language === 'pt-BR' ? 'Sono automático' : 'Auto sleep'}
          </h3>
          <p className="mb-5" style={bodyTextStyle}>
            {language === 'pt-BR'
              ? 'O pet dorme e acorda sozinho nesse horário. Dormindo, ele não faz cocô.'
              : 'The pet sleeps and wakes on this schedule. It never poops while asleep.'}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span style={isGlitch || isWin98 ? { fontFamily: 'monospace', fontSize: '0.875rem', color: isGlitch ? '#00ffff' : '#000' } : { fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
              {autoSleepEnabled
                ? (language === 'pt-BR' ? 'Ativado' : 'Enabled')
                : (language === 'pt-BR' ? 'Desativado' : 'Disabled')}
            </span>
            <div
              className="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
              style={{ background: autoSleepEnabled ? toggleOnBg : toggleOffBg }}
              onClick={() => {
                setAutoSleepEnabled(prev => {
                  const next = !prev;
                  localStorage.setItem(STORAGE_KEYS.AUTO_SLEEP_ENABLED, next ? 'true' : 'false');
                  return next;
                });
              }}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${autoSleepEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
          {autoSleepEnabled && (
            <div className="flex items-center gap-3">
              {([
                { label: language === 'pt-BR' ? 'Dormir' : 'Sleep', value: autoSleepStart, set: setAutoSleepStart, key: STORAGE_KEYS.AUTO_SLEEP_START },
                { label: language === 'pt-BR' ? 'Acordar' : 'Wake', value: autoSleepEnd, set: setAutoSleepEnd, key: STORAGE_KEYS.AUTO_SLEEP_END },
              ] as const).map(f => (
                <label key={f.label} className="flex items-center gap-2">
                  <span className="text-xs" style={isGlitch || isWin98 ? { fontFamily: 'monospace', color: isGlitch ? 'rgba(0,255,255,0.7)' : '#000' } : { color: 'var(--sm-muted)' }}>
                    {f.label}
                  </span>
                  <input
                    type="time"
                    value={f.value}
                    onChange={e => { f.set(e.target.value); localStorage.setItem(f.key, e.target.value); }}
                    className={`px-2 py-1 rounded-lg border text-sm ${isGlitch ? 'bg-[#0f0f0f] border-[#1f3a3a] text-[#00ffff]' : isWin98 ? 'bg-white border-gray-400 text-black' : ''}`}
                    style={isGlitch || isWin98 ? { fontFamily: 'monospace' } : { background: 'var(--sm-bg)', borderColor: 'var(--sm-line)', color: 'var(--sm-ink)' }}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Language */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? '🌐 ' : iconWrap(Globe, '#009ED8', '#e3f4fc')}
            {t.settings.language}
          </h3>
          <p className="mb-4" style={bodyTextStyle}>
            {t.settings.languageDescription}
          </p>
          <div className="flex gap-2">
            {(['en-US', 'pt-BR'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onChangeLanguage(lang)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  language === lang
                    ? isGlitch
                      ? 'bg-[#00ffff] text-[#0a0a0a] border-2 border-[#00ffff]'
                      : isWin98
                      ? 'bg-[#000080] text-white border-2 border-[#000080]'
                      : ''
                    : isGlitch
                    ? 'bg-transparent text-[#00ffff]/60 border border-[#00ffff]/30 hover:border-[#00ffff]/60'
                    : isWin98
                    ? 'win98-button bg-[#c0c0c0] text-black'
                    : ''
                }`}
                style={
                  isGlitch || isWin98
                    ? { fontFamily: 'monospace' }
                    : language === lang
                      ? { background: 'var(--sm-primary)', color: '#fff' }
                      : { background: 'var(--sm-bg)', color: 'var(--sm-muted)' }
                }
                aria-pressed={language === lang}
              >
                <span>{getLanguageFlag(lang)}</span>
                <span>{getLanguageName(lang)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className={cardClass}>
          <h3 className="mb-3" style={headingStyle}>
            {isGlitch || isWin98 ? 'ℹ️ ' : iconWrap(Info, '#8b86a3', '#eef0f3')}
            {t.settings.about}
          </h3>
          <div className="space-y-2">
            <p style={isGlitch || isWin98 ? { fontFamily: 'monospace', fontSize: '0.875rem', color: isGlitch ? 'rgba(0,255,255,0.8)' : '#000' } : { fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
              <strong>Soulmon</strong> v1.0.2
            </p>
            <p style={bodyTextStyle}>
              {t.settings.aboutDescription}
            </p>
            {/* Exigência da Play: a política precisa estar acessível no app. */}
            <a
              href="/privacidade.html"
              target="_blank"
              rel="noopener noreferrer"
              style={isGlitch || isWin98
                ? { fontFamily: 'monospace', fontSize: '0.8rem', textDecoration: 'underline' }
                : { fontSize: '0.8rem', color: 'var(--sm-primary)', fontWeight: 600, textDecoration: 'underline' }}
            >
              {language === 'pt-BR' ? 'Política de Privacidade' : 'Privacy Policy'}
            </a>
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
