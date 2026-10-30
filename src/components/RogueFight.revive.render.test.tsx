// @vitest-environment jsdom
/** 💗 Calabouço: na queda, a oferta "Usar Coraçãozinho" só existe com estoque; esquerda recusa, direita aceita (gasta 1, 50% HP, a luta segue). */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { RogueFight } from './RogueFight';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { emptyRun } from '../utils/rogueDungeon';
import { combatantAt, REFERENCE_BUILDS } from '../utils/combate/level';

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never, opts: never) {
      const cont = (opts as { startFoesHp?: number[] }).startFoesHp;
      const f = (foes as unknown as Array<{ combatant: { hp: number } }>).map(x => ({ ...x, combatant: { ...x.combatant, hp: x.combatant.hp * (cont ? 0.0001 : 1) } }));
      const p = player as unknown as { combatant: { hp: number } };
      const fraco = cont ? p : { ...p, combatant: { ...p.combatant, hp: p.combatant.hp * 0.001 } };
      const g = real.groupFightSteps(fraco as never, f as never, opts);
      let r = g.next();
      while (!r.done) { const ans: number | undefined = yield r.value; r = g.next(ans); }
      return r.value;
    },
  };
});
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const salvo = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE) ?? '{}');
const oferta = () => document.querySelector('[data-revive-offer]');
const fim = () => document.querySelector('[data-rogue-fight-end]');
const combatant = combatantAt(10, REFERENCE_BUILDS.balanced);

function montar(save: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  return renderWithCss(
    <GameStateProvider>
      <RogueFight language="en-US" run={emptyRun('2026-10-30')} step={0} combatant={combatant} floor={1} onResult={() => {}} />
    </GameStateProvider>,
  );
}
async function ate() { for (let t = 0; t < 300_000 && !oferta() && !fim(); t += 1000) await avancar(1000); }

describe('Calabouço — Coraçãozinho na queda', () => {
  it('sem Coraçãozinho: sem oferta, derrota direta', async () => {
    vi.useFakeTimers(); montar({});
    await ate();
    expect(oferta()).toBeNull();
    expect(fim()?.getAttribute('data-rogue-fight-end')).toBe('lost');
  }, 60_000);

  it('com Coraçãozinho: oferece; esquerda recusa e NÃO gasta', async () => {
    vi.useFakeTimers(); montar({ foodInventory: { '💗': 2 } });
    await ate();
    expect(oferta()).toBeTruthy();
    expect(document.querySelector('[data-revive-count]')!.textContent).toMatch(/2/);
    const b = oferta()!.querySelectorAll('button');
    expect(b[0].hasAttribute('data-revive-decline')).toBe(true);
    expect(b[1].hasAttribute('data-revive-confirm')).toBe(true);
    fireEvent.click(b[0]);
    await avancar(500);
    expect(oferta()).toBeNull();
    expect(fim()?.getAttribute('data-rogue-fight-end')).toBe('lost');
    expect(salvo().foodInventory?.['💗']).toBe(2);
  }, 60_000);

  it('aceitar: gasta 1 e a luta continua (vence a continuação)', async () => {
    vi.useFakeTimers(); montar({ foodInventory: { '💗': 2 } });
    await ate();
    fireEvent.click(document.querySelector('[data-revive-confirm]')!);
    await avancar(500);
    expect(oferta()).toBeNull();
    expect(salvo().foodInventory?.['💗']).toBe(1);
    await ate();
    expect(fim()?.getAttribute('data-rogue-fight-end')).toBe('won');
  }, 60_000);
});
void screen;
