import { useState, type CSSProperties, type ReactNode } from 'react';
import { AISettingsModal, Disclosure, SwitchRow, ActionRow, type AISettings } from './AISettingsModal';
import { Field, Segment, sm2Button, sm2Hint, sm2Text, sm2TitleStyle } from './form/FormKit';
import { Language, useTranslation, getLanguageName } from '../utils/i18n';
import { readFlag, readLocal, writeFlag, writeLocal } from '../utils/safeStorage';
import { AccountSection } from './AccountSection';
import { AccountDataSection } from './AccountDataSection';
import { InstallPrompt } from './InstallPrompt';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { isTelemetryEnabled, setTelemetryEnabled, telemetryConsentCopy } from '../utils/telemetry';
import { useTheme } from '../contexts/ThemeContext';

/**
 * CONFIGURAÇÕES — revamp minimalista.
 *
 * A tela era ONZE cartões empilhados na ordem histórica de implementação, com
 * `lucide-react`, PNG de ícone, `.sm-px-card`, `PixelSwitch`, tokens `--sm-*`
 * e um bloco de código de recuperação que ocupava um terço da rolagem para uma
 * tarefa que quase ninguém faz.
 *
 * Agora são CINCO grupos por intenção do usuário, uma única ação dominante
 * (entrar/sincronizar — o único botão preenchido da página), e o que é
 * avançado (código de recuperação, restauração manual) vive atrás de uma
 * revelação. Toda linha de configuração é alvo de toque inteiro.
 */
interface SettingsPageProps {
  useAI: boolean;
  onToggleAI: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onOpenGuide: () => void;
  /** Glossário (HelpModal). */
  onOpenGlossary: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onRestoreFromCloud: (saveId: string) => Promise<boolean>;
  onLoginWithEmail: (email: string) => Promise<'loaded' | 'created'>;
}

/**
 * O grupo. Uma superfície limpa, canto de 16, sem borda e sem sombra — o
 * espaçamento já separa (régua nº 4). O título é Fredoka; nenhum ícone
 * decorativo ao lado, porque nenhum deles informava nada.
 */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginBottom: 8, paddingLeft: 4 }}>{title}</h2>
      <div
        style={{
          backgroundColor: 'var(--sm2-surface)',
          borderRadius: 16,
          padding: '8px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * ESTATÍSTICAS DE USO — o opt-out real, na tela.
 *
 * `utils/telemetry.ts` já tinha `setTelemetryEnabled` e `telemetryConsentCopy`
 * e nenhum call site: a coleta estava LIGADA e o desligar não existia em lugar
 * nenhum. Mora no grupo "Seus dados" porque é exatamente o mesmo assunto do
 * exportar/apagar — o direito de entrar e sair.
 *
 * O texto não barganha: diz o que sai e o que nunca sai, e não promete
 * benefício nem cobra de quem desliga (`metrica-norte.md` — encoraja, nunca
 * cobra). A copy nasce no módulo, não aqui: um segundo texto divergiria em
 * silêncio da allowlist que ele descreve.
 *
 * O padrão (ligado) NÃO é decidido aqui — `isTelemetryEnabled()` é a única
 * fonte, e trocar o padrão é uma linha lá.
 */
function TelemetrySection({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  const copy = telemetryConsentCopy(isPt ? 'pt-BR' : 'en-US');
  // Lido uma vez: o estado real mora no localStorage, e a tela é o espelho.
  const [enabled, setEnabled] = useState(() => isTelemetryEnabled());

  const list = (items: string[]) => (
    <ul style={{ ...sm2Hint, margin: '4px 0 0', paddingLeft: 18 }}>
      {items.map(item => <li key={item} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  );

  return (
    <div>
      <SwitchRow
        checked={enabled}
        onToggle={() => {
          // Gravar FORA do updater (footgun 6: StrictMode roda 2×).
          const next = !enabled;
          setTelemetryEnabled(next);
          setEnabled(next);
        }}
        label={copy.toggleLabel}
        hint={isPt
          ? 'Contadores de uso do app. Nunca o que você escreveu.'
          : 'Counters about app usage. Never what you wrote.'}
      />
      <Disclosure label={copy.title}>
        <div>
          <p style={{ ...sm2Text, fontWeight: 500 }}>{isPt ? 'O que é enviado' : 'What is sent'}</p>
          {list(copy.sent)}
          <p style={{ ...sm2Text, fontWeight: 500, marginTop: 12 }}>{isPt ? 'O que nunca é enviado' : 'What is never sent'}</p>
          {list(copy.never)}
          <p style={{ ...sm2Hint, marginTop: 12 }}>{copy.footnote}</p>
        </div>
      </Disclosure>
    </div>
  );
}

const radioGroupStyle: CSSProperties = { display: 'flex', gap: 8, marginTop: 8 };

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
  const isPt = language === 'pt-BR';
  const t = useTranslation(language);

  const [showAISettings, setShowAISettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [emailInput, setEmailInput] = useState('');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'loaded' | 'created' | 'err'>('idle');

  // Janela de sono automático: lida e gravada direto no localStorage; o efeito
  // do App pega a mudança no tique de minuto seguinte.
  const [autoSleepEnabled, setAutoSleepEnabled] = useState(() => readFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED));
  const [autoSleepStart, setAutoSleepStart] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_START) || '23:00');
  const [autoSleepEnd, setAutoSleepEnd] = useState(() => readLocal(STORAGE_KEYS.AUTO_SLEEP_END) || '07:00');

  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const savedEmail = readLocal(STORAGE_KEYS.USER_EMAIL);
  const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
  const lastSyncRaw = readLocal(STORAGE_KEYS.LAST_CLOUD_SYNC);
  const lastSyncLabel = lastSyncRaw
    ? new Date(lastSyncRaw).toLocaleString(isPt ? 'pt-BR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleLogin = async () => {
    const email = emailInput.trim();
    if (!isValidEmail(email)) { setLoginStatus('err'); return; }
    setLoginStatus('loading');
    try {
      const result = await onLoginWithEmail(email);
      setLoginStatus(result); // a página recarrega logo em seguida
    } catch {
      setLoginStatus('err');
    }
  };

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

  const loginMessage =
    loginStatus === 'err' ? (isPt ? 'E-mail inválido ou falha ao sincronizar.' : 'Invalid email or sync failed.')
      : loginStatus === 'created' ? (isPt ? 'Conta criada — seu progresso está salvo.' : 'Account created — your progress is saved.')
        : loginStatus === 'loaded' ? (isPt ? 'Progresso carregado!' : 'Progress loaded!')
          : null;

  return (
    <>
      <InstallPrompt language={language} />

      {/* ── SUA CONTA — a única ação dominante da página mora aqui ────────── */}
      <Group title={isPt ? 'Sua conta' : 'Your account'}>
        <p style={sm2Hint}>
          {isPt
            ? 'O mesmo e-mail traz o mesmo progresso em qualquer aparelho.'
            : 'The same email brings the same progress to any device.'}
        </p>
        {savedEmail && (
          <p style={{ ...sm2Text, fontWeight: 500 }}>{savedEmail}</p>
        )}
        <Field
          type="email"
          inputMode="email"
          autoComplete="email"
          value={emailInput}
          onChange={e => { setEmailInput(e.target.value); if (loginStatus === 'err') setLoginStatus('idle'); }}
          placeholder={savedEmail ?? (isPt ? 'seu@email.com' : 'your@email.com')}
          aria-label={isPt ? 'Seu e-mail' : 'Your email'}
        />
        <button
          type="button"
          onClick={handleLogin}
          disabled={!emailInput.trim() || loginStatus === 'loading'}
          style={{ ...sm2Button('primary', !emailInput.trim() || loginStatus === 'loading'), width: '100%' }}
        >
          {loginStatus === 'loading'
            ? (isPt ? 'Sincronizando…' : 'Syncing…')
            : (isPt ? 'Entrar' : 'Sign in')}
        </button>
        {/* Região viva sempre montada — ver AccountSection. */}
        <div aria-live="polite">
          {loginMessage && (
            <p style={{ ...sm2Hint, color: loginStatus === 'err' ? 'var(--sm2-danger-ink)' : 'var(--sm2-primary-ink)' }}>
              {loginMessage}
            </p>
          )}
        </div>

        <AccountSection language={language} />

        {/* AGRUPAR E ESCONDER (régua nº 3): o código de recuperação é a saída
            de emergência de quem não usa e-mail. Antes ocupava um terço da
            rolagem da tela inteira. */}
        <Disclosure label={isPt ? 'Recuperar com um código' : 'Recover with a code'}>
          {saveId && (
            <div>
              <p style={sm2Hint}>{isPt ? 'Seu código' : 'Your code'}</p>
              <p className="sm2-num" style={{ ...sm2Text, wordBreak: 'break-all' }}>{saveId}</p>
              <button type="button" onClick={handleCopy} style={sm2Button('ghost')}>
                {copied ? (isPt ? 'Copiado' : 'Copied') : (isPt ? 'Copiar' : 'Copy')}
              </button>
              {lastSyncLabel && (
                <p className="sm2-num" style={{ ...sm2Hint, marginTop: 8 }}>
                  {isPt ? `Última sincronização: ${lastSyncLabel}` : `Last sync: ${lastSyncLabel}`}
                </p>
              )}
            </div>
          )}
          <div>
            <Field
              type="text"
              value={restoreInput}
              onChange={e => setRestoreInput(e.target.value)}
              placeholder={isPt ? 'cole um código aqui' : 'paste a code here'}
              aria-label={isPt ? 'Código de recuperação' : 'Recovery code'}
            />
            <button
              type="button"
              onClick={handleRestore}
              disabled={!restoreInput.trim() || restoreStatus === 'loading'}
              style={{ ...sm2Button('ghost', !restoreInput.trim() || restoreStatus === 'loading'), marginTop: 8 }}
            >
              {restoreStatus === 'loading'
                ? (isPt ? 'Restaurando…' : 'Restoring…')
                : restoreStatus === 'ok'
                  ? (isPt ? 'Pronto' : 'Done')
                  : (isPt ? 'Restaurar' : 'Restore')}
            </button>
            <div aria-live="polite">
              {restoreStatus === 'err' && (
                <p style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>
                  {isPt ? 'Código não encontrado.' : 'Code not found.'}
                </p>
              )}
            </div>
          </div>
        </Disclosure>
      </Group>

      {/* ── SEUS DADOS — levar embora e apagar. Grupo PRÓPRIO, e não uma
             revelação dentro de "Sua conta": exportar e apagar não são
             ajustes avançados, são o direito de entrar e sair. ─────────── */}
      <Group title={isPt ? 'Seus dados' : 'Your data'}>
        <AccountDataSection language={language} />
        <TelemetrySection language={language} />
      </Group>

      {/* ── O QUE O SOULMON TE MANDA ──────────────────────────────────────── */}
      <Group title={isPt ? 'O que o Soulmon te manda' : 'What Soulmon sends you'}>
        <SwitchRow
          checked={notificationsEnabled}
          onToggle={onToggleNotifications}
          label={t.settings.notifications}
          hint={t.settings.notificationsDescription}
        />
        <SwitchRow
          checked={useAI}
          onToggle={onToggleAI}
          label={isPt ? 'Conversa com IA' : 'AI chat'}
          hint={isPt
            ? 'Desligado, seu Soulmon responde por palavras-chave.'
            : 'Off, it answers from keywords.'}
        />
        <ActionRow
          label={isPt ? 'Personalidade' : 'Personality'}
          onClick={() => setShowAISettings(true)}
        />
      </Group>

      {/* ── APARÊNCIA ─────────────────────────────────────────────────────── */}
      <Group title={isPt ? 'Aparência' : 'Appearance'}>
        <div role="radiogroup" aria-label={isPt ? 'Tema' : 'Theme'} style={radioGroupStyle}>
          {([
            { k: 'light' as const, l: isPt ? 'Claro' : 'Light' },
            { k: 'dark' as const, l: isPt ? 'Escuro' : 'Dark' },
            { k: 'system' as const, l: isPt ? 'Sistema' : 'System' },
          ]).map(o => (
            <Segment key={o.k} selected={themeMode === o.k} onSelect={() => setThemeMode(o.k)} label={o.l} />
          ))}
        </div>
        <div role="radiogroup" aria-label={t.settings.language} style={radioGroupStyle}>
          {(['en-US', 'pt-BR'] as Language[]).map(l => (
            <Segment key={l} selected={language === l} onSelect={() => onChangeLanguage(l)} label={getLanguageName(l)} />
          ))}
        </div>
      </Group>

      {/* ── AJUDA ─────────────────────────────────────────────────────────── */}
      <Group title={isPt ? 'Ajuda' : 'Help'}>
        <ActionRow label={t.settings.openGuide} onClick={onOpenGuide} />
        <ActionRow label={t.settings.openGlossary} onClick={onOpenGlossary} />
        <ActionRow
          label={isPt ? 'Política de privacidade' : 'Privacy policy'}
          href="/privacidade.html"
        />
        <p className="sm2-num" style={sm2Hint}>Soulmon 1.0.2</p>
      </Group>

      {/* ── SEU RITMO — encosta na Janela de Descanso, que o App desenha logo
             abaixo desta página. Os dois falam da mesma coisa. ───────────── */}
      <Group title={isPt ? 'Seu ritmo' : 'Your rhythm'}>
        <SwitchRow
          checked={autoSleepEnabled}
          onToggle={() => {
            // Gravar FORA do updater: no StrictMode o updater roda 2× (footgun 6).
            const next = !autoSleepEnabled;
            writeFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED, next, { silent: true });
            setAutoSleepEnabled(next);
          }}
          label={isPt ? 'Sono automático' : 'Auto sleep'}
          hint={isPt
            ? 'Seu Soulmon dorme e acorda sozinho. Dormindo, não faz cocô.'
            : 'It sleeps and wakes on its own. Asleep, it never poops.'}
        />
        {autoSleepEnabled && (
          <div style={{ display: 'flex', gap: 12 }}>
            {([
              { label: isPt ? 'Dorme' : 'Sleeps', value: autoSleepStart, set: setAutoSleepStart, key: STORAGE_KEYS.AUTO_SLEEP_START },
              { label: isPt ? 'Acorda' : 'Wakes', value: autoSleepEnd, set: setAutoSleepEnd, key: STORAGE_KEYS.AUTO_SLEEP_END },
            ] as const).map(f => (
              <label key={f.key} style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...sm2Hint, display: 'block', marginBottom: 4 }}>{f.label}</span>
                <Field
                  type="time"
                  value={f.value}
                  onChange={e => { f.set(e.target.value); writeLocal(f.key, e.target.value, { silent: true }); }}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </label>
            ))}
          </div>
        )}
      </Group>

      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        currentSettings={aiSettings}
        onSave={(settings) => { onSaveAISettings(settings); setShowAISettings(false); }}
        language={language}
      />
    </>
  );
}
