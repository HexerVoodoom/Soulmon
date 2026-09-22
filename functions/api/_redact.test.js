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
    // QA rodada 1, achado 06 §6.1 — passavam inteiros até 22/09/2026.
    ['celular sem DDD, 9 dígitos com hífen', 'me liga 98765-4321 depois', '98765-4321', 'phone'],
    ['celular sem DDD, 9 dígitos com espaço', 'me liga 98765 4321 depois', '98765 4321', 'phone'],
    ['fixo sem DDD, 8 dígitos', 'ligue 3456-7890 à tarde', '3456-7890', 'phone'],
    ['CEP', 'moro no 01310-100 perto da av', '01310-100', 'cep'],
    ['CEP do enunciado', 'cep 12345-678', '12345-678', 'cep'],
    ['data dd/mm/aaaa', 'nasci em 21/09/1990 e quero', '21/09/1990', 'date'],
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

  it('as regras novas não comem número curto do dia a dia (ano, hora, quantidade, R$)', () => {
    const anoQueVem = new Date().getUTCFullYear() + 1;
    for (const frase of [
      'em 2026 quero ler 12 livros',
      'acordar às 06:30 e dormir 22h',
      'economizar R$ 1.500 até dezembro',
      'fazer 10000 passos por dia',
      'meta: 3/4 dos dias',
      // QA rodada 2 (`01-seguranca-r2` §7) — falsos positivos que mastigavam a meta:
      'entre 2020-2024 eu parei; quero voltar',
      'treinar das 1000-1200 e das 1900 2100',
      `terminar o curso até 31/12/${anoQueVem}`,
      'começar dia 01/03/2026 sem falta',
      'hoje é 20260921 no meu diário',
    ]) {
      const { text, redactions } = minimizeForAi(frase);
      expect(text, frase).toBe(frase);
      expect(redactionCount(redactions), frase).toBe(0);
    }
  });

  it('os rótulos das regras novas são os declarados — o log conta por tipo', () => {
    const { redactions, text } = minimizeForAi('cep 12345-678, nasci 01/02/1990, zap 98765-4321');
    expect(redactions).toMatchObject({ cep: 1, date: 1, phone: 1 });
    expect(text).toBe('cep [cep], nasci [data], zap [telefone]');
  });

  it('data ANTIGA continua sendo tratada como nascimento; recente é meta (QA R2)', () => {
    const ano = new Date().getUTCFullYear();
    expect(minimizeForAi(`nasci em 21/09/${ano - 30}`).text).toBe('nasci em [data]');
    expect(minimizeForAi(`nasci em 21/09/${ano - 6}`).text).toBe('nasci em [data]');
    expect(minimizeForAi(`até 21/09/${ano - 5}`).text).toBe(`até 21/09/${ano - 5}`);
    expect(minimizeForAi(`até 21/09/${ano}`).text).toBe(`até 21/09/${ano}`);
  });

  it('9 dígitos contíguos sem separador passam — preço declarado da regra R2', () => {
    // `987654321` era pego pela regra antiga junto com `20260921` e `1000-1200`.
    // Exigir separador é o que salva o texto útil; o formato com DDD e a
    // "sequência longa" (>= 11 dígitos) continuam cobertos.
    expect(minimizeForAi('me liga 987654321 depois').text).toBe('me liga 987654321 depois');
    expect(minimizeForAi('me liga 11987654321 depois').text).not.toContain('11987654321');
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
