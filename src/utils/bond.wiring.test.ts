/**
 * A FIAÇÃO do Vínculo — e as invariantes anti-pressão que ela não pode quebrar.
 *
 * O módulo `bond.ts` já tinha curva, teto e escada, mas `applyBondXP` não tinha
 * chamador nenhum em produção: o nível só subia alimentando o pet
 * (`careRules.ts`, +10 por ponto de atributo). Ligar os eventos é o trabalho —
 * e ligar errado é como se reintroduz a cobrança diária que o desenho proíbe
 * (`squad-alpha-runs/soulmon-02/produto/level-de-conta.md` §5).
 *
 * Por isso os testes daqui não olham só "somou XP": eles travam que NADA do que
 * foi ligado cria pressão de calendário — sem decaimento, sem expiração, sem
 * streak, sem XP negativo, e com o gate de PvP cruzado uma vez para sempre.
 */
import { describe, it, expect } from 'vitest';
import {
  awardBondXP, BOND_PVP_MIN_LEVEL, meetsPvpBond, bondLevelFor, xpForLevel,
  BOND_DAILY_CAP, bondXP,
} from './bond';
import type { BondEvent } from './bond';

const base = { totalXP: 0 } as { totalXP: number; bondDaily?: { day: string; spent: Record<string, number> } };

const TODOS: BondEvent[] = [
  { kind: 'completion', weight: 1 },
  { kind: 'completion', weight: 3, habitTier: 'tree' },
  { kind: 'perfectDay' }, { kind: 'restNight' }, { kind: 'dreamNew' },
  { kind: 'nightmareCleared' }, { kind: 'dungeonFloor' }, { kind: 'dungeonRun' },
  { kind: 'tournamentMatch', won: true }, { kind: 'tournamentMatch', won: false },
  { kind: 'habitMilestone', days: 21 }, { kind: 'triageCleared' }, { kind: 'checkIn' },
];

describe('awardBondXP — o funil único de produção', () => {
  it('soma o XP do evento no totalXP', () => {
    const r = awardBondXP(base, { kind: 'checkIn' }, '2026-08-26');
    expect(r.totalXP).toBe(bondXP({ kind: 'checkIn' }));
  });

  it('preserva o resto do estado (é um funil, não um substituto do save)', () => {
    const r = awardBondXP({ ...base, perfectDays: 3 } as never, { kind: 'perfectDay' }, '2026-08-26') as {
      perfectDays: number;
    };
    expect(r.perfectDays).toBe(3);
  });

  it('respeita o teto diário SUAVE das fontes repetíveis: para de somar, nunca desce', () => {
    let s = base;
    for (let i = 0; i < 50; i++) s = awardBondXP(s, { kind: 'dungeonFloor' }, '2026-08-26');
    expect(s.totalXP).toBe(BOND_DAILY_CAP.dungeon);
    const depois = awardBondXP(s, { kind: 'dungeonFloor' }, '2026-08-26');
    expect(depois.totalXP).toBe(s.totalXP); // parou de somar
    expect(depois.totalXP).toBeGreaterThanOrEqual(s.totalXP); // e NUNCA desceu
  });

  it('a virada do dia zera SÓ o ledger do teto — nunca o totalXP', () => {
    let s = base;
    for (let i = 0; i < 50; i++) s = awardBondXP(s, { kind: 'dungeonFloor' }, '2026-08-26');
    const outroDia = awardBondXP(s, { kind: 'dungeonFloor' }, '2026-08-27');
    expect(outroDia.totalXP).toBe(BOND_DAILY_CAP.dungeon + bondXP({ kind: 'dungeonFloor' }));
  });

  it('teto do torneio é por fonte: masmorra cheia não barra o torneio', () => {
    let s = base;
    for (let i = 0; i < 50; i++) s = awardBondXP(s, { kind: 'dungeonFloor' }, 'd1');
    const t = awardBondXP(s, { kind: 'tournamentMatch', won: false }, 'd1');
    expect(t.totalXP).toBeGreaterThan(s.totalXP);
  });
});

describe('invariantes anti-pressão — se caírem, o desenho foi desfeito', () => {
  it('nenhum evento, em nenhuma ordem, faz o totalXP diminuir', () => {
    let s = base;
    for (let dia = 0; dia < 40; dia++) {
      for (const ev of TODOS) {
        const antes = s.totalXP;
        s = awardBondXP(s, ev, `dia-${dia}`);
        expect(s.totalXP).toBeGreaterThanOrEqual(antes);
      }
    }
  });

  it('derrota de torneio RENDE — falha não pune', () => {
    const r = awardBondXP(base, { kind: 'tournamentMatch', won: false }, 'd1');
    expect(r.totalXP).toBeGreaterThan(0);
  });

  it('SEM DECAIMENTO: ficar 365 dias fora não tira XP nem nível', () => {
    const s = { totalXP: xpForLevel(7), bondDaily: { day: 'd1', spent: { dungeon: 120 } } };
    const volta = awardBondXP(s, { kind: 'checkIn' }, 'd366');
    expect(volta.totalXP).toBeGreaterThan(s.totalXP);
    expect(bondLevelFor(volta.totalXP)).toBeGreaterThanOrEqual(bondLevelFor(s.totalXP));
  });

  it('SEM STREAK: o ledger não guarda nada além do dia corrente e das fontes com teto', () => {
    const r = awardBondXP(base, { kind: 'dungeonRun' }, 'd1');
    expect(Object.keys(r.bondDaily ?? {}).sort()).toEqual(['day', 'spent']);
    expect(Object.keys(r.bondDaily?.spent ?? {}).every(k => k === 'dungeon' || k === 'tournament')).toBe(true);
  });

  it('o nível nunca desce quando o XP sobe', () => {
    let anterior = 1;
    for (let xp = 0; xp < 20000; xp += 37) {
      const n = bondLevelFor(xp);
      expect(n).toBeGreaterThanOrEqual(anterior);
      anterior = n;
    }
  });
});

describe('gate de PvP — um limiar, cruzado uma vez, para sempre', () => {
  it('o nível mínimo é 5 (derivação em level-de-conta.md §6)', () => {
    expect(BOND_PVP_MIN_LEVEL).toBe(5);
  });

  it('abaixo de 700 XP não libera; a partir dele libera', () => {
    expect(xpForLevel(BOND_PVP_MIN_LEVEL)).toBe(700);
    expect(meetsPvpBond(699)).toBe(false);
    expect(meetsPvpBond(700)).toBe(true);
  });

  it('uma vez cruzado, NUNCA volta a fechar (não há manutenção)', () => {
    for (let xp = 700; xp < 30000; xp += 211) expect(meetsPvpBond(xp)).toBe(true);
  });

  it('save corrompido/NaN não libera por acidente', () => {
    expect(meetsPvpBond(NaN as unknown as number)).toBe(false);
    expect(meetsPvpBond(-1)).toBe(false);
  });
});
