import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { DigivolutionProgress } from './DigivolutionProgress';
import { getEvolutionLine, type EggType } from '../types/evolution-lines';
import { getStageLevel } from '../types/progression';

// Numeric tier for each stage level (matches the card `level` field: egg=-3 …
// rookie=0 … ultra=4) so we can tell which forms are "future" for the pet.
const TIER_LEVEL: Record<string, number> = {
  digiegg: -3, 'baby-i': -2, 'baby-ii': -1, rookie: 0,
  champion: 1, ultimate: 2, mega: 3, ultra: 4,
};

interface EvolutionPathProps {
  currentStage: string;
  currentBranch: 'virus' | 'data' | 'vaccine';
  currentXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  onDegenerate?: (targetStage: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
  dailyDone?: number;
  dailyTotal?: number;
  activitiesCount?: number;
  evolutionStage?: string;
  perfectDays?: number;
  dailyRequired?: number;
  unlockedEvolutions?: string[];
  eggType?: EggType;
}

interface Evolution {
  level: number;
  name: string;
  xpRequired: number;
  sprite?: string;
}

export function EvolutionPath({ 
  currentStage, 
  currentBranch, 
  currentXP, 
  virusPoints, 
  dataPoints, 
  vaccinePoints, 
  digivolutionSegments,
  digivolutionSegmentsNeeded,
  onDegenerate,
  theme,
  unlockedEvolutions = [],
  evolutionStage,
  eggType = 'tapirmon'
}: EvolutionPathProps) {
  const unlockedSet = useMemo(() => new Set(unlockedEvolutions.map(s => s.toLowerCase())), [unlockedEvolutions]);
  // The pet's real current tier (independent of accumulated XP).
  const currentLevel = TIER_LEVEL[getStageLevel(evolutionStage ?? currentStage.toLowerCase())] ?? 0;
  const [selectedBranch, setSelectedBranch] = useState<'virus' | 'data' | 'vaccine'>(currentBranch);
  const [confirmDegenerate, setConfirmDegenerate] = useState<{ stage: string; isSecondConfirm: boolean } | null>(null);
  // Locked evolutions are hidden behind a pixelated "?" (spoiler guard). The
  // user can reveal one (shown darkened) after confirming; this local set resets
  // when they leave the screen (the component unmounts on navigation).
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [confirmReveal, setConfirmReveal] = useState<string | null>(null);

  const handleRevealConfirm = () => {
    if (confirmReveal) setRevealed(prev => new Set(prev).add(confirmReveal));
    setConfirmReveal(null);
  };

  // Get the correct evolution line based on egg type
  const evolutionLine = useMemo(() => getEvolutionLine(eggType), [eggType]);

  // Build evolution paths from the evolution line
  const COMMON_PATH: Evolution[] = useMemo(() => [
    { level: -3, name: evolutionLine.digiegg.name, xpRequired: evolutionLine.digiegg.xpRequired, sprite: evolutionLine.digiegg.sprite },
    { level: -2, name: evolutionLine.inTraining1.name, xpRequired: evolutionLine.inTraining1.xpRequired, sprite: evolutionLine.inTraining1.sprite },
    { level: -1, name: evolutionLine.inTraining2.name, xpRequired: evolutionLine.inTraining2.xpRequired, sprite: evolutionLine.inTraining2.sprite },
  ], [evolutionLine]);

  const ROOKIE: Evolution = useMemo(() => ({ 
    level: 0, 
    name: evolutionLine.rookie.name, 
    xpRequired: evolutionLine.rookie.xpRequired, 
    sprite: evolutionLine.rookie.sprite 
  }), [evolutionLine]);

  const ULTRA: Evolution = useMemo(() => ({
    level: 4,
    name: evolutionLine.ultra.name,
    xpRequired: evolutionLine.ultra.xpRequired,
    sprite: evolutionLine.ultra.sprite,
  }), [evolutionLine]);

  const getBranchPath = (branch: 'virus' | 'data' | 'vaccine'): Evolution[] => {
    const branchData = evolutionLine.branches.find(b => b.type === branch);
    if (!branchData) return [ULTRA];
    
    const branchStages = branchData.stages.map((stage, index) => ({
      level: index + 1,
      name: stage.name,
      xpRequired: stage.xpRequired,
      sprite: stage.sprite,
    }));

    return [...branchStages, ULTRA];
  };

  const getBranchColor = (branch: 'virus' | 'data' | 'vaccine') => {
    switch (branch) {
      case 'virus': return { bg: 'bg-[#22A900]', text: 'text-[#22A900]', border: 'border-[#22A900]', aura: 'shadow-[#22A900]/50' };
      case 'data': return { bg: 'bg-[#009ED8]', text: 'text-[#009ED8]', border: 'border-[#009ED8]', aura: 'shadow-[#009ED8]/50' };
      case 'vaccine': return { bg: 'bg-[#E69600]', text: 'text-[#E69600]', border: 'border-[#E69600]', aura: 'shadow-[#E69600]/50' };
    }
  };

  // The 3 Mega forms (one per branch) for this egg line — Ultra unlocks only
  // once all three are actually unlocked.
  const megaKeys = useMemo(
    () => evolutionLine.branches
      .map(b => b.stages[b.stages.length - 1]?.name.toLowerCase())
      .filter(Boolean) as string[],
    [evolutionLine],
  );
  const areAllMegasUnlocked = () => megaKeys.length > 0 && megaKeys.every(k => unlockedSet.has(k));

  const branchPath = getBranchPath(selectedBranch);
  const colors = getBranchColor(selectedBranch);
  
  // Constrói a linha evolutiva ATUAL do Digimon (do início até o estágio atual)
  const getCurrentEvolutionLine = (): Evolution[] => {
    const currentBranchPath = getBranchPath(currentBranch);
    const fullPath = [...COMMON_PATH, ROOKIE, ...currentBranchPath];
    
    // Encontra o índice do estágio atual
    const currentIndex = fullPath.findIndex(e => e.name.toLowerCase() === currentStage.toLowerCase());
    
    // Retorna apenas os estágios até o atual (inclusive)
    return currentIndex >= 0 ? fullPath.slice(0, currentIndex + 1) : fullPath;
  };
  
  const currentEvolutionLine = getCurrentEvolutionLine();

  const handleDegenerateClick = (stage: string) => {
    setConfirmDegenerate({ stage, isSecondConfirm: false });
  };

  const handleDegenerateConfirm = () => {
    if (confirmDegenerate?.isSecondConfirm) {
      // Second confirmation - execute degeneration
      if (onDegenerate) {
        onDegenerate(confirmDegenerate.stage);
      }
      setConfirmDegenerate(null);
    } else {
      // First confirmation - show second confirmation
      setConfirmDegenerate({ stage: confirmDegenerate!.stage, isSecondConfirm: true });
    }
  };

  const handleDegenerateCancel = () => {
    setConfirmDegenerate(null);
  };

  const renderEvolutionCard = (evolution: Evolution, colors: any, index: number, pathLength: number) => {
    const isUnlocked = currentXP >= evolution.xpRequired;
    const isCurrent = evolution.name.toLowerCase() === currentStage.toLowerCase();
    const isUltraMode = evolution.level === 4 && !areAllMegasUnlocked();
    
    // Verifica se este estágio está na linha evolutiva ATUAL do Digimon E se está ANTES do estágio atual
    const isInCurrentLine = currentEvolutionLine.some(e => e.name.toLowerCase() === evolution.name.toLowerCase());
    const isPreviousStage = isInCurrentLine && isUnlocked && !isCurrent;

    const isRevealed = revealed.has(evolution.name);
    const stageKey = evolution.name.toLowerCase();
    const isUltra = evolution.level === 4;
    // "Reached" (shown) = the current form, an already-unlocked form, a shared
    // trunk stage the pet has passed (egg → rookie), or — for Ultra — once all 3
    // megas are unlocked. Everything else is a spoiler-hidden future form,
    // regardless of accumulated XP.
    const isReached =
      isCurrent
      || unlockedSet.has(stageKey)
      || (evolution.level <= 0 && currentLevel >= evolution.level)
      || (isUltra && areAllMegasUnlocked());
    const hidden = !isReached && !isRevealed;

    return (
      <div key={`${evolution.name}-${index}`}>
        <div className={`bg-white rounded-xl p-5 border transition-all ${
          isCurrent
            ? `${colors.border} shadow-md ${colors.aura}`
            : isReached
            ? 'border-gray-200'
            : 'border-gray-100 opacity-50'
        }`}>
          <div className="flex items-center gap-3">
            {/* Sprite — locked evolutions are hidden behind a pixelated "?" */}
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isReached ? 'bg-gray-100' : 'bg-gray-200'
            }`}>
              {hidden ? (
                <button
                  onClick={() => setConfirmReveal(evolution.name)}
                  aria-label="Reveal evolution (spoiler)"
                  title="Reveal (spoiler)"
                  className="w-12 h-12 flex items-center justify-center rounded-md hover:bg-gray-300 transition-colors"
                  style={{
                    fontFamily: 'monospace', fontWeight: 900, fontSize: '1.7rem',
                    color: '#6b7280', lineHeight: 1, cursor: 'pointer',
                    imageRendering: 'pixelated',
                    textShadow: '2px 2px 0 #cbd5e1, 3px 3px 0 #e5e7eb',
                  }}
                >
                  ?
                </button>
              ) : evolution.sprite ? (
                <img
                  src={evolution.sprite}
                  alt={isUnlocked ? evolution.name : 'revealed evolution'}
                  className="w-12 h-12 object-contain"
                  style={{ imageRendering: 'pixelated', filter: isReached ? 'none' : 'brightness(0.35) grayscale(0.35)' }}
                />
              ) : null}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`${isReached ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {hidden ? '???' : evolution.name}
                </h3>
                {isCurrent && (
                  <span className={`${colors.bg} text-white text-xs px-2 py-0.5 rounded`} style={{ fontFamily: 'monospace' }}>
                    CURRENT
                  </span>
                )}
                {isUltraMode && (
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-0.5 rounded" style={{ fontFamily: 'monospace' }}>
                    ULTRA
                  </span>
                )}
              </div>
            </div>

            {/* Status / Action Button */}
            <div>
              {!isReached ? (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                  🔒
                </div>
              ) : isPreviousStage ? (
                <button
                  onClick={() => handleDegenerateClick(evolution.name)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs transition-colors"
                  style={{ fontFamily: 'monospace' }}
                >
                  Degenerate
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Arrow */}
        {index < pathLength - 1 && (
          <div className="flex justify-center py-1">
            <ChevronDown size={20} className={isUnlocked ? colors.text : 'text-gray-400'} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Confirmation Dialog */}
      {confirmDegenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg mb-4" style={{ fontFamily: 'monospace' }}>
              {confirmDegenerate.isSecondConfirm ? '⚠️ FINAL WARNING!' : '⚠️ Confirm Degeneration'}
            </h3>
            <p className="text-gray-700 mb-6" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {confirmDegenerate.isSecondConfirm 
                ? `Are you ABSOLUTELY SURE you want to degenerate to ${confirmDegenerate.stage}? This action CANNOT be undone!`
                : `Do you want to degenerate to ${confirmDegenerate.stage}? You will lose all progress beyond this stage.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDegenerateCancel}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDegenerateConfirm}
                className={`flex-1 py-2.5 ${
                  confirmDegenerate.isSecondConfirm 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-800 hover:bg-gray-900'
                } text-white rounded-xl transition-colors`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {confirmDegenerate.isSecondConfirm ? 'YES, DEGENERATE!' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal (spoiler) confirmation */}
      {confirmReveal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg mb-4" style={{ fontFamily: 'monospace' }}>
              👁️ Reveal this evolution?
            </h3>
            <p className="text-gray-700 mb-6" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              This is a future evolution you haven't unlocked yet — peeking is a spoiler!
              It'll show up darkened, and hide again once you leave this screen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReveal(null)}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRevealConfirm}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-colors"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                Yes, reveal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Balance */}
      <div className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
        <p className="text-gray-700 mb-2" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          CURRENT ATTRIBUTES
        </p>
        <div className="flex justify-between text-sm" style={{ fontFamily: 'monospace' }}>
          <span className="text-[#22A900]" style={{ fontWeight: '600' }}>
            🦠 Virus: {virusPoints}
          </span>
          <span className="text-[#009ED8]" style={{ fontWeight: '600' }}>
            💾 Data: {dataPoints}
          </span>
          <span className="text-[#E69600]" style={{ fontWeight: '600' }}>
            💉 Vaccine: {vaccinePoints}
          </span>
        </div>
      </div>

      {/* Digivolution Progress */}
      <div className="mb-4">
        <DigivolutionProgress
          currentDays={digivolutionSegments}
          daysRequired={digivolutionSegmentsNeeded}
          theme={theme}
        />
      </div>

      {/* Common Evolution Path (Egg to In-Training 2) */}
      <div className="mb-4 space-y-3">
        {COMMON_PATH.map((evolution, index) => 
          renderEvolutionCard(evolution, { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500', aura: 'shadow-teal-500/50' }, index, COMMON_PATH.length)
        )}
      </div>

      {/* Rookie - Branching Point */}
      <div className="mb-4">
        {renderEvolutionCard(ROOKIE, { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500', aura: 'shadow-teal-500/50' }, 0, 1)}
      </div>

      {/* Branch Selector Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent flex-1" />
        <span className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
          EVOLUTION BRANCHES
        </span>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent flex-1" />
      </div>

      {/* Branch Selector Buttons - Always visible and unlocked */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedBranch('virus')}
          className={`flex-1 py-3 rounded-xl border transition-all ${
            selectedBranch === 'virus'
              ? 'bg-[#22A900] border-[#22A900] text-white shadow-sm'
              : 'bg-white border-gray-200 text-[#22A900] hover:bg-[#22A900]/10'
          }`}
          style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        >
          🦠 VIRUS
        </button>
        <button
          onClick={() => setSelectedBranch('data')}
          className={`flex-1 py-3 rounded-xl border transition-all ${
            selectedBranch === 'data'
              ? 'bg-[#009ED8] border-[#009ED8] text-white shadow-sm'
              : 'bg-white border-gray-200 text-[#009ED8] hover:bg-[#009ED8]/10'
          }`}
          style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        >
          💾 DATA
        </button>
        <button
          onClick={() => setSelectedBranch('vaccine')}
          className={`flex-1 py-3 rounded-xl border transition-all ${
            selectedBranch === 'vaccine'
              ? 'bg-[#E69600] border-[#E69600] text-white shadow-sm'
              : 'bg-white border-gray-200 text-[#E69600] hover:bg-[#E69600]/10'
          }`}
          style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        >
          💉 VACCINE
        </button>
      </div>

      {/* Branch-Specific Evolution Path - Always visible */}
      <div className="space-y-3">
        {branchPath.map((evolution, index) => 
          renderEvolutionCard(evolution, colors, index, branchPath.length)
        )}
      </div>

    </div>
  );
}
