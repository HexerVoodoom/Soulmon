// @vitest-environment jsdom
/**
 * Teste de render do `HomeHud`.
 *
 * Três guardrails, e nenhum deles é estético:
 *
 * 1. **Orçamento de leituras da Home** (PLANO-DESIGN §5.1). O contador de
 *    Créditos SAIU daqui para abrir espaço ao Nível de Vínculo. Se alguém
 *    devolver uma moeda ao HUD sem tirar outra leitura, o teto de 5 estoura em
 *    silêncio — e foi assim que a Home chegou a nove superfícies.
 * 2. **As três moedas nunca se misturam visualmente.** Bits e Créditos já
 *    apareceram com o mesmo ícone 💎 e o jogador não tinha como saber que o
 *    que pagou com dinheiro real não comprava nada na loja. Com moeda NENHUMA
 *    no HUD, o bug fica estruturalmente impossível aqui.
 * 3. **UMA leitura de HP/energia na Home** (canvas Home, achado 1 / DECISÕES
 *    §19, 16/09/2026). Este componente desenhava a barra segmentada DOM
 *    (`.sm2-seg-blk`) enquanto o `CompanionHUD` montava a `VisorBar` em pixel
 *    dentro do vidro — o mesmo número duas vezes na mesma tela. A DOM saiu;
 *    o guard dos `.sm2-seg-blk` passa a valer PELO AVESSO: se um bloco voltar
 *    a nascer aqui, a duplicidade voltou.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { HomeHud } from './HomeHud';

describe('HomeHud — a leitura de HP/energia mora no vidro, não aqui', () => {
  it('não desenha NENHUM medidor DOM (a `VisorBar` do CompanionHUD é a única leitura)', () => {
    const { container } = renderWithCss(<HomeHud language="pt-BR" />);
    expect(container.querySelectorAll('.sm2-seg-blk')).toHaveLength(0);
    expect(container.querySelectorAll('.sm2-meter')).toHaveLength(0);
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/Health|Vida|Energy|Energia/);
  });

  it('a marca é o <h1> da Home, em Cinzel (display), e é o único heading', () => {
    const { container } = renderWithCss(<HomeHud language="en-US" />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Soulmon');
    expect(container.querySelectorAll('h1, h2, h3')).toHaveLength(1);
    const fam = getComputedStyle(h1!).fontFamily;
    expect(fam, 'a marca é a fonte display (Cinzel), nunca Silkscreen fora do vidro').toMatch(/sm2-font-display|Cinzel/);
    expect(fam).not.toMatch(/Silkscreen|font-pixel/);
  });
});

describe('HomeHud — o orçamento de leituras da Home', () => {
  it('ORÇAMENTO: nenhuma moeda no HUD — Créditos saíram para abrir o Vínculo', () => {
    const { container } = renderWithCss(<HomeHud language="pt-BR" focusSealed />);
    expect(container.textContent).not.toMatch(/Cr[ée]dito|Credit/i);
    expect(container.textContent).not.toMatch(/\bBits?\b/i);
    expect(container.textContent).not.toMatch(/Emblema|Emblem/i);
  });

  it('ORÇAMENTO: nenhuma leitura numérica sobra no topo (zero dígitos)', () => {
    const { container } = renderWithCss(<HomeHud language="en-US" focusSealed />);
    expect(container.textContent).not.toMatch(/\d/);
  });

  it('o único desenho além do selo é o LOGO (C1, 01/10/2026) — decorativo, o nome está no <h1>', () => {
    const { container } = renderWithCss(<HomeHud language="pt-BR" focusSealed />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute('data-home-logo')).not.toBeNull();
    expect(imgs[0].getAttribute('alt')).toBe('');
    expect(container.querySelectorAll('.sm2-icon').length).toBe(1);
  });

  it('sem o selo, o HUD é só o logo — e o nome acessível continua "Soulmon"', () => {
    const { container } = renderWithCss(<HomeHud language="pt-BR" />);
    expect(container.querySelectorAll('.sm2-icon').length).toBe(0);
    expect(container.querySelectorAll('img').length).toBe(1);
    expect(container.textContent?.trim()).toBe('Soulmon');
  });

  it('par PT/EN do selo', () => {
    const pt = renderWithCss(<HomeHud language="pt-BR" focusSealed />);
    expect(screen.getByText('foco do dia')).toBeTruthy();
    pt.unmount();
    renderWithCss(<HomeHud language="en-US" focusSealed />);
    expect(screen.getByText('focus done')).toBeTruthy();
  });
});
