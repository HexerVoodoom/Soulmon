import { describe, expect, it } from 'vitest';
import { sanitizeElementoJornada, enforceImmutableElementoJornada } from './_elementoJornada.js';
import { ELEMENTOS_FICHA, duelSide, petElementDeSave } from './_duel.js';
import { BASE_DO_PAR, aplicarElementosDuelo } from './_elementoBase.js';
import { sanitizeElementoJornada as cliente } from '../../src/utils/elementoJornada';
import { petBaseOf, petElementOf } from '../../src/utils/starterElements';
import { ELEMENTOS_CURADOS } from '../../src/utils/elementosCurados';

const J = { v: 1, u: 0.97, estagios: { ultra: { id: 'geiser', base: 'agua' }, mega: { id: 'lixo', base: 'agua' } } };

describe('§230 paridade do elemento por estágio', () => {
  it('a mesma forma nos dois lados', () => {
    for (const raw of [J, null, { u: 2, estagios: {} }, { u: 0.1 }, { u: 0.1, estagios: [] }]) expect(sanitizeElementoJornada(raw)).toEqual(cliente(raw));
  });
  it('os 50 curados estão na lista fechada, com o 1º componente', () => {
    for (const e of ELEMENTOS_CURADOS) {
      expect(ELEMENTOS_FICHA.has(e.id)).toBe(true);
      expect(BASE_DO_PAR[e.id]).toBe(e.componentes[0]);
    }
  });
  it('petElementOf e petElementDeSave concordam, poção inclusa', () => {
    const casos = [
      { evolutionStage: 'ultra', elementoJornada: J, soulmonMeta: { dominantElement: 'agua' } },
      { evolutionStage: 'champion', elementoJornada: J, soulmonMeta: { dominantElement: 'agua' } },
      { evolutionStage: 'ultra', potionElement: 'lava', elementoJornada: J, soulmonMeta: { dominantElement: 'agua' } },
      { evolutionStage: 'ultra', demoCharacterId: 'meteoro', elementoJornada: J },
    ];
    for (const s of casos) {
      const srv = petElementDeSave(s);
      expect(srv.el).toBe(petElementOf(s) ?? null);
      expect(srv.base ?? undefined).toBe(petBaseOf(s));
    }
  });
  it('a vantagem do servidor usa a base nº 1, não o 1º componente do curado', () => {
    const side = duelSide({ evolutionStage: 'ultra', totalXP: 0, elementoJornada: J, soulmonMeta: { dominantElement: 'agua' } });
    expect(side.fx.elBasica).toBe('geiser');
    expect(side.fx.elVantagem).toBe('agua');
    const me = { combatant: { bonus: 0 }, fx: side.fx };
    const a = aplicarElementosDuelo(me, { combatant: { bonus: 0 }, fx: { elBasica: 'marcial' } }, 1); // agua vence marcial; fogo (1º do gêiser) não
    expect(a.meCombatant.bonus).toBeGreaterThan(0);
  });
  it('sorte e estágio gravados não mudam; estágio novo entra', () => {
    const r = enforceImmutableElementoJornada(
      { u: 0.1, estagios: { ultra: { id: 'vapor', base: 'fogo' }, champion: { id: 'vapor', base: 'fogo' } } },
      { u: 0.97, estagios: { ultra: { id: 'geiser', base: 'agua' } } },
    );
    expect(r).toEqual({ v: 1, u: 0.97, estagios: { ultra: { id: 'geiser', base: 'agua' }, champion: { id: 'vapor', base: 'fogo' } } });
  });
});
