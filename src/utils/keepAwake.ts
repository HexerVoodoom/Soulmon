/**
 * TELA ACORDADA durante a sessão do Foco (11/11/2026, pedido do dono): enquanto o timer roda, a tela não escurece.
 * Ordem: (1) plugin nativo `KeepAwake` do Capacitor, SE o app o tiver registrado (hoje não tem; entra com a beta12/APK,
 * docs/BACKLOG-BETA12.md item H) · (2) Screen Wake Lock API da web (`navigator.wakeLock`), com reaquisição ao voltar a
 * visibilidade (o navegador solta o lock quando a aba/app vai ao fundo) · (3) sem nenhum dos dois: segue sem travar a tela
 * e devolve `supported: false` para a UI poder avisar. Falha (rejeição, bateria baixa, sem permissão) nunca quebra a sessão.
 */
import { useEffect, useState } from 'react';

interface WakeSentinel { release: () => Promise<void>; addEventListener?: (t: 'release', cb: () => void) => void }
interface NativeKeepAwake { keepAwake?: () => Promise<unknown>; allowSleep?: () => Promise<unknown> }

const nativePlugin = (): NativeKeepAwake | null => {
  try {
    const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, NativeKeepAwake | undefined> } }).Capacitor;
    const p = cap?.Plugins?.KeepAwake;
    return p && typeof p.keepAwake === 'function' ? p : null;
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
