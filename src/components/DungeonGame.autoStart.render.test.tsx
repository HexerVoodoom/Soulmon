// @vitest-environment jsdom
/** "Entrar no Rift" (16/11/2026, pedido do dono): com `autoStart` a descida larga sozinha do ponto onde parou, sem o lobby nem 2º toque. */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.3); localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

function montar(save: Record<string, unknown>, autoStart: boolean) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ energyPoints: 12, ...save }));
  return renderWithCss(
    <GameStateProvider>
      <DungeonGame
        evolutionStage="rookie" language="pt-BR" petElement="fogo" autoStart={autoStart}
        onEnter={() => ({ ok: true, level: 1, best: 0 })} onLose={() => {}} onHeartDrop={() => false}
        onGlitchtama={() => {}} onEnemyDefeated={() => {}} onEarnPoints={() => {}} onExit={() => {}}
      />
    </GameStateProvider>,
  );
}

describe('DungeonGame autoStart', () => {
  it('com autoStart, abre direto na luta (sem o botão "Descer") e no andar onde parou (volta do mapa)', async () => {
    montar({ dungeonDepthRecord: 9, dungeonResumeLayer: 3 }, true);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByRole('button', { name: /^Descer/ })).toBeNull();
    expect(document.querySelector('[data-stage-hud]')!.textContent).toContain('Camada 3 · luta 1 de 6');
    expect(document.querySelector('[data-stage-hud]')!.textContent).toMatch(/ 1(\s|$)/); // o andar 3 é o 1º do conjunto: "<elemento> 1"
  });
  it('sem autoStart, o lobby com "Descer" segue como sempre', async () => {
    montar({}, false);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole('button', { name: /^Descer/ })).toBeTruthy();
  });
  it('autoStart sem energia: fica no lobby (que diz o porquê), não larga sozinho', async () => {
    montar({ energyPoints: 0 }, true);
    await act(async () => { await Promise.resolve(); });
    expect(document.querySelector('[data-stage-hud]')).toBeNull();
    expect(document.querySelector('[data-dungeon-no-energy]')).not.toBeNull();
  });
});
