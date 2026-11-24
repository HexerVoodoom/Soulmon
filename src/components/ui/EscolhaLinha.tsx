import type { CSSProperties, ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from '../form/FormKit';
import { Icon } from './Icon';

/**
 * A LINHA "ESCOLHA 1 DE 3" (extraída do Torneio em 18/11/2026, REGISTRO §488; a Arena aberta entrou no §489): arte à esquerda (mini-visor 64), nome e detalhe no meio,
 * a recompensa ("até N …") e o botão de lutar à direita. Dono único do formato: Torneio (Ranqueada e Treino), Arena aberta (`DueloSheet`) e Elemental Fusion
 * (Aventura e PvP) usam ESTA linha, para as tabelinhas serem iguais. Sem CSS novo: estilos inline com os tokens do kit.
 *
 * a11y: o botão tem alvo de 44 px (`sm2Button` 'sm' + `minWidth` 88) e o rótulo visível ("Lutar"/"Fight") fica CONTIDO no nome
 * acessível (WCAG 2.5.3), que ainda nomeia a opção.
 */
export const escolhaCardStyle: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
};

export interface EscolhaLinhaProps {
  /** A arte (normalmente um `MiniGlass` 64). */
  lead: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  /** A recompensa (normalmente um `RewardPreview mode="before"`). */
  reward?: ReactNode;
  actionLabel: string;
  actionAriaLabel: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** Atributos `data-*` / `role` da linha (os testes e o leitor de tela). */
  rowProps?: Record<string, string | number | boolean | undefined>;
  actionProps?: Record<string, string | number | boolean | undefined>;
}

export function EscolhaLinha({ lead, title, sub, reward, actionLabel, actionAriaLabel, onAction, disabled = false, busy = false, rowProps, actionProps }: EscolhaLinhaProps) {
  return (
    <div {...rowProps} style={{ ...escolhaCardStyle, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', minHeight: 56 }}>
      {lead}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{title}</div>
        {sub !== undefined && (
          <p className="sm2-num" style={{ ...sm2Hint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>
        )}
      </div>
      {reward}
      <button
        type="button"
        {...actionProps}
        disabled={disabled || busy}
        onClick={onAction}
        aria-label={actionAriaLabel}
        style={{ ...sm2Button('primary', disabled || busy, 'sm'), flexShrink: 0, minWidth: 88 }}
      >
        {busy && <Icon name="sync" size={20} className="animate-spin" />}
        {actionLabel}
      </button>
    </div>
  );
}

/** O "Sortear N novos" no fim da lista (mesmo botão do Torneio): contorno, largura cheia, ícone de sorteio. */
export function SortearNovos({ label, ariaLabel, onClick, disabled = false, spinning = false, buttonProps, iconSrc }: {
  /** Texto visível (nó: a Arena põe o custo dentro de um `span` próprio). */
  label: ReactNode; ariaLabel?: string; onClick: () => void; disabled?: boolean; spinning?: boolean;
  buttonProps?: Record<string, string | number | boolean | undefined>;
  /** Arte própria no lugar do glifo `sync` (20 px; degrau de ícone da escala §6.1). Sem ela, fica o glifo. */
  iconSrc?: string;
}) {
  return (
    <button type="button" {...buttonProps} disabled={disabled} aria-label={ariaLabel} onClick={onClick} style={{ ...sm2Button('outline', disabled), width: '100%' }}>
      {iconSrc
        ? <img data-sortear-icone src={iconSrc} alt="" width={20} height={20} draggable={false} className={spinning ? 'animate-spin' : undefined} style={{ imageRendering: 'pixelated' }} />
        : <Icon name="sync" size={20} className={spinning ? 'animate-spin' : undefined} />}
      {label}
    </button>
  );
}
