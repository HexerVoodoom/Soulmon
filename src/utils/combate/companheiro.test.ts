/**
 * COMPANHEIRO INVOCADO no motor (PR 2): regra, determinismo, 3 turnos, 1 por combatente, `invoca` ausente = igual a hoje e a
 * PROVA de calibração por simulação (vitória da versão invocada contra a normal, mesmas sementes; teto ~110% do dono).
 */
import { describe, expect, it } from 'vitest';
import {
  COMPANHEIRO_ATAQUE_FATOR, COMPANHEIRO_EFEITO_FATOR, COMPANHEIRO_TURNOS, COMPANHEIRO_VALOR_MAXIMO,
  especialInvoca, planoInvocacao, valorNominalInvocacao,
} from './companheiro';
import { DOT_TICKS, fight, fightSteps, type FightFxPair, type FightSide } from './fight';
import { groupFightSteps, type GroupEvent } from './group';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { SPECIAL_FAMILIES, specialOf, specialOfPve, type SpecialFamily } from './specials';

const lado = (L: number, fam: SpecialFamily, build: keyof typeof REFERENCE_BUILDS = 'balanced', invoca?: boolean): FightSide => (
  { combatant: combatantAt(L, REFERENCE_BUILDS[build]), special: specialOf(fam), ...(invoca === undefined ? {} : { invoca }) }
);
const alvo = (L: number): FightSide => ({ combatant: combatantAt(L, REFERENCE_BUILDS.balanced), special: specialOf('direct') });

function jogar(a: FightSide, b: FightSide, seed: number, extra: object = {}) {
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { seed, hpScale: 1.7, fxTrace: fx, ...extra });
  const events = [];
  let r = g.next();
  while (!r.done) { events.push(r.value); r = g.next(1); }
  return { events, fx, result: r.value };
}

describe('regra', () => {
  it('constantes: 3 turnos = DOT_TICKS; fatores conservadores', () => {
    expect(COMPANHEIRO_TURNOS).toBe(DOT_TICKS);
    expect(COMPANHEIRO_EFEITO_FATOR).toBeLessThan(1);
    expect(COMPANHEIRO_EFEITO_FATOR).toBeGreaterThanOrEqual(0.7);
    expect(COMPANHEIRO_ATAQUE_FATOR).toBeLessThan(1);
  });
  it('cura (heal e shield com hot) NAO invoca; o resto invoca', () => {
    expect(especialInvoca({ family: 'heal' })).toBe(false);
    expect(especialInvoca({ family: 'shield', effect: 'hot' })).toBe(false);
    expect(planoInvocacao({ family: 'heal', power: 1 }, 1)).toBeNull();
    for (const f of SPECIAL_FAMILIES.filter((x) => x !== 'heal')) expect(especialInvoca({ family: f })).toBe(true);
  });
  it('especial de ataque: 3 ataques, sem efeito; misto: efeito menor + 2 ataques', () => {
    const d = planoInvocacao(specialOf('direct'), 1)!;
    expect(d).toMatchObject({ papel: 'ataque', escalaEfeito: 0, turnosAtaque: 3 });
    const b = planoInvocacao(specialOf('atkBuff'), 1)!;
    expect(b.papel).toBe('misto');
    expect(b.escalaEfeito).toBeCloseTo(COMPANHEIRO_EFEITO_FATOR);
    expect(b.turnosAtaque).toBe(2);
  });
  it('valor nominal da invocacao nunca passa do teto de ~110% (tabelas PvP e PvE)', () => {
    for (const tabela of [(f: SpecialFamily) => specialOf(f), (f: SpecialFamily) => specialOfPve(f)]) {
      for (const f of SPECIAL_FAMILIES) {
        for (const scale of [0.92, 1, 1.08]) {
          const v = valorNominalInvocacao(tabela(f), scale);
          if (f === 'heal') { expect(v).toBeNull(); continue; }
          expect(v!).toBeLessThanOrEqual(COMPANHEIRO_VALOR_MAXIMO);
          expect(v!).toBeGreaterThanOrEqual(0.85);
        }
      }
    }
  });
});

describe('motor 1v1 (fight)', () => {
  it('especial de ATAQUE: o companheiro ataca nos 3 turnos (contador 3, 2, 1) e nao faz mais nada', () => {
    const r = jogar(lado(10, 'direct', 'balanced', true), alvo(10), 7);
    const iCast = r.events.findIndex((e) => e.kind === 'cast' && e.side === 0);
    expect(iCast).toBeGreaterThan(-1);
    expect(r.fx[iCast][0].comp).toBe(3);
    const apos = r.fx.slice(iCast).map((p) => p[0].comp ?? 0);
    expect(apos.includes(2) && apos.includes(1)).toBe(true);
    expect(r.events.filter((e) => e.kind === 'tick' && e.side === 0).length).toBeGreaterThanOrEqual(1);
  });
  it('funcao MISTA: o efeito sai no turno 1 (contador 2 logo apos o cast) e os 2 turnos seguintes atacam', () => {
    const r = jogar(lado(10, 'atkBuff', 'balanced', true), alvo(10), 11);
    const iCast = r.events.findIndex((e) => e.kind === 'cast' && e.side === 0);
    expect(r.fx[iCast][0].comp).toBe(2);
    expect(r.fx[iCast][0].nAtk).toBeGreaterThan(0);
    const ticks = r.events.slice(iCast).filter((e) => e.kind === 'tick' && e.side === 0).length;
    expect(ticks).toBe(2);
  });
  it('CURA nao invoca: eventos identicos a invoca ausente e nenhum contador', () => {
    for (const s of [3, 9, 21]) {
      const a = jogar(lado(12, 'heal', 'balanced', true), alvo(12), s);
      const b = jogar(lado(12, 'heal'), alvo(12), s);
      expect(a.events).toEqual(b.events);
      expect(a.fx.every((p) => p[0].comp === undefined && p[1].comp === undefined)).toBe(true);
    }
  });
  it('invoca ausente/false = comportamento de hoje, byte a byte (eventos e rastro, sem comp)', () => {
    for (const fam of SPECIAL_FAMILIES) {
      for (const s of [1, 5, 99]) {
        const base = jogar(lado(15, fam), alvo(15), s);
        const off = jogar(lado(15, fam, 'balanced', false), alvo(15), s);
        expect(off).toEqual(base);
        expect(JSON.stringify(base.fx)).not.toContain('"comp"');
      }
    }
  });
  it('deterministico e 1 companheiro por combatente (contador nunca passa de 3 mesmo recarregando o especial)', () => {
    const cheer = Array.from({ length: 200 }, (_, i) => ({ t: 0.2 + i * 0.1, side: 0 as const }));
    const a = jogar(lado(20, 'defDebuff', 'balanced', true), alvo(20), 4, { cheer });
    const b = jogar(lado(20, 'defDebuff', 'balanced', true), alvo(20), 4, { cheer });
    expect(a).toEqual(b);
    expect(a.result.castsA).toBeGreaterThanOrEqual(2);
    expect(Math.max(...a.fx.map((p) => p[0].comp ?? 0))).toBeLessThanOrEqual(COMPANHEIRO_TURNOS);
  });
});

describe('motor de grupo (Arena, Masmorra, Pesadelo, Raid)', () => {
  const rodar = (invoca: boolean | undefined, fam: SpecialFamily, seed: number) => {
    const eventos: GroupEvent[] = [];
    const g = groupFightSteps(
      { combatant: combatantAt(18, REFERENCE_BUILDS.balanced), special: specialOfPve(fam), area: 'single', ...(invoca === undefined ? {} : { invoca }) },
      [alvo(18), alvo(18)], { seed, withFx: true, fairStart: true },
    );
    let r = g.next();
    while (!r.done) { eventos.push(r.value); r = g.next(1); }
    return eventos;
  };
  it('invoca ausente = igual a hoje; com invoca o contador aparece em fx[0].comp; cura nao invoca', () => {
    for (const fam of ['direct', 'atkBuff', 'shield', 'heal'] as const) {
      const base = rodar(undefined, fam, 31);
      expect(rodar(false, fam, 31)).toEqual(base);
      expect(JSON.stringify(base)).not.toContain('"comp"');
    }
    const com = rodar(true, 'atkBuff', 31);
    expect(Math.max(...com.map((e) => e.fx?.[0].comp ?? 0))).toBe(2);
    expect(rodar(true, 'heal', 31)).toEqual(rodar(false, 'heal', 31));
  });
});

describe('CALIBRACAO: a vantagem total fica perto do especial normal e nunca acima do teto', () => {
  const NS = 100;
  it('1v1: vitoria invocada - normal por familia e nivel (mesmas sementes)', () => {
    for (const fam of SPECIAL_FAMILIES) {
      for (const L of [5, 20, 40]) {
        let n = 0, vn = 0, vi = 0, tn = 0, ti = 0;
        for (const build of ['atk', 'balanced', 'spd'] as const) {
          for (let s = 0; s < NS; s++) {
            const seed = s * 31 + 7;
            const a = fight(lado(L, fam, build), alvo(L), { seed, hpScale: 1.7 });
            const b = fight(lado(L, fam, build, true), alvo(L), { seed, hpScale: 1.7 });
            n++; if (a.winner === 'A') vn++; if (b.winner === 'A') vi++;
            tn += a.timeB; ti += b.timeB;
          }
        }
        const delta = (vi - vn) / n;
        expect(delta, `${fam} L${L}`).toBeLessThanOrEqual(0.06);
        expect(delta, `${fam} L${L}`).toBeGreaterThanOrEqual(-0.08);
        expect(ti / tn, `${fam} L${L}`).toBeGreaterThanOrEqual(0.93);
      }
    }
  });
});
