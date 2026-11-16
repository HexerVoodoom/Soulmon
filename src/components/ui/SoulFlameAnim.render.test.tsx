// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SoulFlameAnim, FLAME_SHEET_FRAMES } from './SoulFlameAnim';

afterEach(cleanup);

describe('SoulFlameAnim', () => {
  it('desenha a folha por CSS, decorativa e com a altura pedida', () => {
    render(<SoulFlameAnim height={96} />);
    const el = document.querySelector('[data-soul-flame-anim]') as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.style.height).toBe('96px');
    expect(el.style.backgroundImage).toContain('chama-alma-folha');
    expect(document.querySelector('style')?.textContent).toContain('@keyframes sm-chama-alma');
    // v3: ilustração lisa, nunca pixelada
    expect(document.querySelector('style')?.textContent).not.toMatch(/pixelated/);
  });

  it('o ciclo passa por todos os quadros da folha', () => {
    render(<SoulFlameAnim />);
    const css = document.querySelector('style')?.textContent ?? '';
    const stops = css.match(/\d+\.\d{3}%\{background-position/g) ?? [];
    expect(stops.length).toBe(FLAME_SHEET_FRAMES);
  });
});
