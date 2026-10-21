import { useEffect, useReducer } from 'react';
import { getPetSizeSeed, measureVisibleFill, petScaleFor, petScaleStyle, subscribeFill, visibleFillOf } from '../utils/spriteScale';

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
