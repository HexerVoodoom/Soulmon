import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { EarningGameProps } from './types';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, StatTag, phaseTitle, phaseLine } from '../games/GameKit';
import { Icon } from '../ui/Icon';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { DUNGEON_LINE_SPRITES } from '../../utils/sprites';
import {
  TROCA_DECK_SIZE, TROCA_SESSION_MS, applySort, buildDeck, initialTrocaState, trocaBits,
  type TrocaCard, type TrocaRule, type TrocaSide, type TrocaState,
} from '../../utils/mente/troca';

/**
 * TROCA DE REGRA (benchmark §6.4) — separar cada criatura para a esquerda ou
 * para a direita pela regra que está na pista de cima (FORMA ou LUGAR).
 *
 * Nasce MUDO (R-NOVA). Errar não diz "errou": a carta só escorrega de volta e
 * a próxima vem. A troca de regra muda a pista e ela pulsa uma vez — sem
 * texto de cobrança. Sem vermelho; alvos ≥ 44; movimento reduzido tira o
 * deslize e o pulso, mas mantém a troca visível (a pista muda de texto).
 */

/** Deslize de volta da carta errada (ms) — trava a entrada nesse intervalo. */
const NUDGE_MS = 320;
/** Duração do pulso da pista quando a regra troca (ms). */
const PULSE_MS = 700;
/** Distância mínima de arrasto para contar como separar (px). */
const SWIPE_PX = 48;

// Fundo claro de CÉU e escuro de GRUTA — só tokens, nada de vermelho.
const SKY_BG = 'linear-gradient(180deg, color-mix(in srgb, var(--sm2-primary-fill) 22%, var(--sm2-viewport-ink)) 0%, var(--sm2-viewport-ink) 100%)';
const CAVE_BG = 'radial-gradient(120% 90% at 50% 100%, color-mix(in srgb, var(--sm2-primary-deep) 35%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in srgb, var(--sm2-viewport-bg) 55%, black) 0%, var(--sm2-viewport-bg) 100%)';

export function TrocaGame({ language, onEarnPoints, onExit }: EarningGameProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();

  const [deck, setDeck] = useState<TrocaCard[]>(() => buildDeck(TROCA_DECK_SIZE, Math.random));
  const [game, setGame] = useState<TrocaState>(() => initialTrocaState(Math.random));
  const [nudge, setNudge] = useState(0);
  const [locked, setLocked] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [leftMs, setLeftMs] = useState(TROCA_SESSION_MS);
  const [over, setOver] = useState(false);
  const [earned, setEarned] = useState(0);

  const gameRef = useRef(game);
  gameRef.current = game;
  const overRef = useRef(false);
  const startRef = useRef(Date.now());
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeX = useRef<number | null>(null);

  // Fecha a sessão UMA vez e paga UMA vez (fora de updater — footgun 6).
  const finish = useCallback((final: TrocaState) => {
    if (overRef.current) return;
    overRef.current = true;
    setOver(true);
    const bits = trocaBits(final.correct);
    setEarned(bits);
    if (bits > 0) onEarnPoints(bits);
  }, [onEarnPoints]);

  // Relógio da sessão. Um intervalo só, limpo ao desmontar ou terminar.
  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      const left = Math.max(0, TROCA_SESSION_MS - (Date.now() - startRef.current));
      setLeftMs(left);
      if (left <= 0) finish(gameRef.current);
    }, 250);
    return () => clearInterval(id);
  }, [over, finish]);

  useEffect(() => () => {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  const card = deck[Math.min(game.dealt, deck.length - 1)];

  const sort = useCallback((side: TrocaSide) => {
    if (overRef.current || locked) return;
    const cur = gameRef.current;
    const c = deck[cur.dealt];
    if (!c) return;
    const res = applySort(cur, c, side, Math.random);
    const advance = () => {
      gameRef.current = res.state;
      setGame(res.state);
      if (res.state.dealt >= deck.length) finish(res.state);
    };
    if (res.switched) {
      setPulse(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPulse(false), PULSE_MS);
    }
    if (res.correct) { advance(); return; }
    // Errou: a carta escorrega para o lado escolhido e volta; depois a próxima.
    setLocked(true);
    setNudge(reduced ? 0 : (side === 'left' ? -28 : 28));
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => {
      setNudge(0);
      nudgeTimer.current = setTimeout(() => {
        setLocked(false);
        advance();
      }, reduced ? 0 : NUDGE_MS / 2);
    }, reduced ? 0 : NUDGE_MS / 2);
  }, [deck, finish, locked, reduced]);

  // Teclado: setas esquerda/direita separam.
  useEffect(() => {
    if (over) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); sort('left'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); sort('right'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [over, sort]);

  const onPointerDown = (e: ReactPointerEvent) => { swipeX.current = e.clientX; };
  const onPointerUp = (e: ReactPointerEvent) => {
    const x0 = swipeX.current;
    swipeX.current = null;
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) >= SWIPE_PX) sort(dx < 0 ? 'left' : 'right');
  };

  const restart = () => {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    const g = initialTrocaState(Math.random);
    gameRef.current = g;
    overRef.current = false;
    startRef.current = Date.now();
    setDeck(buildDeck(TROCA_DECK_SIZE, Math.random));
    setGame(g);
    setNudge(0); setLocked(false); setPulse(false);
    setLeftMs(TROCA_SESSION_MS); setEarned(0); setOver(false);
  };

  const ruleName = (r: TrocaRule) => r === 'forma' ? (isPt ? 'forma' : 'form') : (isPt ? 'lugar' : 'place');
  const formaTxt = (c: TrocaCard) => c.forma === 'young' ? (isPt ? 'jovem' : 'young') : (isPt ? 'crescida' : 'grown');
  const lugarTxt = (c: TrocaCard) => c.lugar === 'sky' ? (isPt ? 'no céu' : 'in the sky') : (isPt ? 'na gruta' : 'in the cave');

  // Pista da regra: texto + ícone pelado; na troca, contorno (e escala sem
  // movimento reduzido) por PULSE_MS.
  const cue: CSSProperties = {
    ...sm2Text, margin: 0, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'center',
    minHeight: 32, padding: '2px 12px', borderRadius: 999, boxSizing: 'border-box',
    outline: pulse ? '2px solid var(--sm2-primary-fill)' : '2px solid transparent',
    outlineOffset: 2,
    backgroundColor: 'var(--sm2-surface-2)',
    transform: pulse && !reduced ? 'scale(1.08)' : 'none',
    transition: reduced ? 'none' : 'transform 220ms var(--sm2-ease), outline-color 220ms var(--sm2-ease)',
  };

  // Destino: as duas dimensões cruzadas; a que a regra usa fica em destaque.
  const destino = (side: TrocaSide) => {
    const forma = side === 'left' ? (isPt ? 'Jovem' : 'Young') : (isPt ? 'Crescida' : 'Grown');
    const lugar = side === 'left' ? (isPt ? 'Céu' : 'Sky') : (isPt ? 'Gruta' : 'Cave');
    const on: CSSProperties = { fontWeight: 600, color: 'inherit' };
    const off: CSSProperties = { fontWeight: 400, opacity: 0.72 };
    return (
      <button
        type="button"
        data-troca-side={side}
        onClick={() => sort(side)}
        aria-label={isPt ? `Mandar para a ${side === 'left' ? 'esquerda' : 'direita'}: ${forma}, ${lugar}` : `Send ${side}: ${forma}, ${lugar}`}
        style={{
          ...sm2Button('outline'), flex: 1, minWidth: 0, minHeight: 64, padding: '0 8px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          flexDirection: side === 'left' ? 'row' : 'row-reverse',
        }}
      >
        <Icon name={side === 'left' ? 'arrow_back' : 'arrow_forward'} size={24} tone="inherit" />
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: side === 'left' ? 'flex-start' : 'flex-end', lineHeight: 1.25 }}>
          <span style={game.rule === 'forma' ? on : off}>{forma}</span>
          <span style={game.rule === 'lugar' ? on : off}>{lugar}</span>
        </span>
      </button>
    );
  };

  const secs = Math.ceil(leftMs / 1000);

  return (
    <GameRoot>
      <GameHeader
        title={isPt ? 'Troca de Regra' : 'Rule Switch'}
        sub={isPt ? 'Separe cada criatura pela regra de cima.' : 'Sort each creature by the rule on top.'}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
      />

      {over ? (
        <>
          <GameVisor height={80} scene={SKY_BG} label={isPt ? 'Fim da rodada' : 'Round over'}>
            <VisorSprite
              src={DUNGEON_LINE_SPRITES[card.line].mega}
              size={128}
              idle={!reduced}
              style={{ left: '50%', bottom: 8, marginLeft: -64 }}
            />
          </GameVisor>
          <p role="status" style={phaseTitle} data-troca-end>
            {isPt ? `Você separou ${game.correct}` : `You sorted ${game.correct}`}
          </p>
          <p style={phaseLine}>
            {earned > 0 ? `+${earned} Bits` : (isPt ? 'Rodada leve, sem Bits desta vez.' : 'A light round, no Bits this time.')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={restart} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'De novo' : 'Again'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={cue} data-troca-rule={game.rule} data-troca-pulse={pulse ? '1' : '0'} aria-live="polite">
            <Icon name={game.rule === 'forma' ? 'auto_awesome' : 'wb_sunny'} size={20} tone="primary" />
            {isPt ? 'Regra: ' : 'Rule: '}{ruleName(game.rule)}
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <StatTag label={isPt ? 'Tempo' : 'Time'} value={`${secs} s`} />
            <StatTag label={isPt ? 'Separadas' : 'Sorted'} value={game.correct} />
          </div>

          <div
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { swipeX.current = null; }}
            style={{ touchAction: 'pan-y', alignSelf: 'center' }}
          >
            <div
              data-troca-card={card.id}
              data-forma={card.forma}
              data-lugar={card.lugar}
              style={{
                transform: `translateX(${nudge}px)`,
                transition: reduced ? 'none' : `transform ${NUDGE_MS / 2}ms var(--sm2-ease)`,
              }}
            >
              <GameVisor
                height={80}
                scene={card.lugar === 'sky' ? SKY_BG : CAVE_BG}
                label={isPt ? `Criatura ${formaTxt(card)}, ${lugarTxt(card)}` : `A ${formaTxt(card)} creature, ${lugarTxt(card)}`}
              >
                <VisorSprite
                  src={DUNGEON_LINE_SPRITES[card.line][card.tier]}
                  size={card.forma === 'young' ? 64 : 128}
                  idle={!reduced}
                  style={card.forma === 'young'
                    ? { left: '50%', bottom: 16, marginLeft: -32 }
                    : { left: '50%', bottom: 8, marginLeft: -64 }}
                />
              </GameVisor>
            </div>
          </div>

          <p style={{ ...sm2Hint, textAlign: 'center' }}>
            {isPt ? 'Toque num lado ou arraste a carta.' : 'Tap a side or swipe the card.'}
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            {destino('left')}
            {destino('right')}
          </div>
        </>
      )}
    </GameRoot>
  );
}

export default TrocaGame;
