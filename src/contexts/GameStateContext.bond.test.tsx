// @vitest-environment jsdom
/**
 * Os campos do Vínculo no save — e a regra de que quem já joga não sente nada.
 *
 * A fiação do Vínculo acrescenta DOIS campos, e só dois:
 *   · `bondRewardsClaimed` — as recompensas cosméticas já entregues;
 *   · `bondDaily` — o ledger do teto diário das fontes repetíveis.
 *
 * O NÍVEL continua fora do save (invariante 4 de `utils/bond.ts`): ele é sempre
 * `bondLevelFor(totalXP)`. Guardá-lo seria o footgun 9 em escala de sistema — o
 * save e a fórmula divergiriam sem erro nenhum.
 *
 * E o save antigo não pode ser afetado: o padrão `?? padrão` do `hydrateSave`
 * precisa devolver vazio, nunca `undefined` solto que estoure num `.includes`,
 * e nunca um ledger com teto já gasto — que faria o jogador chegar ao app com o
 * teto do dia consumido por um campo que ele nunca teve.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve() }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}

function abrirComSave(save: unknown) {
  if (save !== undefined) localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('campos do Vínculo no save', () => {
  it('save antigo (sem os campos) hidrata com os padrões vazios', () => {
    const s = abrirComSave({ activities: [], tasks: [], totalXP: 1200 });
    expect(s.bondRewardsClaimed).toEqual([]);
    expect(s.bondDaily).toEqual({ day: '', spent: {} });
    // E o que ele já tinha continua intacto: o Vínculo é progresso DOTADO.
    expect(s.totalXP).toBe(1200);
  });

  it('o NÍVEL nunca é persistido — nem vindo do save', () => {
    const s = abrirComSave({ activities: [], tasks: [], totalXP: 700, bondLevel: 99 });
    expect(s.bondLevel).toBeUndefined();
  });

  it('o que estava gravado é preservado', () => {
    const s = abrirComSave({
      activities: [], tasks: [], totalXP: 700,
      bondRewardsClaimed: ['bond-2-title'],
      bondDaily: { day: '2026-08-26', spent: { dungeon: 40 } },
    });
    expect(s.bondRewardsClaimed).toEqual(['bond-2-title']);
    expect(s.bondDaily).toEqual({ day: '2026-08-26', spent: { dungeon: 40 } });
  });

  it('lixo nos campos novos não vira teto gasto nem estoura a UI', () => {
    const s = abrirComSave({
      activities: [], tasks: [], totalXP: 0,
      bondRewardsClaimed: 'nao-e-array',
      bondDaily: { day: 42, spent: { dungeon: 'muito', tournament: -5 } },
    });
    expect(s.bondRewardsClaimed).toEqual([]);
    expect(s.bondDaily.spent.dungeon ?? 0).toBe(0);
    expect(s.bondDaily.spent.tournament ?? 0).toBe(0);
  });
});
