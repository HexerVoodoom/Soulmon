import type { CSSProperties } from 'react';
import { NavGlyph } from './NavGlyphs';
import { PixelIcon } from './PixelIcon';

/**
 * `BackCircleButton` — o VOLTAR PADRÃO de toda tela cheia (rodada 6, L2):
 * seta `arrow_back` pelada dentro do MESMO círculo de 44px (exceção D1 à regra
 * "ícone nunca dentro de box"), sempre no canto ESQUERDO do cabeçalho. O título /
 * andar / nome da área vai para a DIREITA. Nunca "Fechar"/✕ em tela cheia: o
 * rótulo acessível é Voltar/Back (ou o destino, ex.: "Voltar ao mapa").
 *
 * Sem brilho externo (box-shadow/drop-shadow): legibilidade vem do traço do anel.
 */
export const BACK_CIRCLE = 44;

export function BackCircleButton({ onClick, label, language, overScene = false, icon = 'arrow_back', style, ...rest }: {
  onClick: () => void;
  /** Nome acessível; padrão = Voltar/Back conforme `language`. */
  label?: string;
  language?: 'pt-BR' | 'en-US';
  /** Sobre cena/arte escura: tinta clara + miolo escuro translúcido. */
  overScene?: boolean;
  /** `map` = o ícone ilustrado do Mapa (o destino), ainda dentro do círculo. */
  icon?: 'arrow_back' | 'map';
  style?: CSSProperties;
} & Record<`data-${string}`, string | boolean | undefined>) {
  const name = label ?? (language === 'pt-BR' ? 'Voltar' : 'Back');
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      aria-label={name}
      title={name}
      data-back-circle
      className="sm2-area-back"
      {...rest}
      style={{
        width: BACK_CIRCLE, height: BACK_CIRCLE, flex: 'none', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, cursor: 'pointer',
        background: overScene ? 'rgba(8,25,26,.72)' : 'transparent',
        border: overScene ? '2px solid rgba(233,245,242,.6)' : '2px solid var(--sm2-line)',
        borderRadius: '50%',
        color: overScene ? '#E9F5F2' : 'var(--sm2-ink)',
        ...style,
      }}
    >
      {icon === 'map' ? <PixelIcon name="mapa" size={32} /> : <NavGlyph name="arrow_back" size={24} tone="inherit" />}
    </button>
  );
}
