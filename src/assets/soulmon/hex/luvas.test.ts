import { describe, expect, it } from 'vitest';
import { resolveHexGloveArt, HEX_ART } from '.';
import { HEX_STRIKES } from '../../../utils/hexsmith';

describe('arte das luvas da Hexsmith (uma por golpe)', () => {
  it('cada um dos 4 golpes tem a sua luva, todas distintas e diferentes da arte única do slot', () => {
    const urls = HEX_STRIKES.map((s) => resolveHexGloveArt(s));
    expect(urls.every(Boolean)).toBe(true);
    expect(new Set(urls).size).toBe(HEX_STRIKES.length);
    for (const u of urls) expect(u).not.toBe(HEX_ART.slotIcon.luvas);
  });
  it('golpe desconhecido cai na arte única do slot', () => {
    expect(resolveHexGloveArt('golpe-inexistente')).toBe(HEX_ART.slotIcon.luvas);
  });
});
