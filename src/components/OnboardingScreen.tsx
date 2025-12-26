import { useState, useEffect } from 'react';
import imgUiTBg01 from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import imgImage69 from "figma:asset/7b96e3369daf15ffc8ed062b986db273c0416930.png";
import digiEggSprite from 'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png';
import imgContainer from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";
import { CreateModal } from './CreateModal';
import { ActivityCategory } from '../types/attributes';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingScreenProps {
  onComplete: (data: {
    userName: string;
    firstItem: {
      type: 'task' | 'activity';
      name: string;
      category: ActivityCategory;
      emoji: string;
      steps?: Step[];
    };
  }) => void;
}

const INTRO_TEXTS = [
  'Bem-vindo ao DigiApp! Em breve você conhecerá seu parceiro digital que te ajudará a atingir seus objetivos.',
  'À medida que você realizar tarefas e atividades ele crescerá com você. Suas escolhas impactam diretamente no seu parceiro.',
  'O destino seu e do seu parceiro está em suas mãos!',
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'name' | 'intro' | 'create'>('name');
  const [introIndex, setIntroIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [squashFrame, setSquashFrame] = useState(0);

  // Squash/stretch animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSquashFrame(prev => (prev + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getSquashScale = () => {
    return squashFrame === 0 ? 0.9 : 1.0;
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setStep('intro');
    }
  };

  const handleIntroNext = () => {
    if (introIndex < INTRO_TEXTS.length - 1) {
      setIntroIndex(introIndex + 1);
    } else {
      setStep('create');
      setShowCreateModal(true);
    }
  };

  const handleCreateTask = (data: { name: string; category: string; emoji: string }) => {
    onComplete({
      userName,
      firstItem: {
        type: 'task',
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
      },
    });
  };

  const handleCreateActivity = (data: { name: string; category: string; emoji: string; steps: Step[] }) => {
    onComplete({
      userName,
      firstItem: {
        type: 'activity',
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        steps: data.steps,
      },
    });
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#0a2f1a] flex flex-col">
      {/* Background Grid Texture - Direct, no transparency */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          alt="" 
          className="w-full h-full object-cover pointer-events-none" 
          src={imgUiTBg01}
        />
      </div>

      {/* Content Container - Mobile First */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 py-8 max-w-md mx-auto w-full">
        
        {/* Top Content Area */}
        <div className="w-full flex-1 flex items-center justify-center pt-12">
          {step === 'name' && (
            <div className="w-full space-y-4 max-w-[280px]">
              {/* Input Field */}
              <div className="w-full">
                <div className="bg-[#0d1420] relative rounded-xl w-full">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    placeholder="insira seu nome"
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

              {/* Continue Button */}
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
                  continuar
                </button>
              </div>
            </div>
          )}

          {step === 'intro' && (
            <div className="w-full space-y-4 max-w-[320px]">
              {/* Text Box */}
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

              {/* Continue Button */}
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
                  continuar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DigiEgg Sprite in Container Window */}
        <div className="relative w-full max-w-[240px] mx-auto">
          {/* Outer Grey Border Container */}
          <div className="bg-[#6a7282] rounded-[32px] p-3 shadow-lg">
            {/* Inner Container Window */}
            <div className="relative w-full aspect-[487/590] overflow-hidden rounded-xl">
              {/* Background with gradient - NO transparency */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-xl">
                <img alt="" className="absolute max-w-none object-cover rounded-xl size-full" src={imgContainer} />
                <div className="absolute bg-gradient-to-b from-[#cdded4] inset-0 rounded-xl to-[#cfcfcf]" />
              </div>
              
              {/* Dark Inner Border */}
              <div aria-hidden="true" className="absolute border-[#1f2a39] border-[3px] border-solid inset-0 pointer-events-none rounded-xl" />
              
              {/* DigiEgg Sprite Inside */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <img 
                  alt="DigiEgg" 
                  className="object-contain pointer-events-none" 
                  src={digiEggSprite}
                  style={{ 
                    imageRendering: 'pixelated',
                    width: '140px',
                    height: '140px',
                    transform: `scaleY(${getSquashScale()})`,
                    transformOrigin: 'center',
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
        />
      )}
    </div>
  );
}