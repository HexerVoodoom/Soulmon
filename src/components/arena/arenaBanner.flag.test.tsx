// @vitest-environment jsdom
/** Banner da Arena religado (ARENA_BANNER_ATIVO=true): renderiza único, como primeiro filho da lista. */
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { DueloSheet } from './DueloSheet';

vi.mock('../../utils/fxPackArt', async (orig) => ({ ...(await orig<typeof import('../../utils/fxPackArt')>()), ARENA_BANNER_ATIVO: true }));

describe('ARENA_BANNER_ATIVO=true', () => {
  it('renderiza o banner único acima da lista', async () => {
    const { container } = renderWithCss(<DueloSheet arena={{ dayIso: '2026-10-28', accountKey: 'conta-teste', bits: 100, onReroll: () => true }} language="en-US" evolutionStage="rookie" onStart={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-arena-card]').length).toBeGreaterThan(0));
    expect(container.querySelectorAll('[data-arena-banner]')).toHaveLength(1);
    expect(container.querySelector('[data-arena-escolha]')!.firstElementChild!.hasAttribute('data-arena-banner')).toBe(true);
  });
});
