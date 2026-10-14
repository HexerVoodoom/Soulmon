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
  it('carregando: a barra turquesa anuncia UMA vez (PT/EN), sem texto visível', () => {
    const { container, rerender } = render(<ScreenSkeleton language="pt-BR" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('Carregando');
    expect(container.textContent).toBe('');
    expect(container.querySelector('svg, img, .sm2-viewport')).toBeNull();
    rerender(<ScreenSkeleton language="en-US" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('Loading');
  });

  it('o rótulo de quem chama vale ("Abrindo") só para leitor de tela; inline é mais baixa que a página', () => {
    const { container } = render(<ScreenSkeleton language="pt-BR" variant="inline" label="Abrindo" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('Abrindo');
    const inline = (container.firstElementChild as HTMLElement).style.minHeight;
    cleanup();
    const page = render(<ScreenSkeleton language="pt-BR" />).container.firstElementChild as HTMLElement;
    expect(parseInt(inline, 10)).toBeLessThan(parseInt(page.style.minHeight, 10));
    expect(parseInt(page.style.minHeight, 10)).toBeLessThanOrEqual(96);
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

describe('ScreenSkeleton (P12, beta-2) — sem salto de layout nas telas inteiras', () => {
  it('as telas de página inteira (tutorial, upgrade, mapa, áreas, oráculo) usam a variante overlay (fora do fluxo: nada empurra nem salta)', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
    const page = app.match(/<ScreenSkeleton language=\{language\} \/>/g) ?? [];
    // restam só os de dentro de um cartão/aba (Sonhos, Descanso) e o do chunk de Estatísticas/Evolução/Pet/Hall/Configurações, que vivem em folhas de altura fixa
    expect(page.length).toBeLessThanOrEqual(9);
    for (const trecho of ["pane === 'map' && (\n            <Suspense fallback={<ScreenSkeleton language={language} variant=\"overlay\" />}>", "{area && (\n            <Suspense fallback={<ScreenSkeleton language={language} variant=\"overlay\" />}>", "pane === 'oracle' && (\n            <Suspense fallback={<ScreenSkeleton language={language} variant=\"overlay\" />}>"]) {
      expect(app).toContain(trecho);
    }
  });
  it('overlay não ocupa lugar no fluxo (position fixed) e a página tem altura mínima de 96', () => {
    const o = render(<ScreenSkeleton language="en-US" variant="overlay" />).container.firstElementChild as HTMLElement;
    expect(o.style.position).toBe('fixed');
    cleanup();
    const p = render(<ScreenSkeleton language="en-US" />).container.firstElementChild as HTMLElement;
    expect(p.style.minHeight).toBe('96px');
  });
});
