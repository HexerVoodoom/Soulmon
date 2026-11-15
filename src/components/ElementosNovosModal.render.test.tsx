// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { installDomGlobals } from '../test/renderEnv';
import { ElementosNovosModal } from './ElementosNovosModal';
import { PRESENTATION_ORDER, pickPresentation, presentationRank, DAY_START_IDS, CELEBRATION_IDS, INVITE_IDS } from '../utils/presentationQueue';
import { BASE_ELEMENT_IDS } from '../utils/elementDex';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

const [a, b, c] = BASE_ELEMENT_IDS;
const q = (s: string) => document.querySelector(s);

describe('ElementosNovosModal: um elemento', () => {
  it('abre simples: ícone, nome, convite, SEM brilho e SEM carrossel', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="en-US" elementIds={[a]} onClose={onClose} />);
    expect(q('[data-elemento-novo]')!.getAttribute('data-brilho')).toBe('false');
    expect(q('[data-potion-rays]')).toBeNull();
    expect(q('[data-elemento-art] img')).not.toBeNull();
    expect(q('[data-elemento-nome]')!.textContent!.length).toBeGreaterThan(0);
    expect(q('[data-elemento-prev]')).toBeNull();
    expect(q('[data-elemento-next]')).toBeNull();
    expect(q('[data-elemento-dots]')).toBeNull();
    fireEvent.click(q('[data-elemento-novo]')!); // toque para fechar
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ElementosNovosModal: vários elementos = carrossel num modal só', () => {
  it('3 elementos: setas ≥44px, "1 de 3" por página, navega, e fecha no último por toque', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="pt-BR" elementIds={[a, b, c]} onClose={onClose} />);
    expect(document.querySelectorAll('[data-elemento-novo]')).toHaveLength(1);
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('1 de 3');
    expect(q('[data-elemento-pagina]')!.getAttribute('data-elemento-pagina')).toBe(a);
    expect(document.querySelectorAll('.sm2-elem-new-dot')).toHaveLength(3);
    expect((q('[data-elemento-prev]') as HTMLButtonElement).disabled).toBe(true);
    // alvo de toque: o CSS dá 44x44 às setas
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.sm2-elem-new-arrow \{[^}]*width: 44px; height: 44px/);
    fireEvent.click(q('[data-elemento-next]')!);
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('2 de 3');
    expect(q('[data-elemento-pagina]')!.getAttribute('data-elemento-pagina')).toBe(b);
    fireEvent.click(q('[data-elemento-prev]')!);
    expect(q('[data-elemento-pagina]')!.getAttribute('data-elemento-pagina')).toBe(a);
    fireEvent.click(q('[data-elemento-next]')!);
    fireEvent.click(q('[data-elemento-next]')!);
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('3 de 3');
    expect((q('[data-elemento-next]') as HTMLButtonElement).disabled).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(q('[data-elemento-novo]')!); // toque na última página fecha
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toque numa página do meio avança (não fecha); OK sempre fecha; teclado navega', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="en-US" elementIds={[a, b, c]} onClose={onClose} />);
    fireEvent.click(q('[data-elemento-novo]')!);
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('2 of 3');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(q('[data-elemento-novo]')!, { key: 'ArrowLeft' });
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('1 of 3');
    fireEvent.click(q('[data-elemento-ok]')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a animação de troca só existe sob prefers-reduced-motion: no-preference', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const i = css.indexOf('.sm2-elem-new-page[data-anim]');
    expect(css.lastIndexOf('@media (prefers-reduced-motion: no-preference)', i)).toBeGreaterThan(css.indexOf('.sm2-elem-new-hint'));
  });
});

describe('ElementosNovosModal: na fila central', () => {
  it('entra logo depois de evoStats, é aviso de gesto (fora do teto) e só aparece quando está pronto', () => {
    expect(presentationRank('elementoNovo')).toBe(presentationRank('evoStats') + 1);
    expect(PRESENTATION_ORDER).toContain('elementoNovo');
    for (const lista of [DAY_START_IDS, CELEBRATION_IDS, INVITE_IDS]) expect(lista).not.toContain('elementoNovo');
    expect(pickPresentation({})).toBe('welcome');
    expect(pickPresentation({ elementoNovo: true })).toBe('elementoNovo');
  });

  it('o App liga o item: pronto com pendentes/mostrados, "visto" gravado ao mostrar (todos), baseline = dex da abertura, uma instância', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain('elementoNovo: (elemMostrados !== null || elemPendentes.length > 0)');
    expect(app).toContain("interstitial === 'elementoNovo' && elemMostrados");
    expect(app).toContain("case 'elementoNovo': setElemMostrados(null); break;");
    expect(app).toContain('elemPendentes.forEach(x => elemVistosRef.current?.add(x));');
    expect(app).toContain('elemVistosRef.current = new Set(lista)');
    expect((app.match(/<ElementosNovosModal/g) ?? []).length).toBe(1);
  });
});
