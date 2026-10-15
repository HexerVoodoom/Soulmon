/** QA3 REGRESSAO: em telefones modernos nenhum alvo de toque de lote passa da borda da cena e todos têm ≥ 44 px. */
import { describe, it, expect } from 'vitest';
import { lotHitRects } from './areaLotGeometry';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from './areaSheetCopy';
import { exploracaoLots, jogosLots } from './playAreaLots';
import type { AreaId } from '../navigation';

type Lot = { id: string; left: string; top: string; width?: string; label: string };
const AREAS: Array<[AreaId, (l: 'pt-BR' | 'en-US') => Lot[]]> = [
  ['mercado', mercadoLots as never], ['arena', arenaLots as never], ['exploracao', exploracaoLots as never],
  ['jogos', jogosLots as never], ['laboratorio', laboratorioLots as never], ['hall', hallLots as never],
];
describe('QA3 geometria dos lotes: dentro da cena e >= 44px', () => {
  for (const [w, h] of [[360, 740], [360, 780], [390, 844], [393, 873], [412, 915]] as Array<[number, number]>) {
    it(`${w}x${h}`, () => {
      const ruins: string[] = [];
      for (const [area, lots] of AREAS) for (const lot of lots('pt-BR')) lotHitRects(area, lot, w, h).forEach((r, i) => {
        if (r.x0 < -1 || r.y0 < -1 || r.x1 > w + 1 || r.y1 > h + 1) ruins.push(`${area}.${lot.id}[${i}] fora y ${Math.round(r.y0)}..${Math.round(r.y1)}`);
        if (i === 0 && (r.x1 - r.x0 < 44 || r.y1 - r.y0 < 44)) ruins.push(`${area}.${lot.id}[${i}] menor que 44`);
      });
      expect(ruins).toEqual([]);
    });
  }
});
