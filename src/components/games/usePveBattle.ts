/**
 * LUTA DE PvE EM CENA — o relógio da luta do Pesadelo, da Masmorra e do Duelo da Arena
 * (04/10/2026, REGISTRO §20.10). Um só dono do ritmo, da energia e das mecânicas ativas.
 *
 * O JOGO decide as regras (dano, vida, cura, ofício); este hook decide QUANDO e COMO a cena
 * mostra: a ida-e-volta dos golpes, as barras de energia e de cheer e as duas mecânicas:
 *
 *  · **O ANEL** (energia do pet cheia): o pet carrega, um anel encolhe sobre o alvo e o
 *    toque no momento certo define o multiplicador do especial (`ruim` / `bom` / `ótimo`,
 *    `utils/energia.ts`). Sem toque, vale `ruim`.
 *  · **A ESQUIVA** (energia do inimigo cheia): o inimigo carrega e solta o especial dele; o
 *    jogador pode deslizar o dedo para o lado (ou usar as setas) e o momento do gesto tira
 *    parte do dano (`DODGE_REDUCE`). Sem agir, leva o dano normal do especial.
 *
 * A defesa AUTOMÁTICA (`utils/autoDefesa.ts`) continua sendo a base dos golpes normais do
 * inimigo. O sorteio dela, do anel e da esquiva sai da SEMENTE da luta — nunca de
 * `Math.random()` —, então a mesma semente + os mesmos gestos = a mesma luta (testado).
 *
 * Cada lado leva `PVE_STEP_MS` por golpe (a ida-e-volta de ~3,4 s). A confirmação de sair
 * PAUSA o relógio (`paused`); o relógio é fatiado em 100 ms para a pausa valer na hora.
 * Movimento reduzido: sem investida/projétil (a cena cuida) e sem encolher do anel por CSS —
 * o anel é desenhado por JS (é a mecânica essencial; a WCAG 2.3.3 a isenta).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StageAction, StageHit } from './BattleStage';
import { STAGE_TIMING, PVE_STEP_MS, impactMs, type StageActionKind } from '../../utils/combatFx';
import { autoDefense, defenseRoll } from '../../utils/autoDefesa';
import {
  addEnergy, cheerTap, dodgeGrade, dodgeSpec, energyFull, ringSpec, spendEnergy,
  type DodgeGrade, type DodgeSpec, type RingGrade, type RingSpec,
} from '../../utils/energia';

/** Pausa entre o último golpe de uma luta e o aviso de fim (o inimigo cai, o pet respira). */
const END_BEAT_MS = 900;
/** O relógio é fatiado para a pausa e o cancelamento valerem na hora. */
const SLICE_MS = 100;

export interface PveHit { foe: number; value: number }

export interface PveStrikeInfo { special: boolean; ring: RingGrade; target: number; n: number }
export interface PveStrikeResult {
  /** Quem apanhou e quanto (um por alvo; o especial em área devolve vários). */
  hits: PveHit[];
  /** Selo curto de feedback no alvo (já traduzido pelo jogo). */
  tag?: string;
  /** Todos os inimigos caíram: a luta acabou com este golpe. */
  victory: boolean;
}
export interface PveFoeInfo { foe: number; special: boolean; dodge: DodgeGrade; acc: number; n: number }
export interface PveFoeResult {
  /** Dano no pet (0 = bloqueado). */
  value: number;
  blocked: boolean;
  /** Contra-ataque do bloqueio perfeito. */
  counter?: PveHit;
  tag?: string;
  defeat: boolean;
  victory?: boolean;
}

export interface PveRules {
  /** Inimigo mirado pelo pet. */
  target(): number;
  /** Os inimigos que revidam neste turno (índices vivos), na ordem. */
  foes(): number[];
  playerStrike(i: PveStrikeInfo): PveStrikeResult;
  foeStrike(i: PveFoeInfo): PveFoeResult;
  onVictory(): void;
  onDefeat(): void;
  /** Elemento da arte do golpe do pet (o especial pode ter outro). */
  playerElement(special: boolean): string;
  foeElement(foe: number): string;
  /** O golpe normal do pet: investida ou projétil. */
  playerKind(n: number): 'melee' | 'ranged';
  foeKind(foe: number, n: number): 'melee' | 'ranged';
  /** Bônus na defesa automática (o ofício) e o limiar da defesa perfeita. */
  defenseBonus?: number;
  perfect: number;
}

export interface PveBattleOptions {
  /** A luta está rodando (fora disso o relógio para e reinicia limpo). */
  running: boolean;
  paused: boolean;
  /** Semente da luta: o sorteio da defesa, do anel e da esquiva. */
  seed: number;
  reduced: boolean;
  rules: PveRules;
  /** Muda a cada luta nova com a luta ligada o tempo todo (o Pesadelo encadeia 2 inimigos): reinicia o relógio. */
  runKey?: number;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export interface PveBattle {
  action: StageAction | null;
  hits: StageHit[];
  /** Energia do pet (0..ENERGY_MAX) e de cada inimigo. */
  petEnergy: number;
  foeEnergy: number[];
  /** A barra de CHEER (toques acumulados). */
  meter: number;
  /** A fase do relógio: `ring` e `dodge` são as janelas das mecânicas. */
  phase: 'idle' | 'ring' | 'dodge';
  ring: { spec: RingSpec; foe: number; key: number } | null;
  dodge: { spec: DodgeSpec; key: number } | null;
  /** O pet desliza (a esquiva): a cena mostra o deslize. */
  petDodge: { id: number; dir: -1 | 1 } | null;
  /** O pet está carregando o especial (a aura fica ligada). */
  charging: boolean;
  /** Um toque de cheer (fora das janelas de mecânica). */
  cheer(): void;
  /** O gesto da esquiva (deslizar ou as setas). */
  swipe(dir: -1 | 1): void;
  /** O toque do anel resolveu: nota + quando. */
  resolveRing(grade: RingGrade): void;
  /** Recomeça a luta limpa: `keepPet` mantém a energia do pet e a barra de cheer (a Masmorra é contínua). */
  reset(o: { foes: number; keepPet?: boolean }): void;
  /** Põe a energia do pet / de um inimigo (só testes/depuração). */
  _setPetEnergy(v: number): void;
  _setFoeEnergy(foe: number, v: number): void;
}

export function usePveBattle(opts: PveBattleOptions): PveBattle {
  const { running, paused, seed, reduced } = opts;
  const rulesRef = useRef(opts.rules);
  rulesRef.current = opts.rules;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [action, setAction] = useState<StageAction | null>(null);
  const [hits, setHits] = useState<StageHit[]>([]);
  const [petEnergy, setPetEnergyS] = useState(0);
  const [foeEnergy, setFoeEnergyS] = useState<number[]>([0]);
  const [meter, setMeterS] = useState(0);
  const [phase, setPhase] = useState<PveBattle['phase']>('idle');
  const [ring, setRing] = useState<PveBattle['ring']>(null);
  const [dodge, setDodge] = useState<PveBattle['dodge']>(null);
  const [petDodge, setPetDodge] = useState<PveBattle['petDodge']>(null);
  const [charging, setCharging] = useState(false);

  const pE = useRef(0);
  const fE = useRef<number[]>([0]);
  const mtr = useRef(0);
  const seq = useRef(0);
  const nDef = useRef(0);
  const nRing = useRef(0);
  const nDodge = useRef(0);
  const nStrike = useRef(0);
  const nFoeStrike = useRef(0);
  const phaseRef = useRef<PveBattle['phase']>('idle');
  const ringResolver = useRef<((g: RingGrade) => void) | null>(null);
  const dodgeStart = useRef(0);
  const dodgeAt = useRef<number | null>(null);
  const runId = useRef(0);

  const setPetEnergy = (v: number) => { pE.current = v; setPetEnergyS(v); };
  const setFoeEnergy = (a: number[]) => { fE.current = a; setFoeEnergyS(a); };
  const setMeter = (v: number) => { mtr.current = v; setMeterS(v); };
  const setPhaseBoth = (p: PveBattle['phase']) => { phaseRef.current = p; setPhase(p); };

  const cheer = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    const t = cheerTap(mtr.current);
    setMeter(t.meter);
    if (t.discharged) setPetEnergy(addEnergy(pE.current, 'cheer'));
  }, []);

  const swipe = useCallback((dir: -1 | 1) => {
    if (phaseRef.current !== 'dodge' || dodgeAt.current !== null) return;
    dodgeAt.current = now() - dodgeStart.current;
    setPetDodge({ id: ++seq.current, dir });
  }, []);

  const resolveRing = useCallback((grade: RingGrade) => {
    const r = ringResolver.current;
    ringResolver.current = null;
    r?.(grade);
  }, []);

  const reset = useCallback((o: { foes: number; keepPet?: boolean }) => {
    setFoeEnergy(Array.from({ length: Math.max(1, o.foes) }, () => 0));
    if (!o.keepPet) { setPetEnergy(0); setMeter(0); }
    setAction(null); setHits([]); setRing(null); setDodge(null); setPetDodge(null); setCharging(false);
    setPhaseBoth('idle');
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

    const showHits = (list: PveHit[], side: 'me' | 'foe', tag: string | undefined, big: boolean) => {
      if (list.length === 0) return;
      setHits(list.map((h, i) => ({ id: ++seq.current, side, foe: h.foe, value: h.value, big, tag: i === 0 ? tag : undefined })));
    };

    const run = async () => {
      while (alive()) {
        const rules = rulesRef.current;
        // ── o turno do PET ───────────────────────────────────────────────────
        if (!(await wait(Math.max(0, PVE_STEP_MS - STAGE_TIMING.ranged.impact)))) return;
        const target = rules.target();
        const n = nStrike.current++;
        const special = energyFull(pE.current);
        let ringG: RingGrade = 'bom';
        let kind: StageActionKind;
        if (special) {
          const spec = ringSpec(seed, nRing.current++);
          setCharging(true);
          setRing({ spec, foe: target, key: ++seq.current });
          setPhaseBoth('ring');
          ringG = await new Promise<RingGrade>((resolve) => {
            ringResolver.current = resolve;
          });
          ringResolver.current = null;
          setRing(null);
          setPhaseBoth('idle');
          setCharging(false);
          if (!alive()) return;
          kind = 'special';
        } else {
          kind = rules.playerKind(n);
        }
        setAction({ id: ++seq.current, actor: 'me', foe: target, kind, element: rules.playerElement(special) });
        if (!(await wait(impactMs(kind, reduced)))) return;
        const res = rules.playerStrike({ special, ring: ringG, target, n });
        if (special) setPetEnergy(spendEnergy(pE.current));
        setPetEnergy(addEnergy(pE.current, 'dealt'));
        const fe = fE.current.slice();
        for (const h of res.hits) fe[h.foe] = addEnergy(fe[h.foe] ?? 0, 'taken');
        setFoeEnergy(fe);
        showHits(res.hits, 'foe', res.tag, special);
        if (res.victory) {
          if (!(await wait(END_BEAT_MS))) return;
          rules.onVictory();
          return;
        }

        // ── o revide: cada inimigo vivo, um por vez ─────────────────────────
        for (const foe of rulesRef.current.foes()) {
          const r2 = rulesRef.current;
          if (!(await wait(Math.max(0, PVE_STEP_MS - STAGE_TIMING.ranged.impact)))) return;
          const fn = nFoeStrike.current++;
          const fSpecial = energyFull(fE.current[foe] ?? 0);
          let dodgeG: DodgeGrade = 'nada';
          let acc = 0;
          let fKind: StageActionKind;
          let blocked = false;
          if (fSpecial) {
            const fe2 = fE.current.slice(); fe2[foe] = spendEnergy(fe2[foe] ?? 0); setFoeEnergy(fe2);
            const spec = dodgeSpec(seed, nDodge.current++);
            dodgeAt.current = null;
            dodgeStart.current = now();
            setDodge({ spec, key: ++seq.current });
            setPhaseBoth('dodge');
            setAction({
              id: ++seq.current, actor: 'foe', foe, kind: 'special', element: r2.foeElement(foe),
              castMs: spec.castMs, impactMs: spec.impactMs, totalMs: spec.impactMs + 500,
            });
            if (!(await wait(spec.impactMs))) return;
            dodgeG = dodgeGrade(dodgeAt.current, spec);
            setDodge(null);
            setPhaseBoth('idle');
            // acc só entra na conta como base do golpe; o especial não é bloqueado de graça.
            acc = autoDefense(defenseRoll(seed, nDef.current++), { bonus: r2.defenseBonus, perfect: r2.perfect }).acc;
            fKind = 'special';
          } else {
            acc = autoDefense(defenseRoll(seed, nDef.current++), { bonus: r2.defenseBonus, perfect: r2.perfect }).acc;
            blocked = acc >= r2.perfect;
            fKind = r2.foeKind(foe, fn);
            setAction({
              id: ++seq.current, actor: 'foe', foe, kind: fKind, element: r2.foeElement(foe),
              shield: blocked ? r2.playerElement(false) : null,
            });
            if (!(await wait(impactMs(fKind, reduced)))) return;
          }
          const fr = r2.foeStrike({ foe, special: fSpecial, dodge: dodgeG, acc, n: fn });
          const fe3 = fE.current.slice(); fe3[foe] = addEnergy(fe3[foe] ?? 0, 'dealt'); setFoeEnergy(fe3);
          setPetEnergy(addEnergy(pE.current, 'taken'));
          if (fr.value > 0) {
            setHits([{ id: ++seq.current, side: 'me', foe, value: fr.value, big: fSpecial, tag: fr.tag }]);
          } else if (fr.tag) {
            setHits([{ id: ++seq.current, side: 'me', foe, value: 0, tag: fr.tag }]);
          }
          if (fr.counter) {
            const c = fr.counter;
            setTimeout(() => setHits(h => [...h, { id: ++seq.current, side: 'foe', foe: c.foe, value: c.value }]), 450);
          }
          if (fr.defeat) {
            if (!(await wait(END_BEAT_MS))) return;
            rulesRef.current.onDefeat();
            return;
          }
          if (fr.victory) {
            if (!(await wait(END_BEAT_MS))) return;
            rulesRef.current.onVictory();
            return;
          }
        }
      }
    };
    void run();
    return () => {
      runId.current++;
      timers.forEach(clearTimeout);
      ringResolver.current = null;
      setPhaseBoth('idle');
      setRing(null); setDodge(null); setCharging(false);
    };
    // O relógio reinicia só quando a luta liga/desliga ou a semente muda — as regras vêm por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seed, reduced, opts.runKey]);

  return {
    action, hits, petEnergy, foeEnergy, meter, phase, ring, dodge, petDodge, charging,
    cheer, swipe, resolveRing, reset,
    _setPetEnergy: setPetEnergy,
    _setFoeEnergy: (foe, v) => { const a = fE.current.slice(); a[foe] = v; setFoeEnergy(a); },
  };
}
