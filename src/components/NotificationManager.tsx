import { useEffect, useRef } from 'react';
import { checkAndShowNotifications, showNotification, syncActivityAlarms, syncTaskAlarms } from '../utils/notifications';

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
  language,
  enabled,
  healthPoints,
  maxHealthPoints,
  completedSteps,
  totalRequired,
}: NotificationManagerProps) {
  const lastEveningWarnDate = useRef<string>('');

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
        // Low HP but progressing — gentle reminder
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

  return null;
}
