/** Custos de poção, dono único (folha sem imports: `elementPotion.ts`, `neutroPotion.ts`, a oferta da Vesca e o App leem daqui). */
export const POTION_COSTS = {
  /** Elemento base: quantidade da PRÓPRIA essência. Ao atingir isto a Vesca oferece a poção. */
  baseOwn: 100,
  /** Composto (2–4 bases) e o NEUTRO: essências do próprio elemento. Ao atingir isto a Vesca oferece a poção (16/11/2026). */
  compositeFinal: 50,
} as const;
export const POTION_PREFIX = 'potion:';
