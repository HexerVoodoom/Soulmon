/**
 * PR16 — (1) DURAÇÃO REAL dos selos de status: o núcleo expõe os contadores (nAtk/nVuln/nSpd/escudo/ticks) por lutador em
 * cada evento e a cena os lê, em vez de aproximar os turnos a partir dos eventos; (2) o selo de MALDIÇÃO sobre o debuff da
 * escola `maldicao` (só apresentação). Os "RED" alimentam a aproximação antiga e provam que ela errava.
 */
import { describe, it, expect } from 'vitest';
import { fightSteps, type FightFxPair, type FightSide } from './combate/fight';
import { groupFightSteps, type GroupEvent } from './combate/group';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import { simulatePvp } from './combate/duel';
import { SPECIAL_BUDGET_HITS, specialOf, type SpecialFamily } from './combate/specials';
import {
  castStatus, duelStatusBoard, emptyStatusBoard, isCurseSpecial, stageStatusOf, statusFxOfFamily, statusTurnsFor, tickStatus, withRealFx,
  FAMILY_STATUS, STATUS_FX,
} from './combatFx';

const L = 30;
const side = (family: SpecialFamily, build: 'atk' | 'def' | 'spd' | 'balanced' = 'balanced'): FightSide => ({
  combatant: combatantAt(L, REFERENCE_BUILDS[build]), special: specialOf(family),
});
const ZERO = { nAtk: 0, nVuln: 0, nSpd: 0, shield: 0, shieldHits: 0, dot: 0 };
type Ev = { kind: string; side: 0 | 1 };

/** Joga a luta 1v1 respondendo `scale` a cada cast; devolve eventos + rastro real. */
function play1v1(a: FightSide, b: FightSide, seed: number, scale = 1, trace = true) {
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { seed, hpScale: 1.7, ...(trace ? { fxTrace: fx } : {}) });
  const events: Ev[] = [];
  let r = g.next();
  while (!r.done) { events.push(r.value as unknown as Ev); r = g.next(scale); }
  return { events, fx, result: r.value };
}

describe('núcleo: expor os contadores NÃO muda a luta', () => {
  it('1v1: eventos e resultado idênticos com e sem rastro (7 famílias x 6 sementes x 2 escalas de cast)', () => {
    let n = 0;
    for (const f of ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'] as const) {
      for (let seed = 1; seed <= 6; seed++) {
        for (const scale of [0.5, 1.5]) {
          const com = play1v1(side(f), side('dot', 'atk'), seed, scale, true);
          const sem = play1v1(side(f), side('dot', 'atk'), seed, scale, false);
          expect(JSON.stringify(com.events)).toBe(JSON.stringify(sem.events));
          expect(JSON.stringify(com.result)).toBe(JSON.stringify(sem.result));
          expect(com.fx).toHaveLength(com.events.length); // um par por evento, na mesma ordem
          n++;
        }
      }
    }
    expect(n).toBe(84);
  });

  it('grupo: com `withFx` os eventos são os mesmos, só ganham `fx` (um por lutador)', () => {
    for (const f of ['dot', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'] as const) {
      for (let seed = 1; seed <= 4; seed++) {
        const run = (withFx: boolean) => {
          const g = groupFightSteps({ ...side(f), area: 'area' }, [side('direct'), side('dot', 'atk')], { seed, hpScale: 1.7, withFx });
          const evs: GroupEvent[] = [];
          let r = g.next();
          while (!r.done) { evs.push(r.value); r = g.next(1); }
          return { evs, res: r.value };
        };
        const com = run(true);
        const sem = run(false);
        const semFx = com.evs.map(({ fx, ...resto }) => { expect(fx).toHaveLength(3); return resto; });
        expect(JSON.stringify(semFx)).toBe(JSON.stringify(sem.evs));
        expect(JSON.stringify(com.res)).toBe(JSON.stringify(sem.res));
        expect(sem.evs.every((e) => e.fx === undefined)).toBe(true);
      }
    }
  });
});

describe('duração REAL x aproximação antiga', () => {
  it('o cast reporta o contador DEPOIS do efeito: o buff vale o orçamento x a nota do anel (a aproximação ignorava a nota)', () => {
    const power = specialOf('atkBuff').power;
    for (const scale of [0.5, 1, 1.5]) {
      const { events, fx } = play1v1(side('atkBuff'), side('direct'), 3, scale);
      const i = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
      expect(fx[i][0].nAtk).toBeCloseTo(SPECIAL_BUDGET_HITS * power * scale, 9);
    }
    // RED: a aproximação antiga dava round(3 x power) para qualquer nota — errada em 0,5 e em 1,5
    const aprox = statusTurnsFor('atkBuff', power);
    const real = (s: number) => Math.ceil(SPECIAL_BUDGET_HITS * power * s - 1e-9);
    expect(real(0.5)).not.toBe(aprox);
    expect(real(1.5)).not.toBe(aprox);
  });

  it('o selo do buff gasta EXATAMENTE como o núcleo (golpe a golpe) e some quando o contador zera', () => {
    const { events, fx } = play1v1(side('atkBuff'), side('direct'), 3, 0.5);
    const specials = [specialOf('atkBuff'), specialOf('direct')] as const;
    let viu = 0;
    for (let n = 1; n <= events.length; n++) {
      const buff = duelStatusBoard(events, n, specials, fx)[0].find((e) => e.kind === 'buff');
      const nAtk = fx[n - 1][0].nAtk;
      expect(buff?.turns ?? 0).toBe(nAtk > 1e-9 ? Math.max(1, Math.ceil(nAtk - 1e-9)) : 0);
      if (buff) viu++;
    }
    expect(viu).toBeGreaterThan(0);
    // RED: a dobra aproximada (sem rastro) NÃO bate com o núcleo em algum evento — o que o dono pediu para sair
    let diverge = 0;
    for (let n = 1; n <= events.length; n++) {
      const aprox = duelStatusBoard(events, n, specials)[0].find((e) => e.kind === 'buff')?.turns ?? 0;
      const real = duelStatusBoard(events, n, specials, fx)[0].find((e) => e.kind === 'buff')?.turns ?? 0;
      if (aprox !== real) diverge++;
    }
    expect(diverge).toBeGreaterThan(0);
  });

  it('DoT: os ticks que faltam são os do núcleo (3 -> 0), no alvo, e o selo acompanha', () => {
    const { events, fx } = play1v1(side('dot'), side('direct', 'def'), 5, 1);
    const i = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
    expect(fx[i][1].dot).toBe(3);
    const ticks = events.map((e, k) => (e.kind === 'tick' && e.side === 0 ? k : -1)).filter((k) => k >= 0);
    expect(ticks.length).toBeGreaterThan(0);
    ticks.forEach((k, j) => expect(fx[k][1].dot).toBe(3 - (j + 1)));
    const specials = [specialOf('dot'), specialOf('direct')] as const;
    expect(duelStatusBoard(events, i + 1, specials, fx)[1].find((e) => e.kind === 'dot')?.turns).toBe(3);
  });

  it('escudo: dura enquanto absorve — sai do quadro quando o núcleo zera o escudo', () => {
    const { events, fx } = play1v1(side('shield'), side('direct', 'atk'), 7, 1);
    const i = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
    expect(fx[i][0].shield).toBeGreaterThan(0);
    expect(fx[i][0].shieldHits).toBeGreaterThan(0);
    const specials = [specialOf('shield'), specialOf('direct')] as const;
    for (let n = 1; n <= events.length; n++) {
      const tem = duelStatusBoard(events, n, specials, fx)[0].some((e) => e.kind === 'escudo');
      const ko = events.slice(0, n).some((e) => e.kind === 'ko' && e.side === 0);
      expect(tem).toBe(!ko && fx[n - 1][0].shield > 1e-9);
    }
  });

  it('debuff de defesa: os golpes sofridos que faltam, no alvo', () => {
    const { events, fx } = play1v1(side('defDebuff'), side('direct'), 11, 1);
    const i = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
    expect(fx[i][1].nVuln).toBeGreaterThan(0);
    const specials = [specialOf('defDebuff'), specialOf('direct')] as const;
    const t0 = duelStatusBoard(events, i + 1, specials, fx)[1].find((e) => e.kind === 'debuff');
    expect(t0?.variant).toBe('def');
    expect(t0?.turns).toBe(Math.max(1, Math.ceil(fx[i][1].nVuln - 1e-9)));
  });

  it('sem rastro a aproximação antiga continua valendo; a cura (instantânea, sem contador) fica nela', () => {
    const b = emptyStatusBoard(1);
    expect(withRealFx(b, null)).toBe(b);
    const heal = castStatus(b, { caster: 0, family: 'heal', power: 1, area: false, targets: [1] });
    expect(stageStatusOf(withRealFx(heal, [ZERO, ZERO])[0])).toEqual([{ kind: 'cura', variant: undefined, turns: 1 }]);
    expect(tickStatus(heal, { kind: 'attack', who: 0 })[0]).toHaveLength(0);
  });

  it('o Duelo (simulatePvp) devolve o rastro alinhado aos eventos', () => {
    const me = { combatant: combatantAt(L, REFERENCE_BUILDS.balanced), special: specialOf('spdBuff') };
    const opp = { combatant: combatantAt(L, REFERENCE_BUILDS.atk), special: specialOf('dot') };
    const r = simulatePvp({ me, opp, seed: 9, taps: [] });
    expect(r.fx).toHaveLength(r.events.length);
  });
});

describe('selo de MALDIÇÃO (só apresentação)', () => {
  it('a escola maldicao + família defDebuff mostra MALDIÇÃO; qualquer outra combinação segue como estava', () => {
    expect(isCurseSpecial('defDebuff', 'maldicao')).toBe(true);
    expect(isCurseSpecial('defDebuff', 'benca')).toBe(false);
    expect(isCurseSpecial('defDebuff', null)).toBe(false);
    expect(isCurseSpecial('dot', 'maldicao')).toBe(false); // a escola sozinha não basta: a mecânica é a família
    expect(statusFxOfFamily('defDebuff', 'maldicao')).toMatchObject({ kind: 'maldicao', target: 'foe' });
    expect(statusFxOfFamily('defDebuff')).toMatchObject({ kind: 'debuff', variant: 'def' });
    expect(statusFxOfFamily('dot', 'maldicao')).toMatchObject({ kind: 'dot' });
    // a tabela família -> efeito NÃO muda (mecânica e balanço intocados)
    expect(FAMILY_STATUS.defDebuff).toMatchObject({ kind: 'debuff', variant: 'def', target: 'foe' });
  });

  it('castStatus põe o selo de maldição no alvo (glifo, rótulo e forma próprios) e o debuff comum segue igual', () => {
    const b = castStatus(emptyStatusBoard(2), { caster: 0, family: 'defDebuff', power: 1, area: false, targets: [2], escola: 'maldicao' });
    expect(stageStatusOf(b[2])).toEqual([{ kind: 'maldicao', variant: undefined, turns: 3 }]);
    expect(STATUS_FX.maldicao.label._.pt).toBe('Maldição');
    const c = castStatus(emptyStatusBoard(2), { caster: 0, family: 'defDebuff', power: 1, area: false, targets: [2], escola: 'benca' });
    expect(stageStatusOf(c[2])).toEqual([{ kind: 'debuff', variant: 'def', turns: 3 }]);
  });

  it('Duelo, turnos REAIS: o debuff do especial de maldição vira MALDIÇÃO no oponente; o do outro lado segue debuff', () => {
    const { events, fx } = play1v1(side('defDebuff'), side('defDebuff', 'atk'), 4, 1);
    const iA = events.findIndex((e) => e.kind === 'cast' && e.side === 0);
    const iB = events.findIndex((e) => e.kind === 'cast' && e.side === 1);
    const specials = [{ ...specialOf('defDebuff'), escola: 'maldicao' }, { ...specialOf('defDebuff'), escola: 'combate_fisico' }] as const;
    const board = duelStatusBoard(events, Math.max(iA, iB) + 1, specials, fx);
    expect(board[1].map((e) => e.kind)).toEqual(['maldicao']); // veio do lado 0 (maldição)
    expect(board[0].map((e) => e.kind)).toEqual(['debuff']); // veio do lado 1 (escola comum)
  });
});
