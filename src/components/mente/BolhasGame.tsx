import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MiniGameBaseProps } from './types';
import { sm2Button } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, phaseTitle, phaseLine, gameExitConfirm } from '../games/GameKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { MINI_FX, REFUGIO_SCENE } from '../../utils/visorScenes';
import { getSpriteForStage } from '../../utils/sprites';
import {
  bolhasBits, bubbleProgress, hasEscaped, initialStaircase, recordOutcome, spawnBubble, timeLeftMs,
  BOLHAS_CALMA_INTERVAL_MS, BOLHAS_MAX_BITS, BOLHAS_POINTS_PER_BIT,
  type Bubble, type Staircase,
} from '../../utils/mente/bolhas';

/**
 * BOLHAS DO SONHO (`docs/BENCHMARK-MINIJOGOS.md` §6.3). A regra é de
 * `utils/mente/bolhas.ts`; aqui só tela e relógio.
 *
 *  · `foco`: 60 s. Estoure os sonhos claros, deixe passar os fiapos escuros.
 *    Fiapo estourado vira fumaça e o pet sopra — sem texto, só não pontua.
 *  · `calma`: sem tempo, sem placar, sem Bits, sem fiapo. `onEarnPoints` NUNCA
 *    é chamado aqui (há teste).
 *
 * Mudo (R-NOVA), sem vermelho, bolha de 48 px (alvo ≥ 44). As bolhas sobem por
 * JS e não por `animation` do CSS: a regra global de movimento reduzido zera a
 * duração de toda animação, e aqui o movimento É o jogo (WCAG 2.3.3). Com
 * movimento reduzido elas sobem mais devagar e sem balanço.
 */

const TICK_MS = 50;
const BUBBLE = 48;
/** Área do vidro em CSS px (visor 174×120 lógico a 2×). */
const VISOR_W = 348;
const VISOR_H = 240;
/** Fumaça do fiapo estourado e brilho do sonho estourado. */
const SMOKE_MS = 700;
const POP_MS = 250;
/** Movimento reduzido: subida 40% mais lenta. */
const REDUCED_SLOWDOWN = 1.4;

interface Fx { id: number; x: number; y: number; kind: 'pop' | 'smoke'; until: number }

type Phase = 'intro' | 'play' | 'done';

export function BolhasGame({ language, evolutionStage, demoCharacterId, onExit, mode, onEarnPoints }: MiniGameBaseProps & {
  mode: 'foco' | 'calma';
  onEarnPoints?: (pts: number) => void;
}) {
  const isPt = language === 'pt-BR';
  const calma = mode === 'calma';
  const reduced = usePrefersReducedMotion();
  // Calma começa direto (não há o que explicar antes; as refs já nascem zeradas).
  const [phase, setPhase] = useState<Phase>(calma ? 'play' : 'intro');
  const [, setFrame] = useState(0);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [blowing, setBlowing] = useState(false);

  // O estado quente da rodada mora em refs (o tick redesenha por `setFrame`).
  const bubbles = useRef<Bubble[]>([]);
  const fx = useRef<Fx[]>([]);
  const stair = useRef<Staircase>(initialStaircase());
  const startedAt = useRef(0);
  /** I3: a confirmação de sair pausa o relógio; ao retomar, todo carimbo de tempo anda junto. */
  const pausedRef = useRef(false);
  const pauseAtRef = useRef(0);
  const lastSpawn = useRef(0);
  const nextId = useRef(1);
  const scoreRef = useRef(0);
  const paid = useRef(false);
  const blowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (blowTimer.current) clearTimeout(blowTimer.current); }, []);

  const slow = reduced ? REDUCED_SLOWDOWN : 1;

  const finish = useCallback(() => {
    setPhase('done');
    bubbles.current = [];
    fx.current = [];
    const bits = bolhasBits(scoreRef.current);
    setEarned(bits);
    // Só o foco paga, uma vez por rodada, e só se houver o que pagar.
    if (!calma && bits > 0 && !paid.current && onEarnPoints) {
      paid.current = true;
      onEarnPoints(bits);
    }
  }, [calma, onEarnPoints]);

  // O relógio da rodada: nasce, sobe, escapa. Limpo no desmonte e ao sair de `play`.
  useEffect(() => {
    if (phase !== 'play') return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const now = Date.now();
      if (!calma && timeLeftMs(startedAt.current, now) <= 0) { finish(); return; }
      // Quem escapou por cima: sonho perdido / fiapo deixado passar (só a escada lê).
      const alive: Bubble[] = [];
      for (const b of bubbles.current) {
        if (hasEscaped(b, now)) {
          if (!calma) stair.current = recordOutcome(stair.current, b.kind === 'wisp');
        } else alive.push(b);
      }
      bubbles.current = alive;
      fx.current = fx.current.filter(f => f.until > now);
      const interval = calma ? BOLHAS_CALMA_INTERVAL_MS : stair.current.intervalMs;
      if (now - lastSpawn.current >= interval * slow) {
        lastSpawn.current = now;
        const b = spawnBubble(nextId.current++, Math.random, mode, now, interval);
        bubbles.current = [...bubbles.current, { ...b, riseMs: Math.round(b.riseMs * slow) }];
      }
      setFrame(f => f + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase, calma, mode, slow, finish]);

  const onPauseChange = (p: boolean) => {
    if (p) { pauseAtRef.current = Date.now(); pausedRef.current = true; return; }
    const d = Date.now() - pauseAtRef.current;
    startedAt.current += d;
    if (lastSpawn.current) lastSpawn.current += d;
    bubbles.current = bubbles.current.map(b => ({ ...b, born: b.born + d }));
    fx.current = fx.current.map(x => ({ ...x, until: x.until + d }));
    pausedRef.current = false;
  };

  const begin = () => {
    const now = Date.now();
    bubbles.current = [];
    fx.current = [];
    stair.current = initialStaircase();
    startedAt.current = now;
    lastSpawn.current = 0;
    scoreRef.current = 0;
    paid.current = false;
    setScore(0);
    setEarned(0);
    setPhase('play');
  };

  const pop = (id: number) => {
    const now = Date.now();
    const b = bubbles.current.find(x => x.id === id);
    if (!b) return;
    bubbles.current = bubbles.current.filter(x => x.id !== id);
    const pos = posOf(b, now);
    if (!reduced) { try { navigator.vibrate?.(15); } catch { /* noop */ } }
    if (b.kind === 'dream') {
      fx.current = [...fx.current, { id, x: pos.x, y: pos.y, kind: 'pop', until: now + POP_MS }];
      if (!calma) {
        stair.current = recordOutcome(stair.current, true);
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    } else {
      // Fiapo: vira fumaça e o pet sopra. Sem texto — só não pontua.
      fx.current = [...fx.current, { id, x: pos.x, y: pos.y, kind: 'smoke', until: now + SMOKE_MS }];
      stair.current = recordOutcome(stair.current, false);
      setBlowing(true);
      if (blowTimer.current) clearTimeout(blowTimer.current);
      blowTimer.current = setTimeout(() => setBlowing(false), SMOKE_MS);
    }
    setFrame(f => f + 1);
  };

  const now = Date.now();
  const pet = getSpriteForStage(evolutionStage, demoCharacterId);
  const secondsLeft = phase === 'play' && !calma ? Math.ceil(timeLeftMs(startedAt.current, now) / 1000) : 60;

  const title = calma ? (isPt ? 'Bolhas calmas' : 'Calm bubbles') : (isPt ? 'Bolhas do Sonho' : 'Dream Bubbles');
  const sub = calma
    ? (isPt ? 'Sem pressa. Estoure quando quiser.' : 'No rush. Pop whenever you like.')
    : (isPt ? 'Estoure os sonhos claros, deixe passar os fiapos escuros.' : 'Pop the bright dreams, let the dark wisps drift by.');
  /* I13: a regra do pagamento (só no jogo que paga) entra no mesmo "?". */
  const rule = calma ? null : (isPt
    ? `60 segundos. 1 Bit a cada ${BOLHAS_POINTS_PER_BIT} sonhos, até ${BOLHAS_MAX_BITS}.`
    : `60 seconds. 1 Bit per ${BOLHAS_POINTS_PER_BIT} dreams, up to ${BOLHAS_MAX_BITS}.`);

  const petStyle: CSSProperties = {
    left: VISOR_W / 2 - 32, top: VISOR_H - 68,
    ['--sm-idle-dur' as string]: calma ? '3.2s' : '1.5s',
    transform: blowing && !reduced ? 'rotate(-8deg)' : undefined,
    transition: 'transform 200ms var(--sm2-ease)',
  } as CSSProperties;

  return (
    <GameRoot>
      <GameHeader
        title={title}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={<><span style={{ display: 'block' }}>{sub}</span>{rule && <span style={{ display: 'block', marginTop: 6 }}>{rule}</span>}</>}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        activity={phase === 'play'}
        exitConfirm={phase === 'play' && !calma ? gameExitConfirm(isPt, 'da rodada') : undefined}
        onPauseChange={onPauseChange}
      />

      {!calma && phase === 'play' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <p className="sm2-num" style={phaseTitle} data-bolhas-score>
            {isPt ? `Sonhos ${score}` : `Dreams ${score}`}
          </p>
          <p className="sm2-num" style={phaseTitle} data-bolhas-time>{secondsLeft}s</p>
        </div>
      )}

      <GameVisor height={120} scene={REFUGIO_SCENE} label={isPt ? 'Bolhas subindo' : 'Rising bubbles'}>
        <VisorSprite src={pet} size={64} data-visor-pet idle={!blowing && !reduced} style={petStyle} />
        {phase === 'play' && bubbles.current.map(b => {
          const p = posOf(b, now);
          const sway = reduced || calma ? 0 : Math.sin((now - b.born) / 400 + b.id) * 6;
          const dream = b.kind === 'dream';
          return (
            <button
              key={b.id}
              type="button"
              data-bolha={b.kind}
              aria-label={dream ? (isPt ? 'Sonho' : 'Dream') : (isPt ? 'Fiapo escuro' : 'Dark wisp')}
              onClick={() => pop(b.id)}
              style={{
                position: 'absolute', left: p.x + sway, top: p.y, width: BUBBLE, height: BUBBLE,
                padding: 0, cursor: 'pointer', boxSizing: 'border-box',
                // Sonho: bolha de vidro com estrela. Fiapo: fio ondulado escuro — forma, não só cor
                // (sprites 48² da leva `visores`, 01/10/2026; sem caixa nem borda em volta).
                border: 'none',
                background: `url(${dream ? MINI_FX.bolhaSonho : MINI_FX.fiapo}) center/100% 100% no-repeat`,
                imageRendering: 'pixelated',
              }}
            />
          );
        })}
        {fx.current.map(f => (
          <span
            key={`fx-${f.id}`}
            aria-hidden="true"
            data-bolha-fx={f.kind}
            style={{
              position: 'absolute', left: f.x, top: f.y, width: BUBBLE, height: BUBBLE, pointerEvents: 'none',
              background: `url(${f.kind === 'pop' ? MINI_FX.pop : MINI_FX.fumaca}) center/100% 100% no-repeat`,
              imageRendering: 'pixelated',
            }}
          />
        ))}
      </GameVisor>

      {phase === 'intro' && (
        <>
          <button type="button" onClick={begin} style={sm2Button('primary')} data-bolhas-start>
            {isPt ? 'Começar' : 'Start'}
          </button>
        </>
      )}

      {phase === 'done' && (
        <>
          <p role="status" className="sm2-num" style={phaseTitle} data-bolhas-done>
            {isPt ? `Você estourou ${score} sonhos` : `You popped ${score} dreams`}
          </p>
          <p style={phaseLine}>
            {earned > 0
              ? (isPt ? `Seu pet guarda os sonhos. +${earned} Bits` : `Your pet keeps the dreams. +${earned} Bits`)
              : (isPt ? 'Seu pet guarda os sonhos.' : 'Your pet keeps the dreams.')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={begin} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }} data-bolhas-again>
              {isPt ? 'Jogar de novo' : 'Play again'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
          </div>
        </>
      )}

      {calma && (
        <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), alignSelf: 'center' }} data-bolhas-exit>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      )}
    </GameRoot>
  );
}

/** Canto superior-esquerdo da bolha no vidro (sobe de baixo para cima). */
function posOf(b: Bubble, now: number): { x: number; y: number } {
  const p = Math.min(1, bubbleProgress(b, now));
  return {
    x: Math.round(b.x * (VISOR_W - BUBBLE)),
    y: Math.round(VISOR_H - p * (VISOR_H + BUBBLE)),
  };
}
