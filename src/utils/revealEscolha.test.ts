import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ELEMENT_ORDER, type ElementId, type OracleResult } from './oracle';
import { elementChoiceCandidates, falaDaIris, descricaoCurtaElemento } from './revealEscolha';

/** Resultado sintético: só o que o módulo lê. */
function sint(
  dominant: ElementId, secondary: ElementId | null, scores: Partial<Record<ElementId, number>>, baseName = 'Teste',
): OracleResult {
  const elementScores = Object.fromEntries(ELEMENT_ORDER.map(e => [e, scores[e] ?? 0])) as Record<ElementId, number>;
  return { elementScores, dominantElement: dominant, secondaryElement: secondary, creature: { baseName } } as unknown as OracleResult;
}

describe('elementChoiceCandidates (D-153)', () => {
  it('secundário sem empate -> só ele', () => {
    expect(elementChoiceCandidates(sint('agua', 'fogo', { agua: 10, fogo: 8, terra: 5, ar: 2 }))).toEqual(['fogo']);
  });
  it('empate no 2º lugar -> todos os empatados, na ordem de ELEMENT_ORDER', () => {
    expect(elementChoiceCandidates(sint('agua', 'fogo', { agua: 10, fogo: 8, ar: 8, terra: 8, sombra: 1 }))).toEqual(['fogo', 'terra', 'ar']);
  });
  it('empate no 1º entre os outros (sem secundário) -> os empatados', () => {
    expect(elementChoiceCandidates(sint('luz', null, { luz: 9, sombra: 6, planta: 6, ar: 1 }))).toEqual(['sombra', 'planta']);
  });
  it('sem secundário -> o 2º colocado', () => {
    expect(elementChoiceCandidates(sint('fogo', null, { fogo: 9, terra: 4, ar: 3 }))).toEqual(['terra']);
  });
  it('secundário fora do grupo entra no fim, e a ordem final é pontuação desc', () => {
    expect(elementChoiceCandidates(sint('agua', 'ar', { agua: 10, fogo: 8, ar: 3 }))).toEqual(['fogo', 'ar']);
  });
  it('nunca inclui o dominante e é determinístico', () => {
    const r = sint('terra', 'agua', { terra: 5, agua: 5, fogo: 5 });
    const a = elementChoiceCandidates(r);
    expect(a).not.toContain('terra');
    expect(elementChoiceCandidates(r)).toEqual(a);
  });
});

describe('falaDaIris (copy aprovada)', () => {
  const vesparuo = sint('agua', 'fogo', {}, 'Vesparuo');
  const lumikor = sint('luz', null, {}, 'Lumikor');
  const brasvel = sint('fogo', null, {}, 'Brasvel');
  it('EN', () => {
    expect(falaDaIris(vesparuo, 'en')).toBe('Your Soulmon is Vesparuo. A Water soul, touched by Fire: fluid, empathetic and deep.');
    expect(falaDaIris(lumikor, 'en')).toBe('Your Soulmon is Lumikor. A Light soul: radiant, optimistic and inspiring.');
    expect(falaDaIris(brasvel, 'en')).toBe('Your Soulmon is Brasvel. A Fire soul: burning, passionate and restless.');
  });
  it('EN: An antes de vogal, A nos demais', () => {
    expect(falaDaIris(sint('terra', null, {}, 'X'), 'en')).toBe('Your Soulmon is X. An Earth soul: solid, loyal and practical.');
    expect(falaDaIris(sint('ar', null, {}, 'X'), 'en')).toMatch(/^Your Soulmon is X\. An Air soul/);
    expect(falaDaIris(sint('industrial', null, {}, 'X'), 'en')).toMatch(/\. An Industrial soul/);
    expect(falaDaIris(sint('agua', null, {}, 'X'), 'en')).toMatch(/\. A Water soul/);
  });
  it('PT', () => {
    expect(falaDaIris(vesparuo, 'pt')).toBe('Seu Soulmon é Vesparuo. Uma alma de Água, tocada por Fogo: fluido, empático e profundo.');
    expect(falaDaIris(lumikor, 'pt')).toBe('Seu Soulmon é Lumikor. Uma alma de Luz: radiante, otimista e inspirador.');
    expect(falaDaIris(brasvel, 'pt')).toBe('Seu Soulmon é Brasvel. Uma alma de Fogo: ardente, apaixonado e inquieto.');
  });
  it('descrição curta: antes do travessão, maiúscula, ponto final', () => {
    expect(descricaoCurtaElemento('agua', 'en')).toBe('Fluid, empathetic and deep.');
    expect(descricaoCurtaElemento('fogo', 'pt')).toBe('Ardente, apaixonado e inquieto.');
  });
  it('nada de pontos/percentuais na fala', () => {
    expect(falaDaIris(sint('agua', 'fogo', { agua: 10, fogo: 7 }, 'X'), 'en')).not.toMatch(/\d|%/);
  });
});

describe('revealEscolha.ts é puro', () => {
  it('não usa Math.random, Date.now nem crypto', () => {
    const src = readFileSync(`${process.cwd()}/src/utils/revealEscolha.ts`, 'utf8');
    expect(src).not.toContain('Math.random');
    expect(src).not.toContain('Date.now');
    expect(src).not.toContain('crypto');
  });
});
