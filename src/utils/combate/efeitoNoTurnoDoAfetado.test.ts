/**
 * §334 (dono, 13/11/2026): "efeito ao longo do tempo, de dano ou de cura, acontece no turno do AFETADO. Se o Soulmon está
 * envenenado, TODA VEZ QUE ELE ATACA ele toma o dano do veneno, até o efeito acabar."
 *
 * Regra do núcleo (`fight.ts`, `group.ts` e o espelho `functions/api/_combate.js`):
 *  · o DoT fica em quem o carrega e tica no COMEÇO de cada golpe básico dele, antes de o golpe sair;
 *  · a cura contínua (HoT) pulsa do mesmo jeito, no começo de cada golpe de quem a recebe;
 *  · a duração conta os golpes do afetado: 3 ticks = os 3 próximos golpes dele;
 *  · quem cai no tick não golpeia naquele turno; o escudo absorve metade de cada tick (§327).
 *  · (dono, 13/11/2026: "Sim, o especial também") lançar o especial também é turno: o tick sai no começo da ação, antes do
 *    `cast`, na mesma ordem (DoT, depois cura contínua); quem cai no tick não lança.
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

/**
 * §334 (dono, 13/11/2026: "Sim, o especial também"): lançar o especial também é turno do afetado. O tick sai no começo da ação,
 * no mesmo instante e ANTES do `cast`; DoT primeiro, depois a cura contínua; quem cai no tick não lança.
 */
describe('§334: o especial do afetado também é turno', () => {
  /**
   * As ações de `lado` depois do índice `de`: golpe básico OU especial. O dano do especial direto também sai como `attack`, logo
   * depois do `cast` do mesmo lado e instante (o golpe básico do mesmo instante vem ANTES do cast): esse não é ação nova.
   */
  const doEspecial = <E extends { kind: string; t: number }>(events: readonly E[], i: number, mesmo: (e: E) => boolean) =>
    events.slice(0, i).some((e) => e.kind === 'cast' && mesmo(e) && Math.abs(e.t - events[i].t) < 1e-9);
  const acoes = (events: readonly FightEvent[], lado: 0 | 1, de: number) =>
    events.flatMap((e, i) => (i > de && e.side === lado && (e.kind === 'cast' || (e.kind === 'attack' && !doEspecial(events, i, (x) => x.side === lado))) ? [i] : []));

  it('1v1: os 3 ticks saem nas 3 próximas AÇÕES do envenenado, e o especial dele é uma delas', () => {
    let comCast = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { events, fx } = play(side('dot'), side('direct'), { seed, hpScale: 20, variance: null, startEnergy: [100, 99], stopAtFirstKo: true });
      const cast = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
      const prox = events.findIndex((e, i) => i > cast && e.kind === 'cast' && e.side === 0);
      const ticks = events.flatMap((e, i) => (e.kind === 'tick' && i > cast && (prox < 0 || i < prox) ? [i] : []));
      const deB = acoes(events, 1, cast).slice(0, DOT_TICKS);
      expect(ticks.map((i) => events[i].t)).toEqual(deB.map((i) => events[i].t));
      for (const i of ticks) {
        const g = turnoDoTick(events, i);
        expect(g?.side).toBe(1);
        expect(['attack', 'cast']).toContain(g?.kind);
      }
      const castB = deB.find((i) => events[i].kind === 'cast');
      if (castB === undefined) continue;
      comCast++;
      // o tick vem logo antes do especial, no mesmo instante, e o contador do selo já mostra o que falta
      expect(events[castB - 1].kind).toBe('tick');
      expect(events[castB - 1].t).toBe(events[castB].t);
      expect(fx[castB - 1][1].dot).toBeLessThan(DOT_TICKS);
    }
    expect(comCast).toBeGreaterThan(0);
  });

  it('1v1: quem cai no tick do começo do especial não lança (sem cast, ko no mesmo instante)', () => {
    let vistos = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { events } = play(side('dot'), side('direct'), { seed, variance: null, startEnergy: [100, 99.9], startHp: [1, 0.01], stopAtFirstKo: true });
      const i = events.findIndex((e) => e.kind === 'tick');
      if (i < 0) continue;
      const mesmo = events.filter((e, j) => j > i && Math.abs(e.t - events[i].t) < 1e-9);
      expect(mesmo.some((e) => e.side === 1 && (e.kind === 'attack' || e.kind === 'cast'))).toBe(false);
      expect(mesmo.some((e) => e.kind === 'ko' && e.side === 1)).toBe(true);
      if (!events.some((e) => e.kind === 'cast' && e.side === 1)) vistos++;
    }
    expect(vistos).toBeGreaterThan(0);
  });

  it('grupo: a cura contínua pulsa no começo do especial de quem a recebe (antes do cast)', () => {
    const hot = { combatant: C, special: { ...specialOfPve('shield'), effect: 'hot' as const } };
    let k = 0;
    // o 1º cast liga a cura; uma torcida de 108 de energia logo depois força um 2º cast com os pulsos ainda pendentes
    const g = groupFightSteps(hot, [side(null)], { seed: 4, hpScale: 20, variance: null, startEnergy: 100, startHp: 0.5, withFx: true, cheerDrain: () => (++k === 3 ? 12 : 0) });
    const evs: GroupEvent[] = [];
    let r = g.next();
    while (!r.done && evs.length < 4000) { evs.push(r.value); r = g.next(r.value.kind === 'cast' ? 1 : undefined); }
    const casts = evs.flatMap((e, i) => (e.kind === 'cast' && e.who === 0 ? [i] : []));
    expect(casts.length).toBeGreaterThanOrEqual(2);
    const [c1, c2] = casts;
    const golpesEntre = evs.filter((e, i) => i > c1 && i < c2 && e.kind === 'attack' && e.who === 0).length;
    expect(golpesEntre).toBeLessThan(DOT_TICKS);
    // a vida sobe no evento do cast (o pulso saiu antes de o especial sair) e o contador gastou 1 pulso nele
    expect(evs[c2].hp).toBeGreaterThan(evs[c2 - 1].hp);
    expect(evs[c2].fx?.[0].hot).toBe(DOT_TICKS - golpesEntre - 1 + DOT_TICKS);
  });

  it('grupo: o DoT do inimigo tica no especial do jogador, antes do cast dele', () => {
    let vistos = 0;
    for (let seed = 1; seed <= 20; seed++) {
      // o jogador ganha 108 de energia (torcida) logo depois de o inimigo soltar o veneno: o especial dele cai nos 3 turnos do DoT
      let armar = false;
      const g = groupFightSteps(side('direct'), [side('dot')], {
        seed, hpScale: 20, variance: null, withFx: true, cheerDrain: () => (armar ? ((armar = false), 12) : 0),
      });
      const evs: GroupEvent[] = [];
      let r = g.next();
      let c1 = -1;
      while (!r.done && evs.length < 4000) {
        evs.push(r.value);
        if (c1 < 0 && r.value.kind === 'cast' && r.value.who === 1) { c1 = evs.length - 1; armar = true; }
        r = g.next(r.value.kind === 'cast' ? 1 : undefined);
      }
      if (c1 < 0) continue;
      const acoesPl = evs.flatMap((e, i) => (i > c1 && e.who === 0 && (e.kind === 'cast' || (e.kind === 'attack' && !doEspecial(evs, i, (x) => x.who === 0))) ? [i] : [])).slice(0, DOT_TICKS);
      const tTicks = evs.filter((e, i) => i > c1 && e.kind === 'tick' && e.who === 1).map((e) => e.t).slice(0, DOT_TICKS);
      expect(tTicks).toEqual(acoesPl.map((i) => evs[i].t));
      for (const i of acoesPl) if (evs[i].kind === 'cast') { expect(evs[i - 1].kind).toBe('tick'); vistos++; }
    }
    expect(vistos).toBeGreaterThan(0);
  });
});

describe('§334 paridade: servidor (`_combate.js`) = cliente (`fight.ts`) com DoT', () => {
  it('mesmo log de eventos em lutas de DoT, inclusive com morte no tick', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const [ha, hb] of [[1, 1], [1, 0.02], [0.02, 1]] as const) {
        const a = side('dot'), b = side((['dot', 'shield', 'direct'] as const)[seed % 3]); // §334: o especial do envenenado também tica
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
