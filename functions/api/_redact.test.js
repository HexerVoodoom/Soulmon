import { describe, it, expect } from 'vitest';
import { minimizeForAi, redactionCount } from './_redact.js';

describe('minimizeForAi — o que NÃO pode sair da nossa borda', () => {
  const casos = [
    ['e-mail', 'me chama em joao.silva+app@gmail.com', 'joao.silva+app@gmail.com', 'email'],
    ['telefone BR', 'meu zap é (11) 98765-4321 ok', '98765-4321', 'phone'],
    ['CPF', 'cpf 123.456.789-09 aqui', '123.456.789-09', 'cpf'],
    ['CNPJ', 'empresa 12.345.678/0001-95', '12.345.678/0001-95', 'cnpj'],
    ['link', 'olha https://meu.site/segredo?token=abc', 'meu.site', 'url'],
    ['@perfil', 'meu insta é @joao_silva.99', '@joao_silva.99', 'handle'],
    ['sequência longa', 'cartão 4111 1111 1111 1111', '4111 1111 1111 1111', null],
  ];

  for (const [nome, entrada, vazamento] of casos) {
    it(`${nome} não chega ao Groq`, () => {
      const { text, redactions } = minimizeForAi(entrada);
      expect(text).not.toContain(vazamento);
      expect(redactionCount(redactions)).toBeGreaterThan(0);
    });
  }

  it('o texto útil sobrevive — minimizar não pode virar mudo', () => {
    const { text, redactions } = minimizeForAi('quero correr 3 vezes por semana');
    expect(text).toBe('quero correr 3 vezes por semana');
    expect(redactionCount(redactions)).toBe(0);
  });

  it('o conteúdo sensível de saúde CONTINUA passando — e isso é declarado, não acidente', () => {
    // Regex não resolve LGPD. Este caso existe para que ninguém leia a camada
    // como "agora pode mandar qualquer coisa": o que ela remove é identificador
    // direto, e a base legal/aviso continuam sendo item do dono.
    const { text } = minimizeForAi('estou em depressão e não consigo levantar');
    expect(text).toContain('depressão');
  });

  it('corta no teto e sinaliza (custo de token e superfície de exposição)', () => {
    const { text, truncated } = minimizeForAi('a'.repeat(5000), 500);
    expect(text).toHaveLength(500);
    expect(truncated).toBe(true);
  });

  it('entrada não-string / vazia / nula não explode', () => {
    expect(minimizeForAi(null).text).toBe('');
    expect(minimizeForAi(undefined).text).toBe('');
    expect(minimizeForAi(42).text).toBe('42');
    expect(minimizeForAi({}).text).toBe('[object Object]');
  });

  it('vários identificadores na mesma frase são todos removidos', () => {
    const { text, redactions } = minimizeForAi('sou o joao@x.com, (11) 98765-4321, veja www.x.com');
    expect(text).not.toMatch(/joao@x\.com|98765-4321|www\.x\.com/);
    expect(redactionCount(redactions)).toBeGreaterThanOrEqual(3);
  });
});
