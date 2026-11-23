// @vitest-environment jsdom
/** Portais do Rift na descida (REGISTRO §471): aviso de topo 1× e, num portal com outro mais fundo liberado, o jogador vai ao mapa. */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DungeonGame } from './DungeonGame';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.3); localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); });

function montar(save: Record<string, unknown>, onOpenRiftMap?: () => void) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ energyPoints: 12, ...save }));
  return renderWithCss(
    <GameStateProvider>
      <DungeonGame
        evolutionStage="rookie" language="pt-BR" petElement="fogo"
        onEnter={() => ({ ok: true, level: 1, best: 0 })} onLose={() => {}} onHeartDrop={() => false}
        onGlitchtama={() => {}} onEnemyDefeated={() => {}} onEarnPoints={() => {}} onExit={() => {}} onOpenRiftMap={onOpenRiftMap}
      />
    </GameStateProvider>,
  );
}
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE) ?? '{}');
const away50 = () => ({ since: Date.now(), seed: 1, layer: 50, slot: 6, hp: 1, en: 0, ms: false, player: { level: 1, atk: 10, def: 10, spd: 10, hp: 100, bonus: 0, fam: 'v', stage: 'rookie' } });

describe('DungeonGame — portais', () => {
  it('recorde liberou um portal ainda não avisado: aviso "Portal desbloqueado" no topo', async () => {
    montar({ dungeonDepthRecord: 50 });
    await act(async () => { await Promise.resolve(); });
    expect(document.querySelector('[data-rift-portal-toast]')?.textContent).toBe('Portal desbloqueado');
    expect(document.querySelector('[data-rift-portal-toast]')?.getAttribute('role')).toBe('status');
  });
  it('portal já avisado (ou nenhum liberado): sem aviso', async () => {
    montar({ dungeonDepthRecord: 50, riftPortalsSeen: 1 });
    await act(async () => { await Promise.resolve(); });
    expect(document.querySelector('[data-rift-portal-toast]')).toBeNull();
    cleanup();
    montar({ dungeonDepthRecord: 20 });
    await act(async () => { await Promise.resolve(); });
    expect(document.querySelector('[data-rift-portal-toast]')).toBeNull();
  });
  it('andar 50 limpo com o portal 100 liberado: em vez de descer, abre o mapa parado no nó do portal', async () => {
    vi.useFakeTimers();
    const abrir = vi.fn();
    montar({ dungeonDepthRecord: 120, riftPortalsSeen: 2, dungeonAway: away50() }, abrir);
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(saved().dungeonResumeLayer).toBe(49);
    expect(saved().dungeonAway).toBeUndefined();
  });
  it('andar 50 limpo sendo o portal mais fundo: segue para o 51 (não abre o mapa)', async () => {
    vi.useFakeTimers();
    const abrir = vi.fn();
    montar({ dungeonDepthRecord: 50, riftPortalsSeen: 1, dungeonAway: away50() }, abrir);
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(abrir).not.toHaveBeenCalled();
  });
});
