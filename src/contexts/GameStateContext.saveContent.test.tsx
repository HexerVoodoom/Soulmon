// @vitest-environment jsdom
/**
 * RODADA 8 — o CONTEÚDO do save carregado, não o fato de ele carregar.
 *
 * Medido na rodada 7: `GameStateContext.tsx` era o pior arquivo do repositório
 * (22,6% dos mutantes mortos). Não por falta de teste — `hostile`, `fuzz`,
 * `legacySave` e `storage` já montavam o provider — mas porque todos eles
 * perguntam a mesma coisa: *o campo é um array? é um número finito? o app
 * sobreviveu?* Nenhum perguntava **QUAL número**.
 *
 * A consequência: trocar `num(loadedState.gamePoints, 0)` por
 * `num(loadedState.gamePoints, 1)`, ou `digivolutionSegmentsNeeded, 999` por
 * `, 0`, deixava os 863 testes verdes. O jogador não veria um erro — veria uma
 * carteira com um Bit que não ganhou e um pet a um passo de evoluir.
 *
 * Regra desta rodada, herdada da 7: **número CRU na expectativa**. Nada de
 * `toBe(FORM_REQUIREMENTS.rookie.cap)` — expectativa derivada da constante que
 * o teste deveria auditar é uma tautologia (foi assim que `WEEKLY_RELIEF_HEARTS`
 * passou três rodadas valendo zero sem ninguém ver).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

// `vi.mock` é içado para o topo do arquivo, então o que a fábrica usa precisa
// existir antes dos `const` normais — daí o `vi.hoisted`.
const { cloudSaves, perfis } = vi.hoisted(() => ({
  cloudSaves: [] as Array<{ id: string; state: Record<string, unknown> }>,
  perfis: [] as Array<Record<string, unknown>>,
}));
vi.mock('../utils/cloudSave', () => ({
  cloudSave: (id: string, state: Record<string, unknown>) => {
    cloudSaves.push({ id, state }); return Promise.resolve();
  },
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({
  pushProfile: (p: Record<string, unknown>) => { perfis.push(p); return Promise.resolve(); },
}));

function Espiao() {
  const { gameState, setGameState } = useGameState();
  return (
    <>
      <pre data-testid="estado">{JSON.stringify(gameState)}</pre>
      <button onClick={() => setGameState(s => ({ ...s, gamePoints: (s.gamePoints ?? 0) + 1 }))}>mais</button>
    </>
  );
}

/** Carrega o save como o jogador o encontraria: gravado no storage, app abrindo. */
function abrirComSave(save: unknown) {
  if (save !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE,
      typeof save === 'string' ? save : JSON.stringify(save));
  }
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  cloudSaves.length = 0;
  perfis.length = 0;
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

// ─────────────────────────────── o save mínimo vira EXATAMENTE este jogador

describe('save da nuvem sem os campos novos → os valores que o jogador vê', () => {
  /**
   * O cenário real: `adoptCloudSave` grava qualquer objeto simples vindo de
   * `/api/save`, e saves antigos não têm os campos criados depois. Cada `??`
   * e cada `num(campo, X)` do `hydrateSave` decide um número que aparece na
   * tela. Este caso afirma TODOS eles de uma vez, com valor cru.
   */
  it('um save só com atividades e tarefas hidrata com os padrões exatos', () => {
    const s = abrirComSave({ activities: [], tasks: [] });

    // Progressão: um jogador novo, não um a um passo de evoluir.
    expect(s.evolutionStage).toBe('rookie');
    expect(s.maxHealthPoints).toBe(3);
    expect(s.healthPoints).toBe(3);           // save sem HP começa CHEIO, nunca 0
    expect(s.energyPoints).toBe(0);
    expect(s.perfectDays).toBe(0);
    expect(s.totalXP).toBe(0);
    expect(s.digivolutionSegments).toBe(0);
    expect(s.digivolutionSegmentsNeeded).toBe(999);
    expect(s.unlockedEvolutions).toEqual(['rookie']);
    expect(s.maxActivityCap).toBe(6);         // teto de atividades do rookie
    expect(s.degeneratedByHP).toBe(false);
    expect(s.lastDayWasPerfect).toBe(false);

    // Atributos: nenhum galho ganha vantagem de graça.
    expect(s.virusPoints).toBe(0);
    expect(s.dataPoints).toBe(0);
    expect(s.vaccinePoints).toBe(0);
    expect(s.currentBranch).toBe('data');
    expect(s.attributesSinceLastEvolution).toEqual({ virus: 0, data: 0, vaccine: 0 });

    // Moedas: dinheiro nenhum aparece do nada.
    expect(s.gamePoints).toBe(0);
    expect(s.emblems).toBe(0);
    expect(s.credits).toBe(0);

    // Cuidado e palco.
    expect(s.poopPenaltyClockAt).toBe(0);
    expect(s.foodInventory).toEqual({});
    expect(s.activityStats).toEqual({});
    expect(s.equippedDecor).toEqual({});
    expect(s.equippedBackground).toBeNull();
    expect(s.ownedBackgrounds).toEqual(['bg-room']);
    expect(s.eggType).toBe('tapirmon');

    // Conta e "porquê": save antigo é adotado como PAGO — nunca rebaixado.
    expect(s.accountTier).toBe('paid');
    expect(s.pvpEnabled).toBe(false);
    expect(s.soulGoal).toBe('');
    expect(s.soulStruggle).toBe('');
    expect(typeof s.petPassive).toBe('string');
    expect(s.petPassive.length).toBeGreaterThan(0);
    expect(s.lastResetDate).toBe(new Date().toDateString());
  });

  it('save legítimo NÃO é sobrescrito pelos padrões (controle negativo)', () => {
    const s = abrirComSave({
      activities: [], tasks: [], evolutionStage: 'mega-virus',
      healthPoints: 2.5, energyPoints: 4, perfectDays: 33, totalXP: 1200,
      digivolutionSegments: 2, digivolutionSegmentsNeeded: 40,
      virusPoints: 9, dataPoints: 4, vaccinePoints: 1, currentBranch: 'virus',
      gamePoints: 777, emblems: 42, credits: 60, poopPenaltyClockAt: 1700000000000,
      degeneratedByHP: true, lastDayWasPerfect: true, pvpEnabled: true,
      accountTier: 'demo', soulGoal: 'dormir melhor', soulStruggle: 'ansiedade',
      // teto MENOR que o do estágio (mega = 9): quem manda é o save, não a tabela
      petPassive: 'guloso', equippedBackground: 'bg-neon', maxActivityCap: 5,
      attributesSinceLastEvolution: { virus: 5, data: 2, vaccine: 1 },
      unlockedEvolutions: ['rookie', 'champion-virus', 'ultimate-virus', 'mega-virus'],
    });
    expect(s.evolutionStage).toBe('mega-virus');
    expect(s.maxHealthPoints).toBe(4);        // derivado do ESTÁGIO, sempre
    expect(s.healthPoints).toBe(2.5);         // meio coração sobrevive à carga
    expect(s.energyPoints).toBe(4);
    expect(s.perfectDays).toBe(33);
    expect(s.totalXP).toBe(1200);
    expect(s.digivolutionSegments).toBe(2);
    expect(s.digivolutionSegmentsNeeded).toBe(40);
    expect(s.virusPoints).toBe(9);
    expect(s.currentBranch).toBe('virus');
    expect(s.gamePoints).toBe(777);
    expect(s.emblems).toBe(42);
    expect(s.credits).toBe(60);
    expect(s.poopPenaltyClockAt).toBe(1700000000000);
    expect(s.degeneratedByHP).toBe(true);
    expect(s.lastDayWasPerfect).toBe(true);
    expect(s.pvpEnabled).toBe(true);
    expect(s.accountTier).toBe('demo');       // conta demo NÃO vira paga na carga
    expect(s.soulGoal).toBe('dormir melhor');
    expect(s.petPassive).toBe('guloso');
    expect(s.equippedBackground).toBe('bg-neon');
    expect(s.maxActivityCap).toBe(5);
    expect(s.attributesSinceLastEvolution).toEqual({ virus: 5, data: 2, vaccine: 1 });
    expect(s.unlockedEvolutions).toHaveLength(4);
  });
});

// ────────────────────────────── HP e teto de atividades saem do ESTÁGIO

describe('o estágio decide o teto de corações e de atividades', () => {
  const casos: Array<[string, number, number]> = [
    // estágio,            maxHP, teto de atividades — números CRUS
    ['rookie', 3, 6],
    ['champion-virus', 3, 7],
    ['ultimate-data', 3, 8],
    ['mega-vaccine', 4, 9],
    ['ultra', 5, 10],
  ];

  for (const [stage, maxHP, cap] of casos) {
    it(`${stage}: ${maxHP} corações e teto de ${cap} atividades`, () => {
      const s = abrirComSave({ activities: [], tasks: [], evolutionStage: stage });
      expect(s.maxHealthPoints).toBe(maxHP);
      expect(s.healthPoints).toBe(maxHP);     // sem HP no save, entra cheio
      expect(s.maxActivityCap).toBe(cap);
    });
  }

  it('estágio desconhecido (save de outra versão) é tratado como rookie', () => {
    const s = abrirComSave({ activities: [], tasks: [], evolutionStage: 'forma-inventada' });
    expect(s.evolutionStage).toBe('forma-inventada');
    expect(s.maxHealthPoints).toBe(3);
    expect(s.maxActivityCap).toBe(6);
  });

  it('HP acima do teto do estágio é PODADO até o teto, não mantido', () => {
    expect(abrirComSave({ activities: [], tasks: [], evolutionStage: 'rookie', healthPoints: 99 })
      .healthPoints).toBe(3);
  });

  it('HP negativo vira 0 (o pet fica em degeneração, não em dívida)', () => {
    expect(abrirComSave({ activities: [], tasks: [], healthPoints: -5 }).healthPoints).toBe(0);
  });

  it('HP 0 é preservado — quem estava degenerando continua degenerando', () => {
    expect(abrirComSave({ activities: [], tasks: [], healthPoints: 0 }).healthPoints).toBe(0);
  });

  it('HP em string entra CHEIO, não zerado', () => {
    expect(abrirComSave({ activities: [], tasks: [], healthPoints: '3' }).healthPoints).toBe(3);
  });

  it('HP null (o que o JSON faz com NaN) entra CHEIO, não zerado', () => {
    expect(abrirComSave({ activities: [], tasks: [], healthPoints: null }).healthPoints).toBe(3);
  });
});

// ─────────────────────────────────────────────── atributos parciais

describe('atributos de galho carregados campo a campo', () => {
  it('bloco parcial completa só o que falta, sem apagar o que existe', () => {
    const s = abrirComSave({
      activities: [], tasks: [],
      attributesSinceLastEvolution: { virus: 4 },
    });
    expect(s.attributesSinceLastEvolution).toEqual({ virus: 4, data: 0, vaccine: 0 });
  });

  it('valor com tipo hostil dentro do bloco vira 0, não NaN', () => {
    const s = abrirComSave({
      activities: [], tasks: [],
      attributesSinceLastEvolution: { virus: 'x', data: 3, vaccine: null },
    });
    expect(s.attributesSinceLastEvolution).toEqual({ virus: 0, data: 3, vaccine: 0 });
  });
});

// ─────────────────────────────────────────────── linha de sprite (eggType)

describe('linha de sprite genérica na carga', () => {
  it('linha legada `agumon` do save vira tapirmon (arte nossa)', () => {
    expect(abrirComSave({ activities: [], tasks: [], eggType: 'agumon' }).eggType).toBe('tapirmon');
  });

  it('linha do save manda sobre a do storage', () => {
    localStorage.setItem(STORAGE_KEYS.EGG_TYPE, 'salamon');
    expect(abrirComSave({ activities: [], tasks: [], eggType: 'veemon' }).eggType).toBe('veemon');
  });

  it('sem linha no save, usa a do storage', () => {
    localStorage.setItem(STORAGE_KEYS.EGG_TYPE, 'salamon');
    expect(abrirComSave({ activities: [], tasks: [] }).eggType).toBe('salamon');
  });

  it('`agumon` no storage também vira tapirmon', () => {
    localStorage.setItem(STORAGE_KEYS.EGG_TYPE, 'agumon');
    expect(abrirComSave({ activities: [], tasks: [] }).eggType).toBe('tapirmon');
  });

  it('INSTALAÇÃO NOVA com `agumon` no storage também vira tapirmon', () => {
    // Caminho diferente do de cima: aqui não há save nenhum, então quem decide
    // é `freshGameState`, que tem a própria cópia da conversão. Reinstalar o app
    // por cima de um storage antigo cai exatamente aqui.
    localStorage.setItem(STORAGE_KEYS.EGG_TYPE, 'agumon');
    expect(abrirComSave(undefined).eggType).toBe('tapirmon');
  });

  it('INSTALAÇÃO NOVA respeita a linha própria já guardada no storage', () => {
    localStorage.setItem(STORAGE_KEYS.EGG_TYPE, 'salamon');
    expect(abrirComSave(undefined).eggType).toBe('salamon');
  });
});

// ────────────────────── mapas do save (pastinha e estatísticas) com tipo hostil

/**
 * `activityStats` e `foodInventory` são MAPAS que o app percorre com
 * `Object.entries`. O guard tem três partes (`existe && é objeto && não é
 * array`) e cada uma cobre uma forma diferente de save estragado — um array
 * passa por "é objeto", uma string passa por "existe". Aceitar qualquer uma
 * delas não dá erro na carga: dá uma pastinha com itens de nome "0", "1", "2".
 */
describe('pastinha e estatísticas: só um mapa de verdade é aceito', () => {
  const hostis: Array<[string, unknown]> = [
    ['array', []],
    ['array com itens', ['🍎']],
    ['string', 'abc'],
    ['número', 7],
    ['booleano', true],
    ['null', null],
  ];

  for (const [nome, valor] of hostis) {
    it(`foodInventory ${nome} vira pastinha VAZIA`, () => {
      const s = abrirComSave({ activities: [], tasks: [], foodInventory: valor });
      expect(s.foodInventory).toEqual({});
    });

    it(`activityStats ${nome} vira mapa VAZIO`, () => {
      const s = abrirComSave({ activities: [], tasks: [], activityStats: valor });
      expect(s.activityStats).toEqual({});
    });
  }

  it('mapa legítimo passa intacto (controle negativo)', () => {
    const s = abrirComSave({
      activities: [], tasks: [],
      foodInventory: { '🍎': 3, '💗': 1 },
      activityStats: { a1: { name: 'Correr', emoji: '🏃', category: 'saude', completionCount: 12 } },
    });
    expect(s.foodInventory).toEqual({ '🍎': 3, '💗': 1 });
    expect(s.activityStats.a1.completionCount).toBe(12);
  });
});

// ─────────────────────────────── save que não é objeto → instalação nova

describe('save ilegível/hostil cai para instalação nova, e nada é adotado dele', () => {
  const lixos: Array<[string, string]> = [
    ['array', JSON.stringify([1, 2, 3])],
    ['string', JSON.stringify('save')],
    ['número', JSON.stringify(123)],
    ['null', 'null'],
    ['true', 'true'],
    ['JSON quebrado', '{"activities":'],
  ];

  for (const [nome, cru] of lixos) {
    it(`${nome}: vira estado novo, sem chaves numéricas vindas do spread`, () => {
      const s = abrirComSave(cru);
      expect(s.evolutionStage).toBe('rookie');
      expect(s.unlockedEvolutions).toEqual(['rookie']);
      expect(s.accountTier).toBe('demo');   // instalação NOVA, não save adotado
      // Se o guard aceitasse o array/string, o spread produziria `{"0":1,...}`.
      expect(Object.keys(s).some(k => /^\d+$/.test(k)), JSON.stringify(s)).toBe(false);
    });
  }

  it('instalação nova (sem save nenhum) tem exatamente estes valores', () => {
    const s = abrirComSave(undefined);
    expect(s.healthPoints).toBe(1);
    expect(s.maxHealthPoints).toBe(1);
    expect(s.energyPoints).toBe(0);
    expect(s.perfectDays).toBe(0);
    expect(s.totalXP).toBe(0);
    expect(s.digivolutionSegments).toBe(0);
    expect(s.digivolutionSegmentsNeeded).toBe(1);
    expect(s.maxActivityCap).toBe(6);
    expect(s.virusPoints).toBe(0);
    expect(s.dataPoints).toBe(0);
    expect(s.vaccinePoints).toBe(0);
    expect(s.attributesSinceLastEvolution).toEqual({ virus: 0, data: 0, vaccine: 0 });
    expect(s.foodInventory).toEqual({});
    expect(s.activityStats).toEqual({});
    expect(s.equippedDecor).toEqual({});
    expect(s.gamePoints).toBe(0);
    expect(s.emblems).toBe(0);
    expect(s.credits).toBe(0);
    expect(s.poopPenaltyClockAt).toBe(0);
    expect(s.evolutionStage).toBe('rookie');
    expect(s.unlockedEvolutions).toEqual(['rookie']);
    expect(s.ownedBackgrounds).toEqual(['bg-room']);
    expect(s.equippedBackground).toBeNull();
    expect(s.currentBranch).toBe('data');
    expect(s.accountTier).toBe('demo');
    expect(s.degeneratedByHP).toBe(false);
    expect(s.lastDayWasPerfect).toBe(false);
    expect(s.pvpEnabled).toBe(false);
    expect(s.activities).toEqual([]);
    expect(s.tasks).toEqual([]);
    expect(s.eggType).toBe('tapirmon');
    // O 1/1 acima é transitório de propósito: o onboarding é o ritual de
    // nascimento e grava 3/3 ao terminar (App.tsx). Fica travado aqui para
    // que uma mudança nesses números seja uma DECISÃO, não um acidente.
  });
});

// ─────────────────────────────── cenários possuídos e migração de decoração

describe('cenários e decoração na carga', () => {
  it('bg-room é sempre possuído, mesmo em save que nunca o teve, e sem duplicar', () => {
    const s = abrirComSave({ activities: [], tasks: [], ownedBackgrounds: ['bg-neon', 'bg-room'] });
    expect(s.ownedBackgrounds).toEqual(['bg-neon', 'bg-room']);
    expect(s.ownedBackgrounds.filter((b: string) => b === 'bg-room')).toHaveLength(1);
  });

  it('save antigo com UMA decoração vira o item no espaço dele, e o campo antigo some', () => {
    const s = abrirComSave({ activities: [], tasks: [], equippedFurniture: 'furn-sofa' });
    expect(Object.values(s.equippedDecor)).toContain('furn-sofa');
    expect('equippedFurniture' in s).toBe(false);
  });

  it('quem já desequipou tudo continua com o palco vazio (não reequipa sozinho)', () => {
    const s = abrirComSave({
      activities: [], tasks: [], equippedFurniture: 'furn-sofa', equippedDecor: {},
    });
    expect(s.equippedDecor).toEqual({});
  });
});

// ─────────────────────────────────────── a gravação na nuvem (conteúdo + prazo)

describe('backup na nuvem: só depois de uma mudança REAL, e com o conteúdo certo', () => {
  it('abrir o app não manda nada para a nuvem', () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ activities: [], tasks: [], gamePoints: 5 });
      act(() => { vi.advanceTimersByTime(60000); });
      expect(cloudSaves).toHaveLength(0);
      expect(perfis).toHaveLength(0);
    } finally { vi.useRealTimers(); }
  });

  it('uma mudança do jogador é enviada 3s depois — não antes', () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ activities: [], tasks: [], gamePoints: 5 });
      act(() => { screen.getByText('mais').click(); });

      act(() => { vi.advanceTimersByTime(2999); });
      expect(cloudSaves, 'não pode enviar antes dos 3s').toHaveLength(0);

      act(() => { vi.advanceTimersByTime(1); });
      expect(cloudSaves).toHaveLength(1);
      expect(cloudSaves[0].state.gamePoints).toBe(6);
    } finally { vi.useRealTimers(); }
  });

  it('mudanças em rajada viram UM envio, com o estado final', () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ activities: [], tasks: [], gamePoints: 0 });
      const botao = screen.getByText('mais');
      act(() => { botao.click(); });
      act(() => { vi.advanceTimersByTime(1000); });
      act(() => { botao.click(); });
      act(() => { vi.advanceTimersByTime(1000); });
      act(() => { botao.click(); });
      act(() => { vi.advanceTimersByTime(3000); });

      expect(cloudSaves).toHaveLength(1);
      expect(cloudSaves[0].state.gamePoints).toBe(3);
    } finally { vi.useRealTimers(); }
  });

  it('o perfil público leva o que o ranking mostra — e o nome tem par PT/EN', () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
      abrirComSave({
        activities: [], tasks: [], evolutionStage: 'champion-virus',
        unlockedEvolutions: ['rookie', 'champion-virus'],
        virusPoints: 9, dataPoints: 4, vaccinePoints: 1, pvpEnabled: true,
        soulmonMeta: { baseName: 'Fagulha' },
        completedTasks: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      });
      act(() => { screen.getByText('mais').click(); });
      act(() => { vi.advanceTimersByTime(3000); });

      expect(perfis).toHaveLength(1);
      expect(perfis[0].name).toBe('Anônimo');
      expect(perfis[0].petName).toBe('Fagulha');
      expect(perfis[0].stage).toBe('champion-virus');
      expect(perfis[0].unlockedStages).toEqual(['rookie', 'champion-virus']);
      expect(perfis[0].pvpEnabled).toBe(true);
      expect(perfis[0].attrs).toEqual({ virus: 9, data: 4, vaccine: 1 });
      expect(perfis[0].tasksDone).toBe(3);
      expect(perfis[0].id).toBe(cloudSaves[0].id);
    } finally { vi.useRealTimers(); }
  });

  it('em inglês o padrão é "Anonymous" (o par que já faltou no push das 22h)', () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
      abrirComSave({ activities: [], tasks: [] });
      act(() => { screen.getByText('mais').click(); });
      act(() => { vi.advanceTimersByTime(3000); });
      expect(perfis[0].name).toBe('Anonymous');
    } finally { vi.useRealTimers(); }
  });

  it('nome escolhido pelo jogador vence o padrão; sem pet, petName é string vazia', () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, 'Mateus');
      abrirComSave({ activities: [], tasks: [] });
      act(() => { screen.getByText('mais').click(); });
      act(() => { vi.advanceTimersByTime(3000); });
      expect(perfis[0].name).toBe('Mateus');
      expect(perfis[0].petName).toBe('');
      expect(perfis[0].pvpEnabled).toBe(false);
      expect(perfis[0].tasksDone).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('o mesmo saveId é reusado entre envios (não vira um save novo por mudança)', () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ activities: [], tasks: [] });
      const botao = screen.getByText('mais');
      act(() => { botao.click(); });
      act(() => { vi.advanceTimersByTime(3000); });
      act(() => { botao.click(); });
      act(() => { vi.advanceTimersByTime(3000); });

      expect(cloudSaves).toHaveLength(2);
      expect(cloudSaves[0].id).toBe(cloudSaves[1].id);
      expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBe(cloudSaves[0].id);
    } finally { vi.useRealTimers(); }
  });

  it('o localStorage recebe o estado a cada mudança, sem esperar os 3s', () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ activities: [], tasks: [], gamePoints: 0 });
      act(() => { screen.getByText('mais').click(); });
      const gravado = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!);
      expect(gravado.gamePoints).toBe(1);
      expect(cloudSaves).toHaveLength(0);
    } finally { vi.useRealTimers(); }
  });
});
