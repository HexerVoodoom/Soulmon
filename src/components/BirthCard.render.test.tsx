// @vitest-environment jsdom
/**
 * WP1.6 — o cartão de nascimento.
 *
 * O teste protege as duas regras de CONTEÚDO, que são as duas coisas que ele
 * não mostra: número e personalidade fechada. A primeira transforma o
 * nascimento em desempenho; a segunda impede a pessoa de projetar a própria
 * história na criatura, que é o mecanismo inteiro do vínculo.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { BirthCard } from './BirthCard';

const base = {
  name: 'Velhuma',
  bornAt: '2026-09-06',
  language: 'pt-BR' as const,
};

describe('BirthCard — o que ele mostra', () => {
  it('nome, data por extenso e o que a pessoa escreveu', () => {
    const { container } = renderWithCss(
      <BirthCard {...base} soulGoal="quero dormir melhor" />,
    );
    expect(screen.getByText('Velhuma')).toBeTruthy();
    expect(container.textContent).toContain('setembro');
    expect(container.textContent).toContain('quero dormir melhor');
  });

  it('sem `soulGoal` (a pessoa pulou), a linha some sem deixar buraco', () => {
    const { container } = renderWithCss(<BirthCard {...base} />);
    expect(container.textContent).not.toContain('Você disse');
  });

  it('sem sprite próprio, nenhuma imagem — nunca a arte de reserva', () => {
    // Arte de reserva no cartão de nascimento seria registrar OUTRA criatura
    // como sendo a que nasceu.
    const { container } = renderWithCss(<BirthCard {...base} />);
    expect(container.querySelector('img')).toBeNull();
    // O vidro 192² (64 × 3) fica, vazio — é o mesmo visor do reveal (D-S4).
    const vidro = container.querySelector('[role="img"]');
    expect(vidro?.getAttribute('aria-label')).toBe('Velhuma');
  });

  it('em inglês, tudo em inglês', () => {
    const { container } = renderWithCss(
      <BirthCard {...base} language="en-US" soulGoal="sleep better" />,
    );
    expect(container.textContent).toContain('September');
    expect(container.textContent).toContain('was born from that');
  });
});

describe('BirthCard — o que ele NÃO mostra', () => {
  it('nenhum número: é certidão, não painel', () => {
    // Assim que entra um número, a pessoa lê o próprio nascimento como
    // desempenho. A data por extenso tem o DIA, que é lembrança — o que não
    // pode aparecer é contagem: dias juntos, nível, quantidade de nada.
    const { container } = renderWithCss(
      <BirthCard {...base} soulGoal="ler mais" epithet="Essência Fogo · Ofício Ferreiro" />,
    );
    const texto = container.textContent ?? '';
    expect(texto).not.toMatch(/\d+\s*(dias|days|nível|level|xp)/i);
    expect(texto).not.toContain('2026');
  });

  it('data ilegível não vira texto quebrado', () => {
    const { container } = renderWithCss(<BirthCard {...base} bornAt="não é data" />);
    expect(container.textContent).toContain('Nasceu');
    expect(container.textContent).not.toContain('Invalid');
    expect(container.textContent).not.toContain('NaN');
  });
});
