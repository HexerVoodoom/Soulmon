import { describe, it, expect } from 'vitest';
import { VALID_FORM_ID } from './_aiGuard.js';

describe('VALID_FORM_ID aceita o bb (D31)', () => {
  it('bb passa; vizinhos continuam fora', () => {
    for (const ok of ['bb', 'rookie', 'ultra', 'mega-power']) expect(VALID_FORM_ID.test(ok), ok).toBe(true);
    for (const no of ['bb-power', 'BB', 'baby', 'bbb', '']) expect(VALID_FORM_ID.test(no), no).toBe(false);
  });
});
