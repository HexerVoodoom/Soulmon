import React from 'react';
import svgPaths from '../imports/svg-hfvoappsgk';
import { TestTube2 } from 'lucide-react';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  theme?: 'default' | 'win98' | 'glitch';
  onResetOnboarding?: () => void;
}

// Home Icon
function HomeIcon() {
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute bottom-[12.5%] left-[37.5%] right-[37.5%] top-1/2">
        <div className="absolute inset-[-8.33%_-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24897 8.74856">
            <path d={svgPaths.p221ad280} stroke="#101828" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[8.33%_12.5%_12.5%_12.5%]">
        <div className="absolute inset-[-3.95%_-4.17%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.2473 17.0809">
            <path d={svgPaths.p2b44b080} stroke="#101828" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Evolution Icon (pencil/edit) - usado no botão debug quando ativo
function EvolutionIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? '#9810FA' : '#6A7282';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute inset-[12.5%_12.5%_8.34%_8.34%]">
        <div className="absolute inset-[-3.95%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.0787 17.0787">
            <path d={svgPaths.p38aea500} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[8.33%_8.33%_66.66%_66.67%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.padf4f00} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[33.33%] left-[16.67%] right-1/2 top-[66.67%]">
        <div className="absolute inset-[-0.62px_-9.38%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.91536 1.24979">
            <path d="M7.29046 0.624897H0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Branches Icon
function BranchesIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? '#101828' : '#6A7282';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute bottom-[37.5%] left-1/4 right-3/4 top-[12.5%]">
        <div className="absolute inset-[-6.25%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 11.2481">
            <path d="M0.624897 0.624897V10.6232" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[12.5%_12.5%_62.5%_62.5%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.p7347300} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[62.5%_62.5%_12.5%_12.5%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.p7347300} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/4 left-[37.5%] right-1/4 top-[37.5%]">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.74856 8.74856">
            <path d={svgPaths.pb325a00} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Stats Icon (bar chart)
function StatsIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? '#101828' : '#6A7282';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute inset-[12.5%]">
        <div className="absolute inset-[-4.17%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.2473 16.2473">
            <path d={svgPaths.p2dd35100} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[29.17%] left-3/4 right-1/4 top-[37.5%]">
        <div className="absolute inset-[-9.38%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 7.91536">
            <path d="M0.624897 7.29046V0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[20.83%_45.83%_29.17%_54.17%]">
        <div className="absolute inset-[-6.25%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 11.2481">
            <path d="M0.624897 10.6232V0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[58.33%_66.67%_29.16%_33.33%]">
        <div className="absolute inset-[-25%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 3.74979">
            <path d="M0.624897 3.1249V0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Settings Icon
function SettingsIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? '#101828' : '#6A7282';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute inset-[8.41%_12.68%]">
        <div className="absolute inset-[-3.76%_-4.19%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.1746 17.8838">
            <path d={svgPaths.p29134400} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[37.5%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.p7347300} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
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

  // Default theme - usa o design do Figma
  return (
    <div className="bg-white content-stretch flex flex-col items-start justify-center px-[12px] py-[8px] relative w-full">
      <div aria-hidden="true" className="absolute border-[#c0c0c0] border-[0px_0px_1.098px] border-solid inset-0 pointer-events-none" />
      
      <div className="h-[61.962px] relative shrink-0 w-full">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center justify-between relative size-full">
            
            {/* Left: Home Button (always gray background) */}
            <div className="h-[61.962px] relative shrink-0 w-[127.56px]">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[23.993px] items-center relative size-full">
                <button
                  onClick={() => onNavigate('main')}
                  aria-label="Início"
                  className="bg-[#e5e7eb] relative rounded-[14px] shrink-0 size-[39.993px] transition-all"
                >
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                    <HomeIcon />
                  </div>
                </button>
                <div className="h-[61.962px] relative shrink-0 w-[63.574px]">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                    <div className="h-[23.993px] shrink-0 w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Debug Button (purple when active, shows evolution icon) */}
            {onResetOnboarding && (
              <button
                onClick={onResetOnboarding}
                aria-label="Modo Debug"
                className="bg-[#f3e8ff] relative rounded-[14px] shrink-0 size-[39.993px] transition-all"
                title="Debug Mode"
              >
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <TestTube2 size={20} className="text-[#9810FA]" strokeWidth={1.5} />
                </div>
              </button>
            )}

            {/* Right: 4 buttons grouped (Branch, Stats, Config, and a spacer for Debug) */}
            <div className="h-[39.993px] relative shrink-0 flex gap-[5.985px] items-start">
              
              {/* Branches */}
              <button
                onClick={() => onNavigate('evolution')}
                aria-label="Evolução"
                className={`relative rounded-[14px] shrink-0 size-[39.993px] transition-all ${
                  currentView === 'evolution' ? 'bg-[#e5e7eb]' : 'bg-white'
                }`}
              >
                {currentView !== 'evolution' && (
                  <div aria-hidden="true" className="absolute border border-[#c0c0c0] border-solid inset-0 pointer-events-none rounded-[14px]" />
                )}
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <BranchesIcon isActive={currentView === 'evolution'} />
                </div>
              </button>

              {/* Stats */}
              <button
                onClick={() => onNavigate('stats')}
                aria-label="Estatísticas"
                className={`relative rounded-[14px] shrink-0 size-[39.993px] transition-all ${
                  currentView === 'stats' ? 'bg-[#e5e7eb]' : 'bg-white'
                }`}
              >
                {currentView !== 'stats' && (
                  <div aria-hidden="true" className="absolute border border-[#c0c0c0] border-solid inset-0 pointer-events-none rounded-[14px]" />
                )}
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <StatsIcon isActive={currentView === 'stats'} />
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={() => onNavigate('settings')}
                aria-label="Configurações"
                className={`relative rounded-[14px] shrink-0 size-[39.993px] transition-all ${
                  currentView === 'settings' ? 'bg-[#e5e7eb]' : 'bg-white'
                }`}
              >
                {currentView !== 'settings' && (
                  <div aria-hidden="true" className="absolute border border-[#c0c0c0] border-solid inset-0 pointer-events-none rounded-[14px]" />
                )}
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <SettingsIcon isActive={currentView === 'settings'} />
                </div>
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
