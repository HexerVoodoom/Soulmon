import { useRef, useState, type CSSProperties } from 'react';
import { lotIconName } from '../../utils/lotIcons';
import { MindTutorialScreen, MindTutorialLink, useMindTutorial } from './MindTutorial';
import type { EarningGameProps } from './types';
import { sm2Button } from '../form/FormKit';
import { sceneBackground } from '../../utils/fxPackArt';
import { GameRoot, GameHeader, phaseTitle, phaseLine, gameExitConfirm } from '../games/GameKit';
import { BitsAmount } from '../ui/BitsAmount';
import { ResultScreen } from '../games/ResultScreen';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { getSpriteForStage } from '../../utils/sprites';
import {
  SELO_MAX_BITS, SELO_ROUND, seloBits, seloForLevel, seloStep, type SeloPuzzle,
} from '../../utils/mente/selo';
import { SeloSeal, seloLabel } from './SeloSeal';

/**
 * SELO FALTANTE (id `selo`) — matriz 3×3 de selos arcanos; falta o de baixo à direita; escolha entre 6.
 * A regra é de `utils/mente/selo.ts`; aqui só tela. Selos desenhados em SVG (forma, pontos, gema,
 * preenchimento, marcas do anel) na paleta do kit — natureza + magia, sem engrenagem.
 *
 * Regras de casa: nasce MUDO; errar não pinta nada de vermelho (só mostra qual era e segue);
 * copy descreve o que o jogo pede, sem promessa de efeito. 8 matrizes por rodada.
 */

type Phase = 'intro' | 'play' | 'reveal' | 'done';

/** A linha de fase mora sobre a cena pintada do Ateliê: o `muted` padrão some no turquesa. */
const linhaNaCena: CSSProperties = { ...phaseLine, color: 'var(--sm2-ink)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' };

export function SeloGame({ language, evolutionStage, demoCharacterId, onEarnPoints, onExit, challenge, tutorial }: EarningGameProps) {
  const isPt = language === 'pt-BR';
  const tut = useMindTutorial(tutorial);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [puzzle, setPuzzle] = useState<SeloPuzzle>(() => seloForLevel(1, Math.random));
  const [earned, setEarned] = useState(0);
  const paid = useRef(false);

  const title = isPt ? 'Selo Faltante' : 'Missing Seal';

  const start = () => {
    paid.current = false;
    setIdx(0); setCorrect(0); setEarned(0); setPicked(null);
    setPuzzle(seloForLevel(level, Math.random));
    setPhase('play');
  };

  const finish = (total: number) => {
    setPhase('done');
    const bits = seloBits(total);
    setEarned(bits);
    // Uma vez por rodada (o feito/missão do dia conta a rodada, mesmo sem Bits).
    if (!paid.current) {
      paid.current = true;
      if (bits > 0) setEarned(onEarnPoints(bits) ?? bits);
      else onEarnPoints(bits);
    }
  };

  const pick = (i: number) => {
    if (phase !== 'play') return;
    const ok = i === puzzle.answer;
    if (!reduced) { try { navigator.vibrate?.(15); } catch { /* noop */ } }
    if (challenge) { challenge.onResult(ok); return; }
    const total = correct + (ok ? 1 : 0);
    setCorrect(total);
    const nx = seloStep(level, streak, ok);
    setLevel(nx.level); setStreak(nx.streak);
    setPicked(i);
    setPhase('reveal');
  };

  const next = () => {
    if (idx + 1 >= SELO_ROUND) { finish(correct); return; }
    setIdx(idx + 1);
    setPicked(null);
    setPuzzle(seloForLevel(level, Math.random));
    setPhase('play');
  };

  if (tut.open) return <MindTutorialScreen game="selo" title={title} language={language} evolutionStage={evolutionStage} demoCharacterId={demoCharacterId} onExit={onExit} onDone={tut.hide} />;

  const cellSize = 84;
  const optSize = 72;
  const status = phase === 'intro'
    ? (isPt ? 'Quando quiser' : 'Whenever you like')
    : phase === 'done'
      ? (isPt ? `${correct} de ${SELO_ROUND} selos` : `${correct} of ${SELO_ROUND} seals`)
      : (isPt ? `Selo ${idx + 1} de ${SELO_ROUND}` : `Seal ${idx + 1} of ${SELO_ROUND}`);

  return (
    <GameRoot full style={{ background: `linear-gradient(to bottom, rgba(0,0,0,.6), transparent 130px), ${sceneBackground('selo')}` }}>
      <GameHeader
        title={title}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={(
          <>
            <span style={{ display: 'block' }}>
              {isPt
                ? 'Cada linha segue um padrão (forma, pontos, gema, preenchimento, marcas). Descubra qual selo completa a grade.'
                : 'Each row follows a pattern (shape, dots, gem, fill, marks). Find the seal that completes the grid.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `${SELO_ROUND} selos por rodada. Exercita raciocínio; fica mais difícil quando você acerta em sequência.` : `${SELO_ROUND} seals per round. It exercises reasoning; it gets harder as you get a streak.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Até ${SELO_MAX_BITS} Bits por rodada, pelos acertos.` : `Up to ${SELO_MAX_BITS} Bits per round, by correct seals.`}
            </span>
            <MindTutorialLink language={language} onClick={tut.show} />
          </>
        )}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={phase === 'play' || phase === 'reveal' ? gameExitConfirm(isPt, 'do jogo') : undefined}
      />

      <p role="status" className="sm2-num" style={phaseTitle} data-selo-status>{status}</p>

      {(phase === 'play' || phase === 'reveal') && (
        <>
          <div data-selo-grid style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${cellSize}px)`, gap: 6, alignSelf: 'center' }}>
            {puzzle.grid.map((p, i) => (
              <div key={i} data-selo-cell={i} role="img"
                aria-label={i === 8 ? (isPt ? 'Selo faltante' : 'Missing seal') : seloLabel(p, isPt)}
                style={{
                  width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--sm2-radius-md)', backgroundColor: 'var(--sm2-surface-2)',
                  border: i === 8 ? '2px dashed var(--sm2-gold-ink)' : '1px solid var(--sm2-muted)', boxSizing: 'border-box',
                }}>
                {i === 8
                  ? (phase === 'reveal' ? <SeloSeal panel={puzzle.options[puzzle.answer]} size={cellSize - 12} /> : <span style={{ ...phaseTitle, color: 'var(--sm2-gold-ink)' }}>?</span>)
                  : <SeloSeal panel={p} size={cellSize - 12} />}
              </div>
            ))}
          </div>
          <div data-selo-options style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${optSize + 8}px)`, gap: 6, alignSelf: 'center' }}>
            {puzzle.options.map((o, i) => {
              const isAnswer = phase === 'reveal' && i === puzzle.answer;
              const isPicked = picked === i;
              return (
                <button key={i} type="button" data-selo-option={i} disabled={phase !== 'play'}
                  aria-label={`${isPt ? 'Opção' : 'Option'} ${i + 1}: ${seloLabel(o, isPt)}`}
                  onClick={() => pick(i)}
                  style={{
                    width: optSize + 8, height: optSize + 8, minHeight: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--sm2-radius-md)', cursor: phase === 'play' ? 'pointer' : 'default', boxSizing: 'border-box',
                    backgroundColor: isAnswer ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                    border: isAnswer ? '2px solid var(--sm2-primary-ink)' : isPicked ? '2px solid var(--sm2-gold-ink)' : '1px solid var(--sm2-muted)',
                    opacity: phase === 'reveal' && !isAnswer && !isPicked ? 0.55 : 1,
                  }}>
                  <SeloSeal panel={o} size={optSize - 6} />
                </button>
              );
            })}
          </div>
          {phase === 'reveal' && (
            <>
              <p style={linhaNaCena} data-selo-feedback={picked === puzzle.answer ? 'ok' : 'miss'}>
                {picked === puzzle.answer
                  ? (isPt ? 'Esse completa o padrão.' : 'That one completes the pattern.')
                  : (isPt ? 'O selo destacado era o que completava. Bora o próximo.' : 'The highlighted seal was the one. On to the next.')}
              </p>
              <button type="button" onClick={next} style={sm2Button('primary')} data-selo-next>
                {idx + 1 >= SELO_ROUND ? (isPt ? 'Ver resultado' : 'See result') : (isPt ? 'Próximo' : 'Next')}
              </button>
            </>
          )}
        </>
      )}

      {phase === 'intro' && (
        <>
          <p style={linhaNaCena}>
            {isPt ? 'Descubra o padrão da grade e escolha o selo que falta.' : 'Find the pattern in the grid and pick the missing seal.'}
          </p>
          <button type="button" onClick={start} style={sm2Button('primary')} data-selo-start>
            {isPt ? 'Começar' : 'Start'}
          </button>
        </>
      )}

      {phase === 'done' && (
        <>
          <p style={linhaNaCena} data-selo-done>
            {earned > 0 ? <>{isPt ? 'Rodada fechada.' : 'Round complete.'} <BitsAmount value={earned} sign="+" /></> : (isPt ? 'Rodada fechada. Bora mais uma?' : 'Round complete. Another go?')}
          </p>
          <ResultScreen
            playAgainIcon={lotIconName('jogos', 'mente')} dailyEvent="selo"
            language={language}
            outcome="win"
            gameName={title}
            title={isPt ? 'Rodada concluída' : 'Round complete'}
            line={isPt ? 'Seu pet guarda os selos.' : 'Your pet keeps the seals.'}
            hero={{ label: isPt ? 'Selos completos' : 'Seals completed', value: correct }}
            ledger={[{ key: 'bits', kind: 'bits', value: earned }]}
            emptyLedgerLine={isPt ? 'Rodada leve, sem Bits desta vez.' : 'A light round, no Bits this time.'}
            petSrc={getSpriteForStage(evolutionStage, demoCharacterId)}
            playAgainLabel={isPt ? 'Jogar de novo' : 'Play again'}
            againAttrs={{ 'data-selo-again': true }}
            onPlayAgain={start}
            homeLabel={isPt ? 'Sair' : 'Exit'}
            onHome={onExit}
          />
        </>
      )}
    </GameRoot>
  );
}
