import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  autoDefense, defenseRoll, jeitoDefesaBonus,
  AUTO_DEF_MEAN, AUTO_DEF_SPREAD, AUTO_DEF_PERFECT, TIMING_DODGE_ENABLED,
} from './autoDefesa';
import { buildDungeonWave, playerStatsFor } from './dungeon';
import { JEITO_PADRAO, jeitoDaProfissao, type JeitoNaMasmorra } from './profissaoMasmorra';
import { TORCIDA_BASE_FRAC, TORCIDA_PVE_SPECIAL_MULT, TORCIDA_PVE_TAPS_FULL, torcidaStrike } from './torcida';

function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('autoDefense — regra pura e determinística', () => {
  it('a barra de esquiva por timing está desligada', () => {
    expect(TIMING_DODGE_ENABLED).toBe(false);
  });

  it('defenseRoll: mesma (semente, n) = mesmo número; fica em [0,1); n diferente muda', () => {
    expect(defenseRoll(42, 3)).toBe(defenseRoll(42, 3));
    expect(defenseRoll(42, 3)).not.toBe(defenseRoll(42, 4));
    expect(defenseRoll(42, 3)).not.toBe(defenseRoll(43, 3));
    for (let i = 0; i < 2000; i++) {
      const r = defenseRoll(i * 7919, i);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });

  it('autoDefense: pura, precisão em 0..1, desfecho coerente com os limiares', () => {
    expect(autoDefense(0.3)).toEqual(autoDefense(0.3));
    expect(autoDefense(1).acc).toBeLessThanOrEqual(1);
    expect(autoDefense(0).acc).toBeGreaterThanOrEqual(0);
    expect(autoDefense(1).outcome).toBe('esquiva');
    expect(autoDefense(0).outcome).toBe('cheio');
    expect(autoDefense(0.5).acc).toBeCloseTo(AUTO_DEF_MEAN, 5);
    expect(autoDefense(Number.NaN).acc).toBeCloseTo(AUTO_DEF_MEAN, 5);
    // limiar perfeito do jeito (joalheiro 0,89) vale
    const r = 0.5 + (0.9 - AUTO_DEF_MEAN) / (2 * AUTO_DEF_SPREAD);
    expect(autoDefense(r).outcome).toBe('parcial');
    expect(autoDefense(r, { perfect: 0.89 }).outcome).toBe('esquiva');
  });

  it('paridade com a simulação da Arena: a mesma lei da `sampleAcc` (0,70 ± 0,25 uniforme)', () => {
    for (let i = 0; i <= 100; i++) {
      const r = i / 100;
      const sim = Math.min(1, Math.max(0, 0.7 + (r * 2 - 1) * 0.25));
      expect(autoDefense(r).acc).toBeCloseTo(sim, 10);
    }
  });

  it('jeitoDefesaBonus: ofício sem defesa = 0; luthier e tecelão somam', () => {
    expect(jeitoDefesaBonus(JEITO_PADRAO)).toBe(0);
    expect(jeitoDefesaBonus(jeitoDaProfissao('luthier'))).toBeGreaterThan(0);
    expect(jeitoDefesaBonus(jeitoDaProfissao('tecelao'))).toBeGreaterThan(0);
  });
});

// ── Simulação: a luta com esquiva "média" (antes) vs. defesa automática (depois) ──
//
// Jogador médio da barra = a convenção da Arena (acc 0,7 ± 0,25 uniforme). A
// luta é a MESMA do `DungeonGame`/`NightmareBattle` (golpe automático, defesa
// depois do golpe, esquiva limpa a partir de `perfeito` com contra-ataque).

type Defesa = 'timing' | 'auto';
interface SimOpts {
  stage: string; baseLevel: number; floors?: number; tapsPerStrike: number;
  specialMult: number; defesa: Defesa; rng: () => number; jeito?: JeitoNaMasmorra;
  /** Pesadelo: fatia de 2 inimigos, sem cura de camada, sem `reducaoDano`. */
  nightmareTop?: number;
  timingMean?: number;
}
interface SimOut { won: boolean; floorsCleared: number; strikes: number; lostFloor: number; kills: number }

function simRun(o: SimOpts): SimOut {
  const jeito = o.jeito ?? JEITO_PADRAO;
  const base = playerStatsFor(o.stage);
  const hpMax = Math.round(base.hp * jeito.hp);
  const dmg = base.dmg * jeito.dmg;
  const floors = o.floors ?? 5;
  let hp = hpMax;
  let strikes = 0;
  let kills = 0;
  let gauge = 0;
  let nDef = 0;
  const seed = Math.floor(o.rng() * 1e9);
  const bonus = jeitoDefesaBonus(jeito);

  const defend = (): number => {
    if (o.defesa === 'timing') return Math.min(1, Math.max(0, (o.timingMean ?? 0.7) + (o.rng() * 2 - 1) * 0.25));
    return autoDefense(defenseRoll(seed, nDef++), { bonus, perfect: jeito.perfeito }).acc;
  };

  for (let f = 1; f <= floors; f++) {
    let wave = buildDungeonWave(o.baseLevel + (f - 1), o.stage);
    if (o.nightmareTop !== undefined) {
      const top = o.nightmareTop;
      const level = Math.max(1, top - 1);
      wave = buildDungeonWave(level, o.stage).slice(top + 1 - Math.max(1, Math.min(2, top + 1)), top + 1);
    }
    for (const e of wave) {
      let eh = e.hp;
      let guard = 0;
      while (eh > 0 && guard++ < 500) {
        gauge = Math.min(TORCIDA_PVE_TAPS_FULL, gauge + o.tapsPerStrike);
        const special = gauge >= TORCIDA_PVE_TAPS_FULL;
        if (special) gauge = 0;
        const guarda = e.dmgReduction * (1 - jeito.atravessaGuarda);
        const raw = dmg * TORCIDA_BASE_FRAC * (special ? o.specialMult : 1);
        eh -= Math.max(1, Math.round(raw * (1 - guarda)));
        strikes++;
        if (eh <= 0) break;
        const acc = defend();
        if (acc >= jeito.perfeito) {
          eh -= Math.max(1, Math.round(2 * jeito.contraAtaque * (1 - e.dmgReduction)));
          continue;
        }
        hp -= Math.max(1, Math.ceil(e.atk * (1 - acc)) - jeito.reducaoDano);
        if (hp <= 0) return { won: false, floorsCleared: f - 1, strikes, lostFloor: f, kills };
      }
      kills++;
    }
    if (o.nightmareTop === undefined && f < floors) {
      hp = Math.min(hpMax, hp + Math.ceil(hpMax * jeito.curaAndar));
    }
  }
  return { won: true, floorsCleared: floors, strikes, lostFloor: 0, kills };
}

interface Agg { win: number; strikes: number; lossByFloor: number[]; floors: number; kills: number }
function batch(o: Omit<SimOpts, 'rng'>, n: number, seed: number): Agg {
  const rng = mulberry(seed);
  const spy = vi.spyOn(Math, 'random').mockImplementation(rng);
  try {
    const lossByFloor = [0, 0, 0, 0, 0, 0];
    let win = 0; let strikes = 0; let floors = 0; let kills = 0;
    for (let i = 0; i < n; i++) {
      const r = simRun({ ...o, rng });
      strikes += r.strikes; floors += r.floorsCleared; kills += r.kills;
      if (r.won) win++; else lossByFloor[r.lostFloor]++;
    }
    return { win: win / n, strikes: strikes / n, floors: floors / n, kills: kills / n, lossByFloor: lossByFloor.map(x => x / n) };
  } finally { spy.mockRestore(); }
}

afterEach(() => vi.restoreAllMocks());

const N = 20000;
const log = (...a: unknown[]) => { if (process.env.SIM_LOG) console.log(...a); };
const fmt = (x: Agg) => `vitória ${(x.win * 100).toFixed(1)}% · andares ${x.floors.toFixed(2)} · inimigos derrotados ${x.kills.toFixed(2)} · golpes/run ${x.strikes.toFixed(1)} · derrota por camada [${x.lossByFloor.slice(1).map(v => (v * 100).toFixed(1)).join(', ')}]%`;

describe('simulação 20.000 lutas — a defesa automática mantém a curva da esquiva média', () => {
  const casos: Array<{ stage: string; level: number }> = [
    { stage: 'rookie', level: 1 }, { stage: 'champion', level: 2 },
    { stage: 'ultimate', level: 3 }, { stage: 'mega', level: 4 },
  ];

  it('Masmorra, sem torcer: mesma duração e mesma derrota por camada que a esquiva média (0,70)', () => {
    for (const c of casos) {
      const antes = batch({ stage: c.stage, baseLevel: c.level, tapsPerStrike: 0, specialMult: 2, defesa: 'timing' }, N, 11);
      const depois = batch({ stage: c.stage, baseLevel: c.level, tapsPerStrike: 0, specialMult: 2, defesa: 'auto' }, N, 11);
      log(`SEM TORCER ${c.stage}@${c.level}
  antes : ${fmt(antes)}
  depois: ${fmt(depois)}`);
      expect(Math.abs(depois.win - antes.win)).toBeLessThan(0.01);
      expect(Math.abs(depois.strikes - antes.strikes) / antes.strikes).toBeLessThan(0.03);
      expect(Math.abs(depois.floors - antes.floors)).toBeLessThan(0.05);
      expect(Math.abs(depois.kills - antes.kills) / antes.kills).toBeLessThan(0.03);
    }
  });

  it('Pesadelo (2 inimigos, sem cura de camada): vitória e duração perto da esquiva média', () => {
    for (const top of [2, 3]) {
      const base = { stage: 'rookie', baseLevel: 1, floors: 1, nightmareTop: top, tapsPerStrike: 0, specialMult: 2 };
      const antes = batch({ ...base, defesa: 'timing' }, N, 5);
      const depois = batch({ ...base, defesa: 'auto' }, N, 5);
      log(`PESADELO top${top} sem torcer
  antes : ${fmt(antes)}
  depois: ${fmt(depois)}`);
      expect(Math.abs(depois.win - antes.win)).toBeLessThan(0.02);
      expect(Math.abs(depois.strikes - antes.strikes) / antes.strikes).toBeLessThan(0.05);
    }
  });

  it('o especial 3× ajuda quem torce mas NÃO deixa a run trivial (nem o toque máximo limpa as 5 camadas)', () => {
    for (const c of casos) {
      for (const taps of [4, 8]) {
        const dois = batch({ stage: c.stage, baseLevel: c.level, tapsPerStrike: taps, specialMult: 2, defesa: 'auto' }, N, 7);
        const tres = batch({ stage: c.stage, baseLevel: c.level, tapsPerStrike: taps, specialMult: 3, defesa: 'auto' }, N, 7);
        log(`ESPECIAL ${c.stage}@${c.level} toques/golpe ${taps}
  2x: ${fmt(dois)}
  3x: ${fmt(tres)}`);
        expect(tres.kills).toBeGreaterThanOrEqual(dois.kills - 0.05);
        expect(tres.win).toBeLessThan(0.05);
      }
    }
  });

  it('a regra do especial usada aqui é a da produção (3×)', () => {
    expect(TORCIDA_PVE_SPECIAL_MULT).toBe(3);
    const s = torcidaStrike(8, TORCIDA_PVE_TAPS_FULL);
    expect(s.dmg).toBe(Math.round(8 * TORCIDA_BASE_FRAC * 3));
  });
});
