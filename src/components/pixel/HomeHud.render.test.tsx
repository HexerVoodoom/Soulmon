// @vitest-environment jsdom
/**
 * Teste de render do `HomeHud`.
 *
 * Dois guardrails, e nenhum deles é estético:
 *
 * 1. **Orçamento de leituras da Home** (PLANO-DESIGN §5.1). O contador de
 *    Créditos SAIU daqui para abrir espaço ao Nível de Vínculo. Se alguém
 *    devolver uma moeda ao HUD sem tirar outra leitura, o teto de 5 estoura em
 *    silêncio — e foi assim que a Home chegou a nove superfícies.
 * 2. **As três moedas nunca se misturam visualmente.** Bits e Créditos já
 *    apareceram com o mesmo ícone 💎 e o jogador não tinha como saber que o
 *    que pagou com dinheiro real não comprava nada na loja. Com moeda NENHUMA
 *    no HUD, o bug fica estruturalmente impossível aqui.
 *
 * E a leitura de HP/energia: blocos DISCRETOS, com meio bloco para a fração de
 * 0,5 que a regra do carinho produz.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { HomeHud } from './HomeHud';

const base = { energyPoints: 2, maxEnergyPoints: 4 };

describe('HomeHud — medidores segmentados', () => {
  it('a barra de energia mostra o valor real (2 de 4 blocos acesos)', () => {
    const { container } = renderWithCss(<HomeHud {...base} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(container.querySelectorAll('.sm2-seg-blk')).toHaveLength(4);
    expect(container.querySelectorAll('.sm2-seg-on')).toHaveLength(2);
  });

  it('energia 0/0 (estágio sem requisito) não quebra nem acende bloco', () => {
    const { container } = renderWithCss(<HomeHud energyPoints={0} maxEnergyPoints={0} />);
    expect(container.querySelectorAll('.sm2-seg-on')).toHaveLength(0);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('HP tem medidor próprio, com o mesmo peso da energia', () => {
    const { container } = renderWithCss(
      <HomeHud {...base} healthPoints={2} maxHealthPoints={3} language="pt-BR" />,
    );
    const medidores = Array.from(container.querySelectorAll('.sm2-meter'));
    expect(medidores.length).toBe(2);
    const vida = medidores.find(m => m.textContent?.includes('Vida'))!;
    expect(vida.textContent).toContain('2/3');
    expect(vida.querySelectorAll('.sm2-seg-blk')).toHaveLength(3);
    expect(vida.querySelectorAll('.sm2-seg-on')).toHaveLength(2);
  });

  it('MEIA UNIDADE = MEIO BLOCO — a cura por carinho não é arredondada', () => {
    // `PixelSegmentedBar` faz `Math.round`, e 1,5/3 acenderia DOIS blocos
    // inteiros: a barra mentiria sobre a regra (HP aceita frações de 0,5).
    const { container } = renderWithCss(
      <HomeHud {...base} healthPoints={1.5} maxHealthPoints={3} language="en-US" />,
    );
    const vida = Array.from(container.querySelectorAll('.sm2-meter'))
      .find(m => m.textContent?.includes('Health'))!;
    expect(vida.querySelectorAll('.sm2-seg-on')).toHaveLength(1);
    expect(vida.querySelectorAll('.sm2-seg-half')).toHaveLength(1);
  });

  it('o número que muda usa tabular-nums (senão o valor "dança" a cada tick)', () => {
    const { container } = renderWithCss(
      <HomeHud {...base} healthPoints={2} maxHealthPoints={3} />,
    );
    expect(container.querySelectorAll('.sm2-meter-value.sm2-num').length).toBe(2);
  });

  it('sem HP declarado (chamador antigo) o HUD não inventa um medidor vazio', () => {
    const { container } = renderWithCss(<HomeHud {...base} />);
    expect(container.textContent).not.toMatch(/Health|Vida/);
    expect(container.querySelectorAll('.sm2-meter').length).toBe(1);
  });
});

describe('HomeHud — o orçamento de leituras da Home', () => {
  it('ORÇAMENTO: nenhuma moeda no HUD — Créditos saíram para abrir o Vínculo', () => {
    const { container } = renderWithCss(
      <HomeHud {...base} healthPoints={3} maxHealthPoints={3} language="pt-BR" />,
    );
    expect(container.textContent).not.toMatch(/Cr[ée]dito|Credit/i);
    expect(container.textContent).not.toMatch(/\bBits?\b/i);
    expect(container.textContent).not.toMatch(/Emblema|Emblem/i);
  });

  it('ORÇAMENTO: as leituras numéricas do HUD são exatamente duas (HP e energia)', () => {
    const { container } = renderWithCss(
      <HomeHud {...base} healthPoints={3} maxHealthPoints={3} language="en-US" />,
    );
    expect(container.querySelectorAll('.sm2-meter-value').length).toBe(2);
  });

  it('nenhum PNG sobrou no HUD — os ícones são glifos da Material Symbols', () => {
    const { container } = renderWithCss(
      <HomeHud {...base} healthPoints={3} maxHealthPoints={3} language="pt-BR" />,
    );
    expect(container.querySelectorAll('img').length).toBe(0);
    expect(container.querySelectorAll('.sm2-icon').length).toBeGreaterThan(0);
  });

  it('par PT/EN dos rótulos', () => {
    const pt = renderWithCss(<HomeHud {...base} healthPoints={3} maxHealthPoints={3} language="pt-BR" />);
    expect(screen.getByText('Vida')).toBeTruthy();
    expect(screen.getByText('Energia')).toBeTruthy();
    pt.unmount();
    renderWithCss(<HomeHud {...base} healthPoints={3} maxHealthPoints={3} language="en-US" />);
    expect(screen.getByText('Health')).toBeTruthy();
    expect(screen.getByText('Energy')).toBeTruthy();
  });
});
