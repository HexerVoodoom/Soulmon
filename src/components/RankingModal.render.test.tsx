// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { RankingModal } from './RankingModal';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('RankingModal (moldura própria do ranking, 18/11/2026)', () => {
  it('fechado não renderiza; aberto é um dialog com título, corpo e X só-glifo (alvo próprio, sem aro extra)', () => {
    const onClose = vi.fn();
    const { rerender } = render(<RankingModal open={false} onClose={onClose} language="pt-BR" title="Ranking"><p>lista</p></RankingModal>);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<RankingModal open onClose={onClose} language="pt-BR" title="Ranking"><p>lista</p></RankingModal>);
    const d = screen.getByRole('dialog', { name: 'Ranking' });
    expect(d.className).toContain('sm2-moldura-modal--ranking');
    expect(within(d).getByText('lista')).toBeTruthy();
    const x = within(d).getByRole('button', { name: 'Fechar' });
    expect(x.className).toContain('sm3-ranking-fechar');
    expect(d.querySelector('[data-moldura-modal]')?.getAttribute('data-moldura-modal') ?? '').toBe('');
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('sem `info` o disco do "i" fica decorativo (sem botão); com `info` o botão existe', () => {
    const { rerender } = render(<RankingModal open onClose={() => {}} language="en-US" title="Leaderboard"><p>x</p></RankingModal>);
    expect(document.querySelector('.sm2-info-hit')).toBeNull();
    rerender(<RankingModal open onClose={() => {}} language="en-US" title="Leaderboard" info="Weekly top 50"><p>x</p></RankingModal>);
    expect(document.querySelector('.sm2-info-hit')).not.toBeNull();
  });
  it('clicar no véu fecha', () => {
    const onClose = vi.fn();
    render(<RankingModal open onClose={onClose} language="pt-BR" title="Ranking"><p>x</p></RankingModal>);
    fireEvent.click(document.querySelector('[data-ranking-modal-bg]')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
