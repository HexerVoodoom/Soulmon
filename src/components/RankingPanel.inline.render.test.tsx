// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { RankingPanel } from './RankingPanel';

vi.mock('../utils/rankings', async (orig) => ({
  ...(await orig<typeof import('../utils/rankings')>()),
  fetchRanking: vi.fn(async () => ({ top: [{ rank: 1, name: 'Ana', score: 90, me: false }], me: null })),
}));

describe('RankingPanel inline (pergunta do Pipo, 30/10/2026)', () => {
  it('mostra a tabela direto, sem botão "Ver ranking" nem modal', async () => {
    const { container } = render(<RankingPanel game="dino-1" saveId="s1" language="pt-BR" inline />);
    await waitFor(() => expect(container.querySelector('[data-ranking-list]')).toBeTruthy());
    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toContain('Ana');
  });
});
