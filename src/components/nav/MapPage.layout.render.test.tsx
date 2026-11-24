// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MapPage } from './MapPage';
import { MAPA_PALCO_CONTAIN_STYLE } from '../../utils/areaLotGeometry';

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
  it('mapa inteiro: livre = da base da barrinha à base da tela; palco em contain (min), centrado', () => {
    const { container } = render(<MapPage language="pt-BR" onOpenArea={vi.fn()} bits={0} emblems={0} credits={0} />);
    const livre = container.querySelector<HTMLElement>('[data-map-livre]')!;
    expect(livre.style.top).toContain('--sm2-topbar-push');
    expect(livre.getAttribute('style')).toContain('safe-area-inset-bottom');
    const bg = container.querySelector<HTMLElement>('[data-map-bg]')!;
    const palco = bg.parentElement!;
    expect(MAPA_PALCO_CONTAIN_STYLE.width).toContain('min(100cqw'); // jsdom descarta cqw: confere a constante
    expect(MAPA_PALCO_CONTAIN_STYLE.width).not.toContain('max(');
    
    // alvos de toque são filhos do palco (% da imagem), não da tela
    expect(palco.querySelectorAll('[data-map-area]').length).toBe(7);
    expect(bg.style.objectFit).toBe('fill');
  });
});
