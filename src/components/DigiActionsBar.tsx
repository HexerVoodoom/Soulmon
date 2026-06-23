import { Language } from '../utils/i18n';

interface DigiActionsBarProps {
  onOpenItems: () => void;
  onBath: () => void;
  onSleep: () => void;
  canBath: boolean;
  isSleeping: boolean;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
}

export function DigiActionsBar({
  onOpenItems,
  onBath,
  onSleep,
  canBath,
  isSleeping,
  language,
  theme = 'default',
}: DigiActionsBarProps) {
  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  const actions = [
    {
      icon: '📁',
      labelEn: 'Items',
      labelPt: 'Itens',
      onClick: onOpenItems,
      disabled: false,
      active: false,
    },
    {
      icon: '🚿',
      labelEn: 'Bath',
      labelPt: 'Banho',
      onClick: onBath,
      disabled: !canBath,
      active: false,
    },
    {
      icon: isSleeping ? '☀️' : '💤',
      labelEn: isSleeping ? 'Wake' : 'Sleep',
      labelPt: isSleeping ? 'Acordar' : 'Dormir',
      onClick: onSleep,
      disabled: false,
      active: isSleeping,
    },
  ];

  return (
    <div
      className="flex items-start justify-center gap-1 py-1"
      style={isWin98 ? { borderTop: '1.5px solid #808080' } : { borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      {actions.map(action => (
        <button
          key={action.labelEn}
          onClick={action.disabled ? undefined : action.onClick}
          disabled={action.disabled}
          title={
            action.labelEn === 'Bath' && !canBath
              ? (isPt ? 'Energia cheia necessária' : 'Full energy required')
              : isPt ? action.labelPt : action.labelEn
          }
          className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px] select-none transition-all ${
            action.disabled
              ? 'opacity-40 cursor-not-allowed'
              : `cursor-pointer ${isWin98 ? 'hover:bg-[#000080]/10' : isGlitch ? 'hover:bg-[#00ffff]/10' : 'hover:bg-white/10'} active:scale-95`
          }`}
          style={
            isWin98 && action.active
              ? { border: '1.5px solid', borderColor: '#808080 #ffffff #ffffff #808080', backgroundColor: '#b8b8b8' }
              : isWin98
              ? { border: '1.5px solid transparent' }
              : action.active
              ? { borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.12)' }
              : undefined
          }
        >
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{action.icon}</span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              lineHeight: 1.2,
              color: isGlitch ? '#00ffff' : isWin98 ? '#000' : 'rgba(255,255,255,0.75)',
            }}
          >
            {isPt ? action.labelPt : action.labelEn}
          </span>
        </button>
      ))}
    </div>
  );
}
