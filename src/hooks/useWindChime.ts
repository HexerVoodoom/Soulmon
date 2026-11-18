import { useEffect } from 'react';
import { playWindChime } from '../utils/sounds';
import { SINO_VARIACOES } from '../utils/sonsRecompensa';
import { prefersReducedMotion, sonoLiberado } from './useRewardReveal';

/** Intervalo aleatório entre badaladas (ms): espaçado, nunca em ritmo fixo. */
export const SINO_MIN_MS = 14000;
export const SINO_MAX_MS = 38000;

/**
 * Sino de vento da decoração (REGISTRO §480). Soa em loop espaçado/aleatório enquanto `ativo` (sino posto, Home montada, pet acordado).
 * D11: só com a aba visível e o áudio já liberado por um gesto; o mudo é global (`play` do sounds.ts). Movimento reduzido = sem sino
 * (ambiente decorativo, não informação). Aba oculta/dormindo: o timer espera, sem tocar.
 */
export function useWindChime(ativo: boolean): void {
  useEffect(() => {
    if (!ativo || prefersReducedMotion()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ultima = -1;
    const agenda = () => {
      timer = setTimeout(() => {
        if (sonoLiberado()) {
          let v = Math.floor(Math.random() * SINO_VARIACOES);
          if (v === ultima) v = (v + 1) % SINO_VARIACOES;
          ultima = v;
          playWindChime(v);
        }
        agenda();
      }, SINO_MIN_MS + Math.random() * (SINO_MAX_MS - SINO_MIN_MS));
    };
    agenda();
    return () => { if (timer) clearTimeout(timer); };
  }, [ativo]);
}
