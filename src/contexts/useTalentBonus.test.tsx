// @vitest-environment jsdom
/**
 * Combate v3 / PR7 — o bônus de talento do jogador, pelo canal único: valor real dentro do teto, 0 para o escopo errado
 * e para o vetor inválido, 0 sem Provider.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider } from './GameStateContext';
import { useTalentBonus } from './useTalentBonus';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { xpForLevel } from '../utils/bond';
import { COMBAT_BONUS_CAP } from '../utils/combate/bonus';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }), cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x', adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

const com = (save: Record<string, unknown>) => {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, ...save }));
  return ({ children }: { children: ReactNode }) => <GameStateProvider>{children}</GameStateProvider>;
};
const g = (id: string, n: number) => Array(n).fill(id) as string[];

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('useTalentBonus', () => {
  it('sem Provider vale 0', () => {
    expect(renderHook(() => useTalentBonus('pve')).result.current).toBe(0);
  });
  it('PvE cheio vale o valor real, dentro do teto; o escopo errado vale 0', () => {
    const wrapper = com({ totalXP: xpForLevel(20), talentPicks: [...g('tal-pve-01', 4), ...g('tal-pve-02', 4)] });
    const pve = renderHook(() => useTalentBonus('pve'), { wrapper }).result.current;
    expect(pve).toBeGreaterThan(0.04);
    expect(pve).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
    expect(renderHook(() => useTalentBonus('pvp'), { wrapper }).result.current).toBe(0);
  });
  it('picks acima dos pontos do Vínculo (save hostil) valem 0', () => {
    const wrapper = com({ totalXP: 0, talentPicks: g('tal-pve-01', 4) });
    expect(renderHook(() => useTalentBonus('pve'), { wrapper }).result.current).toBe(0);
  });
});
