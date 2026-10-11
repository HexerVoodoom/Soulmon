// `scripts/liberar-forma.mjs` (gate adversarial C2).
import { describe, it, expect } from 'vitest';
import { parseArgs, APP_URL_PADRAO } from '../scripts/liberar-forma.mjs';

describe('liberar-forma: argumentos', () => {
  it('saveId + formId válidos; URL padrão do Worker', () => {
    expect(parseArgs(['abcdefgh12345678', 'mega-power'])).toEqual({ id: 'abcdefgh12345678', formId: 'mega-power', url: APP_URL_PADRAO });
  });
  it('recusa forma inventada e saveId inválido', () => {
    expect(() => parseArgs(['abcdefgh12345678', 'mega-fogo'])).toThrow(/formId/);
    expect(() => parseArgs(['x', 'rookie'])).toThrow(/saveId/);
  });
});
