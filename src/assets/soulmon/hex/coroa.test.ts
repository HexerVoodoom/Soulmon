import { describe, expect, it } from 'vitest';
import { resolveHexCrownArt, HEX_ART } from '.';
import { SPECIAL_FAMILIES } from '../../../utils/combate/specials';

describe('coroa por família da Hexsmith (§359)', () => {
  it('cada família do especial resolve uma coroa própria, distinta da coroa única', () => {
    const urls = SPECIAL_FAMILIES.map((f) => resolveHexCrownArt(f));
    for (const u of urls) { expect(u).toBeTruthy(); expect(u).not.toBe(HEX_ART.slotIcon.coroa); }
    expect(new Set(urls).size).toBe(SPECIAL_FAMILIES.length);
  });
  it('família sem arte cai na coroa única', () => {
    expect(resolveHexCrownArt('familia-inexistente')).toBe(HEX_ART.slotIcon.coroa);
  });
});
