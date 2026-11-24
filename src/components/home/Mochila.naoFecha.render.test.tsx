// @vitest-environment jsdom
/**
 * Mochila (22–23/11/2026): usar item e soltar arrasto sobre o véu NÃO fecham a folha; só o jogador fecha (X, Esc, toque no véu).
 * Arrastar RECOLHE a folha (o pet aparece), mas só depois de um toque longo: rolar a lista nunca arrasta item sem querer.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila, LONG_PRESS_MS } from './Mochila';

beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class PE extends MouseEvent {
      pointerId: number; pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'touch';
      }
    }
    (window as unknown as { PointerEvent: unknown }).PointerEvent = PE;
    (globalThis as unknown as { PointerEvent: unknown }).PointerEvent = PE;
  }
});

function montar(extra: { arrastoDireto?: boolean } = {}) {
  const onClose = vi.fn();
  const onUse = vi.fn();
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 100, right: 200, top: 100, bottom: 200, width: 100, height: 100, x: 100, y: 100, toJSON() {} }) as DOMRect;
  document.body.appendChild(el);
  const petTargetRef = createRef<HTMLElement>() as { current: HTMLElement | null };
  petTargetRef.current = el;
  renderWithCss(
    <Mochila open onClose={onClose} foodInventory={{ '🍎': 3, '💗': 1 }} language="pt-BR"
      onUse={onUse} petTargetRef={petTargetRef} onTargetChange={() => {}} petName="Bito" {...extra} />,
  );
  return { onClose, onUse };
}

describe('Mochila não fecha sozinha', () => {
  it('tocar no item e usar pelo botão "Usar" não chama onClose', () => {
    const { onClose, onUse } = montar();
    const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
    fireEvent.pointerUp(document, { clientX: 10, clientY: 400 });
    fireEvent.click(item);
    fireEvent.click(screen.getByRole('button', { name: 'Usar Maçã.exe' }));
    expect(onUse).toHaveBeenCalledWith('🍎');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('soltar um arrasto (armado) sobre o véu não fecha; um toque de verdade no véu, depois, fecha', () => {
    vi.useFakeTimers();
    const { onClose } = montar();
    const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0, pointerType: 'touch' });
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 20); });
    act(() => {
      fireEvent.pointerMove(document, { clientX: 40, clientY: 350, pointerType: 'touch' });
      fireEvent.pointerMove(document, { clientX: 320, clientY: 40, pointerType: 'touch' });
    });
    act(() => { fireEvent.pointerUp(document, { clientX: 320, clientY: 40, pointerType: 'touch' }); });
    fireEvent.click(document.querySelector('[data-mochila]') as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('[data-mochila]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

const dedoNoItem = () => {
  const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
  fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0, pointerType: 'touch' });
  return item;
};

describe('Mochila: rolar a lista x arrastar o item (dono, 23/11/2026)', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('(a) mover na vertical ANTES do toque longo é rolagem: não arrasta, não recolhe, não usa', () => {
    vi.useFakeTimers();
    const { onClose, onUse } = montar();
    dedoNoItem();
    act(() => { fireEvent.pointerMove(document, { clientX: 10, clientY: 370, pointerType: 'touch' }); });
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 50); }); // o tempo passa, mas o gesto já foi desistido
    act(() => { fireEvent.pointerMove(document, { clientX: 12, clientY: 300, pointerType: 'touch' }); });
    expect((document.querySelector('[data-mochila]') as HTMLElement).className).not.toContain('sm3-arrastando');
    expect(document.querySelector('[data-fantasma], .sm3-fantasma')).toBeNull();
    act(() => { fireEvent.pointerUp(document, { clientX: 12, clientY: 300, pointerType: 'touch' }); });
    expect(onUse).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('(b) toque longo + mover arma o arrasto e a folha recolhe (para o pet aparecer)', () => {
    vi.useFakeTimers();
    montar();
    dedoNoItem();
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 20); });
    act(() => { fireEvent.pointerMove(document, { clientX: 40, clientY: 350, pointerType: 'touch' }); });
    expect((document.querySelector('[data-mochila]') as HTMLElement).className).toContain('sm3-arrastando');
  });

  it('(c) soltar sobre o pet usa o item', () => {
    vi.useFakeTimers();
    const { onUse, onClose } = montar();
    dedoNoItem();
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 20); });
    act(() => {
      fireEvent.pointerMove(document, { clientX: 60, clientY: 300, pointerType: 'touch' });
      fireEvent.pointerMove(document, { clientX: 150, clientY: 150, pointerType: 'touch' });
    });
    act(() => { fireEvent.pointerUp(document, { clientX: 150, clientY: 150, pointerType: 'touch' }); });
    expect(onUse).toHaveBeenCalledWith('🍎');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('(d) soltar fora do pet cancela: nada é usado e a folha volta', () => {
    vi.useFakeTimers();
    const { onUse, onClose } = montar();
    dedoNoItem();
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 20); });
    act(() => {
      fireEvent.pointerMove(document, { clientX: 60, clientY: 300, pointerType: 'touch' });
      fireEvent.pointerMove(document, { clientX: 320, clientY: 40, pointerType: 'touch' });
    });
    act(() => { fireEvent.pointerUp(document, { clientX: 320, clientY: 40, pointerType: 'touch' }); });
    expect(onUse).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect((document.querySelector('[data-mochila]') as HTMLElement).className).not.toContain('sm3-arrastando');
  });

  it('arrastoDireto (onboarding): o dedo arrasta sem toque longo e soltar no pet usa o item', () => {
    const { onUse } = montar({ arrastoDireto: true });
    dedoNoItem();
    act(() => { fireEvent.pointerMove(document, { clientX: 60, clientY: 300, pointerType: 'touch' }); });
    expect((document.querySelector('[data-mochila]') as HTMLElement).className).toContain('sm3-arrastando');
    act(() => { fireEvent.pointerMove(document, { clientX: 150, clientY: 150, pointerType: 'touch' }); });
    act(() => { fireEvent.pointerUp(document, { clientX: 150, clientY: 150, pointerType: 'touch' }); });
    expect(onUse).toHaveBeenCalledWith('🍎');
    expect(readFileSync('src/index.css', 'utf8')).toContain('.sm3-item[data-direto] { touch-action: none;');
  });

  it('o item deixa a rolagem vertical passar (touch-action: pan-y no CSS)', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const i = css.indexOf('.sm3-item {\n  display: flex');
    expect(i).toBeGreaterThan(0);
    expect(css.slice(i, css.indexOf('}', i))).toMatch(/touch-action:\s*pan-y/);
    expect(css).toMatch(/\.sm3-arrastando \.sm3-mochila \{ transform: translateY\(78%\)/);
  });
});

describe('CompanionHUD: usar item não fecha a Mochila', () => {
  it('handleUseItem não chama setMochilaOpen(false)', () => {
    const src = readFileSync('src/components/CompanionHUD.tsx', 'utf8');
    const i = src.indexOf('const handleUseItem');
    const corpo = src.slice(i, src.indexOf('}, [onFeed]);', i));
    expect(i).toBeGreaterThan(0);
    expect(corpo).not.toMatch(/setMochilaOpen\(\s*false\s*\)/);
    expect(corpo).toMatch(/onFeed\?\.\(emoji\)/);
  });
});
