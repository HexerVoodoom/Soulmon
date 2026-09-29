// @vitest-environment jsdom
/**
 * FIXTURE DE SAVE LEGADO — o ponto cego nº 1 da revisão adversarial.
 *
 * O Soulmon é fork do DigiApp e divide a chave `digiapp_state_v3` com ele.
 * Existem três caminhos de migração no código (`equippedFurniture`→
 * `equippedDecor`, `fallbackSpriteForStage`) e **nenhuma
 * fixture de save real em teste**. O dano previsto: o primeiro APK novo quebra
 * o save de quem já joga — violando o guardrail nº 1 no dia do lançamento.
 *
 * Este arquivo é a fixture que faltava. Ele só é possível agora porque a
 * lógica de carga vive dentro do inicializador de `useState` do
 * `GameStateProvider` — ou seja, **só existe quando o componente monta**. Com
 * `environment: 'node'` ela era literalmente inalcançável por teste.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState, migrateDecor } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

/**
 * Save de um jogador do DigiApp, na forma em que ele existe hoje no
 * localStorage: campos antigos presentes, campos novos AUSENTES.
 * (`equippedFurniture` em vez de `equippedDecor`, sem `soulGoal`, sem
 * `activityLog`, sem `petPassive`, sem `accountTier`.)
 */
const SAVE_LEGADO = {
  activities: [
    { id: 'a1', name: 'Correr', category: 'fitness', emoji: '🏃', steps: [], weekDays: [1, 3, 5] },
  ],
  tasks: [{ id: 't1', name: 'Ler', category: 'study', emoji: '📖', completed: false }],
  completedTasks: ['t0', 't00'],
  activityStats: { a1: 12 },
  healthPoints: 2.5,
  energyPoints: 3,
  perfectDays: 37,
  totalXP: 900,
  powerPoints: 14, harmonyPoints: 31, benevolencePoints: 8,
  lastResetDate: 'Mon Aug 04 2026',
  evolutionStage: 'mega',
  unlockedEvolutions: ['rookie', 'champion', 'ultimate', 'mega'],
  gamePoints: 4820,
  emblems: 55,
  ownedBackgrounds: ['bg-matrix', 'bg-ocean'],
  equippedBackground: 'bg-matrix',
  ownedFurniture: ['furn-sofa'],
  equippedFurniture: 'furn-sofa',
  foodInventory: { '💗': 2, '👊': 1 },
  trophies: [{ season: '2026-W30', place: 1 }],
  eggType: 'lumel',
};

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}

function montar() {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  // O provider agenda cloud save/pushProfile em 3s; nenhum teste deve sair pela rede.
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('save legado do DigiApp — nada de valor pode sumir na primeira carga', () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(SAVE_LEGADO));
  });

  it('progresso duro sobrevive: estágio, dias perfeitos, moedas, troféus', () => {
    const s = montar();
    expect(s.evolutionStage).toBe('mega');
    expect(s.perfectDays).toBe(37);
    expect(s.gamePoints).toBe(4820);
    expect(s.emblems).toBe(55);
    expect(s.totalXP).toBe(900);
    expect(s.trophies).toEqual([{ season: '2026-W30', place: 1 }]);
    expect(s.unlockedEvolutions).toEqual(['rookie', 'champion', 'ultimate', 'mega']);
  });

  it('inventário e loja sobrevivem (o que foi comprado com Bits)', () => {
    const s = montar();
    expect(s.foodInventory).toEqual({ '💗': 2, '👊': 1 });
    expect(s.ownedFurniture).toEqual(['furn-sofa']);
    expect(s.equippedBackground).toBe('bg-matrix');
    // 'bg-room' é grátis e entra mesmo em save anterior à sua existência
    expect(s.ownedBackgrounds).toEqual(expect.arrayContaining(['bg-matrix', 'bg-ocean', 'bg-room']));
  });

  it('tarefas, atividades e histórico sobrevivem', () => {
    const s = montar();
    expect(s.tasks).toHaveLength(1);
    expect(s.activities[0].name).toBe('Correr');
    expect(s.activities[0].weekDays).toEqual([1, 3, 5]);
    expect(s.completedTasks).toEqual(['t0', 't00']);
    expect(s.activityStats).toEqual({ a1: 12 });
  });

  it('HP fracionário e o teto por estágio são recalculados sem perder o valor', () => {
    const s = montar();
    expect(s.healthPoints).toBe(2.5);
    expect(s.maxHealthPoints).toBe(4); // mega = 4
  });

  it('MIGRAÇÃO: a decoração antiga vai para o espaço do palco e o campo velho some', () => {
    const s = montar();
    expect(s.equippedDecor).toEqual({ 'floor-left': 'furn-sofa' });
    expect(s.equippedFurniture).toBeUndefined();
    // e o campo velho não volta no save gravado
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).equippedFurniture).toBeUndefined();
  });

  it('GRANDFATHERING: save sem `accountTier` vira `paid`, nunca é rebaixado a demo', () => {
    // Rebaixar quem já joga para demo tiraria a criatura própria de um usuário
    // existente — o moat inteiro.
    expect(montar().accountTier).toBe('paid');
  });

  it('campos novos ganham padrão em vez de `undefined` que quebra a UI', () => {
    const s = montar();
    expect(s.soulGoal).toBe('');
    expect(s.soulStruggle).toBe('');
    expect(s.moodLog).toEqual([]);
    expect(s.activityLog).toEqual([]);
    expect(s.petPassive).toBeTruthy();       // traço de nascimento sorteado
    expect(s.credits).toBe(0);               // crédito NUNCA vem do save do cliente
    expect(s.equippedDecor).toBeTruthy();
  });

  it('a linha do save é preservada', () => {
    // ⚠️ Este caso testava a tradução `'agumon' → 'tapirmon'`: um nome de
    // franquia virando OUTRO nome de franquia. Os três ids de linha genérica
    // eram `tapirmon`/`veemon`/`salamon` e o migrador cobria um quarto. Todos
    // saíram em 07/09/2026 — hoje as linhas são as nossas (`ignar`/`lumel`/
    // `serah`, de `DUNGEON_LINE_SPRITES`) e não há o que traduzir.
    expect(montar().eggType).toBe('lumel');
  });

  it('a primeira carga NÃO dispara cloud save (não sobrescreve a nuvem com o local)', () => {
    montar();
    vi.advanceTimersByTime(10_000);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('migrateDecor — os dois casos que já deram bug', () => {
  it('mapa VAZIO é decisão do jogador, não ausência de migração', () => {
    // Bug real: quem tinha save antigo desequipava tudo, recarregava, e o item
    // voltava sozinho — porque a checagem era por "está cheio" e não por "existe".
    expect(migrateDecor({ equippedDecor: {}, equippedFurniture: 'furn-sofa' })).toEqual({});
  });

  it('item antigo que não existe mais no catálogo não vira espaço fantasma', () => {
    expect(migrateDecor({ equippedFurniture: 'furn-que-nao-existe' })).toEqual({});
  });

  it('save sem nenhum dos dois campos começa vazio', () => {
    expect(migrateDecor({})).toEqual({});
  });
});

describe('save corrompido nunca pode dar tela branca', () => {
  it('JSON inválido cai em estado novo em vez de derrubar o app', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, '{isto não é json');
    const s = montar();
    expect(s.evolutionStage).toBe('rookie');
    expect(s.perfectDays).toBe(0);
  });

  it('save que é um ARRAY (não objeto) não derruba a montagem', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, '[1,2,3]');
    expect(() => montar()).not.toThrow();
  });

  it('save que é `null` literal cai no estado novo', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, 'null');
    expect(montar().evolutionStage).toBe('rookie');
  });

  it('campos com o tipo errado não impedem a montagem', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
      tasks: 'nao-e-array', activities: null, perfectDays: 'muitos', evolutionStage: 42,
    }));
    expect(() => montar()).not.toThrow();
  });
});

describe('#30 (21/09/2026) — `tasks-100` virou `dias-completos-30`; quem já tinha mantém', () => {
  it('save sem o campo e com o gatilho antigo batido ganha `conquistasHerdadas`', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
      ...SAVE_LEGADO, completedTasks: new Array(70).fill('t'), activityLog: new Array(30).fill('2026-01-01'),
    }));
    expect(montar().conquistasHerdadas).toEqual(['dias-completos-30']);
  });
  it('save sem o campo e SEM o gatilho antigo fica com `[]`', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...SAVE_LEGADO, activityLog: new Array(97).fill('x') }));
    expect(montar().conquistasHerdadas).toEqual([]);
  });
  it('`[]` já gravado nunca vira herança depois — a migração roda UMA vez', () => {
    // O campo existe: mesmo que o jogador bata 100 tarefas, a herança não abre.
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
      ...SAVE_LEGADO, conquistasHerdadas: [], activityLog: new Array(200).fill('x'),
    }));
    expect(montar().conquistasHerdadas).toEqual([]);
  });
  it('id desconhecido no campo é descartado (higiene do que vem da nuvem)', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
      ...SAVE_LEGADO, conquistasHerdadas: ['tasks-100', 'dias-completos-30', 42],
    }));
    expect(montar().conquistasHerdadas).toEqual(['dias-completos-30']);
  });
});
