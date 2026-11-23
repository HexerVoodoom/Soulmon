/**
 * §196 (dono, 30/10/2026, recorrente): "soltei meu especial primeiro; na rodada seguinte o inimigo soltou um ESCUDO e o
 * escudo dele bloqueou o dano do meu especial". O conserto de 29/10 (063a6923) passava a cada tick um TETO = escudo do
 * alvo no cast, mas o teto não era CONSUMIDO: com sobra de escudo antigo (o inimigo de escudo reconjura) cada tick podia
 * comer até o teto inteiro do escudo NOVO; e no grupo, quando o alvo do DoT único caía, os ticks passavam ao próximo
 * inimigo sem teto nenhum (Infinity), e o escudo que ele levantou depois do cast comia tudo.
 * Regra de 30/10: o total que os ticks de UM cast podem perder para escudo é o escudo que o alvo tinha NO CAST.
 * ⚠️ REVISTA em 13/11/2026 (§327, decisão do dono): o escudo absorve METADE de cada tick de DoT (`SHIELD_DOT_TICK_ABSORB`),
 * inclusive de um DoT lançado ANTES dele. O teto "escudo do cast" saiu; o que este arquivo guarda agora é o espírito do §196:
 * um escudo levantado DEPOIS do cast nunca bloqueia o DoT — cada tick ainda chega à vida com pelo menos metade do dano.
 */
import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './level';
import { groupFightSteps, type GroupEvent } from './group';
import { SHIELD_DOT_TICK_ABSORB, specialOf } from './specials';
import { hpPoints } from './fight';

const side = (family: 'dot' | 'shield', lvl = 10) => ({ combatant: combatantAt(lvl, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[0]]), special: specialOf(family) });

/** Para cada tick de DoT do jogador DEPOIS de um escudo inimigo levantado após o cast: o escudo comeu mais que a metade (bad)? */
function violations(nFoes: number, seeds: number, startShield = 0, area: 'single' | 'area' = 'single', soDepois = true): { bad: number; checked: number } {
  let bad = 0, checked = 0;
  const pts = hpPoints(side('shield').combatant.hp * 30);
  for (let seed = 1; seed <= seeds; seed++) {
    const g = groupFightSteps({ ...side('dot'), area }, Array.from({ length: nFoes }, () => ({ ...side('shield'), startShield })), { seed, variance: null, hpScale: 30, startEnergy: 100, withFx: true });
    const evs: GroupEvent[] = [];
    let r = g.next();
    while (!r.done && evs.length < 3000) { evs.push(r.value); r = g.next(1); }
    const casts = evs.flatMap((e, i) => (e.kind === 'cast' && e.who === 0 ? [i] : []));
    casts.forEach((ci, k) => {
      const end = casts[k + 1] ?? evs.length; // só ticks deste cast (antes do próximo cast do jogador)
      let sawFoeShieldAfter = false;
      for (let i = ci + 1; i < end; i++) {
        const e = evs[i];
        if (e.kind === 'cast' && e.who > 0) sawFoeShieldAfter = true;
        if ((soDepois && !sawFoeShieldAfter) || e.kind !== 'tick' || e.who !== 0) continue;
        const prev = evs[i - 1], now = e;
        for (let f = 1; f <= nFoes; f++) {
          if (prev.fx![f].shield <= 0) continue;
          const comido = Math.round((prev.fx![f].shield - now.fx![f].shield) * pts);
          const vida = Math.round((prev.foesHp[f - 1] - now.foesHp[f - 1]) * pts);
          if (comido + vida === 0) continue; // este tick não pegou neste inimigo
          checked++;
          if (comido > Math.floor((comido + vida) * SHIELD_DOT_TICK_ABSORB) || vida <= 0) bad++;
        }
      }
    });
  }
  return { bad, checked };
}

describe('§196 → §327: escudo levantado DEPOIS do cast nunca bloqueia o DoT (no máximo metade de cada tick)', () => {
  it('1 inimigo: cada tick chega à vida com pelo menos metade', () => {
    const v = violations(1, 120);
    expect(v.checked).toBeGreaterThan(0);
    expect(v.bad).toBe(0);
  });
  it('2 e 3 inimigos (Arena): todo tick com escudo de pé (de antes ou de depois do cast), inclusive quando o alvo cai e os ticks passam ao próximo', () => {
    for (const n of [2, 3]) {
      const v = violations(n, 120, 0.04, 'single', false);
      expect(v.checked).toBeGreaterThan(0);
      expect(v.bad).toBe(0);
    }
  });
  it('com sobra de escudo antigo no cast (single e área)', () => {
    for (const n of [1, 2, 3]) for (const area of ['single', 'area'] as const) {
      const v = violations(n, 120, 0.04, area, false);
      expect(v.checked).toBeGreaterThan(0);
      expect(v.bad, `N=${n} ${area}`).toBe(0);
    }
  });
});
