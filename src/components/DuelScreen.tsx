/**
 * DUELO FANTASMA — a tela do PvP do Torneio (benchmark
 * `docs/BENCHMARK-COMBATE.md`, ideia C).
 *
 * Os dois pets lutam SOZINHOS; o dono não comanda golpe nenhum. Em três
 * golpes do pet dele (`DUEL_CHEER_STRIKES`) aparece o botão de TORCER: um
 * anel se fecha sobre o alvo e o toque no encontro dá força ao golpe. Não
 * torcer não tira nada — o pet ataca normal (a torcida só soma).
 *
 * A regra é de `functions/api/_duel.js` e esta tela só ANIMA: roda a mesma
 * simulação com a semente que o servidor mandou e, ao fim, envia as torcidas
 * para o `match`, que recalcula e decide. Como a torcida só mexe no dano dos
 * golpes do próprio pet e o sorteio não depende dela, rodar de novo a cada
 * torcida mantém idênticos os golpes já mostrados.
 *
 * Superfície nova nasce MUDA (R-NOVA, `docs/SOM.md`): nenhum som aqui.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { GameRoot, GameHeader, GameVisor, VisorSprite, HpBars, phaseTitle, phaseLine } from './games/GameKit';
import { sm2Button } from './form/FormKit';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import {
  DUEL_CHEER_STRIKES, DUEL_PERFECT_CHEER, simulateDuel,
  type DuelStats,
} from '../../functions/api/_duel.js';

/** Quanto tempo cada golpe fica na tela. */
const STEP_MS = 900;
/** Duração do anel da torcida; o encontro com o alvo é em `CHEER_TARGET`. */
export const CHEER_MS = 1400;
const RING_FROM = 2;
const RING_TO = 0.6;
/** Momento (ms) em que o anel encosta no alvo (escala 1). */
export const CHEER_TARGET = (CHEER_MS * (RING_FROM - 1)) / (RING_FROM - RING_TO);
/** Janela: a 400 ms do alvo a torcida vale 0. */
const CHEER_WINDOW = 400;

/** Qualidade da torcida pelo erro de tempo (ms): 1 no alvo, 0 fora da janela. */
export function cheerQuality(deltaMs: number): number {
  return Math.max(0, 1 - Math.abs(deltaMs) / CHEER_WINDOW);
}

type Phase = 'fight' | 'cheer' | 'done';

export interface DuelScreenProps {
  me: DuelStats;
  opp: DuelStats;
  seed: number;
  petSprite: string;
  oppSprite: string;
  petName: string;
  oppName: string;
  isPt: boolean;
  /** Fim da luta animada: as torcidas vão para o servidor decidir. */
  onDone: (cheers: number[]) => void;
  onClose: () => void;
}

export function DuelScreen({ me, opp, seed, petSprite, oppSprite, petName, oppName, isPt, onDone, onClose }: DuelScreenProps) {
  const [cheers, setCheers] = useState<number[]>([]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>('fight');
  const [ringGo, setRingGo] = useState(false);
  const [lastCheer, setLastCheer] = useState<number | null>(null);
  const cheerStart = useRef(0);
  const sent = useRef(false);

  const sim = useMemo(() => simulateDuel({ me, opp, seed, cheers }), [me, opp, seed, cheers]);
  const events = sim.events;

  /** O próximo golpe é do pet do jogador E é um momento de torcida? */
  const nextIsCheer = useMemo(() => {
    const next = events[shown];
    if (!next || next.actor !== 'me') return false;
    const myStrikes = events.slice(0, shown).filter(e => e.actor === 'me').length;
    return DUEL_CHEER_STRIKES.includes(myStrikes) && cheers.length < DUEL_CHEER_STRIKES.indexOf(myStrikes) + 1;
  }, [events, shown, cheers.length]);

  const finishCheer = (q: number) => {
    setCheers(c => [...c, q]);
    setLastCheer(q);
    setRingGo(false);
    setPhase('fight');
    setShown(s => s + 1);
  };

  // O relógio da luta: um golpe a cada STEP_MS, parando antes da torcida.
  useEffect(() => {
    if (phase !== 'fight') return;
    if (shown >= events.length) { setPhase('done'); return; }
    const t = setTimeout(() => {
      if (nextIsCheer) {
        setPhase('cheer');
        setLastCheer(null);
      } else {
        setLastCheer(null);
        setShown(s => s + 1);
      }
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [phase, shown, events.length, nextIsCheer]);

  // O anel: começa grande no quadro seguinte e fecha em CHEER_MS; sem toque, vale 0.
  useEffect(() => {
    if (phase !== 'cheer') return;
    cheerStart.current = performance.now();
    const raf = requestAnimationFrame(() => setRingGo(true));
    const t = setTimeout(() => finishCheer(0), CHEER_MS + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'done' && !sent.current) {
      sent.current = true;
      onDone(DUEL_CHEER_STRIKES.map((_, i) => cheers[i] ?? 0));
    }
  }, [phase, cheers, onDone]);

  const cur = shown > 0 ? events[shown - 1] : null;
  const hpMe = cur ? cur.hpMe : me.hp;
  const hpOpp = cur ? cur.hpOpp : opp.hp;
  const lunge = (actor: 'me' | 'opp') => (cur && cur.actor === actor && phase === 'fight' ? 16 : 0);

  const cheerLabel = lastCheer === null ? null
    : lastCheer >= DUEL_PERFECT_CHEER ? (isPt ? 'Torcida perfeita!' : 'Perfect cheer!')
    : lastCheer > 0 ? (isPt ? 'Boa torcida!' : 'Nice cheer!')
    : (isPt ? 'Segue firme!' : 'Keep going!');

  return (
    <GameRoot>
      <GameHeader
        title={isPt ? 'Duelo' : 'Duel'}
        sub={`${petName} × ${oppName}`}
        closeLabel={isPt ? 'Sair do duelo' : 'Leave the duel'}
        onClose={onClose}
        run
      />
      <GameVisor height={80} scene={ARENA_SCENE.bg} label={isPt ? 'Duelo em andamento' : 'Duel in progress'}>
        <VisorSprite
          src={petSprite} alt={petName} idle={false}
          style={{ left: 24, bottom: 8, transform: `translateX(${lunge('me')}px)`, transition: 'transform 180ms ease-out' }}
          data-visor-pet
        />
        <VisorSprite
          src={oppSprite} alt={oppName} idle={false} flip
          style={{ right: 24, bottom: 8, transform: `scaleX(-1) translateX(${lunge('opp')}px)`, transition: 'transform 180ms ease-out' }}
          data-visor-enemy
        />
        {cur && phase !== 'cheer' && (
          <span
            key={shown}
            aria-hidden="true"
            className="sm-duel-dmg"
            style={{
              position: 'absolute', top: 12,
              ...(cur.actor === 'me' ? { right: 72 } : { left: 72 }),
              fontFamily: 'Silkscreen, monospace', fontSize: 16,
              color: 'var(--sm2-viewport-ink, #fff)', textShadow: '0 1px 0 rgba(0,0,0,.6)',
            }}
          >
            −{cur.dmg}
          </span>
        )}
      </GameVisor>

      <HpBars bars={[
        { label: petName || (isPt ? 'Você' : 'You'), cur: hpMe, max: me.hp, tone: 'cyan' },
        { label: oppName, cur: hpOpp, max: opp.hp, tone: 'gold' },
      ]} />

      <div role="status" aria-live="polite" style={{ minHeight: 24 }}>
        {phase === 'fight' && (
          <p style={phaseLine}>
            {cheerLabel ?? (isPt ? 'Os dois lutam sozinhos. Fique pronto para torcer!' : 'They fight on their own. Get ready to cheer!')}
          </p>
        )}
        {phase === 'cheer' && (
          <p style={phaseTitle}>{isPt ? 'Toque quando o anel encostar no círculo!' : 'Tap when the ring meets the circle!'}</p>
        )}
        {phase === 'done' && (
          <p style={phaseLine}>{isPt ? 'Conferindo o resultado…' : 'Checking the result…'}</p>
        )}
      </div>

      {/* A torcida: o círculo fixo é o alvo, o anel fecha sobre ele. */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <button
          type="button"
          disabled={phase !== 'cheer'}
          onClick={() => {
            if (phase !== 'cheer') return;
            finishCheer(cheerQuality(performance.now() - cheerStart.current - CHEER_TARGET));
          }}
          aria-label={isPt ? 'Torcer' : 'Cheer'}
          data-duel-cheer
          style={{
            ...sm2Button(phase === 'cheer' ? 'primary' : 'outline', phase !== 'cheer'),
            position: 'relative', width: 120, height: 120, borderRadius: '50%', padding: 0,
            overflow: 'visible',
          }}
        >
          <span aria-hidden="true" style={{
            position: 'absolute', inset: 8, borderRadius: '50%',
            border: '3px solid currentColor', opacity: 0.9,
          }} />
          {phase === 'cheer' && (
            <span aria-hidden="true" style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              border: '3px solid var(--sm2-gold-ink)',
              transform: `scale(${ringGo ? RING_TO : RING_FROM})`,
              transition: ringGo ? `transform ${CHEER_MS}ms linear` : 'none',
              pointerEvents: 'none',
            }} />
          )}
          <span style={{ position: 'relative' }}>{isPt ? 'Torcer!' : 'Cheer!'}</span>
        </button>
      </div>
    </GameRoot>
  );
}
