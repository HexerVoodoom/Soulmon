// @vitest-environment jsdom
/**
 * Canvas Estatísticas (§27) — a régua de render da `StatsPage`.
 *
 * Até aqui nenhum teste montava a página (achado 11 do canvas): o vazio
 * (STAT-02) e a Janela de Descanso (`hideMetrics`, achado 6 / R2) não tinham
 * régua nenhuma. Este arquivo guarda o que o canvas decidiu e o que o
 * `CLAUDE.md` (🛏️ Janela de Descanso) manda: com o descanso ligado os NÚMEROS
 * somem e as RECOMPENSAS ficam.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { StatsPage } from './StatsPage';

const base = {
  completedTasks: [
    { id: 't1', name: 'Alongar', category: 'Health' as const, emoji: '🧘', completedAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
  ],
  activityStats: {
    'activity-1': { name: 'Alongar', emoji: '🧘', category: 'Health' as const, completionCount: 14 },
  },
  language: 'en-US' as const,
  totalXP: 320,
  streakDays: 12,
  petPassive: 'sortudo',
  daysTogether: 34,
  birth: { spriteUrl: 'https://cdn/igni.png', name: 'Pixel', soulGoal: 'sleep earlier', bornAt: '2026-09-03' },
  bestiary: ['ignar-rookie', 'ignar-champion', 'lumel-rookie'],
  album: [
    { id: 'rookie', name: 'Sprout', spriteUrl: 'https://cdn/a.png' },
    { id: 'champion-harmony', name: 'Ember', spriteUrl: 'https://cdn/b.png' },
  ],
  journey: { unlockedEvolutions: ['rookie'], dungeonRunsCompleted: 2 },
};

describe('StatsPage — canvas §27', () => {
  it('o vínculo é a PALAVRA (Cinzel 24) com "Level N" e o medidor SIS-07', () => {
    const { container } = renderWithCss(<StatsPage {...base} />);
    const word = container.querySelector('#sm2-bond-title') as HTMLElement;
    expect(word.className).toContain('sm2-stats-word');
    // jsdom não resolve `var()`: a régua é a declaração da classe (`--sm2-text-xl` = 24).
    expect(getComputedStyle(word).fontSize).toBe('var(--sm2-text-xl)');
    expect(container.textContent).toMatch(/Level \d/);
    const meter = screen.getByRole('progressbar');
    expect(meter.className).toContain('sm2-kit-meter');
    expect(meter.getAttribute('aria-valuenow')).not.toBeNull();
  });

  it('traço com ícone Material pelado — Sortudo é `star`, nunca `casino` (X2)', () => {
    const { container } = renderWithCss(<StatsPage {...base} />);
    const trait = container.querySelector('.sm2-stats-trait') as HTMLElement;
    expect(trait.textContent).toContain('star');
    expect(trait.textContent).toContain('Lucky');
    expect(container.textContent).not.toContain('casino');
  });

  it('o cartão de nascimento é o visor do reveal: vidro 192² com o nome, sprite 128', () => {
    const { container } = renderWithCss(<StatsPage {...base} />);
    const vidro = container.querySelector('.sm2-stats-birth [role="img"]') as HTMLElement;
    expect(vidro.getAttribute('aria-label')).toBe('Pixel');
    const screenEl = vidro.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(screenEl.style.width).toBe('192px');
    const img = vidro.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('width')).toBe('128');
    expect(img.getAttribute('alt')).toBe('');
  });

  it('encontros em mini-visores 64² (3 of 36) e álbum com silhueta por máscara', () => {
    const { container } = renderWithCss(<StatsPage {...base} />);
    expect(container.textContent).toContain('3 of 36');
    expect(container.textContent).toContain('1/2');
    expect(container.querySelectorAll('[data-mini-glass]').length).toBe(36 + 2);
    expect(container.querySelectorAll('[data-silhouette]').length).toBe(33 + 1);
    expect(container.textContent).toContain('???');
  });

  it('só o dígito no "0" (D-S11) e o vazio sem "0 of 36" / "0/11"', () => {
    const { container } = renderWithCss(
      <StatsPage
        completedTasks={[]}
        activityStats={{}}
        language="en-US"
        totalXP={0}
        streakDays={0}
        petPassive="guloso"
        birth={{ spriteUrl: null, name: 'Pixel', bornAt: '2026-09-03' }}
        bestiary={[]}
        album={[]}
      />,
    );
    const n = container.querySelector('.sm2-stats-count .sm2-stats-word') as HTMLElement;
    expect(n.textContent).toBe('0');
    expect(container.textContent).toContain('Just met');
    expect(container.textContent).toMatch(/Level \d/);
    expect(container.textContent).not.toMatch(/0 of 36|0\/11|0\/0/);
    // Silhueta e vidro vazio: nenhum PNG no cartão sem sprite próprio.
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('`hideMetrics`: somem os números, ficam a palavra, o cartão, as artes e as listas', () => {
    const { container } = renderWithCss(<StatsPage {...base} hideMetrics />);
    const texto = container.textContent ?? '';
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(texto).not.toMatch(/Level \d/);
    expect(texto).not.toContain('complete days');
    expect(texto).not.toContain('days together');
    expect(texto).not.toContain('of 36');
    expect(texto).not.toContain('1/2');
    expect(texto).not.toMatch(/done \d+×/);
    expect(texto).not.toContain('You two also');
    // Recompensas preservadas.
    expect(texto).toContain('Pixel');
    expect(texto).toContain('Born');
    expect(texto).toContain('Alongar');
    expect(container.querySelectorAll('[data-mini-glass]').length).toBe(36 + 2);
    expect(container.querySelectorAll('.sm2-stats-birth [role="img"]')).toHaveLength(1);
  });

  it('nada de vermelho, nada de Silkscreen, nada de opacidade em tinta', () => {
    const { container } = renderWithCss(<StatsPage {...base} />);
    const html = container.innerHTML;
    expect(html).not.toContain('danger');
    expect(html).not.toContain('sm2-pix');
    expect(html).not.toMatch(/opacity:\s*0?\.\d/);
    expect(html).not.toContain('brightness(0)');
  });
});
