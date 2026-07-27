import { useEffect, useRef, useState } from 'react';
import { TestTube2, Home, Gamepad2, GitBranch, BarChart3, Settings, Swords, Users, Sparkles, Rabbit, Scissors } from 'lucide-react';
import type { Language } from '../utils/i18n';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library';
type GameKey = 'dungeon' | 'dino' | 'rps';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  theme?: 'default' | 'win98' | 'glitch';
  onResetOnboarding?: () => void;
  onOpenGame?: (game: GameKey) => void;
  language?: Language;
}

export function Header({ currentView, onNavigate, theme = 'default', onResetOnboarding, onOpenGame, language = 'en-US' }: HeaderProps) {
  const isPt = language === 'pt-BR';
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)
      ) setMenuOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const toggleMenu = () => {
    if (!menuOpen && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setMenuOpen(o => !o);
  };

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

  // Tema padrão — Soulmon design system (moderno, minimalista). Home e
  // Atividades ficam sempre visíveis (uso mais frequente); o resto vive
  // agrupado atrás do ícone-logo do app, que expande um painel.
  const primaryItems: { view: ViewType; label: string; Icon: typeof Home; color: string; bg: string }[] = [
    { view: 'games', label: isPt ? 'Atividades' : 'Activities', Icon: Gamepad2, color: '#8b5cf6', bg: '#f3e8ff' },
  ];
  const groupedItems: { view: ViewType; label: string; Icon: typeof Home; color: string; bg: string }[] = [
    { view: 'evolution', label: isPt ? 'Evolução' : 'Evolution', Icon: GitBranch, color: '#22A900', bg: '#eafbe6' },
    { view: 'tournament', label: isPt ? 'Torneio' : 'Tournament', Icon: Swords, color: '#e0483e', bg: '#fde8e6' },
    { view: 'library', label: isPt ? 'Biblioteca' : 'Library', Icon: Users, color: '#009ED8', bg: '#e3f4fc' },
    { view: 'stats', label: isPt ? 'Estatísticas' : 'Stats', Icon: BarChart3, color: '#d9a441', bg: '#fbf1dd' },
    { view: 'settings', label: isPt ? 'Configurações' : 'Settings', Icon: Settings, color: '#6b7280', bg: '#eef0f3' },
  ];
  const gameItems: { key: GameKey; label: string; Icon: typeof Swords; color: string }[] = [
    { key: 'dungeon', label: isPt ? 'Masmorra' : 'Dungeon', Icon: Swords, color: '#8b5cf6' },
    { key: 'dino', label: isPt ? 'Dino' : 'Dino', Icon: Rabbit, color: '#22A900' },
    { key: 'rps', label: isPt ? 'Pedra/Papel' : 'Rock/Paper', Icon: Scissors, color: '#E69600' },
  ];
  const HOME_COLOR = '#e0483e', HOME_BG = '#fde8e6';

  return (
    <nav className="sm-nav" style={{ position: 'relative' }}>
      <button
        onClick={() => onNavigate('main')}
        aria-label={isPt ? 'Início' : 'Home'}
        className="sm-nav-btn"
        style={{
          background: currentView === 'main' ? HOME_BG : 'var(--sm-surface)',
          color: HOME_COLOR,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Home size={22} strokeWidth={2.2} />
      </button>

      <div className="sm-nav-group">
        {primaryItems.map(({ view, label, Icon, color, bg }) => (
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

      <div style={{ marginLeft: 'auto' }}>
        <button
          ref={menuBtnRef}
          onClick={toggleMenu}
          aria-label={isPt ? 'Menu Soulmon' : 'Soulmon menu'}
          aria-expanded={menuOpen}
          className="sm-nav-btn"
          style={{
            background: 'var(--sm-primary-soft)',
            color: 'var(--sm-primary)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <Sparkles size={22} strokeWidth={2.2} />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className="sm-card"
            style={{
              position: 'fixed',
              top: menuPos.top,
              right: menuPos.right,
              zIndex: 50,
              padding: 10,
              width: 240,
            }}
          >
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--sm-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 4px 6px' }}>
              {isPt ? 'Páginas' : 'Pages'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {groupedItems.map(({ view, label, Icon, color, bg }) => (
                <button
                  key={view}
                  onClick={() => { onNavigate(view); setMenuOpen(false); }}
                  aria-label={label}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl min-w-0"
                  style={{
                    padding: '8px 4px',
                    background: currentView === view ? bg : 'var(--sm-bg)',
                    color,
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} />
                  <span className="break-words" style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--sm-ink)', lineHeight: 1.1, textAlign: 'center' }}>
                    {label}
                  </span>
                </button>
              ))}
              {onResetOnboarding && (
                <button
                  onClick={() => { onResetOnboarding(); setMenuOpen(false); }}
                  aria-label="Debug"
                  className="flex flex-col items-center justify-center gap-1 rounded-xl min-w-0"
                  style={{ padding: '8px 4px', background: 'var(--sm-bg)', color: 'var(--sm-primary)' }}
                >
                  <TestTube2 size={20} strokeWidth={2.2} />
                  <span className="break-words" style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--sm-ink)', lineHeight: 1.1 }}>
                    Debug
                  </span>
                </button>
              )}
            </div>

            {onOpenGame && (
              <>
                <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--sm-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '10px 4px 6px' }}>
                  {isPt ? 'Minijogos' : 'Minigames'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {gameItems.map(({ key, label, Icon, color }) => (
                    <button
                      key={key}
                      onClick={() => { onOpenGame(key); setMenuOpen(false); }}
                      aria-label={label}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl min-w-0"
                      style={{ padding: '8px 4px', background: 'var(--sm-bg)', color }}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                      <span className="break-words" style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--sm-ink)', lineHeight: 1.1, textAlign: 'center' }}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
