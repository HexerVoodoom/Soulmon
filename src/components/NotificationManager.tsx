import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { DigiAlarm } from '../plugins/DigiAlarmPlugin';
import { checkAndShowNotifications, showNotification, subscribeToPush, syncActivityAlarms, syncTaskAlarms, unsubscribeFromPush } from '../utils/notifications';
import { registerFcmToken, unregisterFcmToken } from '../utils/fcm';

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
  digimonName: string;
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
  digimonName,
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
  const lastNudge21Date = useRef<string>('');
  const lastGoodnightDate = useRef<string>('');

  // Web Push (PWA) + FCM (Android native) — register/unregister when notifications toggle
  useEffect(() => {
    if (enabled) {
      subscribeToPush(digimonName, language);
      registerFcmToken(digimonName, language);
    } else {
      unsubscribeFromPush();
      unregisterFcmToken();
    }
  }, [enabled, digimonName, language]);

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

      const halfRequired = Math.ceil(totalRequired / 2);
      const atRisk = healthPoints === 1 && completedSteps < halfRequired;

      if (atRisk) {
        lastEveningWarnDate.current = today;
        const ispt = language === 'pt-BR';
        showNotification(
          ispt ? '⚠️ Seu Digimon está em perigo!' : '⚠️ Your Digimon is in danger!',
          {
            body: ispt
              ? `Complete ao menos ${halfRequired} tarefa(s) hoje ou seu parceiro vai regredir amanhã!`
              : `Complete at least ${halfRequired} task(s) today or your partner will degenerate tomorrow!`,
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
      const nudgeTitle = ispt ? `📋 ${digimonName} está te lembrando!` : `📋 ${digimonName} is reminding you!`;
      const nudgeBody = ispt ? 'Você ainda tem tarefas pendentes hoje! Vamos lá! 💪' : 'You still have pending tasks today! Let\'s go! 💪';

      if (completedSteps < totalRequired) {
        DigiAlarm.scheduleAlarm({ id: 'pet-nudge-10', title: nudgeTitle, body: nudgeBody, scheduledTime: '10:00' }).catch(() => {});
        DigiAlarm.scheduleAlarm({ id: 'pet-nudge-16', title: nudgeTitle, body: nudgeBody, scheduledTime: '16:00' }).catch(() => {});
        DigiAlarm.scheduleAlarm({ id: 'pet-nudge-21', title: nudgeTitle, body: nudgeBody, scheduledTime: '21:00' }).catch(() => {});
      } else {
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-10' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-16' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-21' }).catch(() => {});
      }

      DigiAlarm.scheduleAlarm({
        id: 'pet-goodnight',
        title: `🌙 ${digimonName} está desejando boa noite`,
        body: ispt ? 'Durma bem! Até amanhã! 😴' : 'Sleep well! See you tomorrow! 😴',
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
          ispt ? `📋 ${digimonName} está te lembrando!` : `📋 ${digimonName} is reminding you!`,
          { body: ispt ? 'Você ainda tem tarefas pendentes hoje! Vamos lá! 💪' : 'You still have pending tasks today! Let\'s go! 💪', tag: 'pet-nudge-10' },
        );
      }

      // 16:00 — incomplete tasks nudge
      if (hh === 16 && completedSteps < totalRequired && lastNudge16Date.current !== today) {
        lastNudge16Date.current = today;
        showNotification(
          ispt ? `📋 ${digimonName} está te lembrando!` : `📋 ${digimonName} is reminding you!`,
          { body: ispt ? 'Suas tarefas ainda estão esperando! 🎯' : 'Your tasks are still waiting! 🎯', tag: 'pet-nudge-16' },
        );
      }

      // 21:00 — incomplete tasks nudge (more urgent)
      if (hh === 21 && completedSteps < totalRequired && lastNudge21Date.current !== today) {
        lastNudge21Date.current = today;
        showNotification(
          ispt ? `⏰ ${digimonName} está preocupado!` : `⏰ ${digimonName} is worried!`,
          { body: ispt ? 'Ainda dá tempo! Complete suas tarefas antes de dormir. 🌙' : 'Still time! Complete your tasks before bed. 🌙', tag: 'pet-nudge-21' },
        );
      }

      // 22:00 — goodnight (always fires regardless of tasks)
      if (hh === 22 && lastGoodnightDate.current !== today) {
        lastGoodnightDate.current = today;
        showNotification(
          `🌙 ${digimonName} está desejando boa noite`,
          { body: ispt ? 'Durma bem! Até amanhã! 😴' : 'Sleep well! See you tomorrow! 😴', tag: 'pet-goodnight' },
        );
      }
    };

    checkPetNotifications();
    const interval = setInterval(checkPetNotifications, 60000);
    return () => clearInterval(interval);
  }, [enabled, digimonName, language, completedSteps, totalRequired]);

  return null;
}
