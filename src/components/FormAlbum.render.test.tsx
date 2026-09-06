// @vitest-environment jsdom
/**
 * WP4.6/WP4.10 — o álbum das formas vividas.
 *
 * A coisa mais cara que o jogador constrói — meses de cuidado virando formas —
 * era uma STRING: nomes separados por ponto numa linha de texto. Este teste
 * guarda as três regras que fazem dela um álbum em vez de um inventário.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { FormAlbum } from './FormAlbum';

const forms = [
  { id: 'rookie', name: 'Velhuma', spriteUrl: 'https://cdn/a.png' },
  { id: 'champion-data', name: 'Velhara', spriteUrl: 'https://cdn/b.png' },
  { id: 'mega-data', name: 'Velhamon', spriteUrl: 'https://cdn/c.png' },
];

describe('FormAlbum — o que foi vivido', () => {
  it('mostra o nome e a data da forma alcançada', () => {
    const { container } = renderWithCss(
      <FormAlbum
        forms={forms}
        reached={['rookie']}
        reachedAt={{ rookie: '2026-09-06' }}
        language="pt-BR"
      />,
    );
    expect(container.textContent).toContain('Velhuma');
    expect(container.textContent).toMatch(/set/i);
  });

  it('a contagem é de COLEÇÃO — cresce e nunca é de desempenho', () => {
    const { container } = renderWithCss(
      <FormAlbum forms={forms} reached={['rookie', 'champion-data']} language="pt-BR" />,
    );
    expect(container.textContent).toContain('2/3');
  });
});

describe('FormAlbum — a ausência é convite, nunca dívida', () => {
  it('forma não alcançada é silhueta, e o nome não é entregue', () => {
    const { container } = renderWithCss(
      <FormAlbum forms={forms} reached={['rookie']} language="pt-BR" />,
    );
    expect(container.textContent).toContain('???');
    expect(container.textContent).not.toContain('Velhamon');
    const silhuetas = [...container.querySelectorAll('img')]
      .filter(el => (el as HTMLImageElement).style.filter.includes('brightness(0)'));
    expect(silhuetas).toHaveLength(2);
  });

  it('nada de "faltam N", nada de vermelho, nada de cobrança', () => {
    const { container } = renderWithCss(
      <FormAlbum forms={forms} reached={[]} language="pt-BR" />,
    );
    const texto = (container.textContent ?? '').toLowerCase();
    for (const p of ['faltam', 'falta ', 'missing', 'incompleto', 'bloquead']) {
      expect(texto, `o álbum cobrou ("${p}")`).not.toContain(p);
    }
  });
});

describe('FormAlbum — save antigo sem data', () => {
  it('a forma aparece inteira, só sem data — nunca com uma data inventada', () => {
    const { container } = renderWithCss(
      <FormAlbum forms={forms} reached={['rookie']} language="pt-BR" />,
    );
    expect(container.textContent).toContain('Velhuma');
    expect(container.textContent ?? '').not.toMatch(/\d{1,2} de \w+/);
  });
});
