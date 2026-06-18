import { useState, useEffect } from 'react';
import imgUiTBg01 from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import imgImage69 from "figma:asset/7b96e3369daf15ffc8ed062b986db273c0416930.png";
import digiEggSprite from 'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png';
import imgContainer from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";
import { CreateModal } from './CreateModal';
import { EggSelection, EggType } from './EggSelection';
import { ActivityCategory } from '../types/attributes';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingScreenProps {
  onComplete: (data: {
    userName: string;
    eggType: EggType;
    firstItem: {
      type: 'task' | 'activity';
      name: string;
      category: ActivityCategory;
      emoji: string;
      steps?: Step[];
      weekDays?: number[];
      deadline?: { date: string; time: string };
      alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string } | { time: string };
    };
  }) => void;
}

const INTRO_TEXTS = [
  'Welcome to DigiApp! Soon you will meet your digital partner who will help you achieve your goals.',
  'As you complete tasks and activities, they will grow with you. Your choices directly impact your partner.',
  'Your destiny and your partner\'s destiny are in your hands!',
];

const EGG_FILTERS: Record<string, string> = {
  veemon: 'hue-rotate(200deg) saturate(1.5)',
  salamon: 'hue-rotate(300deg) saturate(1.3) brightness(1.1)',
};

const EGG_GLOW: Record<string, string> = {
  agumon: 'rgba(255,255,255,0.35)',
  veemon: 'rgba(74,144,226,0.45)',
  salamon: 'rgba(255,182,193,0.45)',
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'name' | 'egg' | 'intro' | 'create'>('name');
  const [introIndex, setIntroIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedEgg, setSelectedEgg] = useState<EggType | null>(null);
  const [previewedEgg, setPreviewedEgg] = useState<EggType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [squashFrame, setSquashFrame] = useState(0);

  // Anti-autofill trick
  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  const [randomName] = useState(`obs-${Math.random().toString(36).substring(7)}`);

  // Squash/stretch animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSquashFrame(prev => (prev + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getSquashScale = () => squashFrame === 0 ? 0.9 : 1.0;

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setStep('egg');
    }
  };

  const handleEggConfirm = (egg: EggType) => {
    setSelectedEgg(egg);
    setStep('intro');
  };

  const handleIntroNext = () => {
    if (introIndex < INTRO_TEXTS.length - 1) {
      setIntroIndex(introIndex + 1);
    } else {
      setStep('create');
      setShowCreateModal(true);
    }
  };

  const handleCreateTask = (data: {
    name: string;
    category: string;
    emoji: string;
    steps?: Step[];
    deadline?: { date: string; time: string };
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
  }) => {
    onComplete({
      userName,
      eggType: selectedEgg as EggType,
      firstItem: {
        type: 'task',
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        steps: data.steps,
        deadline: data.deadline,
        alarm: data.alarm,
      },
    });
  };

  const handleCreateActivity = (data: {
    name: string;
    category: string;
    emoji: string;
    steps: Step[];
    weekDays: number[];
    alarm?: { time: string };
  }) => {
    onComplete({
      userName,
      eggType: selectedEgg as EggType,
      firstItem: {
        type: 'activity',
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        steps: data.steps,
        weekDays: data.weekDays,
        alarm: data.alarm,
      },
    });
  };

  // Which egg to show in the preview window
  const displayEgg = previewedEgg ?? selectedEgg;
  const eggFilter = displayEgg ? (EGG_FILTERS[displayEgg] ?? 'none') : 'none';
  const eggGlow = displayEgg ? EGG_GLOW[displayEgg] : undefined;

  return (
    <div className="relative w-full min-h-screen bg-[#0a2f1a] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <img alt="" className="w-full h-full object-cover" src={imgUiTBg01} />
      </div>

      {/* Scrollable content — allows layout to breathe on small screens */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-8 max-w-md mx-auto w-full gap-6">

        {/* Top Content Area */}
        <div className="w-full flex-1 flex items-center justify-center pt-8">
          {step === 'name' && (
            <div className="w-full space-y-4 max-w-[280px]">
              <div className="w-full">
                <div className="bg-[#0d1420] relative rounded-xl w-full">
                  <input
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    spellCheck="false"
                    autoCapitalize="off"
                    name={randomName}
                    id={randomName}
                    readOnly={isInputReadOnly}
                    onFocus={() => setIsInputReadOnly(false)}
                    onBlur={() => setIsInputReadOnly(true)}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    maxLength={30}
                    placeholder="enter your name"
                    className="w-full px-6 py-3 bg-transparent text-white text-center border-0 outline-none placeholder-[#4a5568] rounded-[inherit]"
                    style={{
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.875rem',
                      letterSpacing: '0.02em',
                    }}
                    autoFocus
                  />
                  <div
                    aria-hidden="true"
                    className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl"
                  />
                </div>
              </div>

              <div className="w-full flex justify-center">
                <button
                  onClick={handleNameSubmit}
                  disabled={!userName.trim()}
                  className="bg-[#00ff99] rounded-xl px-10 py-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                  style={{
                    fontFamily: 'Consolas, monospace',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#000',
                    letterSpacing: '0.05em',
                  }}
                >
                  continue
                </button>
              </div>
            </div>
          )}

          {step === 'egg' && (
            <div className="w-full max-w-[320px]">
              <div className="bg-[#0d1420] relative rounded-xl w-full">
                <EggSelection
                  onSelect={handleEggConfirm}
                  onPreview={setPreviewedEgg}
                />
                <div
                  aria-hidden="true"
                  className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl"
                />
              </div>
            </div>
          )}

          {step === 'intro' && (
            <div className="w-full space-y-4 max-w-[320px]">
              <div className="bg-[#0d1420] relative rounded-xl w-full">
                <div className="px-6 py-8 min-h-[200px] flex items-center justify-center">
                  <p
                    className="text-[#d0d0d0] text-center"
                    style={{
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {INTRO_TEXTS[introIndex]}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl"
                />
              </div>

              <div className="w-full flex justify-center">
                <button
                  onClick={handleIntroNext}
                  className="bg-[#00ff99] rounded-xl px-10 py-3 transition-all hover:brightness-110 active:scale-95"
                  style={{
                    fontFamily: 'Consolas, monospace',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#000',
                    letterSpacing: '0.05em',
                  }}
                >
                  continue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Egg Preview Window — always visible at bottom */}
        <div className="relative w-full max-w-[200px] mx-auto flex-shrink-0 pb-4">
          {/* Outer Grey Border Container */}
          <div className="bg-[#6a7282] rounded-[28px] p-3 shadow-lg">
            {/* Inner Container Window */}
            <div className="relative w-full aspect-square overflow-hidden rounded-xl">
              {/* Background */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-xl">
                <img alt="" className="absolute max-w-none object-cover rounded-xl size-full" src={imgContainer} />
                <div className="absolute bg-gradient-to-b from-[#cdded4] inset-0 rounded-xl to-[#cfcfcf]" />
              </div>

              {/* Dark Inner Border */}
              <div aria-hidden="true" className="absolute border-[#1f2a39] border-[3px] border-solid inset-0 pointer-events-none rounded-xl" />

              {/* Egg glow when one is selected */}
              {eggGlow && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${eggGlow} 0%, transparent 70%)` }}
                />
              )}

              {/* Egg Sprite */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <img
                  alt="DigiEgg"
                  className="object-contain pointer-events-none transition-all duration-300"
                  src={digiEggSprite}
                  style={{
                    imageRendering: 'pixelated',
                    width: '110px',
                    height: '110px',
                    transform: `scaleY(${getSquashScale()})`,
                    transformOrigin: 'center',
                    filter: eggFilter,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateModal
          isOpen={showCreateModal}
          onClose={() => {}}
          onSaveTask={handleCreateTask}
          onSaveActivity={handleCreateActivity}
          theme="default"
          isOnboarding={true}
          evolutionStage="digiegg"
        />
      )}
    </div>
  );
}
