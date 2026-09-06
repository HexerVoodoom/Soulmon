// @vitest-environment jsdom
/**
 * A copy da oferta — WP5.6 (C-S1) e WP5.9 (decisão D12).
 *
 * Três consertos que só fazem sentido juntos:
 *
 * 1. **O título vendia uma feature** ("Soulmon completo") num produto cuja tese
 *    é uma relação. Passa a dizer a promessa: seu Soulmon cresce porque você
 *    cresce.
 * 2. **O terceiro perk vendia gasto FUTURO dentro do pedido de dinheiro**
 *    ("Reroll liberado — custa Créditos"). Saiu. No lugar, o modelo do Finch:
 *    o que se compra é a continuidade do app, dita sem drama.
 * 3. **A tela prometia paridade que não existe** (D12): dizia que os três
 *    caminhos da árvore demo "levam ao mesmo lugar", como se fosse
 *    equivalência, quando `getDemoCreatureStages` monta três galhos com o mesmo
 *    nome e a mesma descrição. A forma existe; a diferença não.
 *
 * E a linha final — "pagar nunca deixa sua criatura mais forte" — é o teste
 * mais importante deste arquivo, porque ela é uma AFIRMAÇÃO VERIFICÁVEL sobre o
 * resto do código. O guarda do sustento pediu essa frase e ele mesmo a barrou
 * enquanto os Créditos compravam coração; as duas vendas saíram no mesmo lote
 * (D7+D15) e só por isso ela pode ser dita. Se alguém reintroduzir qualquer
 * venda que toque HP, é esta frase que passa a mentir — e é o
 * `x6Updaters.contract.test.ts` que cai junto.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { UnlockAccountModal } from './UnlockAccountModal';

const render = (pt: boolean, reason: 'task-limit' | 'evolution' = 'evolution') => {
  renderWithCss(
    <UnlockAccountModal
      language={pt ? 'pt-BR' : 'en-US'}
      reason={reason}
      onUnlocked={() => {}}
      onClose={() => {}}
    />,
  );
  return document.body.textContent ?? '';
};

describe('UnlockAccountModal — a copy da oferta (WP5.6, WP5.9)', () => {
  it('o título é a promessa, não a feature', () => {
    expect(render(true)).toContain('Seu Soulmon cresce porque você cresce');
    document.body.innerHTML = '';
    expect(render(false)).toContain('Your Soulmon grows because you do');
  });

  it('a oferta não vende gasto futuro dentro de si mesma', () => {
    for (const pt of [true, false]) {
      const texto = render(pt);
      expect(texto, 'a oferta voltou a vender Créditos dentro da oferta').not.toMatch(/Reroll|reroll/);
      expect(texto).not.toMatch(/Créditos|Credits/);
      document.body.innerHTML = '';
    }
  });

  it('D12: a árvore demo não é apresentada como equivalente à do oráculo', () => {
    const pt = render(true, 'evolution');
    expect(pt, 'a promessa de paridade voltou').not.toContain('mesmo lugar');
    expect(pt).toContain('terminam na mesma criatura');
    document.body.innerHTML = '';
    const en = render(false, 'evolution');
    expect(en).not.toContain('lead to the same place');
    expect(en).toContain('end at the same creature');
  });

  it('a linha "pagar nunca deixa mais forte" está nos dois idiomas', () => {
    expect(render(true)).toContain('Pagar nunca deixa sua criatura mais forte.');
    document.body.innerHTML = '';
    expect(render(false)).toContain('Paying never makes your creature stronger.');
  });

  it('e ela é VERDADE: nada em Créditos toca HP', () => {
    // O teste da frase não vale nada sem o teste do fato. Se esta parte cair, a
    // linha acima virou propaganda enganosa dentro do pedido de dinheiro.
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    expect(app).not.toMatch(/handleInstantHealWithCredits/);
    const shop = readFileSync(resolve(process.cwd(), 'src/utils/shop.ts'), 'utf-8');
    expect(shop.slice(shop.indexOf('SHOP_ITEMS'), shop.indexOf('SPECIAL_ITEMS')))
      .not.toMatch(/id: 'heart-item'/);
  });

  it('o convite do teto de criação continua inteiro', () => {
    const texto = render(true, 'task-limit');
    expect(texto).toMatch(/hábitos ativos/);
    expect(texto).toContain('Desbloquear');
  });
});
