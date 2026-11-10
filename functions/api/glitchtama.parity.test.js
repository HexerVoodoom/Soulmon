import { describe, it, expect } from 'vitest';
import { GLITCHTAMA_JANELA_MS, enforceGlitchtamaUsadoEm } from './_glitchtama.js';
import { GLITCHTAMA_JANELA_MS as JANELA_APP } from '../../src/utils/glitchtamaBuff';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const DIA = 86_400_000;

describe('Glitchtama: servidor e app concordam na janela', () => {
  it('mesma janela de 7 dias', () => expect(GLITCHTAMA_JANELA_MS).toBe(JANELA_APP));
});

describe('servidor: glitchtamaUsadoEm é monotônico', () => {
  it('voltar o timestamp (ou apagar o save local) NÃO reabre o uso', () => {
    expect(enforceGlitchtamaUsadoEm(NOW - 5 * DIA, NOW - DIA, NOW)).toBe(NOW - DIA);
    expect(enforceGlitchtamaUsadoEm(undefined, NOW - DIA, NOW)).toBe(NOW - DIA);
    expect(enforceGlitchtamaUsadoEm('lixo', NOW - DIA, NOW)).toBe(NOW - DIA);
  });
  it('uso novo avança; primeiro uso grava', () => {
    expect(enforceGlitchtamaUsadoEm(NOW, NOW - 8 * DIA, NOW)).toBe(NOW);
    expect(enforceGlitchtamaUsadoEm(NOW, undefined, NOW)).toBe(NOW);
  });
  it('futuro além de 1 dia é recusado (não tranca o item por semanas)', () => {
    expect(enforceGlitchtamaUsadoEm(NOW + 30 * DIA, NOW - 8 * DIA, NOW)).toBe(NOW - 8 * DIA);
    expect(enforceGlitchtamaUsadoEm(NOW + 30 * DIA, undefined, NOW)).toBeUndefined();
  });
  it('nada recebido nem gravado: undefined', () => expect(enforceGlitchtamaUsadoEm(undefined, undefined, NOW)).toBeUndefined());
});
