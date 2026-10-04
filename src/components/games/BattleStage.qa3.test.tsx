// @vitest-environment jsdom
/**
 * QA3 — a pausa da luta mora no `confirming` interno. Se `exitConfirm` some com o diálogo
 * aberto (a luta acaba por outro caminho), o diálogo some mas a pausa ficava ligada: o pai
 * seguia `paused=true` e a luta/rodada seguinte nascia congelada.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BattleStage, type StageFighter } from './BattleStage';

afterEach(() => { cleanup(); });
const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo' };
const foe: StageFighter = { key: 1, sprite: 'foe.png', name: 'Ini', hp: 30, maxHp: 60, element: 'agua' };

describe('BattleStage — pausa some com a confirmação', () => {
  it('exitConfirm removido com o diálogo aberto despausa', () => {
    const onPauseChange = vi.fn();
    const ec = { title: 'Sair?', stay: 'Ficar', leave: 'Sair' };
    const base = { me, foes: [foe], title: 't', closeLabel: 'Fechar', onClose: () => {}, onPauseChange };
    const r = render(<BattleStage {...base} exitConfirm={ec} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onPauseChange).toHaveBeenLastCalledWith(true);
    r.rerender(<BattleStage {...base} exitConfirm={undefined} />);
    expect(onPauseChange).toHaveBeenLastCalledWith(false);
    // e se voltar a existir, o diálogo não reabre sozinho
    r.rerender(<BattleStage {...base} exitConfirm={ec} />);
    expect(document.querySelector('[data-stage-confirm]')).toBeNull();
    expect(onPauseChange).toHaveBeenLastCalledWith(false);
  });
});
