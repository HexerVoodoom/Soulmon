// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss as render, computed } from '../test/renderEnv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntroScreen } from './IntroScreen';

const nav = navigator as unknown as { userActivation?: unknown };
/** Já houve gesto na sessão: a tela de abertura é pulada (os testes do vídeo partem daqui). */
const comAtivacao = (ativo: boolean) => Object.defineProperty(navigator, 'userActivation', { configurable: true, value: ativo ? { hasBeenActive: true } : undefined });
beforeEach(() => { comAtivacao(true); localStorage.clear(); });
afterEach(() => { delete nav.userActivation; });

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

/**
 * 07/10/2026 — "o ícone, depois uma tela com um play cinza, e só depois o vídeo".
 * CAUSA: o <video> não tinha `poster`. O WebView do Android desenha um pôster
 * PADRÃO (o triângulo de play cinza) enquanto o vídeo remoto baixa, e o Chrome/
 * Safari desenham o botão nativo quando o autoplay é recusado. Conserto: pôster =
 * 1º quadro da marca, sem controles nativos, e o convite de reserva é nosso.
 */
describe('IntroScreen — sem a tela de play cinza', () => {
  it('o <video> tem pôster da marca, sem controles nativos, mudo e inline', () => {
    render(<IntroScreen onFinish={() => {}} />);
    const v = document.querySelector('video') as HTMLVideoElement;
    expect(v.getAttribute('poster'), 'sem poster o WebView do Android desenha o play cinza').toMatch(/intro-poster.*\.webp$/);
    expect(v.hasAttribute('controls')).toBe(false);
    expect(v.muted, 'a intro é muda: não briga com a música-tema (S17)').toBe(true);
    expect(v.hasAttribute('playsinline')).toBe(true);
    expect(v.getAttribute('preload')).toBe('auto');
  });

  it('o arquivo do pôster existe e o CSS esconde o overlay nativo e pinta o fundo na cor do quadro', () => {
    const raiz = join(__dirname, '..', '..');
    expect(readFileSync(join(raiz, 'src', 'assets', 'brand', 'intro-poster.webp')).length).toBeGreaterThan(1000);
    const css = readFileSync(join(raiz, 'src', 'index.css'), 'utf8');
    expect(css).toMatch(/\.sm2-splash-video::-webkit-media-controls-overlay-play-button/);
    expect(css).toMatch(/\.sm2-splash-video::-webkit-media-controls-start-playback-button/);
    expect(css).toMatch(/\.sm2-splash-video \{ background-color: #0f2a34; \}/);
  });

  it('autoplay recusado: o convite é NOSSO ("Tap to start"/"Toque para começar"), e o toque toca o vídeo em vez de pular', async () => {
    const play = vi.fn().mockRejectedValueOnce(new Error('NotAllowedError')).mockResolvedValue(undefined);
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = play as never;
    try {
      const onFinish = vi.fn();
      render(<IntroScreen onFinish={onFinish} />);
      await screen.findByText('Tap to start');
      fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
      expect(play).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Tap to start')).toBeNull();
      expect(onFinish).not.toHaveBeenCalled();
    } finally {
      HTMLMediaElement.prototype.play = orig;
    }
  });
});

/**
 * 07/10/2026 (S17) — o tema toca DURANTE a intro. O navegador só libera áudio num
 * gesto, então vem UMA tela de abertura (o pôster da marca + "Tap to start") antes
 * do vídeo; o toque inicia o tema e a intro. Pulada se não há o que liberar.
 */
describe('IntroScreen — tela de abertura (tema na intro)', () => {
  it('sem gesto prévio: mostra a marca + "Tap to start", sem vídeo e sem som antes do toque', () => {
    comAtivacao(false);
    render(<IntroScreen onFinish={() => {}} />);
    const alvo = screen.getByRole('button', { name: 'Tap to start' });
    expect(alvo.classList.contains('sm2-splash')).toBe(true);
    expect(alvo.querySelector('video')).toBeNull();
    expect((alvo.querySelector('img') as HTMLImageElement).getAttribute('src')).toMatch(/intro-poster.*\.webp$/);
    expect(alvo.style.background).toBe('');
  });

  it('o par PT-BR existe, com o inglês primeiro', () => {
    const src = readFileSync(join(__dirname, 'IntroScreen.tsx'), 'utf8');
    expect(src).toMatch(/isPt \? 'Toque para começar' : 'Tap to start'/);
  });

  it('o toque inicia a intro (vídeo muted monta) e pede o tema uma vez', async () => {
    comAtivacao(false);
    const tema = await import('../utils/tema');
    const espia = vi.spyOn(tema, 'iniciarTemaNoGesto').mockImplementation(() => {});
    render(<IntroScreen onFinish={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tap to start' }));
    expect(espia).toHaveBeenCalledTimes(1);
    const v = document.querySelector('video') as HTMLVideoElement;
    expect(v.muted).toBe(true);
    expect(screen.getByRole('button', { name: 'Skip intro' })).toBeTruthy();
    espia.mockRestore();
  });

  it('Enter também inicia (teclado)', () => {
    comAtivacao(false);
    render(<IntroScreen onFinish={() => {}} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Tap to start' }), { key: 'Enter' });
    expect(document.querySelector('video')).not.toBeNull();
  });

  it('já houve gesto, tema desligado ou app mudo: pula a abertura e vai direto à intro', () => {
    comAtivacao(true);
    const a = render(<IntroScreen onFinish={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Tap to start' })).toBeNull();
    expect(document.querySelector('video')).not.toBeNull();
    a.unmount();
    comAtivacao(false);
    localStorage.setItem('soulmon-sound-theme-off', 'true');
    render(<IntroScreen onFinish={() => {}} />);
    expect(document.querySelector('video')).not.toBeNull();
  });
});
