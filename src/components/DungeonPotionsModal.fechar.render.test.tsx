// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DungeonPotionsModal } from './DungeonPotionsModal';
import { HEAL_POTIONS } from '../utils/dungeonPotions';

/** Dono (23/11/2026): o ✕ do aviso de poções SÓ FECHA — nada é deixado/gasto; confirmar é só o botão. */
describe('DungeonPotionsModal: fechar não confirma', () => {
  afterEach(cleanup);
  const owned = { [HEAL_POTIONS[0]]: 2 } as never;
  it('✕ chama onClose e NÃO onConfirm', () => {
    const onConfirm = vi.fn(); const onClose = vi.fn();
    render(<DungeonPotionsModal owned={owned} initial={{} as never} language="en-US" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('o botão confirma com a quantidade', () => {
    const onConfirm = vi.fn(); const onClose = vi.fn();
    render(<DungeonPotionsModal owned={owned} initial={{} as never} language="en-US" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(document.querySelector('[data-dungeon-potions-ok]')!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
