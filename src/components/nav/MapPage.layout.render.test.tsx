// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MapPage } from './MapPage';

describe('Mapa em viewport integral', () => {
  it('não adiciona margem, scroll ou borda lateral própria', () => {
    const { container } = render(<MapPage language="pt-BR" onOpenArea={vi.fn()} bits={0} emblems={0} credits={0} />);
    const map = container.querySelector<HTMLElement>('[data-map-page]')!;
    expect(map.style.width).toBe('100%');
    expect(map.style.height).toBe('100%');
    expect(map.style.margin).toBe('0px');
    expect(map.style.overflow).toBe('hidden');
    expect(map.style.minHeight).toBe('0px');
  });
});
