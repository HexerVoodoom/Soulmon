// @vitest-environment jsdom
/**
 * QA3 — o ponto inicial do deslize (a esquiva) sobrevivia a um gesto CANCELADO pelo sistema
 * (`pointercancel`) e a um toque em botão (que sai antes de reiniciá-lo): o `pointerup` seguinte
 * media o deslize contra um ponto velho e disparava uma esquiva que o dedo nunca fez.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { TorcidaLayer } from './TorcidaKit';

afterEach(cleanup);

describe('TorcidaLayer — deslize', () => {
  const setup = () => {
    const onSwipe = vi.fn();
    const r = render(<TorcidaLayer onTap={() => {}} isPt swipeActive onSwipe={onSwipe}><button type="button">b</button><p>fundo</p></TorcidaLayer>);
    return { onSwipe, layer: r.container.querySelector('[data-torcida-layer]') as HTMLElement, btn: r.getByText('b'), bg: r.getByText('fundo') };
  };
  it('deslize normal dispara', () => {
    const { onSwipe, bg } = setup();
    fireEvent.pointerDown(bg, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(bg, { clientX: 200, clientY: 102 });
    expect(onSwipe).toHaveBeenCalledWith(-1);
  });
  it('pointercancel descarta o ponto: o pointerup seguinte não vira deslize', () => {
    const { onSwipe, bg } = setup();
    fireEvent.pointerDown(bg, { clientX: 300, clientY: 100 });
    fireEvent.pointerCancel(bg);
    fireEvent.pointerUp(bg, { clientX: 100, clientY: 100 });
    expect(onSwipe).not.toHaveBeenCalled();
  });
  it('toque em botão não herda o ponto de um gesto anterior sem fim', () => {
    const { onSwipe, bg, btn } = setup();
    fireEvent.pointerDown(bg, { clientX: 300, clientY: 100 }); // gesto que nunca terminou
    fireEvent.pointerDown(btn, { clientX: 20, clientY: 20 });
    fireEvent.pointerUp(btn, { clientX: 20, clientY: 20 });
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
