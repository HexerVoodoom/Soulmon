import type { Language } from '../../utils/i18n';
import { ModalSheet } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import type { MenuPageId } from '../../navigation';

/** Ícone que É a ação de uma linha de lista: degrau `action` (tokens.md §6.1). */
const ICON_ACTION = 24;

/**
 * O MENU DA HOME (D6, 23/09/2026): tudo o que morava no sanduíche da barra
 * inferior — e o que não tinha casa nenhuma — vem para cá.
 *
 * Folha de baixo (`ModalSheet`: foco preso, Escape fecha, foco volta ao
 * gatilho), e não mais popover: com a barra fora, não há rodapé onde ancorar
 * um popover, e as linhas agora são sete, não quatro.
 *
 * A Biblioteca NÃO está aqui: pela D4 ela mora no Hall do Mapa. Duas portas para
 * a mesma tela no mesmo polegar foi o que a nav antiga já recusava.
 */
function MenuRow({ icon, label, onClick, first }: {
  icon: string; label: string; onClick: () => void; first?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-menu-row
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sm2-space-3)', width: '100%',
        minHeight: 48, padding: 'var(--sm2-space-3) var(--sm2-space-4)',
        background: 'transparent', border: 'none',
        borderTop: first ? 'none' : '1px solid var(--sm2-line)',
        color: 'var(--sm2-ink)',
        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
        lineHeight: 'var(--sm2-leading-body)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <Icon name={icon} size={ICON_ACTION} tone="muted" />
      <span data-menu-label>{label}</span>
    </button>
  );
}

export function HomeMenuSheet({
  open, onClose, language, onOpenPage, onOpenGuide, onOpenCredits, onResetOnboarding,
}: {
  open: boolean;
  onClose: () => void;
  language: Language;
  onOpenPage: (page: MenuPageId) => void;
  onOpenGuide: () => void;
  onOpenCredits?: () => void;
  onResetOnboarding?: () => void;
}) {
  const isPt = language === 'pt-BR';
  /** Toda linha fecha a folha ANTES de agir: o que ela abre (página, guia,
   *  créditos) não pode nascer por baixo de uma folha modal ainda aberta. */
  const go = (fn: () => void) => () => { onClose(); fn(); };
  return (
    <ModalSheet open={open} title={isPt ? 'Menu' : 'Menu'} onClose={onClose} language={language}>
      <div data-home-menu>
        <MenuRow
          first
          icon="settings"
          label={isPt ? 'Configurações' : 'Settings'}
          onClick={go(() => onOpenPage('settings'))}
        />
        <MenuRow
          icon="psychology"
          label={isPt ? 'Oráculo' : 'Oracle'}
          onClick={go(() => onOpenPage('oracle'))}
        />
        <MenuRow
          icon="leaderboard"
          label={isPt ? 'Estatísticas' : 'Stats'}
          onClick={go(() => onOpenPage('stats'))}
        />
        <MenuRow
          icon="help"
          label={isPt ? 'Guia' : 'Guide'}
          onClick={go(onOpenGuide)}
        />
        {onOpenCredits && (
          <MenuRow
            icon="diamond"
            label={isPt ? 'Créditos' : 'Credits'}
            onClick={go(onOpenCredits)}
          />
        )}
        {onResetOnboarding && (
          <MenuRow
            icon="replay"
            label={isPt ? 'Refazer o ritual' : 'Redo the ritual'}
            onClick={go(onResetOnboarding)}
          />
        )}
      </div>
    </ModalSheet>
  );
}
