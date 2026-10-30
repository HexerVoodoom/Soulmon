/**
 * §196 — a causa que ainda fazia o dono ver "o escudo dele bloqueou meu especial" (30/10/2026). O motor resolvia o
 * dano do especial no cast, mas só ENTREGAVA o evento do golpe depois de perguntar o cast de TODOS no mesmo instante:
 * quando o inimigo também tinha a barra cheia, a ordem saía `cast(pet) → cast(inimigo: escudo) → golpe do especial do pet`.
 * A cena (useGroupBattle) mostrava o especial do pet SEM dano, abria o escudo do inimigo e só então o número aparecia —
 * dentro da cena do inimigo. Regra: os golpes de um cast saem ANTES do próximo cast (só a ordem dos eventos muda; o resultado não).
 */
import { describe, expect, it } from 'vitest';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './level';
import { groupFightSteps, type GroupEvent } from './group';
import { fightSteps, type FightEvent } from './fight';
import { specialOf, type SpecialFamily } from './specials';

const side = (family: SpecialFamily) => ({ combatant: combatantAt(12, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[1]]), special: specialOf(family) });

describe('§196 o golpe do especial sai antes do escudo conjurado depois', () => {
  it('grupo: depois do cast direto do pet vem o golpe dele, nunca o cast de um inimigo', () => {
    let both = 0;
    for (let seed = 1; seed <= 200; seed++) {
      for (const n of [1, 2, 3]) {
        const g = groupFightSteps(side('direct'), Array.from({ length: n }, () => side('shield')), { seed, startEnergy: 100 });
        const evs: GroupEvent[] = [];
        let r = g.next();
        while (!r.done && evs.length < 2000) { evs.push(r.value); r = g.next(1); }
        evs.forEach((e, i) => {
          if (e.kind !== 'cast' || e.who !== 0) return;
          const nx = evs[i + 1];
          if (!nx) return;
          if (evs.slice(i + 1).some((x) => x.kind === 'cast' && x.who > 0 && Math.abs(x.t - e.t) < 1e-9)) both++;
          expect(nx.kind === 'cast' && nx.who > 0, `seed ${seed} N${n} t=${e.t}`).toBe(false);
        });
      }
    }
    expect(both).toBeGreaterThan(0); // o caso do dono (os dois com a barra cheia no mesmo instante) aconteceu
  });
  it('1v1: idem', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const g = fightSteps(side('direct'), side('heal'), { seed, hpScale: 0.6 } as never);
      const evs: FightEvent[] = [];
      let r = g.next();
      while (!r.done && evs.length < 2000) { evs.push(r.value); r = g.next(1); }
      evs.forEach((e, i) => {
        if (e.kind !== 'cast' || e.side !== 0) return;
        const nx = evs[i + 1];
        if (nx) expect(nx.kind === 'cast' && nx.side === 1, `seed ${seed}`).toBe(false);
      });
    }
  });
});
