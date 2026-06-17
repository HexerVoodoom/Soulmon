import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { type Language } from '../utils/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

const DISMISSED_KEY = 'digiapp-pwa-install-dismissed';

export function InstallPrompt({ theme = 'default', language = 'en-US' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
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
    ? '📱 Adicionar DigiApp à tela inicial'
    : '📱 Add DigiApp to home screen';
  const installBtn = language === 'pt-BR' ? 'Instalar' : 'Install';

  const isWin98 = theme === 'win98';

  return (
    <div
      role="banner"
      aria-label={label}
      className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-2 gap-3 shadow-md ${
        isWin98
          ? 'bg-[#c0c0c0] border-b-2 border-white text-black'
          : 'bg-teal-600 text-white'
      }`}
    >
      <span className="text-sm font-medium truncate">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-bold transition-colors ${
            isWin98
              ? 'bg-white border-2 border-gray-400 text-black hover:bg-gray-100 shadow-[inset_1px_1px_0_rgba(255,255,255,0.8)]'
              : 'bg-white text-teal-700 hover:bg-teal-50'
          }`}
          aria-label={installBtn}
        >
          <Download size={14} />
          {installBtn}
        </button>
        <button
          onClick={handleDismiss}
          className={`p-1 rounded transition-colors ${
            isWin98 ? 'hover:bg-gray-300 text-black' : 'text-white/80 hover:text-white'
          }`}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
