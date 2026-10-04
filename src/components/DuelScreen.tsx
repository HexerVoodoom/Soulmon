/**
 * DUELO FANTASMA — a tela do PvP do Torneio (benchmark
 * `docs/BENCHMARK-COMBATE.md`, ideia C).
 *
 * Os dois pets lutam SOZINHOS; o dono não comanda golpe nenhum. Ele TORCE:
 * toca em QUALQUER LUGAR da tela (ou no mascote da torcida) e cada toque enche a barra de
 * CHEER, que enche DEVAGAR e, cheia, DESPEJA energia no pet. Cada lutador tem a sua barra de
 * ENERGIA (EM CIMA dele, abaixo da de HP): ataque dado, ataque sofrido e o cheer a enchem; cheia,
 * o lutador solta o ESPECIAL com a arte do elemento dele. **No PvP não há mecânica de uso nem de
 * defesa: o especial sai DIRETO** (REGISTRO §20.10). Não torcer não tira nada (a torcida só soma).
 *
 * A regra é de `functions/api/_duel.js` e esta tela só ANIMA: roda a mesma simulação com a
 * semente que o servidor mandou e, ao fim, envia os toques de cada janela (uma por golpe do
 * dono) para o `match`, que higieniza (teto por janela), recalcula e decide. Como a torcida só
 * mexe na energia do próprio pet e o sorteio não depende dela, rodar de novo a cada janela
 * fechada mantém idênticos os golpes já mostrados.
 *
 * ── A CENA ────────────────────────────────────────────────────────────────
 * Tela cheia (`BattleStage`): lutadores bem grandes, barras de HP e energia EM CIMA de cada
 * um, golpes com a arte de skill do ELEMENTO. A luta dura ~35–42 s: até 26 golpes, um a cada
 * ~1,7 s (`DUEL_STEP_MS`). O dano e a barra de HP chegam no IMPACTO.
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
import { ARENA_SCENE } from '../utils/dungeonScenes';
import {
  DUEL_STEP_MS, STAGE_TIMING, fxElementId, impactMs, prefersReducedMotion, visualElementFor,
  type StageActionKind,
} from '../utils/combatFx';
import {
  DUEL_CHEER_WINDOWS, DUEL_ENERGY_MAX, DUEL_TAPS_CAP, DUEL_TAPS_FULL, simulateDuel,
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
  /** Toques de cada janela JÁ fechada (um por golpe do dono). */
  const [cheers, setCheers] = useState<number[]>([]);
  const cheersRef = useRef<number[]>([]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<Phase>('fight');
  /** Toques da janela ABERTA (desde o último golpe do dono). */
  const [open, setOpen] = useState(0);
  const windowTaps = useRef(0);
  const sent = useRef(false);
  const [acao, setAcao] = useState<StageAction | null>(null);
  const [golpe, setGolpe] = useState<StageHit | null>(null);
  /** A energia mostrada: antes do golpe (a barra cheia que dispara o especial) e, no impacto, depois dele. */
  const [energia, setEnergia] = useState({ me: 0, opp: 0 });
  /** A barra de cheer mostrada: a do último golpe + os toques da janela aberta. */
  const [medidor, setMedidor] = useState(0);
  const cenaSeq = useRef(0);
  /** A confirmação de sair está aberta: a luta espera. */
  const [pausado, setPausado] = useState(false);
  const reduzido = useRef(prefersReducedMotion());

  const meEl = fxElementId(petElement);
  const oppEl = fxElementId(oppElement ?? visualElementFor(oppName));

  const sim = useMemo(() => simulateDuel({ me, opp, seed, cheers }), [me, opp, seed, cheers]);
  const events = sim.events;
  const eventsRef = useRef(events);
  eventsRef.current = events;

  /** O próximo golpe é do pet do jogador? (então a janela de toques dele fecha ao começar a ação) */
  const proximoMeu = useMemo(() => {
    const next = events[shown];
    return !!next && next.actor === 'me' && cheers.length === events.slice(0, shown).filter(e => e.actor === 'me').length;
  }, [events, shown, cheers.length]);
  const proximoMeuRef = useRef(proximoMeu);
  proximoMeuRef.current = proximoMeu;

  /** Toque de cheer: enche a barra (o servidor limita por janela e recalcula a energia). */
  const cheer = () => {
    if (phase !== 'fight' || cheers.length >= DUEL_CHEER_WINDOWS) return;
    windowTaps.current = Math.min(DUEL_TAPS_CAP, windowTaps.current + 1);
    setOpen(windowTaps.current);
  };

  // O relógio da luta: um golpe a cada ~DUEL_STEP_MS, sem parar — a torcida acontece por cima,
  // no ritmo de quem toca. A ação COMEÇA antes de o golpe chegar (investida, projétil) e o
  // dano/a barra de HP só chegam no IMPACTO. No golpe do dono a janela fecha ao começar a
  // ação: os toques vão para a simulação (a MESMA conta do servidor) e, se a energia enche, o
  // especial sai — direto, sem mecânica.
  useEffect(() => {
    if (phase !== 'fight' || pausado) return;
    if (shown >= events.length) { setPhase('done'); return; }
    const idx = shown;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      let evs = eventsRef.current;
      if (proximoMeuRef.current) {
        const fechada = windowTaps.current; // lido ANTES de zerar
        const novo = [...cheersRef.current, fechada];
        cheersRef.current = novo;
        windowTaps.current = 0;
        setCheers(novo);
        setOpen(0);
        // O estado novo só chega na próxima render: a ação desta janela usa a simulação já com ela.
        evs = simulateDuel({ me, opp, seed, cheers: novo }).events;
      }
      const ev = evs[idx];
      if (!ev) { setShown(s => s + 1); return; }
      const meu = ev.actor === 'me';
      // A6 (rodada 7): o golpe normal alterna físico/à distância POR LUTADOR (o n-ésimo golpe normal DELE). Antes era
      // pela paridade do índice do evento — como os lados se alternam 1 a 1, o dono era sempre físico e o oponente
      // SEMPRE à distância (nunca atacava com o corte).
      const nDele = evs.slice(0, idx).filter(e => e.actor === ev.actor && !e.special).length;
      const kind: StageActionKind = ev.special ? 'special' : nDele % 2 === 0 ? 'melee' : 'ranged';
      setMedidor(ev.meter);
      setEnergia({ me: ev.preMe, opp: ev.preOpp });
      setAcao({ id: ++cenaSeq.current, actor: meu ? 'me' : 'foe', foe: 0, kind, element: meu ? meEl : oppEl });
      t2 = setTimeout(() => {
        setGolpe({ id: ++cenaSeq.current, side: meu ? 'foe' : 'me', foe: 0, value: ev.dmg, big: ev.special });
        setEnergia({ me: ev.energyMe, opp: ev.energyOpp });
        setShown(s => s + 1);
      }, impactMs(kind, reduzido.current));
    }, Math.max(0, DUEL_STEP_MS - STAGE_TIMING.ranged.impact));
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shown, pausado, meEl, oppEl]);

  useEffect(() => {
    if (phase === 'done' && !sent.current) {
      sent.current = true;
      onDone(Array.from({ length: DUEL_CHEER_WINDOWS }, (_, i) => cheers[i] ?? 0));
    }
  }, [phase, cheers, onDone]);

  const cur = shown > 0 ? events[shown - 1] : null;
  const hpMe = cur ? cur.hpMe : me.hp;
  const hpOpp = cur ? cur.hpOpp : opp.hp;
  const cheering = phase === 'fight' && cheers.length < DUEL_CHEER_WINDOWS;
  const fim = phase === 'done';
  const barra = Math.min(DUEL_TAPS_FULL, medidor + open);

  return (
    <TorcidaLayer onTap={cheer} active={cheering && !pausado} isPt={isPt} style={BATTLE_LAYER_STYLE} mascot>
      <BattleStage
        scene={ARENA_SCENE.bg}
        me={{ key: 'me', sprite: petSprite, name: petName || (isPt ? 'Você' : 'You'), hp: hpMe, maxHp: me.hp, element: meEl, down: fim && hpMe <= 0, energy: energia.me / DUEL_ENERGY_MAX }}
        foes={[{ key: 'opp', sprite: oppSprite, name: oppName, hp: hpOpp, maxHp: opp.hp, element: oppEl, down: fim && hpOpp <= 0, energy: energia.opp / DUEL_ENERGY_MAX }]}
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
        hud={<TorcidaGauge taps={barra} onCheer={cheer} isPt={isPt} disabled={!cheering} full={DUEL_TAPS_FULL} bare />}
      />
    </TorcidaLayer>
  );
}
