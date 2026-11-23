// @vitest-environment jsdom
/**
 * Pedido do dono (22/11/2026): os modais da Home NÃO fecham ao clicar num item
 * nem por qualquer outro motivo. Só o jogador fecha (X, Esc, toque no véu).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila } from './Mochila';

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

function montar() {
  const onClose = vi.fn();
  const onUse = vi.fn();
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 100, right: 200, top: 100, bottom: 200, width: 100, height: 100, x: 100, y: 100, toJSON() {} }) as DOMRect;
  document.body.appendChild(el);
  const petTargetRef = createRef<HTMLElement>() as { current: HTMLElement | null };
  petTargetRef.current = el;
  renderWithCss(
    <Mochila open onClose={onClose} foodInventory={{ '🍎': 3, '💗': 1 }} language="pt-BR"
      onUse={onUse} petTargetRef={petTargetRef} onTargetChange={() => {}} petName="Bito" />,
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

  it('soltar um arrasto sobre o véu (fora da folha) não fecha', () => {
    const { onClose } = montar();
    const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0, pointerType: 'touch' });
    act(() => {
      fireEvent.pointerMove(document, { clientX: 40, clientY: 350, pointerType: 'touch' });
      fireEvent.pointerMove(document, { clientX: 320, clientY: 40, pointerType: 'touch' });
    });
    act(() => { fireEvent.pointerUp(document, { clientX: 320, clientY: 40, pointerType: 'touch' }); });
    fireEvent.click(document.querySelector('[data-mochila]') as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    // um toque de verdade no véu, depois, ainda fecha
    fireEvent.click(document.querySelector('[data-mochila]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
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
