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
import { restConstancy, dreamRarity, dexProgress } from '../utils/restWindow';
import { hasPendingNightmare, nightmaresFor } from '../utils/nightmares';
import { tiredness } from '../utils/petNeeds';
import { constancy, applyMissedDay, needsIntervention } from '../utils/habitRhythm';
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

  // --- RODADA 7: campos que passavam pela checagem "é objeto" e explodiam
  // DEPOIS, no primeiro render ou dentro do updater da virada. Não bastava
  // `hydrateSave` não lançar — o estado precisa ser USÁVEL. ---
  ['rest: {} (sem nights/dreams) — restConstancy/hasPendingNightmare liam undefined.filter', { activities: [], tasks: [], rest: {} }],
  ['rest.nights não-array', { activities: [], tasks: [], rest: { nights: 'x', dreams: [], window: { start: '23:00', end: '07:00' } } }],
  ['rest.dreams não-array', { activities: [], tasks: [], rest: { nights: [], dreams: 3 } }],
  ['rest.window ausente', { activities: [], tasks: [], rest: { nights: [], dreams: [] } }],
  ['rest.window com horário lixo', { activities: [], tasks: [], rest: { window: { start: 99, end: null }, nights: [], dreams: [] } }],
  ['rest.nights com item primitivo e item sem date', { activities: [], tasks: [], rest: { nights: [1, {}, { date: 'x', onTime: 'sim' }], dreams: [null, 'dream-aurora'] } }],
  ['rest inteiro não-objeto', { activities: [], tasks: [], rest: 7 }],

  ['habitRhythms: {a:{}} — applyMissedDay lia undefined.includes na virada', { activities: [], tasks: [], habitRhythms: { a: {} } }],
  ['habitRhythms: {a:5}', { activities: [], tasks: [], habitRhythms: { a: 5 } }],
  ['habitRhythms: {a:{done:"x"}}', { activities: [], tasks: [], habitRhythms: { a: { done: 'x' } } }],
  ['habitRhythms: {a:{done:[1,null],missed:{},shielded:"s",shields:"3",totalDone:null}}',
    { activities: [], tasks: [], habitRhythms: { a: { done: [1, null], missed: {}, shielded: 's', shields: '3', totalDone: null } } }],
  ['habitRhythms: {a:null}', { activities: [], tasks: [], habitRhythms: { a: null } }],
  ['habitRhythms com atividade REAL malformada (a virada percorre as devidas)',
    { activities: [{ id: 'h1', name: 'Correr', category: 'saude', emoji: '🏃', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6] }],
      tasks: [], lastResetDate: 'Mon Jan 01 2024', habitRhythms: { h1: {} } }],

  ['nightmares: {fought:{}}', { activities: [], tasks: [], nightmares: { fought: {} } }],
  ['nightmares primitivo', { activities: [], tasks: [], nightmares: 'ontem' }],
  ['playLog: {date:1}', { activities: [], tasks: [], playLog: { date: 1 } }],
  ['playLog com buff lixo', { activities: [], tasks: [], playLog: { date: 'Mon Jan 01 2024', buff: { kind: 'minigame', multiplier: 'x' } } }],
  ['steps: {baseline:"x"}', { activities: [], tasks: [], steps: { date: 'Mon Jan 01 2024', baseline: 'x', today: null } }],
  ['steps sem date', { activities: [], tasks: [], steps: { baseline: 10 } }],

  ['equippedDecor array (migrateDecor devolvia cru)', { activities: [], tasks: [], equippedDecor: ['furn-sofa'] }],
  ['equippedDecor com valor não-string', { activities: [], tasks: [], equippedDecor: { rug: 5 } }],
  ['activityStats com entrada null', { activities: [], tasks: [], activityStats: { a: null, b: 3 } }],
  ['foodInventory com contagem string', { activities: [], tasks: [], foodInventory: { '🍎': 'muitas' } }],
  ['contadores de missão não-numéricos', { activities: [], tasks: [], dungeonKills: 'x', dinoBest: null, totalPerfectDays: {}, droppedItems: [1, 'item'] }],
  ['soulmonStages com item primitivo', { activities: [], tasks: [], soulmonStages: [1, null, { name: 'X', stage: 'rookie' }] }],
  ['lastDayReport primitivo', { activities: [], tasks: [], lastDayReport: 'ontem foi bom' }],
  ['trophies/moodLog com item primitivo', { activities: [], tasks: [], trophies: [1, { season: 's1', place: 9 }], moodLog: ['x', { date: 'd', mood: 3 }] }],
  ['currentBranch inválido', { activities: [], tasks: [], currentBranch: 'caos', accountTier: 'pirata', demoCharacterId: 'ninguem' }],
  // Itens DENTRO das listas — `arr()` garantia só o contêiner. A virada faz
  // `activity.steps.length` e `activity.steps.map(...)`; a fixture "atividade
  // sem steps" só não pegava isto porque `lastResetDate` caía em hoje e a
  // virada nem rodava.
  ['atividade sem `steps` COM virada pendente',
    { activities: [{ id: 'a', name: 'X', weekDays: [0, 1, 2, 3, 4, 5, 6] }], tasks: [], lastResetDate: 'Mon Jan 01 2024' }],
  ['atividade com steps não-array', { activities: [{ id: 'a', steps: 'x', weekDays: [0] }], tasks: [], lastResetDate: 'Mon Jan 01 2024' }],
  ['atividade com step primitivo', { activities: [{ id: 'a', steps: [1, null, { completed: 'sim' }], weekDays: [0] }], tasks: [], lastResetDate: 'Mon Jan 01 2024' }],
  ['atividade primitiva / sem id', { activities: [1, null, {}, { id: 'ok', steps: [], weekDays: [] }], tasks: [], lastResetDate: 'Mon Jan 01 2024' }],
  ['atividade com weekDays não-array', { activities: [{ id: 'a', steps: [], weekDays: 'seg' }], tasks: [], lastResetDate: 'Mon Jan 01 2024' }],
  ['tarefa primitiva e tarefa com steps lixo', { activities: [], tasks: [3, { id: 't', steps: {} }], lastResetDate: 'Mon Jan 01 2024' }],
  ['completedTasks com item primitivo', { activities: [], tasks: [], completedTasks: [1, { id: 'c' }, { id: 'c2', completedAt: new Date().toISOString() }] }],

  ['datas de ritual numéricas', { activities: [], tasks: [], lastCheckInDate: 1, lastWeeklyReportDate: {}, lastFreshStartDate: [] }],
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
   * O CORAÇÃO DO GUARD (rodada 7).
   *
   * Os dois casos acima provavam apenas que `hydrateSave` **não lança** e que a
   * virada sobrevive. Foi exatamente por isso que dois buracos passaram por
   * aqui: `rest: {}` e `habitRhythms: {a:{}}` hidratavam SEM ERRO e só
   * explodiam no CONSUMIDOR — `restConstancy` (que roda em TODO render, via
   * `tiredness`) e `hasPendingNightmare` (efeito da manhã, primeiro render)
   * liam `undefined.filter`; `applyMissedDay` lia `undefined.includes` dentro
   * do updater da virada. Nenhum desses caminhos passa pelo try/catch do
   * inicializador, então o resultado é a tela branca PERMANENTE.
   *
   * Logo, o contrato não é "não lança no hydrate" — é **o estado hidratado é
   * USÁVEL pelas funções que o consomem**.
   */
  for (const [nome, save] of SAVES_HOSTIS) {
    it(`${nome}: o estado hidratado é USÁVEL pelos consumidores reais`, () => {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
      const s = montar(Espiao);
      const agora = new Date();

      // --- rest: o que o primeiro render toca ---
      expect(s.rest, 'rest sempre existe depois do hydrate').toBeTruthy();
      expect(Array.isArray(s.rest.nights), `rest.nights: ${JSON.stringify(s.rest.nights)}`).toBe(true);
      expect(Array.isArray(s.rest.dreams), `rest.dreams: ${JSON.stringify(s.rest.dreams)}`).toBe(true);
      expect(typeof s.rest.window?.start).toBe('string');
      expect(typeof s.rest.window?.end).toBe('string');
      for (const n of s.rest.nights) {
        expect(typeof n.date).toBe('string');
        expect(typeof n.onTime).toBe('boolean');
      }

      expect(() => restConstancy(s.rest, agora), 'restConstancy roda em TODO render').not.toThrow();
      expect(() => dreamRarity(s.rest, agora)).not.toThrow();
      expect(() => dexProgress(s.rest)).not.toThrow();
      expect(() => nightmaresFor(s.rest, agora, s.evolutionStage)).not.toThrow();
      expect(
        () => hasPendingNightmare(s.nightmares, s.rest, agora),
        'hasPendingNightmare roda no efeito da manhã, no primeiro render',
      ).not.toThrow();
      // E o resultado precisa ser um número de verdade, não NaN contaminando a UI.
      const rc = restConstancy(s.rest, agora);
      expect(Number.isFinite(rc.ratio)).toBe(true);
      expect(rc.ratio).toBeGreaterThanOrEqual(0);

      // --- habitRhythms: cada ENTRADA, não só o contêiner ---
      expect(s.habitRhythms && typeof s.habitRhythms === 'object' && !Array.isArray(s.habitRhythms)).toBe(true);
      for (const [id, r] of Object.entries<any>(s.habitRhythms)) {
        expect(Array.isArray(r?.done), `habitRhythms.${id}.done: ${JSON.stringify(r)}`).toBe(true);
        expect(Array.isArray(r?.missed), `habitRhythms.${id}.missed`).toBe(true);
        expect(Array.isArray(r?.shielded), `habitRhythms.${id}.shielded`).toBe(true);
        expect(Number.isFinite(r?.shields), `habitRhythms.${id}.shields`).toBe(true);
        expect(Number.isFinite(r?.totalDone), `habitRhythms.${id}.totalDone`).toBe(true);
        // O caminho exato que lançava dentro do updater da virada.
        expect(() => applyMissedDay(r, agora.toDateString()), `applyMissedDay em ${id}`).not.toThrow();
        expect(() => constancy(r, agora)).not.toThrow();
        expect(() => needsIntervention(r, agora)).not.toThrow();
      }

      // --- tiredness: lê rest E as listas, em todo render ---
      expect(() => tiredness(s as never, agora), 'tiredness roda em todo render').not.toThrow();

      // --- a virada, de novo, mas agora sobre o estado JÁ hidratado ---
      expect(() => computeDailyReset(s, { now: agora } as never)).not.toThrow();
    });
  }

  /**
   * AUTOVERIFICAÇÃO NA PONTA CERTA (rodada 7): os saves novos realmente
   * quebravam os CONSUMIDORES quando entregues crus. Sem isto, a lista acima
   * poderia ser inofensiva e o guard passaria vazio para sempre — que é
   * literalmente como os dois buracos sobreviveram à rodada 6.
   */
  it('AUTOVERIFICAÇÃO: crus, estes saves derrubam os consumidores', () => {
    const agora = new Date();
    const casos: Array<[string, () => unknown]> = [
      ['restConstancy com rest:{}', () => restConstancy({} as never, agora)],
      ['dreamRarity com rest:{}', () => dreamRarity({} as never, agora)],
      ['hasPendingNightmare com rest:{}', () => hasPendingNightmare({ fought: [] } as never, {} as never, agora)],
      ['hasPendingNightmare com nightmares:{fought:{}}',
        () => hasPendingNightmare({ fought: {} } as never, { nights: [{ date: agora.toDateString(), onTime: true }], dreams: [], window: { start: '23:00', end: '07:00' } } as never, agora)],
      ['tiredness com rest:{}', () => tiredness({ energyPoints: 0, foodInventory: {}, rest: {} } as never, agora)],
      ['applyMissedDay com rhythm:{}', () => applyMissedDay({} as never, agora.toDateString())],
      ['constancy com rhythm:{done:"x"}', () => constancy({ done: 'x', missed: [], shielded: [] } as never, agora)],
    ];
    for (const [nome, fn] of casos) {
      expect(fn, `${nome} deveria lançar CRU — se parou de lançar, o guard perdeu a premissa`).toThrow();
    }
  });

  /** Controle negativo do sono: um `rest` legítimo passa INTACTO. Sonhos e
   *  noites são progresso do jogador — o fix não pode limpar coleção. */
  it('CONTROLE NEGATIVO: rest e habitRhythms legítimos passam intactos', () => {
    const hoje = new Date().toDateString();
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
      activities: [], tasks: [], lastResetDate: hoje,
      rest: {
        window: { start: '22:30', end: '06:30' },
        nights: [{ date: hoje, sleptAt: new Date().toISOString(), onTime: true }],
        dreams: ['dream-aurora', 'dream-on-the-moon'],
        dreamDates: { 'dream-aurora': '2026-09-12', 'dream-on-the-moon': 7 },
        hideMetrics: true,
      },
      habitRhythms: {
        h1: { done: [hoje], missed: [], shielded: [], shields: 2, totalDone: 40, lastCompletedDate: hoje },
      },
    }));
    const s = montar(Espiao);
    expect(s.rest.window).toEqual({ start: '22:30', end: '06:30' });
    expect(s.rest.nights).toHaveLength(1);
    expect(s.rest.nights[0].onTime).toBe(true);
    expect(s.rest.dreams).toEqual(['dream-aurora', 'dream-on-the-moon']);
    expect(s.rest.hideMetrics).toBe(true);
    // a data de coleção sobrevive ao load (era descartada); entrada que não é
    // string some em vez de virar data inventada
    expect(s.rest.dreamDates).toEqual({ 'dream-aurora': '2026-09-12' });
    expect(s.habitRhythms.h1.shields).toBe(2);
    // `totalDone` alimenta os marcos de 7/21/66 dias: rebaixá-lo roubaria
    // maturidade de hábito de quem já a conquistou.
    expect(s.habitRhythms.h1.totalDone).toBe(40);
    expect(s.habitRhythms.h1.lastCompletedDate).toBe(hoje);
  });

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
