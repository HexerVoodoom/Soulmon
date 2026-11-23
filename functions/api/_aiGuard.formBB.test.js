import { describe, it, expect } from 'vitest';
import { VALID_FORM_ID } from './_aiGuard.js';

describe('VALID_FORM_ID aceita o bb (D31)', () => {
  it('bb passa; vizinhos continuam fora', () => {
    for (const ok of ['bb', 'rookie', 'ultra', 'mega-power']) expect(VALID_FORM_ID.test(ok), ok).toBe(true);
    for (const no of ['bb-power', 'BB', 'baby', 'bbb', '']) expect(VALID_FORM_ID.test(no), no).toBe(false);
  });
});

describe('VALID_FORM_ID aceita a forma alternativa por elemento (05/11/2026)', () => {
  it('forma@elemento só fora do rookie/bb', () => {
    for (const ok of ['champion-benevolence@fire', 'ultra@shadow_ice']) expect(VALID_FORM_ID.test(ok), ok).toBe(true);
    for (const no of ['rookie@fire', 'bb@fire', 'mega-power@', 'mega-power@Fire', 'mega-power@a']) expect(VALID_FORM_ID.test(no), no).toBe(false);
  });
});
