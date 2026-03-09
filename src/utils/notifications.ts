// Notification utilities for DigiApp

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export const checkNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return { granted: false, denied: true, prompt: false };
  }

  return {
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
    prompt: Notification.permission === 'default',
  };
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    return new Notification(title, options);
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: string; // HH:mm format
  activityId?: string;
  taskId?: string;
  type: 'alarm' | 'daily';
}

const STORAGE_KEY = 'digiapp-scheduled-notifications';
const DAILY_CHECK_KEY = 'digiapp-daily-notification-check';

export const scheduleNotification = (notification: ScheduledNotification) => {
  const stored = getScheduledNotifications();
  
  // Remove duplicates for the same activity/task
  const filtered = stored.filter(n => {
    if (notification.activityId && n.activityId === notification.activityId) {
      return false;
    }
    if (notification.taskId && n.taskId === notification.taskId) {
      return false;
    }
    if (notification.type === 'daily' && n.type === 'daily') {
      return false;
    }
    return true;
  });
  
  filtered.push(notification);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getScheduledNotifications = (): ScheduledNotification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

export const removeScheduledNotification = (id: string) => {
  const stored = getScheduledNotifications();
  const filtered = stored.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const clearScheduledNotifications = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const checkAndShowNotifications = (
  userName: string = 'Treinador',
  language: 'pt-BR' | 'en-US' = 'pt-BR'
) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toDateString();

  // Check daily notification at 12:00
  const lastDailyCheck = localStorage.getItem(DAILY_CHECK_KEY);
  if (currentTime === '12:00' && lastDailyCheck !== today) {
    const title = language === 'pt-BR' 
      ? '🦖 Seu Digimon está chamando!' 
      : '🦖 Your Digimon is calling!';
    const body = language === 'pt-BR'
      ? `Olá ${userName}! Não se esqueça de checar suas atividades hoje! 💪`
      : `Hi ${userName}! Don't forget to check your activities today! 💪`;

    showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-reminder',
      requireInteraction: false,
    });

    localStorage.setItem(DAILY_CHECK_KEY, today);
  }

  // Check scheduled notifications
  const scheduled = getScheduledNotifications();
  const toShow = scheduled.filter(n => n.scheduledTime === currentTime);

  toShow.forEach(notification => {
    showNotification(notification.title, {
      body: notification.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: false,
    });
  });
};

export const syncActivityAlarms = (
  activities: Array<{
    id: string;
    name: string;
    alarm?: { time: string };
    weekDays?: number[];
  }>,
  language: 'pt-BR' | 'en-US' = 'pt-BR'
) => {
  const today = new Date().getDay();
  
  // Clear old activity alarms
  const stored = getScheduledNotifications();
  const nonActivityAlarms = stored.filter(n => !n.activityId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nonActivityAlarms));

  // Schedule new alarms for today's activities
  activities.forEach(activity => {
    if (activity.alarm?.time) {
      // Check if activity is scheduled for today
      const isToday = !activity.weekDays || activity.weekDays.includes(today);
      
      if (isToday) {
        const title = language === 'pt-BR'
          ? '⏰ Lembrete de Atividade!'
          : '⏰ Activity Reminder!';
        const body = language === 'pt-BR'
          ? `Hora de: ${activity.name}`
          : `Time for: ${activity.name}`;

        scheduleNotification({
          id: `activity-${activity.id}`,
          title,
          body,
          scheduledTime: activity.alarm.time,
          activityId: activity.id,
          type: 'alarm',
        });
      }
    }
  });
};

export const syncTaskAlarms = (
  tasks: Array<{
    id: string;
    name: string;
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
    deadline?: { date: string; time: string };
  }>,
  language: 'pt-BR' | 'en-US' = 'pt-BR'
) => {
  // Clear old task alarms
  const stored = getScheduledNotifications();
  const nonTaskAlarms = stored.filter(n => !n.taskId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nonTaskAlarms));

  // Schedule new alarms for tasks
  tasks.forEach(task => {
    if (task.alarm && task.deadline) {
      let alarmTime = '';

      if (task.alarm.type === 'custom' && task.alarm.time) {
        alarmTime = task.alarm.time;
      } else if (task.deadline.time) {
        const [hours, minutes] = task.deadline.time.split(':').map(Number);
        const deadlineDate = new Date();
        deadlineDate.setHours(hours, minutes, 0, 0);

        const offset = task.alarm.type === '2h' ? 120 : task.alarm.type === '1h' ? 60 : 30;
        const alarmDate = new Date(deadlineDate.getTime() - offset * 60 * 1000);

        alarmTime = `${String(alarmDate.getHours()).padStart(2, '0')}:${String(alarmDate.getMinutes()).padStart(2, '0')}`;
      }

      if (alarmTime) {
        // Check if task deadline is today
        const today = new Date().toISOString().split('T')[0];
        if (task.deadline.date === today) {
          const title = language === 'pt-BR'
            ? '⏰ Lembrete de Tarefa!'
            : '⏰ Task Reminder!';
          const body = language === 'pt-BR'
            ? `Lembrete: ${task.name}`
            : `Reminder: ${task.name}`;

          scheduleNotification({
            id: `task-${task.id}`,
            title,
            body,
            scheduledTime: alarmTime,
            taskId: task.id,
            type: 'alarm',
          });
        }
      }
    }
  });
};
