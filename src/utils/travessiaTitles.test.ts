import { describe, it, expect } from 'vitest';
import { REGIONS } from '../data/travessiasCatalog';
import { TRAVESSIA_TITLES, travessiaTitle } from './travessiaTitles';

/**
 * H12 (01/10/2026): toda proposta de Travessia do catálogo tem título nos dois
 * idiomas, e nenhum título fala de prêmio, prazo, número ou "desafio" — as
 * mesmas proibições da folha do Passeio (`travessias.contract.test.ts` (e)).
 */
describe('títulos das Travessias', () => {
  const propostas = REGIONS.flatMap(r => r.challenges ?? []);

  it('AUTOVERIFICAÇÃO: o catálogo tem propostas', () => {
    expect(propostas.length).toBeGreaterThan(0);
  });

  it('toda proposta tem título em EN e PT, e nenhum título sobra sem proposta', () => {
    for (const c of propostas) {
      expect(travessiaTitle(c.id, false), c.id).toBeTruthy();
      expect(travessiaTitle(c.id, true), c.id).toBeTruthy();
    }
    const ids = new Set(propostas.map(c => c.id));
    for (const id of Object.keys(TRAVESSIA_TITLES)) expect(ids.has(id), id).toBe(true);
  });

  it('nenhum título traz número, prêmio, prazo ou "desafio"', () => {
    const proibido = /\d|%|challenge|desafio|reward|recompensa|pr[êe]mio|\bbits\b|deadline|prazo|until|unlock|desbloque/i;
    for (const t of Object.values(TRAVESSIA_TITLES)) {
      expect(t.en).not.toMatch(proibido);
      expect(t.pt).not.toMatch(proibido);
    }
  });
});
