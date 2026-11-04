// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoulBarrage } from './SoulBarrage';

describe('SoulBarrage (render)', () => {
  it('abre muda, com o canvas e o botão de começar, em EN e PT', () => {
    const { container, unmount } = render(<SoulBarrage evolutionStage="rookie" language="en-US" onEarnPoints={() => {}} onExit={() => {}} />);
    expect(container.querySelector('[data-barrage-canvas]')).not.toBeNull();
    expect(screen.getByText('Start')).toBeTruthy();
    expect(container.querySelector('audio')).toBeNull();
    unmount();
    render(<SoulBarrage evolutionStage="rookie" language="pt-BR" onEarnPoints={() => {}} onExit={() => {}} />);
    expect(screen.getByText('Começar')).toBeTruthy();
  });
  it('Avançado: o rótulo "Toque duplo"/"Double tap" mora no botão Especial, em PT e EN', () => {
    for (const [language, txt] of [['pt-BR', 'Toque duplo'], ['en-US', 'Double tap']] as const) {
      const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(new Proxy({}, { get: () => () => {}, set: () => true }) as unknown as CanvasRenderingContext2D);
      const { container, unmount } = render(<SoulBarrage evolutionStage="rookie" language={language} initialLevel={2} onEarnPoints={() => {}} onExit={() => {}} />);
      fireEvent.click(container.querySelector('[data-barrage-start]') as HTMLElement);
      const btn = container.querySelector('[data-barrage-special]') as HTMLElement;
      expect(btn.querySelector('[data-barrage-doubletap]')?.textContent).toBe(txt);
      unmount();
      spy.mockRestore();
    }
  });
});
