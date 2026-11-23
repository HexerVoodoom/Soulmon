/** Os alvos de toque dos prédios pintados não se encostam e cabem na imagem: o toque num prédio nunca abre o vizinho. */
import { describe, it, expect } from 'vitest';
import { LOT_PINTADO, MAPA_MUNDO_PINTADO, type LotBounds } from './areaLotGeometry';

const cruza = (a: LotBounds, b: LotBounds) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

function semSobreposicao(grupo: Array<[string, LotBounds]>) {
  for (const [id, b] of grupo) {
    expect(b[0] >= 0 && b[1] >= 0 && b[2] <= 100 && b[3] <= 100 && b[0] < b[2] && b[1] < b[3], id).toBe(true);
    for (const [outro, c] of grupo) if (id < outro) expect(cruza(b, c), `${id} x ${outro}`).toBe(false);
  }
}

describe('prédios pintados', () => {
  it('nenhum par de alvos da mesma área se encosta', () => {
    const areas = new Set(Object.keys(LOT_PINTADO).map(k => k.split(':')[0]));
    for (const area of areas) semSobreposicao(Object.entries(LOT_PINTADO).filter(([k]) => k.startsWith(`${area}:`)));
  });
  it('nenhum par de distritos do mapa-mundo se encosta', () => {
    semSobreposicao(Object.entries(MAPA_MUNDO_PINTADO));
  });
});
