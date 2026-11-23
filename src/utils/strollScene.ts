/**
 * A CENA DO PASSEIO — panoramas por região (pedido do dono, 05/11/2026) — dono único da arte e da geometria.
 *
 * O resumo do dia, quando houve Passeio, abre uma cena em TELA CHEIA: o Soulmon do jogador no cenário da região visitada; depois a
 * câmera DESLIZA para o lado e mostra o Soulmon descoberto (`utils/strollDiscovery.ts`). Para deslizar, o cenário é um PANORAMA
 * (horizontal, mais largo que a tela), com o jogador na ESQUERDA e o descoberto na DIREITA, ambos pisando na mesma linha de chão.
 *
 * Arte: `src/assets/soulmon/passeio-cenas/cena-<regiaoId>.(webp|png)` (fila em `docs/ASSETS-A-GERAR.md` §25). Enquanto o arquivo
 * não existe, a cena usa o POSTAL da região (`bgId`, `utils/backgrounds.ts`) ESPELHADO lado a lado — o espelho emenda sem costura —
 * e nada quebra: o piso é a arte de sempre. Quando a arte cai com o nome-alvo, ela assume sozinha.
 */
import { PET_BACKGROUNDS } from './backgrounds';
import type { RegionId } from '../types/travessias';

/** Proporção (largura ÷ altura) do panorama: 2:1 dá o deslize inteiro numa tela vertical e ainda sobra num celular deitado. */
export const SCENE_RATIO = 2;
/** Linha do chão, em % da ALTURA do panorama (a arte é pedida com os pés caindo aqui). */
export const SCENE_GROUND_Y = 80;
/** Onde cada Soulmon pisa, em % da LARGURA do panorama. */
export const SCENE_PLAYER_X = 25;
export const SCENE_FOUND_X = 75;

const FOUND = import.meta.glob('../assets/soulmon/passeio-cenas/cena-*.{webp,png}', { eager: true, import: 'default' }) as Record<string, string>;

/** O panorama pintado da região, se já foi instalado. */
export function sceneArtOf(region: RegionId | string): string | undefined {
  for (const [path, url] of Object.entries(FOUND)) {
    if (new RegExp(`/cena-${region}\\.(webp|png)$`).test(path)) return url;
  }
  return undefined;
}

/** O postal da região (`bgId` da região no catálogo) como `url(...)` para a reserva espelhada; `undefined` se a região não tem. */
export function sceneFallbackCss(bgId: string | null | undefined): string | undefined {
  const bg = bgId ? PET_BACKGROUNDS[bgId] : undefined;
  return bg?.css;
}

/**
 * Quanto (px) o panorama desliza para CENTRAR a âncora (`anchorPct` da largura) numa tela de `viewportW`, preso às bordas do
 * panorama (nunca mostra o vazio fora dele). Negativo = para a esquerda.
 */
export function panOffsetPx(anchorPct: number, trackW: number, viewportW: number): number {
  if (!(trackW > 0) || !(viewportW > 0)) return 0;
  const want = viewportW / 2 - (anchorPct / 100) * trackW;
  const min = Math.min(0, viewportW - trackW);
  return Math.round(Math.min(0, Math.max(min, want)));
}
