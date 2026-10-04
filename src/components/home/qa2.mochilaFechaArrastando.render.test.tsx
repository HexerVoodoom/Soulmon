// @vitest-environment jsdom
/**
 * QA2 (04/10/2026) — fechar a Mochila no meio de um arrasto sobre o pet deixava
 * o pet aceso (`onTargetChange(true)` sem o `false` correspondente).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
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

it('fechar com o item sobre o pet apaga o pet e não usa o item', () => {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 100, right: 200, top: 100, bottom: 200, width: 100, height: 100, x: 100, y: 100, toJSON() {} }) as DOMRect;
  document.body.appendChild(el);
  const ref = createRef<HTMLElement>() as { current: HTMLElement | null };
  ref.current = el;
  const onUse = vi.fn();
  const onTargetChange = vi.fn();
  const props = {
    onClose: () => {}, foodInventory: { '🍎': 3 }, language: 'pt-BR' as const, onUse,
    petTargetRef: ref, onTargetChange, petName: 'Bito',
  };
  const { rerender } = renderWithCss(<Mochila open {...props} />);
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Maçã × 3' }), { clientX: 10, clientY: 400, button: 0 });
  act(() => { fireEvent.pointerMove(document, { clientX: 150, clientY: 150 }); });
  expect(onTargetChange).toHaveBeenLastCalledWith(true);
  rerender(<Mochila open={false} {...props} />);
  expect(onTargetChange).toHaveBeenLastCalledWith(false);
  act(() => { fireEvent.pointerUp(document, { clientX: 150, clientY: 150 }); });
  expect(onUse).not.toHaveBeenCalled();
});
