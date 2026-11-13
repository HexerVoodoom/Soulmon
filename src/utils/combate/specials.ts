/**
 * Combat v3 — special-move families and energy (story PR1).
 *
 * Every special spends the same budget E = 3 hits, shaped by its family. The
 * per-family power `p` was calibrated in the spike so that the time to win of
 * each family stays within ±5% of the reference (direct damage), measured by
 * the paired ruler (see `ruler.ts`). Buffs are allowed −15% at rookie (§2.5).
 */

/**
 * Bônus dos efeitos que demoram (DoT e HoT) NOS INIMIGOS, dono 11/11/2026: total ~15% acima do equivalente imediato (dano direto / cura).
 * Só o especial dos inimigos usa (`foeFamilies.ts`): mexer em `SPECIAL_POWER`/`EFFECT_TUNE` quebraria os gates de calibração do jogador.
 */
export const OVER_TIME_BONUS = 1.15;

/**
 * §327 (dono, 13/11/2026): o ESCUDO é defesa contra golpe, não imunidade. Fração de cada fonte de dano que o escudo do alvo
 * pode absorver (o resto passa para a vida):
 *  · `basic` = 1: o golpe básico segue absorvido por inteiro (a regra de antes, mantida);
 *  · `direct` = `SHIELD_DIRECT_SPECIAL_ABSORB`: o especial de dano direto passa metade pela barreira;
 *  · `tick` = `SHIELD_DOT_TICK_ABSORB`: cada tick de dano contínuo (DoT, queimadura, veneno) passa METADE pela barreira, lançado
 *    antes ou depois do escudo (decisão do dono 13/11/2026: "não imunidade, mas alguma proteção"; revoga o "tick nunca é absorvido").
 * Debuffs (quebra de defesa, lentidão, silêncio, maldição) nunca passaram pelo escudo e seguem assim.
 * Espelho: `functions/api/_combate.js`.
 */
export const SHIELD_DIRECT_SPECIAL_ABSORB = 0.5;
export const SHIELD_DOT_TICK_ABSORB = 0.5;
export const SHIELD_ABSORB = { basic: 1, direct: SHIELD_DIRECT_SPECIAL_ABSORB, tick: SHIELD_DOT_TICK_ABSORB } as const;
export type ShieldSource = keyof typeof SHIELD_ABSORB;
/** Pontos que o escudo `sh` absorve de um golpe de `d` pontos vindo de `src`. A fração arredonda PARA BAIXO: o escudo nunca come mais que ela. */
export function shieldAbsorbPoints(sh: number, d: number, src: ShieldSource): number {
  return sh > 0 ? Math.min(sh, Math.floor(d * SHIELD_ABSORB[src] + 1e-9)) : 0;
}

/** Budget of every special, in hits. */
export const SPECIAL_BUDGET_HITS = 3;

/** Lasting buff/debuff families act on the next E·p own attacks (not on a timer). */
export const SPECIAL_FAMILIES = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'] as const;
export type SpecialFamily = (typeof SPECIAL_FAMILIES)[number];

/** The family every other one is measured against. */
export const REFERENCE_FAMILY: SpecialFamily = 'direct';

/** Families that get the rookie tolerance (−15%) in the ruler. */
export const BUFF_FAMILIES: readonly SpecialFamily[] = ['atkBuff', 'defDebuff', 'spdBuff'];

/**
 * Calibrated power per family (spike-sistema.md, held in the Pass 1 holdout) — o do 1v1 (PvP, simulados, treino).
 * §325 (dono, 13/11/2026): `dot` 1 → 1,15 e `spdBuff` 1,82 → 2 (o que dura rende mais que o dano direto). Espelho: `_combate.js`.
 * §334 (dono, 13/11/2026: lançar o especial também é turno do afetado): o DoT termina mais cedo e a régua pareada do 1v1
 * (gate 5, ±5%) foi a +5,3% com 1,15 (antes: +3,7%). `dot` 1,15 → 1,14 (+4,8%; 1,13 → +4,5%; 1,12 → +4,2%): o maior que passa.
 * O total segue acima do direto (`efeitosRegraTotal`: pvp|dot 1,14).
 * O PvE NÃO lê esta tabela: usa `SPECIAL_POWER_PVE` (o vetor `PVE_FAMILY_POWER` foi calibrado sobre ela).
 */
export const SPECIAL_POWER: Readonly<Record<SpecialFamily, number>> = {
  direct: 1,
  dot: 1.14,
  heal: 1,
  shield: 1,
  atkBuff: 1.01,
  defDebuff: 1.01,
  spdBuff: 2,
};

/**
 * §325: o poder de família do PvE (Arena, Masmorra, Pesadelo, inimigos) = a tabela do spike de antes do ajuste do 1v1. Separada para a
 * mudança de `SPECIAL_POWER` (pedida para o PvP) não se multiplicar com `PVE_FAMILY_POWER`, que foi calibrado em cima destes números.
 */
export const SPECIAL_POWER_PVE: Readonly<Record<SpecialFamily, number>> = {
  direct: 1, dot: 1, heal: 1, shield: 1, atkBuff: 1.01, defDebuff: 1.01, spdBuff: 1.82,
};

/** §228: regra nova do núcleo de grupo (só PvE; `fight.ts` ignora). Ausente = a família pura, byte a byte. */
export type SpecialEffect = 'hot' | 'slow' | 'silence';

export interface Special {
  readonly family: SpecialFamily;
  readonly power: number;
  readonly effect?: SpecialEffect;
  /** §228: botões próprios do Pesadelo; ausente = os de `EFFECT_TUNE`. */
  readonly tune?: EffectTune;
}

/**
 * §228: os botões das mecânicas novas. Só o gate `efeitosPve.medicao.test.ts` autoriza mudar.
 * - `silenceHits`: golpes do alvo sem poder soltar o especial, qualquer que seja ele. `silenceKeep`: fração do orçamento que segue como `defDebuff`.
 * - `slowScale`: multiplica os golpes de lentidão. `slowKeep`: fração do orçamento que segue como `defDebuff`.
 * - `hotScale`: multiplica o total curado pelos 3 pulsos.
 */
export const EFFECT_TUNE = { silenceHits: 2, silenceKeep: 1, slowScale: 0.3, slowKeep: 0.58, hotScale: 1.05 };
export type EffectTune = typeof EFFECT_TUNE;
/** §228 (dono, 05/11): o Pesadelo pode ter balanço próprio para qualquer mecânica. */
/**
 * §325 (dono, 13/11/2026): lentidão do Pesadelo 0,15/0,4 → 0,3/0,58 (a mesma da Arena e da Masmorra). O dono ACEITOU que o Pesadelo fique
 * ~16,4pp mais fácil para quem tem lentidão (gate pareado em `efeitosPve.medicao.test.ts`). Os outros botões seguem os de `EFFECT_TUNE`.
 */
export const EFFECT_TUNE_PESADELO: EffectTune = { ...EFFECT_TUNE, slowScale: 0.3, slowKeep: 0.58 };

/**
 * §334 (dono, 13/11/2026: DoT e cura contínua tocam no turno DE QUEM OS CARREGA). Com os pulsos da cura contínua no começo dos
 * 3 próximos golpes de quem a recebe (antes: 1, 2 e 3 intervalos depois do cast), a cura chega ~meio intervalo mais cedo e a
 * Masmorra passou a +4,1pp sobre o escudo puro (gate ±3pp de `efeitosPve.medicao.test.ts`). Só a Masmorra (e quem joga no motor
 * dela: Fenda, Raid) baixa o `hotScale` 1,05 → `HOT_SCALE_MASMORRA`. A Arena não pode baixar: a regra "o que dura rende mais"
 * (`efeitosRegraTotal.test.ts`) pede `arena|hot` > 1, e ela só passa com `hotScale` ≥ ~1,044. Os outros botões seguem `EFFECT_TUNE`.
 */
export const HOT_SCALE_MASMORRA = 1.02;
/** A tune da cura contínua na Masmorra: a de `EFFECT_TUNE` (lida na hora, os testes de régua a mexem) com `HOT_SCALE_MASMORRA`. */
export function effectTuneMasmorra(): EffectTune {
  return { ...EFFECT_TUNE, hotScale: HOT_SCALE_MASMORRA };
}

export function specialOf(family: SpecialFamily): Special {
  return { family, power: SPECIAL_POWER[family] };
}
/** §325: o especial com o poder do PvE (`SPECIAL_POWER_PVE`). Quem monta luta de Arena/Masmorra/Pesadelo/inimigo usa este. */
export function specialOfPve(family: SpecialFamily): Special {
  return { family, power: SPECIAL_POWER_PVE[family] };
}

/**
 * Energy: 60 per fraction of the foe's HP dealt, 60 per fraction of own HP
 * received, +2 per second; the special fires at 100 (and spends 100).
 */
export interface EnergyRates {
  readonly perDealt: number;
  readonly perReceived: number;
  readonly perSecond: number;
}
export const ENERGY: EnergyRates = { perDealt: 60, perReceived: 60, perSecond: 2 };
export const ENERGY_TRIGGER = 100;

/**
 * Families that aim at the ENEMY (PR3a, §2.15 P2): only these respond to the
 * area. Heal, shield and the self buffs are personal; area does not touch them.
 */
export const AREA_FAMILIES: readonly SpecialFamily[] = ['direct', 'dot', 'defDebuff'];

/**
 * Efficiency of the area (PR3a). 1 = same TOTAL budget as the single target
 * (owner: "mesmo orçamento total"). The combat core does NOT use the
 * class-system's EFICIENCIA_AREA = 0.9: with 0.9 the area direct loses 6-17pp.
 */
export const AREA_EFFICIENCY = 1;

/**
 * §334: eficiência da área SÓ do DoT, e só quando a área pega 2+ inimigos (com 1 só, área = único: os gates N = 1 ≡ 1v1 e
 * "área no 1v1 = único" exigem). Com o DoT ticando no turno de quem o carrega (3 golpes dele; antes, 0,75 intervalo do
 * lançador), o que sobra num inimigo que cai antes dos 3 golpes se perde na área (só o alvo único repassa ao próximo vivo), e a
 * área caiu de −1,2pp para −12,0pp de vitória contra o único (gate AC7/AC4, ±6pp). `areaDelta('dot', 3200)`: 1,20 → −5,0pp;
 * 1,25 → −3,2pp (tempo +0,5%); 1,30 → −2,6pp. O orçamento do alvo único não muda. Alternativa sem constante (fica com o dono):
 * o DoT em área também repassar o que sobra ao próximo vivo (−3,0pp), contra a regra "só quem estava no raio".
 */
export const AREA_DOT_EFFICIENCY = 1.25;

export type PveEngine = 'arena' | 'dungeon' | 'pesadelo';

/**
 * Per-engine multiplier of SPECIAL_POWER, PvE only (outside the mirror ruler).
 * Values from builder/balanco-motores.md §3 (dungeon) and §6 (arena, groups).
 * §334 (dono, 13/11/2026: o veneno tem de vencer pelo menos tanto quanto o dano direto em cada modo PvE). O Pesadelo joga no
 * motor da Masmorra mas tem o vetor próprio (`pesadelo`, lido por `dungeonFight` com `pesadelo: true`), igual ao da Masmorra
 * menos o `dot`. Vitória dot − direct, pareado N = 1600 (`efeitosPve.medicao`), já com o tick também no especial:
 *  · Arena `dot` 1,1 → 1,11: +1,9pp → +3,1pp (a área estava −0,1pp; foi a +1,5pp; o único +4,8pp);
 *  · Masmorra `dot` 1,1 (sem mudança): +0,6pp;
 *  · Pesadelo `dot` 1,1 → 1,4: −5,4pp → +0,1pp (1,3 → −1,9pp; 1,5 → +1,8pp). Na cena do jogo (`simulateNightmareScenario`) o
 *    veneno já empatava: com torcida e anel +1,0pp → +6,2pp; sem nada +4,7pp → +20,1pp (10,3% → 30,3% de vitória).
 * O 1v1 (PvP) não lê esta tabela.
 */
export const PVE_FAMILY_POWER: Readonly<Record<PveEngine, Readonly<Record<SpecialFamily, number>>>> = {
  arena: { direct: 1, dot: 1.11, heal: 1.25, shield: 1.2, atkBuff: 1.35, defDebuff: 1.55, spdBuff: 1.25 },
  dungeon: { direct: 1, dot: 1.1, heal: 0.88, shield: 1, atkBuff: 1.3, defDebuff: 1.3, spdBuff: 1.5 },
  pesadelo: { direct: 1, dot: 1.4, heal: 0.88, shield: 1, atkBuff: 1.3, defDebuff: 1.3, spdBuff: 1.5 },
};

/**
 * Cheer: 24 accepted taps = 1 discharge, at most 16 taps accepted per bucket of 3 s.
 *
 * - `energyPerDischarge` is the yield of the ARENA (`groupFightSteps`); the Dungeon and the Nightmare have no cheer
 *   (contexto §2.19). PR4 raised it from 3 to 90 and the cheer alone won 95% of the runs; PR4b (owner's decision,
 *   §2.19) fixed it at the BIGGEST value where, with the same skill, the run win rate with the cheer at the ceiling
 *   minus without cheering stays ≤ 25pp and the TTK stays within ±25% (`arena.v3.test.ts`, AC5/AC6).
 * - `pvpEnergyPerDischarge` is the PvP yield (`fight()`, the 1v1 of the duel). PR5 (contexto §2.19) calibrated it for the
 *   BUCKET cheer (the discharge of a 3 s bucket lands at the END of the bucket, `functions/api/_duel.js`): 2.5 gives ~65%
 *   against the ghost at the tap ceiling (3 gave 68.4%; §2.13 asks ~65%) and the TTK of whoever cheers moves < 2%.
 *   It is NOT the PvE one (`energyPerDischarge`): the two are separate on purpose.
 */
export const CHEER = {
  tapsFull: 24, tapsCapPerBucket: 16, bucketSeconds: 3, energyPerDischarge: 9, pvpEnergyPerDischarge: 2.5,
} as const;

/**
 * PR7b (§2.25): the most a talent may scale the PvP cheer yield (1.15 = +15% of `pvpEnergyPerDischarge`). Mirrored in
 * `_combate.js`; `talents.ts` keeps its steps inside it and `duel.test.ts` measures it inside the 5% ruler.
 */
export const CHEER_SCALE_MAX = 1.15;

/**
 * Tarefa B (§2.38): two PvP opening talents that the core honours. They are CAPPED here (the core is the owner of what it
 * will accept) and mirrored in `_combate.js`: `tal-pvp-04` starts the fight with some special ENERGY (of 100), `tal-pvp-06`
 * cuts the DoT damage a side RECEIVES. Neither touches the special itself (owner: talents do not modify the special).
 */
export const START_ENERGY_MAX = 9;
export const DOT_RESIST_MAX = 0.18;
export function cleanStartEnergy(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(START_ENERGY_MAX, Math.max(0, x)) : 0;
}
/** `tal-pve-07`: the most HP (as a fraction) a talent may hand a PvE fighter as an opening shield. */
export const START_SHIELD_MAX = 0.01;
export function cleanStartShield(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(START_SHIELD_MAX, Math.max(0, x)) : 0;
}
export function cleanDotResist(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(DOT_RESIST_MAX, Math.max(0, x)) : 0;
}

/** Dirty scale (NaN, < 1, > max) never lowers or explodes the yield. */
export function cleanCheerScale(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(CHEER_SCALE_MAX, Math.max(1, x)) : 1;
}

/**
 * Turns tap timestamps (seconds) into discharge events for `FightOptions.cheer`.
 * Taps beyond the per-bucket cap are dropped; every `tapsFull` accepted taps fire a discharge.
 */
export function cheerEvents(taps: readonly number[], side: 0 | 1, scale = 1): { t: number; side: 0 | 1; scale?: number }[] {
  const out: { t: number; side: 0 | 1; scale?: number }[] = [];
  const k = cleanCheerScale(scale);
  const perBucket = new Map<number, number>();
  let acc = 0;
  for (const tap of [...taps].filter((x) => Number.isFinite(x) && x >= 0).sort((x, y) => x - y)) {
    const b = Math.floor(tap / CHEER.bucketSeconds);
    const n = perBucket.get(b) ?? 0;
    if (n >= CHEER.tapsCapPerBucket) continue;
    perBucket.set(b, n + 1);
    acc++;
    if (acc % CHEER.tapsFull === 0) out.push(k === 1 ? { t: tap, side } : { t: tap, side, scale: k });
  }
  return out;
}

/**
 * Skill tables of the v3 engine (contexto §2.15 P4: win gap between "does not act" and
 * "plays well" capped at 25pp). They live HERE, not in `utils/energia.ts`, on purpose:
 * `energia.ts` still feeds the LIVE Arena/Pesadelo/Masmorra, calibrated on 0.75/1.35 and
 * 0.5/0.85 (its simulation tests fail with the new values). PR3b swaps the engine and then
 * moves `RING_MULT`/`DODGE_REDUCE` of `energia.ts` to these numbers (a test pins them).
 */
export const RING_MULT_V3 = { ruim: 0.92, bom: 1, otimo: 1.08 } as const;
export const DODGE_REDUCE_V3 = { nada: 0, bom: 0.2, otimo: 0.35 } as const;
