// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss as render, computed } from '../test/renderEnv';
import { IntroScreen } from './IntroScreen';

/**
 * A intro pelo canvas Onboarding-funil (ONB-03/04, DECISÕES §23, X4):
 * o mesmo `.sm2-splash` da splash, paleta do visor, o quadro inteiro é o
 * alvo "Skip intro" com teclado, e nenhum literal de cor.
 */
describe('IntroScreen — a continuação do boot no visor', () => {
  it('o quadro inteiro é `role=button` "Skip intro", e Enter/Espaço pulam', () => {
    vi.useFakeTimers();
    const onFinish = vi.fn();
    render(<IntroScreen onFinish={onFinish} />);
    const alvo = screen.getByRole('button', { name: 'Skip intro' });
    expect(alvo.classList.contains('sm2-splash')).toBe(true);
    expect(alvo.classList.contains('sm2-visor')).toBe(true);
    expect(alvo.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(alvo, { key: 'Enter' });
    vi.advanceTimersByTime(450);
    expect(onFinish).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('o vídeo é `cover` dentro do vidro e o fundo é o token do visor, não um literal', () => {
    render(<IntroScreen onFinish={() => {}} />);
    const alvo = screen.getByRole('button', { name: 'Skip intro' });
    const video = alvo.querySelector('video')!;
    expect(video.classList.contains('sm2-splash-video')).toBe(true);
    expect(computed(video, 'object-fit')).toBe('cover');
    expect(alvo.style.background).toBe('');
    expect(alvo.style.backgroundColor).toBe('');
    expect(alvo.querySelector('.sm2-viewport-glass')).toBeTruthy();
  });

  it('erro do vídeo: corvo a 128 direto sobre o vidro (sem placa), wordmark Silkscreen, sem alvo', () => {
    render(<IntroScreen onFinish={() => {}} />);
    const video = document.querySelector('video')!;
    fireEvent.error(video);
    expect(screen.queryByRole('button')).toBeNull();
    const img = document.querySelector('img.sm2-splash-raven') as HTMLImageElement;
    expect(img.width).toBe(128);
    expect(img.parentElement!.classList.contains('sm2-splash')).toBe(true);
    expect(document.querySelector('.sm2-splash-wordmark')!.textContent).toBe('Soulmon');
  });
});
