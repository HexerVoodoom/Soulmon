import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, Bell } from 'lucide-react';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import type { Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { checkNotificationPermission } from '../utils/notifications';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WelcomePromptModalProps {
  language: Language;
  notificationsEnabled: boolean;
  onEnableNotifications: () => void | Promise<void>;
}

/**
 * Asks, once per pending item, whether the player wants to (1) install the
 * PWA and (2) authorize notifications — shown right after the app opens
 * (post-intro, post-onboarding). Each half is skipped once it no longer
 * applies (already installed/native app, permission already granted/denied,
 * or the player dismissed it before — tracked in localStorage).
 */
export function WelcomePromptModal({ language, notificationsEnabled, onEnableNotifications }: WelcomePromptModalProps) {
  const isPt = language === 'pt-BR';
  const isNative = Capacitor.isNativePlatform();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED) === 'true'
  );
  const [notifDismissed, setNotifDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED) === 'true'
  );
  const [step, setStep] = useState<'install' | 'notif' | null>(null);

  useEffect(() => {
    if (isNative) return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    const installedHandler = () => setInstalled(true);
    window.addEventListener('appinstalled', installedHandler);
    // Give the browser a moment to fire beforeinstallprompt before deciding.
    const t = setTimeout(() => setReady(true), 800);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      clearTimeout(t);
    };
  }, [isNative]);

  const notifPermission = checkNotificationPermission();
  const notifPromptable = !notificationsEnabled && !notifPermission.denied;

  useEffect(() => {
    if (step) return;
    if (!isNative && !ready) return;
    if (!isNative && deferredPrompt && !installed && !installDismissed) { setStep('install'); return; }
    if (notifPromptable && !notifDismissed) { setStep('notif'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, deferredPrompt, installed, installDismissed, notifPromptable, notifDismissed, step, isNative]);

  if (!step) return null;

  const advanceFromInstall = () => {
    if (notifPromptable && !notifDismissed) setStep('notif');
    else setStep(null);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) { advanceFromInstall(); return; }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    advanceFromInstall();
  };

  const handleDismissInstall = () => {
    setInstallDismissed(true);
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED, 'true');
    advanceFromInstall();
  };

  const handleEnableNotif = async () => {
    await onEnableNotifications();
    setStep(null);
  };

  const handleDismissNotif = () => {
    setNotifDismissed(true);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED, 'true');
    setStep(null);
  };

  const content = step === 'install'
    ? {
        Icon: Download,
        iconColor: '#22A900', iconBg: '#eafbe6',
        title: isPt ? 'Instalar o Soulmon?' : 'Install Soulmon?',
        desc: isPt
          ? 'Adicione à tela inicial para acesso rápido e uso offline.'
          : 'Add it to your home screen for quick access and offline use.',
        primary: isPt ? 'Instalar' : 'Install',
        secondary: isPt ? 'Agora não' : 'Not now',
        onPrimary: handleInstall,
        onSecondary: handleDismissInstall,
      }
    : {
        Icon: Bell,
        iconColor: '#e0483e', iconBg: '#fde8e6',
        title: isPt ? 'Ativar notificações?' : 'Enable notifications?',
        desc: isPt
          ? 'Receba lembretes de tarefas e avisos do seu Soulmon.'
          : "Get task reminders and updates from your Soulmon.",
        primary: isPt ? 'Ativar' : 'Enable',
        secondary: isPt ? 'Agora não' : 'Not now',
        onPrimary: handleEnableNotif,
        onSecondary: handleDismissNotif,
      };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(42,36,64,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="sm-card" style={{ width: '100%', maxWidth: 320, padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative', padding: '24px 20px 16px', textAlign: 'center' }}>
          <button
            onClick={content.onSecondary}
            aria-label={isPt ? 'Fechar' : 'Close'}
            /* 44x44 de area de toque (WCAG 2.2 AA 2.5.8) com o circulo de 30px
               desenhado dentro; top/right recuados em 7px para o circulo ficar
               exatamente onde estava. Fechar um modal e a saida de emergencia
               da UI — e o pior lugar para um alvo pequeno. */
            style={{ position: 'absolute', top: 5, right: 5, width: 44, height: 44, padding: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--sm-bg)', color: 'var(--sm-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={iconClose} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </span>
          </button>
          <div style={{ width: 56, height: 56, margin: '0 auto 10px', borderRadius: 18, background: content.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <content.Icon size={28} color={content.iconColor} strokeWidth={2} />
          </div>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sm-ink)', margin: '0 0 6px' }}>{content.title}</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--sm-muted)', margin: 0, lineHeight: 1.4 }}>{content.desc}</p>
        </div>
        <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={content.onPrimary} className="sm-btn" style={{ width: '100%' }}>
            {content.primary}
          </button>
          <button
            onClick={content.onSecondary}
            style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--sm-muted)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {content.secondary}
          </button>
        </div>
      </div>
    </div>
  );
}
