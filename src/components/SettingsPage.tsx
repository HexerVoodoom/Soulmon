import { useState } from 'react';
import { AISettingsModal, type AISettings } from './AISettingsModal';
import {
  ActionRow, Disclosure, Field, GroupCard, Segment, SwitchRow, TimeField, sm2Button, sm2Hint, sm2Text,
} from './form/FormKit';
import { Icon } from './ui/Icon';
import { Language, useTranslation, getLanguageName } from '../utils/i18n';
import { readFlag, readLocal, writeFlag, writeLocal } from '../utils/safeStorage';
import { AccountSection } from './AccountSection';
import { AccountDataSection } from './AccountDataSection';
import { InstallPrompt } from './InstallPrompt';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { isTelemetryEnabled, setTelemetryEnabled, telemetryConsentCopy } from '../utils/telemetry';
import { useTheme } from '../contexts/ThemeContext';
import { desligarTrilha, ligarTrilha, trilhaPreferida } from '../utils/trilha';
import { APP_VERSION, FeedbackRow } from './FeedbackLink';

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
  /** Mudo global (S-som). Sem estes dois, o jogador não alcança o mudo — esta
   *  página é o ÚNICO caminho. ⚰️ 21/09/2026: o `SettingsModal` ("Ajustes
   *  rápidos"), duplicata destas chaves, foi apagado (decisão do dono #37). */
  soundMuted?: boolean;
  onToggleSound?: () => void;
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
  /** WP4.19 — o pet já caiu e voltou? A linha da marca só existe para quem
   *  tem a volta; para os outros ela seria um ajuste sobre nada. */
  redeemed?: boolean;
  showRedeemed?: boolean;
  onToggleShowRedeemed?: () => void;
}

/**
 * O grupo por intenção é o `GroupCard` do `FormKit` (canvas Conta D-K1: card
 * SIS-03 com o título Fredoka 20). A `RestWindowCard` e o `StepsCard`, que o
 * App monta logo abaixo desta página, desenham o MESMO card — por isso ele
 * saiu daqui.
 */
const Group = GroupCard;

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

export function SettingsPage({
  soundMuted = false,
  onToggleSound,
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
  redeemed = false,
  showRedeemed = false,
  onToggleShowRedeemed,
  onRestoreFromCloud,
  onLoginWithEmail,
}: SettingsPageProps) {
  const [trilha, setTrilha] = useState(() => trilhaPreferida());
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
        {/* Região viva sempre montada (18px de piso) — ver AccountSection.
            A resposta boa em `ink` 500; a falha em `muted` 12, nunca vermelho
            (D-K7: a falha do sync não é erro da pessoa). */}
        <p aria-live="polite" className={loginMessage && loginStatus !== 'err' ? 'sm2-conta-live is-ok' : 'sm2-conta-live'}>
          {loginMessage}
        </p>

        <AccountSection language={language} />

        {/* AGRUPAR E ESCONDER (régua nº 3): o código de recuperação é a saída
            de emergência de quem não usa e-mail. Antes ocupava um terço da
            rolagem da tela inteira. */}
        <Disclosure label={isPt ? 'Recuperar com um código' : 'Recover with a code'}>
          {saveId && (
            <div>
              {/* O código em mono sobre `surface-2` + "Copy"/"Copied" num alvo
                  44 com `check` FILL `primary-ink` (achado 5: era 32). */}
              <div className="sm2-conta-code">
                <span style={sm2Hint}>{isPt ? 'Seu código' : 'Your code'}</span>
                <span className="sm2-conta-cd" title={saveId}>{saveId}</span>
                <button type="button" onClick={handleCopy} className="sm2-conta-copy" aria-live="polite">
                  {copied && <Icon name="check" size={24} fill={1} tone="inherit" />}
                  {copied ? (isPt ? 'Copiado' : 'Copied') : (isPt ? 'Copiar' : 'Copy')}
                </button>
              </div>
              {lastSyncLabel && (
                <p className="sm2-num" style={{ ...sm2Hint, marginTop: 4 }}>
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
              style={{ ...sm2Button('outline', !restoreInput.trim() || restoreStatus === 'loading'), marginTop: 8, width: '100%' }}
            >
              {restoreStatus === 'loading'
                ? (isPt ? 'Restaurando…' : 'Restoring…')
                : restoreStatus === 'ok'
                  ? (isPt ? 'Pronto' : 'Done')
                  : (isPt ? 'Restaurar' : 'Restore')}
            </button>
            <p aria-live="polite" className="sm2-conta-live">
              {restoreStatus === 'err' && (isPt ? 'Código não encontrado.' : 'Code not found.')}
            </p>
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

      {/* ── A MARCA DA VOLTA (WP4.19) ───────────────────────────────────────
             Só aparece para quem TEM a volta. E vem desligada: quem caiu e
             subiu de novo decide se quer contar isso — o app não conta por
             ninguém. Nada aqui é marca de QUEDA: não existe tela dizendo
             "este bicho já caiu", e desligar não apaga nada do save. */}
      {redeemed && onToggleShowRedeemed && (
        <Group title={isPt ? 'Sua história' : 'Your story'}>
          <SwitchRow
            checked={showRedeemed}
            onToggle={onToggleShowRedeemed}
            label={isPt ? 'Mostrar a marca da volta' : 'Show the comeback mark'}
            hint={isPt
              ? 'Seu Soulmon já se recuperou por inteiro. Mostrar isso é escolha sua.'
              : 'Your Soulmon has fully recovered before. Showing it is up to you.'}
          />
        </Group>
      )}

      {/* ── SOM ─────────────────────────────────────────────────────────────
             D11: som só por gesto; o app funciona 100 % mudo. A trilha tem chave
             PRÓPRIA (S2/S13): nasce desligada e este toque É o gesto que a liga. */}
      {onToggleSound && (
        <Group title={isPt ? 'Som' : 'Sound'}>
          <SwitchRow
            checked={!soundMuted}
            onToggle={onToggleSound}
            label={isPt ? 'Sons' : 'Sound effects'}
            hint={isPt
              ? 'Confirmam o que você fez. Nunca tocam sozinhos.'
              : 'They confirm what you did. Never play on their own.'}
          />
          <SwitchRow
            checked={trilha}
            onToggle={() => {
              if (trilha) desligarTrilha(); else ligarTrilha();
              setTrilha(!trilha);
            }}
            label={isPt ? 'Trilha' : 'Music'}
            hint={soundMuted
              ? (isPt ? 'Com os sons desligados, a trilha fica em silêncio.' : 'With sound off, music stays silent.')
              : (isPt ? 'Duas camadas calmas, em loop. Para sozinha quando o app sai de vista.' : 'Two calm looping layers. Stops by itself when the app is out of view.')}
          />
        </Group>
      )}

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
        {/* Segmentos TONAIS (D-K2): o ativo em `primary-soft` + `primary-ink` +
            borda; nunca placa cheia — "onde estou" não é ação. O rótulo 12
            `muted` à esquerda é o nome do radiogroup, visível. */}
        <div className="sm2-conta-rg">
          <span className="sm2-conta-rg-lb" id="sm-conta-theme-lb">{isPt ? 'Tema' : 'Theme'}</span>
          <div role="radiogroup" aria-labelledby="sm-conta-theme-lb" className="sm2-conta-rg-seg">
            {([
              { k: 'light' as const, l: isPt ? 'Claro' : 'Light' },
              { k: 'dark' as const, l: isPt ? 'Escuro' : 'Dark' },
              { k: 'system' as const, l: isPt ? 'Sistema' : 'System' },
            ]).map(o => (
              <Segment key={o.k} tonal selected={themeMode === o.k} onSelect={() => setThemeMode(o.k)} label={o.l} />
            ))}
          </div>
        </div>
        <div className="sm2-conta-rg">
          <span className="sm2-conta-rg-lb" id="sm-conta-lang-lb">{t.settings.language}</span>
          <div role="radiogroup" aria-labelledby="sm-conta-lang-lb" className="sm2-conta-rg-seg">
            {(['en-US', 'pt-BR'] as Language[]).map(l => (
              <Segment key={l} tonal selected={language === l} onSelect={() => onChangeLanguage(l)} label={getLanguageName(l)} />
            ))}
          </div>
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
        {/* O canal de feedback fica em Ajuda, logo acima da versão que vai no
            e-mail: é onde a pessoa procura quando algo não funciona
            (design-critic B3, 21/09/2026; `FeedbackLink.tsx`). */}
        <FeedbackRow language={language} saveId={saveId} />
        <p className="sm2-num" style={{ ...sm2Hint, minHeight: 24, display: 'flex', alignItems: 'center' }}>Soulmon {APP_VERSION}</p>
      </Group>

      {/* ── SOBRE — os três limites da §16 da bíblia (`docs/NARRATIVA-E-UNIVERSO.md`),
             em voz de PRODUTO. É a exceção declarada ao registro diegético
             (L10): enquanto este grupo não existia, a ficção era a única
             descrição disponível do que acontece com a pessoa. Sóbrio, sem
             metáfora, sem "a Malha" — fora do visor, nada de kit pixel. ──── */}
      <Group title={isPt ? 'Sobre' : 'About'}>
        <p style={sm2Text}>
          {isPt
            ? 'O Soulmon é um app de hábitos com um bichinho virtual. Ele não avalia, não diagnostica, não trata e não substitui acompanhamento de saúde.'
            : 'Soulmon is a habit app with a virtual pet. It does not assess, diagnose or treat anything, and it is not a substitute for health care.'}
        </p>
        <p style={sm2Text}>
          {isPt
            ? 'O questionário de personalidade não é um teste validado, e o mapa astral não prevê nada: os dois servem para gerar sua criatura.'
            : 'The personality questionnaire is not a validated test, and the birth chart predicts nothing: both exist to generate your creature.'}
        </p>
        <p style={sm2Text}>
          {isPt
            ? 'O Soulmon não sabe nada sobre a sua vida além do que você escreveu nele.'
            : 'Soulmon knows nothing about your life beyond what you typed into it.'}
        </p>
        {/* §16.3 da bíblia é um dos três limites, não uma nota de rodapé:
            mesmo peso tipográfico dos outros dois (design-critic C2). */}
        <p style={sm2Text}>
          {isPt
            ? 'Nada do que aparece aqui é uma afirmação sobre a sua saúde, a sua mente ou o seu futuro.'
            : 'Nothing shown here is a statement about your health, your mind or your future.'}
        </p>
        {/* IA DECLARADA (decisão #22 do QA geral, 21/09/2026): a imagem da
            criatura e as falas do chat são geradas por modelo, e a pessoa tem
            o direito de saber sem procurar na política. Tom de FATO, não de
            alerta (L11 da bíblia): não é um risco a avisar, é como o app
            funciona. Os nomes dos provedores ficam aqui porque a ficha da loja
            e a política já os dizem — divergir seria pior que repetir. */}
        <p style={sm2Text}>
          {isPt
            ? 'A imagem da sua criatura, as falas do chat e alguns sons (evolução, regressão e conclusão de tarefa) são gerados por IA (Higgsfield e Gemini para a imagem, Groq para a conversa), sem revisão humana. O chat não é um serviço de emergência.'
            : 'Your creature’s image, the chat lines and some sounds (evolution, regression and task completion) are AI-generated (Higgsfield and Gemini for the image, Groq for the conversation), with no human review. The chat is not an emergency service.'}
        </p>
        <ActionRow
          label={isPt ? 'O que o chat recebe' : 'What the chat receives'}
          hint={isPt ? 'Na política de privacidade.' : 'In the privacy policy.'}
          href={isPt ? '/privacidade.html#chat-contexto' : '/privacidade.html#chat-context'}
        />
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
          /* As horas em `.inp` 44 com `schedule` 20 + mono `tabular-nums`
             (D-K3). O nome do campo vai no `aria-label`, como no canvas. */
          <div className="sm2-conta-times">
            {([
              { label: isPt ? 'Dorme' : 'Sleeps', value: autoSleepStart, set: setAutoSleepStart, key: STORAGE_KEYS.AUTO_SLEEP_START },
              { label: isPt ? 'Acorda' : 'Wakes', value: autoSleepEnd, set: setAutoSleepEnd, key: STORAGE_KEYS.AUTO_SLEEP_END },
            ] as const).map(f => (
              <TimeField
                key={f.key}
                ariaLabel={f.label}
                value={f.value}
                onChange={v => { f.set(v); writeLocal(f.key, v, { silent: true }); }}
              />
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
