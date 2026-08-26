// @vitest-environment jsdom
/**
 * Migração D-33 — os tetos de cuidado saem do `localStorage` e entram no SAVE.
 *
 * O furo, medido: `digiapp-food-feed-times` e `digiapp-rub-heal-day` moravam no
 * aparelho. Com PWA e APK (o cenário real do dono hoje) o mesmo jogador tinha
 * DOIS contadores — 2 corações/dia e 12 comidas/hora em vez de 1 e 6.
 *
 * Este arquivo testa o caminho REAL do load (`GameStateProvider`), não o módulo
 * puro isolado: é lá que a migração roda, e é lá que ela pode perder ou dar
 * cuidado de graça. O módulo puro tem os seus em `utils/careCaps.test.ts`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { FOOD_LIMIT_PER_HOUR, RUB_HEAL_DAILY_CAP } from '../utils/careRules';
import type { CareCaps } from '../utils/careCaps';

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}

function montar(): { careCaps?: CareCaps } {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

const HOJE = new Date().toDateString();
const AGORA = Date.now();

function semearSave(state: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
    activities: [], tasks: [], completedTasks: [], evolutionStage: 'rookie', ...state,
  }));
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('migração dos tetos de cuidado para o save', () => {
  it('o contador do aparelho é adotado pelo save — sem perda', () => {
    const times = [AGORA - 1000, AGORA - 500];
    localStorage.setItem(STORAGE_KEYS.FOOD_FEED_TIMES, JSON.stringify(times));
    localStorage.setItem(STORAGE_KEYS.RUB_HEAL_DAY,
      JSON.stringify({ date: HOJE, healed: 0.5 }));
    semearSave({});

    const estado = montar();
    expect(estado.careCaps?.feedTimes).toEqual(times);
    expect(estado.careCaps?.rubHeal).toEqual({ date: HOJE, healed: 0.5 });
  });

  it('quem já gastou o teto do dia continua gastando-o depois da migração — sem ganho', () => {
    localStorage.setItem(STORAGE_KEYS.RUB_HEAL_DAY,
      JSON.stringify({ date: HOJE, healed: RUB_HEAL_DAILY_CAP }));
    localStorage.setItem(STORAGE_KEYS.FOOD_FEED_TIMES, JSON.stringify(
      Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - i * 1000)));
    semearSave({});

    const estado = montar();
    expect(estado.careCaps?.rubHeal?.healed).toBe(RUB_HEAL_DAILY_CAP);
    expect(estado.careCaps?.feedTimes?.length).toBe(FOOD_LIMIT_PER_HOUR);
  });

  it('as chaves antigas são apagadas — senão a migração reaparece a cada load', () => {
    localStorage.setItem(STORAGE_KEYS.FOOD_FEED_TIMES, JSON.stringify([AGORA]));
    localStorage.setItem(STORAGE_KEYS.RUB_HEAL_DAY, JSON.stringify({ date: HOJE, healed: 0.5 }));
    semearSave({});

    montar();
    expect(localStorage.getItem(STORAGE_KEYS.FOOD_FEED_TIMES)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.RUB_HEAL_DAY)).toBeNull();
  });

  it('save que JÁ tem careCaps e aparelho sem chave antiga: o save manda', () => {
    const caps = { feedTimes: [AGORA - 10], rubHeal: { date: HOJE, healed: 0.5 } };
    semearSave({ careCaps: caps });

    expect(montar().careCaps).toEqual(caps);
  });

  it('segundo aparelho ainda não migrado funde o próprio contador ao do save', () => {
    // PWA já migrou e o save (nuvem) traz 3 comidas. O APK abre pela 1ª vez
    // depois da atualização, com 2 comidas ainda no localStorage dele.
    const doSave = [AGORA - 3000, AGORA - 2000, AGORA - 1000];
    const doAparelho = [AGORA - 900, AGORA - 800];
    semearSave({ careCaps: { feedTimes: doSave, rubHeal: { date: HOJE, healed: 0.5 } } });
    localStorage.setItem(STORAGE_KEYS.FOOD_FEED_TIMES, JSON.stringify(doAparelho));
    localStorage.setItem(STORAGE_KEYS.RUB_HEAL_DAY, JSON.stringify({ date: HOJE, healed: 0.5 }));

    const estado = montar();
    // União: as 5 comidas contam, então sobra 1 até o teto — e NÃO 3 (o que o
    // contador por aparelho dava).
    expect(estado.careCaps?.feedTimes).toEqual([...doSave, ...doAparelho]);
    // MAX, não soma: o mesmo meio coração dos dois lados não vira um inteiro.
    expect(estado.careCaps?.rubHeal).toEqual({ date: HOJE, healed: 0.5 });
  });

  it('instalação nova nasce sem teto gasto', () => {
    expect(montar().careCaps).toEqual({});
  });

  it('lixo nas chaves antigas não trava a comida do jogador nem derruba o load', () => {
    localStorage.setItem(STORAGE_KEYS.FOOD_FEED_TIMES, '{{{ não é json');
    localStorage.setItem(STORAGE_KEYS.RUB_HEAL_DAY, '"uma string"');
    semearSave({});

    expect(montar().careCaps).toEqual({});
  });

  it('save com careCaps hostil vindo da nuvem é higienizado, não confiado', () => {
    semearSave({ careCaps: { feedTimes: 'nope', rubHeal: 42 } });
    expect(montar().careCaps).toEqual({});
  });
});
