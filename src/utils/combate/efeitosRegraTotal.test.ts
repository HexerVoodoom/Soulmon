/**
 * REGRA DO DONO (13/11/2026, REGISTRO §325): o que DURA rende MAIS, no total, que o equivalente imediato.
 *  · DoT (total dos ticks) > dano direto do mesmo nível;
 *  · HoT (total dos pulsos) > cura imediata;
 *  · buff/debuff (velocidade, ataque, quebra de defesa, lentidão, silêncio), ao longo da duração > o especial de dano direto.
 *    Ex. do dono: o inimigo acelerado, nos golpes em que age mais rápido, tem de causar mais dano que o especial direto.
 *
 * Medição no motor REAL (`fight.ts` no 1v1, `group.ts` no PvE), sem variância e com HP gigante (ninguém cai): o lançador solta UM
 * especial e a luta é comparada com a MESMA semente sem especial. Impacto = HP a menos no alvo (em golpes básicos) + HP a mais no
 * lançador (em golpes do alvo), lido de 9 a 12 intervalos depois do lançamento (o horizonte varia por semente para não contar golpe
 * inteiro num corte fixo). Escala do lançamento = a da cena (`PVE_FAMILY_POWER` no jogador do PvE; 1 no PvP e no inimigo).
 *
 * `PENDENTES_DO_DONO`: exceções aprovadas pelo dono (hoje vazia: a regra vale para todos os efeitos). Qualquer violação falha aqui.
 */
import { describe, expect, it } from 'vitest';
import { fightSteps, hitUnit, windowSeconds, type FightSide } from './fight';
import { groupFightSteps } from './group';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { attacksPerWindow, hitsToKnockOut, type Combatant } from './curve';
import { EFFECT_TUNE_PESADELO, effectTuneMasmorra, PVE_FAMILY_POWER, SPECIAL_FAMILIES, specialOf, specialOfPve, type Special, type SpecialEffect, type SpecialFamily } from './specials';
import { foeKindOf, foeSpecialOf, type FoeKind } from './foeFamilies';

const LV = 30;
const HPS = 40;
const SEEDS = 60;
const C: Combatant = combatantAt(LV, REFERENCE_BUILDS.balanced);
const big = (c: Combatant) => ({ ...c, hp: c.hp * HPS });
const HIT = hitsToKnockOut(big(C), big(C)) / hitUnit(LV);
const IV = (windowSeconds(LV) / attacksPerWindow(C.spd)) * hitUnit(LV);
const horiz = (seed: number) => (9 + (3 * (seed % SEEDS)) / SEEDS) * IV;

type Hp = { caster: number; alvo: number; tCast: number };

function pvp(sp: Special | null, seed: number, startHp: number): Hp {
  const a: FightSide = { combatant: C, special: sp };
  const g = fightSteps(a, { combatant: C, special: null }, { seed, hpScale: HPS, variance: null, startEnergy: [sp ? 100 : 0, 0], startHp: [startHp, 1] });
  let last: readonly [number, number] = [startHp, 1];
  for (let r = g.next(); !r.done; r = g.next(r.value.kind === 'cast' ? 1 : undefined)) {
    if (r.value.t > horiz(seed)) break;
    last = r.value.hp;
  }
  return { caster: last[0], alvo: last[1], tCast: 0 };
}

function pve(sp: Special | null, seed: number, quem: 'player' | 'foe', scale: number, startHp: number, tCast = quem === 'player' ? 0 : NaN): Hp {
  const lancador: FightSide = { combatant: C, special: sp };
  const outro: FightSide = { combatant: C, special: null };
  const g = groupFightSteps(quem === 'player' ? lancador : outro, [quem === 'player' ? outro : lancador], {
    seed, hpScale: HPS, variance: null, startEnergy: quem === 'player' && sp ? 100 : 0,
    startHp: quem === 'player' ? startHp : 1, startFoesHp: [quem === 'foe' ? startHp : 1],
  });
  let tc = tCast, ph = quem === 'player' ? startHp : 1, fh = quem === 'foe' ? startHp : 1;
  for (let r = g.next(); !r.done; r = g.next(r.value.kind === 'cast' ? scale : undefined)) {
    const e = r.value;
    if (e.kind === 'cast' && Number.isNaN(tc)) tc = e.t;
    if (!Number.isNaN(tc) && e.t > tc + horiz(seed)) break;
    ph = e.hp; fh = e.foesHp[0];
  }
  return quem === 'player' ? { caster: ph, alvo: fh, tCast: tc } : { caster: fh, alvo: ph, tCast: tc };
}

type Ctx = 'pvp' | 'pve-player' | 'pve-foe';
/** Impacto médio do especial, em golpes básicos (o dano direto de escala 1 vale 3). */
function impacto(ctx: Ctx, sp: Special, scale = 1): number {
  let s = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const startHp = 0.5; // espaço para a cura não bater no teto
    const com = ctx === 'pvp' ? pvp(sp, seed, startHp) : pve(sp, seed, ctx === 'pve-player' ? 'player' : 'foe', scale, startHp);
    const sem = ctx === 'pvp' ? pvp(null, seed, startHp) : pve(null, seed, ctx === 'pve-player' ? 'player' : 'foe', scale, startHp, com.tCast);
    s += ((sem.alvo - com.alvo) + (com.caster - sem.caster)) * HIT;
  }
  return s / SEEDS;
}

/** Os efeitos de regra nova do núcleo de grupo. Um efeito novo em `SpecialEffect` sem entrar aqui não compila. */
const EFEITOS = ['hot', 'slow', 'silence'] as const satisfies readonly SpecialEffect[];
type Faltando = Exclude<SpecialEffect, (typeof EFEITOS)[number]>;
const _todosOsEfeitos: Faltando extends never ? true : never = true;
void _todosOsEfeitos;

/** Família imediata de referência de cada família/efeito que dura. `null` = fora da regra (a própria cura/escudo imediatos). */
const BASE: Readonly<Record<SpecialFamily, 'direct' | null>> = {
  direct: null, heal: null, shield: null, dot: 'direct', atkBuff: 'direct', defDebuff: 'direct', spdBuff: 'direct',
};
const BASE_EFEITO: Readonly<Record<(typeof EFEITOS)[number], { family: SpecialFamily; base: 'direct' | 'heal' }>> = {
  hot: { family: 'shield', base: 'heal' }, slow: { family: 'defDebuff', base: 'direct' }, silence: { family: 'defDebuff', base: 'direct' },
};

interface Linha { readonly id: string; readonly razao: number }
function medirTudo(): Linha[] {
  const out: Linha[] = [];
  const add = (id: string, x: number, ref: number) => out.push({ id, razao: x / ref });
  // 1v1 (PvP do jogador e simulados): a família pura de `SPECIAL_POWER`.
  const refPvp = impacto('pvp', specialOf('direct'));
  for (const f of SPECIAL_FAMILIES) if (BASE[f]) add(`pvp|${f}`, impacto('pvp', specialOf(f)), refPvp);
  // PvE do jogador: Arena e Masmorra, com a escala do motor; o Pesadelo usa as regras da Masmorra e a tune própria.
  for (const motor of ['arena', 'dungeon'] as const) {
    const P = PVE_FAMILY_POWER[motor];
    const ref = { direct: impacto('pve-player', specialOfPve('direct'), P.direct), heal: impacto('pve-player', specialOfPve('heal'), P.heal) };
    for (const f of SPECIAL_FAMILIES) if (BASE[f]) add(`${motor}|${f}`, impacto('pve-player', specialOfPve(f), P[f]), ref.direct);
    for (const e of EFEITOS) {
      const { family, base } = BASE_EFEITO[e];
      // §334: a cura contínua da Masmorra tem `hotScale` próprio (`effectTuneMasmorra`): mede-se o que o jogo usa
      const tune = motor === 'dungeon' && e === 'hot' ? { tune: effectTuneMasmorra() } : {};
      add(`${motor}|${e}`, impacto('pve-player', { ...specialOfPve(family), effect: e, ...tune }, P[family]), ref[base]);
      if (motor === 'dungeon') add(`pesadelo|${e}`, impacto('pve-player', { ...specialOfPve(family), effect: e, tune: EFFECT_TUNE_PESADELO }, P[family]), ref[base]);
    }
  }
  // §334: o Pesadelo tem o vetor próprio (`PVE_FAMILY_POWER.pesadelo`, só o `dot` difere do da Masmorra)
  const PP = PVE_FAMILY_POWER.pesadelo;
  add('pesadelo|dot', impacto('pve-player', specialOfPve('dot'), PP.dot), impacto('pve-player', specialOfPve('direct'), PP.direct));
  // PvE dos inimigos: o especial sorteado de `foeSpecialOf` (Arena/Rift), escala 1 (sem esquiva).
  const achar = (k: FoeKind, fam?: SpecialFamily) => {
    for (let i = 0; i < 99999; i++) {
      const key = `k${i}`;
      if (foeKindOf('champion', key) === k && (!fam || foeSpecialOf('champion', key).family === fam)) return foeSpecialOf('champion', key);
    }
    throw new Error(k);
  };
  const refFoe = { direct: impacto('pve-foe', achar('direct')), heal: impacto('pve-foe', achar('heal')) };
  add('inimigo|dot', impacto('pve-foe', achar('dot')), refFoe.direct);
  add('inimigo|hot', impacto('pve-foe', achar('hot')), refFoe.heal);
  add('inimigo|atkBuff', impacto('pve-foe', achar('buff', 'atkBuff')), refFoe.direct);
  add('inimigo|spdBuff', impacto('pve-foe', achar('buff', 'spdBuff')), refFoe.direct);
  add('inimigo|defDebuff', impacto('pve-foe', achar('debuff')), refFoe.direct);
  return out;
}

/**
 * Exceções aprovadas pelo dono: NENHUMA. As quatro propostas de 13/11/2026 (pvp|dot, pvp|spdBuff, arena|dot, pesadelo|slow) foram aprovadas e
 * aplicadas (§325). NÃO acrescentar nada aqui sem decisão do dono.
 */
const PENDENTES_DO_DONO: Readonly<Record<string, string>> = {};

describe('regra do dono: o que dura rende mais que o imediato (§325)', () => {
  const linhas = medirTudo();

  it('mede todas as famílias e efeitos que duram (nada fica de fora)', () => {
    // 1v1: 4 famílias · Arena: 4 + 3 efeitos · Masmorra: 4 + 3 · Pesadelo: 3 efeitos + o veneno (§334) · inimigos: 5
    expect(linhas.length).toBe(4 + 7 + 7 + 4 + 5);
  });

  it('o dano direto de referência vale 3 golpes (a medição está calibrada)', () => {
    expect(impacto('pvp', specialOf('direct'))).toBeCloseTo(3, 2);
    expect(impacto('pve-player', specialOfPve('direct'))).toBeCloseTo(3, 2);
  });

  it('todo efeito que dura rende MAIS que o imediato (exceto as pendentes listadas)', () => {
    console.log(`[regra-total] ${linhas.map((l) => `${l.id} ${l.razao.toFixed(3)}`).join(' · ')}`);
    const viola = linhas.filter((l) => !(l.id in PENDENTES_DO_DONO) && l.razao <= 1.001).map((l) => `${l.id}: ${l.razao.toFixed(3)}`);
    expect(viola).toEqual([]);
  });

  it('as pendentes ainda violam (se uma passou a cumprir, tire-a da lista)', () => {
    const resolvidas = linhas.filter((l) => l.id in PENDENTES_DO_DONO && l.razao > 1.001).map((l) => l.id);
    expect(resolvidas).toEqual([]);
  });

  it('o exemplo do dono: o inimigo acelerado causa mais dano que o especial direto', () => {
    const spd = linhas.find((l) => l.id === 'inimigo|spdBuff')!;
    expect(spd.razao).toBeGreaterThan(1.03);
  });
});
