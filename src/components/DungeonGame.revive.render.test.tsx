// @vitest-environment jsdom
/** 💗 Na queda: a oferta "Usar Coraçãozinho" só aparece com estoque; recusar = derrota normal (esquerda), aceitar = gasta 1 e a luta continua (direita). */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

// na 1ª luta o Soulmon tem vida minúscula e cai; nas continuações (startFoesHp) o inimigo é fraco e a luta segue
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
vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.99); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const salvo = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE) ?? '{}');
const oferta = () => document.querySelector('[data-revive-offer]');

function montar(save: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  return renderWithCss(
    <GameStateProvider>
      <DungeonGame evolutionStage="rookie" language="en-US" petElement="fogo" onEnter={() => ({ ok: true, best: 0 })} onLose={() => {}}
        onHeartDrop={() => false} onGlitchtama={() => {}} onEnemyDefeated={() => {}} onEarnPoints={() => {}} onExit={() => {}} />
    </GameStateProvider>,
  );
}
async function ateOferta() {
  fireEvent.click(screen.getByRole('button', { name: 'Go down' }));
  for (let t = 0; t < 600_000 && !oferta() && !document.querySelector('[data-dungeon-ended]'); t += 1000) await avancar(1000);
}

describe('Masmorra — Coraçãozinho na queda', () => {
  it('sem Coraçãozinho: nenhuma oferta, derrota direta', async () => {
    vi.useFakeTimers();
    montar({ energyPoints: 3 });
    await ateOferta();
    expect(oferta()).toBeNull();
    expect(document.querySelector('[data-dungeon-ended]')).toBeTruthy();
  }, 60_000);

  it('com Coraçãozinho: oferece (mostrando quantos), recusar leva à derrota e NÃO gasta', async () => {
    vi.useFakeTimers();
    montar({ energyPoints: 3, foodInventory: { '💗': 2 } });
    await ateOferta();
    expect(oferta()).toBeTruthy();
    expect(document.querySelector('[data-revive-count]')!.textContent).toMatch(/2/);
    const botoes = oferta()!.querySelectorAll('button');
    expect(botoes[0].hasAttribute('data-revive-decline')).toBe(true); // esquerda = recusar
    expect(botoes[1].hasAttribute('data-revive-confirm')).toBe(true); // direita = confirmar
    fireEvent.click(botoes[0]);
    await avancar(1000);
    expect(oferta()).toBeNull();
    expect(document.querySelector('[data-dungeon-ended]')).toBeTruthy();
    expect(salvo().foodInventory?.['💗']).toBe(2);
  }, 60_000);

  it('aceitar: gasta 1 Coraçãozinho, a oferta fecha e a luta continua (sem derrota imediata)', async () => {
    vi.useFakeTimers();
    montar({ energyPoints: 3, foodInventory: { '💗': 2 } });
    await ateOferta();
    fireEvent.click(document.querySelector('[data-revive-confirm]')!);
    await avancar(500);
    expect(oferta()).toBeNull();
    expect(document.querySelector('[data-dungeon-ended]')).toBeNull();
    expect(salvo().foodInventory?.['💗']).toBe(1);
  }, 60_000);
});
