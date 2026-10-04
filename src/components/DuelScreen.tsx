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
 * ── A CENA (rodada 5 / I10, 02/10/2026) ───────────────────────────────────
 * Tela cheia (`BattleStage`): o seu Soulmon embaixo à esquerda, o oponente em
 * cima à direita, a barra de HP nos pés de cada um e os golpes com a arte de
 * skill do ELEMENTO (investida, projétil, o especial em dobro). A luta ficou
 * MAIS LENTA: um golpe a cada ~1,45 s (`DUEL_STEP_MS`, era 0,9 s; 12 golpes ≈
 * 17 s) e o gauge pede 16 toques (era 8): o especial sai por volta dos 10 s
 * tocando (REGISTRO §20.9). O dano e a barra de HP chegam no IMPACTO.
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
import { TorcidaLayer, TorcidaGauge } from './games/TorcidaKit';
import { BattleStage, BATTLE_LAYER_STYLE, type StageAction, type StageHit } from './games/BattleStage';
import { torcidaTap } from '../utils/torcida';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import {
  DUEL_STEP_MS, STAGE_TIMING, fxElementId, impactMs, prefersReducedMotion, visualElementFor,
  type StageActionKind,
} from '../utils/combatFx';
import {
  DUEL_CHEER_STRIKES, DUEL_TAPS_CAP, DUEL_TAPS_FULL, simulateDuel,
  type DuelStats,
} from '../../functions/api/_duel.js';

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
  /** Elemento do SEU Soulmon (a arte dos golpes); sem ele, o neutro. */
  petElement?: string;
  /** Elemento do oponente (o servidor não o publica: o chamador dá um visual determinístico). */
  oppElement?: string;
  /** Fim da luta animada: os toques de cada janela vão para o servidor decidir. */
  onDone: (taps: number[]) => void;
  onClose: () => void;
}

export function DuelScreen({
  me, opp, seed, petSprite, oppSprite, petName, oppName, isPt, petElement, oppElement, onDone, onClose,
}: DuelScreenProps) {
  /** Toques de cada janela JÁ fechada (um por golpe de torcida). */
  const [cheers, setCheers] = useState<number[]>([]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>('fight');
  /** O gauge na tela (0..FULL): sobe a cada toque e zera quando o especial sai. */
  const [gauge, setGauge] = useState(0);
  const gaugeRef = useRef(0);
  const windowTaps = useRef(0);
  const sent = useRef(false);
  const [acao, setAcao] = useState<StageAction | null>(null);
  const [golpe, setGolpe] = useState<StageHit | null>(null);
  const cenaSeq = useRef(0);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausado, setPausado] = useState(false);
  const reduzido = useRef(prefersReducedMotion());

  const meEl = fxElementId(petElement);
  const oppEl = fxElementId(oppElement ?? visualElementFor(oppName));

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

  // O relógio lê o estado MAIS NOVO por refs: o efeito abaixo só reinicia quando o golpe
  // muda (`shown`), não a cada toque nem quando a janela fecha (isso zeraria o tempo).
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const nextIsCheerRef = useRef(nextIsCheer);
  nextIsCheerRef.current = nextIsCheer;

  /** Toque de torcida: enche o gauge e conta na janela (o servidor limita por janela). */
  const cheer = () => {
    if (phase !== 'fight' || cheers.length >= DUEL_CHEER_STRIKES.length) return;
    windowTaps.current = Math.min(DUEL_TAPS_CAP, windowTaps.current + 1);
    gaugeRef.current = torcidaTap(gaugeRef.current, DUEL_TAPS_FULL);
    setGauge(gaugeRef.current);
  };

  // O relógio da luta: um golpe a cada ~DUEL_STEP_MS, sem parar — a torcida acontece
  // por cima, no ritmo de quem toca. A ação COMEÇA antes de o golpe chegar (investida,
  // projétil) e o dano/a barra de HP só chegam no IMPACTO. No golpe de torcida a janela
  // fecha ao começar a ação: os toques vão para a simulação e, se o gauge estava cheio,
  // o especial sai e o gauge zera (a mesma conta de `specialSlots` no servidor).
  useEffect(() => {
    if (phase !== 'fight' || pausado) return;
    if (shown >= events.length) { setPhase('done'); return; }
    const idx = shown;
    const meu = events[idx].actor === 'me';
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      let especial = false;
      if (nextIsCheerRef.current) {
        const fechada = windowTaps.current; // lido ANTES de zerar: o updater roda depois
        especial = gaugeRef.current >= DUEL_TAPS_FULL;
        setCheers(c => [...c, fechada]);
        windowTaps.current = 0;
        if (especial) { gaugeRef.current = 0; setGauge(0); }
      }
      // O pet alterna investida e projétil; o especial é sempre o projétil grande.
      const kind: StageActionKind = especial ? 'special' : idx % 2 === 0 ? 'melee' : 'ranged';
      setAcao({
        id: ++cenaSeq.current, actor: meu ? 'me' : 'foe', foe: 0, kind, element: meu ? meEl : oppEl,
      });
      t2 = setTimeout(() => {
        const ev = eventsRef.current[idx];
        if (ev) setGolpe({ id: ++cenaSeq.current, side: meu ? 'foe' : 'me', foe: 0, value: ev.dmg, big: especial });
        setShown(s => s + 1);
      }, impactMs(kind, reduzido.current));
    }, Math.max(0, DUEL_STEP_MS - STAGE_TIMING.ranged.impact));
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shown, pausado, meEl, oppEl]);

  useEffect(() => {
    if (phase === 'done' && !sent.current) {
      sent.current = true;
      onDone(DUEL_CHEER_STRIKES.map((_, i) => cheers[i] ?? 0));
    }
  }, [phase, cheers, onDone]);

  const cur = shown > 0 ? events[shown - 1] : null;
  const hpMe = cur ? cur.hpMe : me.hp;
  const hpOpp = cur ? cur.hpOpp : opp.hp;
  const cheering = phase === 'fight' && cheers.length < DUEL_CHEER_STRIKES.length;
  const fim = phase === 'done';

  return (
    <TorcidaLayer onTap={cheer} active={cheering && !pausado} isPt={isPt} style={BATTLE_LAYER_STYLE}>
      <BattleStage
        scene={ARENA_SCENE.bg}
        me={{ key: 'me', sprite: petSprite, name: petName || (isPt ? 'Você' : 'You'), hp: hpMe, maxHp: me.hp, element: meEl, down: fim && hpMe <= 0 }}
        foes={[{ key: 'opp', sprite: oppSprite, name: oppName, hp: hpOpp, maxHp: opp.hp, element: oppEl, down: fim && hpOpp <= 0 }]}
        action={acao}
        hit={golpe}
        title={isPt ? 'Duelo' : 'Duel'}
        closeLabel={isPt ? 'Sair do duelo' : 'Leave the duel'}
        onClose={() => { if (phase !== 'done') onClose(); }}
        exitConfirm={fim ? undefined : {
          title: isPt ? 'Sair do duelo? Conta como derrota.' : 'Leave the duel? It counts as a loss.',
          stay: isPt ? 'Continuar' : 'Keep going',
          leave: isPt ? 'Sair' : 'Leave',
        }}
        onPauseChange={setPausado}
        status={fim ? (isPt ? 'Conferindo o resultado…' : 'Checking the result…') : undefined}
        hud={<TorcidaGauge taps={gauge} onCheer={cheer} isPt={isPt} disabled={!cheering} full={DUEL_TAPS_FULL} bare />}
      />
    </TorcidaLayer>
  );
}
