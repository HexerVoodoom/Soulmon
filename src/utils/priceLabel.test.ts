/**
 * O PREÇO NÃO PODE SER OPACO — nem sem moeda, nem só em real.
 *
 * Duas regras, e as duas nasceram de achados reais:
 *
 *  1. **O fallback se identifica em inglês.** "R$ 29,90" é lido como real por
 *     quem já conhece o real, e por mais ninguém. Achado na sessão de QA de
 *     08/09/2026, atravessando o onboarding com o idioma em inglês.
 *  2. **O preço da LOJA nunca recebe carimbo de moeda.** Ele já vem formatado
 *     na moeda do país da conta; escrever "BRL" ali transformaria um preço
 *     correto numa mentira. Esta é a metade que um teste distraído esqueceria.
 *
 * E há a terceira, que é a razão de o arquivo existir: os PACOTES DE CRÉDITO
 * passaram a usar o mesmo caminho do desbloqueio. O WP5.8 consertou o preço
 * opaco do desbloqueio e deixou os pacotes imprimindo a constante em real para
 * o planeta inteiro — mesmo defeito, mesma tela, um andar abaixo.
 */
import { describe, it, expect } from 'vitest';
import { precoComMoeda, MOEDA_DO_FALLBACK } from './priceLabel';
import { CREDIT_PACKS, FULL_UNLOCK_PRICE_LABEL } from './monetization';

describe('precoComMoeda', () => {
  it('em inglês, o FALLBACK diz de que moeda é', () => {
    expect(precoComMoeda(FULL_UNLOCK_PRICE_LABEL, true, false))
      .toBe(`${FULL_UNLOCK_PRICE_LABEL} ${MOEDA_DO_FALLBACK}`);
  });

  it('em português, não carimba nada — a moeda é óbvia e o marcador é ruído', () => {
    expect(precoComMoeda(FULL_UNLOCK_PRICE_LABEL, true, true)).toBe(FULL_UNLOCK_PRICE_LABEL);
  });

  it('🔴 o preço vindo da LOJA nunca é carimbado, em nenhum idioma', () => {
    // O Play devolve o preço já na moeda de quem está olhando. Carimbar "BRL"
    // sobre "$5.99" seria inventar uma cobrança que não existe.
    expect(precoComMoeda('$5.99', false, false)).toBe('$5.99');
    expect(precoComMoeda('$5.99', false, true)).toBe('$5.99');
    expect(precoComMoeda('¥800', false, false)).toBe('¥800');
  });

  it('a moeda declarada é a do produto publicado', () => {
    // Se um dia o produto for publicado noutra moeda, é aqui que se percebe:
    // os rótulos escritos à mão e o marcador têm de contar a mesma história.
    expect(MOEDA_DO_FALLBACK).toBe('BRL');
    expect(FULL_UNLOCK_PRICE_LABEL.startsWith('R$')).toBe(true);
    for (const p of CREDIT_PACKS) expect(p.priceLabel.startsWith('R$')).toBe(true);
  });
});
