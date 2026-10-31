import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { COMBINADOS_LOTE1_DATA } from './elementosLote1.data';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';
import { COMBINADOS_LOTE3_DATA } from './elementosLote3.data';
import { COMBINADOS_ART } from './enemyRosterArt';
import { SPRITE_ELEMENT } from './spriteElement';
import { ENEMY_ROSTER } from './enemyRoster';

const TODOS = [...COMBINADOS_LOTE1_DATA, ...COMBINADOS_LOTE2_DATA, ...COMBINADOS_LOTE3_DATA];

describe('lotes 1-3 juntos (50 elementos, nº 212-261)', () => {
  it('17+17+16 = 50 entradas, ids e números únicos, 212..261 contíguos', () => {
    expect(TODOS).toHaveLength(50);
    expect(new Set(TODOS.map(r => r[1])).size).toBe(50);
    const nums = TODOS.map(r => Number(r[0])).sort((a, b) => a - b);
    expect(new Set(nums).size).toBe(50);
    expect(nums[0]).toBe(212);
    expect(nums[49]).toBe(261);
    expect(nums).toEqual(Array.from({ length: 50 }, (_, i) => 212 + i));
  });
  it('cada um registrado exatamente uma vez no roster, na arte e no mapa de elemento', () => {
    for (const [num, slug] of TODOS) {
      expect(ENEMY_ROSTER.filter(e => e.id === `cmb${num}`), slug).toHaveLength(1);
      expect(COMBINADOS_ART[`${num}-${slug}`], slug).toBeTruthy();
      expect(SPRITE_ELEMENT[`cmb:${num}`], slug).toBe(slug);
    }
  });
  it('bate com a lista externa de 50 ids (quando disponível)', () => {
    const p = 'E:/tmp/elementos-50.json';
    if (!existsSync(p)) return;
    const ids = (JSON.parse(readFileSync(p, 'utf8')) as { id: string }[]).map(x => x.id);
    expect(ids).toHaveLength(50);
    expect([...ids].sort()).toEqual(TODOS.map(r => r[1]).sort());
  });
});
