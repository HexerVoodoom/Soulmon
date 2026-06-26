import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const FCM_TOKEN_KEY = 'digiapp_fcm_token';

export async function registerFcmToken(digimonName: string, language: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;

    await PushNotifications.register();

    await PushNotifications.addListener('registration', async (token) => {
      const fcmToken = token.value;
      localStorage.setItem(FCM_TOKEN_KEY, fcmToken);

      try {
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken, digimonName, language }),
        });
      } catch { /* silent — will retry on next app open */ }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('FCM registration error:', err);
    });
  } catch (err) {
    console.error('FCM setup error:', err);
  }
}

export async function unregisterFcmToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const fcmToken = localStorage.getItem(FCM_TOKEN_KEY);
  if (!fcmToken) return;

  try {
    await fetch('/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken }),
    });
    localStorage.removeItem(FCM_TOKEN_KEY);
    await PushNotifications.removeAllListeners();
  } catch { /* silent */ }
}
