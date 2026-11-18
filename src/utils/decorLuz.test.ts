import { describe, it, expect } from 'vitest';
import { DECOR_LUZ, decorLuzAcesa } from './decorLuz';
describe('decorLuz', () => {
  it('luz apaga ao dormir; noite acende ao dormir', () => {
    expect(decorLuzAcesa(DECOR_LUZ['furn-campfire'], false)).toBe(true);
    expect(decorLuzAcesa(DECOR_LUZ['furn-campfire'], true)).toBe(false);
    expect(decorLuzAcesa(DECOR_LUZ['furn-mushrooms'], false)).toBe(false);
    expect(decorLuzAcesa(DECOR_LUZ['furn-mushrooms'], true)).toBe(true);
  });
});
