/**
 * Tag de "feito" no RODAPÉ (pedido do dono, 29/10/2026): UMA tag só com as duas funções —
 * confirma a conclusão, mostra o que se ganhou e oferece o Desfazer (substitui o antigo
 * `UndoToast` do topo e o aviso "📋 x/y do dia").
 *
 *  · `role="status"` — leitor de tela anuncia sem roubar o foco;
 *  · glifo autoral `check_circle` (nada de emoji);
 *  · ganho exato pelo `RewardPreview` em modo `after`;
 *  · botão de Desfazer com alvo de 44px, PT + EN;
 *  · a janela de vida (`UNDO_WINDOW_MS`) é de quem monta a tag: some sozinha.
 * Todo o desenho é inline (footgun 1: classe fora do index.css não aplica nada).
 */
import { Icon } from './ui/Icon';
import { RewardPreview, type PreviewItem } from './ui/RewardPreview';
import type { Language } from '../utils/i18n';

export function CompletionTag({ language, name, items, onUndo }: {
  language: Language; name: string; items: readonly PreviewItem[]; onUndo: () => void;
}) {
  const isPt = language === 'pt-BR';
  return (
    <div
      role="status"
      data-completion-tag
      style={{
        position: 'fixed', left: 16, right: 16, zIndex: 60, margin: '0 auto', maxWidth: 420,
        bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + var(--sm-chatdock-h, 56px) + 8px)',
        display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '6px 6px 6px 12px',
        borderRadius: 'var(--sm2-radius-md)', background: 'var(--sm2-surface)', color: 'var(--sm2-ink)',
        border: '1px solid var(--sm2-line)', fontSize: 'var(--sm2-text-sm)',
      }}
    >
      <Icon name="check_circle" size={20} fill={1} tone="primary" />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {name} · {isPt ? 'feito' : 'done'}
        </span>
        <RewardPreview items={items} mode="after" language={language} size={14} />
      </span>
      <button
        type="button"
        onClick={onUndo}
        aria-label={isPt ? `Desfazer a conclusão de ${name}` : `Undo completing ${name}`}
        style={{
          minWidth: 44, minHeight: 44, padding: '0 12px', borderRadius: 'var(--sm2-radius-sm)',
          border: '1px solid var(--sm2-primary-ink)', background: 'transparent',
          color: 'var(--sm2-primary-ink)', fontSize: 'var(--sm2-text-sm)', fontWeight: 700, cursor: 'pointer',
        }}
      >
        {isPt ? 'Desfazer' : 'Undo'}
      </button>
    </div>
  );
}
