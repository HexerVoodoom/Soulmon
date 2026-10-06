/**
 * A LUTA EM GRUPO EM CENA — o relógio da Arena no núcleo v3 (PR3b, `contexto.md` §2.15 P2/P4 e §2.17).
 *
 * O NÚCLEO (`utils/combate/group.ts`, `groupFightSteps`) decide TUDO: quando cada um ataca, quanto
 * dano dá, quando a energia enche, quem cai. Este hook só decide COMO a cena mostra, no relógio do
 * núcleo (segundos de luta, 1:1 com o relógio de parede):
 *
 *  · cada evento `attack` / `tick` / `ko` chega no instante `t` dele; a animação do golpe começa
 *    `impactMs` antes, e o número e a barra só mudam NO IMPACTO. Se o evento seguinte chega com a
 *    animação ainda rodando, ela é cortada no impacto (a ação nova troca a antiga);
 *  · o `cast` do PET PAUSA o relógio: o anel encolhe sobre o alvo e a nota (`ruim`/`bom`/`ótimo`)
 *    volta ao núcleo como o multiplicador do especial; o cast do INIMIGO pausa e abre a esquiva;
 *  · o especial em ÁREA devolve um evento por alvo no mesmo instante: todos os hits aparecem juntos;
 *  · a energia do pet vem do evento ("uma barra, um uso"); a dos inimigos com especial é derivada
 *    das mesmas taxas do núcleo (`ENERGY`) só para a barrinha da cena;
 *  · a TORCIDA: os toques enchem a barra de cheer (`cheerTap`, no máximo `CHEER.tapsCapPerBucket` por
 *    janela de `CHEER.bucketSeconds` do relógio da luta); ao encher, ela despeja uma descarga que o
 *    núcleo recolhe por `cheerDrain`;
 *  · pausa (a confirmação de sair) congela o relógio, e o relógio é fatiado em 100 ms.
 *
 * Determinismo: o sorteio do anel e da esquiva sai da SEMENTE (`ringSpec`/`dodgeSpec`), a defesa
 * automática é a `hitScale` da rodada (também da semente) — nunca `Math.random` (um teste de grep trava).
 * Movimento reduzido: sem investida/projétil (a cena cuida) e o anel segue desenhado por JS.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StageAction, StageHit } from './BattleStage';
import { impactMs, type StageActionKind, type StrikeForm } from '../../utils/combatFx';
import { cheerTap, dodgeGrade, dodgeSpec, ringSpec, type DodgeGrade, type DodgeSpec, type RingGrade, type RingSpec } from '../../utils/energia';
import { groupFightSteps, type GroupEvent, type GroupOptions, type GroupResult } from '../../utils/combate/group';
import type { FightSide } from '../../utils/combate/fight';
import { CHEER, ENERGY, ENERGY_TRIGGER } from '../../utils/combate/specials';

/** Pausa entre o último golpe de uma luta e o aviso de fim (o inimigo cai, o pet respira). */
const END_BEAT_MS = 900;
/** O relógio é fatiado para a pausa e o cancelamento valerem na hora. */
const SLICE_MS = 100;
/** Quando o golpe chega com a animação anterior ainda rodando: o mínimo que a nova ainda tem de ser vista. */
const CUT_MIN_S = 0.15;
const EPS = 1e-9;

/** A rodada que o jogo entrega ao relógio (o hook não conhece a Arena). */
export interface GroupRound {
  player: FightSide;
  foes: readonly FightSide[];
  /** Semente do núcleo desta rodada. */
  seed: number;
  startHp: number;
  startEnergy: number;
  /** Multiplicador do n-ésimo golpe básico de `who` (0 = pet, 1+i = inimigo i): defesa automática e forma da escola. */
  hitScale(who: number, n: number): number;
  /** O multiplicador do cast: no do pet recebe a nota do anel; no do inimigo, a da esquiva. */
  castScale(i: { who: number; ring: RingGrade | null; dodge: DodgeGrade | null; foesHp: readonly number[] }): number;
  /** Opcional: ajusta as opções do núcleo (ex.: `areaEfficiency` nos ensaios). */
  options?: Partial<GroupOptions>;
}

export interface GroupScene {
  /** HP máximo (absoluto) do pet e de cada inimigo, só para os números da cena. */
  playerMaxHp: number;
  foeMaxHp: readonly number[];
  playerElement(special: boolean): string;
  foeElement(foe: number): string;
  /** A FORMA do golpe do pet — da SKILL dele (básica ou especial). Nunca de índice/sorteio. */
  playerKind(special: boolean): StrikeForm;
  foeKind(foe: number, special: boolean): StrikeForm;
  /** Selos curtos (já traduzidos). */
  labels: { blocked: string; ring: Record<RingGrade, string>; dodge: Partial<Record<DodgeGrade, string>> };
  /** Selo no pet quando o especial dele é pessoal (cura, escudo, buff): sem dano para mostrar. */
  personalTag?: string;
}

export interface GroupBattleOptions {
  running: boolean;
  paused: boolean;
  reduced: boolean;
  /** Muda a cada rodada: reinicia o relógio com a rodada nova. */
  runKey: number;
  /** Semente da run: o anel e a esquiva. */
  seed: number;
  round: () => GroupRound;
  scene: () => GroupScene;
  onEnd: (r: GroupResult) => void;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export interface GroupBattle {
  action: StageAction | null;
  hits: StageHit[];
  /** Fração de HP do pet e de cada inimigo (0..1). */
  hp: number;
  foesHp: number[];
  /** Energia do pet (0..ENERGY_TRIGGER) e dos inimigos (0 nos sem especial). */
  petEnergy: number;
  foeEnergy: number[];
  /** A barra de CHEER (toques acumulados). */
  meter: number;
  phase: 'idle' | 'ring' | 'dodge';
  ring: { spec: RingSpec; foe: number; key: number } | null;
  dodge: { spec: DodgeSpec; key: number } | null;
  petDodge: { id: number; dir: -1 | 1 } | null;
  charging: boolean;
  cheer(): void;
  swipe(dir: -1 | 1): void;
  resolveRing(grade: RingGrade): void;
  /** O `runKey` a que o estado acima pertence (muda no começo da rodada; antes disso o estado é o da rodada anterior). */
  stateKey: number;
  /** Segundos da luta já vividos. */
  clock(): number;
}

export function useGroupBattle(opts: GroupBattleOptions): GroupBattle {
  const { running, paused, reduced, seed } = opts;
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [action, setAction] = useState<StageAction | null>(null);
  const [hits, setHits] = useState<StageHit[]>([]);
  const [hp, setHp] = useState(1);
  const [foesHp, setFoesHp] = useState<number[]>([1]);
  const [petEnergy, setPetEnergy] = useState(0);
  const [foeEnergy, setFoeEnergy] = useState<number[]>([0]);
  const [meter, setMeterS] = useState(0);
  const [phase, setPhase] = useState<GroupBattle['phase']>('idle');
  const [ring, setRing] = useState<GroupBattle['ring']>(null);
  const [dodge, setDodge] = useState<GroupBattle['dodge']>(null);
  const [petDodge, setPetDodge] = useState<GroupBattle['petDodge']>(null);
  const [charging, setCharging] = useState(false);
  const [stateKey, setStateKey] = useState(-1);

  const mtr = useRef(0);
  const seq = useRef(0);
  const phaseRef = useRef<GroupBattle['phase']>('idle');
  const ringResolver = useRef<((g: RingGrade) => void) | null>(null);
  const dodgeStart = useRef(0);
  const dodgeAt = useRef<number | null>(null);
  const runId = useRef(0);
  /** Descargas de cheer ainda não recolhidas pelo núcleo. */
  const discharges = useRef(0);
  /** Relógio da LUTA (s) do último evento e toques aceitos por janela. */
  const clockS = useRef(0);
  /** Âncora do relógio ao vivo: o relógio da luta no instante `wall` (hora de parede sem a pausa). */
  const anchor = useRef({ base: 0, wall: 0 });
  const buckets = useRef(new Map<number, number>());
  /** Relógio de parede da esquiva: a hora menos o tempo pausado (a janela não corre com o "Sair?" aberto). */
  const pausedAcc = useRef(0);
  const pausedSince = useRef<number | null>(null);
  useEffect(() => {
    if (paused) { if (pausedSince.current === null) pausedSince.current = now(); }
    else if (pausedSince.current !== null) { pausedAcc.current += now() - pausedSince.current; pausedSince.current = null; }
  }, [paused]);
  const wallClock = useCallback(() => now() - pausedAcc.current - (pausedSince.current !== null ? now() - pausedSince.current : 0), []);

  const setPhaseBoth = (p: GroupBattle['phase']) => { phaseRef.current = p; setPhase(p); };

  const cheer = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    const live = anchor.current.base + Math.max(0, wallClock() - anchor.current.wall) / 1000;
    const b = Math.floor(live / CHEER.bucketSeconds);
    const used = buckets.current.get(b) ?? 0;
    if (used >= CHEER.tapsCapPerBucket) return; // o teto anti-auto-clique: toque a mais não rende
    buckets.current.set(b, used + 1);
    const t = cheerTap(mtr.current);
    mtr.current = t.meter;
    setMeterS(t.meter);
    if (t.discharged) discharges.current++;
  }, [wallClock]);

  const swipe = useCallback((dir: -1 | 1) => {
    if (phaseRef.current !== 'dodge' || dodgeAt.current !== null) return;
    dodgeAt.current = wallClock() - dodgeStart.current;
    setPetDodge({ id: ++seq.current, dir });
  }, [wallClock]);

  const resolveRing = useCallback((grade: RingGrade) => {
    const r = ringResolver.current;
    ringResolver.current = null;
    r?.(grade);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const my = ++runId.current;
    const alive = () => runId.current === my;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    /** Espera `ms` de relógio de luta (a pausa congela). Devolve false se a luta foi cancelada. */
    const wait = (ms: number) => new Promise<boolean>((resolve) => {
      let left = ms;
      const tick = () => {
        if (!alive()) { resolve(false); return; }
        if (left <= 0) { resolve(true); return; }
        const slice = Math.min(SLICE_MS, left);
        const id = setTimeout(() => {
          timers.delete(id);
          if (!pausedRef.current) left -= slice;
          tick();
        }, slice);
        timers.add(id);
      };
      tick();
    });
    /** Avança o relógio da luta até `t` (s). */
    const waitTo = async (t: number): Promise<boolean> => {
      anchor.current = { base: clockS.current, wall: wallClock() };
      const dt = t - clockS.current;
      if (dt > EPS) { if (!(await wait(dt * 1000))) return false; }
      clockS.current = Math.max(clockS.current, t);
      return true;
    };

    const run = async () => {
      const round = optsRef.current.round();
      const scene = optsRef.current.scene();
      const { player, foes } = round;
      const nFoes = foes.length;
      const hasSp = foes.map(f => f.special !== null);

      // estado inicial limpo
      clockS.current = 0;
      anchor.current = { base: 0, wall: wallClock() };
      buckets.current = new Map();
      discharges.current = 0;
      let nRing = 0;
      let nDodge = 0;
      let hpNow = round.startHp;
      let foesNow: number[] = foes.map(() => 1);
      let fEn: number[] = foes.map(() => 0);
      let tEn = 0;
      setHp(hpNow); setFoesHp(foesNow); setPetEnergy(round.startEnergy); setFoeEnergy(fEn); setStateKey(optsRef.current.runKey);
      setAction(null); setHits([]); setRing(null); setDodge(null); setPetDodge(null); setCharging(false);
      setPhaseBoth('idle');

      const g = groupFightSteps(player, foes, {
        ...round.options,
        seed: round.seed, startHp: round.startHp, startEnergy: round.startEnergy,
        hitScale: round.hitScale,
        cheerDrain: () => { const n = discharges.current; discharges.current = 0; return n; },
      });
      const queue: GroupEvent[] = [];
      let result: GroupResult | null = null;
      /** Próximo evento (ou null no fim da luta); `answer` só vale para o evento `cast` que o pediu. */
      const pull = (answer?: number): GroupEvent | null => {
        if (queue.length) return queue.shift() as GroupEvent;
        if (result) return null;
        const r = g.next(answer);
        if (r.done) { result = r.value; return null; }
        return r.value;
      };
      const showHits = (list: StageHit[]) => { if (list.length) setHits(list); };
      const alivePos = (a: readonly number[]) => Math.max(0, a.findIndex(h => h > EPS));

      /** Aplica um grupo de eventos do mesmo instante: HP, energia, números. */
      const apply = (batch: GroupEvent[], special: boolean, dodgeG: DodgeGrade | null) => {
        const last = batch[batch.length - 1];
        const out: StageHit[] = [];
        const dt = Math.max(0, last.t - tEn);
        tEn = last.t;
        fEn = fEn.map((e, i) => (hasSp[i] ? Math.min(ENERGY_TRIGGER, e + ENERGY.perSecond * dt) : 0));
        // o que o pet deu: diferença de HP de cada inimigo
        const dealt = foesNow.map((h, i) => Math.max(0, h - (last.foesHp[i] ?? h)));
        dealt.forEach((d, i) => {
          if (d <= EPS) return;
          out.push({ id: ++seq.current, side: 'foe', foe: i, value: Math.max(1, Math.round(d * (scene.foeMaxHp[i] ?? 1))), big: special, tag: i === dealt.findIndex(x => x > EPS) ? (special ? scene.labels.ring[ringTagRef.current] : undefined) : undefined });
          if (hasSp[i]) fEn[i] = Math.min(ENERGY_TRIGGER, fEn[i] + ENERGY.perReceived * d);
        });
        // o que o pet levou: cada golpe de inimigo do grupo
        for (const e of batch) {
          if (e.who === 0 || (e.kind !== 'attack' && e.kind !== 'tick')) continue;
          const f = e.who - 1;
          if (e.frac <= EPS) {
            out.push({ id: ++seq.current, side: 'me', foe: f, value: 0, tag: scene.labels.blocked });
          } else {
            const tag = special ? scene.labels.dodge[dodgeG ?? 'nada'] : undefined;
            out.push({ id: ++seq.current, side: 'me', foe: f, value: Math.max(1, Math.round(e.frac * scene.playerMaxHp)), big: special, tag });
          }
          if (hasSp[f]) fEn[f] = Math.min(ENERGY_TRIGGER, fEn[f] + ENERGY.perDealt * e.frac);
        }
        hpNow = last.hp; foesNow = last.foesHp.slice();
        setHp(Math.max(0, hpNow)); setFoesHp(foesNow); setPetEnergy(last.energy); setFoeEnergy(fEn.slice());
        showHits(out);
      };
      const ringTagRef = { current: 'bom' as RingGrade };

      let ev = pull();
      while (ev && alive()) {
        // ── o cast: o relógio PAUSA ─────────────────────────────────────────
        if (ev.kind === 'cast') {
          if (!(await waitTo(ev.t))) return;
          const casterFoe = ev.who - 1;
          let ringG: RingGrade | null = null;
          let dodgeG: DodgeGrade | null = null;
          if (ev.who === 0) {
            const target = alivePos(foesNow);
            const spec = ringSpec(seed, nRing++);
            setCharging(true);
            setRing({ spec, foe: target, key: ++seq.current });
            setPhaseBoth('ring');
            ringG = await new Promise<RingGrade>((resolve) => { ringResolver.current = resolve; });
            ringResolver.current = null;
            setRing(null); setPhaseBoth('idle'); setCharging(false);
            if (!alive()) return;
            ringTagRef.current = ringG;
            const pForm = scene.playerKind(true);
            setAction({ id: ++seq.current, actor: 'me', foe: target, kind: 'special', strike: pForm, element: scene.playerElement(true) });
            const scale = round.castScale({ who: 0, ring: ringG, dodge: null, foesHp: ev.foesHp });
            const first = pull(scale); // o núcleo devolve os eventos do especial no mesmo instante
            const batch: GroupEvent[] = [];
            let nx = first;
            while (nx && nx.kind !== 'cast' && Math.abs(nx.t - ev.t) < EPS) { batch.push(nx); nx = pull(); }
            if (nx) queue.unshift(nx);
            if (!(await wait(impactMs('special', reduced)))) return;
            if (batch.length) apply(batch, true, null);
            else if (scene.personalTag) showHits([{ id: ++seq.current, side: 'me', foe: 0, value: 0, tag: scene.personalTag }]);
            else setPetEnergy(ev.energy);
            ev = pull();
            continue;
          }
          // o cast do INIMIGO: a esquiva
          const spec = dodgeSpec(seed, nDodge++);
          dodgeAt.current = null;
          dodgeStart.current = wallClock();
          setDodge({ spec, key: ++seq.current });
          setPhaseBoth('dodge');
          setAction({
            id: ++seq.current, actor: 'foe', foe: casterFoe, kind: 'special', strike: scene.foeKind(casterFoe, true), element: scene.foeElement(casterFoe),
            castMs: spec.castMs, impactMs: spec.impactMs, totalMs: spec.impactMs + 500,
          });
          if (hasSp[casterFoe]) { fEn[casterFoe] = Math.max(0, fEn[casterFoe] - ENERGY_TRIGGER); setFoeEnergy(fEn.slice()); }
          const scaleFor = (d: DodgeGrade) => round.castScale({ who: ev!.who, ring: null, dodge: d, foesHp: ev!.foesHp });
          // a esquiva é decidida no fim da janela: o núcleo só recebe a nota depois
          if (!(await wait(spec.impactMs))) return;
          dodgeG = dodgeGrade(dodgeAt.current, spec);
          setDodge(null); setPhaseBoth('idle');
          const first = pull(scaleFor(dodgeG));
          const batch: GroupEvent[] = [];
          let nx = first;
          while (nx && nx.kind !== 'cast' && Math.abs(nx.t - ev.t) < EPS) { batch.push(nx); nx = pull(); }
          if (nx) queue.unshift(nx);
          if (batch.length) apply(batch, true, dodgeG);
          ev = pull();
          continue;
        }

        // ── um grupo de eventos do mesmo instante (o especial em área devolve um por alvo) ──
        const batch: GroupEvent[] = [ev];
        let nx = pull();
        while (nx && nx.kind !== 'cast' && Math.abs(nx.t - ev.t) < EPS) { batch.push(nx); nx = pull(); }
        if (nx) queue.unshift(nx);

        const first = batch[0];
        const isAttack = first.kind === 'attack';
        if (isAttack && first.who >= 0) {
          const foeIdx = first.who - 1;
          const blocked = first.who !== 0 && first.frac <= EPS;
          const kind: StageActionKind = first.who === 0 ? scene.playerKind(false) : scene.foeKind(foeIdx, false);
          const lead = impactMs(kind, reduced) / 1000;
          const room = first.t - clockS.current;
          // sem espaço para a animação inteira: ela é CORTADA no impacto (a nova troca a antiga)
          const start = room >= lead ? first.t - lead : clockS.current;
          const land = room >= lead ? first.t : Math.max(first.t, clockS.current + Math.min(lead, CUT_MIN_S));
          if (!(await waitTo(start))) return;
          setAction({
            id: ++seq.current, actor: first.who === 0 ? 'me' : 'foe',
            foe: first.who === 0 ? alivePos(foesNow) : foeIdx, kind,
            element: first.who === 0 ? scene.playerElement(false) : scene.foeElement(foeIdx),
            shield: blocked ? scene.playerElement(false) : null,
          });
          if (!(await waitTo(land))) return;
        } else if (!(await waitTo(first.t))) return;
        apply(batch, false, null);
        ev = pull();
      }

      if (!alive()) return;
      const res = result as GroupResult | null;
      if (!res) return;
      if (!(await wait(END_BEAT_MS))) return;
      optsRef.current.onEnd(res);
    };
    void run();
    return () => {
      runId.current++;
      timers.forEach(clearTimeout);
      ringResolver.current = null;
      setPhaseBoth('idle');
      setRing(null); setDodge(null); setCharging(false);
    };
    // O relógio reinicia só quando a luta liga/desliga, a rodada muda ou a semente muda — o resto vem por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seed, reduced, opts.runKey]);

  return {
    action, hits, hp, foesHp, petEnergy, foeEnergy, meter, phase, ring, dodge, petDodge, charging,
    cheer, swipe, resolveRing, stateKey, clock: () => clockS.current,
  };
}
