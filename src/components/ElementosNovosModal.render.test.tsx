// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { installDomGlobals } from '../test/renderEnv';
import { ElementosNovosModal } from './ElementosNovosModal';
import { PRESENTATION_ORDER, pickPresentation, presentationRank, DAY_START_IDS, CELEBRATION_IDS, INVITE_IDS } from '../utils/presentationQueue';
import { BASE_ELEMENT_IDS } from '../utils/elementDex';
import { CURATED_ELEMENT_IDS } from '../utils/elementosCurados';
import { componentesDoElemento } from '../utils/elementoNovoModal';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

const [a, b, c] = BASE_ELEMENT_IDS;
const q = (s: string) => document.querySelector(s);

const composto2 = 'pantano';
const composto4 = CURATED_ELEMENT_IDS.find(i => componentesDoElemento(i).length === 4)!;
const okBtn = () => q('[data-elemento-ok]') as HTMLButtonElement;
const pg = () => q('[data-elemento-pagina]')!.getAttribute('data-elemento-pagina');

describe('carta: um elemento', () => {
  it('base: só ícone e nome, sem fileira, sem setas, OK habilitado, sem brilho', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="en-US" elementIds={[a]} onClose={onClose} />);
    expect(q('[data-elemento-novo]')!.getAttribute('role')).toBe('dialog');
    expect(q('[data-elemento-novo]')!.getAttribute('data-brilho')).toBe('false');
    expect(q('[data-elemento-carta] [data-elemento-art] img')).not.toBeNull();
    expect(q('[data-elemento-nome]')!.textContent!.length).toBeGreaterThan(0);
    expect(q('[data-elemento-componentes]')).toBeNull();
    expect(q('[data-elemento-prev]')).toBeNull();
    expect(q('[data-elemento-dots]')).toBeNull();
    expect(okBtn().disabled).toBe(false);
    fireEvent.click(okBtn());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('composto de 2: fileira com os dois nomes e o nome acessível "feito de"', () => {
    render(<ElementosNovosModal language="pt-BR" elementIds={[composto2]} onClose={() => {}} />);
    expect(document.querySelectorAll('[data-elemento-componente]')).toHaveLength(2);
    expect(q('[data-elemento-componentes]')!.textContent).toContain('+');
    expect(q('[data-elemento-novo]')!.getAttribute('aria-label')).toBe('Novo elemento: Pântano, feito de Água e Terra');
  });
  it('composto de 4: quatro componentes na fileira, três "+"', () => {
    render(<ElementosNovosModal language="en-US" elementIds={[composto4]} onClose={() => {}} />);
    expect(document.querySelectorAll('[data-elemento-componente]')).toHaveLength(4);
    expect(document.querySelectorAll('.sm2-elem-carta-mais')).toHaveLength(3);
  });
  it('o X do topo fecha e Esc fecha', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="en-US" elementIds={[a]} onClose={onClose} />);
    fireEvent.click(q('[data-elemento-fechar] button')!);
    fireEvent.keyDown(q('[data-elemento-novo]')!, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('carta: Neutro (o do Corvo)', () => {
  it('não tem fileira de componentes e explica que não nasce de nenhum outro elemento', () => {
    render(<ElementosNovosModal language="en-US" elementIds={['neutro']} onClose={() => {}} />);
    expect(q('[data-elemento-componentes]')).toBeNull();
    expect(q('[data-elemento-nota]')!.textContent).toBe("Born of no other element. The Raven's own.");
    expect(q('[data-elemento-novo]')!.getAttribute('aria-label')).toContain('Born of no other element');
  });
  it('PT-BR', () => {
    render(<ElementosNovosModal language="pt-BR" elementIds={['neutro']} onClose={() => {}} />);
    expect(q('[data-elemento-nota]')!.textContent).toBe('Não nasce de nenhum outro elemento. É o do Corvo.');
  });
  it('elemento comum não tem a nota', () => {
    render(<ElementosNovosModal language="en-US" elementIds={[composto2]} onClose={() => {}} />);
    expect(q('[data-elemento-nota]')).toBeNull();
  });
});

describe('carta: carrossel de 3', () => {
  it('OK desabilitado até ver a 3ª; setas, contador, pontinhos e setas >=44px', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="pt-BR" elementIds={[a, b, c]} onClose={onClose} />);
    expect(document.querySelectorAll('[data-elemento-novo]')).toHaveLength(1);
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('1 de 3');
    expect(document.querySelectorAll('.sm2-elem-new-seg')).toHaveLength(3);
    expect(q('[data-elemento-dots]')!.getAttribute('role')).toBe('progressbar');
    expect(document.querySelectorAll('.sm2-elem-new-seg[data-on="true"]')).toHaveLength(1);
    expect(okBtn().disabled).toBe(true);
    fireEvent.click(okBtn());
    expect(onClose).not.toHaveBeenCalled();
    expect(readFileSync('src/index.css', 'utf8')).toMatch(/\.sm2-elem-new-arrow \{[^}]*width: 44px; height: 44px/);
    fireEvent.click(q('[data-elemento-next]')!);
    expect(pg()).toBe(b);
    expect(okBtn().disabled).toBe(true);
    fireEvent.click(q('[data-elemento-next]')!);
    expect(q('[data-elemento-pagina]')!.getAttribute('aria-label')).toBe('3 de 3');
    expect(okBtn().disabled).toBe(false);
    fireEvent.click(q('[data-elemento-prev]')!);
    expect(okBtn().disabled).toBe(false);
    fireEvent.click(okBtn());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('deslize de dedo troca de carta nos dois sentidos; teclado também', () => {
    render(<ElementosNovosModal language="en-US" elementIds={[a, b, c]} onClose={() => {}} />);
    const root = q('[data-elemento-novo]')!;
    fireEvent.pointerDown(root, { clientX: 300 }); fireEvent.pointerUp(root, { clientX: 100 });
    expect(pg()).toBe(b);
    fireEvent.pointerDown(root, { clientX: 100 }); fireEvent.pointerUp(root, { clientX: 300 });
    expect(pg()).toBe(a);
    fireEvent.pointerDown(root, { clientX: 100 }); fireEvent.pointerUp(root, { clientX: 110 });
    expect(pg()).toBe(a);
    fireEvent.keyDown(root, { key: 'ArrowRight' });
    expect(pg()).toBe(b);
  });
  it('barra segmentada enche conforme avança; o toque (stories) usa a metade da carta', () => {
    render(<ElementosNovosModal language="en-US" elementIds={[a, b, c]} onClose={() => {}} />);
    fireEvent.click(q('[data-elemento-next]')!);
    expect(document.querySelectorAll('.sm2-elem-new-seg[data-on="true"]')).toHaveLength(2);
    expect(q('[data-elemento-dots]')!.getAttribute('aria-valuenow')).toBe('2');
    expect(q('[data-elemento-dots]')!.getAttribute('aria-valuetext')).toBe('2 of 3');
  });
  it('fechar pelo X antes de ver tudo e permitido (o App marca o lote inteiro como visto ao mostrar)', () => {
    const onClose = vi.fn();
    render(<ElementosNovosModal language="en-US" elementIds={[a, b, c]} onClose={onClose} />);
    fireEvent.click(q('[data-elemento-fechar] button')!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(readFileSync('src/App.tsx', 'utf8')).toContain('elemPendentes.forEach(x => elemVistosRef.current?.add(x));');
  });
  it('movimento reduzido: a animacao de troca so existe sob no-preference', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const i = css.indexOf('.sm2-elem-new-page[data-anim]');
    expect(css.lastIndexOf('@media (prefers-reduced-motion: no-preference)', i)).toBeGreaterThan(css.indexOf('.sm2-elem-new-seg[data-on'));
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
