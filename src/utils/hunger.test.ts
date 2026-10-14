/**
 * Fome e regeneração de energia (beta-2 3.4 e 3.5 — REGISTRO §40). Cobre os critérios de aceite do backlog:
 *  · comer altera a FOME e NÃO concede energia;
 *  · a fome controla a velocidade (bem alimentado 100% · mediano 50% · faminto 0% = interrompida);
 *  · o timer corresponde à velocidade efetiva, projeta a queda de faixa e muda quando a fome muda;
 *  · estados persistem (fechar/reabrir) e não há regeneração duplicada nem exploit (relógio, entrar/sair repetido).
 */
import { describe, it, expect } from 'vitest';
import {
  hungerLevelOf,
  formatEnergyCountdown,
  HUNGER_MAX, HUNGER_FED_MIN, HUNGER_FAIR_MIN, HUNGER_PER_FOOD, HUNGER_FULL_TO_EMPTY_HOURS, ENERGY_REGEN_MINUTES, REGEN_FAIR_PCT,
  UNIT_POINTS, eat, energyStatus, hungerAt, regenPoints, sanitizeEnergyClock, sanitizeHunger, setEnergy, settleEnergy, tierOf, formatEnergyEta, tickEnergy, tickTime,
  type HungerState,
} from './hunger';
import { feedFood, type CareState } from './careRules';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = Date.UTC(2026, 9, 13, 12, 0, 0);
// rookie: 4 × 2 = 8 barras
const novo = (over: Partial<HungerState> = {}): HungerState => ({ energyPoints: 0, evolutionStage: 'rookie', energyClock: { at: T0, carry: 0 }, ...over });
const fome = (v: number, at = T0) => ({ v, at });
/** Avança o estado de `from` a `to` em passos de `step` (como o tick do App) e devolve o resultado. */
function andar<T extends HungerState>(s: T, from: number, to: number, step: number): T {
  let cur = s;
  for (let t = from + step; t <= to; t += step) cur = settleEnergy(cur, t);
  return settleEnergy(cur, to);
}

describe('as faixas da fome', () => {
  it('bem alimentado ≥ 60 · mediano 20..59 · faminto < 20', () => {
    expect(tierOf(100)).toBe('fed');
    expect(tierOf(HUNGER_FED_MIN)).toBe('fed');
    expect(tierOf(HUNGER_FED_MIN - 0.01)).toBe('fair');
    expect(tierOf(HUNGER_FAIR_MIN)).toBe('fair');
    expect(tierOf(HUNGER_FAIR_MIN - 0.01)).toBe('starving');
    expect(tierOf(0)).toBe('starving');
  });
  it('a fome desce por TIMESTAMP: cheia → zero em HUNGER_FULL_TO_EMPTY_HOURS, relógio que voltou vale o nível gravado, sem registro = cheia', () => {
    const rec = fome(100);
    expect(hungerAt(rec, T0 + HUNGER_FULL_TO_EMPTY_HOURS * HOUR)).toBeCloseTo(0, 6);
    expect(hungerAt(rec, T0 + (HUNGER_FULL_TO_EMPTY_HOURS * HOUR) / 2)).toBeCloseTo(50, 6);
    expect(hungerAt(rec, T0 - 5 * HOUR)).toBe(100);
    expect(hungerAt(undefined, T0 + 999 * HOUR)).toBe(HUNGER_MAX);
  });
});

describe('a velocidade da regeneração segue a fome', () => {
  it('bem alimentado: 1 unidade a cada ENERGY_REGEN_MINUTES (velocidade 100%)', () => {
    const base = novo({ hunger: fome(100) });
    expect(andar(base, T0, T0 + ENERGY_REGEN_MINUTES * MIN, MIN).energyPoints).toBe(1);
    expect(andar(base, T0, T0 + ENERGY_REGEN_MINUTES * MIN - MIN, MIN).energyPoints).toBe(0);
  });
  it('mediano: metade da velocidade (o dobro do tempo por unidade)', () => {
    const base = novo({ hunger: fome(HUNGER_FED_MIN - 0.0001) });
    const pts = regenPoints(base.hunger, T0, T0 + ENERGY_REGEN_MINUTES * MIN);
    expect(pts / UNIT_POINTS).toBeCloseTo(REGEN_FAIR_PCT / 100, 2);
  });
  it('faminto: a regeneração está INTERROMPIDA (nada acontece em dias)', () => {
    const base = novo({ hunger: fome(5) });
    const fim = andar(base, T0, T0 + 72 * HOUR, 5 * MIN);
    expect(fim.energyPoints).toBe(0);
    expect(energyStatus(base, T0).mode).toBe('paused');
    expect(energyStatus(base, T0).msToNext).toBeNull();
  });
  it('a fome DESCE durante a regeneração: o ganho diminui sozinho conforme ela passa de faixa (integral por segmentos)', () => {
    const base = novo({ hunger: fome(100) });
    const total = regenPoints(base.hunger, T0, T0 + 40 * HOUR);
    // 100→60 em 5,6 h a 100%, 60→20 em 5,6 h a 50%, depois 0: 5,6 + 2,8 = 8,4 h efetivas
    const efetivasH = total / (100 * HOUR);
    expect(efetivasH).toBeCloseTo((HUNGER_FULL_TO_EMPTY_HOURS * (100 - HUNGER_FED_MIN)) / 100 + (HUNGER_FULL_TO_EMPTY_HOURS * (HUNGER_FED_MIN - HUNGER_FAIR_MIN)) / 100 / 2, 1);
  });
  it('energia cheia: o relógio PARA (sem regeneração acumulada além do máximo)', () => {
    const cheio = novo({ energyPoints: 8, hunger: fome(100) });
    const fim = andar(cheio, T0, T0 + 24 * HOUR, 10 * MIN);
    expect(fim.energyPoints).toBe(8);
    expect(energyStatus(fim, T0 + 24 * HOUR).mode).toBe('full');
    expect(energyStatus(fim, T0 + 24 * HOUR).msToNext).toBeNull();
  });
});

describe('comer sobe a FOME e NÃO concede energia', () => {
  const care = (over: Partial<CareState> = {}): CareState => ({
    healthPoints: 3, maxHealthPoints: 3, energyPoints: 0, evolutionStage: 'rookie', foodInventory: { '🍎': 3 },
    powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, totalXP: 0, attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
    energyClock: { at: T0, carry: 0 }, hunger: fome(10), ...over,
  });
  it('feedFood: fome +HUNGER_PER_FOOD, energia INTACTA (mesmo com a pastinha cheia)', () => {
    const r = feedFood(care(), '🍎', [], T0);
    expect(hungerAt(r.state.hunger, T0)).toBe(10 + HUNGER_PER_FOOD);
    expect(r.state.energyPoints).toBe(0);
    let s = care({ foodInventory: { '🍎': 6 } });
    let ft: number[] = [];
    for (let i = 0; i < 6; i++) { const x = feedFood(s, '🍎', ft, T0); s = x.state; ft = x.feedTimes; }
    expect(s.energyPoints).toBe(0); // seis comidas seguidas: zero energia
    expect(hungerAt(s.hunger, T0)).toBe(HUNGER_MAX);
  });
  it('comer não joga fora a regeneração já ganha (acerta a energia ANTES de subir a fome)', () => {
    const base = novo({ hunger: fome(100) });
    const antes = andar(base, T0, T0 + 3 * HOUR, 20 * MIN);
    const depois = eat(base, T0 + 3 * HOUR, HUNGER_PER_FOOD);
    expect(depois.energyPoints).toBe(antes.energyPoints);
    expect(settleEnergy(depois, T0 + 3 * HOUR).energyPoints).toBe(antes.energyPoints);
  });
  it('REGRESSÃO: o pendente de um período FAMINTO não é reavaliado com a fome nova depois de comer', () => {
    const base = novo({ hunger: fome(100) });
    const agora = T0 + 30 * HOUR;
    const comida = eat(base, agora, HUNGER_PER_FOOD);
    const previsto = andar(base, T0, agora, 5 * MIN).energyPoints;
    expect(settleEnergy(comida, agora).energyPoints).toBe(previsto);
  });
});

describe('o timer é o motor projetado, não uma contagem visual', () => {
  it('bem alimentado: msToNext = tempo restante até a próxima unidade; a unidade chega exatamente nele', () => {
    const base = novo({ hunger: fome(100), energyClock: { at: T0, carry: 0 } });
    const t = T0 + 30 * MIN;
    const st = energyStatus(base, t);
    expect(st.mode).toBe('regen');
    expect(st.msToNext).toBe(ENERGY_REGEN_MINUTES * MIN - 30 * MIN);
    expect(settleEnergy(base, t + st.msToNext! - 1).energyPoints).toBe(0);
    expect(settleEnergy(base, t + st.msToNext!).energyPoints).toBe(1);
  });
  it('projeta a QUEDA DE FAIXA: perto da fronteira, a previsão já embute a velocidade menor (e bate com o motor)', () => {
    const base = novo({ hunger: fome(62), energyClock: { at: T0, carry: 0 } });
    const st = energyStatus(base, T0);
    expect(st.msToNext!).toBeGreaterThan(ENERGY_REGEN_MINUTES * MIN); // mais lento que 100% puro
    expect(settleEnergy(base, T0 + st.msToNext! - 1).energyPoints).toBe(0);
    expect(settleEnergy(base, T0 + st.msToNext!).energyPoints).toBe(1);
  });
  it('muda quando a fome muda: comer encurta o timer', () => {
    const base = novo({ hunger: fome(55), energyClock: { at: T0, carry: 0 } });
    const antes = energyStatus(base, T0);
    expect(antes.mode).toBe('slow');
    const comeu = eat(base, T0, HUNGER_PER_FOOD * 2);
    const depois = energyStatus(comeu, T0);
    expect(depois.mode).toBe('regen');
    expect(depois.msToNext!).toBeLessThan(antes.msToNext!);
  });
  it('faminto → comer reativa a regeneração (timer sai de "pausada" para um tempo)', () => {
    const base = novo({ hunger: fome(0), energyClock: { at: T0, carry: 0 } });
    expect(energyStatus(base, T0).mode).toBe('paused');
    const comeu = eat(base, T0, HUNGER_PER_FOOD);
    expect(energyStatus(comeu, T0).mode).toBe('slow');
    // uma comida só (fome 40) volta a regenerar, mas ele volta a ficar faminto ANTES de fechar a próxima unidade: a projeção diz a verdade (sem
    // tempo) em vez de inventar um — o `EnergyTimer` mostra o traço. Mais uma comida e a unidade fecha.
    expect(energyStatus(comeu, T0).msToNext).toBeNull();
    const comeuMais = eat(comeu, T0, HUNGER_PER_FOOD);
    expect(energyStatus(comeuMais, T0).msToNext).not.toBeNull();
  });
  it('o formato curto do timer arredonda para cima e nunca mostra 0', () => {
    expect(formatEnergyEta(30_000, true)).toBe('1 min');
    expect(formatEnergyEta(42 * MIN, true)).toBe('42 min');
    expect(formatEnergyEta(65 * MIN, true)).toBe('1h05');
    expect(formatEnergyEta(65 * MIN, false)).toBe('1h05');
  });
});

describe('fatiar o tempo não muda o total (sem regeneração em dobro nem perdida)', () => {
  it('ler a cada 20 s, a cada 7 min ou uma vez só dá a MESMA energia e o MESMO progresso (várias fomes iniciais)', () => {
    for (const v0 of [100, 75, 62, 59.9, 45, 20, 19.9, 0]) {
      const base = novo({ hunger: fome(v0) });
      const fim = T0 + 13 * HOUR;
      const a = andar(base, T0, fim, 20_000);
      const b = andar(base, T0, fim, 7 * MIN);
      const c = settleEnergy(base, fim);
      expect([a.energyPoints, b.energyPoints], `v0=${v0}`).toEqual([c.energyPoints, c.energyPoints]);
      const prog = (s: HungerState) => (s.energyClock!.carry + regenPoints(s.hunger, s.energyClock!.at, fim)) % UNIT_POINTS;
      expect(prog(a)).toBe(prog(c));
      expect(prog(b)).toBe(prog(c));
    }
  });
  it('relógio que VOLTA não regenera nem tira', () => {
    const base = novo({ hunger: fome(100), energyPoints: 3, energyClock: { at: T0 + 5 * HOUR, carry: 123 } });
    expect(settleEnergy(base, T0)).toBe(base);
  });
});

describe('estados persistem (fechar e reabrir)', () => {
  it('JSON + sanitize devolve o mesmo relógio e a mesma fome; o timer fecha com o de antes de fechar', () => {
    const base = andar(novo({ hunger: fome(90) }), T0, T0 + 3 * HOUR, 10 * MIN);
    const salvo = JSON.parse(JSON.stringify(base)) as HungerState;
    const reaberto: HungerState = { ...salvo, hunger: sanitizeHunger(salvo.hunger), energyClock: sanitizeEnergyClock(salvo.energyClock) };
    const t = T0 + 3 * HOUR + 17 * MIN;
    expect(energyStatus(reaberto, t)).toEqual(energyStatus(base, t));
  });
  it('lixo no save cai em fome cheia / relógio novo (nunca NaN, nunca negativo, nunca dívida retroativa)', () => {
    for (const lixo of [null, 1, 'x', [], { v: 'a', at: 1 }, { v: NaN, at: 1 }, { v: 5 }, { at: 5 }, { v: Infinity, at: 3 }]) {
      expect(sanitizeHunger(lixo)).toBeUndefined();
    }
    expect(sanitizeHunger({ v: 1e9, at: 5.7 })).toEqual({ v: HUNGER_MAX, at: 5 });
    expect(sanitizeHunger({ v: -50, at: 5 })).toEqual({ v: 0, at: 5 });
    expect(sanitizeEnergyClock({ at: 10, carry: 1e30 })!.carry).toBeLessThan(UNIT_POINTS);
    expect(sanitizeEnergyClock({ at: 10, carry: -5 })!.carry).toBe(0);
    expect(sanitizeEnergyClock({ at: 'x', carry: 1 })).toBeUndefined();
  });
  it('save SEM relógio (antigo): nasce agora, sem regeneração retroativa', () => {
    const antigo: HungerState = { energyPoints: 2, evolutionStage: 'rookie' };
    const s = settleEnergy(antigo, T0);
    expect(s.energyPoints).toBe(2);
    expect(s.energyClock).toEqual({ at: T0, carry: 0 });
    expect(settleEnergy(s, T0 + 2 * HOUR).energyPoints).toBe(3);
  });
});

describe('gasto, ganho e cheia: o relógio nunca conta em dobro', () => {
  it('gastar parte da energia NÃO reinicia o progresso até a próxima unidade (timers não reiniciam)', () => {
    const base = andar(novo({ hunger: fome(100), energyPoints: 4 }), T0, T0 + 90 * MIN, 10 * MIN);
    const antes = energyStatus(base, T0 + 90 * MIN).msToNext!;
    const gasto = setEnergy(base, T0 + 90 * MIN, (e) => e - 1);
    expect(gasto.energyPoints).toBe(base.energyPoints - 1);
    expect(energyStatus(gasto, T0 + 90 * MIN).msToNext).toBe(antes);
  });
  it('sair da energia CHEIA começa o relógio do zero no instante do gasto (não credita o tempo parado)', () => {
    const cheio = novo({ energyPoints: 8, hunger: fome(100), energyClock: { at: T0 - 50 * HOUR, carry: 0 } });
    const gasto = setEnergy(cheio, T0, (e) => e - 1);
    expect(gasto.energyPoints).toBe(7);
    expect(settleEnergy(gasto, T0 + 60 * MIN).energyPoints).toBe(7);
    expect(settleEnergy(gasto, T0 + ENERGY_REGEN_MINUTES * MIN).energyPoints).toBe(8);
  });
  it('evoluir (o MÁXIMO sobe) com a energia que estava cheia há dias não credita dias de regeneração', () => {
    let s: HungerState = novo({ energyPoints: 8, hunger: fome(100), energyClock: { at: T0, carry: 0 } });
    for (let t = T0; t <= T0 + 48 * HOUR; t += 10 * MIN) s = settleEnergy(s, t);
    const evoluido = { ...s, evolutionStage: 'champion' }; // 10 barras
    const logo = settleEnergy(evoluido, T0 + 48 * HOUR + MIN);
    expect(logo.energyPoints).toBe(8);
  });
  it('Level Up / pesadelo enchem pela mesma porta e deixam o relógio parado', () => {
    const base = novo({ energyPoints: 2, hunger: fome(100) });
    const cheio = setEnergy(base, T0 + HOUR, (_c, max) => max);
    expect(cheio.energyPoints).toBe(8);
    expect(energyStatus(cheio, T0 + 5 * HOUR).mode).toBe('full');
  });
});

describe('exploits', () => {
  it('adiantar o relógio: só rende o que a fome permitiria naquele tempo (não é energia grátis)', () => {
    const base = novo({ hunger: fome(100) });
    const salto = settleEnergy(base, T0 + 100 * HOUR);
    // teto físico: 100 → 0 em 14 h rende ~8,4 h efetivas / 2 h = ~4 unidades — nunca as 50 de "100 h a 100%"
    expect(salto.energyPoints).toBeLessThanOrEqual(5);
    expect(salto.energyPoints).toBeGreaterThanOrEqual(3);
  });
  it('abrir e fechar o app 200 vezes no mesmo minuto não regenera nada a mais', () => {
    let s = novo({ hunger: fome(100) });
    for (let i = 0; i < 200; i++) s = settleEnergy(s, T0 + 10 * MIN + i);
    expect(s.energyPoints).toBe(0);
    expect(energyStatus(s, T0 + 10 * MIN).msToNext).toBeLessThanOrEqual(ENERGY_REGEN_MINUTES * MIN - 10 * MIN);
  });
  it('comer ao máximo repetido não dá energia nenhuma (só a fome, limitada a 100)', () => {
    let s = novo({ hunger: fome(10) });
    for (let i = 0; i < 50; i++) s = eat(s, T0 + i, HUNGER_PER_FOOD);
    expect(s.energyPoints).toBe(0);
    expect(hungerAt(s.hunger, T0 + 60)).toBeLessThanOrEqual(HUNGER_MAX);
  });
  it('fome em zero e energia em zero: nada gera energia sem comer (nem em 30 dias)', () => {
    const s = andar(novo({ hunger: fome(0) }), T0, T0 + 30 * 24 * HOUR, 6 * HOUR);
    expect(s.energyPoints).toBe(0);
  });
});

describe('com o Soulmon na masmorra o tick CONGELA a energia (a conta de quem ficou fora regenera ao longo da linha do tempo)', () => {
  it('tickTime: sem descida é o agora; com descida é o `since` (nunca depois do agora)', () => {
    expect(tickTime({}, T0 + HOUR)).toBe(T0 + HOUR);
    expect(tickTime({ dungeonAway: { since: T0 } }, T0 + 5 * HOUR)).toBe(T0);
    expect(tickTime({ dungeonAway: { since: T0 + 9 * HOUR } }, T0 + HOUR)).toBe(T0 + HOUR);
    expect(tickTime({ dungeonAway: { since: Number.NaN } }, T0 + HOUR)).toBe(T0 + HOUR);
  });
  it('tickEnergy durante a descida não credita nada (mesma referência) e a leitura da tela mostra o que o estado tem', () => {
    const fora = novo({ hunger: fome(100), dungeonAway: { since: T0 } });
    expect(tickEnergy(fora, T0 + 6 * HOUR)).toBe(fora);
    const st = energyStatus(fora, T0 + 6 * HOUR);
    expect(st.energy).toBe(0); // congelada: a UI não mostra regeneração que o estado ainda não tem
  });
  it('congelar é ADIAR, não perder: ao voltar, o acerto credita o intervalo todo — o mesmo total de quem ficou em casa', () => {
    const casa = andar(novo({ hunger: fome(100) }), T0, T0 + 5 * HOUR, 15_000);
    const fora = novo({ hunger: fome(100), dungeonAway: { since: T0 } });
    let cur = fora;
    for (let t = T0 + 15_000; t <= T0 + 5 * HOUR; t += 15_000) cur = tickEnergy(cur, t);
    expect(cur.energyPoints).toBe(0);
    const voltou = { ...cur, dungeonAway: undefined };
    expect(tickEnergy(voltou, T0 + 5 * HOUR).energyPoints).toBe(casa.energyPoints);
  });
});

describe('formatEnergyCountdown (REGISTRO §42)', () => {
  it('H:MM:SS com hora, M:SS sem; arredonda para cima em segundos; nunca negativo', () => {
    expect(formatEnergyCountdown(3_725_000)).toBe('1:02:05');
    expect(formatEnergyCountdown(59_001)).toBe('1:00');
    expect(formatEnergyCountdown(42 * 60_000)).toBe('42:00');
    expect(formatEnergyCountdown(3_600_000)).toBe('1:00:00');
    expect(formatEnergyCountdown(-5)).toBe('0:00');
    expect(formatEnergyCountdown(NaN)).toBe('0:00');
  });
});

describe('energyStatus.msToHungerDrop e hungerLevelOf (REGISTRO §42)', () => {
  it('fed→fair em (v-60)/taxa, fair→starving em (v-20)/taxa, faminto = null; nível 3/2/1', () => {
    const H = 3_600_000;
    const at = 1_000_000;
    const mk = (v: number) => ({ energyPoints: 0, hunger: { v, at }, energyClock: undefined, evolutionStage: 'rookie' }) as unknown as Parameters<typeof energyStatus>[0];
    const rate = HUNGER_MAX / (HUNGER_FULL_TO_EMPTY_HOURS * H);
    const fed = energyStatus(mk(100), at);
    expect(fed.msToHungerDrop).toBeCloseTo((100 - HUNGER_FED_MIN) / rate, -1);
    const fair = energyStatus(mk(50), at);
    expect(fair.msToHungerDrop).toBeCloseTo((50 - HUNGER_FAIR_MIN) / rate, -1);
    expect(energyStatus(mk(10), at).msToHungerDrop).toBeNull();
    expect([hungerLevelOf('fed'), hungerLevelOf('fair'), hungerLevelOf('starving')]).toEqual([3, 2, 1]);
  });
});
