import { registerPlugin } from '@capacitor/core';

/**
 * Tela acordada no Foco (beta12, item H). Plugin nativo proprio (`KeepAwakePlugin.kt`) com a forma de
 * `@capacitor-community/keep-awake`. APK antigo nao o tem: quem chama confere `Capacitor.isPluginAvailable('KeepAwake')`
 * (`utils/keepAwake.ts`) e cai no Screen Wake Lock da web.
 */
export interface KeepAwakePlugin {
  keepAwake(): Promise<void>;
  allowSleep(): Promise<void>;
  isSupported(): Promise<{ isSupported: boolean }>;
  isKeptAwake(): Promise<{ isKeptAwake: boolean }>;
}

export const KeepAwake = registerPlugin<KeepAwakePlugin>('KeepAwake', {
  web: {
    async keepAwake() {},
    async allowSleep() {},
    async isSupported() { return { isSupported: false }; },
    async isKeptAwake() { return { isKeptAwake: false }; },
  },
});
