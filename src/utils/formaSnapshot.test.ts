import { describe, it, expect } from 'vitest';
import { aoDescerDeForma, capturarForma, chaveDaForma, sanitizeFormaSnapshots, trocarFormaCompleta } from './formaSnapshot';
import { applyPotionOnEvolve } from './elementPotion';
import { applyLateralSwitch } from './trocaLateral';
import { equiparFormaAlt } from './formasAlternativas';
import { petElementOf } from './starterElements';
import { computeDailyReset, restWeekKeyFor } from './dailyReset';

const sk = (nome: string) => ({ basico: { nome }, especial: { nome: `${nome}-esp` } }) as any;
const jornada = (estagios: Record<string, { id: string; base: string }>) => ({ v: 1 as const, u: 0.5, estagios });

/** Champion de fogo (sem poção) que evolui para ultimate COM poção de água. */
function evoluidoComPocao(): any {
  const champion = {
    evolutionStage: 'champion-power',
    elementoJornada: jornada({ rookie: { id: 'fogo', base: 'fogo' }, champion: { id: 'fogo', base: 'fogo' } }),
    soulmonSkills: { champion: sk('golpe') } as any,
    evolutionPotion: 'agua',
  };
  const base = applyPotionOnEvolve(capturarForma(champion));
  return {
    ...base,
    evolutionStage: 'ultimate-power',
    elementoJornada: jornada({ ...champion.elementoJornada.estagios, ultimate: { id: 'fogo', base: 'fogo' } }),
    soulmonSkills: { ...champion.soulmonSkills, ultimate: sk('magia') },
  };
}

describe('queda volta ao elemento da forma em que cai', () => {
  it('degenerar manual: a poção da forma de cima some e o elemento volta ao do champion', () => {
    const ult = evoluidoComPocao();
    expect(petElementOf(ult)).toBe('agua');
    const caiu = aoDescerDeForma(ult, { ...ult, evolutionStage: 'champion-power' });
    expect(caiu.potionElement).toBeUndefined();
    expect(petElementOf(caiu)).toBe('fogo');
    expect(caiu.elementoJornada?.estagios.ultimate).toBeUndefined();
    // A forma de cima ficou fotografada, com a poção dela.
    expect(caiu.formaSnapshots?.['ultimate-power']?.pocao).toBe('agua');
  });

  it('a forma em que cai tinha poção: ela NÃO volta (degenerar descarta a poção; volta à base)', () => {
    const ult = { ...evoluidoComPocao(), formaSnapshots: { 'champion-power': { pocao: 'terra' } } };
    const caiu = aoDescerDeForma(ult, { ...ult, evolutionStage: 'champion-power' });
    expect(caiu.potionElement).toBeUndefined();
    expect(petElementOf(caiu)).toBe('fogo');
  });

  it('sem queda de nível = o mesmo objeto', () => {
    const ult = evoluidoComPocao();
    const next = { ...ult };
    expect(aoDescerDeForma(ult, next)).toBe(next);
  });

  it('virada do dia: a queda por HP também volta ao elemento da forma de baixo', () => {
    const TODO = [0, 1, 2, 3, 4, 5, 6];
    let s: any = {
      evolutionStage: 'mega-harmony', healthPoints: 1, maxHealthPoints: 4,
      energyPoints: 0, perfectDays: 0, totalXP: 0, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
      attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
      unlockedEvolutions: ['mega-harmony'], currentBranch: 'harmony', lastDayWasPerfect: false,
      degeneratedByHP: false, maxActivityCap: 7, foodInventory: {}, tasks: [],
      activities: Array.from({ length: 6 }, (_, i) => ({ id: `h${i}`, name: `h${i}`, category: 'estudo', kind: 'habit', effort: 1, steps: [], schedule: { kind: 'weekdays', days: TODO }, completedToday: false })),
      lastDayReport: { date: 'seed', saveDay: 90 }, restDaysLeft: 0, restWeekKey: restWeekKeyFor(new Date(2026, 8, 7)),
      potionElement: 'agua',
      elementoJornada: jornada({ rookie: { id: 'fogo', base: 'fogo' }, ultimate: { id: 'fogo', base: 'fogo' }, mega: { id: 'fogo', base: 'fogo' } }),
    };
    const inicio = new Date(2026, 8, 8, 4, 0, 0);
    for (let d = 0; d < 7 && s.evolutionStage === 'mega-harmony'; d++) {
      const agora = new Date(inicio); agora.setDate(agora.getDate() + d);
      s = computeDailyReset({ ...s, lastResetDate: new Date(agora.getTime() - 86400000).toDateString() }, { now: agora });
    }
    expect(s.evolutionStage).not.toBe('mega-harmony');
    expect(s.potionElement).toBeUndefined();
    expect(petElementOf(s)).toBe('fogo');
    expect(s.elementoJornada.estagios.mega).toBeUndefined();
    expect(s.formaSnapshots['mega-harmony'].pocao).toBe('agua');
  });
});

describe('equipar outra forma do mesmo estágio equipa tudo', () => {
  const base = {
    evolutionStage: 'champion-power',
    unlockedEvolutions: ['rookie', 'champion-power', 'champion-harmony'],
    potionElement: 'agua',
    elementoJornada: jornada({ champion: { id: 'agua', base: 'agua' } }),
    soulmonSkills: { champion: sk('golpe') } as any,
    formaSnapshots: { 'champion-harmony': { elemento: { id: 'planta', base: 'planta' }, skills: sk('magia') } },
  };

  it('troca lateral aplica elemento, ataque e especial da forma de destino', () => {
    const t = trocarFormaCompleta(base, s => applyLateralSwitch(s, 'champion-harmony'));
    expect(t.evolutionStage).toBe('champion-harmony');
    expect(t.potionElement).toBeUndefined();
    expect(petElementOf(t)).toBe('planta');
    expect(t.soulmonSkills.champion.basico.nome).toBe('magia');
    // E a de saída ficou guardada: voltar devolve tudo.
    const v = trocarFormaCompleta(t, s => applyLateralSwitch(s, 'champion-power'));
    expect(petElementOf(v)).toBe('agua');
    expect(v.soulmonSkills.champion.basico.nome).toBe('golpe');
  });

  it('forma alternativa equipada aplica o que ela carrega', () => {
    const s0: any = { ...base, formasAlt: { 'champion-power': ['agua', 'fogo'] }, formaAltEquipada: { 'champion-power': 'agua' },
      formaSnapshots: { [chaveDaForma('champion-power', { 'champion-power': 'fogo' })]: { pocao: 'fogo', skills: sk('chama') } } };
    const t = trocarFormaCompleta(s0, s => ({ ...s, formaAltEquipada: equiparFormaAlt(s.formasAlt, s.formaAltEquipada, 'champion-power', 'fogo') }));
    expect(petElementOf(t)).toBe('fogo');
    expect(t.soulmonSkills.champion.basico.nome).toBe('chama');
  });

  it('destino sem foto: troca de sempre, mas a poção da forma de saída NÃO o acompanha (fica fotografada na saída)', () => {
    const t = trocarFormaCompleta({ ...base, formaSnapshots: undefined }, s => applyLateralSwitch(s, 'champion-harmony'));
    expect(t.evolutionStage).toBe('champion-harmony');
    expect(t.potionElement).toBeUndefined();
    expect(Object.values(t.formaSnapshots ?? {}).some((f: any) => f.pocao === 'agua')).toBe(true);
  });

  it('troca recusada = o mesmo objeto', () => {
    expect(trocarFormaCompleta(base, s => applyLateralSwitch(s, 'mega-power'))).toBe(base);
  });
});

describe('save', () => {
  it('sanitiza lixo e mantém o válido', () => {
    expect(sanitizeFormaSnapshots(null)).toBeUndefined();
    expect(sanitizeFormaSnapshots({ 'champion-power@fogo': { pocao: 'fogo', elemento: { id: 'x', base: 'y' } }, 'BAD KEY': {} }))
      .toEqual({ 'champion-power@fogo': { pocao: 'fogo', elemento: { id: 'x', base: 'y' } } });
  });
});

describe('degenerar de uma forma de poção DESEQUIPA para a original', () => {
  it('equipado vira "original" e o elemento é o base do Soulmon', () => {
    const ult: any = {
      ...evoluidoComPocao(),
      soulmonMeta: { dominantElement: 'sombra' },
      formasAlt: { 'champion-power': ['sabbat', 'agua'], 'ultimate-power': ['sabbat', 'agua'] },
      formaAltEquipada: { 'champion-power': 'agua', 'ultimate-power': 'agua' },
      potionElement: 'agua',
    };
    const caiu = aoDescerDeForma(ult, { ...ult, evolutionStage: 'champion-power' });
    expect(caiu.formaAltEquipada?.['champion-power']).toBe('original');
    expect(caiu.potionElement).toBe('sombra');
    expect(petElementOf(caiu)).toBe('sombra');
  });
  it('queda de forma que NÃO era de poção não mexe no equipado', () => {
    const ult: any = {
      evolutionStage: 'ultimate-power', soulmonMeta: { dominantElement: 'sombra' },
      elementoJornada: jornada({ rookie: { id: 'fogo', base: 'fogo' }, champion: { id: 'fogo', base: 'fogo' }, ultimate: { id: 'fogo', base: 'fogo' } }),
      formaAltEquipada: { 'champion-power': 'fogo' },
    };
    const caiu = aoDescerDeForma(ult, { ...ult, evolutionStage: 'champion-power' });
    expect(caiu.formaAltEquipada).toEqual({ 'champion-power': 'fogo' });
  });
});
