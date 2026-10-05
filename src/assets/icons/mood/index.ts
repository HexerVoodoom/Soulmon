/**
 * C6 (ajustes de 01/10/2026) — ícones próprios do check-in de humor, no lugar
 * dos emojis de `MOOD_OPTIONS` (`utils/mood.ts`). A chave é o `MoodValue`
 * (1..5), o MESMO número que vai para o save em `moodLog` — nunca o emoji.
 *
 * Arte: o fogo-fátuo da alma, uma cor por humor (frio → quente), expressão
 * sempre calma. DEFINITIVA desde 04/10/2026: a folha do dono (alfa real,
 * `E:/Soulmon-assets/entrada-dono/06-mood-folha/mood-folha.png`) fatiada por
 * projeção, alfa binarizado e reduzida nearest a 128² — os MESMOS nomes do
 * interino desenhado à mão (01/10/2026), que ela substitui.
 *
 * Integração (fora desta entrega): quem desenha o humor troca
 * `<span>{m.emoji}</span>` por `<img src={MOOD_ICON[m.value]} …
 * style={{ imageRendering: 'pixelated' }} />`; o `emoji` continua no
 * `MoodOption` como texto alternativo/fallback.
 */
import type { MoodValue } from '../../../utils/mood';
import rough from './mood-1-rough.png';
import low from './mood-2-low.png';
import okay from './mood-3-okay.png';
import good from './mood-4-good.png';
import great from './mood-5-great.png';

export const MOOD_ICON: Readonly<Record<MoodValue, string>> = {
  1: rough,
  2: low,
  3: okay,
  4: good,
  5: great,
};

/** Mesmos arquivos por nome legível (`labelEn` em minúsculas). */
export const MOOD_ICON_BY_NAME = { rough, low, okay, good, great } as const;

export function moodIcon(value: MoodValue): string {
  return MOOD_ICON[value];
}
