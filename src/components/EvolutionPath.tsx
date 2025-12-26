import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import digiEggSprite from 'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png';
import pichimonSprite from 'figma:asset/99ff747d7f7ecc2424e131a43c54669bcba9a301.png';
import pukamonSprite from 'figma:asset/104dc13e2c146bb51e00903d6eaa5f6fae7619c6.png';
import tapirmonSprite from 'figma:asset/8deb0c4ab0625c36e8f7d8484d047391e366e6cd.png';
import monochromon from 'figma:asset/58d45f952e9e7f056445aa37544fa488bbfda16f.png';
import triceramonSprite from 'figma:asset/439ea88abadb584d8abd075df0fff253301f3fcf.png';
import ultimateBrachiomon from 'figma:asset/66717674e9ddce8b8e301126dbc9422279967bda.png';
import tuskmonSprite from 'figma:asset/4545c1113c2742541bfa287e8aaad34d540d5188.png';
import gigadramonSprite from 'figma:asset/61935125c675c3d79b74bdfbb783563de187250a.png';
import gaioumonSprite from 'figma:asset/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png';
import bakemonSprite from 'figma:asset/cc04120f94ce0a4ae081b26d2359ca0dd7488f6d.png';
import digitamamonSprite from 'figma:asset/15b86f9a6a117217f92fc8c35383b8ba7a68d995.png';
import titamonSprite from 'figma:asset/2289f0ba6bd5182e66b3253be305d6860dbe1148.png';
import gaioumonIttoSprite from 'figma:asset/2f5fefb3d68da3d20ef1d5195a8f0ddc506b1149.png';

interface EvolutionPathProps {
  currentStage: string;
  currentBranch: 'virus' | 'data' | 'vaccine';
  currentXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  onDegenerate?: (targetStage: string) => void;
}

interface Evolution {
  level: number;
  name: string;
  xpRequired: number;
  sprite?: string;
}

// Common evolution path (all branches share these stages) - up to Tapirmon
const COMMON_PATH: Evolution[] = [
  { level: -3, name: 'DigiEgg', xpRequired: 0, sprite: digiEggSprite },
  { level: -2, name: 'Pichimon', xpRequired: 50, sprite: pichimonSprite },
  { level: -1, name: 'Pukamon', xpRequired: 150, sprite: pukamonSprite },
];

// Tapirmon - the branching point
const TAPIRMON: Evolution = { level: 0, name: 'Tapirmon', xpRequired: 300, sprite: tapirmonSprite };

// Branch-specific paths (from Champion onwards)
const VIRUS_PATH: Evolution[] = [
  { level: 1, name: 'Tuskmon', xpRequired: 600, sprite: tuskmonSprite },
  { level: 2, name: 'Gigadramon', xpRequired: 1000, sprite: gigadramonSprite },
  { level: 3, name: 'Gaioumon', xpRequired: 1500, sprite: gaioumonSprite },
  { level: 4, name: 'Gaioumon: Itto Mode', xpRequired: 2300, sprite: gaioumonIttoSprite },
];

const DATA_PATH: Evolution[] = [
  { level: 1, name: 'Monochromon', xpRequired: 600, sprite: monochromon },
  { level: 2, name: 'Triceramon', xpRequired: 1000, sprite: triceramonSprite },
  { level: 3, name: 'UltimateBrachiomon', xpRequired: 1500, sprite: ultimateBrachiomon },
  { level: 4, name: 'Gaioumon: Itto Mode', xpRequired: 2300, sprite: gaioumonIttoSprite },
];

const VACCINE_PATH: Evolution[] = [
  { level: 1, name: 'Bakemon', xpRequired: 600, sprite: bakemonSprite },
  { level: 2, name: 'Digitamamon', xpRequired: 1000, sprite: digitamamonSprite },
  { level: 3, name: 'Titamon', xpRequired: 1500, sprite: titamonSprite },
  { level: 4, name: 'Gaioumon: Itto Mode', xpRequired: 2300, sprite: gaioumonIttoSprite },
];

export function EvolutionPath({ currentStage, currentBranch, currentXP, virusPoints, dataPoints, vaccinePoints, onDegenerate }: EvolutionPathProps) {
  const [selectedBranch, setSelectedBranch] = useState<'virus' | 'data' | 'vaccine'>(currentBranch);
  const [confirmDegenerate, setConfirmDegenerate] = useState<{ stage: string; isSecondConfirm: boolean } | null>(null);
  const [commonPathExpanded, setCommonPathExpanded] = useState(true);

  const getBranchPath = (branch: 'virus' | 'data' | 'vaccine') => {
    switch (branch) {
      case 'virus': return VIRUS_PATH;
      case 'data': return DATA_PATH;
      case 'vaccine': return VACCINE_PATH;
    }
  };

  const getBranchColor = (branch: 'virus' | 'data' | 'vaccine') => {
    switch (branch) {
      case 'virus': return { bg: 'bg-[#22A900]', text: 'text-[#22A900]', border: 'border-[#22A900]', aura: 'shadow-[#22A900]/50' };
      case 'data': return { bg: 'bg-[#009ED8]', text: 'text-[#009ED8]', border: 'border-[#009ED8]', aura: 'shadow-[#009ED8]/50' };
      case 'vaccine': return { bg: 'bg-[#E69600]', text: 'text-[#E69600]', border: 'border-[#E69600]', aura: 'shadow-[#E69600]/50' };
    }
  };

  // Check if all Mega evolutions from all branches are unlocked (for Itto Mode)
  const areAllMegasUnlocked = () => {
    // Check Virus: Gaioumon (1500 XP)
    // Check Data: UltimateBrachiomon (1500 XP)
    // Check Vaccine: Titamon (1500 XP)
    return currentXP >= 1500;
  };

  const branchPath = getBranchPath(selectedBranch);
  const colors = getBranchColor(selectedBranch);
  
  // Determine if we should show branch selection (only after Tapirmon)
  const isAfterTapirmon = currentXP >= 300;

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
    const isIttoMode = evolution.name === 'Gaioumon: Itto Mode' && !areAllMegasUnlocked();
    
    return (
      <div key={`${evolution.name}-${index}`}>
        <div className={`bg-white rounded-xl p-5 border transition-all ${
          isCurrent 
            ? `${colors.border} shadow-md ${colors.aura}` 
            : isUnlocked
            ? 'border-gray-200'
            : 'border-gray-100 opacity-50'
        }`}>
          <div className="flex items-center gap-3">
            {/* Sprite */}
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isUnlocked ? 'bg-gray-100' : 'bg-gray-200'
            }`}>
              {evolution.sprite && (
                <img 
                  src={evolution.sprite} 
                  alt={evolution.name}
                  className={`w-12 h-12 object-contain ${!isUnlocked && 'grayscale opacity-50'}`}
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {evolution.name}
                </h3>
                {isCurrent && (
                  <span className={`${colors.bg} text-white text-xs px-2 py-0.5 rounded`} style={{ fontFamily: 'monospace' }}>
                    CURRENT
                  </span>
                )}
                {isIttoMode && (
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-0.5 rounded" style={{ fontFamily: 'monospace' }}>
                    ULTIMATE
                  </span>
                )}
              </div>
            </div>

            {/* Status / Action Button */}
            <div>
              {isUnlocked && !isCurrent ? (
                <button
                  onClick={() => handleDegenerateClick(evolution.name)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs transition-colors"
                  style={{ fontFamily: 'monospace' }}
                >
                  Degenerate
                </button>
              ) : !isUnlocked ? (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                  🔒
                </div>
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

      {/* Common Evolution Path (Egg to Pukamon) */}
      <div className="mb-4 space-y-3">
        {COMMON_PATH.map((evolution, index) => 
          renderEvolutionCard(evolution, { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500', aura: 'shadow-teal-500/50' }, index, COMMON_PATH.length)
        )}
      </div>

      {/* Tapirmon - Branching Point */}
      <div className="mb-4">
        {renderEvolutionCard(TAPIRMON, { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500', aura: 'shadow-teal-500/50' }, 0, 1)}
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