// @vitest-environment jsdom
/**
 * QA (rodada A, 21/09/2026) — `hydrateSave` × conquistas (#30): saves tortos
 * que a migração `tasks-100` → `dias-completos-30` pode encontrar na nuvem.
 * O que se prova é por EXECUÇÃO do provider (o `hydrateSave` vive dentro do
 * inicializador do `useState`) e da derivação `unlockedAchievements` sobre o
 * estado montado — o mesmo caminho do `App.tsx`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { ACHIEVEMENT_IDS, unlockedAchievements } from '../utils/achievements';

const BASE = {
  activities: [], tasks: [], completedTasks: [], perfectDays: 3, evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'], gamePoints: 0, eggType: 'lumel',
};

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
function montar(save: unknown) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('#30 — saves tortos na migração de conquistas', () => {
  it('campo LEGADO `unlockedAchievements:["tasks-100"]` (string velha) não quebra a montagem; a herança vem do GATILHO, não do campo', () => {
    // Sem o gatilho antigo batido: o campo legado sozinho não vira herança
    // (a conquista sempre foi derivada; a lista nunca foi fonte).
    const s1 = montar({ ...BASE, unlockedAchievements: ['tasks-100'] });
    expect(s1.conquistasHerdadas).toEqual([]);
    expect(unlockedAchievements(s1)).not.toContain('dias-completos-30');
  });

  it('campo legado + gatilho batido → herança gravada; a lista derivada só tem ids válidos', () => {
    localStorage.clear();
    const s = montar({ ...BASE, unlockedAchievements: ['tasks-100'], completedTasks: new Array(50).fill('t'), activityLog: new Array(50).fill('2026-01-01') });
    expect(s.conquistasHerdadas).toEqual(['dias-completos-30']);
    const abertas = unlockedAchievements(s);
    expect(abertas).toContain('dias-completos-30');
    for (const id of abertas) expect(ACHIEVEMENT_IDS).toContain(id);
    expect(abertas).not.toContain('tasks-100');
  });

  it('`conquistasHerdadas` com tipo errado (string, objeto, null) cai na regra de "campo ausente"', () => {
    for (const torto of ['dias-completos-30', { 0: 'dias-completos-30' }, null, 42]) {
      localStorage.clear();
      document.body.innerHTML = '';
      const s = montar({ ...BASE, conquistasHerdadas: torto, activityLog: new Array(100).fill('x') });
      // `Array.isArray` falha → cai no gatilho antigo (batido aqui) → herança.
      expect(s.conquistasHerdadas, `torto=${JSON.stringify(torto)}`).toEqual(['dias-completos-30']);
    }
  });

  it('`totalPerfectDays` ausente → 0; string "30" → 0 (nunca coagida); 30 de verdade → desbloqueia', () => {
    const s0 = montar({ ...BASE });
    expect(s0.totalPerfectDays).toBe(0);
    expect(unlockedAchievements(s0)).not.toContain('dias-completos-30');

    localStorage.clear(); document.body.innerHTML = '';
    const sStr = montar({ ...BASE, totalPerfectDays: '30' });
    expect(sStr.totalPerfectDays).toBe(0);

    localStorage.clear(); document.body.innerHTML = '';
    const s30 = montar({ ...BASE, totalPerfectDays: 30 });
    expect(s30.totalPerfectDays).toBe(30);
    expect(unlockedAchievements(s30)).toContain('dias-completos-30');

    localStorage.clear(); document.body.innerHTML = '';
    const s29 = montar({ ...BASE, totalPerfectDays: 29 });
    expect(unlockedAchievements(s29)).not.toContain('dias-completos-30');
  });

  it('limite do gatilho antigo: 99 não herda, 100 herda (completedTasks + activityLog somados)', () => {
    const s99 = montar({ ...BASE, completedTasks: new Array(49).fill('t'), activityLog: new Array(50).fill('x') });
    expect(s99.conquistasHerdadas).toEqual([]);
    localStorage.clear(); document.body.innerHTML = '';
    const s100 = montar({ ...BASE, completedTasks: new Array(50).fill('t'), activityLog: new Array(50).fill('x') });
    expect(s100.conquistasHerdadas).toEqual(['dias-completos-30']);
  });

  it('a herança sobrevive à regravação: o save gravado tem `conquistasHerdadas` e a 2ª carga NÃO recalcula', () => {
    montar({ ...BASE, completedTasks: new Array(100).fill('t') });
    const gravado = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!);
    expect(gravado.conquistasHerdadas).toEqual(['dias-completos-30']);
    // Poda: mesmo que o histórico suma depois, a herança fica.
    document.body.innerHTML = '';
    const s2 = montar({ ...gravado, completedTasks: [], activityLog: [] });
    expect(s2.conquistasHerdadas).toEqual(['dias-completos-30']);
    expect(unlockedAchievements(s2)).toContain('dias-completos-30');
  });
});
