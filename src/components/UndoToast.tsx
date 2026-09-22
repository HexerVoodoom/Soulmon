/**
 * ↩️ O TOAST DE "DESFAZER" (decisão do dono #57, 22/09/2026).
 *
 * Por que é `toast.custom` e não o `action` que o `sonner` já oferece: o
 * `sonner` 2.0.3 **não põe `role` nenhum** no `<li>` do toast (conferido no
 * `dist`), e o botão de ação dele herda a altura do texto — 24px de alvo, contra
 * os **44** que o sistema exige (`src/styles/tokens.md`). Como este é o único
 * toast do app que o usuário precisa **acionar** (todos os outros são avisos
 * que só somem), ele é o único que paga o preço de ter marcação própria.
 *
 * O que a marcação garante:
 *  · `role="status"` — leitor de tela anuncia sem roubar o foco (`alert`
 *    interromperia, e isto não é erro: é uma oferta);
 *  · alvo de **44×44** no botão, com o texto do rótulo intacto;
 *  · PT + EN, como todo texto do app (`language === 'pt-BR'`).
 *
 * O TEXTO obedece às leis de escrita da bíblia: descreve o ato ("Hábito
 * marcado"), não julga e não cobra — e o verbo do botão é do jogador
 * ("Desfazer"), nunca do app.
 */
import type { Language } from '../utils/i18n';

export function UndoToast({
  language,
  mensagem,
  onUndo,
}: {
  language: Language;
  /** O que acabou de acontecer, já traduzido pelo chamador. */
  mensagem: string;
  onUndo: () => void;
}) {
  const isPt = language === 'pt-BR';
  return (
    <div
      role="status"
      /* Sem `className`: todo o desenho é inline (tokens `--sm2-*`), e classe
         que não existe em `index.css` não aplica nada — é o footgun 1, travado
         por `index.css.contract.test.ts` (22/09/2026). */
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 44,
        padding: '8px 12px',
        borderRadius: 'var(--sm2-radius-md)',
        background: 'var(--sm2-surface)',
        color: 'var(--sm2-ink)',
        border: '1px solid var(--sm2-line)',
        fontSize: 'var(--sm2-text-sm)',
      }}
    >
      <span style={{ flex: 1 }}>{mensagem}</span>
      <button
        type="button"
        onClick={onUndo}
        aria-label={isPt ? 'Desfazer a conclusão' : 'Undo the completion'}
        style={{
          // 44×44 é o alvo mínimo do sistema. O rótulo é curto, então o que
          // garante o alvo é o `minWidth`/`minHeight`, não o padding do texto.
          minWidth: 44,
          minHeight: 44,
          padding: '0 12px',
          borderRadius: 'var(--sm2-radius-sm)',
          border: '1px solid var(--sm2-primary-ink)',
          background: 'transparent',
          color: 'var(--sm2-primary-ink)',
          fontSize: 'var(--sm2-text-sm)',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {isPt ? 'Desfazer' : 'Undo'}
      </button>
    </div>
  );
}
