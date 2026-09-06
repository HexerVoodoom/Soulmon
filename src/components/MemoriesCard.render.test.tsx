// @vitest-environment jsdom
/**
 * WP4.8 — o cartão de memórias.
 *
 * A trava é o TOM: um resumo de trinta dias com números de desempenho vira
 * avaliação da própria vida, e este produto não faz isso nem no dia.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { MemoriesCard } from './MemoriesCard';

const base = {
  mark: 30,
  petName: 'Velhuma',
  formNames: ['Velhuma', 'Velhara'],
  dreamCount: 4,
  soulGoal: 'quero dormir melhor',
  language: 'pt-BR' as const,
};

describe('MemoriesCard — o que ele conta', () => {
  it('os dias, as formas vividas, os sonhos e o que a pessoa escreveu', () => {
    const { container } = renderWithCss(<MemoriesCard {...base} />);
    expect(container.textContent).toContain('30 dias com Velhuma');
    expect(container.textContent).toContain('Velhara');
    expect(container.textContent).toContain('4 sonhos guardados');
    expect(container.textContent).toContain('quero dormir melhor');
  });

  it('sem sonho e sem objetivo, as linhas somem sem deixar buraco', () => {
    const { container } = renderWithCss(
      <MemoriesCard {...base} dreamCount={0} soulGoal={null} formNames={[]} />,
    );
    expect(container.textContent).toContain('30 dias');
    expect(container.textContent).not.toContain('sonho');
    expect(container.textContent).not.toContain('Começou assim');
  });

  it('em inglês, tudo em inglês, e o singular funciona', () => {
    const { container } = renderWithCss(
      <MemoriesCard {...base} language="en-US" dreamCount={1} />,
    );
    expect(container.textContent).toContain('30 days with');
    expect(container.textContent).toContain('1 dream kept');
  });
});

describe('MemoriesCard — não é um balanço', () => {
  it('nenhuma contagem de tarefa, nenhum percentual, nenhuma comparação', () => {
    const { container } = renderWithCss(<MemoriesCard {...base} />);
    const texto = (container.textContent ?? '').toLowerCase();
    for (const p of ['tarefas', 'tasks', '%', 'média', 'melhor que', 'mês passado', 'produtiv']) {
      expect(texto, `o cartão de memórias virou balanço ("${p}")`).not.toContain(p);
    }
  });
});
