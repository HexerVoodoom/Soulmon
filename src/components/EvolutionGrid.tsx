import { useState } from 'react';
import { X } from 'lucide-react';
import tapirmonSprite from 'figma:asset/7d2b0a9b519f16f1d0a258d9670cfc62230e1903.png';
import monochromon from 'figma:asset/7bc96986446973a3544f57a9055e59fc87022f42.png';
import triceramonSprite from 'figma:asset/91974d820051b34dd9e9db8f1b4f72ae1216ed98.png';
import tuskmonSprite from 'figma:asset/4545c1113c2742541bfa287e8aaad34d540d5188.png';
import ultimateBrachiomon from 'figma:asset/cfe5f78d2ba5745cf2fab94f2ea9e70d1b5bfc0a.png';
import gaioumonSprite from 'figma:asset/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png';

interface Evolution {
  id: string;
  name: string;
  stage: string;
  type: string;
  unlocked: boolean;
  isCurrent: boolean;
  sprite?: string;
}

interface EvolutionGridProps {
  currentEvolution: Evolution;
  onSelectEvolution?: (evolution: Evolution) => void;
}

const EVOLUTION_STAGES = [
  { stage: 'Rookie', count: 3 },
  { stage: 'Champion', count: 3 },
  { stage: 'Ultimate', count: 3 },
  { stage: 'Mega', count: 3 },
];

const EVOLUTION_DATA: Evolution[] = [
  // Rookie
  { id: 'rookie-1', name: 'Tapirmon', stage: 'Rookie', type: 'Vaccine', unlocked: true, isCurrent: true, sprite: tapirmonSprite },
  { id: 'rookie-2', name: 'Gabumon', stage: 'Rookie', type: 'Data', unlocked: false, isCurrent: false },
  { id: 'rookie-3', name: 'Palmon', stage: 'Rookie', type: 'Virus', unlocked: false, isCurrent: false },
  // Champion
  { id: 'champion-1', name: 'Monochromon', stage: 'Champion', type: 'Data', unlocked: true, isCurrent: false, sprite: monochromon },
  { id: 'champion-2', name: 'Tuskmon', stage: 'Champion', type: 'Virus', unlocked: true, isCurrent: false, sprite: tuskmonSprite },
  { id: 'champion-3', name: 'Togemon', stage: 'Champion', type: 'Vaccine', unlocked: false, isCurrent: false },
  // Ultimate
  { id: 'ultimate-1', name: 'Triceramon', stage: 'Ultimate', type: 'Data', unlocked: true, isCurrent: false, sprite: triceramonSprite },
  { id: 'ultimate-2', name: 'WereGarurumon', stage: 'Ultimate', type: 'Vaccine', unlocked: false, isCurrent: false },
  { id: 'ultimate-3', name: 'Lillymon', stage: 'Ultimate', type: 'Virus', unlocked: false, isCurrent: false },
  // Mega
  { id: 'mega-1', name: 'UltimateBrachiomon', stage: 'Mega', type: 'Data', unlocked: false, isCurrent: false, sprite: ultimateBrachiomon },
  { id: 'mega-2', name: 'Gaioumon', stage: 'Mega', type: 'Virus', unlocked: true, isCurrent: false, sprite: gaioumonSprite },
  { id: 'mega-3', name: 'Rosemon', stage: 'Mega', type: 'Vaccine', unlocked: false, isCurrent: false },
];

export function EvolutionGrid({ currentEvolution, onSelectEvolution }: EvolutionGridProps) {
  const [selectedEvolution, setSelectedEvolution] = useState<Evolution | null>(null);

  const handleSelectEvolution = (evolution: Evolution) => {
    if (evolution.unlocked) {
      setSelectedEvolution(evolution);
    }
  };

  const getEvolutionColor = (type: string) => {
    const colors: Record<string, string> = {
      'Virus': 'from-red-500 to-red-600',      // 🦠 Red - Instinct/Creativity
      'Data': 'from-blue-500 to-blue-600',     // 💾 Blue - Intellect/Balance
      'Vaccine': 'from-green-500 to-green-600', // 💉 Green - Discipline/Empathy
    };
    return colors[type] || 'from-gray-400 to-gray-500';
  };

  return (
    <>
      <div className="space-y-3">
        {EVOLUTION_STAGES.map((stageInfo, stageIndex) => {
          const evolutions = EVOLUTION_DATA.filter(e => e.stage === stageInfo.stage);
          
          return (
            <div key={stageInfo.stage}>
              <div className="text-gray-600 mb-2 px-2" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {stageInfo.stage}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {evolutions.map((evolution, index) => (
                  <button
                    key={evolution.id}
                    onClick={() => handleSelectEvolution(evolution)}
                    disabled={!evolution.unlocked}
                    className={`
                      aspect-square rounded-lg border-2 transition-all
                      ${evolution.isCurrent 
                        ? 'border-emerald-400 bg-emerald-100 shadow-lg shadow-emerald-400/50' 
                        : evolution.unlocked
                        ? 'border-teal-300 bg-teal-100 hover:border-teal-400 hover:shadow-md'
                        : 'border-gray-300 bg-gray-200 opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full p-2">
                      {evolution.unlocked ? (
                        <>
                          {/* Use real sprite if available, show "?" for others */}
                          {evolution.sprite ? (
                            <img 
                              src={evolution.sprite} 
                              alt={evolution.name}
                              className="w-12 h-12 object-contain mb-1"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded border-2 border-gray-600 flex items-center justify-center mb-1">
                              <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold' }}>?</span>
                            </div>
                          )}
                          <span className="text-gray-800" style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>
                            {evolution.name}
                          </span>
                        </>
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Evolution detail modal */}
      {selectedEvolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
            <button
              onClick={() => setSelectedEvolution(null)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center">
              {selectedEvolution.sprite ? (
                <img 
                  src={selectedEvolution.sprite} 
                  alt={selectedEvolution.name}
                  className="w-24 h-24 object-contain mb-4"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="w-24 h-24 bg-gray-700 rounded border-2 border-gray-600 flex items-center justify-center mb-4">
                  <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '3rem', fontWeight: 'bold' }}>?</span>
                </div>
              )}

              <h2 className="text-gray-900 mb-1">{selectedEvolution.name}</h2>
              <p className="text-gray-600 mb-1" style={{ fontFamily: 'monospace' }}>
                {selectedEvolution.stage}
              </p>
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                Type: {selectedEvolution.type}
              </p>

              <div className="bg-gray-100 rounded px-4 py-3 relative w-full">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-100 rotate-45"></div>
                <p className="text-gray-800 text-center" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  It's good to have you around!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
