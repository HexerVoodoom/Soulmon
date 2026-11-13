/**
 * TELA ACORDADA durante a sessão do Foco (11/11/2026, pedido do dono): enquanto o timer roda, a tela não escurece.
 * Ordem: (1) plugin nativo `KeepAwake` (`FLAG_KEEP_SCREEN_ON`, `KeepAwakePlugin.kt`; entra com o APK da beta12, item H do
 * docs/BACKLOG-BETA12.md), SE o app o tiver registrado (APK antigo não tem) · (2) Screen Wake Lock API da web (`navigator.wakeLock`), com reaquisição ao voltar a
 * visibilidade (o navegador solta o lock quando a aba/app vai ao fundo) · (3) sem nenhum dos dois: segue sem travar a tela
 * e devolve `supported: false` para a UI poder avisar. Falha (rejeição, bateria baixa, sem permissão) nunca quebra a sessão.
 */
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '../plugins/KeepAwakePlugin';

interface WakeSentinel { release: () => Promise<void>; addEventListener?: (t: 'release', cb: () => void) => void }
interface NativeKeepAwake { keepAwake?: () => Promise<unknown>; allowSleep?: () => Promise<unknown> }

const nativePlugin = (): NativeKeepAwake | null => {
  try {
    // Plugin nativo nosso: o cabeçalho do plugin existe no APK novo; no antigo (ou na web) isto é falso e segue o resto.
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('KeepAwake')) return KeepAwake;
    return null;
  } catch { return null; }
};
const webWakeLock = (): { request: (t: 'screen') => Promise<WakeSentinel> } | null => {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WakeSentinel> } }).wakeLock;
    return wl && typeof wl.request === 'function' ? wl : null;
  } catch { return null; }
};

export const keepAwakeSupported = (): boolean => !!nativePlugin() || !!webWakeLock();

/** Mantém a tela acesa enquanto `active`. Devolve se o aparelho oferece algum jeito (`false` = aviso na UI). */
export function useKeepAwake(active: boolean): boolean {
  const [supported] = useState(keepAwakeSupported);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let sentinel: WakeSentinel | null = null;
    const native = nativePlugin();
    if (native) {
      try { void Promise.resolve(native.keepAwake?.()).catch(() => { /* sem keep-awake */ }); } catch { /* sem keep-awake */ }
      return () => { try { void Promise.resolve(native.allowSleep?.()).catch(() => {}); } catch { /* nada */ } };
    }
    const acquire = async () => {
      const wl = webWakeLock();
      if (!wl || cancelled || sentinel || document.visibilityState !== 'visible') return;
      try {
        const s = await wl.request('screen');
        if (cancelled) { void s.release().catch(() => {}); return; }
        sentinel = s;
        s.addEventListener?.('release', () => { if (sentinel === s) sentinel = null; });
      } catch { /* rejeitado: segue sem travar a tela */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      const s = sentinel; sentinel = null;
      if (s) { try { void s.release().catch(() => {}); } catch { /* já solto */ } }
    };
  }, [active]);
  return supported;
}
