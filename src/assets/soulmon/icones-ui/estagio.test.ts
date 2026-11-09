import { describe, it, expect } from 'vitest';
import { estagioIcone, ESTAGIOS_COM_ICONE } from './estagio';

describe('estagioIcone', () => {
  it('os 5 estágios têm arte nos dois sets e o bebê não tem', () => {
    for (const e of ESTAGIOS_COM_ICONE) {
      expect(estagioIcone(e, 'creme')).toBeTruthy();
      expect(estagioIcone(e, 'branco')).toBeTruthy();
      expect(estagioIcone(e, 'creme')).not.toBe(estagioIcone(e, 'branco'));
    }
    for (const x of ['bb', 'egg', 'baby', 'selvagem', '', undefined, null]) expect(estagioIcone(x as string)).toBeUndefined();
  });
  it('id de forma resolve pelo nível', () => {
    expect(estagioIcone('mega-power')).toBe(estagioIcone('mega'));
    expect(estagioIcone('ultimate-harmony')).toBe(estagioIcone('ultimate'));
    expect(estagioIcone('mega-power')).not.toBe(estagioIcone('champion-power'));
  });
});
