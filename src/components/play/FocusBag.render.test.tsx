// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { FlyingItem, FocusBag } from './FocusBag';

afterEach(() => { cleanup(); vi.restoreAllMocks(); delete (Element.prototype as { animate?: unknown }).animate; });
const ITEM = { kind: 'material' as const, id: 'moss' as const, qty: 1 };

describe('FlyingItem', () => {
  it('anima do baú do mapa ao baú do canto e só avisa quando a animação termina', () => {
    let finish: (() => void) | undefined; const keyframes: Keyframe[][] = [];
    (Element.prototype as unknown as { animate: unknown }).animate = function (kf: Keyframe[]) { keyframes.push(kf); const a = { cancel: () => {}, set onfinish(f: () => void) { finish = f; }, set oncancel(_f: () => void) {} }; return a; };
    const done = vi.fn();
    render(<FlyingItem item={ITEM} isPt from={{ x: 100, y: 300 }} to={{ x: 30, y: 600 }} onDone={done} />);
    expect(done).not.toHaveBeenCalled();
    expect(keyframes[0][keyframes[0].length - 1].transform).toContain('translate(-70px,300px)');
    finish!();
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('com prefers-reduced-motion não anima: o item chega na hora', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    const animate = vi.fn(); (Element.prototype as unknown as { animate: unknown }).animate = animate;
    const done = vi.fn();
    render(<FlyingItem item={ITEM} isPt={false} from={{ x: 0, y: 0 }} to={{ x: 10, y: 10 }} onDone={done} />);
    expect(animate).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

describe('FocusBag', () => {
  it('o contador não conta o que ainda está em voo', () => {
    const { container } = render(<FocusBag language="pt-BR" items={[{ ...ITEM, qty: 3 }]} pending={2} />);
    expect(container.querySelector('[data-journey-bag-count]')!.textContent).toBe('1');
    expect(container.querySelector('[data-journey-bag]')!.getAttribute('aria-label')).toBe('Baú da sessão: 1 item');
  });
});
