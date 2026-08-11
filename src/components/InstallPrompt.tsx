import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { type Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  language?: Language;
}

const DISMISSED_KEY = STORAGE_KEYS.PWA_INSTALL_DISMISSED;

export function InstallPrompt({ language = 'en-US' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
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
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const label = language === 'pt-BR'
    ? '📱 Adicionar à tela inicial'
    : '📱 Add to home screen';
  const installBtn = language === 'pt-BR' ? 'Instalar' : 'Install';
  const dismissBtn = language === 'pt-BR' ? 'Não, obrigado' : 'No thanks';
  const description = language === 'pt-BR'
    ? 'Instale o Soulmon para acesso rápido, funcionamento offline e notificações.'
    : 'Install Soulmon for quick access, offline support and notifications.';

  return (
    <div className="p-6 rounded-2xl sm-card">
      <h3
        className="mb-3"
        style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sm-ink)' }}
      >
        {label}
      </h3>
      <p
        className="mb-5 text-xs"
        style={{ fontFamily: 'monospace', color: 'var(--sm-muted)' }}
      >
        {description}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="sm-btn flex-1 flex items-center justify-center gap-2"
          style={{ fontFamily: 'monospace', fontWeight: '500' }}
        >
          <Download size={14} />
          {installBtn}
        </button>
        <button
          onClick={handleDismiss}
          className="py-3 px-4 rounded-xl transition-all text-xs"
          style={{ fontFamily: 'monospace', background: 'var(--sm-bg)', color: 'var(--sm-muted)' }}
        >
          {dismissBtn}
        </button>
      </div>
    </div>
  );
}
