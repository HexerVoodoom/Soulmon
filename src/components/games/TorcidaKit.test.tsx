// @vitest-environment jsdom
/**
 * O MASCOTE DA TORCIDA (estilo Digimon 1, 04/10/2026) e o gesto de deslizar (a esquiva do PvE).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { TorcidaLayer, TorcidaGauge, CheerMascot, SWIPE_MIN_PX } from './TorcidaKit';
import { CHEER_TAPS_FULL } from '../../utils/energia';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const noMotion = () => vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));

describe('mascote da torcida — o ícone lateral fixo no canto da cena', () => {
  it('fica no canto inferior direito, é um BOTÃO (teclado e leitor de tela) e o desenho é SVG de pixel só com tokens', () => {
    render(<TorcidaLayer onTap={() => {}} isPt mascot><div /></TorcidaLayer>);
    const m = document.querySelector('[data-cheer-mascot]') as HTMLElement;
    expect(m).not.toBeNull();
    expect(m.style.right).toBe('6px');
    expect(m.style.bottom).toContain('--sm-corner-h');
    expect(screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' })).toBeTruthy();
    const svg = m.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i); // nenhuma cor solta: só var(--sm2-*)
    expect(svg.outerHTML).toContain('var(--sm2-');
    expect(m.getAttribute('data-cheer-pose')).toBe('idle');
    expect(m.querySelector('[data-cheer-bubble]')).toBeNull(); // sem toque, sem balão
  });

  it('sem `mascot` (as outras telas) não desenha mascote nenhum', () => {
    render(<TorcidaLayer onTap={() => {}} isPt><div /></TorcidaLayer>);
    expect(document.querySelector('[data-cheer-mascot]')).toBeNull();
  });

  it('TOCAR na tela: ele grita — pula, levanta os pompons e aparece o balão VAI!/CHEER! — e o grito no ponto tocado continua', () => {
    vi.useFakeTimers();
    const onTap = vi.fn();
    const { container, rerender } = render(<TorcidaLayer onTap={onTap} isPt mascot><div data-alvo style={{ width: 50, height: 50 }} /></TorcidaLayer>);
    fireEvent.pointerDown(container.querySelector('[data-alvo]')!, { clientX: 30, clientY: 40 });
    expect(onTap).toHaveBeenCalledTimes(1);
    const m = document.querySelector('[data-cheer-mascot]') as HTMLElement;
    expect(m.getAttribute('data-cheer-pose')).toBe('cheer');
    expect(m.querySelector('.sm-cheer-jump')).not.toBeNull();
    expect(m.querySelector('[data-cheer-bubble]')?.textContent).toBe('VAI!');
    expect(document.querySelector('.sm-torcida-burst')).not.toBeNull(); // o efeito no ponto tocado fica
    act(() => { vi.advanceTimersByTime(500); });
    expect(m.getAttribute('data-cheer-pose')).toBe('idle'); // baixa os braços
    cleanup();
    render(<TorcidaLayer onTap={onTap} isPt={false} mascot><div data-alvo /></TorcidaLayer>);
    fireEvent.pointerDown(document.querySelector('[data-alvo]')!, { clientX: 1, clientY: 1 });
    expect(document.querySelector('[data-cheer-bubble]')?.textContent).toBe('CHEER!');
    void rerender;
  });

  it('cada toque REINICIA o pulo e o balão (a chave muda)', () => {
    const { container } = render(<TorcidaLayer onTap={() => {}} isPt mascot><div data-alvo /></TorcidaLayer>);
    const alvo = container.querySelector('[data-alvo]')!;
    fireEvent.pointerDown(alvo);
    const a = document.querySelector('[data-cheer-bubble]');
    fireEvent.pointerDown(alvo);
    const b = document.querySelector('[data-cheer-bubble]');
    expect(a).not.toBe(b); // outro elemento = a animação recomeça
  });

  it('tocar NO MASCOTE também torce (e ele grita); fora da luta (active = false) não vale', () => {
    const onTap = vi.fn();
    const { rerender } = render(<TorcidaLayer onTap={onTap} isPt mascot><div /></TorcidaLayer>);
    fireEvent.click(screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' }));
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-cheer-bubble]')).not.toBeNull();
    onTap.mockClear();
    rerender(<TorcidaLayer onTap={onTap} isPt mascot active={false}><div /></TorcidaLayer>);
    fireEvent.click(screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' }));
    expect(onTap).not.toHaveBeenCalled();
  });

  it('prefers-reduced-motion: sem o grito no ponto tocado; o balão aparece (o CSS faz só PISCAR) e o pulo é cortado pelo CSS', () => {
    noMotion();
    const { container } = render(<TorcidaLayer onTap={() => {}} isPt mascot><div data-alvo /></TorcidaLayer>);
    fireEvent.pointerDown(container.querySelector('[data-alvo]')!, { clientX: 5, clientY: 5 });
    expect(document.querySelector('.sm-torcida-burst')).toBeNull();
    expect(document.querySelector('[data-cheer-bubble]')).not.toBeNull();
  });

  it('o mascote mostra as duas poses (braços para baixo / para cima)', () => {
    const { container, rerender } = render(<CheerMascot cheer={false} />);
    const idle = container.innerHTML;
    rerender(<CheerMascot cheer />);
    expect(container.innerHTML).not.toBe(idle);
  });
});

describe('o gesto de deslizar (a esquiva do PvE)', () => {
  it('deslizar na horizontal chama onSwipe com a direção e NÃO conta como torcida durante a janela', () => {
    const onTap = vi.fn(); const onSwipe = vi.fn();
    const { container } = render(
      <TorcidaLayer onTap={onTap} isPt active={false} swipeActive onSwipe={onSwipe}><div data-alvo /></TorcidaLayer>,
    );
    const layer = container.querySelector('[data-torcida-layer]')!;
    const alvo = container.querySelector('[data-alvo]')!;
    fireEvent.pointerDown(alvo, { clientX: 200, clientY: 300 });
    fireEvent.pointerUp(layer, { clientX: 200 - SWIPE_MIN_PX - 10, clientY: 305 });
    expect(onSwipe).toHaveBeenCalledWith(-1);
    fireEvent.pointerDown(alvo, { clientX: 100, clientY: 300 });
    fireEvent.pointerUp(layer, { clientX: 100 + SWIPE_MIN_PX + 10, clientY: 296 });
    expect(onSwipe).toHaveBeenLastCalledWith(1);
    expect(onTap).not.toHaveBeenCalled();
  });

  it('um toque curto, ou um arrasto mais vertical que horizontal, não é esquiva; sem swipeActive nada acontece', () => {
    const onSwipe = vi.fn();
    const { container, rerender } = render(<TorcidaLayer onTap={() => {}} isPt swipeActive onSwipe={onSwipe}><div data-alvo /></TorcidaLayer>);
    const layer = container.querySelector('[data-torcida-layer]')!;
    const alvo = container.querySelector('[data-alvo]')!;
    fireEvent.pointerDown(alvo, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(layer, { clientX: 110, clientY: 100 });
    fireEvent.pointerDown(alvo, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(layer, { clientX: 160, clientY: 260 });
    expect(onSwipe).not.toHaveBeenCalled();
    rerender(<TorcidaLayer onTap={() => {}} isPt onSwipe={onSwipe}><div data-alvo /></TorcidaLayer>);
    fireEvent.pointerDown(container.querySelector('[data-alvo]')!, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(layer, { clientX: 20, clientY: 100 });
    expect(onSwipe).not.toHaveBeenCalled();
  });
});

describe('a barra de CHEER (bare): só a barra e o "?" — a explicação vai atrás do InfoTip', () => {
  it('sem texto explicativo na tela; o botão "Torcer!" só no layout antigo; o gauge lê a proporção', () => {
    const { container } = render(<TorcidaGauge taps={CHEER_TAPS_FULL / 2} onCheer={() => {}} isPt bare />);
    expect(container.textContent).not.toMatch(/Toque|Torcer|tap/i);
    expect(screen.getByRole('button', { name: 'Como torcer' })).toBeTruthy(); // o InfoTip
    expect(container.querySelector('[data-torcida-gauge]')?.getAttribute('data-torcida-ratio')).toBe('0.50');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('50');
    cleanup();
    render(<TorcidaGauge taps={0} onCheer={() => {}} isPt />);
    expect(screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' })).toBeTruthy();
  });
});
