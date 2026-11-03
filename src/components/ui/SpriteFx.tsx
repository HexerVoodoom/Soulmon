import type { CSSProperties } from 'react';
import { FX_SHEET, RESULT_BANNER, type ResultBannerKind } from '../../utils/fxPackArt';

/**
 * FX por folha 3×2 (6 quadros de células iguais, `utils/fxPackArt`), animada por `steps()` no CSS (`.sm-fxs`, fim do `index.css`):
 * zero JS por quadro. `loops` = vezes que roda (0 = infinito); termina parada no ÚLTIMO quadro. Decorativa (`aria-hidden`).
 * `prefers-reduced-motion`: sem animação — `still="last"` mostra o último quadro parado, `still="hide"` some.
 */
export function SpriteFx({ sheet, size, ms = 720, loops = 1, delayMs = 0, still = 'hide', style, ...rest }: {
  sheet: keyof typeof FX_SHEET; size: number; ms?: number; loops?: number; delayMs?: number; still?: 'last' | 'hide'; style?: CSSProperties;
} & Record<`data-${string}`, string | number | boolean | undefined>) {
  return (
    <span
      aria-hidden="true"
      className="sm-fxs"
      data-sprite-fx={sheet}
      data-fxs-still={still}
      style={{
        width: size, height: size, backgroundImage: `url(${FX_SHEET[sheet]})`,
        ['--fxs-ms' as string]: `${ms}ms`, ['--fxs-n' as string]: loops === 0 ? 'infinite' : String(loops), ['--fxs-delay' as string]: `${delayMs}ms`,
        ...style,
      } as CSSProperties}
      {...rest}
    />
  );
}

/** Rótulos da arte (a palavra está NA imagem, em inglês nos dois idiomas): o leitor de tela recebe PT/EN. */
const BANNER_LABEL: Record<ResultBannerKind, { pt: string; en: string }> = {
  victory: { pt: 'Vitória', en: 'Victory' },
  defeat: { pt: 'Derrota', en: 'Defeat' },
  draw: { pt: 'Empate', en: 'Draw' },
  win: { pt: 'Vitória', en: 'Win' },
  lose: { pt: 'Derrota', en: 'Lose' },
  complete: { pt: 'Completo', en: 'Complete' },
};

/** O desfecho do `ResultScreen` (`win`/`record` → victory, `tired` → defeat, `calm` → draw). */
export type BannerSet = 'epic' | 'game';
/** `epic` (Torneio/Duelo) = VICTORY/DEFEAT; `game` (minigames, padrão) = WIN/LOSE. O empate (amarelo) é o mesmo nos dois. */
export function bannerForOutcome(outcome: 'win' | 'record' | 'calm' | 'tired', set: BannerSet = 'game'): ResultBannerKind {
  if (outcome === 'calm') return 'draw';
  const won = outcome === 'win' || outcome === 'record';
  return set === 'epic' ? (won ? 'victory' : 'defeat') : (won ? 'win' : 'lose');
}

/** Título de resultado com o lettering na arte (PNG alfa real, 512 px de base). Sem a arte o texto do app segue no `<h2>`. */
export function ResultBanner({ kind, isPt, width = 240, style }: { kind: ResultBannerKind; isPt: boolean; width?: number; style?: CSSProperties }) {
  const label = isPt ? BANNER_LABEL[kind].pt : BANNER_LABEL[kind].en;
  return (
    <img
      src={RESULT_BANNER[kind]} alt={label} aria-label={label} draggable={false}
      data-result-banner={kind} width={width}
      style={{ display: 'block', margin: '0 auto', width, maxWidth: '100%', height: 'auto', imageRendering: 'pixelated', pointerEvents: 'none', ...style }}
    />
  );
}
