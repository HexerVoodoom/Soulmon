// Notification utilities for DigiApp
import { Capacitor } from '@capacitor/core';
import { DigiAlarm } from '../plugins/DigiAlarmPlugin';
import { VAPID_PUBLIC_KEY } from './vapid';

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export const checkNotificationPermission = (): NotificationPermissionState => {
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
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
};

// Show a notification — prefers SW showNotification (works in background),
// falls back to new Notification() when SW is not yet active.
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const opts: NotificationOptions = {
    icon: '/favicon-192x192.png',
    badge: '/favicon-192x192.png',
    requireInteraction: false,
    ...options,
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('/').then((registration) => {
      if (registration) {
        registration.showNotification(title, opts);
      } else {
        new Notification(title, opts);
      }
    }).catch(() => {
      new Notification(title, opts);
    });
  } else {
    try {
      new Notification(title, opts);
    } catch { /* ignore */ }
  }
};

// ── Scheduled notification storage ────────────────────────────────────────

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: string; // HH:mm format
  activityId?: string;
  taskId?: string;
  type: 'alarm' | 'daily';
}

import { STORAGE_KEYS } from './storageKeys';

const STORAGE_KEY = STORAGE_KEYS.SCHEDULED_NOTIFICATIONS;
const DAILY_CHECK_KEY = STORAGE_KEYS.DAILY_NOTIFICATION_CHECK;

export const getScheduledNotifications = (): ScheduledNotification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const scheduleNotification = (notification: ScheduledNotification) => {
  const stored = getScheduledNotifications();
  const filtered = stored.filter(n => {
    if (notification.activityId && n.activityId === notification.activityId) return false;
    if (notification.taskId && n.taskId === notification.taskId) return false;
    if (notification.type === 'daily' && n.type === 'daily') return false;
    return true;
  });
  filtered.push(notification);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const removeScheduledNotification = (id: string) => {
  const stored = getScheduledNotifications();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.filter(n => n.id !== id)));
  if (Capacitor.isNativePlatform()) {
    DigiAlarm.cancelAlarm({ id }).catch(() => {});
  }
};

export const clearScheduledNotifications = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ── Web Push subscription (PWA / browser) ─────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const pad = base64String.length % 4;
  const base64 = base64String.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad ? 4 - pad : 0);
  const raw = atob(base64);
  // Build over an explicit ArrayBuffer so the type is Uint8Array<ArrayBuffer>
  // (assignable to BufferSource — the bare constructor infers ArrayBufferLike).
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export const subscribeToPush = async (
  digimonName: string,
  language: 'pt-BR' | 'en-US'
): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const body = {
      ...sub.toJSON(),
      digimonName,
      language,
    };

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (err) {
    console.error('Push subscribe error:', err);
    return false;
  }
};

export const unsubscribeFromPush = async (): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await fetch('/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
  } catch (err) {
    console.error('Push unsubscribe error:', err);
  }
};

// ── Check & fire due notifications ────────────────────────────────────────

export const checkAndShowNotifications = (
  userName = 'Trainer',
  language: 'pt-BR' | 'en-US' = 'en-US'
) => {
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toDateString();

  // Daily 12:00 reminder — fires once per day
  const lastDailyCheck = localStorage.getItem(DAILY_CHECK_KEY);
  if (currentTime === '12:00' && lastDailyCheck !== today) {
    const title = language === 'pt-BR'
      ? '🦖 Seu Digimon está chamando!'
      : '🦖 Your Digimon is calling!';
    const body = language === 'pt-BR'
      ? `Olá ${userName}! Não se esqueça de checar suas atividades hoje! 💪`
      : `Hi ${userName}! Don't forget to check your activities today! 💪`;

    showNotification(title, { body, tag: 'daily-reminder' });
    localStorage.setItem(DAILY_CHECK_KEY, today);
  }

  // Alarm notifications scheduled for this exact minute (web/PWA path)
  // On native Android, AlarmManager handles this — no polling needed.
  if (!Capacitor.isNativePlatform()) {
    const scheduled = getScheduledNotifications();
    scheduled
      .filter(n => n.scheduledTime === currentTime)
      .forEach(n => {
        showNotification(n.title, { body: n.body, tag: n.id });
      });
  }
};

// ── Sync alarms from activities/tasks → scheduled notifications ───────────

export const syncActivityAlarms = (
  activities: Array<{
    id: string;
    name: string;
    alarm?: { time: string };
    weekDays?: number[];
  }>,
  language: 'pt-BR' | 'en-US' = 'en-US'
) => {
  const todayWeekDay = new Date().getDay();
  const isNative = Capacitor.isNativePlatform();

  // Replace old activity alarms with fresh set
  const stored = getScheduledNotifications();
  const nonActivity = stored.filter(n => !n.activityId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nonActivity));

  activities.forEach(activity => {
    if (!activity.alarm?.time) return;
    const isToday = !activity.weekDays || activity.weekDays.includes(todayWeekDay);
    if (!isToday) return;

    const id = `activity-${activity.id}`;
    const title = language === 'pt-BR' ? '⏰ Lembrete de Atividade!' : '⏰ Activity Reminder!';
    const body = language === 'pt-BR' ? `Hora de: ${activity.name}` : `Time for: ${activity.name}`;

    scheduleNotification({ id, title, body, scheduledTime: activity.alarm.time, activityId: activity.id, type: 'alarm' });

    if (isNative) {
      DigiAlarm.scheduleAlarm({ id, title, body, scheduledTime: activity.alarm.time }).catch(() => {});
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
  language: 'pt-BR' | 'en-US' = 'en-US'
) => {
  const todayISO = new Date().toISOString().split('T')[0];
  const isNative = Capacitor.isNativePlatform();

  // Replace old task alarms with fresh set
  const stored = getScheduledNotifications();
  const nonTask = stored.filter(n => !n.taskId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nonTask));

  tasks.forEach(task => {
    if (!task.alarm || !task.deadline) return;
    if (task.deadline.date !== todayISO) return;

    let alarmTime = '';
    if (task.alarm.type === 'custom' && task.alarm.time) {
      alarmTime = task.alarm.time;
    } else if (task.deadline.time) {
      const [h, m] = task.deadline.time.split(':').map(Number);
      const offsetMin = task.alarm.type === '2h' ? 120 : task.alarm.type === '1h' ? 60 : 30;
      const totalMin = h * 60 + m - offsetMin;
      if (totalMin >= 0) {
        alarmTime = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
      }
    }

    if (!alarmTime) return;

    const id = `task-${task.id}`;
    const title = language === 'pt-BR' ? '⏰ Lembrete de Tarefa!' : '⏰ Task Reminder!';
    const body = language === 'pt-BR' ? `Lembrete: ${task.name}` : `Reminder: ${task.name}`;

    scheduleNotification({ id, title, body, scheduledTime: alarmTime, taskId: task.id, type: 'alarm' });

    if (isNative) {
      DigiAlarm.scheduleAlarm({ id, title, body, scheduledTime: alarmTime }).catch(() => {});
    }
  });
};
