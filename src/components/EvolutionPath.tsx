import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { DigivolutionProgress } from './DigivolutionProgress';
import { getSpriteForStage } from '../utils/sprites';
import { creatureFormId, type CreatureStage, type AlignmentId, type LText } from '../utils/oracle';

type Attr = 'virus' | 'data' | 'vaccine';
const ALIGN_TO_ATTR: Record<AlignmentId, Attr> = { poder: 'virus', harmonia: 'data', benevolencia: 'vaccine' };
const ATTR_ORDER: Attr[] = ['virus', 'data', 'vaccine'];

interface EvolutionPathProps {
  /** Id da forma atual ('rookie' | 'champion-virus' | ... | 'ultra'). */
  currentStageId: string;
  currentBranch: Attr;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  onDegenerate?: (targetStageId: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
  /** As 11 formas ÚNICAS do jogador (utils/oracle.ts). */
  stages: CreatureStage[];
  /** Linha de sprite genérica (fallback visual — ver utils/sprites.ts). */
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  unlockedEvolutions?: string[];
  /** Evolution padlock: tapping the CURRENT Soulmon toggles it. */
  evolutionLocked?: boolean;
  onToggleEvolutionLock?: () => void;
  language?: 'pt-BR' | 'en-US';
}

export function EvolutionPath({
  currentStageId,
  currentBranch,
  virusPoints,
  dataPoints,
  vaccinePoints,
  digivolutionSegments,
  digivolutionSegmentsNeeded,
  onDegenerate,
  theme,
  stages,
  eggType = 'tapirmon',
  unlockedEvolutions = [],
  evolutionLocked = false,
  onToggleEvolutionLock,
  language = 'en-US',
}: EvolutionPathProps) {
  const isPt = language === 'pt-BR';
  const L = (t: LText) => (isPt ? t.pt : t.en);
  const unlockedSet = useMemo(() => new Set(unlockedEvolutions), [unlockedEvolutions]);
  const [selectedBranch, setSelectedBranch] = useState<Attr>(currentBranch);
  const [confirmDegenerate, setConfirmDegenerate] = useState<{ id: string; name: string; isSecondConfirm: boolean } | null>(null);
  // Locked evolutions are hidden behind a pixelated "?" (spoiler guard). The
  // user can reveal one (shown darkened) after confirming; this local set resets
  // when they leave the screen (the component unmounts on navigation).
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [confirmReveal, setConfirmReveal] = useState<CreatureStage | null>(null);

  const handleRevealConfirm = () => {
    if (confirmReveal) setRevealed(prev => new Set(prev).add(creatureFormId(confirmReveal)));
    setConfirmReveal(null);
  };

  const rookie = stages.find(s => s.stage === 'rookie');
  const ultra = stages.find(s => s.stage === 'ultra');
  const getBranchPath = (branch: Attr): CreatureStage[] =>
    stages.filter(s => s.branch && ALIGN_TO_ATTR[s.branch] === branch);

  const megaIds = ATTR_ORDER.map(a => `mega-${a}`);
  const areAllMegasUnlocked = megaIds.every(id => unlockedSet.has(id));

  const branchPath = getBranchPath(selectedBranch);
  const colors = getBranchColor(selectedBranch);

  const handleDegenerateClick = (evolution: CreatureStage) => {
    setConfirmDegenerate({ id: creatureFormId(evolution), name: evolution.name, isSecondConfirm: false });
  };

  const handleDegenerateConfirm = () => {
    if (confirmDegenerate?.isSecondConfirm) {
      onDegenerate?.(confirmDegenerate.id);
      setConfirmDegenerate(null);
    } else {
      setConfirmDegenerate({ ...confirmDegenerate!, isSecondConfirm: true });
    }
  };

  const handleDegenerateCancel = () => setConfirmDegenerate(null);

  const renderEvolutionCard = (evolution: CreatureStage, colors: BranchColors, index: number, pathLength: number) => {
    const stageId = creatureFormId(evolution);
    const isCurrent = stageId === currentStageId;
    const isUltra = evolution.stage === 'ultra';
    const isUltraMode = isUltra && !areAllMegasUnlocked;
    const isRevealed = revealed.has(stageId);
    // "Reached" (shown) = the current form, an already-unlocked form, the
    // shared rookie trunk, or — for Ultra — once all 3 megas are unlocked.
    // Everything else is a spoiler-hidden future form.
    const isReached =
      isCurrent
      || unlockedSet.has(stageId)
      || evolution.stage === 'rookie'
      || (isUltra && areAllMegasUnlocked);
    const hidden = !isReached && !isRevealed;
    // A stage the pet already passed through, on the branch it's CURRENTLY
    // on — offer to degenerate back to it.
    const isPreviousStage = isReached && !isCurrent && evolution.stage !== 'rookie' && evolution.branch
      ? ALIGN_TO_ATTR[evolution.branch] === currentBranch
      : false;

    return (
      <div key={stageId}>
        <div className={`bg-white rounded-xl p-5 border transition-all ${
          isCurrent
            ? `${colors.border} shadow-md ${colors.aura}`
            : isReached
            ? 'border-gray-200'
            : 'border-gray-100 opacity-50'
        }`}>
          <div className="flex items-center gap-3">
            {/* Sprite — locked evolutions are hidden behind a pixelated "?".
                Tapping the CURRENT Soulmon toggles the evolution padlock. */}
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isReached ? 'bg-gray-100' : 'bg-gray-200'
            }`}>
              {hidden ? (
                <button
                  onClick={() => setConfirmReveal(evolution)}
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
              ) : isCurrent && onToggleEvolutionLock ? (
                <button
                  onClick={onToggleEvolutionLock}
                  aria-label={isPt ? 'Alternar cadeado de evolução' : 'Toggle evolution padlock'}
                  title={evolutionLocked
                    ? (isPt ? 'Destravar evolução' : 'Unlock evolution')
                    : (isPt ? 'Travar evolução' : 'Lock evolution')}
                  className="relative w-12 h-12 flex items-center justify-center rounded-md cursor-pointer"
                >
                  <img
                    src={getSpriteForStage(stageId, eggType)}
                    alt={evolution.name}
                    className="w-12 h-12 object-contain"
                    style={{ imageRendering: 'pixelated', filter: evolutionLocked ? 'grayscale(0.7) brightness(0.75)' : 'none' }}
                  />
                  {evolutionLocked && (
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ fontSize: '1.5rem', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                    >
                      🔒
                    </span>
                  )}
                </button>
              ) : (
                <img
                  src={getSpriteForStage(stageId, eggType)}
                  alt={isReached ? evolution.name : 'revealed evolution'}
                  className="w-12 h-12 object-contain"
                  style={{ imageRendering: 'pixelated', filter: isReached ? 'none' : 'brightness(0.35) grayscale(0.35)' }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`${isReached ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {hidden ? '???' : evolution.name}
                </h3>
                {!hidden && (
                  <span className="text-gray-400" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {L(evolution.stageName)}
                  </span>
                )}
                {isCurrent && (
                  <span className={`${colors.bg} text-white text-xs px-2 py-0.5 rounded`} style={{ fontFamily: 'monospace' }}>
                    CURRENT
                  </span>
                )}
                {isCurrent && evolutionLocked && (
                  <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded" style={{ fontFamily: 'monospace' }}>
                    🔒 {isPt ? 'EVOLUÇÃO TRAVADA' : 'EVOLUTION LOCKED'}
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
                  onClick={() => handleDegenerateClick(evolution)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs transition-colors"
                  style={{ fontFamily: 'monospace' }}
                >
                  {isPt ? 'Degenerar' : 'Degenerate'}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Arrow */}
        {index < pathLength - 1 && (
          <div className="flex justify-center py-1">
            <ChevronDown size={20} className={isReached ? colors.text : 'text-gray-400'} />
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
              {confirmDegenerate.isSecondConfirm
                ? (isPt ? '⚠️ AVISO FINAL!' : '⚠️ FINAL WARNING!')
                : (isPt ? '⚠️ Confirmar degeneração' : '⚠️ Confirm Degeneration')}
            </h3>
            <p className="text-gray-700 mb-6" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {confirmDegenerate.isSecondConfirm
                ? (isPt
                    ? `Tem CERTEZA ABSOLUTA que quer degenerar para ${confirmDegenerate.name}? Essa ação NÃO pode ser desfeita!`
                    : `Are you ABSOLUTELY SURE you want to degenerate to ${confirmDegenerate.name}? This action CANNOT be undone!`)
                : (isPt
                    ? `Quer degenerar para ${confirmDegenerate.name}? Você vai perder o progresso além deste estágio.`
                    : `Do you want to degenerate to ${confirmDegenerate.name}? You will lose all progress beyond this stage.`)
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDegenerateCancel}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {isPt ? 'Cancelar' : 'Cancel'}
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
                {confirmDegenerate.isSecondConfirm ? (isPt ? 'SIM, DEGENERAR!' : 'YES, DEGENERATE!') : (isPt ? 'Confirmar' : 'Confirm')}
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
              👁️ {isPt ? 'Revelar essa evolução?' : 'Reveal this evolution?'}
            </h3>
            <p className="text-gray-700 mb-6" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {isPt
                ? 'Essa é uma evolução futura que você ainda não desbloqueou — espiar é spoiler! Ela vai aparecer escurecida e esconder de novo quando você sair dessa tela.'
                : "This is a future evolution you haven't unlocked yet — peeking is a spoiler! It'll show up darkened, and hide again once you leave this screen."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReveal(null)}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleRevealConfirm}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-colors"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {isPt ? 'Sim, revelar' : 'Yes, reveal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Balance */}
      <div className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
        <p className="text-gray-700 mb-2" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {isPt ? 'ATRIBUTOS ATUAIS' : 'CURRENT ATTRIBUTES'}
        </p>
        <div className="flex justify-between text-sm" style={{ fontFamily: 'monospace' }}>
          <span className="text-[#22A900]" style={{ fontWeight: '600' }}>
            🦠 {isPt ? 'Vírus' : 'Virus'}: {virusPoints}
          </span>
          <span className="text-[#009ED8]" style={{ fontWeight: '600' }}>
            💾 {isPt ? 'Dado' : 'Data'}: {dataPoints}
          </span>
          <span className="text-[#E69600]" style={{ fontWeight: '600' }}>
            💉 {isPt ? 'Vacina' : 'Vaccine'}: {vaccinePoints}
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

      {/* Rookie — Branching Point */}
      {rookie && (
        <div className="mb-4">
          {renderEvolutionCard(rookie, { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500', aura: 'shadow-teal-500/50' }, 0, 1)}
        </div>
      )}

      {/* Branch Selector Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent flex-1" />
        <span className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
          {isPt ? 'LINHAS DE EVOLUÇÃO' : 'EVOLUTION BRANCHES'}
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
          renderEvolutionCard(evolution, colors, index, branchPath.length + 1),
        )}
        {ultra && renderEvolutionCard(ultra, colors, branchPath.length, branchPath.length + 1)}
      </div>
    </div>
  );
}

interface BranchColors { bg: string; text: string; border: string; aura: string }

function getBranchColor(branch: Attr): BranchColors {
  switch (branch) {
    case 'virus': return { bg: 'bg-[#22A900]', text: 'text-[#22A900]', border: 'border-[#22A900]', aura: 'shadow-[#22A900]/50' };
    case 'data': return { bg: 'bg-[#009ED8]', text: 'text-[#009ED8]', border: 'border-[#009ED8]', aura: 'shadow-[#009ED8]/50' };
    case 'vaccine': return { bg: 'bg-[#E69600]', text: 'text-[#E69600]', border: 'border-[#E69600]', aura: 'shadow-[#E69600]/50' };
  }
}
