import React from 'react';
import { TestTube2, Home, Gamepad2, Sparkles, GitBranch, BarChart3, Settings, Swords, Users } from 'lucide-react';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library';

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

  // Tema padrão — Soulmon design system (moderno, minimalista). Cada ícone
  // tem uma cor de identidade própria (como na referência), inclusive
  // inativo — só o fundo ganha o tom mais forte quando está selecionado.
  const items: { view: ViewType; label: string; Icon: typeof Home; color: string; bg: string }[] = [
    { view: 'games', label: 'Atividades', Icon: Gamepad2, color: '#8b5cf6', bg: '#f3e8ff' },
    { view: 'evolution', label: 'Evolução', Icon: GitBranch, color: '#22A900', bg: '#eafbe6' },
    { view: 'tournament', label: 'Torneio', Icon: Swords, color: '#e0483e', bg: '#fde8e6' },
    { view: 'library', label: 'Biblioteca', Icon: Users, color: '#009ED8', bg: '#e3f4fc' },
    { view: 'stats', label: 'Estatísticas', Icon: BarChart3, color: '#d9a441', bg: '#fbf1dd' },
    { view: 'settings', label: 'Configurações', Icon: Settings, color: '#6b7280', bg: '#eef0f3' },
  ];
  const HOME_COLOR = '#e0483e', HOME_BG = '#fde8e6';

  return (
    <nav className="sm-nav">
      <button
        onClick={() => onNavigate('main')}
        aria-label="Início"
        className="sm-nav-btn"
        style={{
          background: currentView === 'main' ? HOME_BG : 'var(--sm-surface)',
          color: HOME_COLOR,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Home size={22} strokeWidth={2.2} />
      </button>

      {onResetOnboarding && (
        <button
          onClick={onResetOnboarding}
          aria-label="Modo Debug"
          title="Debug Mode"
          className="sm-nav-btn"
          style={{ background: 'var(--sm-surface)', color: 'var(--sm-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <TestTube2 size={20} strokeWidth={2} />
        </button>
      )}

      <div className="sm-nav-group">
        {items.map(({ view, label, Icon, color, bg }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            aria-label={label}
            className="sm-nav-btn"
            style={{
              background: currentView === view ? bg : 'var(--sm-surface)',
              color,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <Icon size={22} strokeWidth={2.2} />
          </button>
        ))}
      </div>
    </nav>
  );
}
