// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach } from 'vitest';
import { RogueDungeon } from './RogueDungeon';
import { combatantAt, REFERENCE_BUILDS } from '../utils/combate/level';
import { emptyRun, type RogueRun } from '../utils/rogueDungeon';

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
