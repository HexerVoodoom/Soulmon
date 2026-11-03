// @vitest-environment jsdom
/** ALVO POR TOQUE (03/11/2026, dono): com 2+ inimigos, tocar num inimigo vivo escolhe o alvo do próximo golpe. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';

vi.mock('../../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn() }));

import { BattleStage, type StageFighter } from './BattleStage';

afterEach(() => cleanup());

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo' };
const foe = (k: number, down = false): StageFighter => ({ key: k, sprite: `foe${k}.png`, name: `R${k}`, hp: down ? 0 : 30, maxHp: 60, element: 'agua', down });

function Cena({ foes, onPick }: { foes: StageFighter[]; onPick: (i: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return <BattleStage scene="#123" isPt me={me} foes={foes} picked={picked} onPickFoe={(i) => { onPick(i); setPicked(i); }} title="Arena" closeLabel="Sair" onClose={() => {}} />;
}

describe('BattleStage: alvo por toque', () => {
  it('cada inimigo vivo é um botão "Mirar em <nome>"; o toque chama onPickFoe e liga o marcador', () => {
    const onPick = vi.fn();
    const { container } = render(<Cena foes={[foe(0), foe(1), foe(2, true)]} onPick={onPick} />);
    expect(screen.queryByRole('button', { name: 'Mirar em R2' })).toBeNull(); // caído não mira
    const b1 = screen.getByRole('button', { name: 'Mirar em R1' });
    expect(b1.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(b1);
    expect(onPick).toHaveBeenCalledWith(1);
    expect(screen.getByRole('button', { name: 'Mirar em R1' }).getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-stage-target-on="1"]')?.getAttribute('data-stage-target')).toBe('1');
    expect(screen.getByRole('button', { name: 'Mirar em R0' }).getAttribute('aria-pressed')).toBe('false');
  });
  it('luta 1×1 ou sem onPickFoe: nenhum botão de mira; rótulo em EN', () => {
    render(<BattleStage scene="#123" me={me} foes={[foe(0)]} onPickFoe={() => {}} title="A" closeLabel="X" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Target/ })).toBeNull();
    cleanup();
    render(<BattleStage scene="#123" me={me} foes={[foe(0), foe(1)]} title="A" closeLabel="X" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Target/ })).toBeNull();
    cleanup();
    render(<BattleStage scene="#123" me={me} foes={[foe(0), foe(1)]} onPickFoe={() => {}} title="A" closeLabel="X" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Target R1' })).toBeTruthy();
  });
});
