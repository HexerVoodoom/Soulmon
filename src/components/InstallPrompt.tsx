import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { type Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

const DISMISSED_KEY = STORAGE_KEYS.PWA_INSTALL_DISMISSED;

export function InstallPrompt({ theme = 'default', language = 'en-US' }: InstallPromptProps) {
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

  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  const label = language === 'pt-BR'
    ? '📱 Adicionar à tela inicial'
    : '📱 Add to home screen';
  const installBtn = language === 'pt-BR' ? 'Instalar' : 'Install';
  const dismissBtn = language === 'pt-BR' ? 'Não, obrigado' : 'No thanks';
  const description = language === 'pt-BR'
    ? 'Instale o DigiApp para acesso rápido, funcionamento offline e notificações.'
    : 'Install DigiApp for quick access, offline support and notifications.';

  return (
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
        {label}
      </h3>
      <p
        className={`mb-5 text-xs ${
          isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-500'
        }`}
        style={{ fontFamily: 'monospace' }}
      >
        {description}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            isGlitch
              ? 'bg-[#00ffff] text-[#0a0a0a] hover:bg-[#00ffff]/90 border-2 border-[#00ffff]'
              : isWin98
              ? 'win98-button bg-[#c0c0c0] text-[#000000]'
              : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
          }`}
          style={{ fontFamily: 'monospace', fontWeight: '500' }}
        >
          <Download size={14} />
          {installBtn}
        </button>
        <button
          onClick={handleDismiss}
          className={`py-3 px-4 rounded-xl transition-all text-xs ${
            isGlitch
              ? 'text-[#00ffff]/60 border border-[#00ffff]/30 hover:border-[#00ffff]/60'
              : isWin98
              ? 'win98-button bg-[#c0c0c0] text-[#000000]'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          style={{ fontFamily: 'monospace' }}
        >
          {dismissBtn}
        </button>
      </div>
    </div>
  );
}
