import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';
import { Language, useTranslation, getLanguageName, getLanguageFlag } from '../utils/i18n';
import { PixelButton, PixelSwitch, PixelTabs } from './pixel/PixelKit';
import { readFlag, readLocal, writeFlag, writeLocal } from '../utils/safeStorage';
import { RowIcon } from './RowIcon';
import iconBook from '../assets/soulmon/icons/icon-book.png';
import iconSleep from '../assets/soulmon/icons/icon-sleep.png';
import iconWake from '../assets/soulmon/icons/icon-wake.png';
import iconBell from '../assets/soulmon/icons/icon-bell.png';
import iconBellOff from '../assets/soulmon/icons/icon-bell-off.png';
import iconGlobe from '../assets/soulmon/icons/icon-globe.png';
import iconCloudRain from '../assets/soulmon/icons/icon-cloud-rain.png';
import iconSpellbook from '../assets/soulmon/icons/icon-spellbook.png';
import iconStar from '../assets/soulmon/icons/icon-star.png';
import { requestNotificationPermission, checkNotificationPermission } from '../utils/notifications';
import { AccountSection } from './AccountSection';
import { InstallPrompt } from './InstallPrompt';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { cloudLoad } from '../utils/cloudSave';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPageProps {
  useAI: boolean;
  onToggleAI: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onOpenGuide: () => void;
  /** Glossário (HelpModal) — ver a nota no botão. */
  onOpenGlossary: () => void;
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
  onChangeLanguage,
  language,
  onOpenGuide,
  onOpenGlossary,
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
  const [autoSleepEnabled, setAutoSleepEnabled] = useState(() => readFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED));
  const [autoSleepStart, setAutoSleepStart] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_START) || '23:00');
  const [autoSleepEnd, setAutoSleepEnd] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_END) || '07:00');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'loaded' | 'created' | 'err'>('idle');
  const savedEmail = readLocal(STORAGE_KEYS.USER_EMAIL);
  const { mode: themeMode, resolvedTheme, setMode: setThemeMode } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
  const t = useTranslation(language);
  const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
  const lastSyncRaw = readLocal(STORAGE_KEYS.LAST_CLOUD_SYNC);
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

  // B8 (rodada 3): esta tela era a ULTIMA com um design system inteiro
  // dentro dela - card branco com sombra Material, campo-capsula, botao
  // cinza, interruptor pill+bolinha, icone line-art da lucide e bandeira em
  // emoji. Os cinco inventarios do T2 reprovavam aqui, sozinha. Nada abaixo
  // e peca nova: `.sm-px-card`, `PixelButton`, `PixelSwitch`, `PixelTabs` e
  // os icones do kit ja existiam desde a rodada 2 - foi a mesma varredura do
  // G4, aplicada na tela que ficou de fora.
  const cardClass = 'sm-px-card p-6';
  const bodyTextStyle: React.CSSProperties = { color: 'var(--sm-muted)', fontSize: '0.8125rem' };

  // Cabecalho de secao: icone do kit + titulo. `Bot` e `Info` (lucide) sairam
  // - o kit tem `icon-spellbook` e `icon-star`, e um traco vetorial de 1,5px
  // ao lado de sprites de 22px era o contraste mais visivel da tela.
  const heading = (icon: string, texto: string) => (
    <h3 className="mb-3 sm-px-section-title">
      <img src={icon} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
      {texto}
    </h3>
  );

  return (
    <>
      <div className="space-y-4">
        {/* PWA Install */}
        <InstallPrompt language={language} />

        {/* Cloud Save */}
        <div className={cardClass}>
          {heading(iconCloudRain, language === 'pt-BR' ? 'Backup na nuvem' : 'Cloud backup')}
          <p className="mb-4" style={bodyTextStyle}>
            {language === 'pt-BR'
              ? 'Entre com seu e-mail para sincronizar o mesmo progresso em qualquer dispositivo (navegador e app).'
              : 'Sign in with your email to sync the same progress across any device (browser and app).'}
          </p>

          {/* Email login — same email = same save everywhere */}
          <div className="mb-5">
            {savedEmail && (
              <p className="mb-1" style={{ color: 'var(--sm-primary)', fontSize: '0.6875rem' }}>
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
              className="sm-px-field mb-2"
              aria-label={language === 'pt-BR' ? 'Seu e-mail' : 'Your email'}
            />
            <PixelButton
              size="lg"
              variant="primary"
              onClick={handleLogin}
              disabled={!emailInput.trim() || loginStatus === 'loading'}
            >
              {loginStatus === 'loading'
                ? (language === 'pt-BR' ? 'Sincronizando...' : 'Syncing...')
                : (language === 'pt-BR' ? 'Entrar / Sincronizar' : 'Sign in / Sync')}
            </PixelButton>
            {loginStatus === 'err' && (
              <p className="text-red-500 text-xs mt-1">
                {language === 'pt-BR' ? 'E-mail inválido ou falha ao sincronizar.' : 'Invalid email or sync failed.'}
              </p>
            )}
            {loginStatus === 'created' && (
              <p className="text-xs mt-1" style={{ color: 'var(--sm-primary)' }}>
                {language === 'pt-BR' ? 'Conta criada — progresso atual salvo neste e-mail.' : 'Account created — current progress saved to this email.'}
              </p>
            )}
            {loginStatus === 'loaded' && (
              <p className="text-xs mt-1" style={{ color: 'var(--sm-primary)' }}>
                {language === 'pt-BR' ? 'Progresso carregado deste e-mail!' : 'Progress loaded from this email!'}
              </p>
            )}
          </div>

          <p className="mb-3 text-xs" style={{ color: 'var(--sm-muted)' }}>
            {language === 'pt-BR'
              ? 'Ou use o código de recuperação manual abaixo.'
              : 'Or use the manual recovery code below.'}
          </p>

          {saveId && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs" style={{ color: 'var(--sm-muted)' }}>
                  {language === 'pt-BR' ? 'Código de recuperação:' : 'Recovery code:'}
                </p>
                {lastSyncLabel && (
                  <p style={{ color: 'var(--sm-muted)', fontSize: '0.625rem' }}>
                    {language === 'pt-BR' ? `sync: ${lastSyncLabel}` : `synced: ${lastSyncLabel}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs px-3 py-2 break-all sm-px-code">
                  {saveId}
                </code>
                {/* Era um par de icones lucide (`Copy`/`Check`) num quadrado
                    de 32px: line-art fora do kit E alvo abaixo dos 44px. Vira
                    botao com PALAVRA - o estado "copiado" passa a existir
                    para quem usa leitor de tela, que era invisivel quando a
                    confirmacao era so um sinal verde. */}
                <span style={{ flexShrink: 0 }}>
                  <PixelButton size="sm" onClick={handleCopy}>
                    {copied
                      ? (language === 'pt-BR' ? 'Copiado' : 'Copied')
                      : (language === 'pt-BR' ? 'Copiar' : 'Copy')}
                  </PixelButton>
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--sm-muted)' }}>
              {language === 'pt-BR' ? 'Restaurar a partir de um código:' : 'Restore from a code:'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={restoreInput}
                onChange={e => setRestoreInput(e.target.value)}
                placeholder={language === 'pt-BR' ? 'cole o código aqui' : 'paste code here'}
                className="sm-px-field"
                aria-label={language === 'pt-BR' ? 'Codigo de recuperacao' : 'Recovery code'}
              />
              {/* O estado era um par de glifos do sistema fazendo o trabalho
                  de uma palavra, e mudos no leitor de tela. */}
              <span style={{ flexShrink: 0 }}>
                <PixelButton
                  size="sm"
                  onClick={handleRestore}
                  disabled={!restoreInput.trim() || restoreStatus === 'loading'}
                >
                  {restoreStatus === 'loading'
                    ? '...'
                    : restoreStatus === 'ok'
                      ? (language === 'pt-BR' ? 'Pronto' : 'Done')
                      : (language === 'pt-BR' ? 'Restaurar' : 'Restore')}
                </PixelButton>
              </span>
            </div>
            {restoreStatus === 'err' && (
              <p className="text-red-500 text-xs">
                {language === 'pt-BR' ? 'Código não encontrado.' : 'Code not found.'}
              </p>
            )}
          </div>
        </div>

        {/* Conta e compras — restaurar compras é exigência da Play */}
        <AccountSection language={language} />

        {/* AI Settings */}
        <div className={cardClass}>
          {heading(iconSpellbook, t.settings.ai)}

          <div className="mb-5">
            {/* Era `<div onClick>` com bolinha branca: pill Material E um
                controle sem papel, sem foco de teclado e sem estado para
                leitor de tela. `PixelSwitch` e `role="switch"` de verdade. */}
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
                {useAI ? t.settings.aiChatEnabled : t.settings.keywordsOnly}
              </span>
              <PixelSwitch checked={useAI} onToggle={onToggleAI} ariaLabel={t.settings.ai} />
            </div>
            <p className="text-xs mt-2" style={bodyTextStyle}>
              {useAI ? t.settings.aiDescriptionEnabled : t.settings.aiDescriptionDisabled}
            </p>
          </div>

          <PixelButton size="lg" variant="primary" onClick={() => setShowAISettings(true)}>
            {t.settings.configureAI}
          </PixelButton>
        </div>

        {/* Guide */}
        <div className={cardClass}>
          {heading(iconBook, t.settings.guide)}

          <p className="mb-5" style={bodyTextStyle}>
            {t.settings.guideDescription}
          </p>

          <PixelButton size="lg" variant="primary" onClick={onOpenGuide}>
            {t.settings.openGuide}
          </PixelButton>

          {/* O glossário (HelpModal) existia no código, com 12 regras de CSS
              próprias, e NENHUM caminho o abria: `showHelpModal` nunca era
              posto em `true`. Era tela morta — e é a que o CLAUDE.md manda
              atualizar a cada mudança de regra. Entra aqui, ao lado do Guia,
              que é o mesmo assunto. */}
          <div style={{ marginTop: 10 }}>
            <PixelButton size="lg" onClick={onOpenGlossary}>
              {t.settings.openGlossary}
            </PixelButton>
          </div>
        </div>

        {/* Notifications */}
        <div className={cardClass}>
          {heading(notificationsEnabled ? iconBell : iconBellOff, t.settings.notifications)}

          <p className="mb-5" style={bodyTextStyle}>
            {t.settings.notificationsDescription}
          </p>

          <div className="flex items-center justify-between gap-3">
            <span style={{ fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
              {notificationsEnabled ? t.settings.notificationsEnabled : t.settings.notificationsDisabled}
            </span>
            <PixelSwitch
              checked={notificationsEnabled}
              onToggle={onToggleNotifications}
              ariaLabel={t.settings.notifications}
            />
          </div>
        </div>

        {/* Auto-sleep schedule */}
        <div className={cardClass}>
          {heading(iconSleep, language === 'pt-BR' ? 'Sono automático' : 'Auto sleep')}
          <p className="mb-5" style={bodyTextStyle}>
            {language === 'pt-BR'
              ? 'O pet dorme e acorda sozinho nesse horário. Dormindo, ele não faz cocô.'
              : 'The pet sleeps and wakes on this schedule. It never poops while asleep.'}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
              {autoSleepEnabled
                ? (language === 'pt-BR' ? 'Ativado' : 'Enabled')
                : (language === 'pt-BR' ? 'Desativado' : 'Disabled')}
            </span>
            <PixelSwitch
              checked={autoSleepEnabled}
              ariaLabel={language === 'pt-BR' ? 'Sono automático' : 'Auto sleep'}
              onToggle={() => {
                // Gravar FORA do updater: no StrictMode o updater roda 2x
                // (footgun 6). Horario do sono e preferencia - silencioso.
                const next = !autoSleepEnabled;
                writeFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED, next, { silent: true });
                setAutoSleepEnabled(next);
              }}
            />
          </div>
          {autoSleepEnabled && (
            <div className="flex items-center gap-3">
              {([
                { label: language === 'pt-BR' ? 'Dormir' : 'Sleep', value: autoSleepStart, set: setAutoSleepStart, key: STORAGE_KEYS.AUTO_SLEEP_START },
                { label: language === 'pt-BR' ? 'Acordar' : 'Wake', value: autoSleepEnd, set: setAutoSleepEnd, key: STORAGE_KEYS.AUTO_SLEEP_END },
              ] as const).map(f => (
                <label key={f.label} className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>
                    {f.label}
                  </span>
                  <input
                    type="time"
                    value={f.value}
                    onChange={e => { f.set(e.target.value); writeLocal(f.key, e.target.value, { silent: true }); }}
                    className="sm-px-field"
                    style={{ width: 116 }}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Appearance — light/dark/system */}
        <div className={cardClass}>
          {heading(isDark ? iconSleep : iconWake, language === 'pt-BR' ? 'Aparência' : 'Appearance')}
          <p className="mb-4" style={bodyTextStyle}>
            {language === 'pt-BR'
              ? 'Tema claro, escuro, ou o mesmo do aparelho.'
              : 'Light theme, dark theme, or match your device.'}
          </p>
          {/* A escolha exclusiva vira `PixelTabs`: a SELECAO CARREGA NO
              PREENCHIMENTO (regra da rodada 2). Antes o nao-selecionado tinha
              fundo `--sm-bg` - solido - e o selecionado tinha `--sm-primary`:
              dois blocos preenchidos disputando na mesma fileira, que e
              exatamente a inversao que o G9 consertou nas outras telas. */}
          <PixelTabs
            ariaLabel={language === 'pt-BR' ? 'Tema' : 'Theme'}
            value={themeMode}
            onChange={setThemeMode}
            items={[
              { key: 'light' as const, label: language === 'pt-BR' ? 'Claro' : 'Light' },
              { key: 'dark' as const, label: language === 'pt-BR' ? 'Escuro' : 'Dark' },
              { key: 'system' as const, label: language === 'pt-BR' ? 'Sistema' : 'System' },
            ]}
          />
        </div>

        {/* Language */}
        <div className={cardClass}>
          {heading(iconGlobe, t.settings.language)}
          <p className="mb-4" style={bodyTextStyle}>
            {t.settings.languageDescription}
          </p>
          {/* A BANDEIRA saiu: sao emoji do sistema (renderizados pela fonte
              do aparelho, fora da paleta e fora do estilo), e bandeira como
              rotulo de idioma e errado de todo jeito - ingles nao e
              propriedade dos EUA. Fica o nome do idioma, que e o dado. */}
          <PixelTabs
            ariaLabel={t.settings.language}
            value={language}
            onChange={onChangeLanguage}
            items={(['en-US', 'pt-BR'] as Language[]).map(lang => ({ key: lang, label: getLanguageName(lang) }))}
          />
        </div>

        {/* App Info */}
        <div className={cardClass}>
          {heading(iconStar, t.settings.about)}
          <div className="space-y-2">
            <p style={{ fontSize: '0.875rem', color: 'var(--sm-ink)' }}>
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
              style={{ fontSize: '0.8rem', color: 'var(--sm-primary)', fontWeight: 600, textDecoration: 'underline' }}
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
      />
    </>
  );
}
