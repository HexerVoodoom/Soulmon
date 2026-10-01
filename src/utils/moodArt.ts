/**
 * C6 (navegação do dono, 01/10/2026) — os emojis do "How are you today"
 * (`MOOD_OPTIONS`, `utils/mood.ts`) vão virar ASSETS próprios. A arte é da
 * frente de arte; este arquivo é a fronteira de troca: quando um PNG chegar,
 * importe-o aqui e preencha a entrada do id — o `DailyReportModal` passa a
 * desenhar a imagem sozinho, sem mexer em componente. Id sem arte cai no
 * emoji de `mood.ts`, que continua sendo o fallback.
 *
 * Ids (estáveis, em inglês, um por valor 1..5 do humor):
 *   1 `rough` · 2 `low` · 3 `okay` · 4 `good` · 5 `great`
 * Sugestão de arquivo: `src/assets/soulmon/icones-ui/mood-<id>.png`, pixel
 * art com ALFA REAL, quadrado, desenhado para 24 px (48/72 px = 2×/3×).
 */
import type { MoodValue } from './mood';

export type MoodArtId = 'rough' | 'low' | 'okay' | 'good' | 'great';

export const MOOD_ART_ID: Record<MoodValue, MoodArtId> = {
  1: 'rough',
  2: 'low',
  3: 'okay',
  4: 'good',
  5: 'great',
};

/** id → URL da arte. Vazio até a frente de arte entregar. */
export const MOOD_ART: Partial<Record<MoodArtId, string>> = {};

export function moodArtFor(value: MoodValue): string | undefined {
  return MOOD_ART[MOOD_ART_ID[value]];
}
