// @vitest-environment jsdom
/**
 * O ANEL do especial (mecânica ativa do PvE): desenhado por JS (essencial, não corta com movimento
 * reduzido), nota pelo momento do toque, e o relógio injetável deixa o teste determinístico.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { SpecialRing, DodgeButtons } from './PveMechanics';
import { RING_FROM, RING_TO, RING_OTIMO_MS, ringSpec } from '../../utils/energia';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function montar(spec = ringSpec(4, 0)) {
  let t = 1000;
  const now = () => t;
  const onGrade = vi.fn();
  const r = render(<SpecialRing spec={spec} x={120} y={140} size={150} onGrade={onGrade} label="Golpear" now={now} />);
  const avanca = (ms: number) => { act(() => { t += ms; vi.advanceTimersByTime(ms); }); };
  return { ...r, onGrade, avanca, spec };
}
const ringEl = () => document.querySelector('.sm-bs-ring') as HTMLElement;
const escala = () => parseFloat(/scale\(([\d.]+)\)/.exec(ringEl().style.transform)?.[1] ?? 'NaN');

describe('SpecialRing — o anel que encolhe sobre o alvo', () => {
  it('começa grande (RING_FROM), encolhe sem CSS (por JS) até encostar no alvo (escala 1) e a janela do ÓTIMO acende', () => {
    const { avanca, spec } = montar();
    expect(escala()).toBeCloseTo(RING_FROM, 1);
    avanca(spec.targetMs / 2);
    expect(escala()).toBeLessThan(RING_FROM);
    expect(escala()).toBeGreaterThan(1);
    avanca(spec.targetMs / 2);
    expect(escala()).toBeCloseTo(1, 1);
    expect(ringEl().getAttribute('data-ring-hot')).toBe('1');
    avanca(spec.ms - spec.targetMs);
    expect(escala()).toBeCloseTo(RING_TO, 1);
    expect(ringEl().getAttribute('data-ring-hot')).toBe('0');
  });

  it('toque (em QUALQUER lugar da tela) no momento certo = ÓTIMO; cedo = ruim; entre os dois = bom', () => {
    // ótimo
    let m = montar();
    m.avanca(m.spec.targetMs);
    fireEvent.pointerDown(document.body);
    expect(m.onGrade).toHaveBeenCalledTimes(1);
    expect(m.onGrade.mock.calls[0][0]).toBe('otimo');
    cleanup();
    // bom: um pouco fora da janela do ótimo
    m = montar();
    m.avanca(m.spec.targetMs - RING_OTIMO_MS - 60);
    fireEvent.pointerDown(document.body);
    expect(m.onGrade.mock.calls[0][0]).toBe('bom');
    cleanup();
    // ruim: cedo demais
    m = montar();
    m.avanca(150);
    fireEvent.pointerDown(document.body);
    expect(m.onGrade.mock.calls[0][0]).toBe('ruim');
  });

  it('vale UMA nota só (o segundo toque é ignorado) e o X/confirmação de sair não contam como toque do anel', () => {
    const m = montar();
    const x = document.createElement('button');
    x.setAttribute('data-stage-close', '');
    document.body.appendChild(x);
    fireEvent.pointerDown(x);
    expect(m.onGrade).not.toHaveBeenCalled();
    m.avanca(m.spec.targetMs);
    fireEvent.pointerDown(document.body);
    fireEvent.pointerDown(document.body);
    expect(m.onGrade).toHaveBeenCalledTimes(1);
    x.remove();
  });

  it('sem toque: depois que o anel passa do alvo (e um respiro) vale RUIM — o especial sai, fraco', () => {
    const m = montar();
    m.avanca(m.spec.ms + 400);
    expect(m.onGrade).toHaveBeenCalledTimes(1);
    expect(m.onGrade.mock.calls[0][0]).toBe('ruim');
    expect(m.onGrade.mock.calls[0][1]).toBeNull();
  });

  it('teclado e leitor de tela: o botão do alvo golpeia (nome acessível), sem depender do toque na tela', () => {
    const m = montar();
    m.avanca(m.spec.targetMs);
    fireEvent.click(screen.getByRole('button', { name: 'Golpear' }));
    expect(m.onGrade).toHaveBeenCalledTimes(1);
    expect(m.onGrade.mock.calls[0][0]).toBe('otimo');
  });

  it('movimento reduzido NÃO congela o anel: ele é a mecânica essencial (WCAG 2.3.3), desenhado por JS e não por animação CSS', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
    const { avanca, spec } = montar();
    avanca(spec.targetMs);
    expect(escala()).toBeCloseTo(1, 1);
    expect(getComputedStyle(ringEl()).animationName === '' || getComputedStyle(ringEl()).animationName === 'none').toBe(true);
  });
});

describe('DodgeButtons — as setas de cada lado do pet', () => {
  it('uma de cada lado do corpo do pet; tocar chama a esquiva naquela direção', () => {
    const onDodge = vi.fn();
    render(<DodgeButtons x={150} y={400} size={200} onDodge={onDodge} labelLeft="Esq" labelRight="Dir" />);
    const e = screen.getByRole('button', { name: 'Esq' });
    const d = screen.getByRole('button', { name: 'Dir' });
    expect(parseFloat(e.style.left)).toBeLessThan(150);
    expect(parseFloat(d.style.left)).toBeGreaterThan(150);
    fireEvent.click(e); fireEvent.click(d);
    expect(onDodge.mock.calls).toEqual([[-1], [1]]);
  });
});
