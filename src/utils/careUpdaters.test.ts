import { describe, it, expect } from 'vitest';
import { applyRub, applyFeed, rubDecision, type CareCapsState } from './careUpdaters';
import { FOOD_LIMIT_PER_HOUR, RUB_HEAL_DAILY_CAP, RUB_HEAL_STEP } from './careRules';
import { rubDailyCap } from './passives';

/**
 * X-6 — **os três bugs que a fatia 2 consertou sem nenhum teste.**
 *
 * Um grep de `handlePet|handleFeed|petPassive` nos testes dava ZERO. Os três
 * consertos podiam ser desfeitos com a suíte inteira verde, e — pior — **sem
 * quebrar o TypeScript**, porque em todos o defeito era a PROCEDÊNCIA de um
 * argumento, não o tipo dele.
 *
 * Cada bloco abaixo é nomeado pelo bug que ele impede de voltar.
 */

const HOJE = 'Wed Aug 26 2026';
const AGORA = Date.parse('2026-08-26T12:00:00Z');

function estado(over: Partial<CareCapsState> = {}): CareCapsState {
  return {
    healthPoints: 1,
    maxHealthPoints: 5,
    energyPoints: 0,
    evolutionStage: 'rookie',
    foodInventory: { '🍎': 5 },
    powerPoints: 0,
    harmonyPoints: 0,
    benevolencePoints: 0,
    totalXP: 0,
    attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
    ...over,
  };
}

describe('BUG 1: o Traço Carinhoso estava desligado na prática', () => {
  /* O `petPassive` era o 5º argumento OPCIONAL de `rubRefusal`, e o chamador
     não o passava. Resultado: o teto lido era sempre o da base (1,0) e o traço
     que o CLAUDE.md declara como 1,5/dia não valia nada. Apagar o argumento
     compilava — por isso a decisão passou a ler o passivo do ESTADO. */

  const CAP_CARINHOSO = rubDailyCap('carinhoso', RUB_HEAL_DAILY_CAP);

  it('o teto do traço é maior que o da base (derivado, não literal)', () => {
    expect(CAP_CARINHOSO).toBeGreaterThan(RUB_HEAL_DAILY_CAP);
  });

  it('no teto da BASE, o Carinhoso ainda recebe carinho', () => {
    const s = estado({
      petPassive: 'carinhoso',
      careCaps: { rubHeal: { date: HOJE, healed: RUB_HEAL_DAILY_CAP } },
    });
    expect(rubDecision(s, HOJE), 'sem o passivo, isto volta a ser daily-cap').toBeUndefined();
  });

  it('sem o traço, o mesmo estado é recusado', () => {
    const s = estado({ careCaps: { rubHeal: { date: HOJE, healed: RUB_HEAL_DAILY_CAP } } });
    expect(rubDecision(s, HOJE)).toBe('daily-cap');
  });

  it('e no teto DO TRAÇO o Carinhoso também para', () => {
    const s = estado({
      petPassive: 'carinhoso',
      careCaps: { rubHeal: { date: HOJE, healed: CAP_CARINHOSO } },
    });
    expect(rubDecision(s, HOJE)).toBe('daily-cap');
  });

  it('o updater respeita o mesmo teto — a trava não mora só na checagem de fora', () => {
    const s = estado({
      petPassive: 'carinhoso',
      careCaps: { rubHeal: { date: HOJE, healed: RUB_HEAL_DAILY_CAP } },
    });
    const { state, refused } = applyRub(s, HOJE);
    expect(refused).toBeUndefined();
    expect(state.healthPoints).toBe(1 + RUB_HEAL_STEP);
  });

  it('HP cheio recusa antes de qualquer teto', () => {
    expect(rubDecision(estado({ healthPoints: 5, maxHealthPoints: 5 }), HOJE)).toBe('already-full');
  });
});

describe('BUG 2: o teto nunca recusava DENTRO do updater', () => {
  /* Chegava um registro zerado fixo, então a trava inteira dependia da checagem
     externa — e qualquer caminho que chamasse o updater sem ela furava o teto. */

  it('já no teto, o updater recusa e devolve o MESMO objeto de estado', () => {
    const s = estado({ careCaps: { rubHeal: { date: HOJE, healed: RUB_HEAL_DAILY_CAP } } });
    const { state, refused } = applyRub(s, HOJE);
    expect(refused).toBe('daily-cap');
    expect(state, 'estado intocado: nem HP nem registro se mexem').toBe(s);
  });

  it('o updater LÊ o gasto do `prev`, não parte de zero', () => {
    const s = estado({ careCaps: { rubHeal: { date: HOJE, healed: 0.5 } } });
    const { state } = applyRub(s, HOJE);
    expect(state.careCaps?.rubHeal?.healed, 'partindo de zero, isto daria 0.5').toBe(1);
  });

  it('duas passadas encadeadas param no teto — sem nenhuma checagem de fora', () => {
    let s = estado();
    for (let i = 0; i < 6; i++) s = applyRub(s, HOJE).state;
    expect(s.careCaps?.rubHeal?.healed).toBe(RUB_HEAL_DAILY_CAP);
    expect(s.healthPoints).toBe(1 + RUB_HEAL_DAILY_CAP);
  });
});

describe('BUG 3: o furo de lote do React na comida', () => {
  /* Dois toques dentro do mesmo lote liam o MESMO `gameState`, então a segunda
     comida enxergava a janela sem o timestamp da primeira e furava o teto. A
     asserção que pega isso é o ENCADEAMENTO: aplicar o updater sobre o
     resultado do anterior, sem passar por React. */

  it('N toques encadeados consomem N comidas, e param no teto da hora', () => {
    let s = estado({ foodInventory: { '🍎': 20 } });
    for (let i = 0; i < FOOD_LIMIT_PER_HOUR; i++) s = applyFeed(s, '🍎', AGORA).state;

    expect(s.careCaps?.feedTimes?.length).toBe(FOOD_LIMIT_PER_HOUR);
    expect(s.foodInventory['🍎']).toBe(20 - FOOD_LIMIT_PER_HOUR);

    const excedente = applyFeed(s, '🍎', AGORA);
    expect(excedente.refused, 'a próxima do mesmo lote tem de bater no teto').toBe('hourly-limit');
    expect(excedente.state.foodInventory['🍎'], 'e não pode consumir estoque').toBe(20 - FOOD_LIMIT_PER_HOUR);
  });

  it('a segunda passada do MESMO lote enxerga o timestamp da primeira', () => {
    const s = estado({
      foodInventory: { '🍎': 5 },
      careCaps: { feedTimes: Array.from({ length: FOOD_LIMIT_PER_HOUR - 1 }, () => AGORA - 1_000) },
    });
    const um = applyFeed(s, '🍎', AGORA);
    expect(um.refused).toBeUndefined();

    const dois = applyFeed(um.state, '🍎', AGORA);
    expect(dois.refused, 'lendo o estado de FORA, esta passava e furava o teto').toBe('hourly-limit');
  });

  it('a janela é deslizante: comida de mais de uma hora atrás não conta', () => {
    const s = estado({
      foodInventory: { '🍎': 5 },
      careCaps: { feedTimes: Array.from({ length: FOOD_LIMIT_PER_HOUR }, () => AGORA - 2 * 60 * 60 * 1000) },
    });
    expect(applyFeed(s, '🍎', AGORA).refused).toBeUndefined();
  });

  it('sem estoque, recusa sem tocar em nada', () => {
    const s = estado({ foodInventory: {} });
    const { state, refused } = applyFeed(s, '🍎', AGORA);
    expect(refused).toBe('no-stock');
    expect(state).toBe(s);
  });
});

describe('X-6: a fiação — o App usa os updaters, não uma segunda cópia', () => {
  it('handlePet e handleFeed passam pelos updaters extraídos', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const app = fs.readFileSync(path.resolve(__dirname, '..', 'App.tsx'), 'utf8');
    for (const nome of ['applyRub(', 'applyFeed(', 'rubDecision(']) {
      expect(app.includes(nome), `o App deixou de usar ${nome} — regra duplicada volta a divergir`).toBe(true);
    }
  });
});
