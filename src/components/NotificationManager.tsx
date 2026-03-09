import { useEffect } from 'react';
import { checkAndShowNotifications, syncActivityAlarms, syncTaskAlarms } from '../utils/notifications';

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
}

export function NotificationManager({ 
  activities, 
  tasks, 
  userName, 
  language,
  enabled 
}: NotificationManagerProps) {
  // Sync alarms when activities or tasks change
  useEffect(() => {
    if (!enabled) return;

    syncActivityAlarms(activities, language);
    syncTaskAlarms(tasks, language);
  }, [activities, tasks, language, enabled]);

  // Check notifications every minute
  useEffect(() => {
    if (!enabled) return;

    // Check immediately
    checkAndShowNotifications(userName, language);

    // Then check every minute
    const interval = setInterval(() => {
      checkAndShowNotifications(userName, language);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [userName, language, enabled]);

  return null; // This component doesn't render anything
}
