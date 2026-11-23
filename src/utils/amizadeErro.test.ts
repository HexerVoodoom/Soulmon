import { describe, it, expect } from 'vitest';
import { mensagemFalhaConvite } from './amizadeErro';

const GENERICA_PT = 'Não deu para adicionar agora. Tente de novo.';
const GENERICA_EN = "Couldn't add that friend right now. Try again.";

describe('§346 mensagemFalhaConvite', () => {
  it('429 do teto vira "espere um minuto", não a genérica', () => {
    expect(mensagemFalhaConvite(new Error('rate limited'), true)).toMatch(/Espere um minuto/);
    expect(mensagemFalhaConvite(new Error('rate limited'), false)).toMatch(/Wait a minute/);
    expect(mensagemFalhaConvite(new Error('request failed (429)'), true)).toMatch(/Espere um minuto/);
  });
  it('cada erro conhecido do servidor tem texto próprio', () => {
    const casos = ['friend not found', 'too many pending invites', 'friend limit (20)', 'cannot befriend yourself', 'profile not found', 'unauthenticated', 'forbidden', 'beta-closed', 'Failed to fetch'];
    for (const c of casos) {
      expect(mensagemFalhaConvite(new Error(c), true)).not.toBe(GENERICA_PT);
      expect(mensagemFalhaConvite(new Error(c), false)).not.toBe(GENERICA_EN);
    }
  });
  it('desconhecido de verdade continua na genérica', () => {
    expect(mensagemFalhaConvite(new Error('request failed (500)'), true)).toBe(GENERICA_PT);
    expect(mensagemFalhaConvite(new Error('resposta ilegível (200)'), false)).toBe(GENERICA_EN);
    expect(mensagemFalhaConvite(undefined, false)).toBe(GENERICA_EN);
  });
});
