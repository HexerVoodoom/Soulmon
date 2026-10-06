/**
 * DUELO FANTASMA — a tela do PvP do Torneio (benchmark `docs/BENCHMARK-COMBATE.md`, ideia C).
 *
 * Os dois pets lutam SOZINHOS; o dono não comanda golpe nenhum. Ele TORCE: toca em QUALQUER LUGAR da tela
 * (ou no mascote da torcida) e cada toque enche a barra de CHEER, que enche DEVAGAR (24 toques) e, cheia,
 * DESPEJA energia no pet. Cada lutador tem a sua barra de ENERGIA (EM CIMA dele, abaixo da de HP): ataque
 * dado, ataque sofrido, o tempo e o cheer a enchem; cheia, o lutador solta o ESPECIAL com a arte do elemento
 * dele. **No PvP não há mecânica de uso nem de defesa: o especial sai DIRETO** (REGISTRO §20.10). Não torcer
 * não tira nada (a torcida só soma).
 *
 * COMBATE v3 (PR5, contexto §2.19). A regra é do SERVIDOR (`functions/api/_duel.js`, que decide) e esta tela
 * só ANIMA a mesma luta no núcleo (`utils/combate/duel.ts` › `simulatePvp`, travado em paridade com o
 * servidor) com a SEMENTE e a FICHA que o `duelStart` mandou: o cliente nunca deriva o oponente.
 *  · A luta corre em TEMPO REAL (a ~38 s): cada golpe do núcleo tem um instante, a ação COMEÇA antes dele
 *    (investida, projétil) e o dano/a barra de HP só chegam no IMPACTO.
 *  · A torcida é por BALDE DE TEMPO (3 s, `CHEER.bucketSeconds`): a tela conta os toques de cada balde (até
 *    `CHEER.tapsCapPerBucket`); quando o balde FECHA, a descarga que ele pagou entra na luta (no fim do balde,
 *    igual ao servidor) e a luta é simulada de novo. Como a torcida só mexe na energia do próprio pet DEPOIS
 *    do fecho, os golpes já mostrados não mudam.
 *  · Ao fim, os toques de cada balde vão para o `match`, que higieniza (teto por balde), recalcula e DECIDE:
 *    quem manda no resultado é o servidor (vitória, derrota ou EMPATE).
 *
 * ── Torcida por TIMING (anel que fecha sobre o alvo) ───────────────────────
 * Decisão do dono (02/10/2026): trocada por toques livres + gauge. O anel, a janela de ±400 ms
 * (`cheerQuality`) e as constantes `CHEER_*` abaixo FICAM no arquivo, sem nenhum caminho de UI: reaproveitar
 * em outro lugar depois.
 *
 * Superfície nova nasce MUDA (R-NOVA, `docs/SOM.md`): nenhum som aqui.
 */
import { stageSkillsFor, type FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import type { EscolaId } from '../utils/soulProfile/ficha/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TorcidaLayer, TorcidaGauge } from './games/TorcidaKit';
import { BattleStage, BATTLE_LAYER_STYLE, type StageAction, type StageHit } from './games/BattleStage';
import { ARENA_SCENE } from '../utils/dungeonScenes';
import {
  fxElementId, impactMs, prefersReducedMotion, visualElementFor, fighterStrikeForm, specialLabel,
  type StageActionKind,
} from '../utils/combatFx';
import { PVP_HP_SCALE, type FightEvent } from '../utils/combate/fight';
import { CHEER, ENERGY_TRIGGER } from '../utils/combate/specials';
import { DUEL_CHEER_BUCKETS, simulatePvp, type DuelResult, type DuelSide } from '../utils/combate/duel';

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

/** O relógio da cena anda de `TICK_MS` em `TICK_MS` (o passo máximo por tick cobre aba em segundo plano). */
const TICK_MS = 50;
const MAX_STEP_S = 0.25;
/** Pausa entre o último golpe e o envio do resultado (o nocaute assenta na tela). */
const END_BEAT_MS = 1100;

type Phase = 'fight' | 'done';

export interface DuelScreenProps {
  /** A ficha do SEU lado e a do oponente, como o servidor mandou em `duelStart` (no treino, a local). */
  me: DuelSide;
  opp: DuelSide;
  seed: number;
  petSprite: string;
  oppSprite: string;
  petName: string;
  oppName: string;
  isPt: boolean;
  /** Elemento do SEU Soulmon (a arte dos golpes); sem ele, o neutro. */
  petElement?: string;
  /** Estágio do SEU pet (para achar o par da ficha em `skills`). */
  petStage?: string;
  /** As skills da ficha (o mesmo `skills` da Arena). Com elas, a escola decide o golpe e o selo leva o nome do especial (PR1b B2/N1); sem elas, a escola do `me.fx` ou o elemento. */
  skills?: FichaSkills;
  /** Elemento do oponente (o servidor não o publica: o chamador dá um visual determinístico). */
  oppElement?: string;
  /** Fim da luta animada: os toques de cada BALDE vão para o servidor decidir. */
  onDone: (taps: number[]) => void;
  onClose: () => void;
}

const maxHpOf = (s: DuelSide) => Math.max(1, Math.round(s.combatant.hp * PVP_HP_SCALE));
const escolaDe = (e: string | null | undefined): { escolaId: EscolaId } | null => (e ? { escolaId: e as EscolaId } : null);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function DuelScreen({
  me, opp, seed, petSprite, oppSprite, petName, oppName, isPt, petElement, petStage = 'rookie', skills, oppElement, onDone, onClose,
}: DuelScreenProps) {
  const meEl = fxElementId(petElement);
  const oppEl = fxElementId(oppElement ?? visualElementFor(oppName));
  const par = stageSkillsFor(skills, petStage);
  const maxMe = maxHpOf(me);
  const maxOpp = maxHpOf(opp);

  const [phase, setPhase] = useState<Phase>('fight');
  const [hpFrac, setHpFrac] = useState({ me: 1, opp: 1 });
  /** A energia mostrada (0..ENERGY_TRIGGER) de cada lutador. */
  const [energia, setEnergia] = useState({ me: 0, opp: 0 });
  const [acao, setAcao] = useState<StageAction | null>(null);
  const [golpes, setGolpes] = useState<StageHit[]>([]);
  /** A barra de cheer mostrada: os toques aceitos até agora, módulo `CHEER.tapsFull`. */
  const [barra, setBarra] = useState(0);
  const [pausado, setPausado] = useState(false);
  const pausadoRef = useRef(false);
  pausadoRef.current = pausado;
  const reduzido = useRef(prefersReducedMotion());

  // ── o estado da luta ao vivo (refs: o relógio lê e escreve sem render) ────────
  const clock = useRef(0);
  /** Toques dos baldes JÁ FECHADOS (um número por balde, na ordem). */
  const closed = useRef<number[]>([]);
  /** Toques do balde ABERTO (o que o relógio está vivendo agora). */
  const live = useRef(0);
  const sim = useRef<DuelResult>(simulatePvp({ me, opp, seed, taps: [] }));
  /** Quantos eventos já COMEÇARAM a ação e quantos já CHEGARAM (HP, energia e número). */
  const started = useRef(0);
  const applied = useRef(0);
  const seq = useRef(0);
  const ended = useRef(false);
  const endTimer = useRef<number | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  /** Eventos que são o GOLPE do especial (o `attack` no mesmo instante do `cast` do mesmo lado). */
  const specialHit = useMemo(() => new WeakMap<FightEvent, boolean>(), []);
  const markSpecials = (events: FightEvent[]) => {
    const castAt = new Map<number, number>(); // lado -> t do último cast
    for (const e of events) {
      if (e.kind === 'cast') castAt.set(e.side, e.t);
      else if (e.kind === 'attack' && castAt.get(e.side) === e.t) specialHit.set(e, true);
    }
  };
  useMemo(() => markSpecials(sim.current.events), []); // eslint-disable-line react-hooks/exhaustive-deps

  const accepted = () => closed.current.reduce((a, b) => a + b, 0) + live.current;
  const cheer = () => {
    if (ended.current || pausadoRef.current) return;
    if (live.current >= CHEER.tapsCapPerBucket) return; // o teto por balde: toque a mais não rende
    live.current += 1;
    setBarra(accepted() % CHEER.tapsFull);
  };

  /** A forma do golpe (investida × projétil) do lado `side` no papel dado: a ficha manda; sem ela, o elemento. */
  const forma = (side: 0 | 1, role: 'basica' | 'especial') => {
    const meu = side === 0;
    const skill = meu
      ? (role === 'especial' ? par?.especial : par?.basica) ?? escolaDe(role === 'especial' ? me.fx?.especial : me.fx?.basica)
      : escolaDe(role === 'especial' ? opp.fx?.especial : opp.fx?.basica);
    return fighterStrikeForm({ skill, element: meu ? meEl : oppEl }, role);
  };

  useEffect(() => {
    const reduced = reduzido.current;
    const leadS = (k: StageActionKind) => impactMs(k, reduced) / 1000;
    /** O tipo da ação de um evento: o `cast` é o ESPECIAL; o `attack` do golpe do especial não abre ação própria. */
    const actionOf = (e: FightEvent): { kind: StageActionKind; strike?: ReturnType<typeof forma> } | null => {
      if (e.kind === 'cast') return { kind: 'special', strike: forma(e.side, 'especial') };
      if (e.kind === 'attack' && !specialHit.get(e)) return { kind: forma(e.side, 'basica') };
      return null;
    };

    /* A cena tem UM `action`: dois golpes que se sobrepõem se atropelam. Regras (ver o `useGroupBattle`): o golpe
       básico novo CORTA um básico em curso; um ESPECIAL em curso nunca é cortado por um básico (o número do básico
       chega no instante dele, só a investida/o projétil é pulada); e um especial que chega com outro especial em
       curso (os dois soltaram no mesmo instante, no espelho) ESPERA o impacto do primeiro. */
    let busyUntil = 0; // relógio da luta (s) em que a ação em curso chega ao impacto
    let emCurso: StageActionKind | null = null;
    let adiado: FightEvent | null = null;
    const fire = (e: FightEvent, a: { kind: StageActionKind; strike?: ReturnType<typeof forma> }) => {
      const meu = e.side === 0;
      setAcao({ id: ++seq.current, actor: meu ? 'me' : 'foe', foe: 0, kind: a.kind, strike: a.strike, element: meu ? meEl : oppEl });
      busyUntil = clock.current + leadS(a.kind);
      emCurso = a.kind;
    };
    const start = (e: FightEvent) => {
      const a = actionOf(e);
      if (!a) return;
      if (clock.current < busyUntil - 1e-9 && emCurso === 'special') {
        if (a.kind === 'special') adiado = adiado ?? e;
        return;
      }
      fire(e, a);
    };

    const apply = (e: FightEvent) => {
      setHpFrac({ me: clamp01(e.hp[0]), opp: clamp01(e.hp[1]) });
      setEnergia({ me: Math.max(0, e.energy[0]), opp: Math.max(0, e.energy[1]) });
      if ((e.kind === 'attack' || e.kind === 'tick') && e.frac > 1e-9) {
        const alvoMe = e.side === 1; // o lado 1 bate no MEU pet
        const value = Math.max(1, Math.round(e.frac * (alvoMe ? maxMe : maxOpp)));
        setGolpes([{ id: ++seq.current, side: alvoMe ? 'me' : 'foe', foe: 0, value, big: !!specialHit.get(e) }]);
      }
    };

    /** Fecha o balde que acabou: a descarga que ele pagou entra na luta, e a luta é simulada de novo. */
    const fecharBalde = () => {
      closed.current = [...closed.current, live.current].slice(0, DUEL_CHEER_BUCKETS);
      const tinha = live.current > 0;
      live.current = 0;
      if (!tinha) return;
      const nova = simulatePvp({ me, opp, seed, taps: closed.current });
      const velha = sim.current.events;
      // As ações JÁ COMEÇADAS (olhar um pouco à frente) têm de continuar valendo; se a descarga mudou algo
      // que já começou, recomeça a partir do que já chegou (raro: o cast adiantado pela energia nova).
      let igual = true;
      for (let i = 0; i < started.current; i++) {
        if (JSON.stringify(nova.events[i]) !== JSON.stringify(velha[i])) { igual = false; break; }
      }
      if (!igual) started.current = applied.current;
      sim.current = nova;
      markSpecials(nova.events);
    };

    const fim = () => {
      if (ended.current) return;
      ended.current = true;
      setPhase('done');
      endTimer.current = window.setTimeout(() => {
        endTimer.current = null;
        const taps = [...closed.current, live.current].slice(0, DUEL_CHEER_BUCKETS);
        doneRef.current(taps);
      }, reduced ? 300 : END_BEAT_MS);
    };

    let last = performance.now();
    const id = window.setInterval(() => {
      const t0 = performance.now();
      const dt = Math.min(MAX_STEP_S, Math.max(0, (t0 - last) / 1000));
      last = t0;
      if (ended.current || pausadoRef.current) return;
      clock.current += dt;
      while (clock.current >= (closed.current.length + 1) * CHEER.bucketSeconds && closed.current.length < DUEL_CHEER_BUCKETS) fecharBalde();
      const evs = sim.current.events;
      if (adiado && clock.current >= busyUntil) {
        const a = actionOf(adiado);
        if (a) fire(adiado, a);
        adiado = null;
      }
      // a ação de um golpe COMEÇA `lead` antes do instante dele
      while (started.current < evs.length) {
        const e = evs[started.current];
        const a = actionOf(e);
        const lead = a ? leadS(a.kind) : 0;
        if (e.t - lead > clock.current) break;
        start(e);
        started.current++;
      }
      while (applied.current < evs.length && evs[applied.current].t <= clock.current) {
        const e = evs[applied.current];
        applied.current++;
        if (started.current < applied.current) started.current = applied.current;
        apply(e);
        if (e.kind === 'ko') { fim(); return; }
      }
    }, TICK_MS);
    return () => {
      window.clearInterval(id);
      // Sair da tela antes do fim NÃO envia o resultado: quem sai fecha o duelo como derrota (`onClose`).
      if (endTimer.current !== null) { window.clearTimeout(endTimer.current); endTimer.current = null; }
    };
    // A luta nasce uma vez por (ficha, semente): o resto vem por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fimDaLuta = phase === 'done';
  const cheering = phase === 'fight';

  return (
    <TorcidaLayer onTap={cheer} active={cheering && !pausado} isPt={isPt} style={BATTLE_LAYER_STYLE} mascot>
      <BattleStage
        scene={ARENA_SCENE.bg}
        sceneElement={oppEl}
        specialLabel={specialLabel(isPt, par?.especial)}
        me={{ key: 'me', sprite: petSprite, name: petName || (isPt ? 'Você' : 'You'), hp: Math.round(hpFrac.me * maxMe), maxHp: maxMe, element: meEl, down: fimDaLuta && hpFrac.me <= 0, energy: energia.me / ENERGY_TRIGGER }}
        foes={[{ key: 'opp', sprite: oppSprite, name: oppName, hp: Math.round(hpFrac.opp * maxOpp), maxHp: maxOpp, element: oppEl, down: fimDaLuta && hpFrac.opp <= 0, energy: energia.opp / ENERGY_TRIGGER }]}
        action={acao}
        hit={golpes}
        title={isPt ? 'Duelo' : 'Duel'}
        closeLabel={isPt ? 'Sair do duelo' : 'Leave the duel'}
        onClose={() => { if (phase !== 'done') onClose(); }}
        exitConfirm={fimDaLuta ? undefined : {
          title: isPt ? 'Sair do duelo? Conta como derrota.' : 'Leave the duel? It counts as a loss.',
          stay: isPt ? 'Continuar' : 'Keep going',
          leave: isPt ? 'Sair' : 'Leave',
        }}
        onPauseChange={setPausado}
        status={fimDaLuta ? (isPt ? 'Conferindo o resultado…' : 'Checking the result…') : undefined}
        hud={<TorcidaGauge taps={barra} onCheer={cheer} isPt={isPt} disabled={!cheering} full={CHEER.tapsFull} bare />}
      />
    </TorcidaLayer>
  );
}
