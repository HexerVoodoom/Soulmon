import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { DigivolutionProgress } from './DigivolutionProgress';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { getSpriteForStage } from '../utils/sprites';
import { creatureFormId, type CreatureStage, type AlignmentId, type LText } from '../utils/oracle';
import { AVAILABLE_BRANCHES, clampBranch } from '../types/progression';

type Attr = 'virus' | 'data' | 'vaccine';
const ALIGN_TO_ATTR: Record<AlignmentId, Attr> = { poder: 'virus', harmonia: 'data', benevolencia: 'vaccine' };
const ATTR_ORDER: Attr[] = ['virus', 'data', 'vaccine'];
// Nomenclatura do Soulmon (não mais Virus/Data/Vaccine) — o mesmo alinhamento
// já usado pelo oráculo no onboarding, agora refletido de volta na UI.
const ATTR_LABEL: Record<Attr, LText> = {
  virus: { pt: 'Poder', en: 'Power' },
  data: { pt: 'Harmonia', en: 'Harmony' },
  vaccine: { pt: 'Benevolência', en: 'Benevolence' },
};
const ATTR_ICON: Record<Attr, typeof PowerIcon> = { virus: PowerIcon, data: HarmonyIcon, vaccine: BenevolenceIcon };

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
  /** Modo demo (utils/monetization.ts): personagem pré-pronto escolhido — sobrepõe eggType no sprite. */
  demoCharacterId?: string;
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
  demoCharacterId,
  unlockedEvolutions = [],
  evolutionLocked = false,
  onToggleEvolutionLock,
  language = 'en-US',
}: EvolutionPathProps) {
  const isPt = language === 'pt-BR';
  const L = (t: LText) => (isPt ? t.pt : t.en);
  const unlockedSet = useMemo(() => new Set(unlockedEvolutions), [unlockedEvolutions]);
  const [selectedBranch, setSelectedBranch] = useState<Attr>(clampBranch(currentBranch));
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
        <div
          className={`sm-card p-4 transition-all ${isCurrent ? 'shadow-md' : !isReached ? 'opacity-50' : ''}`}
          style={isCurrent ? { borderColor: colors.hex, boxShadow: `0 0 0 1.5px ${colors.hex}, 0 4px 14px ${colors.hex}33` } : undefined}
        >
          <div className="flex items-center gap-3">
            {/* Sprite — locked evolutions are hidden behind a pixelated "?".
                Tapping the CURRENT Soulmon toggles the evolution padlock. */}
            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--sm-bg)' }}>
              {hidden ? (
                <button
                  onClick={() => setConfirmReveal(evolution)}
                  aria-label={isPt ? 'Revelar evolução (spoiler)' : 'Reveal evolution (spoiler)'}
                  title={isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)'}
                  className="w-12 h-12 flex items-center justify-center rounded-lg transition-colors"
                  style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--sm-muted)', cursor: 'pointer' }}
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
                  className="relative w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer"
                >
                  <img
                    src={getSpriteForStage(stageId, eggType, demoCharacterId)}
                    alt={evolution.name}
                    className="w-12 h-12 object-contain"
                    style={{ imageRendering: 'pixelated', opacity: evolutionLocked ? 0.55 : 1 }}
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
                  alt={isReached ? evolution.name : (isPt ? 'evolução revelada' : 'revealed evolution')}
                  className="w-12 h-12 object-contain"
                  style={{ imageRendering: 'pixelated', opacity: isReached ? 1 : 0.45 }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: isReached ? 'var(--sm-ink)' : 'var(--sm-muted)' }}>
                  {hidden ? '???' : evolution.name}
                </h3>
                {!hidden && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--sm-muted)' }}>
                    {L(evolution.stageName)}
                  </span>
                )}
                {isCurrent && (
                  <span className="text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: colors.hex, fontSize: '0.65rem' }}>
                    {isPt ? 'ATUAL' : 'CURRENT'}
                  </span>
                )}
                {isCurrent && evolutionLocked && (
                  <span className="text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--sm-muted)', fontSize: '0.65rem' }}>
                    🔒 {isPt ? 'TRAVADA' : 'LOCKED'}
                  </span>
                )}
                {isUltraMode && (
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ fontSize: '0.65rem' }}>
                    {isPt ? 'ZÊNITE' : 'ZENITH'}
                  </span>
                )}
              </div>
            </div>

            {/* Status / Action Button */}
            <div className="flex-shrink-0">
              {!isReached ? (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--sm-line)', color: 'var(--sm-muted)' }}>
                  🔒
                </div>
              ) : isPreviousStage ? (
                <button
                  onClick={() => handleDegenerateClick(evolution)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'var(--sm-bg)', color: 'var(--sm-muted)' }}
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
            <ChevronDown size={18} color={isReached ? colors.hex : 'var(--sm-line)'} />
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
          <div className="sm-card p-6 max-w-sm w-full">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sm-ink)', marginBottom: 16 }}>
              {confirmDegenerate.isSecondConfirm
                ? (isPt ? '⚠️ Aviso final!' : '⚠️ Final warning!')
                : (isPt ? '⚠️ Confirmar degeneração' : '⚠️ Confirm degeneration')}
            </h3>
            <p style={{ color: 'var(--sm-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
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
              <button onClick={handleDegenerateCancel} className="sm-btn sm-btn-secondary flex-1">
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleDegenerateConfirm}
                className="flex-1 py-2.5 rounded-2xl text-white font-bold transition-colors"
                style={{ background: confirmDegenerate.isSecondConfirm ? '#e0483e' : 'var(--sm-ink)' }}
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
          <div className="sm-card p-6 max-w-sm w-full">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sm-ink)', marginBottom: 16 }}>
              👁️ {isPt ? 'Revelar essa evolução?' : 'Reveal this evolution?'}
            </h3>
            <p style={{ color: 'var(--sm-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              {isPt
                ? 'Essa é uma evolução futura que você ainda não desbloqueou — espiar é spoiler! Ela vai aparecer escurecida e esconder de novo quando você sair dessa tela.'
                : "This is a future evolution you haven't unlocked yet — peeking is a spoiler! It'll show up darkened, and hide again once you leave this screen."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReveal(null)} className="sm-btn sm-btn-secondary flex-1">
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={handleRevealConfirm} className="sm-btn flex-1">
                {isPt ? 'Sim, revelar' : 'Yes, reveal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Balance */}
      <div className="sm-card p-4 mb-4">
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sm-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
          {isPt ? 'Alinhamento atual' : 'Current alignment'}
        </p>
        <div className="flex justify-between text-sm">
          {ATTR_ORDER.map(a => {
            const Icon = ATTR_ICON[a];
            return (
              <span key={a} className="flex items-center gap-1.5" style={{ fontWeight: 700, color: getBranchColor(a).hex, fontSize: '0.85rem' }}>
                <Icon size={16} color={getBranchColor(a).hex} strokeWidth={2.2} />
                {L(ATTR_LABEL[a])}: {a === 'virus' ? virusPoints : a === 'data' ? dataPoints : vaccinePoints}
              </span>
            );
          })}
        </div>
      </div>

      {/* Digivolution Progress */}
      <div className="mb-4">
        <DigivolutionProgress
          currentDays={digivolutionSegments}
          daysRequired={digivolutionSegmentsNeeded}
          theme={theme}
          language={language}
        />
      </div>

      {/* Rookie — Branching Point (cor neutra, não pertence a nenhum branch) */}
      {rookie && (
        <div className="mb-4">
          {renderEvolutionCard(rookie, { hex: '#14b8a6' }, 0, 1)}
        </div>
      )}

      {/* Branch Selector Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--sm-line)' }} />
        <span style={{ color: 'var(--sm-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
          {isPt ? 'LINHAS DE EVOLUÇÃO' : 'EVOLUTION BRANCHES'}
        </span>
        <div className="h-px flex-1" style={{ background: 'var(--sm-line)' }} />
      </div>

      {/* Seletor de branch — só os branches disponíveis (transição de arte) */}
      <div className="flex gap-2 mb-4">
        {(AVAILABLE_BRANCHES as readonly Attr[]).map(b => {
          const hex = getBranchColor(b).hex;
          const active = selectedBranch === b;
          const Icon = ATTR_ICON[b];
          return (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className="flex-1 py-2.5 rounded-xl border transition-all font-semibold flex items-center justify-center gap-1.5"
              style={{
                fontSize: '0.75rem',
                background: active ? hex : 'var(--sm-surface)',
                borderColor: active ? hex : 'var(--sm-line)',
                color: active ? '#fff' : hex,
              }}
            >
              <Icon size={16} color={active ? '#fff' : hex} strokeWidth={2.2} />
              {L(ATTR_LABEL[b])}
            </button>
          );
        })}
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

interface BranchColors { hex: string }

function getBranchColor(branch: Attr): BranchColors {
  switch (branch) {
    case 'virus': return { hex: '#22A900' };
    case 'data': return { hex: '#009ED8' };
    case 'vaccine': return { hex: '#E69600' };
  }
}
