/**
 * FERRAMENTAS DE GM — o que o painel de administrador (`SettingsPage` ›
 * `GmPanel`) faz no save. Dono único destas ações.
 *
 * Regras que valem para TODAS:
 *  - são updaters PUROS (`prev → next`), sem efeito colateral: quem chama
 *    dispara FORA de updater quando há efeito (footgun 6) e memoiza (footgun 5);
 *  - são IDEMPOTENTES: aplicar duas vezes dá o mesmo save, e quando nada muda
 *    devolvem a MESMA referência (o `setGameState` não grava à toa);
 *  - mexem SÓ no save LOCAL — o que qualquer jogador já edita no localStorage.
 *    Nenhuma rota de servidor, nenhum dado de outro jogador, e Créditos NÃO
 *    (vivem no servidor; o admin já recebe saldo de exibição de lá);
 *  - nunca REDUZEM um saldo/contador maior que o alvo.
 *
 * Missões permanentes (`utils/missions.ts`): decidido FABRICAR os contadores
 * vitalícios mínimos (kills 100, runs 3, Dino 1000, dias de missão 30) em vez
 * de um override de administrador. Motivo: um override seria uma segunda
 * regra de "missão cumprida" lida pela loja — exatamente a cópia que o
 * footgun 9 proíbe — e teria de viver fora do save para não vazar. Os
 * contadores usam `Math.max`, então nunca inflam quem já passou do alvo, e
 * `perfectDays`/`totalPerfectDays` NÃO são tocados por `gmUnlockAll`
 * (`missionPerfectDays` é um contador separado, só da missão).
 */
import { MAX_HP_BY_FORM, getMaxEnergyForStage, getStageLevel } from '../types/progression';
import { PET_BACKGROUNDS } from './backgrounds';
import { ALL_SHOP_ITEMS } from './shop';
import { MISSIONS } from './missions';
import { CORVO_FORM_IDS } from './corvoPet';
import { cleanPoop } from './poopDrain';

/** Saldo que o GM recebe em Bits e Emblemas. Constante ÚNICA. */
export const GM_BALANCE = 999999;

/** As 11 formas que o "ir para forma" oferece (mesma escada do corvo). */
export const GM_FORMS = CORVO_FORM_IDS;

/** Quantos dias completos o painel pode somar de uma vez. */
export const GM_PERFECT_DAY_STEPS = [1, 7, 30] as const;

const missionTarget = (id: string): number => MISSIONS.find(m => m.id === id)?.target ?? 0;

// ── (a) Saldo ───────────────────────────────────────────────────────────────

export function gmGiveBalance<T extends { gamePoints: number; emblems?: number }>(prev: T): T {
  const bits = Math.max(prev.gamePoints ?? 0, GM_BALANCE);
  const emblems = Math.max(prev.emblems ?? 0, GM_BALANCE);
  if (bits === prev.gamePoints && emblems === prev.emblems) return prev;
  return { ...prev, gamePoints: bits, emblems };
}

// ── (b) Desbloquear tudo ────────────────────────────────────────────────────

export interface GmUnlockState {
  ownedBackgrounds: string[];
  ownedFurniture?: string[];
  unlockedEvolutions: string[];
  dungeonKills?: number;
  dungeonRunsCompleted?: number;
  dinoBest?: number;
  missionPerfectDays?: number;
}

/** Todos os cenários do catálogo (inclui `bg-mission-*` e `bg-guild-*`). */
export function allBackgroundIds(): string[] {
  const fromShop = ALL_SHOP_ITEMS.filter(i => i.kind === 'bg').map(i => i.id);
  return Array.from(new Set([...Object.keys(PET_BACKGROUNDS), ...fromShop]));
}

/** Todas as decorações/mobílias (loja, Torneio e Feira — inclui `trophy-concha-mare`). */
export function allFurnitureIds(): string[] {
  return Array.from(new Set(ALL_SHOP_ITEMS.filter(i => i.kind === 'furniture').map(i => i.id)));
}

const union = (a: readonly string[] | undefined, b: readonly string[]): string[] => {
  const base = Array.isArray(a) ? a : [];
  const faltam = b.filter(x => !base.includes(x));
  return faltam.length ? [...base, ...faltam] : (base as string[]);
};

export function gmUnlockAll<T extends GmUnlockState>(prev: T): T {
  const next = {
    ...prev,
    ownedBackgrounds: union(prev.ownedBackgrounds, allBackgroundIds()),
    ownedFurniture: union(prev.ownedFurniture, allFurnitureIds()),
    unlockedEvolutions: union(prev.unlockedEvolutions, GM_FORMS),
    dungeonKills: Math.max(prev.dungeonKills ?? 0, missionTarget('mission-kills-100')),
    dungeonRunsCompleted: Math.max(prev.dungeonRunsCompleted ?? 0, missionTarget('mission-runs-3')),
    dinoBest: Math.max(prev.dinoBest ?? 0, missionTarget('mission-dino-1000')),
    missionPerfectDays: Math.max(prev.missionPerfectDays ?? 0, ...MISSIONS.filter(m => m.category === 'constancy').map(m => m.target)),
  };
  const same = next.ownedBackgrounds === prev.ownedBackgrounds
    && next.ownedFurniture === prev.ownedFurniture
    && next.unlockedEvolutions === prev.unlockedEvolutions
    && next.dungeonKills === prev.dungeonKills
    && next.dungeonRunsCompleted === prev.dungeonRunsCompleted
    && next.dinoBest === prev.dinoBest
    && next.missionPerfectDays === prev.missionPerfectDays;
  return same ? prev : next;
}

// ── (c) Ir para forma ───────────────────────────────────────────────────────

export interface GmFormState {
  evolutionStage: string;
  currentBranch: 'power' | 'harmony' | 'benevolence';
  unlockedEvolutions: string[];
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
}

export function gmGoToForm<T extends GmFormState>(prev: T, formId: string): T {
  if (!(GM_FORMS as readonly string[]).includes(formId)) return prev;
  const level = getStageLevel(formId);
  const path = formId.split('-')[1] as GmFormState['currentBranch'] | undefined;
  const maxHP = MAX_HP_BY_FORM[level];
  const next: T = {
    ...prev,
    evolutionStage: formId,
    currentBranch: path ?? prev.currentBranch,
    unlockedEvolutions: union(prev.unlockedEvolutions, [formId]),
    maxHealthPoints: maxHP,
    healthPoints: Math.min(prev.healthPoints, maxHP),
    energyPoints: Math.min(prev.energyPoints, getMaxEnergyForStage(formId)),
  };
  const same = next.evolutionStage === prev.evolutionStage
    && next.currentBranch === prev.currentBranch
    && next.unlockedEvolutions === prev.unlockedEvolutions
    && next.maxHealthPoints === prev.maxHealthPoints
    && next.healthPoints === prev.healthPoints
    && next.energyPoints === prev.energyPoints;
  return same ? prev : next;
}

// ── (e) Encher cuidados ─────────────────────────────────────────────────────

export interface GmCareState {
  evolutionStage: string;
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  poopEventsShown: number[];
  poopPenaltyClockAt: number;
}

/**
 * HP e energia no máximo da forma e cocô limpo. NÃO toca em `careCaps`
 * (os tetos de carinho/comida seguem valendo) nem em `poopDrainCharge`.
 */
export function gmFillCare<T extends GmCareState>(prev: T): T {
  const maxHP = prev.maxHealthPoints;
  const maxEnergy = getMaxEnergyForStage(prev.evolutionStage);
  const limpo = cleanPoop(prev).state;
  if (limpo === prev && prev.healthPoints >= maxHP && prev.energyPoints >= maxEnergy) return prev;
  return {
    ...limpo,
    healthPoints: Math.max(prev.healthPoints, maxHP),
    energyPoints: Math.max(prev.energyPoints, maxEnergy),
  };
}

// ── (f) Dias completos ──────────────────────────────────────────────────────

/** Soma N a `perfectDays` e `totalPerfectDays`. Não idempotente por natureza
 *  (é um incremento pedido); N fora de 1..30 é recusado. */
export function gmAddPerfectDays<T extends { perfectDays: number; totalPerfectDays?: number }>(prev: T, n: number): T {
  if (!Number.isInteger(n) || n < 1 || n > 30) return prev;
  return {
    ...prev,
    perfectDays: (prev.perfectDays ?? 0) + n,
    totalPerfectDays: (prev.totalPerfectDays ?? 0) + n,
  };
}
