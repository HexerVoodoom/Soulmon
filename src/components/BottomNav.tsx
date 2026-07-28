import { Home, Gamepad2, GitBranch, BarChart3, ShoppingBag, Users, TestTube2 } from 'lucide-react';
import type { Language } from '../utils/i18n';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  theme?: 'default' | 'win98' | 'glitch';
  onResetOnboarding?: () => void;
  /** Loja — não é uma view (fica fora do minigame): abre como modal por cima da tela atual. */
  onOpenShop?: () => void;
  language?: Language;
}

/** Navegação principal do app: barra de ícones fixa no rodapé (abaixo da
 *  barra de chat), todos os itens sempre visíveis — nada colapsado atrás de
 *  um menu único. No tema win98 mantém o menubar clássico no topo. */
export function BottomNav({ currentView, onNavigate, theme = 'default', onResetOnboarding, onOpenShop, language = 'en-US' }: BottomNavProps) {
  const isPt = language === 'pt-BR';

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
              <TestTube2 size={14} />
              Debug
            </button>
          )}
        </div>
      </div>
    );
  }

  // Tema padrão — Soulmon design system. Barra fixa no rodapé, todos os
  // ícones abertos (sem menu colapsado atrás de um único ícone). Torneio
  // mora dentro de Atividades (junto dos minigames); Loja e Configurações
  // não são views — Loja abre por cima da tela atual, Configurações vira
  // um ícone fixo no canto superior direito (ver App.tsx).
  const items: { view: ViewType; label: string; Icon: typeof Home; color: string }[] = [
    { view: 'main', label: isPt ? 'Início' : 'Home', Icon: Home, color: '#e0483e' },
    { view: 'games', label: isPt ? 'Atividades' : 'Activities', Icon: Gamepad2, color: '#8b5cf6' },
    { view: 'evolution', label: isPt ? 'Evolução' : 'Evolution', Icon: GitBranch, color: '#22A900' },
    { view: 'library', label: isPt ? 'Biblioteca' : 'Library', Icon: Users, color: '#009ED8' },
    { view: 'stats', label: isPt ? 'Estatísticas' : 'Stats', Icon: BarChart3, color: '#d9a441' },
  ];

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
          style={{ color: '#d9a441' }}
        >
          <ShoppingBag size={22} strokeWidth={2.2} />
        </button>
      )}
      {onResetOnboarding && (
        <button
          onClick={onResetOnboarding}
          aria-label="Debug"
          title="Debug Mode"
          className="sm-bottom-nav-btn"
          style={{ color: 'var(--sm-primary)' }}
        >
          <TestTube2 size={20} strokeWidth={2.2} />
        </button>
      )}
    </nav>
  );
}
