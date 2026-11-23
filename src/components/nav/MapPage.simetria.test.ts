import { describe, expect, it } from 'vitest';
import { MAPA_AJUSTE_ESCALA, mapaFolgasAjustadas } from '../../utils/areaLotGeometry';

describe('Mapa-mundo: margens laterais simétricas', () => {
  it('folga esquerda e direita dos prédios iguais (±1% da largura)', () => {
    const { esq, dir } = mapaFolgasAjustadas();
    expect(Math.abs(esq - dir)).toBeLessThanOrEqual(0.01);
  });
  it('a escala é modesta (não corta prédio)', () => {
    expect(MAPA_AJUSTE_ESCALA).toBeGreaterThan(1);
    expect(MAPA_AJUSTE_ESCALA).toBeLessThanOrEqual(1.05);
  });
});
