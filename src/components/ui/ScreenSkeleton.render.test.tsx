// @vitest-environment jsdom
/**
 * 9.4 (beta-2) — o carregamento minimalista: uma só palavra, nada de legenda repetida, e três estados
 * (carregando / erro com saída / concluído = nada).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { ScreenSkeleton } from './ScreenSkeleton';

installDomGlobals();
afterEach(cleanup);

describe('ScreenSkeleton (9.4)', () => {
  it('carregando: anuncia UMA vez, PT e EN, sem a legenda duplicada', () => {
    const { container, rerender } = render(<ScreenSkeleton language="pt-BR" />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Carregando');
    expect(container.textContent).not.toContain('Carregando…');
    expect(container.querySelector('[data-skel-word]')!.textContent).toBe('Carregando');
    expect(container.textContent!.replace(/@keyframes[sS]*$/, '').trim()).toContain('Carregando');
    rerender(<ScreenSkeleton language="en-US" />);
    expect(container.querySelector('[data-skel-word]')!.textContent).toBe('Loading');
    expect(container.textContent).not.toContain('Loading…');
  });

  it('o rótulo de quem chama vale ("Abrindo") e a variante inline é mais baixa que a de página', () => {
    const { container } = render(<ScreenSkeleton language="pt-BR" variant="inline" label="Abrindo" />);
    expect(container.querySelector('[data-skel-word]')!.textContent).toBe('Abrindo');
    const inline = (container.firstElementChild as HTMLElement).style.minHeight;
    cleanup();
    const page = render(<ScreenSkeleton language="pt-BR" />).container.firstElementChild as HTMLElement;
    expect(parseInt(inline, 10)).toBeLessThan(parseInt(page.style.minHeight, 10));
    expect(parseInt(page.style.minHeight, 10)).toBeLessThanOrEqual(96);
  });

  it('sem animação pesada: o visor não "respira" e movimento reduzido corta o pulso', () => {
    const { container } = render(<ScreenSkeleton language="en-US" />);
    expect(container.querySelector('.sm2-viewport')!.classList.contains('sm2-viewport-still')).toBe(true);
  });

  it('erro: frase curta em role=alert e "Tentar de novo" chama onRetry; sem onRetry, sem botão', () => {
    const onRetry = vi.fn();
    const { container, rerender } = render(<ScreenSkeleton language="pt-BR" state="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('Não deu para abrir agora.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<ScreenSkeleton language="en-US" state="error" />);
    expect(container.querySelector('[data-skel-retry]')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain("Couldn't open this right now.");
  });

  it('concluído: não desenha nada', () => {
    const { container } = render(<ScreenSkeleton language="en-US" state="done" />);
    expect(container.innerHTML).toBe('');
  });
});
