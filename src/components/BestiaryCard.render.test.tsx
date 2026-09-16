// @vitest-environment jsdom
/**
 * WP4.6(b) — o bestiário deixou de ser dado morto.
 *
 * `bestiary` era escrito no save de todo jogador e lido por ninguém: até 36
 * strings crescendo no KV de produção sem uma única tela. Este teste é a régua
 * de que ele CHEGA aos olhos — e das duas regras de conteúdo que o acervo tem.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { BestiaryCard } from './BestiaryCard';

describe('BestiaryCard', () => {
  it('mostra silhueta para o que ainda não foi encontrado', () => {
    // Silhueta e não espaço vazio: "existe e você ainda não viu" é o que faz a
    // coleção ser coleção; vazio não diz nada.
    const { container } = renderWithCss(<BestiaryCard encountered={[]} language="pt-BR" />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs.every(i => (i as HTMLImageElement).style.filter.includes('brightness(0)'))).toBe(true);
  });

  it('revela o que já foi enfrentado, e só isso', () => {
    const { container } = renderWithCss(
      <BestiaryCard encountered={['ignar-rookie']} language="pt-BR" />,
    );
    const revelados = [...container.querySelectorAll('img')]
      .filter(i => !(i as HTMLImageElement).style.filter.includes('brightness(0)'));
    expect(revelados).toHaveLength(1);
  });

  it('a contagem é de COLEÇÃO — nunca percentual nem "faltam N"', () => {
    const { container } = renderWithCss(
      <BestiaryCard encountered={['ignar-rookie', 'lumel-mega']} language="pt-BR" />,
    );
    const texto = container.textContent ?? '';
    expect(texto).toContain('2 de 36');
    expect(texto).not.toMatch(/%/);
    expect(texto).not.toMatch(/falta|restam/i);
  });

  it('os dois idiomas', () => {
    const { container } = renderWithCss(<BestiaryCard encountered={[]} language="en-US" />);
    expect(container.textContent).toContain('of 36');
    expect(container.textContent).toContain('Encounters');
  });
});
