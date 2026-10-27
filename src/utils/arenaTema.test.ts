/**
 * ARENA POR TEMA (27/10/2026): inimigos e cenário do tema do elemento do jogador.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_ROUNDS, buildArenaRound } from './arena';
import { arenaTemaElementos, dominioDoElemento, DOMINIO_DO_ELEMENTO_BASE, ARENA_DOMINIOS, arenaVarianteDaRodada, ARENA_CENARIOS_POR_DOMINIO } from './arenaTema';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { NOVOS_DATA } from './novosSoulmonData';
import { mulberry32 } from './combate/rng';
import { combatDomainSceneBg } from './combatArt';

const todasAsRodadas = (seed: number, tema?: readonly string[]) =>
  Array.from({ length: ARENA_ROUNDS }, (_, i) => buildArenaRound(i + 1, 1, mulberry32(seed + i), [], tema)).flat();

describe('arenaTemaElementos', () => {
  it('base = ela mesma; par derivado = os dois componentes; neutro/lixo = sem tema', () => {
    expect(arenaTemaElementos('industrial')).toEqual(['industrial']);
    expect(arenaTemaElementos('lava')).toEqual(['fogo', 'terra']);
    expect(arenaTemaElementos('neutro')).toEqual([]);
    expect(arenaTemaElementos('xyz')).toEqual([]);
    expect(arenaTemaElementos(undefined)).toEqual([]);
  });
});

describe('inimigos do tema', () => {
  it.each(['industrial', 'sombra', 'fogo', 'planta', 'fada'])('jogador %s: TODO inimigo de TODA rodada e do tema', el => {
    for (const seed of [1, 7, 99, 12345]) {
      const foes = todasAsRodadas(seed, arenaTemaElementos(el));
      expect(foes.length).toBe(8);
      for (const f of foes) expect(f.elements).toEqual([el]);
    }
  });

  it('par derivado: so criaturas que contem um dos componentes', () => {
    const tema = arenaTemaElementos('lava');
    for (const seed of [1, 2, 3, 4]) for (const f of todasAsRodadas(seed, tema)) expect(tema).toContain(f.elements[0]);
  });

  it('a composicao da rodada e o contrato v3 nao mudam (a forca vem de `arenaFoe`, relativa ao level)', () => {
    const f = buildArenaRound(4, 1, mulberry32(5), [], ['sombra']);
    expect(f.map(x => x.cls)).toEqual(['weak', 'weak', 'weak']);
  });

  it('deterministico por semente', () => {
    expect(todasAsRodadas(42, ['sombra'])).toEqual(todasAsRodadas(42, ['sombra']));
  });

  it('FALLBACK explicito: tema vazio (neutro/desconhecido) = sorteio geral dos 20, sem travar', () => {
    const vistos = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) for (const f of todasAsRodadas(seed, [])) vistos.add(f.elements[0]);
    expect(vistos.size).toBeGreaterThan(8);
    // tema sem criatura no pool (id fora dos 20): tambem cai no geral
    expect(todasAsRodadas(3, ['inexistente']).length).toBe(8);
  });

  it('todo elemento-base tem criatura (o pool do tema nunca e vazio)', () => {
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
