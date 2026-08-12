import { useState } from 'react';
import type { Language } from '../utils/i18n';
import iconHome from '../assets/soulmon/icons/icon-home.png';
import iconActivities from '../assets/soulmon/icons/icon-activities.png';
import iconEvolution from '../assets/soulmon/icons/icon-evolution.png';
import iconBook from '../assets/soulmon/icons/icon-book.png';
import iconCoin from '../assets/soulmon/icons/icon-coin.png';
import iconMenu from '../assets/soulmon/icons/icon-menu.png';
import iconGem from '../assets/soulmon/icons/icon-gem.png';
import iconGear from '../assets/soulmon/icons/icon-gear.png';
import iconReset from '../assets/soulmon/icons/icon-reset.png';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library' | 'shop';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onResetOnboarding?: () => void;
  /** Créditos (monetização) — modal próprio, dentro do menu sanduíche. */
  onOpenCredits?: () => void;
  language?: Language;
}

/** Ícone-imagem (gerado no Higgsfield, kit bronze/cobre) no lugar do
 *  lucide-react. Sem `color` de SVG pra recolorir por aba — o destaque da
 *  aba ativa vem do halo (glow) + fundo, não de tingir o ícone. */
function NavIcon({ src, alt, active, size = 32 }: { src: string; alt: string; active?: boolean; size?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        imageRendering: 'pixelated',
        opacity: active ? 1 : 0.62,
        transform: active ? 'scale(1.22)' : 'scale(1)',
        filter: active ? 'drop-shadow(0 0 7px rgba(93,240,224,0.85)) drop-shadow(0 0 14px rgba(93,240,224,0.4))' : 'none',
        transition: 'opacity 0.15s ease, filter 0.15s ease, transform 0.15s ease',
      }}
    />
  );
}

/** Navegação principal do app: barra de ícones fixa no rodapé (abaixo da
 *  barra de chat). 4 views à esquerda + Loja (ação) + menu sanduíche
 *  (Configurações + Debug) sempre por último, à direita de tudo. */
export function BottomNav({ currentView, onNavigate, onResetOnboarding, onOpenCredits, language = 'en-US' }: BottomNavProps) {
  const isPt = language === 'pt-BR';
  const [menuOpen, setMenuOpen] = useState(false);

  // Torneio mora dentro de Atividades
  // (junto dos minigames); Estatísticas mora dentro de Evolução (aba interna
  // — ver App.tsx). Só views de verdade viram "abas" coloridas-quando-ativas;
  // Loja e o menu sanduíche são AÇÕES (cor neutra fixa), agrupadas à direita.
  const items: { view: ViewType; label: string; icon: string }[] = [
    { view: 'main', label: isPt ? 'Início' : 'Home', icon: iconHome },
    { view: 'games', label: isPt ? 'Atividades' : 'Activities', icon: iconActivities },
    { view: 'evolution', label: isPt ? 'Evolução' : 'Evolution', icon: iconEvolution },
    { view: 'library', label: isPt ? 'Biblioteca' : 'Library', icon: iconBook },
  ];
  const menuActive = menuOpen || currentView === 'settings';

  return (
    <nav className="sm-bottom-nav">
      {items.map(({ view, label, icon }) => {
        const active = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            aria-label={label}
            className="sm-bottom-nav-btn"
          >
            <NavIcon src={icon} alt={label} active={active} />
          </button>
        );
      })}
      <button
        onClick={() => onNavigate('shop')}
        aria-label={isPt ? 'Loja' : 'Shop'}
        title={isPt ? 'Loja' : 'Shop'}
        className="sm-bottom-nav-btn"
      >
        <NavIcon src={iconCoin} alt={isPt ? 'Loja' : 'Shop'} active={currentView === 'shop'} />
      </button>

      {/* Menu sanduíche — sempre por último (à direita de tudo). Agrega
          Configurações + Recomeçar num popover, em vez de dois botões soltos. */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', height: '100%' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label={isPt ? 'Menu' : 'Menu'}
          title={isPt ? 'Menu' : 'Menu'}
          className="sm-bottom-nav-btn"
          style={{ width: '100%' }}
        >
          <NavIcon src={iconMenu} alt={isPt ? 'Menu' : 'Menu'} active={menuActive} />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop transparente — fecha o popover ao tocar fora dele. */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 60 }}
            />
            <div
              style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                minWidth: 190, background: 'var(--sm-surface)', border: '1px solid var(--sm-line)',
                borderRadius: 14, boxShadow: '0 10px 28px rgba(42,36,64,0.2)', overflow: 'hidden', zIndex: 61,
              }}
            >
              {onOpenCredits && (
                <button
                  onClick={() => { onOpenCredits(); setMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
                    background: 'transparent', border: 'none',
                    color: 'var(--sm-ink)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <img src={iconGem} alt="" width={17} height={17} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  {isPt ? 'Créditos' : 'Credits'}
                </button>
              )}
              <button
                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
                  background: currentView === 'settings' ? 'var(--sm-bg)' : 'transparent', border: 'none',
                  borderTop: onOpenCredits ? '1px solid var(--sm-line)' : 'none',
                  color: 'var(--sm-ink)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <img src={iconGear} alt="" width={17} height={17} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                {isPt ? 'Configurações' : 'Settings'}
              </button>
              {onResetOnboarding && (
                <button
                  onClick={() => { onResetOnboarding(); setMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
                    background: 'transparent', border: 'none', borderTop: '1px solid var(--sm-line)',
                    color: 'var(--sm-ink)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <img src={iconReset} alt="" width={17} height={17} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  {isPt ? 'Refazer o ritual' : 'Redo the ritual'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
