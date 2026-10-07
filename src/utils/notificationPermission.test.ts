import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decidePermissionAction, settingsGuidance, type PermissionDecisionInput } from './notificationPermission';

const base: PermissionDecisionInput = { platform: 'native', state: 'default', trigger: 'first-open', firstOpenAsked: false };

describe('decidePermissionAction', () => {
  it('primeira abertura, ainda não decidiu: pede o modal nativo (APK e web)', () => {
    expect(decidePermissionAction(base)).toBe('request');
    expect(decidePermissionAction({ ...base, platform: 'web' })).toBe('request');
  });
  it('primeira abertura só uma vez, e negado nunca é cobrado de novo', () => {
    expect(decidePermissionAction({ ...base, firstOpenAsked: true })).toBe('none');
    expect(decidePermissionAction({ ...base, state: 'denied' })).toBe('none');
    expect(decidePermissionAction({ ...base, state: 'unsupported' })).toBe('none');
  });
  it('primeira abertura já concedida: só registra', () => {
    expect(decidePermissionAction({ ...base, state: 'granted' })).toBe('register');
  });
  it('toggle: default pede, granted registra, denied/sem suporte orienta', () => {
    const t = { ...base, trigger: 'toggle' as const, firstOpenAsked: true };
    expect(decidePermissionAction(t)).toBe('request');
    expect(decidePermissionAction({ ...t, state: 'granted' })).toBe('register');
    expect(decidePermissionAction({ ...t, state: 'denied' })).toBe('guide-settings');
    expect(decidePermissionAction({ ...t, state: 'unsupported' })).toBe('guide-settings');
  });
  it('a orientação existe em EN e PT nas duas plataformas, sem cobrança', () => {
    for (const p of ['native', 'web'] as const) for (const pt of [true, false]) {
      const g = settingsGuidance(p, pt);
      expect(g.title.length).toBeGreaterThan(5);
      expect(g.description).not.toMatch(/must|deve |precisa/i);
    }
  });
});

describe('fiação (fonte)', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  it('o toggle usa o decisor e não o pedido só-web', () => {
    expect(app).toContain("trigger: 'toggle'");
    expect(app).not.toContain('requestNotificationPermission');
  });
  it('a primeira abertura é uma vez só e no web espera gesto (click)', () => {
    expect(app).toContain("trigger: 'first-open'");
    expect(app).toContain("addEventListener('click', onGesture");
  });
  it('o Android declara POST_NOTIFICATIONS e abre as configurações do app', () => {
    expect(readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8')).toContain('android.permission.POST_NOTIFICATIONS');
    expect(readFileSync('android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonAlarmPlugin.kt', 'utf8'))
      .toContain('ACTION_APP_NOTIFICATION_SETTINGS');
  });
});
