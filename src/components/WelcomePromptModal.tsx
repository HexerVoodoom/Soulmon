import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readFlag, writeFlag } from '../utils/safeStorage';
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
 * Pergunta, uma vez por item pendente, se o jogador quer (1) instalar a PWA e
 * (2) autorizar notificações. Cada metade some quando deixa de se aplicar
 * (já instalado/app nativo, permissão concedida/negada, ou já dispensado).
 *
 * O comportamento é o mesmo de antes; o que mudou é a forma: sheet de baixo
 * (o polegar chega lá), UMA ação dominante e "Agora não" em voz baixa. Saiu o
 * X próprio — o do `ModalSheet` já dispensa, e dois jeitos de dizer "não"
 * no mesmo canto era um deles a mais.
 */
export function WelcomePromptModal({ language, notificationsEnabled, onEnableNotifications }: WelcomePromptModalProps) {
  const isPt = language === 'pt-BR';
  const isNative = Capacitor.isNativePlatform();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(
    () => readFlag(STORAGE_KEYS.PWA_INSTALL_DISMISSED)
  );
  const [notifDismissed, setNotifDismissed] = useState(
    () => readFlag(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED)
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
    writeFlag(STORAGE_KEYS.PWA_INSTALL_DISMISSED, true, { silent: true });
    advanceFromInstall();
  };

  const handleEnableNotif = async () => {
    await onEnableNotifications();
    setStep(null);
  };

  const handleDismissNotif = () => {
    setNotifDismissed(true);
    writeFlag(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED, true, { silent: true });
    setStep(null);
  };

  const content = step === 'install'
    ? {
        icon: 'download',
        title: isPt ? 'Instalar o Soulmon?' : 'Install Soulmon?',
        desc: isPt
          ? 'Acesso rápido pela tela inicial e funcionamento offline.'
          : 'Quick access from your home screen, and it works offline.',
        primary: isPt ? 'Instalar' : 'Install',
        onPrimary: handleInstall,
        onSecondary: handleDismissInstall,
      }
    : {
        // `schedule` e não um sininho: NÃO existe ícone de sino no subset da
        // fonte (inventário em `src/styles/tokens.md`), e nome fora dele
        // renderiza um `<span>` vazio, sem erro nenhum. Lembrete é hora.
        icon: 'schedule',
        title: isPt ? 'Ativar notificações?' : 'Enable notifications?',
        desc: isPt
          ? 'Lembretes das suas tarefas e recados do seu Soulmon.'
          : 'Reminders for your tasks and messages from your Soulmon.',
        primary: isPt ? 'Ativar' : 'Enable',
        onPrimary: handleEnableNotif,
        onSecondary: handleDismissNotif,
      };

  return (
    <ModalSheet
      open
      onClose={content.onSecondary}
      language={language}
      title={content.title}
      maxWidth={420}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button type="button" onClick={content.onPrimary} style={{ ...sm2Button('primary'), width: '100%' }}>
            {content.primary}
          </button>
          <button type="button" onClick={content.onSecondary} style={{ ...sm2Button('quiet'), width: '100%' }}>
            {isPt ? 'Agora não' : 'Not now'}
          </button>
        </div>
      }
    >
      {/* Ícone pelado, sem placa nem moldura (regra do dono). */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Icon name={content.icon} size={48} tone="primary" />
      </div>
      <p style={{ ...sm2Text, textAlign: 'center', margin: 0 }}>{content.desc}</p>
    </ModalSheet>
  );
}
