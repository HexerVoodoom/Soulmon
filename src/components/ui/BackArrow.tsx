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
 *
 * I3 (02/10/2026): o FECHAR de um modal/folha SIMPLES mora no MESMO lugar
 * (canto superior ESQUERDO, acima do título) — `icon="close"`, o rótulo
 * padrão vira Fechar/Close. O X à DIREITA existe só onde fechar ENCERRA uma
 * atividade em andamento (luta, minijogo, run).
 */
export function BackArrow({
  onClick, language, label, style, icon = 'arrow_back',
}: {
  onClick: () => void;
  language: 'pt-BR' | 'en-US';
  /** Nome acessível próprio (ex.: "Fechar a loja"); padrão = Voltar/Back
   *  (ou Fechar/Close com `icon="close"`). */
  label?: string;
  /** `arrow_back` = voltar (padrão); `close` = fechar um modal/folha simples. */
  icon?: 'arrow_back' | 'close';
  style?: CSSProperties;
}) {
  const isPt = language === 'pt-BR';
  return (
    <div data-back-arrow style={{ display: 'flex', justifyContent: 'flex-start', margin: '0 0 4px -10px', ...style }}>
      <button
        type="button"
        className="sm2-ora-back"
        onClick={onClick}
        aria-label={label ?? (icon === 'close' ? (isPt ? 'Fechar' : 'Close') : (isPt ? 'Voltar' : 'Back'))}
      >
        <Icon name={icon} size={24} tone="inherit" />
      </button>
    </div>
  );
}
