// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

vi.mock('../../utils/eatArt', () => ({
  eatStages: (e: string) => (e === '🍎' ? ['a1.png', 'a2.png', 'a3.png'] : null),
}));
import { FeedBubble } from './FeedBubble';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('FeedBubble', () => {
  it('mostra a comida em 3 estágios e some', () => {
    const done = vi.fn();
    const { container } = render(<FeedBubble emoji="🍎" runKey={1} reducedMotion={false} position={50} onDone={done} />);
    const img = () => container.querySelector('img')!.getAttribute('src');
    expect(img()).toBe('a1.png');
    act(() => { vi.advanceTimersByTime(350); });
    expect(img()).toBe('a2.png');
    act(() => { vi.advanceTimersByTime(350); });
    expect(img()).toBe('a3.png');
    expect(done).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(350); });
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('movimento reduzido: fica no estágio 1 e some', () => {
    const done = vi.fn();
    const { container } = render(<FeedBubble emoji="🍎" runKey={1} reducedMotion position={50} onDone={done} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(container.querySelector('img')!.getAttribute('src')).toBe('a1.png');
    act(() => { vi.advanceTimersByTime(400); });
    expect(done).toHaveBeenCalled();
  });
  it('sem arte dos estágios: só um coração (sem mãozinhas)', () => {
    const { container } = render(<FeedBubble emoji="🥩" runKey={1} reducedMotion={false} position={50} onDone={() => {}} />);
    expect(container.querySelector('[data-feed-bubble]')!.getAttribute('data-stage')).toBe('heart');
    expect(container.querySelector('img')!.getAttribute('src')).not.toMatch(/a\d\.png/);
  });
});
