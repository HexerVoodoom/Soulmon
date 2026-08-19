/**
 * EVOLUÇÃO — a árvore, e a criatura como heroína dela.
 * ===================================================
 *
 * REVAMP. Três coisas mudaram de APRESENTAÇÃO (nenhuma regra mudou):
 *
 * 1. **A criatura abre a tela**, dentro do `<Viewport>` — o elemento de marca —
 *    em escala inteira, e a ação dominante da página (o CADEADO de evolução)
 *    mora logo abaixo dela, como um botão de verdade com 44px. O cadeado
 *    continua também no nó ATUAL do grafo, que é o gesto que a regra descreve
 *    ("tocar na criatura atual alterna `evolutionLocked`"); o botão é o mesmo
 *    estado, dito em palavras, para quem não descobre o gesto.
 *
 * 2. **O progresso virou PALAVRA.** Era `3/7 dias` numa barra. Agora é
 *    "Faltam 4 dias perfeitos" / "Pronto para evoluir" — a frase que responde à
 *    única pergunta que o jogador faz nesta tela. A barra ficou como apoio
 *    visual, não como o portador do dado.
 *
 * 3. **Os atributos tinham DOIS desenhos na mesma tela** (PNG pixel-art no
 *    "alinhamento atual" e SVG inline no seletor de galho — o achado do
 *    inventário, `docs/PLANO-DESIGN.md` §4.3). Unificado no SVG inline de
 *    `AlignmentIcons`: é arte nossa, é vetor e RECOLORE, que é justamente o
 *    que o PNG não fazia quando o botão ativo pinta o fundo com a cor do
 *    atributo.
 *
 * PRESERVADO integralmente: a árvore por galho, o tronco rookie compartilhado,
 * o Ultra atrás dos 3 megas, o cadeado `evolutionLocked`, a degeneração com
 * dupla confirmação, o spoiler-guard das formas futuras, o galho previsto e o
 * desempate por ritmo de cuidado, e a situação de cada nó dita em PALAVRAS no
 * `aria-label` (WCAG 1.4.1: cor e posição nunca são o único portador).
 */
import { useState, useMemo, type CSSProperties } from 'react';
import { SoulNode, type SoulNodeVisual } from './evolution/SoulNode';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { getSpriteForStage } from '../utils/sprites';
import { creatureFormId, type CreatureStage, type LText } from '../utils/oracle';
import { AVAILABLE_BRANCHES, clampBranch } from '../types/progression';
import { ALIGN_TO_ATTR, ATTR_COLOR, ATTR_INK, ATTR_LABEL, ATTR_ON_FILL_INK } from '../types/attributes';
import { Viewport } from './ui/Viewport';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';

type Attr = 'virus' | 'data' | 'vaccine';
// ALIGN_TO_ATTR mudou para types/attributes.ts quando o EvoTrail da Home
// passou a precisar do mesmo mapa (footgun 9: cópia diverge em silêncio).
const ATTR_ORDER: Attr[] = ['virus', 'data', 'vaccine'];

/**
 * UM jogo de ícone de atributo, e só um. Antes eram dois na mesma tela (PNG
 * pixel-art + SVG inline). Ganhou o SVG: ele herda a cor, então serve tanto
 * sobre superfície neutra (tinta do atributo) quanto sobre o preenchimento do
 * botão ativo (tinta escura por cima do fill) — um PNG ciano/cobre sobre
 * verde/azul/laranja simplesmente não tinha como ficar legível.
 * O RÓTULO não é duplicado aqui: vem de `types/attributes.ts`.
 */
const ATTR_GLYPH: Record<Attr, typeof PowerIcon> = { virus: PowerIcon, data: HarmonyIcon, vaccine: BenevolenceIcon };

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

const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(4, 18, 20, .10), 0 4px 12px rgba(4, 18, 20, .10)',
  padding: 16,
};

const sectionLabel: CSSProperties = {
  ...sm2Hint,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
};

/** O sprite dentro do visor: escala inteira, sem suavização. */
const spriteInScreen: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  imageRendering: 'pixelated',
};

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
  // Locked evolutions are hidden behind a "?" (spoiler guard). The user can
  // reveal one (shown darkened) after confirming; this local set resets when
  // they leave the screen (the component unmounts on navigation).
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
  const branchHex = ATTR_COLOR[selectedBranch];

  const formaAtual = stages.find(s => creatureFormId(s) === currentStageId);

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

  // ── O progresso, em PALAVRAS. `Math.max(0, …)` porque `perfectDays` pode
  //    passar do requisito enquanto a evolução está travada — e "faltam -2"
  //    seria um jeito criativo de dizer "pronto". ──
  const faltam = Math.max(0, digivolutionSegmentsNeeded - digivolutionSegments);
  const prontoParaEvoluir = faltam === 0;
  const ratio = digivolutionSegmentsNeeded > 0
    ? Math.min(1, digivolutionSegments / digivolutionSegmentsNeeded)
    : 1;
  const fraseProgresso = prontoParaEvoluir
    ? (evolutionLocked
        ? (isPt ? 'Pronto para evoluir — mas você segurou a evolução.' : 'Ready to evolve — but you are holding it back.')
        : (isPt ? 'Pronto para evoluir na virada do dia.' : 'Ready to evolve at the day’s turn.'))
    : (isPt
        ? `Falta${faltam === 1 ? '' : 'm'} ${faltam} dia${faltam === 1 ? '' : 's'} perfeito${faltam === 1 ? '' : 's'}.`
        : `${faltam} perfect day${faltam === 1 ? '' : 's'} to go.`);

  /**
   * Um nó do grafo: coluna vertical de nós ligados por uma linha.
   *
   * NÃO existe regra nova aqui — `isCurrent`, `isReached`, `hidden`,
   * `isPreviousStage` e o galho previsto são exatamente os mesmos cálculos que
   * a página já fazia; o que mudou é a superfície da placa (kit pixel → tokens).
   */
  const renderEvolutionCard = (evolution: CreatureStage, hex: string, index: number, pathLength: number) => {
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

    /** A etiqueta de estado do nó. Uma palavra, caixa alta, nunca uma cor só. */
    const tag = (texto: string, style: CSSProperties) => (
      <span
        style={{
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-xs)',
          fontWeight: 500,
          letterSpacing: '.04em',
          padding: '2px 8px',
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          ...style,
        }}
      >
        {texto}
      </span>
    );

    return (
      <div key={stageId} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Trilho do grafo: o nó e a linha que desce até o próximo. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <SoulNode
            visual={visual}
            size={48}
            tone={isReached && !isCurrent ? hex : undefined}
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
              aria-hidden="true"
              style={{
                width: 2,
                flex: 1,
                minHeight: 28,
                backgroundColor: isReached ? hex : 'var(--sm2-line)',
              }}
            />
          )}
        </div>

        {/* Placa do nó: nome, estágio e situação. */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: index < pathLength - 1 ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3
              style={{
                fontFamily: 'var(--sm2-font-display)',
                fontSize: 'var(--sm2-text-md)',
                fontWeight: 600,
                lineHeight: 'var(--sm2-leading-title)',
                color: isReached ? 'var(--sm2-ink)' : 'var(--sm2-muted)',
                margin: 0,
              }}
            >
              {hidden ? '???' : evolution.name}
            </h3>
            {!hidden && <span style={sm2Hint}>{L(evolution.stageName)}</span>}
            {isCurrent && tag(isPt ? 'ATUAL' : 'CURRENT', { backgroundColor: hex, color: ATTR_ON_FILL_INK })}
            {isForecast && tag(isPt ? 'PREVISTA' : 'FORECAST', {
              border: '1px solid var(--sm2-primary-ink)', color: 'var(--sm2-primary-ink)',
            })}
            {isCurrent && evolutionLocked && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', fontWeight: 500,
                  padding: '2px 8px', borderRadius: 999,
                  backgroundColor: 'var(--sm2-gold-fill)', color: 'var(--sm2-on-gold)',
                }}
              >
                <Icon name="lock" size={20} style={{ fontSize: 14, width: 14, height: 14 }} />
                {isPt ? 'TRAVADA' : 'LOCKED'}
              </span>
            )}
            {isUltraMode && tag(isPt ? 'ZÊNITE' : 'ZENITH', {
              backgroundColor: 'var(--sm2-gold-fill)', color: 'var(--sm2-on-gold)',
            })}
            {!isReached && tag(isPt ? 'BLOQUEADA' : 'LOCKED', {
              border: '1px solid var(--sm2-line)', color: 'var(--sm2-muted)',
            })}
          </div>
          {isPreviousStage && (
            <button
              type="button"
              onClick={() => handleDegenerateClick(evolution)}
              style={{ ...sm2Button('quiet'), marginTop: 4, padding: '10px 0' }}
            >
              {isPt ? 'Degenerar' : 'Degenerate'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>

      {/* Degeneração — dupla confirmação preservada, agora com foco preso e
          Escape (o modal antigo não tinha nenhum dos dois). */}
      <ModalSheet
        open={!!confirmDegenerate}
        onClose={() => setConfirmDegenerate(null)}
        language={language}
        title={confirmDegenerate?.isSecondConfirm
          ? (isPt ? 'Aviso final' : 'Final warning')
          : (isPt ? 'Confirmar degeneração' : 'Confirm degeneration')}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setConfirmDegenerate(null)} style={{ ...sm2Button('ghost'), flex: 1 }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDegenerateConfirm}
              style={{
                ...sm2Button('primary'),
                flex: 1,
                ...(confirmDegenerate?.isSecondConfirm
                  ? { backgroundColor: 'var(--sm2-danger-fill)', color: 'var(--sm2-on-danger)' }
                  : null),
              }}
            >
              {confirmDegenerate?.isSecondConfirm
                ? (isPt ? 'Sim, degenerar' : 'Yes, degenerate')
                : (isPt ? 'Confirmar' : 'Confirm')}
            </button>
          </div>
        }
      >
        <p style={sm2Text}>
          {confirmDegenerate?.isSecondConfirm
            ? (isPt
                ? `Tem certeza absoluta que quer degenerar para ${confirmDegenerate?.name}? Essa ação NÃO pode ser desfeita.`
                : `Are you absolutely sure you want to degenerate to ${confirmDegenerate?.name}? This action CANNOT be undone.`)
            : (isPt
                ? `Quer degenerar para ${confirmDegenerate?.name}? Você vai perder o progresso além deste estágio.`
                : `Do you want to degenerate to ${confirmDegenerate?.name}? You will lose all progress beyond this stage.`)}
        </p>
      </ModalSheet>

      {/* Spoiler-guard das formas futuras. */}
      <ModalSheet
        open={!!confirmReveal}
        onClose={() => setConfirmReveal(null)}
        language={language}
        title={isPt ? 'Revelar essa evolução?' : 'Reveal this evolution?'}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setConfirmReveal(null)} style={{ ...sm2Button('ghost'), flex: 1 }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="button" onClick={handleRevealConfirm} style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Sim, revelar' : 'Yes, reveal'}
            </button>
          </div>
        }
      >
        <p style={sm2Text}>
          {isPt
            ? 'Essa é uma evolução futura que você ainda não desbloqueou — espiar é spoiler. Ela vai aparecer escurecida e esconder de novo quando você sair dessa tela.'
            : "This is a future evolution you haven't unlocked yet — peeking is a spoiler. It'll show up darkened, and hide again once you leave this screen."}
        </p>
      </ModalSheet>

      {/* ─────────── A HEROÍNA + A AÇÃO DOMINANTE ─────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Viewport
          width={64}
          height={64}
          scale={3}
          label={formaAtual
            ? (isPt ? `${formaAtual.name}, forma atual` : `${formaAtual.name}, current form`)
            : (isPt ? 'Seu Soulmon' : 'Your Soulmon')}
          screenStyle={{ position: 'relative' }}
        >
          <img src={getSpriteForStage(currentStageId, demoCharacterId)} alt="" style={spriteInScreen} />
        </Viewport>

        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <p
            style={{
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-lg)',
              fontWeight: 600,
              lineHeight: 'var(--sm2-leading-title)',
              color: 'var(--sm2-ink)',
              margin: 0,
            }}
          >
            {fraseProgresso}
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={digivolutionSegmentsNeeded}
            aria-valuenow={Math.min(digivolutionSegments, digivolutionSegmentsNeeded)}
            aria-label={isPt ? 'Progresso até a próxima evolução' : 'Progress to the next evolution'}
            style={{
              margin: '12px auto 0', width: 200, height: 8, borderRadius: 999,
              backgroundColor: 'var(--sm2-surface-2)', overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(ratio * 100)}%`, height: '100%',
                backgroundColor: 'var(--sm2-primary-fill)',
                transition: 'width var(--sm2-dur-enter) var(--sm2-ease)',
              }}
            />
          </div>
        </div>

        {/* A ÚNICA ação da tela. O gesto no nó do grafo continua valendo — este
            botão é o mesmo estado dito em palavras, e com alvo de 44px. */}
        {onToggleEvolutionLock && (
          <button
            type="button"
            onClick={onToggleEvolutionLock}
            aria-pressed={evolutionLocked}
            style={{
              ...sm2Button(evolutionLocked ? 'primary' : 'ghost'),
              minWidth: 220,
            }}
          >
            <Icon name={evolutionLocked ? 'lock' : 'lock_open'} size={20} fill={evolutionLocked ? 1 : 0} />
            {evolutionLocked
              ? (isPt ? 'Evolução segurada' : 'Evolution on hold')
              : (isPt ? 'Segurar evolução' : 'Hold evolution')}
          </button>
        )}
        <p style={{ ...sm2Hint, textAlign: 'center', maxWidth: 340 }}>
          {evolutionLocked
            ? (isPt
                ? 'Os dias perfeitos continuam somando. Ele só espera você dizer quando.'
                : 'Perfect days keep adding up. It just waits for your go-ahead.')
            : (isPt
                ? 'Ele vai evoluir sozinho assim que o dia virar.'
                : 'It will evolve on its own at the next day’s turn.')}
        </p>
      </section>

      {/* ─────────── Para onde ele está indo ─────────── */}
      <section style={card}>
        <p style={sectionLabel}>{isPt ? 'Para onde ele está indo' : 'Where they are heading'}</p>

        {/* A FRASE vem antes dos números: é ela que responde à pergunta. */}
        {forecastBranch ? (
          <p style={{ ...sm2Text, marginTop: 6 }}>
            {isPt ? 'Seguindo para ' : 'Heading toward '}
            <strong style={{ color: ATTR_INK[forecastBranch] }}>{L(ATTR_LABEL[forecastBranch])}</strong>
            {isTie
              ? (carePattern
                  ? (isPt
                      ? ` — empate nos atributos, e o seu ritmo ${carePattern.namePt} desempata.`
                      : ` — attributes are tied, and your ${carePattern.nameEn} rhythm breaks it.`)
                  : (isPt
                      ? ' — empate nos atributos; cumprir mais tarefas de uma categoria decide.'
                      : ' — attributes are tied; completing more tasks of one category decides.'))
              : (isPt
                  ? '. Muda cumprindo mais tarefas de outra categoria.'
                  : '. Change it by completing more tasks of another category.')}
          </p>
        ) : (
          <p style={{ ...sm2Text, marginTop: 6 }}>
            {isPt
              ? 'Ainda não dá para dizer. Conclua tarefas e o galho aparece aqui.'
              : 'Too early to tell. Finish tasks and the branch shows up here.'}
          </p>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
          {ATTR_ORDER.map(a => {
            const Glyph = ATTR_GLYPH[a];
            const valor = a === 'virus' ? virusPoints : a === 'data' ? dataPoints : vaccinePoints;
            return (
              <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph size={18} color={ATTR_COLOR[a]} strokeWidth={2.2} />
                <span style={sm2Hint}>{L(ATTR_LABEL[a])}</span>
                <span className="sm2-num" style={{ ...sm2Text, fontWeight: 500, color: ATTR_INK[a] }}>{valor}</span>
              </span>
            );
          })}
        </div>
      </section>

      {/* ─────────── A árvore ─────────── */}
      <section>
        <p style={{ ...sectionLabel, marginBottom: 10 }}>
          {isPt ? 'Linhas de evolução' : 'Evolution branches'}
        </p>

        {/* Seletor de galho — só os branches disponíveis (transição de arte). */}
        <div role="radiogroup" aria-label={isPt ? 'Linha de evolução' : 'Evolution branch'} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(AVAILABLE_BRANCHES as readonly Attr[]).map(b => {
            const hex = ATTR_COLOR[b];
            const active = selectedBranch === b;
            const Glyph = ATTR_GLYPH[b];
            return (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedBranch(b)}
                style={{
                  ...sm2Button(active ? 'primary' : 'ghost'),
                  flex: 1,
                  padding: '10px 8px',
                  // Branco sobre os três preenchimentos media 2,4–3,1:1 (medido);
                  // a tinta escura mede 5,4–7,0:1.
                  ...(active
                    ? { backgroundColor: hex, color: ATTR_ON_FILL_INK, borderColor: hex }
                    : { color: ATTR_INK[b] }),
                }}
              >
                <Glyph size={18} color={active ? ATTR_ON_FILL_INK : hex} strokeWidth={2.2} />
                {L(ATTR_LABEL[b])}
              </button>
            );
          })}
        </div>

        {branchPath.length === 0 && !ultra ? (
          // Sem a árvore do oráculo (save antigo ou incompleto) não há o que
          // desenhar. Antes ficava só um vazio enorme abaixo dos botões, e a
          // tela parecia quebrada.
          <div style={{ ...card, textAlign: 'center' }}>
            {/* `pets` e não `account_tree`: o inventário da fonte subsetada tem
                102 nomes e `account_tree` não está nele — nome fora do
                inventário renderiza VAZIO e não dá erro (tokens.md §5). */}
            <Icon name="pets" size={40} tone="muted" />
            <p style={{ ...sm2Text, fontWeight: 500, marginTop: 8 }}>
              {isPt ? 'Sua árvore ainda não foi revelada' : 'Your tree hasn’t been revealed yet'}
            </p>
            <p style={{ ...sm2Hint, marginTop: 6 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rookie && renderEvolutionCard(rookie, 'var(--sm2-primary-fill)', i++, total)}
                {branchPath.map(evolution => renderEvolutionCard(evolution, branchHex, i++, total))}
                {ultra && renderEvolutionCard(ultra, branchHex, i++, total)}
              </div>
            );
          })()
        )}
      </section>
    </div>
  );
}
