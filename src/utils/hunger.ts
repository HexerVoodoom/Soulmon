// 🍽️ FOME E REGENERAÇÃO DE ENERGIA (pedido do dono, beta-2 itens 3.4 e 3.5 — REGISTRO §40).
//
// DONO ÚNICO da fome, da velocidade de regeneração e do relógio da energia. Funções PURAS: `now` (epoch ms) sempre por
// parâmetro, sem React, sem localStorage, sem `Date.now()` escondido. Importa só `types/progression` (folha) para o teto.
//
// ## O modelo (uma frase por peça)
//  · A FOME é um nível 0..`HUNGER_MAX` que DESCE com o tempo (por TIMESTAMP, nunca por tick, inclusive com o app fechado) e
//    SOBE só COMENDO. Comer NÃO dá energia: dá fome.
//  · A fome decide a VELOCIDADE com que a ENERGIA regenera: bem alimentado = 100%, mediano = `REGEN_FAIR_PCT`, faminto = 0
//    (a regeneração PARA — nada mais acontece com o bicho: fome NÃO tira coração, NÃO tira Bits, NÃO bloqueia nada além da
//    própria regeneração; o REGISTRO §28 recusou "fome como cobrança" e isto continua valendo).
//  · A energia regenera 1 unidade a cada `ENERGY_REGEN_MINUTES` a 100%. O progresso até a próxima unidade (`carry`) fica no
//    save, então fechar o app, navegar ou trocar de aparelho NÃO reinicia o relógio.
//  · O relógio é PAUSADO com a energia cheia e nasce de novo no instante em que ela deixa de estar cheia.
//
// ## Como o tempo é contado (por que não há contagem "só visual")
//  · A fome em `t` é `v − (t − at) × taxa` (clamp 0..máx) — função do registro, não de um contador de tela.
//  · A energia ganha entre dois instantes é a integral da VELOCIDADE (que depende da fome naquele instante). Como a fome só
//    desce entre duas refeições, a integral é feita por segmentos (as duas fronteiras de tier são calculadas a partir do
//    REGISTRO, nunca do instante da última leitura) — logo FATIAR o tempo não muda o total: ler a cada 20 s ou uma vez só
//    depois de 8 h dá o mesmo resultado (teste).
//  · O progresso é guardado em "ponto-ms" (velocidade em % × milissegundos, inteiro): sem float a derivar entre leituras.
//  · O timer da tela (`msToNextEnergy`) projeta a MESMA integral para a frente, incluindo a queda de tier que vai acontecer
//    por conta da fome descendo: o número que a pessoa vê é o que o motor vai fazer, e muda quando a velocidade muda.
//
// ## Onde a energia é GASTA ou GANHA fora da regeneração
//  Todo caminho (camada da masmorra, brincar, Level Up, pesadelo, virada do dia) passa por `setEnergy`, que primeiro acerta a
//  regeneração até `now` e depois reposiciona o relógio. Assim a regeneração nunca é contada em dobro nem perdida.
import { getMaxEnergyForStage } from '../types/progression';

// ── constantes (defaults propostos; o dono decide — REGISTRO §40) ─────────────────────────────────────────────────────

/** Fome cheia. */
export const HUNGER_MAX = 100;
/** Horas para a fome ir de CHEIA a ZERO, com o app aberto ou fechado. */
export const HUNGER_FULL_TO_EMPTY_HOURS = 14;
/** Fome devolvida por UMA comida comum (cada atividade concluída rende uma). */
export const HUNGER_PER_FOOD = 40;
/** Fome devolvida pela comida premium ★ (era +5 de energia). */
export const HUNGER_PER_PREMIUM = 100;
/** Com a fome neste nível ou acima a comida premium é RECUSADA (o item volta para a pastinha: não queimar à toa). */
export const HUNGER_PREMIUM_REFUSE_AT = 80;
/** Fome mínima para estar BEM ALIMENTADO (regeneração a 100%). */
export const HUNGER_FED_MIN = 60;
/** Fome mínima para estar MEDIANO (abaixo disso o bicho está FAMINTO e a regeneração para). */
export const HUNGER_FAIR_MIN = 20;
/** Velocidade da regeneração por faixa, em % da velocidade cheia. */
export const REGEN_FED_PCT = 100;
export const REGEN_FAIR_PCT = 50;
export const REGEN_STARVING_PCT = 0;
/** Minutos para regenerar UMA unidade de energia a 100%. */
export const ENERGY_REGEN_MINUTES = 120;

const MIN_MS = 60_000;
/** Energia cheia: de quanto em quanto tempo o relógio parado é re-ancorado no agora (ver `settleEnergy`). */
const FULL_REANCHOR_MS = 30 * MIN_MS;
const HOUR_MS = 3_600_000;
const FULL_TO_EMPTY_MS = HUNGER_FULL_TO_EMPTY_HOURS * HOUR_MS;
/** Fome perdida por ms. */
const DECAY_PER_MS = HUNGER_MAX / FULL_TO_EMPTY_MS;
/** Ponto-ms de UMA unidade de energia (velocidade em % × ms). */
export const UNIT_POINTS = ENERGY_REGEN_MINUTES * MIN_MS * 100;

export type HungerTier = 'fed' | 'fair' | 'starving';

/** O que fica no save: nível medido e o instante da medida. */
export interface HungerRecord { v: number; at: number }
/** O relógio da energia no save: instante até onde a regeneração já foi contada e o progresso até a próxima unidade (ponto-ms). */
export interface EnergyClock { at: number; carry: number }

export interface HungerState {
  energyPoints: number;
  evolutionStage?: string;
  hunger?: HungerRecord;
  energyClock?: EnergyClock;
}

const fin = (n: unknown, d = 0): number => (typeof n === 'number' && Number.isFinite(n) ? n : d);

// ── higienização (load do disco e da nuvem) ───────────────────────────────────────────────────────────────────────────

/** Lixo → `undefined` (= fome cheia, sem dívida retroativa). */
export function sanitizeHunger(raw: unknown): HungerRecord | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { v?: unknown; at?: unknown };
  if (typeof r.v !== 'number' || typeof r.at !== 'number' || !Number.isFinite(r.v) || !Number.isFinite(r.at)) return undefined;
  return { v: Math.min(HUNGER_MAX, Math.max(0, r.v)), at: Math.max(0, Math.floor(r.at)) };
}

/** Lixo → `undefined` (= o relógio nasce na próxima leitura, sem regeneração retroativa). */
export function sanitizeEnergyClock(raw: unknown): EnergyClock | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { at?: unknown; carry?: unknown };
  if (typeof r.at !== 'number' || !Number.isFinite(r.at)) return undefined;
  const carry = Math.min(UNIT_POINTS - 1, Math.max(0, Math.floor(fin(r.carry, 0))));
  return { at: Math.max(0, Math.floor(r.at)), carry };
}

// ── a fome ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A fome em `t`. Sem registro = cheia. `t` anterior à medida (relógio que voltou) vale o nível gravado. */
export function hungerAt(rec: HungerRecord | undefined, t: number): number {
  if (!rec) return HUNGER_MAX;
  const elapsed = Math.max(0, t - rec.at);
  return Math.min(HUNGER_MAX, Math.max(0, rec.v - elapsed * DECAY_PER_MS));
}

export function tierOf(v: number): HungerTier {
  return v >= HUNGER_FED_MIN ? 'fed' : v >= HUNGER_FAIR_MIN ? 'fair' : 'starving';
}

export function speedPct(tier: HungerTier): number {
  return tier === 'fed' ? REGEN_FED_PCT : tier === 'fair' ? REGEN_FAIR_PCT : REGEN_STARVING_PCT;
}

export const hungerTierAt = (rec: HungerRecord | undefined, t: number): HungerTier => tierOf(hungerAt(rec, t));

/** O instante (ms, inteiro) em que o registro cruza `level` descendo; `Infinity` se já está abaixo ou nunca cruza. */
function crossing(rec: HungerRecord | undefined, level: number): number {
  if (!rec) return Infinity; // sem registro a fome é cheia e não desce
  if (rec.v < level) return -Infinity; // já abaixo desde a medida
  return rec.at + Math.ceil((rec.v - level) / DECAY_PER_MS);
}

/**
 * Ponto-ms de regeneração entre `a` e `b` (a < b) com a fome do registro `rec`. As duas fronteiras (fome = FED_MIN e = FAIR_MIN)
 * saem do REGISTRO; o resultado é aditivo em intervalos adjacentes (fatiar não muda a soma).
 */
export function regenPoints(rec: HungerRecord | undefined, a: number, b: number): number {
  if (!(b > a)) return 0;
  const tFed = crossing(rec, HUNGER_FED_MIN);   // até aqui: bem alimentado (fome ≥ 60)
  const tFair = crossing(rec, HUNGER_FAIR_MIN); // até aqui: pelo menos mediano
  let pts = 0;
  // Antes da medida vale o nível gravado (como `hungerAt`): por isso a fronteira "já abaixo" é -Infinity e cai em `a`.
  const bounds = [a, Math.min(b, Math.max(a, tFed)), Math.min(b, Math.max(a, tFair)), b];
  const pcts = [REGEN_FED_PCT, REGEN_FAIR_PCT, REGEN_STARVING_PCT];
  for (let i = 0; i < 3; i++) pts += (bounds[i + 1] - bounds[i]) * pcts[i];
  return pts;
}

// ── a energia ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export const maxEnergyOf = (s: { evolutionStage?: string }): number => getMaxEnergyForStage(s.evolutionStage ?? '');

/**
 * Acerta a regeneração até `now`. IDEMPOTENTE e sem efeito colateral: devolve a MESMA referência quando nada muda (nenhuma
 * unidade nova e o relógio já existe), então pode rodar em tick sem re-render. O `at` do relógio só avança quando uma unidade
 * é ganha — o resto do progresso é refeito por inteiro na próxima leitura (mesmo total). Energia cheia = relógio parado.
 * `materialize` grava também o progresso parcial (usado ANTES de mudar a fome ou a energia).
 */
export function settleEnergy<T extends HungerState>(prev: T, now: number, materialize = false): T {
  const max = maxEnergyOf(prev);
  const energy = Math.max(0, Math.floor(fin(prev.energyPoints, 0)));
  const clock = prev.energyClock;
  if (!clock) return { ...prev, energyClock: { at: now, carry: 0 } }; // o relógio nasce agora (sem regeneração retroativa)
  // Cheia: nada a contar. O estado só muda de tempos em tempos (re-ancora o relógio): se o MÁXIMO subir (evoluir) com o relógio velho,
  // a regeneração não pode ser contada retroativamente desde a última vez que a energia estava cheia. Quem tira a energia do máximo
  // (`setEnergy`) recomeça o relógio na hora.
  if (energy >= max) return now - clock.at >= FULL_REANCHOR_MS ? { ...prev, energyClock: { at: now, carry: 0 } } : prev;
  if (!(now > clock.at)) return prev; // relógio que voltou não regenera nem tira
  const total = clock.carry + regenPoints(prev.hunger, clock.at, now);
  const gained = Math.floor(total / UNIT_POINTS);
  // `materialize`: antes de a FOME mudar (comer) o progresso pendente tem de ser gravado com a fome de ANTES — senão o intervalo
  // passado seria reavaliado com a fome nova. Sem ele (tick) o estado fica estável e o total é o mesmo na leitura seguinte.
  if (gained <= 0) return materialize ? { ...prev, energyClock: { at: now, carry: total } } : prev;
  const nextEnergy = Math.min(max, energy + gained);
  if (nextEnergy >= max) return { ...prev, energyPoints: max, energyClock: { at: now, carry: 0 } };
  // avança `at` só até onde as unidades inteiras foram contadas: o resto continua como progresso (carry) a partir de `now`
  return { ...prev, energyPoints: nextEnergy, energyClock: { at: now, carry: total - gained * UNIT_POINTS } };
}

/**
 * O ÚNICO jeito de mexer na energia fora da regeneração (gasto, Level Up, pesadelo, virada). Acerta até `now`, aplica `fn` ao valor
 * já acertado (limitado a 0..máx) e reposiciona o relógio: cheia → parado; saiu de cheia → começa agora.
 */
export function setEnergy<T extends HungerState>(prev: T, now: number, fn: (current: number, max: number) => number): T {
  const s = settleEnergy(prev, now, true);
  const max = maxEnergyOf(s);
  const cur = Math.max(0, Math.floor(fin(s.energyPoints, 0)));
  const next = Math.min(max, Math.max(0, Math.floor(fin(fn(cur, max), cur))));
  if (next === cur && s.energyClock) return s;
  const clock: EnergyClock = next >= max || cur >= max
    ? { at: now, carry: 0 } // entrou ou saiu de "cheia": o relógio recomeça agora
    : (s.energyClock ?? { at: now, carry: 0 });
  return { ...s, energyPoints: next, energyClock: clock };
}

// ── comer ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Comer: acerta a energia até `now` (com a fome DE ANTES, que é a que valeu até agora) e só então sobe a fome. Nunca toca na
 * energia. Idempotência é do chamador (a comida já foi debitada do estoque).
 */
export function eat<T extends HungerState>(prev: T, now: number, amount: number): T {
  const s = settleEnergy(prev, now, true);
  const v = Math.min(HUNGER_MAX, hungerAt(s.hunger, now) + Math.max(0, fin(amount, 0)));
  return { ...s, hunger: { v, at: now } };
}

// ── o que a tela mostra ───────────────────────────────────────────────────────────────────────────────────────────────

export type EnergyMode = 'full' | 'regen' | 'slow' | 'paused';

export interface EnergyStatus {
  energy: number;
  max: number;
  /** Fome 0..100 arredondada. */
  hunger: number;
  tier: HungerTier;
  /** Velocidade efetiva AGORA, em % (0, 50 ou 100 nos defaults). */
  speed: number;
  mode: EnergyMode;
  /** Ms até a PRÓXIMA unidade de energia, projetando a queda de tier da fome. `null` = cheia ou pausada (faminto). */
  msToNext: number | null;
}

/**
 * Ms (a partir de `now`) até a regeneração acumular `needPoints`, projetando a fome descendo SEM nova refeição. `null` se nunca.
 * Segmentos: [agora, tFed) a 100%, [tFed, tFair) a 50%, depois 0.
 */
function msUntilPoints(rec: HungerRecord | undefined, now: number, needPoints: number): number | null {
  if (needPoints <= 0) return 0;
  const tFed = crossing(rec, HUNGER_FED_MIN);
  const tFair = crossing(rec, HUNGER_FAIR_MIN);
  const segs: Array<[number, number, number]> = [
    [now, Math.max(now, tFed), REGEN_FED_PCT],
    [Math.max(now, tFed), Math.max(now, tFair), REGEN_FAIR_PCT],
  ];
  let left = needPoints;
  for (const [a, b, pct] of segs) {
    const len = b - a;
    if (len <= 0 || pct <= 0) continue;
    const cap = len * pct;
    if (left <= cap) return Math.max(1, Math.ceil((a - now) + left / pct));
    left -= cap;
  }
  return null;
}

/**
 * O estado real da energia/fome em `now` — o que o indicador e o timer leem. NÃO é uma contagem própria: acerta o relógio com
 * `settleEnergy` (sem gravar) e projeta com as MESMAS fronteiras do motor.
 */
export function energyStatus(state: HungerState, now: number): EnergyStatus {
  const s = settleEnergy(state, now);
  const max = maxEnergyOf(s);
  const energy = Math.max(0, Math.floor(fin(s.energyPoints, 0)));
  const v = hungerAt(s.hunger, now);
  const tier = tierOf(v);
  const speed = speedPct(tier);
  const base = { energy, max, hunger: Math.round(v), tier, speed };
  if (energy >= max) return { ...base, mode: 'full', msToNext: null };
  if (speed <= 0) return { ...base, mode: 'paused', msToNext: null };
  // `settleEnergy` só grava quando uma unidade fecha: o que andou desde `clock.at` ainda é progresso pendente.
  const c = s.energyClock;
  const pending = c ? c.carry + (now > c.at ? regenPoints(s.hunger, c.at, now) : 0) : 0;
  return { ...base, mode: speed >= 100 ? 'regen' : 'slow', msToNext: msUntilPoints(s.hunger, now, UNIT_POINTS - pending) };
}

/** Texto curto do timer ("1 h 05 min" / "1h 05m", "42 min"), arredondado PARA CIMA em minutos. */
export function formatEnergyEta(ms: number, pt: boolean): string {
  const min = Math.max(1, Math.ceil(ms / MIN_MS));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return pt ? `${m} min` : `${m}m`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
