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
    // Canvas §27 D-S6: silhueta = `mask-image` do PNG em tinta derivada do
    // vidro (`.sm2-stats-sil`), nunca `filter: brightness(0) opacity(.35)`.
    const { container } = renderWithCss(<BestiaryCard encountered={[]} language="pt-BR" />);
    const silhuetas = [...container.querySelectorAll('[data-silhouette]')];
    expect(silhuetas).toHaveLength(36);
    expect(container.querySelectorAll('img')).toHaveLength(0);
    for (const s of silhuetas) {
      expect((s as HTMLElement).style.maskImage).toMatch(/^url\(/);
      expect((s as HTMLElement).style.filter).toBe('');
      expect(s.closest('[data-mini-glass]')).not.toBeNull();
    }
  });

  it('revela o que já foi enfrentado, e só isso', () => {
    const { container } = renderWithCss(
      <BestiaryCard encountered={['ignar-rookie']} language="pt-BR" />,
    );
    // O visto é um `<img>` decorativo dentro de um mini-visor 64² (0,25×), e
    // o vidro leva o nome (`role=img`); as outras 35 continuam silhueta.
    const revelados = [...container.querySelectorAll('img')];
    expect(revelados).toHaveLength(1);
    expect(revelados[0].getAttribute('width')).toBe('64');
    expect(revelados[0].closest('[role="img"]')?.getAttribute('aria-label')).toBe('Ignar — rookie');
    expect(container.querySelectorAll('[data-silhouette]')).toHaveLength(35);
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
