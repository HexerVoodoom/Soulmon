import React from 'react';
import { TestTube2, Home, Gamepad2, Sparkles, GitBranch, BarChart3, Settings } from 'lucide-react';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  theme?: 'default' | 'win98' | 'glitch';
  onResetOnboarding?: () => void;
}

export function Header({ currentView, onNavigate, theme = 'default', onResetOnboarding }: HeaderProps) {
  // Win98 theme - mantém o layout antigo
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

  // Tema padrão — Soulmon design system (moderno, minimalista)
  const items: { view: ViewType; label: string; Icon: typeof Home }[] = [
    { view: 'games', label: 'Atividades', Icon: Gamepad2 },
    { view: 'evolution', label: 'Evolução', Icon: GitBranch },
    { view: 'stats', label: 'Estatísticas', Icon: BarChart3 },
    { view: 'settings', label: 'Configurações', Icon: Settings },
  ];

  return (
    <nav className="sm-nav">
      <button
        onClick={() => onNavigate('main')}
        aria-label="Início"
        className={`sm-nav-btn ${currentView === 'main' ? 'active' : ''}`}
      >
        <Home size={22} strokeWidth={2.2} />
      </button>

      {onResetOnboarding && (
        <button
          onClick={onResetOnboarding}
          aria-label="Modo Debug"
          title="Debug Mode"
          className="sm-nav-btn"
        >
          <TestTube2 size={20} strokeWidth={2} />
        </button>
      )}

      <div className="sm-nav-group">
        {items.map(({ view, label, Icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            aria-label={label}
            className={`sm-nav-btn ${currentView === view ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={2.2} />
          </button>
        ))}
      </div>
    </nav>
  );
}
