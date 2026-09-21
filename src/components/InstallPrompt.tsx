import { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint } from './form/FormKit';
import { type Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readFlag, writeFlag } from '../utils/safeStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  language?: Language;
}

const DISMISSED_KEY = STORAGE_KEYS.PWA_INSTALL_DISMISSED;

/**
 * Cartão de instalação da PWA dentro das Configurações. Não é modal: nasce
 * numa lista de opções e não interrompe nada — por isso continua card, e não
 * `ModalSheet`.
 */
export function InstallPrompt({ language = 'en-US' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => readFlag(DISMISSED_KEY)
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (!deferredPrompt || dismissed || installed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Dispensar banner: reaparecer é o pior caso. Cosmético.
    writeFlag(DISMISSED_KEY, true, { silent: true });
  };

  const isPt = language === 'pt-BR';

  return (
    /* Canvas Conta (`Main.dc.html`, CONTA-06): card SIS-03 com `download` 24
       pelado em `primary-ink` + título 14/500; "Install" `primary` 48 e
       "Not now" `outline` — a recusa é saída, nunca `quiet`. */
    <section className="sm2-conta-card">
      <h3 className="sm2-conta-t" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
        <Icon name="download" size={24} tone="primary" />
        {isPt ? 'Instalar o Soulmon' : 'Install Soulmon'}
      </h3>
      <p style={sm2Hint}>
        {isPt
          ? 'Acesso rápido pela tela inicial e funcionamento offline.'
          : 'Quick access from your home screen, and it works offline.'}
      </p>
      <button type="button" onClick={handleInstall} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Instalar' : 'Install'}
      </button>
      <button type="button" onClick={handleDismiss} style={{ ...sm2Button('outline'), width: '100%' }}>
        {isPt ? 'Agora não' : 'Not now'}
      </button>
    </section>
  );
}
