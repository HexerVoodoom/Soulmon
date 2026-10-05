import { describe, it, expect, vi, afterEach } from 'vitest';
import { autoDefense, defenseRoll, jeitoDefesaBonus } from './autoDefesa';
import { buildDungeonWave, playerStatsFor } from './dungeon';
import { JEITO_PADRAO } from './profissaoMasmorra';
import { TORCIDA_BASE_FRAC, TORCIDA_PVE_SPECIAL_MULT } from './torcida';
import {
  ENERGY_MAX, ENERGY_DEALT, ENERGY_TAKEN, ENERGY_CHEER, CHEER_TAPS_FULL, CHEER_TAPS_CAP, PVE_HP_SCALE, PVE_FOE_HP_EXTRA,
  PVE_SPECIAL_MULT, PVE_FOE_SPECIAL_MULT, RING_MULT, RING_OTIMO_MS, RING_BOM_MS, RING_FROM, RING_TO, DODGE_REDUCE, DODGE_OTIMO_MS,
  addEnergy, spendEnergy, strikeEnergy, energyFull, energyRatio, cheerTap, cheerRatio, pveStrikeDamage, pveFoeHitDamage, pveHp, pveFoeHp,
  ringSpec, ringScale, ringGrade, dodgeSpec, dodgeGrade,
  type RingGrade, type DodgeGrade,
} from './energia';
import { DUEL_ENERGY_MAX, DUEL_ENERGY_DEALT, DUEL_ENERGY_TAKEN, DUEL_ENERGY_CHEER, DUEL_TAPS_FULL } from '../../functions/api/_duel.js';
import { simulateArenaRun, simulateArenaRunEnergy, ARENA_HP_SCALE, ARENA_FOE_HP_EXTRA, type ArenaArchetypeConfig, type BestiaryCreature } from './arena';
import type { EscolaId } from './soulProfile/ficha/types';
import { mulberry32 } from './oracle';
import poolJson from './soulProfile/bestiary/pool.json';

afterEach(() => vi.restoreAllMocks());

describe('energia — o modelo (uma barra por lutador; a barra de cheer despeja energia no pet)', () => {
  it('as constantes são as do SERVIDOR (uma regra, um arquivo): o PvP e o PvE enchem do mesmo jeito', () => {
    expect(ENERGY_MAX).toBe(DUEL_ENERGY_MAX);
    expect(ENERGY_DEALT).toBe(DUEL_ENERGY_DEALT);
    expect(ENERGY_TAKEN).toBe(DUEL_ENERGY_TAKEN);
    expect(ENERGY_CHEER).toBe(DUEL_ENERGY_CHEER);
    expect(CHEER_TAPS_FULL).toBe(DUEL_TAPS_FULL);
    expect(CHEER_TAPS_FULL).toBe(24); // lenta de propósito: ~8 s a 3 toques/s
    expect(CHEER_TAPS_CAP).toBeLessThan(CHEER_TAPS_FULL);
  });

  it('cada fator enche um tanto: o cheer pesa MAIS que um ataque dado ou sofrido; nunca passa do máximo', () => {
    expect(addEnergy(0, 'dealt')).toBe(ENERGY_DEALT);
    expect(addEnergy(0, 'taken')).toBe(ENERGY_TAKEN);
    expect(addEnergy(0, 'cheer')).toBe(ENERGY_CHEER);
    expect(ENERGY_CHEER).toBeGreaterThan(Math.max(ENERGY_DEALT, ENERGY_TAKEN));
    expect(addEnergy(ENERGY_MAX - 1, 'cheer')).toBe(ENERGY_MAX);
    expect(addEnergy(Number.NaN, 'dealt')).toBe(ENERGY_DEALT);
    expect(energyFull(ENERGY_MAX)).toBe(true);
    expect(energyFull(ENERGY_MAX - 1)).toBe(false);
    expect(energyRatio(ENERGY_MAX / 2)).toBe(0.5);
    expect(spendEnergy(ENERGY_MAX)).toBe(0);
  });

  it('a barra de cheer: 24 toques despejam energia e ela zera, ficando só o excedente', () => {
    let m = 0; let desp = 0;
    for (let i = 0; i < CHEER_TAPS_FULL - 1; i++) { const r = cheerTap(m); m = r.meter; if (r.discharged) desp++; }
    expect(desp).toBe(0);
    expect(cheerRatio(m)).toBeLessThan(1);
    const r = cheerTap(m);
    expect(r.discharged).toBe(true);
    expect(r.meter).toBe(0);
    expect(cheerTap(5).meter).toBe(6); // toque normal só soma um
  });

  it('o modelo simples e legível: ataque dado + ataque sofrido + cheer enchem a MESMA barra até o especial', () => {
    // 16 por ida-e-volta (9 + 7): a 7ª ida-e-volta enche sem cheer; cada despejo de cheer adianta ~2,25 delas
    let sem = 0; let idas = 0;
    while (!energyFull(sem)) { sem = addEnergy(addEnergy(sem, 'dealt'), 'taken'); idas++; }
    expect(idas).toBe(7);
    let com = 0; let idasCom = 0;
    com = addEnergy(com, 'cheer');
    while (!energyFull(com)) { com = addEnergy(addEnergy(com, 'dealt'), 'taken'); idasCom++; }
    expect(idasCom).toBeLessThan(idas);
  });
});

describe('energia — o ANEL do especial (mecânica ativa do PvE, determinística pela semente)', () => {
  it('mesmo (semente, n) = mesmo anel; n diferente muda a velocidade; fica em 1,5–2,1 s', () => {
    expect(ringSpec(7, 0)).toEqual(ringSpec(7, 0));
    const velocidades = new Set(Array.from({ length: 20 }, (_, n) => ringSpec(7, n).ms));
    expect(velocidades.size).toBeGreaterThan(5);
    for (let n = 0; n < 200; n++) {
      const s = ringSpec(1234 + n, n);
      expect(s.ms).toBeGreaterThanOrEqual(1500);
      expect(s.ms).toBeLessThanOrEqual(2100);
      // o anel encosta no alvo (escala 1) exatamente em targetMs
      expect(ringScale(s.targetMs, s)).toBeCloseTo(1, 1);
    }
  });

  it('o anel encolhe de RING_FROM a RING_TO, sem passar', () => {
    const s = ringSpec(3, 1);
    expect(ringScale(0, s)).toBe(RING_FROM);
    expect(ringScale(s.ms, s)).toBeCloseTo(RING_TO, 5);
    expect(ringScale(s.ms * 2, s)).toBe(RING_TO);
    expect(ringScale(s.ms / 2, s)).toBeLessThan(ringScale(s.ms / 4, s));
  });

  it('a nota: ótimo perto do alvo, bom um pouco mais longe, ruim fora da janela ou sem toque', () => {
    const s = ringSpec(9, 2);
    expect(ringGrade(s.targetMs, s)).toBe('otimo');
    expect(ringGrade(s.targetMs - RING_OTIMO_MS, s)).toBe('otimo');
    expect(ringGrade(s.targetMs + RING_OTIMO_MS + 1, s)).toBe('bom');
    expect(ringGrade(s.targetMs - RING_BOM_MS, s)).toBe('bom');
    expect(ringGrade(s.targetMs + RING_BOM_MS + 1, s)).toBe('ruim');
    expect(ringGrade(0, s)).toBe('ruim'); // cedo demais
    expect(ringGrade(null, s)).toBe('ruim'); // sem toque: o especial sai, fraco
    expect(ringGrade(Number.NaN, s)).toBe('ruim');
  });

  it('os multiplicadores: ruim < bom (=1) < ótimo; um jogador médio fica perto de 1', () => {
    expect(RING_MULT.ruim).toBeLessThan(RING_MULT.bom);
    expect(RING_MULT.bom).toBe(1);
    expect(RING_MULT.otimo).toBeGreaterThan(RING_MULT.bom);
    const media = 0.25 * RING_MULT.ruim + 0.5 * RING_MULT.bom + 0.25 * RING_MULT.otimo;
    expect(media).toBeGreaterThan(0.97);
    expect(media).toBeLessThan(1.08);
  });
});

describe('energia — a ESQUIVA do especial do inimigo (mecânica ativa do PvE)', () => {
  it('mesmo (semente, n) = mesma janela; o projétil leva 1 s e a carga 1–1,5 s', () => {
    expect(dodgeSpec(5, 0)).toEqual(dodgeSpec(5, 0));
    for (let n = 0; n < 100; n++) {
      const s = dodgeSpec(77 + n, n);
      expect(s.castMs).toBeGreaterThanOrEqual(1000);
      expect(s.castMs).toBeLessThanOrEqual(1500);
      expect(s.flightMs).toBe(1000);
      expect(s.impactMs).toBe(s.castMs + s.flightMs);
    }
  });

  it('a nota: só vale com o projétil no ar; no último trecho antes do impacto é ótima; sem gesto = nada', () => {
    const s = dodgeSpec(11, 3);
    expect(dodgeGrade(null, s)).toBe('nada');
    expect(dodgeGrade(s.castMs - 1, s)).toBe('nada'); // cedo demais (ainda carregando)
    expect(dodgeGrade(s.castMs + 1, s)).toBe('bom');
    expect(dodgeGrade(s.impactMs - DODGE_OTIMO_MS - 1, s)).toBe('bom');
    expect(dodgeGrade(s.impactMs - DODGE_OTIMO_MS, s)).toBe('otimo');
    expect(dodgeGrade(s.impactMs, s)).toBe('otimo');
    expect(dodgeGrade(s.impactMs + 1, s)).toBe('nada'); // tarde demais
  });

  it('esquivar REDUZ o dano; sem agir leva o normal; ótimo tira mais que bom', () => {
    expect(DODGE_REDUCE.nada).toBe(0);
    expect(DODGE_REDUCE.bom).toBeGreaterThan(0);
    expect(DODGE_REDUCE.otimo).toBeGreaterThan(DODGE_REDUCE.bom);
    expect(DODGE_REDUCE.otimo).toBeLessThan(1); // nunca zera de graça
    const base = { atk: 10, acc: 0.5, perfect: 0.92, special: true };
    const nada = pveFoeHitDamage({ ...base, dodge: 'nada' }).dmg;
    const bom = pveFoeHitDamage({ ...base, dodge: 'bom' }).dmg;
    const otimo = pveFoeHitDamage({ ...base, dodge: 'otimo' }).dmg;
    expect(nada).toBeGreaterThan(bom);
    expect(bom).toBeGreaterThan(otimo);
    expect(otimo).toBeGreaterThanOrEqual(1);
  });
});

describe('energia — o dano do PvE (a defesa automática segue sendo a base)', () => {
  it('golpe-base = 0,5 × dmg; especial = 3× × a nota do anel (o 3× do dono, TORC-1)', () => {
    expect(PVE_SPECIAL_MULT).toBe(TORCIDA_PVE_SPECIAL_MULT);
    expect(pveStrikeDamage({ dmg: 8 })).toBe(Math.round(8 * TORCIDA_BASE_FRAC));
    expect(pveStrikeDamage({ dmg: 8, special: true, ring: 'bom' })).toBe(Math.round(8 * TORCIDA_BASE_FRAC * 3));
    const r: Record<RingGrade, number> = {
      ruim: pveStrikeDamage({ dmg: 20, special: true, ring: 'ruim' }),
      bom: pveStrikeDamage({ dmg: 20, special: true, ring: 'bom' }),
      otimo: pveStrikeDamage({ dmg: 20, special: true, ring: 'otimo' }),
    };
    expect(r.ruim).toBeLessThan(r.bom);
    expect(r.bom).toBeLessThan(r.otimo);
    expect(pveStrikeDamage({ dmg: 1, guard: 0.7 })).toBe(1); // a casca nunca zera
  });

  it('o golpe normal do inimigo: defesa perfeita bloqueia; o ESPECIAL não é bloqueado de graça e vale 2×', () => {
    const normal = pveFoeHitDamage({ atk: 6, acc: 0.5, perfect: 0.92 });
    expect(normal.blocked).toBe(false);
    expect(pveFoeHitDamage({ atk: 6, acc: 0.95, perfect: 0.92 })).toEqual({ dmg: 0, blocked: true });
    const esp = pveFoeHitDamage({ atk: 6, acc: 0.95, perfect: 0.92, special: true });
    expect(esp.blocked).toBe(false);
    expect(esp.dmg).toBeGreaterThanOrEqual(1);
    const normal2 = pveFoeHitDamage({ atk: 10, acc: 0.3, perfect: 0.92 }).dmg;
    expect(pveFoeHitDamage({ atk: 10, acc: 0.3, perfect: 0.92, special: true }).dmg).toBe(normal2 * PVE_FOE_SPECIAL_MULT);
    // o ofício reduz o golpe como sempre
    expect(pveFoeHitDamage({ atk: 6, acc: 0.3, perfect: 0.92, reducaoDano: 2 }).dmg).toBe(Math.max(1, Math.ceil(6 * 0.7) - 2));
  });

  it('a luta ficou mais longa: vida × escala (o dano por golpe não muda)', () => {
    expect(PVE_HP_SCALE).toBe(1.8);
    expect(pveHp(12)).toBe(Math.round(12 * PVE_HP_SCALE));
    expect(pveFoeHp(10)).toBe(Math.round(10 * PVE_HP_SCALE * PVE_FOE_HP_EXTRA));
    expect(pveFoeHp(10)).toBeGreaterThanOrEqual(pveHp(10));
  });
});

// ── Simulação 20.000 lutas: antes (sem energia) vs depois (com energia, escala de vida e mecânicas) ──
function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pol = 'nenhuma' | 'media' | 'boa';
const pickRing = (pol: Pol, r: number): RingGrade => pol === 'nenhuma' ? 'ruim' : pol === 'media' ? (r < 0.25 ? 'ruim' : r < 0.75 ? 'bom' : 'otimo') : (r < 0.1 ? 'ruim' : r < 0.4 ? 'bom' : 'otimo');
const pickDodge = (pol: Pol, r: number): DodgeGrade => pol === 'nenhuma' ? 'nada' : pol === 'media' ? (r < 0.3 ? 'nada' : r < 0.7 ? 'bom' : 'otimo') : (r < 0.1 ? 'nada' : r < 0.4 ? 'bom' : 'otimo');

interface P {
  stage: string; baseLevel: number; floors?: number; tapsPerTrip: number; nightmareTop?: number;
  pol: Pol; rng: () => number; legacy?: boolean;
}
interface Out { won: boolean; kills: number; tripsPerEnemy: number[] }

/** Uma run (Masmorra) ou luta (Pesadelo) pelas regras de `energia.ts`. `legacy` = sem energia, vida × 1: a luta de ANTES. */
function simRun(o: P): Out {
  const jeito = JEITO_PADRAO;
  const base = playerStatsFor(o.stage);
  const scale = o.legacy ? 1 : PVE_HP_SCALE;
  const hpMax = Math.round(base.hp * jeito.hp * scale);
  const dmg = base.dmg * jeito.dmg;
  const floors = o.floors ?? 5;
  let hp = hpMax; let kills = 0; let pE = 0; let meter = 0; let nDef = 0;
  const seed = Math.floor(o.rng() * 1e9);
  const bonus = jeitoDefesaBonus(jeito);
  const tripsPerEnemy: number[] = [];
  for (let f = 1; f <= floors; f++) {
    let wave = buildDungeonWave(o.baseLevel + (f - 1), o.stage);
    if (o.nightmareTop !== undefined) {
      const top = o.nightmareTop; const level = Math.max(1, top - 1);
      wave = buildDungeonWave(level, o.stage).slice(top + 1 - Math.max(1, Math.min(2, top + 1)), top + 1);
    }
    for (const e of wave) {
      let eh = o.legacy ? e.hp : pveFoeHp(e.hp);
      let eE = 0; let guard = 0; let trips = 0;
      while (eh > 0 && guard++ < 800) {
        trips++;
        meter += o.tapsPerTrip;
        while (meter >= CHEER_TAPS_FULL) { meter -= CHEER_TAPS_FULL; pE = addEnergy(pE, 'cheer'); }
        const special = !o.legacy && energyFull(pE);
        const guarda = e.dmgReduction * (1 - jeito.atravessaGuarda);
        eh -= pveStrikeDamage({ dmg, guard: guarda, special, ring: pickRing(o.pol, o.rng()) });
        pE = strikeEnergy(pE, special); eE = addEnergy(eE, 'taken');
        if (eh <= 0) break;
        const fs = !o.legacy && energyFull(eE);
        const acc = autoDefense(defenseRoll(seed, nDef++), { bonus, perfect: jeito.perfeito }).acc;
        const hit = pveFoeHitDamage({ atk: e.atk, acc, perfect: jeito.perfeito, reducaoDano: jeito.reducaoDano, special: fs, dodge: fs ? pickDodge(o.pol, o.rng()) : 'nada' });
        eE = strikeEnergy(eE, fs); pE = addEnergy(pE, 'taken');
        if (hit.blocked) { eh -= Math.max(1, Math.round(2 * jeito.contraAtaque * (1 - e.dmgReduction))); continue; }
        hp -= hit.dmg;
        if (hp <= 0) return { won: false, kills, tripsPerEnemy };
      }
      kills++; tripsPerEnemy.push(trips);
    }
    if (o.nightmareTop === undefined && f < floors) hp = Math.min(hpMax, hp + Math.ceil(hpMax * jeito.curaAndar));
  }
  return { won: true, kills, tripsPerEnemy };
}
function batch(o: Omit<P, 'rng'>, n: number, seed: number) {
  const rng = mulberry(seed);
  vi.spyOn(Math, 'random').mockImplementation(rng);
  let win = 0, kills = 0, te = 0, tn = 0;
  for (let i = 0; i < n; i++) {
    const r = simRun({ ...o, rng });
    if (r.won) win++;
    kills += r.kills;
    for (const x of r.tripsPerEnemy) { te += x; tn++; }
  }
  vi.restoreAllMocks();
  return { win: win / n, kills: kills / n, trips: te / Math.max(1, tn) };
}

const N = 20000;
/** Cada ida-e-volta (golpe do pet + golpe do inimigo) leva 2 × `PVE_STEP_MS` na cena = 3,4 s. */
const SEG_POR_IDA = 3.4;
const relatorio: string[] = [];
const fmt = (x: { win: number; kills: number; trips: number }) => `vitória ${(x.win * 100).toFixed(1)}% · inimigos derrotados/run ${x.kills.toFixed(2)} · idas-e-voltas/inimigo ${x.trips.toFixed(2)} (≈ ${(x.trips * SEG_POR_IDA).toFixed(0)} s)`;

describe('simulação 20.000 lutas — Masmorra: a energia + vida × 1,8 mantém a curva e leva cada inimigo a ~20–30 s', () => {
  const casos = [{ stage: 'rookie', level: 1 }, { stage: 'champion', level: 2 }, { stage: 'ultimate', level: 3 }, { stage: 'mega', level: 4 }];

  it('jogador que age (média): inimigos derrotados por run ≈ os de antes (±8%); cada inimigo leva ~17–32 s (era ~12–17 s)', () => {
    for (const c of casos) {
      const antes = batch({ stage: c.stage, baseLevel: c.level, tapsPerTrip: 0, pol: 'nenhuma', legacy: true }, N, 11);
      const media = batch({ stage: c.stage, baseLevel: c.level, tapsPerTrip: 0, pol: 'media' }, N, 11);
      const nenhuma = batch({ stage: c.stage, baseLevel: c.level, tapsPerTrip: 0, pol: 'nenhuma' }, N, 11);
      const toca = batch({ stage: c.stage, baseLevel: c.level, tapsPerTrip: 6, pol: 'media' }, N, 11);
      relatorio.push(`MASMORRA ${c.stage}@${c.level}\n  antes (sem energia, vida ×1): ${fmt(antes)}\n  depois, joga as mecânicas:    ${fmt(media)}\n  depois, nunca age:            ${fmt(nenhuma)}\n  depois, 6 toques/ida:         ${fmt(toca)}`);
      expect(Math.abs(media.kills - antes.kills) / antes.kills).toBeLessThan(0.08);
      expect(nenhuma.kills).toBeGreaterThan(antes.kills * 0.7); // quem nunca age não despenca (a defesa automática é a base)
      expect(toca.kills).toBeGreaterThanOrEqual(media.kills - 0.03); // torcer só soma
      expect(media.trips * SEG_POR_IDA).toBeGreaterThan(17);
      expect(media.trips * SEG_POR_IDA).toBeLessThan(32);
      expect(media.trips).toBeGreaterThan(antes.trips * 1.3); // a luta ficou mais longa
    }
  });

  it('Pesadelo (2 inimigos): a taxa de vitória de quem joga fica perto da de antes; quem nunca age fica abaixo', () => {
    for (const top of [2, 3]) {
      const base = { stage: 'rookie', baseLevel: 1, floors: 1, nightmareTop: top, tapsPerTrip: 0 } as const;
      const antes = batch({ ...base, pol: 'nenhuma', legacy: true }, N, 5);
      const media = batch({ ...base, pol: 'media' }, N, 5);
      const nenhuma = batch({ ...base, pol: 'nenhuma' }, N, 5);
      relatorio.push(`PESADELO top${top}\n  antes: ${fmt(antes)}\n  depois, joga as mecânicas: ${fmt(media)}\n  depois, nunca age:         ${fmt(nenhuma)}`);
      if (top === 2) {
        expect(Math.abs(media.win - antes.win)).toBeLessThan(0.08);
        expect(nenhuma.win).toBeLessThan(media.win);
      }
      expect(media.trips * SEG_POR_IDA).toBeGreaterThan(17);
      expect(media.trips * SEG_POR_IDA).toBeLessThan(40);
    }
  });
});

describe('simulação — Duelo da Arena: a energia + vida × escala mantém a taxa por escola e leva cada inimigo a ~20–30 s', () => {
  const POOL = (poolJson as { criaturas: BestiaryCreature[] }).criaturas;
  const ESCOLAS: EscolaId[] = ['combate_fisico', 'longo_alcance', 'conjuracao', 'evocacao', 'benca', 'maldicao'];
  const cfg = (e: EscolaId): ArenaArchetypeConfig => ({
    stage: 'rookie', escolaBasica: e, escolaEspecial: e, elementoBasica: 'vigor', elementoEspecial: 'vigor',
    attrs: { principal: 'vigor', secundario: 'vigor' },
  });
  const RUNS = 3000;
  const roda = (skill: 'nenhuma' | 'media' | 'boa', tapsPerTurn: number) => {
    const taxas: number[] = []; let secs = 0; let kills = 0;
    for (const e of ESCOLAS) {
      const rng = mulberry32(20260818); let w = 0;
      for (let i = 0; i < RUNS; i++) {
        const r = simulateArenaRunEnergy(cfg(e), { rng, pool: POOL, skill, tapsPerTurn });
        if (r.won) w++;
        secs += r.seconds; kills += r.kills;
      }
      taxas.push(w / RUNS);
    }
    return { taxas, media: taxas.reduce((a, b) => a + b, 0) / taxas.length, segPorInimigo: secs / kills };
  };

  it('quem joga as mecânicas ≈ o Duelo de antes (±5pp na média); cada inimigo leva ~20–30 s; a torcida só soma', () => {
    const antes = ESCOLAS.map(e => {
      const rng = mulberry32(20260818); let w = 0;
      for (let i = 0; i < RUNS; i++) if (simulateArenaRun(cfg(e), { rng, pool: POOL, accMean: 0.7, autoAttack: true }).won) w++;
      return w / RUNS;
    });
    const antesMedia = antes.reduce((a, b) => a + b, 0) / antes.length;
    const media0 = roda('media', 0);
    const nenhuma0 = roda('nenhuma', 0);
    const media11 = roda('media', 11);
    const boa11 = roda('boa', 11);
    relatorio.push(
      `ARENA (6 escolas, ${RUNS} runs cada = ${RUNS * 6})\n  antes (pet sozinho, sem torcer): ${antes.map(x => (x * 100).toFixed(1)).join(' / ')} → média ${(antesMedia * 100).toFixed(1)}%\n`
      + `  depois, joga as mecânicas, sem torcer: ${media0.taxas.map(x => (x * 100).toFixed(1)).join(' / ')} → ${(media0.media * 100).toFixed(1)}% · ${media0.segPorInimigo.toFixed(1)} s/inimigo\n`
      + `  depois, nunca age: ${(nenhuma0.media * 100).toFixed(1)}% · 11 toques/turno: ${(media11.media * 100).toFixed(1)}% · bom jogador + 11 toques: ${(boa11.media * 100).toFixed(1)}% (HP ×${ARENA_HP_SCALE}, inimigo ×${ARENA_FOE_HP_EXTRA})`,
    );
    expect(Math.abs(media0.media - antesMedia)).toBeLessThan(0.05);
    expect(Math.min(...media0.taxas)).toBeGreaterThanOrEqual(0.4);
    expect(Math.max(...media0.taxas)).toBeLessThanOrEqual(0.8);
    expect(media0.segPorInimigo).toBeGreaterThan(20);
    expect(media0.segPorInimigo).toBeLessThan(30);
    expect(media11.media).toBeGreaterThan(media0.media);
    expect(boa11.media).toBeGreaterThan(media11.media);
    expect(nenhuma0.media).toBeLessThan(media0.media);
  });

  it('toque ilimitado não rende mais que o teto da barra de cheer (CHEER_TAPS_CAP por turno)', () => {
    const teto = roda('media', CHEER_TAPS_CAP);
    const abuso = roda('media', 1000);
    expect(abuso.taxas).toEqual(teto.taxas);
  });
});

describe('relatório da simulação', () => {
  it('grava as contas (para o relatório) quando SIM_OUT está definido', async () => {
    if (process.env.SIM_OUT) {
      const spec = 'node:fs'; // em variável: o tsconfig do projeto não carrega os tipos do Node
      const fs = await import(/* @vite-ignore */ spec);
      fs.writeFileSync(process.env.SIM_OUT, relatorio.join('\n'));
    }
    expect(relatorio.length).toBeGreaterThan(0);
  });
});
