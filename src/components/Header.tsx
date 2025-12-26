import { Home, GitBranch, BarChart3, Settings, TestTube2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentView: 'main' | 'evolution' | 'stats' | 'settings';
  onNavigate: (view: 'main' | 'evolution' | 'stats' | 'settings') => void;
  onResetOnboarding?: () => void; // New prop for onboarding reset
  theme?: 'default' | 'win98' | 'glitch';
}

export function Header({ title, subtitle, currentView, onNavigate, onResetOnboarding, theme = 'default' }: HeaderProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  
  return (
    <div className={isGlitch ? 'glitch-header' : isWin98 ? 'win98-header' : 'modern-header'}>
      {/* Glitch/Win98 Menu Bar */}
      {(isGlitch || isWin98) && (
        <div className={isGlitch ? 'glitch-menubar' : 'win98-menubar'}>
          <button 
            className={`${isGlitch ? 'glitch-menu-item' : 'win98-menu-item'} ${currentView === 'main' ? 'active' : ''}`}
            onClick={() => onNavigate('main')}
          >
            <Home size={14} />
            Home
          </button>
          <button 
            className={`${isGlitch ? 'glitch-menu-item' : 'win98-menu-item'} ${currentView === 'evolution' ? 'active' : ''}`}
            onClick={() => onNavigate('evolution')}
          >
            <GitBranch size={14} />
            Evolution
          </button>
          <button 
            className={isGlitch ? 'glitch-menu-item' : 'win98-menu-item'}
            onClick={() => onNavigate('stats')}
          >
            <BarChart3 size={14} />
            Stats
          </button>
          <button 
            className={isGlitch ? 'glitch-menu-item' : 'win98-menu-item'}
            onClick={() => onNavigate('settings')}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      )}
      
      {theme === 'default' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => onNavigate('main')}
                className={`p-2.5 rounded-xl transition-all ${
                  currentView === 'main' 
                    ? 'bg-gray-200 text-gray-900' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Home"
              >
                <Home size={20} strokeWidth={1.5} />
              </button>
              
              <div>
                <h1 className="text-gray-900 tracking-tight">{title}</h1>
                {subtitle && <p className="text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>

            {/* Debug Onboarding Button - Centered */}
            {import.meta.env.DEV && onResetOnboarding && (
              <button
                onClick={onResetOnboarding}
                className="p-2.5 rounded-xl transition-all bg-purple-100 text-purple-600 hover:bg-purple-200"
                aria-label="Reset Onboarding (Debug)"
                title="Reset Onboarding (Debug)"
              >
                <TestTube2 size={20} strokeWidth={1.5} />
              </button>
            )}
            
            <div className="flex gap-1.5">
              <button
                onClick={() => onNavigate('evolution')}
                className={`p-2.5 rounded-xl transition-all ${
                  currentView === 'evolution' 
                    ? 'bg-gray-200 text-gray-900' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Digivolution Path"
              >
                <GitBranch size={20} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => onNavigate('stats')}
                className="p-2.5 rounded-xl transition-all bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Estatísticas"
              >
                <BarChart3 size={20} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                className="p-2.5 rounded-xl transition-all bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Settings"
              >
                <Settings size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Glitch/Win98 Title Section */}
      {(isGlitch || isWin98) && (
        <div className={`px-2 py-2 ${isGlitch ? 'bg-[#0a0a0a]' : 'bg-[#c0c0c0]'}`}>
          <div className={`${isGlitch ? 'glitch-activity-card' : 'win98-activity-card'} px-3 py-2`}>
            <h1 className={isGlitch ? 'glitch-title' : 'win98-title'}>{title}</h1>
            {subtitle && (
              <p className={`${isGlitch ? 'glitch-subtitle' : 'win98-subtitle'} mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}