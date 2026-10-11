// @vitest-environment jsdom
/**
 * O MARCO do andar 5 (descida idle, 08/10/2026): limpar o andar `DUNGEON_MILESTONE_FLOOR` paga o Glitchtama UMA VEZ por descida
 * (a base semanal saiu em 11/10/2026, REGISTRO §31) — e a descida NÃO acaba ali (andares infinitos). Os inimigos são enfraquecidos no
 * envoltório do núcleo só para o teste alcançar o andar 6 sem depender da parede de dificuldade; a regra de combate
 * em si (e a parede) é medida em `dungeonIdle.test.ts` e `dungeon.v3.test.ts`.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never, opts: never) {
      const fracos = (foes as unknown as Array<{ combatant: { hp: number } }>).map(f => ({ ...f, combatant: { ...f.combatant, hp: f.combatant.hp * 0.05 } }));
      const g = real.groupFightSteps(player, fracos as never, opts);
      let r = g.next();
      while (!r.done) { const ans: number | undefined = yield r.value; r = g.next(ans); }
      return r.value;
    },
  };
});
vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.3); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const andarAtual = () => Number(/Layer (\d+)/.exec(document.querySelector('[data-dungeon-floor-live]')?.textContent ?? '')?.[1] ?? 0);

describe('o marco do andar 5', () => {
  it('o Glitchtama sai UMA vez por descida, no primeiro marco (camada 5); a descida segue além dele', async () => {
    vi.useFakeTimers();
    const onGlitchtama = vi.fn();
    const onFloorCleared = vi.fn();
    renderWithCss(
      <DungeonGame
        evolutionStage="rookie" language="en-US" petElement="fogo"
        onEnter={() => ({ ok: true, best: 0 })} onLose={() => {}} onHeartDrop={() => false}
        onGlitchtama={onGlitchtama} onFloorCleared={onFloorCleared} onEnemyDefeated={() => {}} onEarnPoints={() => {}} onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go down' }));
    let maxAndar = 0, marcoVisto = false;
    for (let t = 0; t < 4_000_000 && maxAndar < 7; t += 1000) {
      await avancar(1000);
      maxAndar = Math.max(maxAndar, andarAtual());
      if (document.querySelector('[data-dungeon-milestone]')) marcoVisto = true;
      if (document.querySelector('[data-dungeon-ended]')) break;
    }
    expect(maxAndar, 'a descida passou do andar 5 sem teto').toBeGreaterThanOrEqual(7);
    expect(marcoVisto).toBe(true);
    expect(onGlitchtama).toHaveBeenCalledTimes(1); // idempotente: andares 6 e 7 não pagam de novo
    expect(onFloorCleared.mock.calls.length).toBeGreaterThanOrEqual(6);
  }, 120_000);
});
