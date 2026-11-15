// @vitest-environment jsdom
/** ÍCONE DE ESTÁGIO tingido pelo CAMINHO (dono, 14/11/2026, REGISTRO §369): Poder verde, Harmonia azul, Benevolência amarelo; rookie/ultra neutros. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { EstagioIcone, caminhoDaForma } from './EstagioIcone';
import { CAMINHO_COR, CAMINHO_SEM_COR, ATTR_ON_FILL_INK } from '../../types/attributes';

afterEach(cleanup);

/** jsdom normaliza `#rrggbb` para `rgb(r, g, b)`. */
const rgb = (hex: string) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;

describe('EstagioIcone com caminho', () => {
  it('as três cores do dono, num único dono (CAMINHO_COR)', () => {
    expect(CAMINHO_COR).toEqual({ power: '#4cd964', harmony: '#4aa3ff', benevolence: '#ffd23f' });
  });

  it.each([['champion-power', 'power'], ['ultimate-harmony', 'harmony'], ['mega-benevolence', 'benevolence']] as const)('%s: tinge na cor do caminho %s', (forma, caminho) => {
    const { container } = render(<EstagioIcone forma={forma} size={16} caminho={caminho} />);
    const icone = container.querySelector('[data-estagio-icone]') as HTMLElement;
    expect(icone.getAttribute('data-estagio-icone')).toBe(forma);
    expect(icone.getAttribute('data-estagio-caminho')).toBe(caminho);
    expect(icone.tagName).toBe('SPAN');
    expect(icone.style.width).toBe('16px');
    expect(icone.style.imageRendering).toBe('pixelated');
    expect(icone.style.filter).toContain('drop-shadow'); // contorno escuro: o amarelo não some na plaquinha clara
    const tinta = icone.querySelector('[data-estagio-tinta]') as HTMLElement;
    expect(tinta.style.backgroundColor).toBe(rgb(CAMINHO_COR[caminho]));
    expect(icone.getAttribute('aria-hidden')).toBe('true'); // decorativo, como o neutro
  });

  it('sem a prop, a cor vem do id da forma; a prop sobrescreve; null força o creme', () => {
    const cor = (el: HTMLElement) => (el.querySelector('[data-estagio-tinta]') as HTMLElement).style.backgroundColor;
    const { container, rerender } = render(<EstagioIcone forma="mega-benevolence" />);
    expect(cor(container.firstElementChild as HTMLElement)).toBe(rgb(CAMINHO_COR.benevolence));
    rerender(<EstagioIcone forma="mega-benevolence" caminho="harmony" />);
    expect(cor(container.firstElementChild as HTMLElement)).toBe(rgb(CAMINHO_COR.harmony));
    rerender(<EstagioIcone forma="mega-benevolence" caminho={null} />);
    expect(cor(container.firstElementChild as HTMLElement)).toBe(rgb(CAMINHO_SEM_COR));
  });

  it.each(['rookie', 'champion', 'ultimate', 'mega', 'ultra'])('forma sem caminho (%s): creme, nunca <img> cru', (forma) => {
    const { container } = render(<EstagioIcone forma={forma} size={16} />);
    const icone = container.querySelector('[data-estagio-icone]') as HTMLElement;
    expect(icone.tagName).toBe('SPAN');
    expect(icone.getAttribute('data-estagio-caminho')).toBe('nenhum');
    expect((icone.querySelector('[data-estagio-tinta]') as HTMLElement).style.backgroundColor).toBe(rgb(CAMINHO_SEM_COR));
    expect(container.querySelector('img')).toBeNull();
  });

  it('o creme é branco quente e não colide com nenhuma cor de caminho', () => {
    expect(CAMINHO_SEM_COR).toBe('#fff1d6');
    expect(Object.values(CAMINHO_COR)).not.toContain(CAMINHO_SEM_COR);
  });

  it('o rótulo acessível é o mesmo com e sem caminho', () => {
    render(<EstagioIcone forma="mega-power" label="Apoteose" />);
    const neutro = screen.getByRole('img', { name: 'Apoteose' });
    expect(neutro.tagName).toBe('SPAN');
    cleanup();
    render(<EstagioIcone forma="mega-power" label="Apoteose" caminho="power" />);
    const tingido = screen.getByRole('img', { name: 'Apoteose' });
    expect(tingido.getAttribute('aria-hidden')).toBeNull();
  });

  it('bebê e id desconhecido: nada (não há PNG), mesmo com caminho', () => {
    const { container } = render(<><EstagioIcone forma="bb" caminho="power" /><EstagioIcone forma="selvagem" caminho="harmony" /></>);
    expect(container.innerHTML).toBe('');
  });
});

describe('caminhoDaForma', () => {
  it('só lê o caminho que o id já tem (não inventa)', () => {
    expect(caminhoDaForma('champion-power')).toBe('power');
    expect(caminhoDaForma('ultimate-harmony')).toBe('harmony');
    expect(caminhoDaForma('mega-benevolence')).toBe('benevolence');
    for (const sem of ['rookie', 'champion', 'ultra', 'chefe', 'guardiao', 'bb', '', null, undefined]) expect(caminhoDaForma(sem)).toBeUndefined();
  });
});

/** Contraste WCAG do ícone: no fundo escuro lê pela própria cor; no claro, pelo contorno escuro que o borda. */
describe('contraste do ícone tingido', () => {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const razao = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const cores = [...Object.values(CAMINHO_COR), CAMINHO_SEM_COR];
  it.each(cores)('%s contra o contorno escuro e contra o fundo escuro: >= 3:1 (não-texto)', (cor) => {
    expect(razao(cor, ATTR_ON_FILL_INK)).toBeGreaterThanOrEqual(3);
    expect(razao(cor, '#0b1f1e')).toBeGreaterThanOrEqual(3);
  });
  it('o contorno escuro contra o fundo claro: >= 3:1 (borda que separa o ícone do tema claro)', () => {
    expect(razao(ATTR_ON_FILL_INK, '#f4f1e8')).toBeGreaterThanOrEqual(3);
  });
});
