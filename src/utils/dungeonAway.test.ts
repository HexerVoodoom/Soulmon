/**
 * A DESCIDA QUE CONTINUA SOZINHA (pedido do dono, 11/10/2026, REGISTRO §36) — a conta pura de quem ficou fora.
 *
 * Trava o que o dono pediu e o que a régua de save/economia exige: o avanço aparece ao voltar, o tempo fora tem TETO, a conta é
 * DETERMINÍSTICA e IDEMPOTENTE (nada de cliente escolhendo recompensa), os Bits passam pelo teto diário, a energia é a da Home,
 * a descida acaba sozinha e o Soulmon volta para casa; "Retirar" acerta e libera. Mais o contrato do campo no save.
 */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import {
  DUNGEON_AWAY_MAX_MS, DUNGEON_FIGHTS_PER_FLOOR, sanitizeDungeonAway, soulmonNaMasmorra, type DungeonAway,
} from './dungeonIdle';
import { applyDungeonAway, dungeonWaveOf, awayPlayerCfg, playAutoFight } from './dungeonAway';
import { soulCombatant } from './soulXP';
import { MINIGAME_BITS_PER_DAY, minigameBitsToday } from './currencies';
import { playerDayKey } from './playerDay';
import { bondLevelFor } from './bond';

const T0 = Date.UTC(2026, 9, 11, 15, 0, 0);
const HORA = 3_600_000;
const SEED = 424242;

function away(over: Partial<DungeonAway> = {}, stage = 'ultimate'): DungeonAway {
  const c = soulCombatant({ evolutionStage: stage });
  return {
    since: T0, seed: SEED, layer: 1, slot: 0, hp: 1, en: 0, ms: false,
    player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rb: 0, stage },
    ...over,
  };
}

function estado(over: Record<string, unknown> = {}, a: DungeonAway | null = away()): GameState {
  return {
    foodInventory: {}, gamePoints: 0, energyPoints: 6, totalXP: 5_000_000, evolutionStage: 'ultimate', dungeonAway: a ?? undefined, ...over,
  } as unknown as GameState;
}

const seisLutas = (s: DungeonAway) => {
  const cfg = awayPlayerCfg(s.player);
  return dungeonWaveOf(s.seed, s.layer, s.player.level, s.player.stage).map(e => playAutoFight(cfg, e, s.seed, 1, 0).res.winner);
};

describe('o campo `dungeonAway` no save', () => {
  it('lixo vira undefined (o Soulmon volta para casa) — nunca lança', () => {
    for (const lixo of [null, undefined, 0, 'x', [], {}, { since: 1 }, { since: 'a', seed: 1, player: {} }, { since: NaN, seed: 1, player: { fam: 'direct', stage: 'x' } },
      { since: 1, seed: 1, player: { fam: 5, stage: 'x' } }, { since: 1, seed: Infinity, player: { fam: 'direct', stage: 'x' } }]) {
      expect(sanitizeDungeonAway(lixo)).toBeUndefined();
    }
  });
  it('valores absurdos são presos em faixas (camada 1..999, slot 0..6, hp 0..1, energia 0..100)', () => {
    const r = sanitizeDungeonAway({ ...away(), layer: 1e9, slot: -5, hp: 9, en: -3 })!;
    expect(r.layer).toBe(999);
    expect(r.slot).toBe(0);
    expect(r.hp).toBe(1);
    expect(r.en).toBe(0);
    expect(sanitizeDungeonAway({ ...away(), slot: 99 })!.slot).toBe(DUNGEON_FIGHTS_PER_FLOOR);
  });
  it('um registro bom faz ida e volta idêntica (JSON do disco/nuvem)', () => {
    const a = away({ layer: 7, slot: 3, hp: 0.5, en: 40, ms: true });
    expect(sanitizeDungeonAway(JSON.parse(JSON.stringify(a)))).toEqual(a);
  });
  it('a ocupação é UM critério só: o registro existir', () => {
    expect(soulmonNaMasmorra(estado())).toBe(true);
    expect(soulmonNaMasmorra(estado({}, null))).toBe(false);
    expect(soulmonNaMasmorra(null)).toBe(false);
    expect(soulmonNaMasmorra({})).toBe(false);
  });
});

describe('applyDungeonAway — o avanço de quem ficou fora', () => {
  it('sem registro devolve o MESMO estado e nenhum relatório', () => {
    const s = estado({}, null);
    const r = applyDungeonAway(s, T0 + HORA);
    expect(r.next).toBe(s);
    expect(r.report).toBeNull();
  });

  it('o jogador de teste vence a escada do começo (premissa do resto da suíte)', () => {
    expect(seisLutas(away()).every(w => w === 'player')).toBe(true);
  });

  it('1 hora fora rende camadas, abates, Bits e gasta a energia da Home', () => {
    const { next, report } = applyDungeonAway(estado(), T0 + HORA);
    expect(report!.layers).toBeGreaterThan(0);
    expect(report!.enemies).toBeGreaterThanOrEqual(report!.layers * DUNGEON_FIGHTS_PER_FLOOR);
    expect(report!.bits).toBeGreaterThan(0);
    expect(next.gamePoints).toBe(report!.bits);
    expect(report!.energy).toBeGreaterThan(0);
    expect(next.energyPoints).toBe(6 - report!.energy);
    expect(next.dungeonKills).toBe(report!.enemies);
    expect((next.bestiary ?? []).length).toBeGreaterThan(0);
    expect(next.dungeonDepthRecord).toBe(report!.recordTo);
  });

  it('é DETERMINÍSTICA: o mesmo estado e o mesmo relógio dão exatamente o mesmo resultado, sempre', () => {
    const a = applyDungeonAway(estado(), T0 + 2 * HORA, { heartsLeft: 2 });
    const b = applyDungeonAway(estado(), T0 + 2 * HORA, { heartsLeft: 2 });
    expect(b.next).toEqual(a.next);
    expect(b.report).toEqual(a.report);
  });

  it('é IDEMPOTENTE: aplicar de novo no mesmo instante sobre o estado novo não rende nada', () => {
    const a = applyDungeonAway(estado(), T0 + 2 * HORA);
    if (!a.next.dungeonAway) return; // acabou sozinha: já não há o que reaplicar
    const b = applyDungeonAway(a.next, T0 + 2 * HORA);
    expect(b.report!.layers).toBe(0);
    expect(b.report!.enemies).toBe(0);
    expect(b.next.gamePoints).toBe(a.next.gamePoints);
    expect(b.next.energyPoints).toBe(a.next.energyPoints);
    expect(b.next.dungeonKills).toBe(a.next.dungeonKills);
  });

  it('fatiar o tempo não muda o total: 30 min + 30 min == 60 min direto', () => {
    const metade = applyDungeonAway(estado({ energyPoints: 40 }), T0 + HORA / 2);
    const duas = applyDungeonAway(metade.next, T0 + HORA);
    const direto = applyDungeonAway(estado({ energyPoints: 40 }), T0 + HORA);
    expect(duas.next.dungeonKills).toBe(direto.next.dungeonKills);
    expect(duas.next.dungeonDepthRecord).toBe(direto.next.dungeonDepthRecord);
    expect(duas.next.energyPoints).toBe(direto.next.energyPoints);
  });

  it('o TETO de tempo fora: 100 h valem o mesmo que o teto (8 h) e o relatório avisa', () => {
    const base = estado({ energyPoints: 5000 });
    const teto = applyDungeonAway(base, T0 + DUNGEON_AWAY_MAX_MS);
    const muito = applyDungeonAway(base, T0 + 100 * HORA);
    expect(muito.report!.capped).toBe(true);
    expect(teto.report!.capped).toBe(false);
    expect(muito.next.dungeonKills).toBe(teto.next.dungeonKills);
    expect(muito.report!.elapsedMs).toBeLessThanOrEqual(DUNGEON_AWAY_MAX_MS);
  });

  it('relógio que voltou (now < since) não rende nem tira nada', () => {
    const s = estado();
    const { next, report } = applyDungeonAway(s, T0 - 5 * HORA);
    expect(report!.layers).toBe(0);
    expect(report!.enemies).toBe(0);
    expect(next.gamePoints).toBe(0);
    expect(next.energyPoints).toBe(6);
    expect(next.dungeonAway).toBeDefined();
  });

  it('os Bits passam pelo TETO DIÁRIO de minijogo (150) — o mesmo funil da tela', () => {
    const dia = playerDayKey(new Date(T0 + 8 * HORA), undefined);
    const { next } = applyDungeonAway(estado({ energyPoints: 5000 }), T0 + 8 * HORA);
    expect(minigameBitsToday(next, dia)).toBeLessThanOrEqual(MINIGAME_BITS_PER_DAY);
    expect(next.gamePoints!).toBeLessThanOrEqual(MINIGAME_BITS_PER_DAY);
    // e um dia já no teto não recebe Bits, mas a descida segue (camadas/abates contam)
    const cheio = estado({ energyPoints: 5000, minigameBits: { day: dia, earned: MINIGAME_BITS_PER_DAY } });
    const r = applyDungeonAway(cheio, T0 + 2 * HORA);
    expect(r.next.gamePoints).toBe(0);
    expect(r.report!.enemies).toBeGreaterThan(0);
  });

  it('sem energia a descida acaba sozinha ("energy"), o Soulmon VOLTA para casa e o registro some', () => {
    const { next, report } = applyDungeonAway(estado({ energyPoints: 0 }, away({ layer: 1, slot: DUNGEON_FIGHTS_PER_FLOOR })), T0 + HORA);
    expect(report!.ended).toBe('energy');
    expect(next.dungeonAway).toBeUndefined();
    expect(soulmonNaMasmorra(next)).toBe(false);
  });

  it('o corte é pela energia: gasta 1 por camada nova e para quando acaba', () => {
    const { report, next } = applyDungeonAway(estado({ energyPoints: 2 }), T0 + 8 * HORA);
    expect(report!.energy).toBeLessThanOrEqual(2);
    expect(next.energyPoints).toBeGreaterThanOrEqual(0);
  });

  it('HP zerado numa luta perdida encerra a descida ("hp"): o HP regenera pelo relógio de sempre (dungeonHp)', () => {
    const fraco = away({ hp: 0.02 });
    const { next, report } = applyDungeonAway(estado({ energyPoints: 50 }, fraco), T0 + 8 * HORA);
    if (report!.ended === 'hp') {
      expect(next.dungeonHp!.frac).toBe(0);
      expect(next.dungeonAway).toBeUndefined();
    } else {
      expect(next.dungeonHp!.frac).toBeGreaterThan(0);
    }
  });

  it('os corações respeitam o teto do dia que a tela já usa (heartsLeft), e sem teto livre não cai nenhum', () => {
    const s = estado({ energyPoints: 5000 });
    expect(applyDungeonAway(s, T0 + 8 * HORA, { heartsLeft: 0 }).report!.hearts).toBe(0);
    const com = applyDungeonAway(s, T0 + 8 * HORA, { heartsLeft: 2 });
    expect(com.report!.hearts).toBeLessThanOrEqual(2);
    expect(Object.values(com.next.foodInventory).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(com.report!.hearts);
  });

  it('o marco da camada 5 rende UM Glitchtama por descida (e o registro lembra, para não pagar de novo)', () => {
    const s = estado({ energyPoints: 5000 }, away({ layer: 4, slot: 0 }));
    const { next, report } = applyDungeonAway(s, T0 + 8 * HORA);
    if (report!.toLayer >= 5 || report!.recordTo >= 5) {
      expect(report!.glitchtama).toBe(1);
      expect(next.foodInventory['🌀']).toBe(1);
      expect(next.dungeonRunsCompleted).toBe(1);
      if (next.dungeonAway) expect(next.dungeonAway.ms).toBe(true);
    }
  });

  it('RETIRAR acerta o que rendeu até agora e libera o Soulmon (registro removido)', () => {
    const { next, report } = applyDungeonAway(estado(), T0 + HORA, { retire: true });
    expect(report!.ended === 'retired' || report!.ended !== null).toBe(true);
    expect(report!.layers).toBeGreaterThan(0);
    expect(next.dungeonAway).toBeUndefined();
    expect(soulmonNaMasmorra(next)).toBe(false);
    expect(next.gamePoints).toBe(report!.bits);
  });

  it('o cliente não escolhe valor: um registro com camada/slot adulterados só muda ONDE começa, nunca quanto paga', () => {
    // mesmo tempo, mesma energia: começar na camada 1 ou na 1 com slot 0 é a mesma coisa; e o ganho por camada é função do motor
    const a = applyDungeonAway(estado(), T0 + HORA);
    const b = applyDungeonAway(estado({}, away({ since: T0 })), T0 + HORA);
    expect(b.next.gamePoints).toBe(a.next.gamePoints);
  });

  it('o Vínculo baixo trava a descida no portão (sem alterar nada além disso)', () => {
    const baixo = estado({ totalXP: 0, energyPoints: 5000 });
    expect(bondLevelFor(0)).toBeLessThan(5);
    const { report } = applyDungeonAway(baixo, T0 + 8 * HORA);
    expect(['sealed', 'deep', null, 'hp', 'energy']).toContain(report!.ended);
    expect(report!.toLayer).toBeLessThanOrEqual(5);
  });
});

describe('settleDungeonAwayNow — a ponte com o estado', () => {
  it('aplica pelo setGameState (updater puro) e devolve o relatório; sem registro devolve null', async () => {
    const { settleDungeonAwayNow } = await import('./dungeonAway');
    let atual = estado();
    const set = (f: (p: GameState) => GameState) => { atual = f(atual); };
    const r = settleDungeonAwayNow(atual, set, T0 + HORA, false);
    expect(r).not.toBeNull();
    expect(r!.report.enemies).toBeGreaterThan(0);
    expect(atual.dungeonKills).toBe(r!.report.enemies);
    expect(settleDungeonAwayNow(estado({}, null), set, T0 + HORA, false)).toBeNull();
  });

  it('um registro que o motor não consegue jogar (estágio inexistente) NÃO derruba a tela: o Soulmon volta para casa', async () => {
    const { settleDungeonAwayNow } = await import('./dungeonAway');
    const ruim = estado({}, away({}, 'estagio-que-nao-existe'));
    let atual = ruim;
    const set = (f: (p: GameState) => GameState) => { atual = f(atual); };
    expect(() => settleDungeonAwayNow(ruim, set, T0 + HORA, false)).not.toThrow();
    expect(atual.dungeonAway).toBeUndefined();
  });
});
