// @vitest-environment jsdom
/** A placa da masmorra (14/10/2026): arte sem deformar (escala inteira), sem ícone de porta, texto curto, caixa fixa, alvo >= 44, aria. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DungeonSign, SIGN_W, SIGN_H, SIGN_ART_W, SIGN_ART_H, SIGN_SCALE } from './DungeonSign';

describe('DungeonSign', () => {
  afterEach(cleanup);
  it('a caixa é a arte × escala INTEIRA (sem esticar) e não depende do texto nem do idioma', () => {
    expect(SIGN_W / SIGN_ART_W).toBe(SIGN_SCALE);
    expect(SIGN_H / SIGN_ART_H).toBe(SIGN_SCALE);
    expect(Number.isInteger(SIGN_SCALE)).toBe(true);
    for (const [lang, ms] of [['pt-BR', 5 * 60_000], ['en-US', 95 * 60_000], ['pt-BR', null]] as const) {
      const { container, unmount } = render(<DungeonSign language={lang} returnInMs={ms} />);
      const b = container.querySelector('[data-dungeon-sign]') as HTMLElement;
      expect(b.style.width).toBe(`${SIGN_W}px`);
      expect(b.style.height).toBe(`${SIGN_H}px`);
      unmount();
    }
  });
  it('só a placa: uma <img> pixelated do tamanho da caixa, sem border-image e sem ícone da porta', () => {
    const { container } = render(<DungeonSign language="pt-BR" returnInMs={60_000} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    const img = imgs[0] as HTMLImageElement;
    expect(img.style.imageRendering).toBe('pixelated');
    expect(img.getAttribute('width')).toBe(String(SIGN_W));
    expect((container.querySelector('[data-dungeon-sign]') as HTMLElement).style.borderImage || 'none').toBe('none');
  });
  it('texto curto nos dois idiomas, aria com o tempo, toque chama onTap, alvo >= 44', () => {
    const onTap = vi.fn();
    render(<DungeonSign language="en-US" returnInMs={95 * 60_000} onTap={onTap} />);
    const b = screen.getByRole('button');
    expect(b.getAttribute('aria-label')).toBe('In Dungeon, back in 1h35. Tap for details');
    expect(b.querySelector('[data-dungeon-sign-label]')!.textContent).toBe('In Dungeon');
    expect(SIGN_W).toBeGreaterThanOrEqual(44);
    expect(SIGN_H).toBeGreaterThanOrEqual(44);
    fireEvent.click(b);
    expect(onTap).toHaveBeenCalledOnce();
  });
  it('já voltou: título "Voltou" + "da masmorra"', () => {
    render(<DungeonSign language="pt-BR" returnInMs={0} />);
    expect(screen.getByRole('button').textContent).toContain('Voltou');
    expect(screen.getByRole('button').textContent).toContain('da masmorra');
  });
});
