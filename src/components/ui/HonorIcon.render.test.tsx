// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { HonorIcon } from './HonorIcon';
import { CURRENCY_ART } from '../../assets/soulmon/icones-ui';

afterEach(cleanup);

describe('HonorIcon: Honra "B compacta" (24/11/2026)', () => {
  it('usa o PNG da B compacta, decorativo por padrão e com rótulo quando pedido', () => {
    expect(CURRENCY_ART.emblema).toMatch(/icone-honra-B-compacta-64/);
    const { container, rerender } = render(<HonorIcon size={20} />);
    const img = container.querySelector('img[data-honor-icon]')!;
    expect(img.getAttribute('src')).toBe(CURRENCY_ART.emblema);
    expect(img.getAttribute('alt')).toBe('');
    rerender(<HonorIcon size={20} label="Honra" />);
    expect(container.querySelector('img')!.getAttribute('alt')).toBe('Honra');
  });
});
