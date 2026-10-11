/**
 * Portão do beta fechado (release/beta-1). Fica no chunk de entrada só o portão;
 * a TELA (`BetaClosedScreen`, com logo e mascote) é `lazy` — só quem está fora
 * da lista a baixa. Ver `BetaClosedScreen.tsx` e `utils/betaClosed.ts`.
 */
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useBetaClosed, trocarContaBetaFechado } from '../utils/betaClosed';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

const BetaClosedScreen = lazy(() => import('./BetaClosedScreen').then(m => ({ default: m.BetaClosedScreen })));

export function BetaClosedGate({ children }: { children: ReactNode }) {
  const fechado = useBetaClosed();
  const [email, setEmail] = useState<string | null>(() => readLocal(STORAGE_KEYS.USER_EMAIL));
  useEffect(() => {
    if (!fechado) return;
    let vivo = true;
    void import('../utils/auth').then(m => m.getCurrentEmail()).then(e => { if (vivo && e) setEmail(e); }).catch(() => {});
    return () => { vivo = false; };
  }, [fechado]);
  if (!fechado) return <>{children}</>;
  const lang = String(readLocal(STORAGE_KEYS.LANGUAGE) ?? '').startsWith('en') ? 'en' : 'pt';
  return (
    <Suspense fallback={<main data-beta-closed style={{ minHeight: '100dvh', background: 'var(--sm2-bg, #08191a)' }} />}>
      <BetaClosedScreen language={lang} email={email} onSwitch={() => { void trocarContaBetaFechado(); }} />
    </Suspense>
  );
}
