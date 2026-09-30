import { describe, it, expect } from 'vitest';
import { HELPLINE_DIRECTORY_URL, HELPLINE_TEL_BR, helplineNumbers, helplineDirectoryLabel, notProfessionalHelp } from './supportLine';

/** Os números de uma tela de crise não podem escorregar: valores travados. */
describe('supportLine — dono único dos números de apoio', () => {
  it('PT: CVV 188; EN: 988 e 116 123', () => {
    expect(helplineNumbers(true)).toContain('188');
    expect(helplineNumbers(false)).toContain('988');
    expect(helplineNumbers(false)).toContain('116 123');
    expect(HELPLINE_TEL_BR).toBe('tel:188');
  });
  it('o diretório internacional cobre os outros países', () => {
    expect(HELPLINE_DIRECTORY_URL).toBe('https://findahelpline.com');
    expect(helplineDirectoryLabel(false)).toBe('Find a helpline');
  });
  it('nunca promete tratamento', () => {
    for (const pt of [true, false]) expect(notProfessionalHelp(pt)).not.toMatch(/trata|cura|treat|cure/i);
  });
});
