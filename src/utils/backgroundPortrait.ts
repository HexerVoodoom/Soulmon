// Variante RETRATO (9:16, 608×1080 WebP) de alguns cenários pintados — `bg-<id>-portrait.webp`.
// Só existe para os que aparecem fora do cenário equipado (Bosque/Casa/Guerra da guilda, postais da
// Travessia); os equipáveis ficam só em paisagem. Sem retrato, ou com caixa horizontal, vale a paisagem.
import { PET_BACKGROUNDS } from './backgrounds';

const PORTRAITS = import.meta.glob('../assets/backgrounds/*-portrait.webp', { eager: true, import: 'default' }) as Record<string, string>;

/** URL do retrato do cenário `id`, ou `undefined` quando não há. */
export function portraitUrl(id: string): string | undefined {
  return PORTRAITS[`../assets/backgrounds/${id}-portrait.webp`];
}

/**
 * `background` CSS (só a arte) do cenário para uma caixa `width × height`: retrato quando a caixa é
 * vertical (altura > largura) e o retrato existe; senão o `css` paisagem de PET_BACKGROUNDS.
 */
export function sceneCss(id: string, width?: number, height?: number): string | undefined {
  const url = width && height && height > width ? portraitUrl(id) : undefined;
  return url ? `url(${url})` : PET_BACKGROUNDS[id]?.css;
}
