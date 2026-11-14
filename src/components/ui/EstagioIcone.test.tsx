// @vitest-environment jsdom
/** ÍCONE DE ESTÁGIO tingido pelo CAMINHO (dono, 14/11/2026, REGISTRO §369): Poder verde, Harmonia azul, Benevolência amarelo; rookie/ultra neutros. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { EstagioIcone, caminhoDaForma } from './EstagioIcone';
import { CAMINHO_COR } from '../../types/attributes';

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

  it('sem caminho: o <img> neutro de sempre (sem tinta)', () => {
    const { container } = render(<EstagioIcone forma="rookie" size={16} />);
    const icone = container.querySelector('[data-estagio-icone]') as HTMLElement;
    expect(icone.tagName).toBe('IMG');
    expect(icone.getAttribute('data-estagio-caminho')).toBeNull();
    expect(container.querySelector('[data-estagio-tinta]')).toBeNull();
  });

  it('o rótulo acessível é o mesmo com e sem caminho', () => {
    render(<EstagioIcone forma="mega-power" label="Apoteose" />);
    const neutro = screen.getByRole('img', { name: 'Apoteose' });
    expect(neutro.tagName).toBe('IMG');
    cleanup();
    render(<EstagioIcone forma="mega-power" label="Apoteose" caminho="power" />);
    const tingido = screen.getByRole('img', { name: 'Apoteose' });
    expect(tingido.getAttribute('aria-hidden')).toBeNull();
  });

  it('bebê e id desconhecido: nada, mesmo com caminho', () => {
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
