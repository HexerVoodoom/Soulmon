/**
 * 🌋 A masmorra temática por elemento (08/11/2026): 2 camadas por elemento; base → 2 → 3 → 4 componentes; loop no fim; só criaturas do
 * elemento da camada; todo elemento (inclusive os compostos) tem cenário.
 */
import { describe, it, expect } from 'vitest';
import {
  CAMADAS_DO_CICLO, CAMADAS_POR_ELEMENTO, ELEMENTOS_DA_MASMORRA, componentesDoElemento, elementoDaCamada,
} from './dungeonElementos';
import { BASE_ELEMENT_IDS, elementComponents } from './elementDex';
import { curatedComponents } from './elementosCurados';
import { dungeonWaveOf } from './dungeonAway';
import { ENEMY_ROSTER } from './enemyRoster';
import { combatSceneBg } from './combatArt';

describe('a fila de elementos', () => {
  it('cada elemento ocupa 2 camadas seguidas', () => {
    expect(CAMADAS_POR_ELEMENTO).toBe(2);
    for (let i = 0; i < 40; i++) {
      expect(elementoDaCamada(2 * i + 1)).toBe(elementoDaCamada(2 * i + 2));
      expect(elementoDaCamada(2 * i + 1)).toBe(ELEMENTOS_DA_MASMORRA[i]);
    }
  });
  it('começa pelos elementos base, um a um, na ordem do catálogo', () => {
    BASE_ELEMENT_IDS.forEach((id, i) => expect(elementoDaCamada(2 * i + 1)).toBe(id));
  });
  it('ordem: todos os base, depois os de 2, depois os de 3, depois os de 4 componentes (nunca volta atrás)', () => {
    const n = ELEMENTOS_DA_MASMORRA.map(id => componentesDoElemento(id)!);
    expect(n.every(x => x >= 1 && x <= 4)).toBe(true);
    expect([...n].sort((a, b) => a - b)).toEqual(n);
    expect(new Set(n)).toEqual(new Set([1, 2, 3, 4]));
    expect(n.filter(x => x === 1).length).toBe(BASE_ELEMENT_IDS.length);
  });
  it('sem repetição, sem o neutro (o corvo não é elemento de camada)', () => {
    expect(new Set(ELEMENTOS_DA_MASMORRA).size).toBe(ELEMENTOS_DA_MASMORRA.length);
    expect(ELEMENTOS_DA_MASMORRA).not.toContain('neutro');
  });
  it('ao terminar tudo, volta ao começo (loop)', () => {
    expect(elementoDaCamada(CAMADAS_DO_CICLO)).toBe(ELEMENTOS_DA_MASMORRA[ELEMENTOS_DA_MASMORRA.length - 1]);
    expect(elementoDaCamada(CAMADAS_DO_CICLO + 1)).toBe(ELEMENTOS_DA_MASMORRA[0]);
    expect(elementoDaCamada(CAMADAS_DO_CICLO + 2)).toBe(ELEMENTOS_DA_MASMORRA[0]);
    expect(elementoDaCamada(CAMADAS_DO_CICLO + 3)).toBe(ELEMENTOS_DA_MASMORRA[1]);
  });
  it('entrada ruim cai na camada 1', () => {
    for (const x of [0, -3, NaN, Infinity]) expect(elementoDaCamada(x)).toBe(ELEMENTOS_DA_MASMORRA[0]);
  });
});

describe('todo elemento da fila tem criatura e cenário', () => {
  it('há ao menos uma criatura no roster para cada elemento', () => {
    const sem = ELEMENTOS_DA_MASMORRA.filter(id => !ENEMY_ROSTER.some(e => e.element === id && e.kind !== 'mascote'));
    expect(sem).toEqual([]);
  });
  it('todo elemento (base e compostos) resolve um cenário de combate', () => {
    const sem = ELEMENTOS_DA_MASMORRA.filter(id => !combatSceneBg(id));
    expect(sem).toEqual([]);
  });
});

describe('só aparecem summons do elemento da camada', () => {
  it('fogo só fogo, pântano só pântano — em amostras de camadas e sementes', () => {
    const camadas = [1, 2, 3, 4, 41, 42, 79, 100, 250, 400, 537, 538, 539];
    for (const seed of [7, 424242, -99]) {
      for (const layer of camadas) {
        const el = elementoDaCamada(layer);
        const wave = dungeonWaveOf(seed, layer, 30, 'ultimate');
        expect(wave.length).toBeGreaterThan(0);
        // REGISTRO §445: o mini-boss de um par/trio pode vir de um COMPONENTE do conjunto quando o elemento não tem a forma do estágio pedido.
        const comps = (id: string): readonly string[] => curatedComponents(id) ?? elementComponents(id) ?? [id];
        const doConjunto = new Set(comps(el));
        for (const e of wave) expect(e.element === el || comps(e.element ?? '').every(c => doConjunto.has(c)), `camada ${layer} (${el}): ${e.element}`).toBe(true);
      }
    }
  });
  it('o pântano (par derivado) existe na fila e seus inimigos são pântano', () => {
    const i = ELEMENTOS_DA_MASMORRA.indexOf('pantano');
    expect(i).toBeGreaterThanOrEqual(BASE_ELEMENT_IDS.length);
    for (const e of dungeonWaveOf(5, 2 * i + 1, 20, 'champion')) expect(e.element).toBe('pantano');
  });
  it('a mesma camada e semente dão a mesma onda (a conta de fora = a tela)', () => {
    expect(dungeonWaveOf(9, 12, 25, 'ultimate').map(e => e.stage)).toEqual(dungeonWaveOf(9, 12, 25, 'ultimate').map(e => e.stage));
  });
  it('o sorteio comum (tematica = false) continua misturando elementos', () => {
    const els = new Set<string | undefined>();
    for (let s = 1; s < 30; s++) for (const e of dungeonWaveOf(s, 1, 30, 'ultimate', false)) els.add(e.element);
    expect(els.size).toBeGreaterThan(3);
  });
});
