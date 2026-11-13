/**
 * §334 (dono, 13/11/2026): "efeito ao longo do tempo, de dano ou de cura, acontece no turno do AFETADO. Se o Soulmon está
 * envenenado, TODA VEZ QUE ELE ATACA ele toma o dano do veneno, até o efeito acabar."
 *
 * Regra do núcleo (`fight.ts`, `group.ts` e o espelho `functions/api/_combate.js`):
 *  · o DoT fica em quem o carrega e tica no COMEÇO de cada golpe básico dele, antes de o golpe sair;
 *  · a cura contínua (HoT) pulsa do mesmo jeito, no começo de cada golpe de quem a recebe;
 *  · a duração conta os golpes do afetado: 3 ticks = os 3 próximos golpes dele;
 *  · quem cai no tick não golpeia naquele turno; o escudo absorve metade de cada tick (§327).
 */
import { describe, expect, it } from 'vitest';
import * as srv from '../../../functions/api/_combate.js';
import { DOT_TICKS, fightSteps, hpPoints, type FightEvent, type FightFxPair, type FightOptions, type FightSide } from './fight';
import { groupFightSteps, type GroupEvent } from './group';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { SHIELD_DOT_TICK_ABSORB, specialOf, specialOfPve, type SpecialFamily } from './specials';

const C = combatantAt(20, REFERENCE_BUILDS.balanced);
const side = (family: SpecialFamily | null, hpMul = 1): FightSide => ({ combatant: { ...C, hp: C.hp * hpMul }, special: family ? specialOf(family) : null });

function play(a: FightSide, b: FightSide, opts: FightOptions): { events: FightEvent[]; fx: FightFxPair[] } {
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { ...opts, fxTrace: fx });
  const events: FightEvent[] = [];
  let r = g.next();
  while (!r.done) { events.push(r.value); r = g.next(1); }
  return { events, fx };
}

/** O índice do golpe/ko que fecha o turno aberto pelo tick `i` (pula os outros ticks do mesmo instante). */
function turnoDoTick(events: readonly FightEvent[], i: number): FightEvent | undefined {
  for (let j = i + 1; j < events.length && Math.abs(events[j].t - events[i].t) < 1e-9; j++) if (events[j].kind !== 'tick') return events[j];
  return undefined;
}

describe('§334 1v1: o DoT tica no turno de quem o carrega', () => {
  // A (0) solta DoT logo de cara; B (1) só golpeia. HP grande para ninguém cair no meio da medição.
  const { events, fx } = play(side('dot'), side(null), { seed: 11, hpScale: 20, variance: null, startEnergy: [100, 0], stopAtFirstKo: true });
  const cast = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
  // só os ticks deste cast: até o próximo especial de A (a energia volta e ele lança de novo)
  const prox = events.findIndex((e, i) => i > cast && e.kind === 'cast' && e.side === 0);
  const fim = prox < 0 ? events.length : prox;
  const ticks = events.flatMap((e, i) => (e.kind === 'tick' && i > cast && i < fim ? [i] : []));
  const ataquesB = events.flatMap((e, i) => (e.kind === 'attack' && e.side === 1 && i > cast ? [i] : []));

  it('o cast deixa 3 ticks em quem recebe, e nenhum tick sai no instante do cast', () => {
    expect(fx[cast][1].dot).toBe(DOT_TICKS);
    expect(ticks.every((i) => events[i].t > events[cast].t)).toBe(true);
  });

  it('cada tick abre um golpe do envenenado, no MESMO instante, e sai antes dele', () => {
    expect(ticks.length).toBeGreaterThanOrEqual(DOT_TICKS);
    for (const i of ticks.slice(0, DOT_TICKS)) {
      const g = turnoDoTick(events, i);
      expect(g?.kind).toBe('attack');
      expect(g?.side).toBe(1);
      expect(events[i].side).toBe(0); // o evento do tick é de quem lançou (o número cai no alvo)
    }
  });

  it('os 3 primeiros golpes do envenenado levam 1 tick cada, e depois acabou', () => {
    const tAtaques = ataquesB.map((i) => events[i].t);
    const tTicks = ticks.map((i) => events[i].t);
    expect(tTicks).toEqual(tAtaques.slice(0, DOT_TICKS)); // exatamente 3, nos 3 próximos golpes dele
    expect(fx[ticks[0]][1].dot).toBe(2);
    expect(fx[ticks[1]][1].dot).toBe(1);
    expect(fx[ticks[2]][1].dot).toBe(0);
  });

  it('NÃO tica nos turnos do lançador (os golpes de A não trazem tick)', () => {
    const tA = new Set(events.filter((e, i) => i > cast && e.kind === 'attack' && e.side === 0).map((e) => e.t));
    const tB = new Set(ataquesB.map((i) => events[i].t));
    for (const i of ticks) expect(tB.has(events[i].t) || !tA.has(events[i].t)).toBe(true);
    for (const i of ticks) expect(tB.has(events[i].t)).toBe(true);
  });
});

describe('§334: quem cai no tick não golpeia, e a luta acaba certo', () => {
  it('B com 1 ponto de vida: o tick o derruba no começo do turno dele, sem golpe', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { events } = play(side('dot'), side(null), { seed, variance: null, startEnergy: [100, 0], startHp: [1, 0.01], stopAtFirstKo: true });
      const i = events.findIndex((e) => e.kind === 'tick');
      if (i < 0) continue; // A derrubou B no golpe antes do 1º turno dele
      const depois = events.slice(i + 1).filter((e) => Math.abs(e.t - events[i].t) < 1e-9);
      expect(depois.some((e) => e.kind === 'attack' && e.side === 1)).toBe(false);
      expect(depois.some((e) => e.kind === 'ko' && e.side === 1)).toBe(true);
      expect(events[events.length - 1].kind).toBe('ko');
    }
  });
});

describe('§334: dois DoTs no mesmo lutador', () => {
  it('dois casts antes do turno do alvo: o golpe seguinte dele leva 2 ticks', () => {
    let achou = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { events, fx } = play(side('dot'), side(null), { seed, hpScale: 20, variance: null, startEnergy: [200, 0], stopAtFirstKo: true });
      const casts = events.flatMap((e, i) => (e.kind === 'cast' && e.side === 0 ? [i] : []));
      if (casts.length < 2) continue;
      const primeiroTick = events.findIndex((e) => e.kind === 'tick');
      if (primeiroTick < casts[1]) continue; // o alvo agiu entre os dois casts
      achou++;
      const t = events[primeiroTick].t;
      expect(events.filter((e) => e.kind === 'tick' && Math.abs(e.t - t) < 1e-9)).toHaveLength(2);
      expect(fx[casts[1]][1].dot).toBe(2 * DOT_TICKS);
    }
    expect(achou).toBeGreaterThan(0);
  });
});

describe('§334 + §327: o escudo absorve metade de cada tick', () => {
  it('o tick num lutador de escudo: o escudo come floor(d·0,5) e o resto vai para a vida', () => {
    let vistos = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { events, fx } = play(side('dot'), side('shield'), { seed, hpScale: 20, variance: null, startEnergy: [100, 100], stopAtFirstKo: true });
      const pts = hpPoints(C.hp * 20);
      events.forEach((e, i) => {
        if (e.kind !== 'tick' || i === 0) return;
        const sh0 = Math.round(fx[i - 1][1].shield * pts);
        const sh1 = Math.round(fx[i][1].shield * pts);
        if (sh0 <= 0) return;
        const comeu = sh0 - sh1;
        const perdeu = Math.round(e.frac * pts);
        const d = comeu + perdeu;
        expect(comeu).toBe(Math.min(sh0, Math.floor(d * SHIELD_DOT_TICK_ABSORB + 1e-9)));
        expect(perdeu).toBeGreaterThan(0);
        vistos++;
      });
    }
    expect(vistos).toBeGreaterThan(0);
  });
});

describe('§334 grupo: DoT e cura contínua no turno do afetado', () => {
  const run = (player: FightSide, foe: FightSide, startEnergy = 100) => {
    const g = groupFightSteps(player, [foe], { seed: 4, hpScale: 20, variance: null, startEnergy, startHp: 0.5, withFx: true });
    const evs: GroupEvent[] = [];
    let r = g.next();
    while (!r.done && evs.length < 4000) { evs.push(r.value); r = g.next(r.value.kind === 'cast' ? 1 : undefined); }
    return evs;
  };

  it('o DoT do jogador tica nos golpes do inimigo (3), nunca nos do jogador', () => {
    const evs = run(side('dot'), side(null));
    const cast = evs.findIndex((e) => e.kind === 'cast' && e.who === 0);
    const tTicks = evs.filter((e, i) => i > cast && e.kind === 'tick' && e.who === 0).map((e) => e.t);
    const tFoe = evs.filter((e, i) => i > cast && e.kind === 'attack' && e.who === 1).map((e) => e.t);
    expect(tTicks.slice(0, DOT_TICKS)).toEqual(tFoe.slice(0, DOT_TICKS));
  });

  it('o DoT do inimigo tica nos golpes do jogador', () => {
    const g = groupFightSteps(side(null), [side('dot')], { seed: 6, hpScale: 20, variance: null, withFx: true });
    const evs: GroupEvent[] = [];
    let r = g.next();
    while (!r.done && evs.length < 4000) { evs.push(r.value); r = g.next(r.value.kind === 'cast' ? 1 : undefined); }
    const cast = evs.findIndex((e) => e.kind === 'cast' && e.who === 1);
    expect(cast).toBeGreaterThanOrEqual(0);
    const tTicks = evs.filter((e, i) => i > cast && e.kind === 'tick' && e.who === 1).map((e) => e.t);
    const tPl = evs.filter((e, i) => i > cast && e.kind === 'attack' && e.who === 0).map((e) => e.t);
    expect(tTicks.slice(0, DOT_TICKS)).toEqual(tPl.slice(0, DOT_TICKS));
  });

  it('a cura contínua pulsa no começo dos 3 próximos golpes de quem a recebe, e acaba', () => {
    const hot = { combatant: C, special: { ...specialOfPve('shield'), effect: 'hot' as const } };
    const evs = run(hot, side(null));
    const cast = evs.findIndex((e) => e.kind === 'cast' && e.who === 0);
    expect(evs[cast].fx?.[0].hot).toBe(DOT_TICKS);
    const meus = evs.flatMap((e, i) => (i > cast && e.kind === 'attack' && e.who === 0 ? [i] : []));
    // no golpe k (1..3) o contador já gastou k pulsos, e a vida subiu em relação ao evento anterior (o pulso veio antes do golpe)
    meus.slice(0, DOT_TICKS).forEach((i, k) => {
      expect(evs[i].fx?.[0].hot ?? 0).toBe(DOT_TICKS - (k + 1));
      expect(evs[i].hp).toBeGreaterThan(evs[i - 1].hp);
    });
    // nos golpes do inimigo a vida do jogador só desce (a cura não vem no turno dele)
    evs.forEach((e, i) => { if (i > cast && e.kind === 'attack' && e.who === 1) expect(e.hp).toBeLessThanOrEqual(evs[i - 1].hp); });
    // depois do 3º golpe, nenhum pulso
    if (meus.length > DOT_TICKS) expect(evs[meus[DOT_TICKS]].fx?.[0].hot ?? 0).toBe(0);
  });
});

describe('§334 paridade: servidor (`_combate.js`) = cliente (`fight.ts`) com DoT', () => {
  it('mesmo log de eventos em lutas de DoT, inclusive com morte no tick', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const [ha, hb] of [[1, 1], [1, 0.02], [0.02, 1]] as const) {
        const a = side('dot'), b = side(seed % 2 ? 'dot' : 'shield');
        const o = { seed, startEnergy: [100, 100] as [number, number], startHp: [ha, hb] as [number, number], hpScale: 1.7 };
        const app = play(a, b, o).events;
        const g = srv.fightSteps(a, b, o);
        const s: FightEvent[] = [];
        let r = g.next();
        while (!r.done) { s.push(r.value); r = g.next(1); }
        expect(s).toEqual(app);
      }
    }
  });
  it('a constante da duração é a mesma nos dois lados', () => {
    expect(srv.DOT_TICKS).toBe(DOT_TICKS);
  });
});
