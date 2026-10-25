// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach } from 'vitest';
import { RogueDungeon } from './RogueDungeon';
import { combatantAt, REFERENCE_BUILDS } from '../utils/combate/level';
import { challengeFor, emptyRun, pathsFor, type RogueRun } from '../utils/rogueDungeon';

// Só o Zip é trocado por um stub (clicar = resolver o puzzle); os demais jogos são os reais.
vi.mock('./mente/ZipGame', () => ({
  ZipGame: ({ challenge }: { challenge?: { onResult: (w: boolean) => void } }) => (
    <button type="button" data-zip-stub onClick={() => challenge?.onResult(true)}>solve</button>
  ),
}));

afterEach(cleanup);
const D = '2026-10-25';
const combatant = combatantAt(20, REFERENCE_BUILDS.balanced);

describe('RogueDungeon', () => {
  it('mostra 3 caminhos no passo livre e resolve um puzzle', () => {
    const onChange = vi.fn();
    const { container } = render(<RogueDungeon language="en-US" todayKey={D} onChange={onChange} combatant={combatant} />);
    expect(container.querySelectorAll('[data-rogue-path]')).toHaveLength(3);
    const puzzle = container.querySelector('[data-rogue-path="puzzle"], [data-rogue-path="explore"]') as HTMLElement;
    fireEvent.click(puzzle);
    expect(container.querySelector('[data-rogue-challenge]')).not.toBeNull();
  });
  it('caminho de desafio monta um jogo REAL em modo desafio; sair = derrota que volta ao mapa', async () => {
    const onChange = vi.fn();
    const { container } = render(<RogueDungeon language="en-US" todayKey={D} onChange={onChange} combatant={combatant} />);
    fireEvent.click(container.querySelector('[data-rogue-path="puzzle"], [data-rogue-path="minigame"], [data-rogue-path="explore"]') as HTMLElement);
    await waitFor(() => expect(container.querySelector('[data-rogue-game]')).not.toBeNull());
    const exit = await waitFor(() => {
      const b = container.querySelector('[data-game-close-start], [data-game-close-end]') as HTMLElement | null;
      if (!b) throw new Error('jogo ainda carregando');
      return b;
    }, { timeout: 40000 });
    fireEvent.click(exit);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ step: 1, won: 0, over: false })));
  }, 60000);
  it('vitória do jogo volta ao mapa com o passo vencido e bônus pendente', async () => {
    const onChange = vi.fn();
    let step = 0;
    while (step < 24 && !(pathsFor(D, step).includes('puzzle') && challengeFor(D, step, 'puzzle').game === 'zip')) step++;
    const saved: RogueRun = { ...emptyRun(D), step };
    const { container } = render(<RogueDungeon language="en-US" todayKey={D} saved={saved} onChange={onChange} combatant={combatant} />);
    fireEvent.click(container.querySelector('[data-rogue-path="puzzle"]') as HTMLElement);
    const win = await waitFor(() => {
      const b = container.querySelector('[data-zip-stub]') as HTMLElement | null;
      if (!b) throw new Error('stub ainda carregando');
      return b;
    });
    fireEvent.click(win);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ step: step + 1, won: 1, bonusPending: true }));
  });
  it('combate obrigatório no 3º passo, em PT', () => {
    const saved: RogueRun = { ...emptyRun(D), step: 2 };
    const { container } = render(<RogueDungeon language="pt-BR" todayKey={D} saved={saved} onChange={() => {}} combatant={combatant} />);
    const paths = container.querySelectorAll('[data-rogue-path]');
    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('data-rogue-path')).toBe('combat');
    expect(container.textContent).toContain('Combate');
  });
  it('bônus pendente mostra 3 escolhas; outro dia ignora a incursão antiga', () => {
    const saved: RogueRun = { ...emptyRun(D), step: 1, won: 1, bonusPending: true };
    const a = render(<RogueDungeon language="en-US" todayKey={D} saved={saved} onChange={() => {}} combatant={combatant} />);
    expect(a.container.querySelectorAll('[data-rogue-bonus]')).toHaveLength(3);
    cleanup();
    const b = render(<RogueDungeon language="en-US" todayKey="2026-10-26" saved={saved} onChange={() => {}} combatant={combatant} />);
    expect(b.container.querySelectorAll('[data-rogue-bonus]')).toHaveLength(0);
    expect(b.container.querySelectorAll('[data-rogue-path]')).toHaveLength(3);
  });
  it('fim da incursão paga Bits uma vez e marca pago', () => {
    const onEarn = vi.fn();
    const onChange = vi.fn();
    const saved: RogueRun = { ...emptyRun(D), step: 5, won: 4, over: true };
    render(<RogueDungeon language="en-US" todayKey={D} saved={saved} onChange={onChange} combatant={combatant} onEarnPoints={onEarn} />);
    expect(onEarn).toHaveBeenCalledWith(4);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ paid: true }));
  });
});
