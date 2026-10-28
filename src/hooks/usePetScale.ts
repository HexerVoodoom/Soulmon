import { useEffect, useReducer } from 'react';
import { feetShiftPx, getPetSizeSeed, measureVisibleFill, petScaleFor, petScaleStyle, subscribeFill, visibleBottomOf, visibleFillOf } from '../utils/spriteScale';

/**
 * Fator de escala do bicho do jogador nesta tela (dono: `utils/spriteScale.ts`).
 * Mede a caixa visível do `url` uma vez (cache) e re-renderiza quando ela chega.
 * `seed` só se passa para um bicho que NÃO é o do jogador; o padrão é a semente do save.
 */
export function usePetScale(stage: string | undefined | null, url: string | undefined | null, seed?: string): number {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!url) return;
    void measureVisibleFill(url);
    return subscribeFill(bump);
  }, [url]);
  return petScaleFor(stage, seed ?? getPetSizeSeed(), visibleFillOf(url));
}

/** Atalho: o estilo pronto para o `<img>` do bicho. */
export function usePetScaleStyle(stage: string | undefined | null, url: string | undefined | null, seed?: string) {
  return petScaleStyle(usePetScale(stage, url, seed));
}

/**
 * Deslocamento vertical (px) para o PÉ visível do sprite tocar a plataforma (mede a base da caixa visível uma vez,
 * em cache por URL; sem medida = 0, o layout histórico). `scale` = o fator aplicado ao `<img>` (1 se não há).
 */
export function useFeetShift(url: string | undefined | null, scale: number | undefined, size: number): number {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!url) return;
    void measureVisibleFill(url);
    return subscribeFill(bump);
  }, [url]);
  return feetShiftPx(visibleBottomOf(url), scale ?? 1, size);
}
