import type { Language } from '../utils/i18n';
import { useDialogA11y } from '../hooks/useDialogA11y';

/**
 * SUGESTÃO DE LIMITE DE HÁBITOS (dono, 24/11/2026, opção A): quem não é demo NÃO tem teto duro; o número do estágio é só uma
 * recomendação. Ao tentar passar dele, este bottom sheet simples (mesmo padrão do `CreateChoicePopup`: sem moldura de arte, só
 * tokens `--sm2-*`, `.sm2-escolhedor*`) pergunta uma vez por tentativa. Sem ✕: as DUAS saídas são os botões; Esc e toque no véu
 * valem "Você tem razão" (nunca criam). Não carrega nenhum dado do hábito: só o número X.
 */
export interface HabitOverRecommendedPopupProps {
  open: boolean;
  language: Language;
  /** X = o número recomendado do estágio (`gameState.maxActivityCap`). */
  recommended: number;
  /** "Quero me comprometer mesmo assim": cria. */
  onCommitAnyway: () => void;
  /** "Você tem razão" (também Esc e véu): fecha SEM criar. */
  onDecline: () => void;
}

export function HabitOverRecommendedPopup({ open, language, recommended, onCommitAnyway, onDecline }: HabitOverRecommendedPopupProps) {
  const pt = language === 'pt-BR';
  const ref = useDialogA11y<HTMLDivElement>(open, onDecline);
  if (!open) return null;
  const texto = pt
    ? `Neste nível o recomendado são ${recommended} hábitos. Recomendamos que você se comprometa com metas menores e as aumente progressivamente.`
    : `At this level the recommended number is ${recommended} habits. We recommend committing to smaller goals and growing them gradually.`;
  return (
    <div data-modal-backdrop data-habit-over-popup className="sm2-escolhedor-veu sm2-sheet-fade"
      onClick={(e) => { if (e.target === e.currentTarget) onDecline(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={pt ? 'Limite de hábitos recomendado' : 'Recommended habit limit'} className="sm2-escolhedor">
        <span className="sm2-escolhedor__alca" aria-hidden="true" />
        <p data-habit-over-text className="sm2-escolhedor__txt">{texto}</p>
        <button type="button" data-habit-over="decline" className="sm2-escolhedor__op sm2-escolhedor__op--forte" onClick={onDecline}>
          {pt ? 'Você tem razão' : "You're right"}
        </button>
        <button type="button" data-habit-over="commit" className="sm2-escolhedor__op" onClick={onCommitAnyway}>
          {pt ? 'Quero me comprometer mesmo assim' : 'I still want to commit'}
        </button>
      </div>
    </div>
  );
}
