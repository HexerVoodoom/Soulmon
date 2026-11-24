// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { EtapaAlimentar } from './EtapaAlimentar';
import { EAT_STAGE_MS } from '../../home/FeedBubble';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

function arrastar(item: HTMLElement, x: number, y: number) {
  fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0, pointerType: 'touch' });
  act(() => {
    fireEvent.pointerMove(document, { clientX: 40, clientY: 350, pointerType: 'touch' });
    fireEvent.pointerMove(document, { clientX: x, clientY: y, pointerType: 'touch' });
  });
  act(() => { fireEvent.pointerUp(document, { clientX: x, clientY: y, pointerType: 'touch' }); });
}

describe('EtapaAlimentar', () => {
  it('começa bloqueando o toque fora da pasta e só conclui depois de comer', () => {
    const onDone = vi.fn(); const onFeed = vi.fn();
    const { container } = render(<EtapaAlimentar onDone={onDone} onFeed={onFeed} />);
    expect(container.querySelector('[data-bloqueio]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Arquivos' }));
    expect(container.querySelector('[data-bloqueio]')).toBeNull();

    // largar longe do pet não alimenta nem conclui
    const item = document.querySelector('[data-item]') as HTMLElement;
    arrastar(item, 9999, 9999);
    expect(onFeed).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();

    // largar sobre o pet (jsdom: caixa 0,0 + folga)
    arrastar(document.querySelector('[data-item]') as HTMLElement, 1, 1);
    expect(onFeed).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled(); // ainda mastigando
    act(() => { vi.advanceTimersByTime(EAT_STAGE_MS * 3 + 50); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
