import type { CSSProperties } from 'react';
import { Icon } from './Icon';

/**
 * `BackArrow` — o "voltar" PADRÃO do app (checklist do dono 01/10/2026, B6/I3):
 * uma seta `arrow_back` 24 PELADA (ícone nunca em box) num alvo de toque 44,
 * no canto SUPERIOR ESQUERDO, ACIMA do título da tela. Nada de botão "Voltar"
 * com texto no pé da tela.
 *
 * O rótulo vive só no nome acessível (`aria-label`), nos dois idiomas. A
 * classe `sm2-ora-back` (index.css, footgun 1: só classe que existe aplica)
 * dá o alvo 44, o foco visível e o `:active`; o `style` inline só cuida do
 * encaixe — a seta encosta na margem esquerda (o -10 compensa o respiro
 * interno do alvo de 44 para o desenho da seta alinhar com o texto abaixo).
 *
 * Uso: `<BackArrow onClick={voltar} language={language} />` como PRIMEIRO
 * elemento da tela, antes do título.
 */
export function BackArrow({
  onClick, language, label, style,
}: {
  onClick: () => void;
  language: 'pt-BR' | 'en-US';
  /** Nome acessível próprio (ex.: "Fechar a loja"); padrão = Voltar/Back. */
  label?: string;
  style?: CSSProperties;
}) {
  const isPt = language === 'pt-BR';
  return (
    <div data-back-arrow style={{ display: 'flex', justifyContent: 'flex-start', margin: '0 0 4px -10px', ...style }}>
      <button
        type="button"
        className="sm2-ora-back"
        onClick={onClick}
        aria-label={label ?? (isPt ? 'Voltar' : 'Back')}
      >
        <Icon name="arrow_back" size={24} tone="inherit" />
      </button>
    </div>
  );
}
