/** PARIDADE do Conjunto Fundador: ids/marcos do cliente (`src/utils/fundador.ts`) == servidor (`_fundador.js`); moldura em `_frames.js`; retrato em `_avatares.js` + catálogo. */
import { describe, it, expect } from 'vitest';
import { FUNDADOR_PREMIOS, FUNDADOR_MARCOS, FUNDADOR_DIAS_MAX } from '../../src/utils/fundador';
import { FRAMES } from '../../src/utils/frames';
import { FUNDADOR_PREMIOS as SERVER_PREMIOS, FUNDADOR_DIAS_MAX as SERVER_MAX } from './_fundador.js';
import { FRAME_IDS } from './_frames.js';
import { AVATAR_IDS } from './_avatares.js';

describe('Fundador — paridade cliente/servidor', () => {
  it('ids dos prêmios e teto idênticos', () => {
    expect([...SERVER_PREMIOS]).toEqual([...FUNDADOR_PREMIOS]);
    expect(SERVER_MAX).toBe(FUNDADOR_DIAS_MAX);
    expect(FUNDADOR_MARCOS.map(m => m.dias)).toEqual([1, 2, 3, 5]);
  });
  it('moldura: no catálogo do cliente (origem evento) E em `_frames.js`; retrato em `_avatares.js`', () => {
    const f = FRAMES.find(x => x.id === 'founder-moldura');
    expect(f?.origin).toBe('event');
    expect(FRAME_IDS.has('founder-moldura')).toBe(true);
    expect(AVATAR_IDS.has('founder-retrato')).toBe(true);
  });
});
