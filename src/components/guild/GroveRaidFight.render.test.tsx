/** @vitest-environment jsdom */
/** §204: a luta do Bosque monta na BattleStage com os 3 inimigos e sair conta como derrota (sem custo). */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GroveRaidFight } from './GroveRaidFight';
import { combatantAt, REFERENCE_BUILDS } from '../../utils/combate/level';

describe('GroveRaidFight', () => {
  it('monta a cena da luta', () => {
    const onResult = vi.fn();
    const { container } = render(<GroveRaidFight isPt={false} seed={42} combatant={combatantAt(10, REFERENCE_BUILDS.balanced)} onResult={onResult} />);
    expect(container.querySelector('[data-grove-raid]')).not.toBeNull();
    expect(onResult).not.toHaveBeenCalled();
  });
});
