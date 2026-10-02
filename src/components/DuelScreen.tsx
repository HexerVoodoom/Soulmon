/**
 * DUELO FANTASMA — a tela do PvP do Torneio (benchmark
 * `docs/BENCHMARK-COMBATE.md`, ideia C).
 *
 * Os dois pets lutam SOZINHOS; o dono não comanda golpe nenhum. Ele TORCE:
 * toca em QUALQUER LUGAR da tela e cada toque enche o gauge de torcida (e solta
 * um "grito" no ponto tocado). Quando o pet chega num dos três golpes de torcida
 * (`DUEL_CHEER_STRIKES`) com o gauge cheio, ele GASTA o gauge num golpe
 * ESPECIAL. Não torcer não tira nada — o pet ataca normal (a torcida só soma).
 *
 * A regra é de `functions/api/_duel.js` e esta tela só ANIMA: roda a mesma
 * simulação com a semente que o servidor mandou e, ao fim, envia os toques de
 * cada janela para o `match`, que higieniza (teto por janela), recalcula e
 * decide. Como a torcida só mexe no dano dos golpes do próprio pet e o sorteio
 * não depende dela, rodar de novo a cada janela fechada mantém idênticos os
 * golpes já mostrados.
 *
 * ── Torcida por TIMING (anel que fecha sobre o alvo) ───────────────────────
 * Decisão do dono (02/10/2026): trocada por toques livres + gauge. O anel, a
 * janela de ±400 ms (`cheerQuality`) e as constantes `CHEER_*` abaixo FICAM no
 * arquivo, sem nenhum caminho de UI (`TIMING_CHEER_ENABLED = false` em
 * `_duel.js`): reaproveitar em outro lugar depois.
 *
 * Superfície nova nasce MUDA (R-NOVA, `docs/SOM.md`): nenhum som aqui.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { GameRoot, GameHeader, GameVisor, VisorSprite, VisorFx, HpBars, phaseLine } from './games/GameKit';
import { TorcidaLayer, TorcidaGauge } from './games/TorcidaKit';
import { torcidaTap } from '../utils/torcida';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import {
  DUEL_CHEER_STRIKES, DUEL_TAPS_CAP, DUEL_TAPS_FULL, simulateDuel,
  type DuelStats,
} from '../../functions/api/_duel.js';

/** Quanto tempo cada golpe fica na tela. */
const STEP_MS = 900;

// ── Torcida por TIMING (DESATIVADA, guardada para reaproveitar) ───────────────
/** Duração do anel da torcida; o encontro com o alvo é em `CHEER_TARGET`. */
export const CHEER_MS = 1400;
const RING_FROM = 2;
const RING_TO = 0.6;
/** Momento (ms) em que o anel encosta no alvo (escala 1). */
export const CHEER_TARGET = (CHEER_MS * (RING_FROM - 1)) / (RING_FROM - RING_TO);
/** Janela: a 400 ms do alvo a torcida vale 0. */
const CHEER_WINDOW = 400;

/** Qualidade da torcida pelo erro de tempo (ms): 1 no alvo, 0 fora da janela. (Sem UI.) */
export function cheerQuality(deltaMs: number): number {
  return Math.max(0, 1 - Math.abs(deltaMs) / CHEER_WINDOW);
}

type Phase = 'fight' | 'done';

export interface DuelScreenProps {
  me: DuelStats;
  opp: DuelStats;
  seed: number;
  petSprite: string;
  oppSprite: string;
  petName: string;
  oppName: string;
  isPt: boolean;
  /** Fim da luta animada: os toques de cada janela vão para o servidor decidir. */
  onDone: (taps: number[]) => void;
  onClose: () => void;
}

export function DuelScreen({ me, opp, seed, petSprite, oppSprite, petName, oppName, isPt, onDone, onClose }: DuelScreenProps) {
  /** Toques de cada janela JÁ fechada (um por golpe de torcida). */
  const [cheers, setCheers] = useState<number[]>([]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>('fight');
  /** O gauge na tela (0..FULL): sobe a cada toque e zera quando o especial sai. */
  const [gauge, setGauge] = useState(0);
  const windowTaps = useRef(0);
  const sent = useRef(false);

  const sim = useMemo(() => simulateDuel({ me, opp, seed, cheers }), [me, opp, seed, cheers]);
  const events = sim.events;

  /** O próximo golpe é do pet do jogador E fecha uma janela de torcida ainda aberta? */
  const nextIsCheer = useMemo(() => {
    const next = events[shown];
    if (!next || next.actor !== 'me') return false;
    const myStrikes = events.slice(0, shown).filter(e => e.actor === 'me').length;
    const slot = DUEL_CHEER_STRIKES.indexOf(myStrikes);
    return slot >= 0 && cheers.length === slot;
  }, [events, shown, cheers.length]);

  /** Toque de torcida: enche o gauge e conta na janela (o servidor limita por janela). */
  const cheer = () => {
    if (phase !== 'fight' || cheers.length >= DUEL_CHEER_STRIKES.length) return;
    windowTaps.current = Math.min(DUEL_TAPS_CAP, windowTaps.current + 1);
    setGauge(g => torcidaTap(g));
  };

  // O relógio da luta: um golpe a cada STEP_MS, sem parar — a torcida acontece
  // por cima, no ritmo de quem toca. No golpe de torcida a janela fecha: os
  // toques vão para a simulação e, se o gauge estava cheio, o especial sai e o
  // gauge zera (a mesma conta de `specialSlots` no servidor).
  useEffect(() => {
    if (phase !== 'fight') return;
    if (shown >= events.length) { setPhase('done'); return; }
    const t = setTimeout(() => {
      if (nextIsCheer) {
        const fechada = windowTaps.current; // lido ANTES: o updater roda depois do zero abaixo
        setCheers(c => [...c, fechada]);
        windowTaps.current = 0;
        setGauge(g => (g >= DUEL_TAPS_FULL ? 0 : g));
      }
      setShown(s => s + 1);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [phase, shown, events.length, nextIsCheer]);

  useEffect(() => {
    if (phase === 'done' && !sent.current) {
      sent.current = true;
      onDone(DUEL_CHEER_STRIKES.map((_, i) => cheers[i] ?? 0));
    }
  }, [phase, cheers, onDone]);

  const cur = shown > 0 ? events[shown - 1] : null;
  const hpMe = cur ? cur.hpMe : me.hp;
  const hpOpp = cur ? cur.hpOpp : opp.hp;
  const special = !!cur && cur.actor === 'me' && cur.cheer === 1;
  const lunge = (actor: 'me' | 'opp') => (cur && cur.actor === actor && phase === 'fight' ? (actor === 'me' && special ? 32 : 16) : 0);
  const cheering = phase === 'fight' && cheers.length < DUEL_CHEER_STRIKES.length;

  return (
    <GameRoot>
      <TorcidaLayer onTap={cheer} active={cheering} isPt={isPt} style={{ flex: '1 0 auto' }}>
        <GameHeader
          title={isPt ? 'Duelo' : 'Duel'}
          sub={`${petName} × ${oppName}`}
          closeLabel={isPt ? 'Sair do duelo' : 'Leave the duel'}
          onClose={() => { if (phase !== 'done') onClose(); }}
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
          {special && phase === 'fight' && (
            <VisorFx icon="✨" style={{ right: 24, bottom: 8 }} data-visor-fx="special" />
          )}
          {cur && (
            <span
              key={shown}
              aria-hidden="true"
              className="sm-duel-dmg"
              style={{
                position: 'absolute', top: 12,
                ...(cur.actor === 'me' ? { right: 72 } : { left: 72 }),
                fontFamily: 'Silkscreen, monospace', fontSize: special ? 22 : 16,
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
              {special
                ? (isPt ? 'Golpe especial da torcida!' : 'Special cheer strike!')
                : (isPt ? 'Os dois lutam sozinhos. Toque em qualquer lugar para torcer!' : 'They fight on their own. Tap anywhere to cheer!')}
            </p>
          )}
          {phase === 'done' && (
            <p style={phaseLine}>{isPt ? 'Conferindo o resultado…' : 'Checking the result…'}</p>
          )}
        </div>

        {/* A torcida: o gauge enche com o toque em qualquer lugar; o botão é o
            caminho para quem não toca na tela (teclado, leitor de tela). */}
        <TorcidaGauge taps={gauge} onCheer={cheer} isPt={isPt} disabled={!cheering} />
      </TorcidaLayer>
    </GameRoot>
  );
}
