/**
 * §327 (dono, 13/11/2026). Duas regras novas do núcleo:
 *  1. ESCUDO não é imunidade: absorve só METADE de cada tick de DoT (`SHIELD_DOT_TICK_ABSORB`, lançado antes OU depois dele;
 *     decisão do dono 13/11/2026, revoga o "tick nunca é absorvido"), não bloqueia debuff, e absorve só METADE do especial de
 *     dano direto (`SHIELD_DIRECT_SPECIAL_ABSORB`). O golpe básico segue absorvido inteiro (regra de antes).
 *  2. ALVO ALIADO: escudo, cura e reforços podem ir num aliado mirado; sem aliado, vão em quem soltou (`alvoAliado.ts`).
 * Cliente e servidor (`functions/api/_combate.js`) iguais.
 */
import { describe, expect, it } from 'vitest';
import { fightSteps, hpPoints, type FightEvent, type FightFxPair, type FightSide } from './fight';
import { groupFightSteps, type GroupEvent } from './group';
import { combatantAt, REFERENCE_BUILDS } from './level';
import {
  SHIELD_ABSORB, SHIELD_DIRECT_SPECIAL_ABSORB, SHIELD_DOT_TICK_ABSORB, shieldAbsorbPoints, specialOf, type Special, type SpecialFamily,
} from './specials';
import {
  ALLY_TARGET_FAMILIES, MIRA_VAZIA, aceitaAliado, aplicarEspecialPessoal, receptorPessoal, tocarAliado, tocarInimigo, type ReceptorPessoal,
} from './alvoAliado';
import * as srv from '../../../functions/api/_combate.js';

const C = combatantAt(20, REFERENCE_BUILDS.balanced);
const PTS = hpPoints(C.hp * 30);
const lado = (sp: Special | null, extra: Partial<FightSide> = {}): FightSide => ({ combatant: C, special: sp, ...extra });

/** Todos os eventos de um 1v1, com o `fx` real de cada um (o do cast = depois de ele agir). */
function duelo(a: FightSide, b: FightSide, startEnergy: [number, number], seed: number): { evs: FightEvent[]; fx: FightFxPair[] } {
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { seed, variance: null, hpScale: 30, startEnergy, fxTrace: fx });
  const evs: FightEvent[] = [];
  for (let r = g.next(); !r.done && evs.length < 4000; r = g.next(1)) evs.push(r.value);
  return { evs, fx };
}

function grupo(p: FightSide, foes: FightSide[], seed: number, startEnergy = 100): GroupEvent[] {
  const g = groupFightSteps(p, foes, { seed, variance: null, hpScale: 30, startEnergy, withFx: true });
  const evs: GroupEvent[] = [];
  for (let r = g.next(); !r.done && evs.length < 4000; r = g.next(1)) evs.push(r.value);
  return evs;
}

describe('§327 escudo: a régua da absorção', () => {
  it('básico inteiro, especial direto e tick de DoT pela METADE (arredondam para baixo); nunca mais que o escudo', () => {
    expect(SHIELD_DIRECT_SPECIAL_ABSORB).toBe(0.5);
    expect(SHIELD_DOT_TICK_ABSORB).toBe(0.5);
    expect(SHIELD_ABSORB).toEqual({ basic: 1, direct: 0.5, tick: 0.5 });
    expect(shieldAbsorbPoints(100, 40, 'basic')).toBe(40);
    expect(shieldAbsorbPoints(100, 41, 'direct')).toBe(20);
    expect(shieldAbsorbPoints(100, 40, 'tick')).toBe(20);
    expect(shieldAbsorbPoints(100, 41, 'tick')).toBe(20);
    expect(shieldAbsorbPoints(100, 1, 'tick')).toBe(0);
    expect(shieldAbsorbPoints(7, 40, 'direct')).toBe(7);
    expect(shieldAbsorbPoints(0, 40, 'basic')).toBe(0);
  });

  it('servidor espelha a régua', () => {
    expect(srv.SHIELD_DIRECT_SPECIAL_ABSORB).toBe(SHIELD_DIRECT_SPECIAL_ABSORB);
    expect(srv.SHIELD_DOT_TICK_ABSORB).toBe(SHIELD_DOT_TICK_ABSORB);
    expect(srv.SHIELD_ABSORB).toEqual(SHIELD_ABSORB);
    for (const [sh, d] of [[100, 41], [3, 9], [0, 5], [50, 1]]) {
      for (const s of ['basic', 'direct', 'tick'] as const) expect(srv.shieldAbsorbPoints(sh, d, s)).toBe(shieldAbsorbPoints(sh, d, s));
    }
  });
});

describe('§327 escudo absorve METADE de cada tick de DoT (arredonda para baixo) e o resto cai na vida', () => {
  it('1v1: B levanta o escudo DEPOIS do DoT de A; cada tick com escudo de sobra perde exatamente floor(50%) para o escudo', () => {
    let ticks = 0;
    for (let seed = 1; seed <= 30; seed++) {
      // A solta o DoT em t=0; B chega a 100 logo depois e levanta o escudo no meio dos ticks
      const { evs, fx } = duelo(lado(specialOf('dot')), lado(specialOf('shield')), [100, 99.5], seed);
      const castB = evs.findIndex((e) => e.kind === 'cast' && e.side === 1);
      expect(castB).toBeGreaterThan(0);
      evs.forEach((e, i) => {
        if (e.kind !== 'tick' || i < castB) return;
        const sh0 = fx[i - 1][1].shield, sh1 = fx[i][1].shield;
        if (sh0 <= 0 || sh1 <= 0) return; // só ticks com escudo de sobra medem a fração
        ticks++;
        const comido = Math.round((sh0 - sh1) * PTS), vida = Math.round(e.frac * PTS);
        expect(vida, `seed ${seed}: o resto do tick cai na vida`).toBeGreaterThan(0);
        expect(comido, `seed ${seed}`).toBe(Math.floor((comido + vida) * SHIELD_DOT_TICK_ABSORB));
        expect(vida, `seed ${seed}: o escudo nunca come mais que a metade`).toBeGreaterThanOrEqual(comido);
      });
    }
    expect(ticks).toBeGreaterThan(20);
  });

  it('grupo: com escudo já levantado (inclusive o de largada) cada tick também perde metade para o escudo, nunca mais', () => {
    let ticks = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const evs = grupo(lado(specialOf('dot')), [lado(specialOf('shield'), { startShield: 0.01 }), lado(specialOf('shield'))], seed);
      evs.forEach((e, i) => {
        if (e.kind !== 'tick' || e.who !== 0 || i === 0) return;
        const antes = evs[i - 1].fx!, agora = e.fx!;
        for (let f = 1; f < agora.length; f++) {
          if (antes[f].shield <= 0 || agora[f].shield <= 0) continue;
          const comido = Math.round((antes[f].shield - agora[f].shield) * PTS);
          const vida = Math.round((evs[i - 1].foesHp[f - 1] - e.foesHp[f - 1]) * PTS);
          if (comido + vida === 0) continue; // este tick não pegou neste inimigo
          expect(vida, `seed ${seed} inimigo ${f}`).toBeGreaterThan(0);
          expect(comido, `seed ${seed} inimigo ${f}`).toBe(Math.floor((comido + vida) * SHIELD_DOT_TICK_ABSORB));
          ticks++;
        }
      });
    }
    expect(ticks).toBeGreaterThan(10);
  });
});

describe('§327 escudo não bloqueia debuff', () => {
  it('1v1: quebra de defesa cai inteira em quem está de escudo', () => {
    for (let seed = 1; seed <= 20; seed++) {
      // B levanta o escudo em t=0; A solta a quebra de defesa logo depois
      const { evs, fx } = duelo(lado(specialOf('defDebuff')), lado(specialOf('shield')), [99.5, 100], seed);
      const castA = evs.findIndex((e) => e.kind === 'cast' && e.side === 0);
      const castB = evs.findIndex((e) => e.kind === 'cast' && e.side === 1);
      expect(castB).toBeLessThan(castA);
      expect(fx[castA - 1][1].shield).toBeGreaterThan(0);
      expect(fx[castA][1].nVuln).toBeCloseTo(fx[castA - 1][1].nVuln + 3 * specialOf('defDebuff').power, 9);
      expect(fx[castA][1].shield).toBeCloseTo(fx[castA - 1][1].shield, 12);
    }
  });

  it('grupo: lentidão e silêncio pegam em quem está de escudo', () => {
    for (const effect of ['slow', 'silence'] as const) {
      for (let seed = 1; seed <= 10; seed++) {
        const evs = grupo(lado({ ...specialOf('defDebuff'), effect }), [lado(specialOf('shield'), { startShield: 0.01 })], seed);
        const i = evs.findIndex((e) => e.kind === 'cast' && e.who === 0);
        const antes = i > 0 ? evs[i - 1].fx![1] : null;
        const depois = evs[i].fx![1];
        expect(antes === null || antes.shield > 0).toBe(true);
        expect(depois.shield).toBeGreaterThan(0);
        expect(effect === 'slow' ? depois.nSlow : depois.nSil, `${effect} seed ${seed}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('§327 escudo absorve METADE do especial direto (o básico segue inteiro)', () => {
  it('1v1: o golpe do especial direto passa pelo menos metade para a vida; o básico com escudo de sobra passa nada', () => {
    let diretos = 0, basicos = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { evs, fx } = duelo(lado(specialOf('direct')), lado(specialOf('shield')), [99.5, 100], seed);
      evs.forEach((e, i) => {
        if (e.kind !== 'attack' || e.side !== 0 || i < 2) return;
        // o golpe do especial sai logo depois do cast de A, e o `fx` do cast já é o DEPOIS dele: o "antes" é o evento anterior ao cast
        const especial = evs[i - 1].kind === 'cast' && evs[i - 1].side === 0;
        const sh0 = fx[especial ? i - 2 : i - 1][1].shield, sh1 = fx[i][1].shield;
        if (sh0 <= 0) return;
        const comido = Math.round((sh0 - sh1) * PTS), vida = Math.round(e.frac * PTS);
        if (especial) {
          diretos++;
          expect(sh1, `seed ${seed}: escudo de sobra para medir`).toBeGreaterThan(0);
          expect(comido, `seed ${seed}`).toBe(Math.floor((comido + vida) * SHIELD_DIRECT_SPECIAL_ABSORB));
          expect(vida, `seed ${seed}`).toBeGreaterThanOrEqual(comido);
          expect(vida).toBeGreaterThan(0);
        } else if (sh1 > 0) {
          basicos++;
          expect(e.frac, `seed ${seed}: básico com escudo de sobra`).toBe(0);
        }
      });
    }
    expect(diretos).toBeGreaterThan(20);
    expect(basicos).toBeGreaterThan(20);
  });
});

describe('§327 alvo aliado', () => {
  const mk = (): ReceptorPessoal => ({ pts: 600, hp: 0.5, shield: 0, nAtk: 0, nSpd: 0, next: 10 });

  it('as famílias pessoais aceitam aliado; as ofensivas não', () => {
    expect([...ALLY_TARGET_FAMILIES].sort()).toEqual(['atkBuff', 'heal', 'shield', 'spdBuff']);
    for (const f of ['direct', 'dot', 'defDebuff'] as SpecialFamily[]) expect(aceitaAliado(f)).toBe(false);
  });

  it('escudo, cura e reforços mirados num aliado caem no aliado (e não em quem soltou)', () => {
    for (const fam of ALLY_TARGET_FAMILIES) {
      const eu = mk(), aliados = [mk(), mk()];
      const quem = receptorPessoal(fam, aliados.map((a) => a.hp), 1);
      expect(quem).toBe(1);
      const rx = quem === null ? eu : aliados[quem];
      expect(aplicarEspecialPessoal(rx, specialOf(fam), 1, 6, 4, 2)).toBe(true);
      expect(eu).toEqual(mk());
      expect(aliados[0]).toEqual(mk());
      const a = aliados[1];
      if (fam === 'shield') expect(a.shield).toBeCloseTo(Math.round((3 / 6) * 600) / 600, 12);
      if (fam === 'heal') expect(a.hp).toBeCloseTo((300 + Math.round((3 / 6) * 600)) / 600, 12);
      if (fam === 'atkBuff') expect(a.nAtk).toBeCloseTo(3 * specialOf('atkBuff').power, 12);
      if (fam === 'spdBuff') { expect(a.nSpd).toBeCloseTo(3 * specialOf('spdBuff').power, 12); expect(a.next).toBe(5); }
    }
  });

  it('sem aliado mirado (ou o mirado caiu) o especial pessoal vai em quem soltou', () => {
    expect(receptorPessoal('shield', [1, 1], null)).toBeNull();
    expect(receptorPessoal('heal', [1, 0], 1)).toBeNull();
    expect(receptorPessoal('direct', [1, 1], 0)).toBeNull();
    // e no núcleo de grupo (que hoje não tem aliados): o escudo do jogador cai nele mesmo
    const evs = grupo(lado(specialOf('shield')), [lado(null)], 3);
    const i = evs.findIndex((e) => e.kind === 'cast' && e.who === 0);
    expect(evs[i].fx![0].shield).toBeGreaterThan(0);
    expect(evs[i].fx![1].shield).toBe(0);
  });

  it('uma mira por vez: tocar aliado apaga a do inimigo e vice-versa; ofensivo não liga aliado', () => {
    const foes = [1, 1, 1], allies = [1, 1];
    const m1 = tocarInimigo(MIRA_VAZIA, foes, 2);
    expect(m1).toEqual({ inimigo: 2, aliado: null });
    const m2 = tocarAliado(m1, allies, 0, 'shield');
    expect(m2).toEqual({ inimigo: null, aliado: 0 });
    expect(tocarAliado(m2, allies, 0, 'shield')).toEqual({ inimigo: null, aliado: null }); // de novo = desliga
    expect(tocarInimigo(m2, foes, 1)).toEqual({ inimigo: 1, aliado: null });
    expect(tocarInimigo(m2, [1], 0)).toEqual({ inimigo: null, aliado: null }); // 1 inimigo: só apaga a do aliado
    expect(tocarAliado(m1, allies, 0, 'direct')).toBe(m1);
    expect(tocarAliado(m1, [1, 0], 1, 'heal')).toBe(m1); // aliado caído
  });
});
