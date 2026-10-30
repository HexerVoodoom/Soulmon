/**
 * VIDA INTEIRA (dono, 30/10/2026 — REGISTRO §192). Invariantes do HP em pontos inteiros:
 * o número do golpe = o HP que saiu da barra; golpe que causa dano tira >= 1 ponto; 0 ponto = derrota NA HORA;
 * cliente e servidor iguais.
 */
import { describe, expect, it } from 'vitest';
import { fightSteps, hpPoints, HP_POINTS_PER_HP, PVP_HP_SCALE } from './fight';
import { groupFightSteps } from './group';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { specialOf, type SpecialFamily } from './specials';
import * as srv from '../../../functions/api/_combate.js';
import { dungeonFoe } from '../dungeonBase';

const FAM: SpecialFamily[] = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'];
const isInt = (x: number) => Math.abs(x - Math.round(x)) < 1e-6;

describe('vida inteira', () => {
  it('a escala é a mesma no cliente e no servidor', () => {
    expect(srv.HP_POINTS_PER_HP).toBe(HP_POINTS_PER_HP);
    for (const h of [0.2, 11, 37.4, 250]) expect(srv.hpPoints(h)).toBe(hpPoints(h));
  });

  it('1v1: cada golpe mostra pontos inteiros (>= 1) e a soma do que foi mostrado = o que a barra perdeu; 0 = KO', () => {
    // (a ordem em que os eventos SAEM não é a ordem em que nasceram — um cast pode sair antes do golpe do outro —, por
    // isso a conferência é pela soma; famílias sem cura/escudo do lado que apanha para a conta fechar)
    let hits = 0;
    for (const L of [1, 7, 21, 40]) for (const f of ['direct', 'dot', 'atkBuff', 'defDebuff', 'spdBuff'] as SpecialFamily[]) for (let s = 0; s < 6; s++) {
      const a = { combatant: combatantAt(L, REFERENCE_BUILDS.atk), special: specialOf(f) };
      const b = { combatant: combatantAt(L, REFERENCE_BUILDS.def), special: specialOf('spdBuff') };
      const pts = [hpPoints(a.combatant.hp * PVP_HP_SCALE), hpPoints(b.combatant.hp * PVP_HP_SCALE)];
      const g = fightSteps(a, b, { seed: s * 31 + L, hpScale: PVP_HP_SCALE });
      const shown = [0, 0];
      let r = g.next();
      for (; !r.done; r = g.next(1)) {
        const e = r.value;
        for (const i of [0, 1]) expect(isInt(e.hp[i] * pts[i])).toBe(true);
        if (e.kind === 'attack' || e.kind === 'tick') {
          const v = 1 - e.side;
          const n = e.frac * pts[v];
          expect(isInt(n)).toBe(true);
          expect(Math.round(n)).toBeGreaterThanOrEqual(1);
          shown[v] += Math.round(n);
          hits++;
        }
        if (e.kind === 'ko') expect(Math.round(e.hp[e.side] * pts[e.side])).toBe(0);
      }
      const res = r.value;
      expect(shown[0]).toBe(pts[0] - Math.round(res.hpA * pts[0]));
      expect(shown[1]).toBe(pts[1] - Math.round(res.hpB * pts[1]));
      // quem chegou a 0 está derrotado (tempo finito), e ninguém derrotado tem HP
      if (res.hpA === 0) expect(res.timeA).toBeLessThan(Infinity);
      if (res.hpB === 0) expect(res.timeB).toBeLessThan(Infinity);
    }
    expect(hits).toBeGreaterThan(1000);
  });

  it('grupo (Masmorra, inimigo fraco): até o golpe mais fraco tira 1 ponto inteiro, e o pet some só em 0', () => {
    for (const L of [1, 5, 30]) for (let s = 0; s < 8; s++) {
      const player = { combatant: combatantAt(L, REFERENCE_BUILDS.balanced), special: specialOf('shield') };
      const foe = dungeonFoe(L, 0, 1);
      const ptsP = hpPoints(player.combatant.hp), ptsF = hpPoints(foe.combatant.hp);
      const g = groupFightSteps(player, [foe], { seed: s + L * 101 });
      let prevP = 1;
      for (let r = g.next(); !r.done; r = g.next(undefined)) {
        const e = r.value;
        expect(isInt(e.hp * ptsP)).toBe(true);
        expect(isInt(e.foesHp[0] * ptsF)).toBe(true);
        if ((e.kind === 'attack' || e.kind === 'tick') && e.who === 1) {
          expect(Math.round(prevP * ptsP) - Math.round(e.hp * ptsP)).toBe(Math.round(e.frac * ptsP));
        }
        if (e.kind === 'ko') expect(e.who === 0 ? e.hp : e.foesHp[0]).toBe(0);
        prevP = e.hp;
      }
    }
  });

  it('paridade: o 1v1 do cliente e o do servidor geram os mesmos eventos (com escudo, cura e largada parcial)', () => {
    for (const f of FAM) for (let s = 0; s < 4; s++) {
      const a = { combatant: combatantAt(12, REFERENCE_BUILDS.spd), special: specialOf(f) };
      const b = { combatant: combatantAt(12, REFERENCE_BUILDS.balanced), special: specialOf('shield') };
      const o = { seed: 900 + s, hpScale: PVP_HP_SCALE, startHp: [0.63, 1] as [number, number], stopAtFirstKo: s % 2 === 0 };
      const run = (gen: Generator<any, any, any>) => { const out: unknown[] = []; let r = gen.next(); while (!r.done) { out.push(r.value); r = gen.next(1); } out.push(r.value); return out; };
      expect(run(srv.fightSteps(a, b, o))).toEqual(run(fightSteps(a, b, o)));
    }
  });
});

