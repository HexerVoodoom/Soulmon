/**
 * §196 (dono, 30/10/2026, recorrente): "soltei meu especial primeiro; na rodada seguinte o inimigo soltou um ESCUDO e o
 * escudo dele bloqueou o dano do meu especial". O conserto de 29/10 (063a6923) passava a cada tick um TETO = escudo do
 * alvo no cast, mas o teto não era CONSUMIDO: com sobra de escudo antigo (o inimigo de escudo reconjura) cada tick podia
 * comer até o teto inteiro do escudo NOVO; e no grupo, quando o alvo do DoT único caía, os ticks passavam ao próximo
 * inimigo sem teto nenhum (Infinity), e o escudo que ele levantou depois do cast comia tudo.
 * Regra: o total que os ticks de UM cast podem perder para escudo é o escudo que o alvo tinha NO CAST.
 */
import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './level';
import { groupFightSteps, type GroupEvent } from './group';
import { specialOf } from './specials';

const side = (family: 'dot' | 'shield', lvl = 10) => ({ combatant: combatantAt(lvl, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[0]]), special: specialOf(family) });

/** Para cada cast de DoT do jogador: escudo de cada inimigo no cast × escudo que os ticks DESSE cast comeram dele. */
function violations(nFoes: number, seeds: number, startShield = 0, area: 'single' | 'area' = 'single'): { bad: number; checked: number } {
  let bad = 0, checked = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const g = groupFightSteps({ ...side('dot'), area }, Array.from({ length: nFoes }, () => ({ ...side('shield'), startShield })), { seed, variance: null, hpScale: 30, startEnergy: 100, withFx: true });
    const evs: GroupEvent[] = [];
    let r = g.next();
    while (!r.done && evs.length < 3000) { evs.push(r.value); r = g.next(1); }
    const casts = evs.flatMap((e, i) => (e.kind === 'cast' && e.who === 0 ? [i] : []));
    casts.forEach((ci, k) => {
      const end = casts[k + 1] ?? evs.length; // só ticks deste cast (antes do próximo cast do jogador)
      const atCast = evs[ci].fx!.map((f) => f.shield);
      const ate = atCast.map(() => 0);
      let sawFoeShieldAfter = false;
      for (let i = ci + 1; i < end; i++) {
        const e = evs[i];
        if (e.kind === 'cast' && e.who > 0) sawFoeShieldAfter = true;
        if (e.kind !== 'tick' || e.who !== 0) continue;
        const prev = evs[i - 1].fx!, now = e.fx!;
        for (let f = 1; f <= nFoes; f++) ate[f] += Math.max(0, prev[f].shield - now[f].shield);
      }
      if (!sawFoeShieldAfter) return;
      checked++;
      for (let f = 1; f <= nFoes; f++) if (ate[f] > atCast[f] + 1e-9) bad++;
    });
  }
  return { bad, checked };
}

describe('§196 escudo levantado DEPOIS do cast não come o DoT', () => {
  it('1 inimigo: os ticks perdem no máximo o escudo que ele tinha no cast', () => {
    const v = violations(1, 120);
    expect(v.checked).toBeGreaterThan(0);
    expect(v.bad).toBe(0);
  });
  it('2 e 3 inimigos (Arena): idem, inclusive quando o alvo cai e os ticks passam ao próximo', () => {
    for (const n of [2, 3]) {
      const v = violations(n, 120);
      expect(v.checked).toBeGreaterThan(0);
      expect(v.bad).toBe(0);
    }
  });
  it('com sobra de escudo antigo no cast (o escudo novo não soma ao teto de cada tick)', () => {
    for (const n of [1, 2, 3]) for (const area of ['single', 'area'] as const) {
      const v = violations(n, 120, 0.04, area);
      expect(v.checked).toBeGreaterThan(0);
      expect(v.bad, `N=${n} ${area}`).toBe(0);
    }
  });
});
