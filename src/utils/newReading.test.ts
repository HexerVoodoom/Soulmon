/**
 * WP5.7 (decisão H.4) — a leitura vem das respostas, não de um dado.
 *
 * O reroll cobrava 50 Créditos de dinheiro real e sorteava a criatura com
 * `Math.random()`. O `termos.html` §5 chamava a peça, com estas palavras, de
 * "sorteio pago" — a definição operacional de gacha, e a **única violação
 * declarada** da lista de proibições que ainda estava de pé no código.
 *
 * O problema não é o preço: é que pagar por um resultado aleatório é pagar
 * para jogar de novo, e o produto inteiro se apoia em "a criatura veio de
 * VOCÊ". O dado desmentia a promessa exatamente onde ela custa mais caro.
 *
 * O que este arquivo trava é a propriedade que substitui o dado: **mesma
 * entrada, mesma saída, em qualquer aparelho**.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readingSeed, answersChanged } from './newReading';
import { ORACLE_QUESTIONS } from './oracle';

const respostasDe = (escolha: (i: number) => number) =>
  Object.fromEntries(ORACLE_QUESTIONS.map((q, i) => [q.id, q.options[escolha(i) % q.options.length].id]));

const A = respostasDe(() => 0);
const B = respostasDe(() => 1);

describe('a semente da Nova Leitura (WP5.7 / H.4)', () => {
  it('é DETERMINÍSTICA: mesma resposta e mesma leitura dão a mesma semente', () => {
    expect(readingSeed(A, 1)).toBe(readingSeed(A, 1));
    expect(readingSeed(A, 7)).toBe(readingSeed(A, 7));
  });

  it('mudar uma resposta muda a criatura — é esse o gesto que se paga', () => {
    expect(readingSeed(A, 1)).not.toBe(readingSeed(B, 1));
  });

  it('não depende da ordem das chaves do objeto', () => {
    // Um save que voltou da nuvem como JSON não garante ordem de chave. Se a
    // semente dependesse dela, a mesma pessoa receberia criaturas diferentes
    // em aparelhos diferentes — e ninguém entenderia por quê.
    const invertido = Object.fromEntries(Object.entries(A).reverse());
    expect(readingSeed(invertido, 3)).toBe(readingSeed(A, 3));
  });

  it('o contador de leituras separa duas leituras com as MESMAS respostas', () => {
    expect(readingSeed(A, 1)).not.toBe(readingSeed(A, 2));
  });

  it('cabe em 31 bits e nunca é negativa (é o que o motor do oráculo espera)', () => {
    for (const [ans, n] of [[A, 0], [B, 5], [{}, 99]] as const) {
      const s = readingSeed(ans as Record<string, string>, n);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(2 ** 31);
    }
  });

  it('respostas ausentes não quebram — e resposta vazia é uma resposta', () => {
    expect(() => readingSeed(undefined, 1)).not.toThrow();
    expect(readingSeed({}, 1)).not.toBe(readingSeed(A, 1));
  });

  it('contador negativo ou quebrado cai em zero em vez de virar NaN', () => {
    expect(readingSeed(A, -5)).toBe(readingSeed(A, 0));
    expect(Number.isFinite(readingSeed(A, 1.9))).toBe(true);
  });
});

describe('a mudança de resposta é o que autoriza a cobrança', () => {
  it('detecta mudança em qualquer uma das seis', () => {
    expect(answersChanged(A, A)).toBe(false);
    expect(answersChanged(A, B)).toBe(true);
    const soUma = { ...A, [ORACLE_QUESTIONS[3].id]: ORACLE_QUESTIONS[3].options[1].id };
    expect(answersChanged(A, soUma)).toBe(true);
  });

  it('ausência de resposta conta como mudança quando a outra tem', () => {
    expect(answersChanged({}, A)).toBe(true);
    expect(answersChanged(A, {})).toBe(true);
    expect(answersChanged(undefined, undefined)).toBe(false);
  });
});

describe('não sobrou aleatoriedade paga em lugar nenhum', () => {
  it('o módulo da leitura não usa `Math.random`', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/utils/newReading.ts'), 'utf-8');
    expect(fonte).not.toMatch(/Math\.random/);
  });

  it('o handler do App gera a semente pela leitura, não por sorteio', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    const i = app.indexOf('const handleNewReading');
    expect(i, '`handleNewReading` sumiu — se mudou de nome, atualize este guard').toBeGreaterThan(0);
    const corpo = app.slice(i, app.indexOf('\n  }, [', i));
    expect(corpo).toMatch(/readingSeed\(/);
    expect(corpo, 'o sorteio pago voltou').not.toMatch(/Math\.random/);
  });
});
