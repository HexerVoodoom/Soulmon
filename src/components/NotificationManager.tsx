import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { DigiAlarm } from '../plugins/DigiAlarmPlugin';
import {
  checkAndShowNotifications, showNotification, subscribeToPush, syncActivityAlarms, syncTaskAlarms,
  unsubscribeFromPush, registerForPushNotifications, unregisterFromPushNotifications,
} from '../utils/notifications';

interface Activity {
  id: string;
  name: string;
  alarm?: { time: string };
  weekDays?: number[];
}

interface Task {
  id: string;
  name: string;
  alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
  deadline?: { date: string; time: string };
}

interface NotificationManagerProps {
  activities: Activity[];
  tasks: Task[];
  userName: string;
  petName: string;
  language: 'pt-BR' | 'en-US';
  enabled: boolean;
  healthPoints: number;
  maxHealthPoints: number;
  completedSteps: number;
  totalRequired: number;
}

export function NotificationManager({
  activities,
  tasks,
  userName,
  petName,
  language,
  enabled,
  healthPoints,
  maxHealthPoints,
  completedSteps,
  totalRequired,
}: NotificationManagerProps) {
  const lastEveningWarnDate = useRef<string>('');
  const lastNudge10Date = useRef<string>('');
  const lastNudge16Date = useRef<string>('');
  const lastGoodnightDate = useRef<string>('');

  // Push subscription — register/unregister when notifications toggle. Native
  // Android uses FCM (the WebView has no Web Push support); browsers/PWA use
  // Web Push VAPID.
  useEffect(() => {
    const isNativeAndroid = Capacitor.getPlatform() === 'android';

    if (enabled) {
      if (isNativeAndroid) {
        registerForPushNotifications(petName, language, (title, body) => {
          toast(title, { description: body });
        });
      } else {
        subscribeToPush(petName, language);
      }
    } else {
      if (isNativeAndroid) {
        unregisterFromPushNotifications();
      } else {
        unsubscribeFromPush();
      }
    }
  }, [enabled, petName, language]);

  // Sync alarms when activities or tasks change
  useEffect(() => {
    if (!enabled) return;
    syncActivityAlarms(activities, language);
    syncTaskAlarms(tasks, language);
  }, [activities, tasks, language, enabled]);

  // Check notifications every minute
  useEffect(() => {
    if (!enabled) return;

    checkAndShowNotifications(userName, language);

    const interval = setInterval(() => {
      checkAndShowNotifications(userName, language);
    }, 60000);

    return () => clearInterval(interval);
  }, [userName, language, enabled]);

  // Evening HP risk warning — fires once at 20:00 if HP critical and day not complete
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const today = now.toDateString();

      if (hh !== 20 || mm !== 0) return;
      if (lastEveningWarnDate.current === today) return;

      // Antes isto prometia que "metade das tarefas" evitava a perda, o que é
      // falso (a perda zera só acima de 2/3 da meta), e chamava de "perigo" um
      // dia que custa no máximo 1 coração. Avisa sem ameaçar e sem inventar
      // número: quem quiser o detalhe abre o app.
      const atRisk = healthPoints <= 1 && healthPoints > 0 && completedSteps < totalRequired;

      if (atRisk) {
        lastEveningWarnDate.current = today;
        const ispt = language === 'pt-BR';
        showNotification(
          ispt ? `${petName} está meio pra baixo` : `${petName} is a bit low`,
          {
            body: ispt
              ? 'Se der, marque o que você já fez hoje. Se não der, amanhã ele ainda vai estar aqui.'
              : "If you can, log what you did today. If not, it'll still be here tomorrow.",
            tag: 'hp-critical-evening',
          },
        );
      } else if (!atRisk && healthPoints < maxHealthPoints) {
        lastEveningWarnDate.current = today;
        const ispt = language === 'pt-BR';
        showNotification(
          ispt ? '🌙 Fim do dia!' : '🌙 End of day!',
          {
            body: ispt
              ? `Você tem ${completedSteps}/${totalRequired} tarefas. Continue assim!`
              : `You have ${completedSteps}/${totalRequired} tasks done. Keep it up!`,
            tag: 'evening-reminder',
          },
        );
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [enabled, healthPoints, maxHealthPoints, completedSteps, totalRequired, language]);

  // Pet reminder notifications — 10h, 16h, 21h (incomplete tasks) + 22h goodnight
  useEffect(() => {
    if (!enabled) return;

    // Native Android: schedule via AlarmManager so they fire even with app closed
    if (Capacitor.isNativePlatform()) {
      const ispt = language === 'pt-BR';
      const nudgeTitle = ispt ? `${petName} passou pra dizer oi` : `${petName} stopped by to say hi`;
      const nudgeBody = ispt ? 'Tem algo do seu dia que você já fez?' : 'Anything from your day you already did?';

      // O nudge das 21h saiu: a auditoria de carga do plano conclui que nada
      // deve pedir uma quarta visita ao app, e cobrar tarefa na hora de dormir
      // é o oposto de um companheiro.
      if (completedSteps < totalRequired) {
        DigiAlarm.scheduleAlarm({ id: 'pet-nudge-10', title: nudgeTitle, body: nudgeBody, scheduledTime: '10:00' }).catch(() => {});
        DigiAlarm.scheduleAlarm({ id: 'pet-nudge-16', title: nudgeTitle, body: nudgeBody, scheduledTime: '16:00' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-21' }).catch(() => {});
      } else {
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-10' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-16' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-21' }).catch(() => {});
      }

      DigiAlarm.scheduleAlarm({
        id: 'pet-goodnight',
        title: ispt ? `🌙 ${petName} está indo dormir` : `🌙 ${petName} is going to sleep`,
        body: ispt ? 'Boa noite. O que ficou pra trás fica pra amanhã. 😴' : "Good night. What's left can wait for tomorrow. 😴",
        scheduledTime: '22:00',
      }).catch(() => {});
    }

    // Web/PWA: poll every minute and fire when the clock hits the target hour
    const checkPetNotifications = () => {
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const today = now.toDateString();
      const ispt = language === 'pt-BR';

      // Allow a 1-minute grace window so we don't miss if the interval fires at :01
      if (mm > 1) return;

      // 10:00 — incomplete tasks nudge
      if (hh === 10 && completedSteps < totalRequired && lastNudge10Date.current !== today) {
        lastNudge10Date.current = today;
        showNotification(
          ispt ? `${petName} passou pra dizer oi` : `${petName} stopped by to say hi`,
          { body: ispt ? 'Tem algo do seu dia que você já fez?' : 'Anything from your day you already did?', tag: 'pet-nudge-10' },
        );
      }

      // 16:00 — incomplete tasks nudge
      if (hh === 16 && completedSteps < totalRequired && lastNudge16Date.current !== today) {
        lastNudge16Date.current = today;
        showNotification(
          ispt ? `${petName} pensou em você` : `${petName} thought of you`,
          { body: ispt ? 'Se sobrar um minuto hoje, ele adora companhia.' : 'If you get a minute today, it loves the company.', tag: 'pet-nudge-16' },
        );
      }

      // 22:00 — goodnight (always fires regardless of tasks)
      if (hh === 22 && lastGoodnightDate.current !== today) {
        lastGoodnightDate.current = today;
        showNotification(
          ispt ? `🌙 ${petName} está indo dormir` : `🌙 ${petName} is going to sleep`,
          { body: ispt ? 'Boa noite. O que ficou pra trás fica pra amanhã. 😴' : "Good night. What's left can wait for tomorrow. 😴", tag: 'pet-goodnight' },
        );
      }
    };

    checkPetNotifications();
    const interval = setInterval(checkPetNotifications, 60000);
    return () => clearInterval(interval);
  }, [enabled, petName, language, completedSteps, totalRequired]);

  return null;
}
