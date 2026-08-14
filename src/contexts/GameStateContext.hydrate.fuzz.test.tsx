// @vitest-environment jsdom
/**
 * RODADA 6 — o instrumento é **estado de save hostil que não foi escrito por
 * nós**, e o consumidor é o caminho REAL do App, não um espião.
 *
 * O que este arquivo existe para impedir:
 *
 * `GameStateContext.hostile.test.tsx` (rodada 2) já montava saves forjados e
 * passava. Ele passava porque o componente de teste só lia `JSON.stringify(
 * gameState)` — nunca montava `useDailyReset`, que é o PRIMEIRO consumidor real
 * do estado no App e roda no mount. A fixture daquele arquivo,
 * `{ perfectDays: 10 }`, hidratava para um estado com `activities: undefined` e
 * `healthPoints: undefined`, e a virada do dia lançava
 * `Cannot read properties of undefined (reading 'filter')` DENTRO do updater do
 * setGameState → React desmonta a árvore → tela branca PERMANENTE, porque toda
 * carga seguinte lê o mesmo save do localStorage.
 *
 * Alcance real: `adoptCloudSave` (utils/cloudSave.ts) grava no localStorage
 * QUALQUER objeto simples vindo de `/api/save`, e a rota valida só que `state`
 * é um objeto — nunca o tipo de cada campo. Com a autenticação desligada
 * (STATUS §3.1), um `{}` ou um `{"tasks":{}}` gravado no save de alguém é uma
 * tela branca sem caminho de recuperação pela UI.
 *
 * O fix é de FONTE (`hydrateSave` garante o TIPO, não só a presença), então o
 * teste é de fonte: monta o provider com o hook da virada e exige que o app
 * sobreviva.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { useDailyReset } from '../hooks/useDailyReset';
import { computeDailyReset } from '../utils/dailyReset';
import { STORAGE_KEYS } from '../utils/storageKeys';

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}

/** O consumidor REAL: o App monta `useDailyReset`, que chama a virada no mount
 *  sempre que `lastResetDate !== hoje`. É o que faltava na rodada 2. */
function ComVirada() {
  const { gameState, setGameState } = useGameState();
  useDailyReset({ gameState: gameState as never, setGameState });
  const { gameState: g } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(g)}</pre>;
}

function montar(Comp: React.ComponentType) {
  render(<GameStateProvider><Comp /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

/**
 * Saves construídos a partir do que um cliente ANTIGO/estranho escreveria, e
 * não a partir do formato que o código de hoje produz. É a diferença entre
 * fixture e adversário: uma fixture nossa herda os mesmos pontos cegos do
 * código, porque foi escrita pelo mesmo lado.
 */
const SAVES_HOSTIS: Array<[string, unknown]> = [
  ['objeto vazio (KV truncado / adoção de save vazio)', {}],
  ['a fixture da rodada 2, que passava', { perfectDays: 10 }],
  ['save legado sem `activities`', { tasks: [], evolutionStage: 'champion-virus', perfectDays: 3 }],
  ['activities: null', { activities: null, tasks: [] }],
  ['activities não-array', { activities: 3, tasks: [] }],
  ['tasks não-array', { activities: [], tasks: {} }],
  ['completedTasks não-array', { activities: [], tasks: [], completedTasks: 'x' }],
  ['unlockedEvolutions não-array', { activities: [], tasks: [], unlockedEvolutions: 'mega' }],
  ['ownedBackgrounds não-array (o spread lançava e apagava o save)', { activities: [], tasks: [], ownedBackgrounds: 7, perfectDays: 9 }],
  ['healthPoints ausente', { activities: [], tasks: [], evolutionStage: 'mega-data' }],
  ['healthPoints NaN (via null no JSON)', { activities: [], tasks: [], healthPoints: null }],
  ['healthPoints negativo', { activities: [], tasks: [], healthPoints: -5 }],
  ['healthPoints acima do máximo do estágio', { activities: [], tasks: [], healthPoints: 99, evolutionStage: 'rookie' }],
  ['healthPoints string', { activities: [], tasks: [], healthPoints: '3' }],
  ['atributos ausentes (save anterior à árvore de galhos)', { activities: [], tasks: [], evolutionStage: 'rookie' }],
  ['attributesSinceLastEvolution parcial', { activities: [], tasks: [], attributesSinceLastEvolution: { virus: 'x' } }],
  ['foodInventory array', { activities: [], tasks: [], foodInventory: [] }],
  ['activityStats array', { activities: [], tasks: [], activityStats: [] }],
  ['lastResetDate numérico', { activities: [], tasks: [], lastResetDate: 0 }],
  ['atividade sem `steps`', { activities: [{ id: 'a', weekDays: [0, 1, 2, 3, 4, 5, 6] }], tasks: [] }],
  ['tudo negativo/NaN', { activities: [], tasks: [], perfectDays: -3, energyPoints: -1, gamePoints: null, emblems: 'x', totalXP: null }],
];

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('hydrateSave garante o TIPO, não só a presença', () => {
  for (const [nome, save] of SAVES_HOSTIS) {
    it(`${nome}: o estado hidratado obedece o contrato`, () => {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
      const s = montar(Espiao);

      // Arrays que o resto do app percorre sem checar.
      for (const campo of ['activities', 'tasks', 'completedTasks', 'unlockedEvolutions',
        'poopEventsScheduled', 'poopEventsCompleted', 'poopEventsShown',
        'ownedBackgrounds', 'ownedFurniture', 'trophies', 'friends', 'moodLog', 'activityLog']) {
        expect(Array.isArray(s[campo]), `${campo} deveria ser array, veio ${JSON.stringify(s[campo])}`).toBe(true);
      }
      // Números que viram NaN e contaminam todo cálculo a jusante.
      for (const campo of ['healthPoints', 'maxHealthPoints', 'energyPoints', 'perfectDays',
        'totalXP', 'virusPoints', 'dataPoints', 'vaccinePoints', 'gamePoints', 'emblems',
        'poopPenaltyClockAt', 'maxActivityCap']) {
        expect(Number.isFinite(s[campo]), `${campo} deveria ser número finito, veio ${JSON.stringify(s[campo])}`).toBe(true);
      }
      // HP dentro do domínio do estágio — a barra da UI e a degeneração dependem.
      expect(s.healthPoints).toBeGreaterThanOrEqual(0);
      expect(s.healthPoints).toBeLessThanOrEqual(s.maxHealthPoints);
      expect(typeof s.evolutionStage).toBe('string');
      expect(typeof s.lastResetDate).toBe('string');
    });

    it(`${nome}: a VIRADA DO DIA roda em cima dele sem derrubar o app`, () => {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
      // Sem o fix, isto lança dentro do updater e o React desmonta a árvore.
      const s = montar(ComVirada);
      expect(Number.isFinite(s.healthPoints)).toBe(true);
      expect(s.healthPoints).toBeGreaterThanOrEqual(0);
    });
  }

  /**
   * AUTOVERIFICAÇÃO DO MECANISMO. Sem este caso, os anteriores passariam mesmo
   * se `useDailyReset` nunca chamasse `computeDailyReset` — o teste inteiro
   * perderia a premissa em silêncio, que é exatamente o modo de falha do
   * `simulateReset` que o CLAUDE.md conta.
   */
  it('AUTOVERIFICAÇÃO: montar `ComVirada` realmente EXECUTA a virada', () => {
    const ontem = new Date(Date.now() - 86400000).toDateString();
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
      activities: [], tasks: [], lastResetDate: ontem, energyPoints: 7, perfectDays: 1,
    }));
    const s = montar(ComVirada);
    // A virada zera a energia e carimba a data de hoje. Se ela não tivesse
    // rodado, energyPoints continuaria 7 e lastDayReport não existiria.
    expect(s.lastResetDate).toBe(new Date().toDateString());
    expect(s.energyPoints).toBe(0);
    expect(s.lastDayReport).toBeTruthy();
  });

  /**
   * AUTOVERIFICAÇÃO NA OUTRA PONTA. Prova que os saves da lista REALMENTE
   * quebravam a virada antes do fix — sem isto, a lista poderia ser inofensiva
   * e o guard passaria vazio para sempre.
   */
  it('AUTOVERIFICAÇÃO: sem a coerção de tipo, a virada LANÇA nestes mesmos saves', () => {
    const quebram = SAVES_HOSTIS.filter(([, save]) => {
      try {
        // `computeDailyReset` direto no save CRU = o comportamento de antes do
        // fix (quando hydrateSave só fazia `?? padrão`).
        computeDailyReset({ ...(save as Record<string, unknown>) } as never);
        return false;
      } catch { return true; }
    });
    expect(quebram.length).toBeGreaterThan(0);
    // E o mesmo save, HIDRATADO, não lança mais.
    for (const [nome, save] of quebram) {
      cleanup();
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
      expect(() => montar(ComVirada), `${nome} ainda derruba o app`).not.toThrow();
    }
  });

  /** Controle negativo: o fix não pode APAGAR o save de quem tem um save bom. */
  it('CONTROLE NEGATIVO: um save legítimo passa intacto pela coerção', () => {
    const bom = {
      activities: [{ id: 'a1', name: 'Correr', category: 'saude', emoji: '🏃', steps: [], weekDays: [1, 2, 3] }],
      tasks: [{ id: 't1', name: 'Ler', category: 'estudo', emoji: '📚', completed: false }],
      completedTasks: [], activityStats: {},
      healthPoints: 2, energyPoints: 3, perfectDays: 7, totalXP: 420,
      virusPoints: 11, dataPoints: 5, vaccinePoints: 2,
      evolutionStage: 'champion-virus', unlockedEvolutions: ['rookie', 'champion-virus'],
      gamePoints: 999, emblems: 42, ownedBackgrounds: ['bg-room', 'bg-neon'],
      lastResetDate: new Date().toDateString(),
    };
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(bom));
    const s = montar(Espiao);
    expect(s.activities).toHaveLength(1);
    expect(s.activities[0].name).toBe('Correr');
    expect(s.tasks).toHaveLength(1);
    expect(s.healthPoints).toBe(2);
    expect(s.perfectDays).toBe(7);
    expect(s.totalXP).toBe(420);
    expect(s.virusPoints).toBe(11);
    expect(s.gamePoints).toBe(999);
    expect(s.emblems).toBe(42);
    expect(s.evolutionStage).toBe('champion-virus');
    expect(s.ownedBackgrounds).toEqual(expect.arrayContaining(['bg-room', 'bg-neon']));
  });
});
