// @vitest-environment jsdom
/**
 * AVANÇO RÁPIDO + ESPECIAL AUTOMÁTICO da Masmorra (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * O contrato: a velocidade (1×/2×/3×) só encurta o RELÓGIO da cena — o núcleo decide a luta pela semente, e o especial automático
 * tira a nota do anel e da esquiva de um sorteio com semente. Logo o RESULTADO da luta é o mesmo em qualquer velocidade e é o
 * mesmo que a conta pura da descida que continua sozinha (`playAutoFight`). Aqui isso é medido de ponta a ponta no hook real.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useGroupBattle, type GroupRound, type GroupScene } from './useGroupBattle';
import type { GroupResult } from '../../utils/combate/group';
import { dungeonFight, dungeonFightSeed, autoRingGrade, autoDodgeGrade, type DungeonPlayerCfg } from '../../utils/dungeonFight';
import { dungeonWaveOf, playAutoFight } from '../../utils/dungeonAway';
import { soulCombatant } from '../../utils/soulXP';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const SEED = 20261011;
const cfg: DungeonPlayerCfg = { combatant: soulCombatant({ evolutionStage: 'champion' }), family: 'direct' };
// o 6º da escada (o mega) tem especial: a luta tem anel E esquiva
const enemy = dungeonWaveOf(SEED, 1, cfg.combatant.level, 'champion')[5];
const fseed = dungeonFightSeed(SEED, enemy.floor, enemy.slot);

const scene = (): GroupScene => ({
  playerMaxHp: 100, foeMaxHp: [100],
  playerElement: () => 'neutro', foeElement: () => 'neutro',
  playerKind: () => 'melee', foeKind: () => 'melee',
  labels: { blocked: 'B', ring: { ruim: 'r', bom: 'b', otimo: 'o' }, dodge: {} },
});

async function lutar(speed: number, auto: boolean): Promise<{ res: GroupResult; gastoMs: number; viuAnel: boolean }> {
  vi.useFakeTimers();
  let res: GroupResult | null = null;
  let viuAnel = false;
  const round = (): GroupRound => {
    const f = dungeonFight(cfg, enemy.foe, fseed, false);
    return { player: f.player, foes: f.foes, seed: f.seed, startHp: 1, startEnergy: 100, hitScale: f.hitScale, castScale: ({ who, ring, dodge }) => f.castScale({ who, ring, dodge }) };
  };
  const { result } = renderHook(() => useGroupBattle({
    running: true, paused: false, reduced: false, runKey: 1, seed: 7, round, scene, torcida: false, speed,
    autoSpecial: auto ? { ring: n => autoRingGrade(fseed, n), dodge: n => autoDodgeGrade(fseed, n) } : undefined,
    onEnd: (r) => { res = r; },
  }));
  let gasto = 0;
  while (!res && gasto < 600_000) {
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    gasto += 100;
    if (result.current.ring) viuAnel = true;
    // sem o especial automático o anel abre e a luta espera o jogador: este teste só mede o caminho automático
    if (!auto && viuAnel) break;
  }
  return { res: res as unknown as GroupResult, gastoMs: gasto, viuAnel };
}

describe('Masmorra — avanço rápido e especial automático', () => {
  it('o resultado da luta é IDÊNTICO em 1×, 2× e 3× — e idêntico à conta pura da descida que continua sozinha', async () => {
    const puro = playAutoFight(cfg, enemy, SEED, 1, 100).res;
    expect(puro.winner).toBeDefined();
    const r1 = await lutar(1, true);
    cleanup(); vi.useRealTimers();
    const r2 = await lutar(2, true);
    cleanup(); vi.useRealTimers();
    const r3 = await lutar(3, true);
    for (const r of [r1, r2, r3]) {
      expect(r.res).toBeTruthy();
      expect(r.res.winner).toBe(puro.winner);
      expect(r.res.hpLeft).toBeCloseTo(puro.hpLeft, 9);
      expect(r.res.energyLeft).toBeCloseTo(puro.energyLeft, 9);
      expect(r.res.t).toBeCloseTo(puro.t, 9);
    }
  });

  it('o relógio anda mais depressa: 3× gasta bem menos tempo de parede que 1× (e 2× fica no meio)', async () => {
    const r1 = await lutar(1, true);
    cleanup(); vi.useRealTimers();
    const r2 = await lutar(2, true);
    cleanup(); vi.useRealTimers();
    const r3 = await lutar(3, true);
    expect(r3.gastoMs).toBeLessThan(r2.gastoMs);
    expect(r2.gastoMs).toBeLessThan(r1.gastoMs);
    expect(r3.gastoMs).toBeLessThan(r1.gastoMs * 0.45);
  });

  it('com o especial automático o ANEL nunca abre (ninguém precisa tocar para carregar o especial)', async () => {
    const r = await lutar(3, true);
    expect(r.viuAnel).toBe(false);
    expect(r.res).toBeTruthy();
  });

  it('sem o automático (Arena, Duelo, Pesadelo) o anel abre como sempre — o comportamento deles não mudou', async () => {
    const r = await lutar(1, false);
    expect(r.viuAnel).toBe(true);
  });

  it('a nota do especial é função só da semente da luta e do número do especial (nunca do relógio nem da velocidade)', () => {
    const a = [0, 1, 2, 3].map(n => autoRingGrade(fseed, n));
    const b = [0, 1, 2, 3].map(n => autoRingGrade(fseed, n));
    expect(a).toEqual(b);
    const d1 = [0, 1, 2].map(n => autoDodgeGrade(fseed, n));
    expect(d1).toEqual([0, 1, 2].map(n => autoDodgeGrade(fseed, n)));
  });
});
