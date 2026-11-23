import { describe, it, expect } from 'vitest';
import { DECOR_LUZ, decorLuzAcesa } from './decorLuz';
describe('decorLuz', () => {
  it('luz apaga ao dormir; noite acende ao dormir', () => {
    expect(decorLuzAcesa(DECOR_LUZ['furn-campfire'], false)).toBe(true);
    expect(decorLuzAcesa(DECOR_LUZ['furn-campfire'], true)).toBe(false);
    expect(decorLuzAcesa(DECOR_LUZ['furn-mushrooms'], false)).toBe(false);
    expect(decorLuzAcesa(DECOR_LUZ['furn-mushrooms'], true)).toBe(true);
  });
  it("'sempre' (Cristal Fundador) acende acordado e dormindo; luz e noite seguem inalterados", () => {
    const c = DECOR_LUZ['furn-cristal-fundador'];
    expect(c.modo).toBe('sempre');
    expect(c.tom).toBe('turquesa');
    expect(decorLuzAcesa(c, false)).toBe(true);
    expect(decorLuzAcesa(c, true)).toBe(true);
    expect(decorLuzAcesa({ ...c, modo: 'luz' }, true)).toBe(false);
    expect(decorLuzAcesa({ ...c, modo: 'noite' }, false)).toBe(false);
  });
});
