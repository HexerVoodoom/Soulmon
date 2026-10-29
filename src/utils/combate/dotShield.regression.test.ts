/**
 * Regressão (dono, 29/10/2026): "quando solta especial, tem que dar o dano de cara" — um escudo que o inimigo
 * conjura DEPOIS do especial do jogador não pode bloquear o dano desse especial já lançado (só golpes posteriores).
 * O especial direto já resolve no cast; o DoT resolvia em ticks e o escudo novo absorvia os que sobravam.
 */
import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './level';
import { groupFightSteps, type GroupEvent } from './group';
import { specialOf } from './specials';

const mk = (family: 'dot' | 'shield') => ({
  combatant: combatantAt(10, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[0]]),
  special: specialOf(family),
});

describe('DoT lançado antes do escudo inimigo', () => {
  it('o escudo conjurado depois do cast não absorve os ticks do especial', () => {
    let checked = 0;
    for (let seed = 1; seed < 80; seed++) {
      const g = groupFightSteps(mk('dot'), [mk('shield')], { seed, variance: null, hpScale: 40, startEnergy: 100 });
      const evs: GroupEvent[] = [];
      let r = g.next();
      while (!r.done && evs.length < 400) { evs.push(r.value); r = g.next(1); }
      const pc = evs.findIndex((e) => e.kind === 'cast' && e.who === 0);
      const fc = evs.findIndex((e) => e.kind === 'cast' && e.who === 1);
      if (pc < 0 || fc < pc) continue; // só interessa: o jogador lançou e o inimigo levantou o escudo depois
      const ticks = evs.filter((e, i) => i > pc && e.kind === 'tick' && e.who === 0);
      if (ticks.length < 3 || evs.indexOf(ticks[ticks.length - 1]) < fc) continue; // o escudo entra antes do último tick
      for (const tk of ticks) {
        const i = evs.indexOf(tk);
        expect(evs[i - 1].foesHp[0] - tk.foesHp[0]).toBeCloseTo(tk.frac, 6); // o tick entra inteiro, o escudo novo n�o o come
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
