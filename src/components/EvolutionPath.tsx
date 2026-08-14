import { useState, useMemo } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import { SoulNode, type SoulNodeVisual } from './evolution/SoulNode';
import iconLock from '../assets/soulmon/icons/icon-lock.png';
import { DigivolutionProgress } from './DigivolutionProgress';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { getSpriteForStage } from '../utils/sprites';
import { WalkingPetStrip } from './WalkingPetStrip';
import { creatureFormId, type CreatureStage, type AlignmentId, type LText } from '../utils/oracle';
import { AVAILABLE_BRANCHES, clampBranch } from '../types/progression';
import { ATTR_COLOR, ATTR_INK, ATTR_ON_FILL_INK } from '../types/attributes';

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
  /** Ritmo de cuidado — desempata o galho quando os atributos empatam. */
  carePattern?: { emoji: string; namePt: string; nameEn: string } | null;
  /** Galho que a próxima evolução vai seguir, já resolvido. */
  forecastBranch?: Attr;
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
  stages,
  eggType = 'tapirmon',
  demoCharacterId,
  unlockedEvolutions = [],
  evolutionLocked = false,
  onToggleEvolutionLock,
  language = 'en-US',
  carePattern,
  forecastBranch,
}: EvolutionPathProps) {
  const isPt = language === 'pt-BR';
  // Empate = mais de um atributo no topo. É quando o ritmo de cuidado decide.
  const topAttr = Math.max(virusPoints, dataPoints, vaccinePoints);
  const isTie = topAttr > 0
    && [virusPoints, dataPoints, vaccinePoints].filter(v => v === topAttr).length > 1;
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

  /**
   * O nó que a página JÁ dizia em texto ("Seguindo para Harmonia"), agora
   * marcado também no grafo. Reapresentação: `forecastBranch` vem pronto de
   * quem chama; aqui só se acha o primeiro nó ainda não alcançado do galho
   * previsto — e só quando o galho exibido É o previsto.
   */
  const forecastStageId = forecastBranch && selectedBranch === forecastBranch
    ? (branchPath
        .map(s => creatureFormId(s))
        .find(id => id !== currentStageId && !unlockedSet.has(id)) ?? null)
    : null;

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

  /**
   * Um nó do grafo (Ref C: coluna vertical de losangos ligados por linhas).
   *
   * NÃO existe regra nova aqui — `isCurrent`, `isReached`, `hidden`,
   * `isPreviousStage` e o galho previsto são exatamente os mesmos cálculos que
   * a página já fazia; o que mudou é a apresentação (lista de fichas → grafo).
   */
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

    const isForecast = !isReached && stageId === forecastStageId;
    const visual: SoulNodeVisual = isCurrent
      ? 'current'
      : isReached ? 'reached'
      : isForecast ? 'forecast'
      : 'locked';

    // Situação em PALAVRAS: a cor e a posição do nó não podem ser o único
    // portador da informação (WCAG 1.4.1).
    const situacao = isCurrent
      ? (isPt ? 'forma atual' : 'current form')
      : isReached ? (isPt ? 'já alcançada' : 'already reached')
      : isForecast ? (isPt ? 'próxima prevista, ainda bloqueada' : 'next forecast, still locked')
      : (isPt ? 'bloqueada' : 'locked');
    const nome = hidden ? (isPt ? 'Evolução oculta' : 'Hidden evolution') : evolution.name;
    const nodeLabel = hidden
      ? `${nome} — ${situacao}. ${isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)'}`
      : isCurrent && onToggleEvolutionLock
        ? `${nome} — ${situacao}. ${evolutionLocked
            ? (isPt ? 'Evolução travada, toque para destravar' : 'Evolution locked, tap to unlock')
            : (isPt ? 'Evolução destravada, toque para travar' : 'Evolution unlocked, tap to lock')}`
        : `${nome} — ${situacao}`;

    return (
      <div key={stageId} className="sm-px-tree-row">
        {/* Trilho do grafo: o nó e a linha que desce até o próximo. */}
        <div className="sm-px-tree-rail">
          <SoulNode
            visual={visual}
            size={48}
            tone={isReached && !isCurrent ? colors.hex : undefined}
            ring={isCurrent}
            sprite={hidden ? undefined : getSpriteForStage(stageId, isCurrent ? demoCharacterId : undefined)}
            label={nodeLabel}
            title={hidden
              ? (isPt ? 'Revelar (spoiler)' : 'Reveal (spoiler)')
              : isCurrent && onToggleEvolutionLock
                ? (evolutionLocked ? (isPt ? 'Destravar evolução' : 'Unlock evolution') : (isPt ? 'Travar evolução' : 'Lock evolution'))
                : nome}
            onClick={hidden
              ? () => setConfirmReveal(evolution)
              : isCurrent && onToggleEvolutionLock ? onToggleEvolutionLock : undefined}
          />
          {index < pathLength - 1 && (
            <span
              className={`sm-px-tree-link${isReached ? ' sm-px-tree-link-on' : ''}`}
              aria-hidden="true"
              style={isReached ? { ['--sm-px-link-tone' as string]: colors.hex } : undefined}
            />
          )}
        </div>

        {/* Placa do nó: nome, estágio e situação. */}
        <div className={`sm-px-tree-plate${isCurrent ? ' sm-px-tree-plate-current' : ''}${!isReached ? ' sm-px-tree-plate-locked' : ''}`}>
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
              <span className="sm-px-tree-tag" style={{ background: colors.hex, color: ATTR_ON_FILL_INK }}>
                {isPt ? 'ATUAL' : 'CURRENT'}
              </span>
            )}
            {isForecast && (
              <span className="sm-px-tree-tag sm-px-tree-tag-forecast">
                {isPt ? 'PREVISTA' : 'FORECAST'}
              </span>
            )}
            {isCurrent && evolutionLocked && (
              <span className="sm-px-tree-tag" style={{ background: 'var(--sm-ink)', color: 'var(--sm-bg)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <img src={iconLock} alt="" width={10} height={10} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} /> {isPt ? 'TRAVADA' : 'LOCKED'}
              </span>
            )}
            {isUltraMode && (
              <span className="sm-px-tree-tag" style={{ background: 'var(--sm-gold)', color: 'var(--sm-bg)' }}>
                {isPt ? 'ZÊNITE' : 'ZENITH'}
              </span>
            )}
            {!isReached && (
              <span className="sm-px-tree-tag sm-px-tree-tag-locked">
                <img src={iconLock} alt="" width={10} height={10} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                {isPt ? 'BLOQUEADA' : 'LOCKED'}
              </span>
            )}
          </div>
          {isPreviousStage && (
            <button
              onClick={() => handleDegenerateClick(evolution)}
              className="sm-px-tree-degen"
            >
              {isPt ? 'Degenerar' : 'Degenerate'}
            </button>
          )}
        </div>
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

      <WalkingPetStrip stageId={currentStageId} demoCharacterId={demoCharacterId} />

      {/* Attribute Balance */}
      <div className="sm-card p-4 mb-4">
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sm-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
          {isPt ? 'Alinhamento atual' : 'Current alignment'}
        </p>
        <div className="flex justify-between text-sm">
          {ATTR_ORDER.map(a => {
            const Icon = ATTR_ICON[a];
            return (
              // TEXTO na tinta legível; o ÍCONE segue a cor de identidade
              // (elemento de interface, mínimo 3:1, que ela cumpre).
              <span key={a} className="flex items-center gap-1.5" style={{ fontWeight: 700, color: ATTR_INK[a], fontSize: '0.85rem' }}>
                <Icon size={16} color={getBranchColor(a).hex} strokeWidth={2.2} />
                {L(ATTR_LABEL[a])}: {a === 'virus' ? virusPoints : a === 'data' ? dataPoints : vaccinePoints}
              </span>
            );
          })}
        </div>

        {/* Os números sozinhos não dizem PARA ONDE o pet está indo — o jogador
            tinha que inferir. Esta linha fecha a alça: mostra o galho previsto
            e, no empate, quem decide. */}
        {forecastBranch && (
          <p style={{ fontSize: '0.76rem', color: 'var(--sm-muted)', marginTop: 10, lineHeight: 1.45 }}>
            {isPt ? 'Seguindo para ' : 'Heading toward '}
            <strong style={{ color: ATTR_INK[forecastBranch] }}>{L(ATTR_LABEL[forecastBranch])}</strong>
            {isTie
              ? (carePattern
                  ? (isPt
                      ? ` — empate nos atributos, e o seu ritmo ${carePattern.emoji} ${carePattern.namePt} desempata.`
                      : ` — attributes are tied, and your ${carePattern.emoji} ${carePattern.nameEn} rhythm breaks it.`)
                  : (isPt
                      ? ' — empate nos atributos; cumprir mais tarefas de uma categoria decide.'
                      : ' — attributes are tied; completing more tasks of one category decides.'))
              : (isPt
                  ? '. Muda cumprindo mais tarefas de outra categoria.'
                  : '. Change it by completing more tasks of another category.')}
          </p>
        )}
      </div>

      {/* Digivolution Progress */}
      <div className="mb-4">
        <DigivolutionProgress
          currentDays={digivolutionSegments}
          daysRequired={digivolutionSegmentsNeeded}
          language={language}
        />
      </div>

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
                // Branco sobre os três preenchimentos media 2,4–3,1:1 (medido);
                // a tinta escura mede 5,4–7,0:1.
                color: active ? ATTR_ON_FILL_INK : ATTR_INK[b],
              }}
            >
              <Icon size={16} color={active ? ATTR_ON_FILL_INK : hex} strokeWidth={2.2} />
              {L(ATTR_LABEL[b])}
            </button>
          );
        })}
      </div>

      {/* Grafo da árvore (Ref C): coluna vertical de nós de cristal ligados
          por linhas. O Rookie é o TRONCO — mesmo nó para os três galhos —,
          por isso encabeça a coluna em vez de morar numa ficha à parte. */}
      <div className="sm-px-tree">
        {branchPath.length === 0 && !ultra ? (
          // Sem a árvore do oráculo (save antigo ou incompleto) não há o que
          // desenhar. Antes ficava só um vazio enorme abaixo dos botões, e a
          // tela parecia quebrada.
          <div className="sm-card" style={{ padding: 20, textAlign: 'center' }}>
            <img src={ravenMascot} alt="" width={52} height={52} style={{ objectFit: 'contain', margin: '0 auto 10px', opacity: 0.85 }} />
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--sm-ink)' }}>
              {isPt ? 'Sua árvore ainda não foi revelada' : 'Your tree hasn’t been revealed yet'}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--sm-muted)' }}>
              {isPt
                ? 'Cuide do seu Soulmon e conclua as tarefas do dia — as próximas formas aparecem aqui conforme ele evolui.'
                : 'Care for your Soulmon and finish today’s tasks — the next forms show up here as it evolves.'}
            </p>
          </div>
        ) : (
          (() => {
            // Uma coluna só: tronco (rookie) → galho escolhido → ultra.
            const total = (rookie ? 1 : 0) + branchPath.length + (ultra ? 1 : 0);
            let i = 0;
            return (
              <>
                {rookie && renderEvolutionCard(rookie, { hex: '#14b8a6' }, i++, total)}
                {branchPath.map(evolution => renderEvolutionCard(evolution, colors, i++, total))}
                {ultra && renderEvolutionCard(ultra, colors, i++, total)}
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}

interface BranchColors { hex: string }

function getBranchColor(branch: Attr): BranchColors {
  return { hex: ATTR_COLOR[branch] };
}
