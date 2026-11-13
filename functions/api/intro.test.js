/**
 * Interruptor POR PESSOA da intro narrativa (`INTRO_NARRATIVA_TESTERS`), separado de `ONBOARDING_VELADO_TESTERS`.
 */
import { describe, it, expect } from 'vitest';
import { introTesterHash, isIntroTester } from './_intro.js';
import { veladoTesterHash } from './_velado.js';

describe('testers da intro narrativa', () => {
  it('lista vazia ou ausente = ninguém', async () => {
    expect(await isIntroTester({}, 'a@b.c')).toBe(false);
    expect(await isIntroTester({ INTRO_NARRATIVA_TESTERS: '' }, 'a@b.c')).toBe(false);
    expect(await isIntroTester(undefined, 'a@b.c')).toBe(false);
  });

  it('o hash do e-mail (normalizado) na lista liga; outro e-mail não', async () => {
    const h = await introTesterHash('  Pessoa@Exemplo.com ');
    const env = { INTRO_NARRATIVA_TESTERS: `outro, ${h}` };
    expect(await isIntroTester(env, 'pessoa@exemplo.com')).toBe(true);
    expect(await isIntroTester(env, 'alguem@exemplo.com')).toBe(false);
    expect(await isIntroTester(env, '')).toBe(false);
  });

  it('a lista do Velado NÃO liga a intro, nem o contrário (interruptores independentes)', async () => {
    const hv = await veladoTesterHash('pessoa@exemplo.com');
    const hi = await introTesterHash('pessoa@exemplo.com');
    expect(hv).not.toBe(hi);
    expect(await isIntroTester({ ONBOARDING_VELADO_TESTERS: hv }, 'pessoa@exemplo.com')).toBe(false);
    expect(await isIntroTester({ INTRO_NARRATIVA_TESTERS: hv }, 'pessoa@exemplo.com')).toBe(false);
  });
});
