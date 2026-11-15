import type { ReactNode } from 'react';
import { ResultExtrasContext, useResultExtras } from './ResultExtrasContext';
import { minigameBitsCap } from '../../utils/currencies';

/**
 * §392: na Fenda/Masmorra/Arena o teto diário de Bits é o base + o extra da Agulha de bússola (`tal-pve-04`). A tela de resultado
 * dos outros jogos segue com o teto base, por isso o extra entra só aqui, sobre o contexto que o `App` já fornece.
 */
export function RiftResultExtras({ extraCap, children }: { extraCap: number; children: ReactNode }) {
  const extras = useResultExtras();
  const value = extras && extraCap > 0 ? { ...extras, bitsCap: minigameBitsCap(extraCap) } : extras;
  return <ResultExtrasContext.Provider value={value}>{children}</ResultExtrasContext.Provider>;
}
