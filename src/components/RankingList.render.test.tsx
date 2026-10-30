// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RankingList } from './RankingList';

const mk = (n: number, meAt = -1) => Array.from({ length: n }, (_, i) => ({ rank: i + 1, name: `P${i + 1}`, score: 1000 - i, me: i + 1 === meAt }));

describe('RankingList', () => {
  it('pódio: 3 primeiros com medalha, ordem de leitura 1-2-3 e rótulo de posição', () => {
    const { container } = render(<RankingList rows={mk(10)} language="pt-BR" />);
    const places = [...container.querySelectorAll('[data-ranking-podium] > li')].map(e => e.getAttribute('data-podium-place'));
    expect(places).toEqual(['1', '2', '3']);
    expect(container.querySelector('[data-ranking-podium] [aria-label="1º lugar"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-ranking-rest] li').length).toBe(7);
  });

  it('jogador dentro do top 50: linha destacada no lugar, aria-current, sem linha fixa', () => {
    const { container } = render(<RankingList rows={mk(50, 12)} meRank={12} meScore={989} language="en-US" />);
    const cur = container.querySelectorAll('[aria-current]');
    expect(cur.length).toBe(1);
    expect(cur[0].textContent).toContain('P12');
    expect(container.querySelector('[data-ranking-pinned]')).toBeNull();
    expect(container.querySelectorAll('li').length).toBe(50);
  });

  it('jogador abaixo do 50: linha fixa no fim, depois do "…", com a posição real', () => {
    const { container } = render(<RankingList rows={mk(50)} meRank={137} meScore={321} language="pt-BR" />);
    const pinned = container.querySelector('[data-ranking-pinned]')!;
    expect(pinned.getAttribute('aria-current')).toBe('true');
    expect(pinned.textContent).toContain('137');
    expect(pinned.textContent).toContain('Você');
    const gap = container.querySelector('[data-ranking-gap]')!;
    expect(gap.textContent).toBe('…');
    expect(gap.compareDocumentPosition(pinned) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll('[aria-current]').length).toBe(1);
  });
});
