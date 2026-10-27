// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ElementAdvantageBadge } from './ElementAdvantageBadge';
import { ELEMENT_ADVANTAGE_TAG, RING_TAG } from './pveTags';
import { elementAdvantage } from '../../utils/arena';

describe('ElementAdvantageBadge', () => {
  afterEach(cleanup);
  it('+1 → Super effective!/Super eficiente!', () => {
    const { unmount } = render(<ElementAdvantageBadge advantage={1} isPt={false} />);
    expect(screen.getByRole('status').textContent).toBe('Super effective!');
    unmount();
    render(<ElementAdvantageBadge advantage={1} isPt />);
    expect(screen.getByRole('status').textContent).toBe('Super eficiente!');
  });
  it('-1 → Not very effective/Pouco eficiente', () => {
    const { unmount } = render(<ElementAdvantageBadge advantage={-1} isPt={false} />);
    expect(screen.getByRole('status').textContent).toBe('Not very effective');
    unmount();
    render(<ElementAdvantageBadge advantage={-1} isPt />);
    expect(screen.getByRole('status').textContent).toBe('Pouco eficiente');
  });
  it('0 não renderiza nada', () => {
    const { container } = render(<ElementAdvantageBadge advantage={0} isPt={false} />);
    expect(container.innerHTML).toBe('');
  });
  it('segue a conta do combate (fogo vence planta) e as notas do anel ficam como estavam', () => {
    expect(elementAdvantage('fogo', ['planta'])).toBe(1);
    expect(elementAdvantage('planta', ['fogo'])).toBe(-1);
    expect(elementAdvantage('fogo', ['agua'])).toBe(0);
    expect(RING_TAG.en).toEqual({ otimo: 'GREAT!', bom: 'GOOD', ruim: 'WEAK' });
    expect(ELEMENT_ADVANTAGE_TAG.en.up).toBe('Super effective!');
  });
});
