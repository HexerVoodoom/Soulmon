// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RankingPodium, type PodiumRow } from './RankingPodium';
import { resolvePodiumArt } from '../assets/soulmon/ranking';

const mk = (n: number, meAt = -1): PodiumRow[] =>
  Array.from({ length: n }, (_, i) => ({ rank: i + 1, name: `P${i + 1}`, score: 1000 - i, me: i + 1 === meAt }));
const slots = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-ranking-podium] > li')];

describe('RankingPodium (§326)', () => {
  it('DOM e leitor de tela em 1 · 2 · 3; a posição é o rótulo do pedestal; medalha decorativa; sem troféu/coroa (dono, 18/11/2026)', () => {
    const { container } = render(<RankingPodium rows={mk(3)} language="pt-BR" />);
    expect(slots(container).map(e => e.getAttribute('data-podium-place'))).toEqual(['1', '2', '3']);
    for (const n of [1, 2, 3]) expect(container.querySelector(`[role="img"][aria-label="${n}º lugar"]`)).toBeTruthy();
    expect([...container.querySelectorAll('.sm-rank-podium__medal')].every(m => m.getAttribute('aria-hidden') === 'true')).toBe(true);
    // sem troféu nem coroa em nenhum lugar
    expect(container.querySelectorAll('[data-podium-crown]').length).toBe(0);
  });

  it('resolvePodiumArt: cada peça é URL ou undefined; coroa só existe para o 1º (soltar o PNG não quebra este teste)', () => {
    for (const p of [1, 2, 3] as const) {
      const a = resolvePodiumArt(p);
      for (const v of [a.pedestal, a.medal, a.crown]) expect(v === undefined || typeof v === 'string').toBe(true);
    }
    expect(resolvePodiumArt(2).crown).toBeUndefined();
    expect(resolvePodiumArt(3).crown).toBeUndefined();
  });

  it('sem PNG: tudo em CSS (pedestal vazio, número em texto na medalha, sem troféu)', () => {
    const { container } = render(<RankingPodium rows={mk(3)} language="en-US" art={() => ({})} />);
    expect([...container.querySelectorAll('[data-podium-pedestal]')].map(e => e.getAttribute('data-podium-pedestal'))).toEqual(['css', 'css', 'css']);
    expect([...container.querySelectorAll('.sm-rank-podium__medal')].map(e => e.textContent)).toEqual(['1', '2', '3']);
    expect(container.querySelector('[aria-label="Rank 1"]')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-podium-crown]')).toBeNull();
  });

  it('com a arte: cada peça vira <img alt=""> da sua posição, sem mudar a estrutura', () => {
    const art = (p: 1 | 2 | 3) => ({ pedestal: `podio-${p}.png`, medal: `medalha-${p}.png`, crown: p === 1 ? 'coroa-1.png' : undefined });
    const { container } = render(<RankingPodium rows={mk(3)} language="pt-BR" art={art} />);
    const s = slots(container);
    expect(s[0].querySelector('[data-podium-pedestal="art"] img')!.getAttribute('src')).toBe('podio-1.png');
    expect(s[2].querySelector('[data-podium-medal="art"] img')!.getAttribute('src')).toBe('medalha-3.png');
    expect(s[0].querySelector('[data-podium-crown]')).toBeNull();
    expect([...container.querySelectorAll('img')].every(i => i.getAttribute('alt') === '')).toBe(true);
    // o rótulo de posição continua no pedestal
    expect(s[1].querySelector('[data-podium-pedestal][aria-label="2º lugar"]')).toBeTruthy();
  });

  it('só 1 pessoa: o 1º segue no centro e os outros dois lugares aparecem vazios, fora da árvore de acessibilidade', () => {
    const { container } = render(<RankingPodium rows={mk(1, 1)} language="pt-BR" />);
    const s = slots(container);
    expect(s.map(e => e.getAttribute('data-place'))).toEqual(['1', '2', '3']);
    expect(s[0].hasAttribute('data-podium-empty')).toBe(false);
    expect(s[0].getAttribute('aria-current')).toBe('true');
    expect(s[0].textContent).toContain('P1 (você)');
    for (const vazio of s.slice(1)) {
      expect(vazio.hasAttribute('data-podium-empty')).toBe(true);
      expect(vazio.getAttribute('aria-hidden')).toBe('true');
      expect(vazio.querySelector('[role="img"]')).toBeNull();
    }
  });

  it('nome com o clã embaixo (PlayerName), pontos em algarismos tabulares e a linha do prêmio', () => {
    const rows: PodiumRow[] = [
      { rank: 1, name: 'Aurora Vasconcelos de Albuquerque', guildName: 'Ordem do Cobre', score: 12840, me: false, prizePlace: 1 },
      { rank: 2, name: 'Kai', score: 11929, me: false },
    ];
    const { container } = render(<RankingPodium rows={rows} language="pt-BR" format={n => `${n} pts`} />);
    const s = slots(container);
    expect(s[0].querySelector('[data-player-name-text]')!.textContent).toBe('Aurora Vasconcelos de Albuquerque');
    expect(s[0].querySelector('[data-player-guild]')!.textContent).toBe('Clã Ordem do Cobre');
    expect(s[1].querySelector('[data-player-guild]')).toBeNull();
    const score = s[0].querySelector('[data-podium-score]')!;
    expect(score.textContent).toBe('12840 pts');
    expect(score.classList.contains('sm2-num')).toBe(true);
    expect(s[0].querySelector('.sm-rank-podium__prize')!.textContent).toBe('prêmio 1º');
  });
});
