// PESADELO (22/11/2026): o `dot` do companheiro vira ataque extra logo após o especial; buff mantém; cura não invoca; outros modos inalterados.
import { describe, expect, it } from 'vitest';
import { groupFightSteps, type GroupEvent, type GroupResult } from './group';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { specialOf, specialOfPve, type SpecialFamily } from './specials';
import { nightmareFoe } from '../nightmares';

const alvo = (L: number) => ({ combatant: combatantAt(L, REFERENCE_BUILDS.balanced), special: specialOf('direct') });
function rodar(fam: SpecialFamily, invoca: boolean, ataqueExtra: boolean | undefined, seed = 31) {
  const eventos: GroupEvent[] = [];
  const g = groupFightSteps(
    { combatant: combatantAt(18, REFERENCE_BUILDS.balanced), special: specialOfPve(fam), area: 'single', invoca },
    [alvo(18)], { seed, withFx: true, ...(ataqueExtra === undefined ? {} : { ataqueExtra }) },
  );
  let r = g.next();
  while (!r.done) { eventos.push(r.value); r = g.next(1); }
  return { eventos, res: r.value as GroupResult };
}

describe('Pesadelo: companheiro invocado', () => {
  it('dot: vira UM ataque extra logo após o cast, sem DoT residual, com dano à parte', () => {
    const { eventos, res } = rodar('dot', true, true);
    const comp = eventos.filter((e) => e.comp);
    expect(comp.length).toBe(res.casts);
    expect(res.compDano).toBeGreaterThan(0);
    for (const c of comp) {
      const i = eventos.indexOf(c);
      expect(eventos[i - 1].kind === 'cast' || eventos[i - 1].comp === true).toBe(true);
      expect(c.kind).toBe('attack');
    }
    expect(Math.max(...eventos.map((e) => e.fx?.[0].comp ?? 0))).toBe(0);
    expect(eventos.some((e) => e.kind === 'tick' && e.who === 0)).toBe(false);
  });
  it('sem a opção (Masmorra/Arena/Raid) o dot segue como DoT e nada é marcado', () => {
    const base = rodar('dot', true, undefined);
    expect(rodar('dot', true, false).eventos).toEqual(base.eventos);
    expect(JSON.stringify(base.eventos)).not.toContain('"comp":true');
    expect(base.res.compDano).toBeUndefined();
  });
  it('direct, buff e cura não mudam com a opção ligada', () => {
    for (const fam of ['direct', 'atkBuff', 'shield', 'heal'] as const) {
      const a = rodar(fam, true, true);
      const b = rodar(fam, true, undefined);
      expect(a.eventos).toEqual(b.eventos);
    }
  });
  it('cura não invoca nem no Pesadelo', () => {
    expect(rodar('heal', true, true).eventos).toEqual(rodar('heal', false, true).eventos);
  });
});

describe('Pesadelo: o inimigo só usa dano imediato', () => {
  it('todo slot do Pesadelo tem especial direct (nenhum dot/cura/defesa/suporte)', () => {
    for (let slot = 0; slot < 6; slot++) {
      const f = nightmareFoe(18, slot);
      if (f.special) expect(f.special.family).toBe('direct');
    }
  });
});
