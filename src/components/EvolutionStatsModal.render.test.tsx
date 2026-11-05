// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionStatsModal } from './EvolutionStatsModal';
import type { EvoStatsDelta } from '../utils/evolutionStatsDelta';

afterEach(cleanup);

const delta: EvoStatsDelta = {
  levelBefore: 12, levelAfter: 13,
  rows: [
    { id: 'hp', before: 400, after: 900, delta: 500 },
    { id: 'atk', before: 8, after: 9, delta: 1 },
    { id: 'def', before: 4, after: 4, delta: 0 },
    { id: 'spd', before: 5, after: 4, delta: -1 },
  ],
};

describe('EvolutionStatsModal', () => {
  it('lista os 4 atributos com antes → depois (+N), +0 e −N, em PT', () => {
    renderWithCss(<EvolutionStatsModal delta={delta} stageName="Champion" language="pt-BR" onClose={() => {}} />);
    for (const t of ['Vida', 'Ataque', 'Defesa', 'Velocidade']) expect(screen.getByText(t)).toBeTruthy();
    expect(document.querySelector('[data-evo-stat="hp"]')!.textContent).toContain('(+500)');
    expect(document.querySelector('[data-evo-stat="def"]')!.textContent).toContain('(+0)');
    expect(document.querySelector('[data-evo-stat="spd"]')!.textContent).toContain('(\u22121)');
    expect(screen.getByText('Champion chegou a Lv 13.')).toBeTruthy();
    expect(document.querySelectorAll('[data-evo-stat]').length).toBe(4);
  });
  it('EN e fechar pelo botão', () => {
    const onClose = vi.fn();
    renderWithCss(<EvolutionStatsModal delta={delta} stageName="Champion" language="en-US" onClose={onClose} />);
    for (const t of ['HP', 'Attack', 'Defense', 'Speed']) expect(screen.getByText(t)).toBeTruthy();
    fireEvent.click(document.querySelector('[data-evo-stats-ok]')!);
    expect(onClose).toHaveBeenCalled();
  });
});
