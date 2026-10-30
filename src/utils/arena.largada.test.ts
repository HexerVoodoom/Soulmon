/**
 * §195 (dono, 30/10/2026): "meu personagem demora muito para COMEÇAR a atacar". Medição: com N inimigos cada um tem fase
 * de abertura própria, então o 1º golpe do grupo caía em ~1/(N+1) do intervalo e o do jogador em ~1/2. Com `fairStart`
 * nenhum inimigo abre antes do jogador: em velocidade igual ele nunca começa depois de ninguém.
 */
import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './combate/level';
import { groupFightSteps, type GroupEvent } from './combate/group';
import { specialOf } from './combate/specials';
import { simulateArenaRunV3 } from './arena';

function firstAttacks(level: number, nFoes: number, seed: number, fairStart: boolean) {
  const c = combatantAt(level, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[0]]);
  const side = { combatant: c, special: specialOf('direct') };
  const g = groupFightSteps(side, Array.from({ length: nFoes }, () => side), { seed, fairStart });
  let pl = Infinity, foe = Infinity;
  let r = g.next();
  while (!r.done && (pl === Infinity || foe === Infinity)) {
    const e: GroupEvent = r.value;
    if (e.kind === 'attack') { if (e.who === 0) pl = Math.min(pl, e.t); else foe = Math.min(foe, e.t); }
    r = g.next(1);
  }
  return { pl, foe };
}

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

describe('§195 largada justa na Arena', () => {
  for (const level of [5, 13, 30]) for (const n of [1, 2, 3]) {
    it(`level ${level}, ${n} inimigo(s): o 1º golpe do jogador nunca vem depois do 1º do grupo (velocidade igual)`, () => {
      const before: number[] = [], after: number[] = [], foe: number[] = [];
      let late = 0, together = 0;
      for (let s = 1; s <= 200; s++) {
        const a = firstAttacks(level, n, s, false), b = firstAttacks(level, n, s, true);
        before.push(a.pl); after.push(b.pl); foe.push(b.foe);
        if (b.pl > b.foe + 1e-9) late++;
        if (Math.abs(b.pl - b.foe) < 1e-6 && Math.abs(a.pl - a.foe) >= 1e-6) together++; // empate CRIADO pela largada
      }
      console.log(`[largada] L${level} N${n}: jogador antes=${mean(before).toFixed(2)}s depois=${mean(after).toFixed(2)}s · 1º inimigo=${mean(foe).toFixed(2)}s`);
      expect(late).toBe(0);
      expect(together, 'v223: o 1º golpe do jogador e o do inimigo no mesmo instante (parecia simultâneo)').toBe(0);
    });
  }

  it('balanço: vitória e duração da run quase iguais (antes × depois)', () => {
    const run = (fairStart: boolean) => {
      let w = 0, t = 0; const N = 240;
      for (let s = 0; s < N; s++) {
        const r = simulateArenaRunV3({
          level: [5, 13, 25, 40][s % 4], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
          family: (['direct', 'dot', 'shield', 'heal', 'atkBuff', 'defDebuff', 'spdBuff'] as const)[(s >> 4) % 7],
          area: s % 2 ? 'area' : 'single', fairStart,
        }, s, 'media');
        w += +r.won; t += r.total;
      }
      return { win: w / N, dur: t / N };
    };
    const a = run(false), b = run(true);
    console.log(`[largada] vitória ${(a.win * 100).toFixed(1)}% → ${(b.win * 100).toFixed(1)}% · duração ${a.dur.toFixed(1)}s → ${b.dur.toFixed(1)}s`);
    // §195 emenda: a largada dá ~+10 pp; o botão `ARENA_ROUND_GROWTH.power` devolve a vitória à faixa de antes (~62,5%)
    expect(b.win).toBeGreaterThan(0.58);
    expect(b.win).toBeLessThan(0.67);
    expect(Math.abs(b.dur - a.dur) / a.dur).toBeLessThan(0.05);
  });
});
