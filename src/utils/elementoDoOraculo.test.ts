/** O elemento do oráculo → a classe (dono, 20/10/2026, REGISTRO §150): o mapa, a consistência com a ponte e o guard de dono único. */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { elementoDoOraculo } from './elementoDoOraculo';
import { ELEMENT_BRIDGE } from './soulProfile/derivedElements';
import { baseDominanteDoElemento, elementoConhecido } from './soulProfile/ficha/elementoNome';
import { petElementOf } from './starterElements';

const OITO = ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial'];

describe('elementoDoOraculo', () => {
  it('planta e industrial têm arte própria e NUNCA viram vida/aco (REGISTRO §150 revisto, 27/10/2026)', () => {
    expect(elementoDoOraculo('planta')).toBe('planta');
    expect(elementoDoOraculo('industrial')).toBe('industrial');
    expect(elementoDoOraculo('fogo')).toBe('fogo');
  });
  it('os 8 ids do oráculo viram elemento conhecido, cada um passa como é', () => {
    for (const id of OITO) {
      const r = elementoDoOraculo(id);
      expect(elementoConhecido(r)).toBe(true);
      expect(r).toBe(id);
    }
  });
  it('lixo → undefined', () => {
    expect(elementoDoOraculo('xyz')).toBeUndefined();
    expect(elementoDoOraculo('')).toBeUndefined();
    expect(elementoDoOraculo(undefined)).toBeUndefined();
    expect(elementoDoOraculo(null)).toBeUndefined();
  });
  it('ELEMENT_BRIDGE: desde 25/10/2026 planta e industrial são base e vão para si mesmas', () => {
    expect(ELEMENT_BRIDGE.planta).toEqual({ planta: 1 });
    expect(ELEMENT_BRIDGE.industrial).toEqual({ industrial: 1 });
    expect(baseDominanteDoElemento('planta')).toBe('planta');
    expect(baseDominanteDoElemento('industrial')).toBe('industrial');
  });
  it('petElementOf devolve planta/industrial como são; inicial e corvo seguem', () => {
    expect(petElementOf({ soulmonMeta: { dominantElement: 'planta' } })).toBe('planta');
    expect(petElementOf({ soulmonMeta: { dominantElement: 'industrial' } })).toBe('industrial');
    expect(petElementOf({ soulmonMeta: { dominantElement: 'fogo' } })).toBe('fogo');
    expect(petElementOf({ demoCharacterId: 'industrial', soulmonMeta: { dominantElement: 'planta' } })).toBe('terra');
    expect(petElementOf({ soulmonMeta: { dominantElement: 'planta', creature: 'corvo' } })).toBe('neutro');
  });
});

describe('guard: o alias oráculo→classe não volta', () => {
  const RAIZ = resolve(__dirname, '..');
  const EXCLUI = ['utils/elementoDoOraculo.ts', 'utils/oracle.ts', 'utils/soulProfile/derivedElements.ts'];
  const varre = (dir: string, acc: string[] = []): string[] => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) varre(p, acc);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n)) acc.push(p);
    }
    return acc;
  };
  it('nenhum literal do alias', () => {
    const achados: string[] = [];
    for (const f of varre(RAIZ)) {
      const rel = relative(RAIZ, f).replace(/\\/g, '/');
      if (EXCLUI.includes(rel) || rel.startsWith('utils/oracle/')) continue;
      readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
        if (/planta\s*:\s*['"]vida['"]/.test(l) || /industrial\s*:\s*['"](aco|marcial)['"]/.test(l)) achados.push(`${rel}:${i + 1}: ${l.trim()}`);
      });
    }
    expect(achados).toEqual([]);
  });
});
