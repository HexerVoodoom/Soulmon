import { useCallback, useEffect, useRef, useState } from 'react';

/** ALVO POR TOQUE (dono, 03/11/2026): o marcador de mira só aparece por 1 s depois do toque e some (a escolha continua valendo). */
export const MIRA_FLASH_MS = 1000;

/**
 * Qual inimigo mostra o marcador agora: o último tocado, por `MIRA_FLASH_MS`; depois `null`.
 * Tocar de novo (mesmo no mesmo inimigo) reacende. Sem animação: o anel é estático, então serve igual com movimento reduzido.
 */
export function useMiraFlash(): [number | null, (foe: number) => void] {
  const [foe, setFoe] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const flash = useCallback((i: number) => {
    if (timer.current) clearTimeout(timer.current);
    setFoe(i);
    timer.current = setTimeout(() => { timer.current = null; setFoe(null); }, MIRA_FLASH_MS);
  }, []);
  return [foe, flash];
}
