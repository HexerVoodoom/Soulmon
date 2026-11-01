import { describe, it, expect } from 'vitest';
import { CURATED_ELEMENT_IDS, CURATED_ELEMENT_NAMES, ELEMENTOS_CURADOS, curatedElementName } from './elementosCurados';
import { ALL_ELEMENT_IDS, LIBRARY_ELEMENT_IDS, ELEMENT_DEX_MAX, applyElementsDefeated, dexIdsOfFoe, dexUnlockedSet, sanitizeDefeatedElements } from './elementDex';
import { ENEMY_ROSTER, RAVEN_ENTRY } from './enemyRoster';
import { elementIcon } from './elementIconArt';
import { isStrayFoe } from './wildFoeLabel';

// Pergunta do dono (01/11/2026): "Os novos elementos e soulmon foram adicionados na Biblioteca também?"
describe('Biblioteca: os 50 elementos curados (212–261) e o corvo neutro', () => {
  it('são exatamente 50, numerados 212..261, sem repetir', () => {
    expect(ELEMENTOS_CURADOS.map(e => Number(e.num))).toEqual(Array.from({ length: 50 }, (_, i) => 212 + i));
    expect(new Set(ELEMENTOS_CURADOS.map(e => e.id)).size).toBe(50);
  });
  it('entram no dex da Biblioteca (aba Elemento), mais o neutro; a Loja/Poção (ALL_ELEMENT_IDS) não muda', () => {
    expect(ALL_ELEMENT_IDS).toHaveLength(210);
    expect(LIBRARY_ELEMENT_IDS).toHaveLength(261);
    expect(new Set(LIBRARY_ELEMENT_IDS).size).toBe(261);
    for (const id of CURATED_ELEMENT_IDS) expect(LIBRARY_ELEMENT_IDS).toContain(id);
    expect(ELEMENT_DEX_MAX).toBe(LIBRARY_ELEMENT_IDS.length);
  });
  it('todo curado e o neutro têm ícone e nome', () => {
    for (const id of CURATED_ELEMENT_IDS) {
      expect(elementIcon(id), id).toBeTruthy();
      expect(curatedElementName(id, true).length).toBeGreaterThan(1);
    }
    expect(curatedElementName('relampago_seco', true)).toBe('Relâmpago Seco');
    expect(curatedElementName('relampago_seco', false)).toBe('Dry Lightning');
    expect(curatedElementName('neutro', true)).toBe('Neutro');
  });
  it('todo curado e o neutro têm nome próprio PT e EN na tabela (nunca o fallback do slug)', () => {
    for (const id of CURATED_ELEMENT_IDS) {
      expect(CURATED_ELEMENT_NAMES[id], id).toBeDefined();
      expect(CURATED_ELEMENT_NAMES[id].pt).not.toBe(id);
    }
    expect(Object.keys(CURATED_ELEMENT_NAMES).sort()).toEqual([...CURATED_ELEMENT_IDS].sort());
  });
  it('cada Soulmon dos 50 está no roster como rookie (aba Selvagem) e vencê-lo destranca o elemento curado', () => {
    for (const e of ELEMENTOS_CURADOS) {
      const r = ENEMY_ROSTER.find(x => x.id === `cmb${e.num}`);
      expect(r, e.id).toBeDefined();
      expect(r!.element).toBe(e.id);
      expect(isStrayFoe(r!.stage)).toBe(false);
      expect(dexIdsOfFoe(r)).toContain(e.id);
    }
  });
  it('o corvo está no roster (Selvagem) e vencê-lo destranca o neutro', () => {
    expect(ENEMY_ROSTER).toContain(RAVEN_ENTRY);
    expect(isStrayFoe(RAVEN_ENTRY.stage)).toBe(false);
    expect(dexIdsOfFoe(RAVEN_ENTRY)).toEqual(['neutro']);
  });
  it('applyElementsDefeated aceita curados; o save guarda os 261 sem cortar', () => {
    const s = applyElementsDefeated({ defeatedElements: [] as string[] }, ['geiser', 'neutro', 'xyz']);
    expect(s.defeatedElements).toEqual(['geiser', 'neutro']);
    expect(dexUnlockedSet(s.defeatedElements).has('geiser')).toBe(true);
    expect(sanitizeDefeatedElements([...LIBRARY_ELEMENT_IDS])).toHaveLength(261);
  });
  it('inimigo base comum segue destrancando só o próprio id', () => {
    expect(dexIdsOfFoe({ elements: ['fogo'], element: 'fogo' })).toEqual(['fogo']);
    expect(dexIdsOfFoe({ elements: ['fogo', 'agua'], element: 'vapor' })).toEqual(['vapor']);
    expect(dexIdsOfFoe(undefined)).toEqual([]);
  });
});
