/**
 * COMEÇAR E SAIR DA DEMO LOCAL — a parte do `demoMode.ts` que precisa de
 * `bond.ts` e do catálogo de iniciais (07/10/2026). O predicado mora em
 * `demoMode.ts`; aqui só se MONTA o save da demo e se sai dela.
 *
 * ⚠️ O nível do Vínculo NUNCA é gravado (footgun 9, `bond.ts`): a demo grava o
 * `totalXP` mínimo do nível 5 (`xpForLevel`) e `bondLevelFor` o devolve como 5.
 * Como `awardBondXP` é no-op em demo, o nível fica fixo.
 *
 * ⚠️ A demo NÃO migra para a conta por acidente: não grava e-mail, não tem
 * `saveId` derivado de e-mail e `cloudSave.ts` recusa qualquer save com
 * `demoLocal`. Para ter conta, a pessoa SAI da demo (`leaveDemo`) — que apaga o
 * save local e volta ao portão, em vez de misturar os dois.
 */
import { DEMO_BOND_LEVEL } from './demoMode';
import { xpForLevel } from './bond';
import { HUNGER_MAX, hungerAt, maxEnergyOf, type HungerRecord, type EnergyClock } from './hunger';
import { PREMADE_CHARACTERS, getDemoCreatureStages } from './monetization';
import { STORAGE_KEYS } from './storageKeys';
import { removeLocal } from './safeStorage';
import { MAX_HP_BY_FORM } from '../types/progression';

/** As atividades com que a demo nasce (a home não pode abrir vazia). Curtas, de cuidado, sem cobrança. */
export const DEMO_ACTIVITIES: ReadonlyArray<{ name: { en: string; pt: string }; category: 'Wellness' | 'Health' | 'Discipline'; emoji: string }> = [
  { name: { en: 'Drink a glass of water', pt: 'Beber um copo d’água' }, category: 'Health', emoji: '💧' },
  { name: { en: 'Stretch for 5 minutes', pt: 'Alongar por 5 minutos' }, category: 'Wellness', emoji: '🧘' },
  { name: { en: 'Tidy one small thing', pt: 'Arrumar uma coisa pequena' }, category: 'Discipline', emoji: '🧹' },
];

/** O `totalXP` da demo: o mínimo do nível `DEMO_BOND_LEVEL`. */
export function demoTotalXP(): number { return xpForLevel(DEMO_BOND_LEVEL); }

/**
 * O pedaço do save que a demo escreve por cima do estado inicial. Pura: `now` e
 * o dia do jogador entram por parâmetro. `null` para um id que não é dos 5 iniciais.
 */
export function buildDemoPatch(
  characterId: string,
  opts: { isPt: boolean; dayKey: string; now?: Date },
): Record<string, unknown> | null {
  const premade = PREMADE_CHARACTERS.find(c => c.id === characterId);
  if (!premade) return null;
  const now = (opts.now ?? new Date()).getTime();
  const hp = MAX_HP_BY_FORM.rookie;
  return {
    demoLocal: true,
    accountTier: 'demo',
    demoCharacterId: premade.id,
    totalXP: demoTotalXP(),
    bondDaily: undefined,
    evolutionStage: 'rookie',
    unlockedEvolutions: ['rookie'],
    healthPoints: hp,
    maxHealthPoints: hp,
    soulmonStages: getDemoCreatureStages(premade),
    soulmonMeta: { baseName: premade.name },
    activities: DEMO_ACTIVITIES.map((a, i) => ({
      id: `demo-${now + i}`,
      name: opts.isPt ? a.name.pt : a.name.en,
      category: a.category,
      emoji: a.emoji,
      steps: [],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    })),
    tasks: [],
    // O ritual de planejamento não abre em cima de quem acabou de chegar (mesma razão do onboarding).
    lastCheckInDate: opts.dayKey,
    bornAt: opts.dayKey,
  };
}

/**
 * Sai da demo: apaga o save local e os dois carimbos de "onboarding concluído" e
 * recarrega — o app volta à home, com o botão de login e o DEMO. Não há nada a
 * preservar (a demo não tem conta nem nuvem) e NÃO existe "converter a demo em
 * conta": misturaria um save sem identidade com uma identidade. `recarregar` é
 * injetável para teste.
 */
export function leaveDemo(opts: { recarregar?: () => void } = {}): void {
  removeLocal(STORAGE_KEYS.GAME_STATE, { silent: true });
  removeLocal(STORAGE_KEYS.SAVE_ID, { silent: true });
  removeLocal(STORAGE_KEYS.ONBOARDING_COMPLETE, { silent: true });
  removeLocal(STORAGE_KEYS.TUTORIAL_COMPLETE, { silent: true });
  const recarregar = opts.recarregar ?? (() => { try { globalThis.location?.reload(); } catch { /* sem window */ } });
  recarregar();
}

/**
 * DEMO (portfólio): VIDA e ENERGIA sempre CHEIAS e a fome no MÁXIMO (3/3), sem decair — sem regeneração nem penalidade de fome.
 * Pura; devolve a MESMA referência quando já está tudo cheio (sem re-render nem escrita à toa).
 */
export function keepDemoVitalsFull<T extends { healthPoints: number; maxHealthPoints: number; energyPoints?: number; evolutionStage?: string; hunger?: HungerRecord; energyClock?: EnergyClock }>(prev: T, now: number): T {
  const maxE = maxEnergyOf(prev);
  const full = prev.healthPoints >= prev.maxHealthPoints
    && (prev.energyPoints ?? 0) >= maxE
    && hungerAt(prev.hunger, now) >= HUNGER_MAX;
  if (full) return prev;
  return { ...prev, healthPoints: prev.maxHealthPoints, energyPoints: maxE, hunger: { v: HUNGER_MAX, at: now }, energyClock: { at: now, carry: 0 } };
}

/**
 * Troca o IDIOMA dos hábitos semente da demo (QA L05-08): o save nascia no idioma da hora e, trocado `soulmon-language`
 * depois, "Drink a glass of water" seguia em inglês numa UI em português (e o contrário). Só mexe no nome que é EXATAMENTE
 * o do outro idioma — um hábito que a pessoa renomeou nunca é tocado. Devolve o MESMO array quando nada muda.
 */
export function localizeDemoActivities<T extends { name: string }>(activities: readonly T[], isPt: boolean): readonly T[] {
  let changed = false;
  const out = activities.map(a => {
    const seed = DEMO_ACTIVITIES.find(d => d.name.en === a.name || d.name.pt === a.name);
    if (!seed) return a;
    const want = isPt ? seed.name.pt : seed.name.en;
    if (want === a.name) return a;
    changed = true;
    return { ...a, name: want };
  });
  return changed ? out : activities;
}
