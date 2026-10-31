import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QA L05-05 (decisão do dono, 21/10/2026): o aceite dizia "não pedimos nem guardamos sua data de
 * nascimento" e o ritual pede a data logo depois. O texto agora diz que PEDIMOS, para quê e onde fica
 * (só no aparelho, como a Política de Privacidade). TERMS_VERSION/PRIVACY_VERSION não mudam.
 */
describe('texto do consentimento sobre a data de nascimento', () => {
  const src = readFileSync(new URL('./SoulmonOnboarding.tsx', import.meta.url), 'utf8');
  it('não nega mais que pedimos a data (PT e EN)', () => {
    expect(src).not.toContain('Não pedimos nem guardamos sua data de nascimento');
    expect(src).not.toContain("We don't ask for or store your date of birth");
  });
  it('diz que pedimos, para o ritual do Oráculo, e que fica só no aparelho (PT e EN)', () => {
    expect(src).toContain('Mais adiante pedimos sua data de nascimento, para o ritual do Oráculo; ela fica só no seu aparelho.');
    expect(src).toContain('Further on we ask for your date of birth, for the Oracle ritual; it stays only on your device.');
  });
  it('as versões de termos e política não foram mexidas', () => {
    const consent = readFileSync(new URL('../utils/consent.ts', import.meta.url), 'utf8');
    expect(consent).toMatch(/TERMS_VERSION = '2026-10-26'/);
    expect(consent).toMatch(/PRIVACY_VERSION = '2026-10-30'/);
  });
});
