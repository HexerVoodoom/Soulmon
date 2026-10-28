/**
 * ARENA POR TEMA (27/10/2026): inimigos e cenário do tema do elemento do jogador.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_ROUNDS } from './arena';
import { arenaTemaElementos, dominioDoElemento, DOMINIO_DO_ELEMENTO_BASE, ARENA_DOMINIOS, arenaVarianteDaRodada, ARENA_CENARIOS_POR_DOMINIO } from './arenaTema';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { NOVOS_DATA } from './novosSoulmonData';
import { combatDomainSceneBg } from './combatArt';

describe('arenaTemaElementos', () => {
  it('base = ela mesma; par derivado = os dois componentes; neutro/lixo = sem tema', () => {
    expect(arenaTemaElementos('industrial')).toEqual(['industrial']);
    expect(arenaTemaElementos('lava')).toEqual(['fogo', 'terra']);
    expect(arenaTemaElementos('neutro')).toEqual([]);
    expect(arenaTemaElementos('xyz')).toEqual([]);
    expect(arenaTemaElementos(undefined)).toEqual([]);
  });
});

describe('pool', () => {
  it('todo elemento-base tem criatura', () => {
    for (const el of CLASS_ELEMENT_ORDER) expect(NOVOS_DATA.some(n => n.element === el)).toBe(true);
  });
});

describe('cenario: elemento -> dominio', () => {
  it('os 8 elementos do Oraculo tem dominio PROPRIO; o resto aponta para um dominio que existe', () => {
    for (const el of ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial']) {
      expect(DOMINIO_DO_ELEMENTO_BASE[el]).toEqual({ dominio: el, proprio: true });
    }
    for (const el of CLASS_ELEMENT_ORDER) expect(ARENA_DOMINIOS).toContain(DOMINIO_DO_ELEMENTO_BASE[el].dominio);
  });

  it('industrial -> dominio industrial; sombra -> sombra', () => {
    expect(dominioDoElemento('industrial')).toBe('industrial');
    expect(dominioDoElemento('sombra')).toBe('sombra');
  });

  it('par com dominio exato usa o dele (gelo, areia); os demais, o do 1o componente', () => {
    expect(dominioDoElemento('gelo')).toBe('gelo');
    expect(dominioDoElemento('areia')).toBe('deserto');
    expect(dominioDoElemento('lava')).toBe('fogo');
  });

  it('todo par derivado resolve a um dominio; neutro/desconhecido = null', () => {
    for (const p of DERIVED_ELEMENT_PAIRS) expect(ARENA_DOMINIOS).toContain(dominioDoElemento(p.id));
    expect(dominioDoElemento('neutro')).toBeNull();
    expect(dominioDoElemento(null)).toBeNull();
  });

  it('os 17 dominios tem os 3 cenarios instalados (arte real, nao fallback)', () => {
    for (const d of ARENA_DOMINIOS) for (let v = 0; v < ARENA_CENARIOS_POR_DOMINIO; v++) expect(combatDomainSceneBg(d, v)).toMatch(/^url\(/);
    expect(combatDomainSceneBg('inexistente')).toBeUndefined();
  });

  it('a variante da rodada e deterministica e fica em 0..2', () => {
    for (let r = 1; r <= ARENA_ROUNDS; r++) {
      const v = arenaVarianteDaRodada(777, r);
      expect(v).toBe(arenaVarianteDaRodada(777, r));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(ARENA_CENARIOS_POR_DOMINIO);
    }
  });
});
