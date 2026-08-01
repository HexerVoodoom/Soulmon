import { useState } from 'react';
import { Home, Gamepad2, GitBranch, Menu, ShoppingBag, Users, Settings, RotateCcw, Gem } from 'lucide-react';
import type { Language } from '../utils/i18n';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  theme?: 'default' | 'win98' | 'glitch';
  onResetOnboarding?: () => void;
  /** Loja — não é uma view (fica fora do minigame): abre como modal por cima da tela atual. */
  onOpenShop?: () => void;
  /** Créditos (monetização) — modal próprio, dentro do menu sanduíche. */
  onOpenCredits?: () => void;
  language?: Language;
}

/** Navegação principal do app: barra de ícones fixa no rodapé (abaixo da
 *  barra de chat). No tema win98 mantém o menubar clássico no topo. Tema
 *  padrão: 4 views à esquerda + Loja (ação) + menu sanduíche (Configurações
 *  + Debug) sempre por último, à direita de tudo. */
export function BottomNav({ currentView, onNavigate, theme = 'default', onResetOnboarding, onOpenShop, onOpenCredits, language = 'en-US' }: BottomNavProps) {
  const isPt = language === 'pt-BR';
  const [menuOpen, setMenuOpen] = useState(false);

  // Win98 theme - mantém o layout antigo (menubar no topo)
  if (theme === 'win98') {
    return (
      <div className="win98-header">
        <div className="win98-menubar">
          <button className={`win98-menu-item ${currentView === 'main' ? 'active' : ''}`} onClick={() => onNavigate('main')}>
            Home
          </button>
          <button className={`win98-menu-item ${currentView === 'evolution' ? 'active' : ''}`} onClick={() => onNavigate('evolution')}>
            Evolution
          </button>
          <button className={`win98-menu-item ${currentView === 'stats' ? 'active' : ''}`} onClick={() => onNavigate('stats')}>
            Stats
          </button>
          <button className={`win98-menu-item ${currentView === 'games' ? 'active' : ''}`} onClick={() => onNavigate('games')}>
            Games
          </button>
          <button className={`win98-menu-item ${currentView === 'oracle' ? 'active' : ''}`} onClick={() => onNavigate('oracle')}>
            Oracle
          </button>
          <button className={`win98-menu-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => onNavigate('settings')}>
            Settings
          </button>
          {onResetOnboarding && (
            <button className="win98-menu-item" onClick={onResetOnboarding}>
              <RotateCcw size={14} />
              {isPt ? 'Recomeçar' : 'Start over'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Tema padrão — Soulmon design system. Torneio mora dentro de Atividades
  // (junto dos minigames); Estatísticas mora dentro de Evolução (aba interna
  // — ver App.tsx). Só views de verdade viram "abas" coloridas-quando-ativas;
  // Loja e o menu sanduíche são AÇÕES (cor neutra fixa), agrupadas à direita.
  const items: { view: ViewType; label: string; Icon: typeof Home; color: string }[] = [
    { view: 'main', label: isPt ? 'Início' : 'Home', Icon: Home, color: '#e0483e' },
    { view: 'games', label: isPt ? 'Atividades' : 'Activities', Icon: Gamepad2, color: '#8b5cf6' },
    { view: 'evolution', label: isPt ? 'Evolução' : 'Evolution', Icon: GitBranch, color: '#22A900' },
    { view: 'library', label: isPt ? 'Biblioteca' : 'Library', Icon: Users, color: '#009ED8' },
  ];
  const menuActive = menuOpen || currentView === 'settings';

  return (
    <nav className="sm-bottom-nav">
      {items.map(({ view, label, Icon, color }) => {
        const active = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            aria-label={label}
            className="sm-bottom-nav-btn"
            style={{ color: active ? color : 'var(--sm-muted)', background: active ? 'var(--sm-bg)' : 'transparent' }}
          >
            <Icon size={22} strokeWidth={2.2} />
          </button>
        );
      })}
      {onOpenShop && (
        <button
          onClick={onOpenShop}
          aria-label={isPt ? 'Loja' : 'Shop'}
          title={isPt ? 'Loja' : 'Shop'}
          className="sm-bottom-nav-btn"
          style={{ color: 'var(--sm-muted)' }}
        >
          <ShoppingBag size={21} strokeWidth={2.2} />
        </button>
      )}

      {/* Menu sanduíche — sempre por último (à direita de tudo). Agrega
          Configurações + Recomeçar num popover, em vez de dois botões soltos. */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', height: '100%' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label={isPt ? 'Menu' : 'Menu'}
          title={isPt ? 'Menu' : 'Menu'}
          className="sm-bottom-nav-btn"
          style={{ color: menuActive ? 'var(--sm-primary)' : 'var(--sm-muted)', background: menuActive ? 'var(--sm-bg)' : 'transparent', width: '100%' }}
        >
          <Menu size={22} strokeWidth={2.2} />
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
                  <Gem size={17} strokeWidth={2.2} color="var(--sm-muted)" />
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
                <Settings size={17} strokeWidth={2.2} color="var(--sm-muted)" />
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
                  <RotateCcw size={17} strokeWidth={2.2} color="#e0483e" />
                  {isPt ? 'Recomeçar do zero' : 'Start over'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
