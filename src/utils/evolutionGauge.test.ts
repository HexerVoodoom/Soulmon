/**
 * 🧬 GAUGE DE EVOLUÇÃO (decisão do dono, 11/10/2026) — a regra pura, a
 * migração de save, o item da masmorra, e a SIMULAÇÃO de tempo-até-evoluir
 * por perfil de uso (as curvas registradas no REGISTRO-DE-DECISOES §30).
 */
import { describe, it, expect } from 'vitest';
import {
  dailyGaugeCap, gaugeGoalFor, gaugeContribution, creditGauge, gaugeFull,
  migrateEvolutionPoints, hydrateEvolutionPoints, gaugeView, gaugePointsLeft,
} from './evolutionGauge';
import { FORM_REQUIREMENTS, ULTRA_PATIENCE_POINTS, ULTRA_PATIENCE_DAYS, getMaxEnergyForStage } from '../types/progression';
import { computeDailyReset, degeneratedEvolutionPoints } from './dailyReset';
import { applySpecialItem } from './specialItemUse';

const TRES_MEGAS = ['mega-power', 'mega-harmony', 'mega-benevolence'];

describe('a regra', () => {
  it('meta por estágio e teto diário = meta diária do estágio (sem número novo)', () => {
    expect([gaugeGoalFor('rookie'), gaugeGoalFor('champion-power'), gaugeGoalFor('ultimate-harmony')]).toEqual([30, 45, 60]);
    expect(gaugeGoalFor('mega-power', TRES_MEGAS)).toBe(ULTRA_PATIENCE_POINTS);
    expect(gaugeGoalFor('mega-power', ['mega-power'])).toBe(ULTRA_PATIENCE_POINTS);
    expect(ULTRA_PATIENCE_POINTS).toBe(ULTRA_PATIENCE_DAYS * FORM_REQUIREMENTS.mega.required);
    expect(gaugeGoalFor('ultra')).toBe(0);
    for (const s of ['rookie', 'champion-power', 'ultimate-power', 'mega-power', 'ultra'] as const) {
      expect(dailyGaugeCap(s)).toBe(FORM_REQUIREMENTS[s.split('-')[0] as keyof typeof FORM_REQUIREMENTS].required);
    }
  });

  it('teto diário: 20 tarefas triviais rendem o mesmo que a meta cumprida (não farmável)', () => {
    expect(gaugeContribution(20, 'rookie')).toBe(4);
    expect(gaugeContribution(4, 'rookie')).toBe(4);
    expect(gaugeContribution(2, 'rookie')).toBe(2);
  });

  it('dia fraco credita pouco, NUNCA tira; entrada lixo vira 0', () => {
    expect(creditGauge(10, 0, 'rookie')).toBe(10);
    expect(creditGauge(10, -5, 'rookie')).toBe(10);
    expect(creditGauge(10, NaN, 'rookie')).toBe(10);
    expect(creditGauge(NaN as unknown as number, 3, 'rookie')).toBe(3);
    for (let w = -3; w < 30; w++) expect(creditGauge(17, w, 'champion-power')).toBeGreaterThanOrEqual(17);
  });

  it('cheio / faltam', () => {
    expect(gaugeFull(29, 'rookie')).toBe(false);
    expect(gaugeFull(30, 'rookie')).toBe(true);
    expect(gaugeFull(999, 'ultra')).toBe(false);
    expect(gaugePointsLeft(12, 'rookie')).toBe(18);
    expect(gaugePointsLeft(99, 'rookie')).toBe(0);
  });

  it('gaugeView: prévia de hoje limitada ao teto, sem barra no topo', () => {
    const v = gaugeView({ evolutionPoints: 10, evolutionStage: 'rookie', todayWeight: 9 });
    expect(v).toMatchObject({ points: 10, today: 4, goal: 30, left: 20, full: false, top: false });
    expect(v.pctWithToday).toBeCloseTo(14 / 30);
    expect(gaugeView({ evolutionPoints: 5, evolutionStage: 'ultra' }).top).toBe(true);
  });

  it('queda: piso = metade do gauge do estágio novo; custo fixo; nunca prêmio acima do que tinha', () => {
    expect(degeneratedEvolutionPoints(0, 'champion')).toBe(22);
    expect(degeneratedEvolutionPoints(200, 'ultimate')).toBe(200 - 5 * 5);
  });
});

describe('migração de save (perfectDays → gauge)', () => {
  it('mesma fração da barra; arredonda para cima; nunca perde', () => {
    expect(migrateEvolutionPoints(2, 'rookie')).toBe(15);          // 2/4 → 15/30
    expect(migrateEvolutionPoints(4, 'rookie')).toBe(30);          // cheio continua cheio
    expect(migrateEvolutionPoints(1, 'champion-power')).toBe(9);   // 1/5 → 9/45
    expect(migrateEvolutionPoints(3, 'ultimate-power')).toBe(36);  // 3/5 → 36/60
    expect(migrateEvolutionPoints(0, 'rookie')).toBe(0);
    expect(migrateEvolutionPoints(7, 'ultra')).toBe(0);
    for (const [stage, req] of [['rookie', 4], ['champion-power', 5], ['ultimate-harmony', 5], ['mega-power', 6]] as const) {
      for (let d = 0; d <= 60; d++) {
        const p = migrateEvolutionPoints(d, stage);
        const g = FORM_REQUIREMENTS[stage.split('-')[0] as 'rookie'].gauge;
        expect(p / g).toBeGreaterThanOrEqual(d / req - 1e-9);
        // quem podia evoluir antes continua podendo (no mega a meta é a do Ultra, 16/11/2026: só vale abaixo dele)
        if (d >= req && !stage.startsWith('mega')) expect(gaugeFull(p, stage, TRES_MEGAS)).toBe(true);
      }
    }
  });

  it('o banco do mega para o Ultra vem junto: 45 dias completos enchem a barra, mas ela só abre com as 3 megas', () => {
    const banco = migrateEvolutionPoints(ULTRA_PATIENCE_DAYS, 'mega-power');
    expect(gaugeFull(banco, 'mega-power', ['mega-power'])).toBe(false);
    expect(gaugeFull(banco, 'mega-power', TRES_MEGAS)).toBe(true);
  });

  it('hidratação é IDEMPOTENTE: campo presente vence, ausente/corrompido migra', () => {
    expect(hydrateEvolutionPoints({ perfectDays: 2, evolutionStage: 'rookie' })).toBe(15);
    expect(hydrateEvolutionPoints({ evolutionPoints: 3, perfectDays: 2, evolutionStage: 'rookie' })).toBe(3);
    expect(hydrateEvolutionPoints({ evolutionPoints: 0, perfectDays: 4, evolutionStage: 'rookie' })).toBe(0);
    for (const lixo of ['x', -1, NaN, Infinity, null, {}, []]) {
      expect(hydrateEvolutionPoints({ evolutionPoints: lixo, perfectDays: 'y', evolutionStage: 7 })).toBe(0);
    }
    const uma = hydrateEvolutionPoints({ perfectDays: 3, evolutionStage: 'champion-power' });
    expect(hydrateEvolutionPoints({ evolutionPoints: uma, perfectDays: 3, evolutionStage: 'champion-power' })).toBe(uma);
  });
});

describe('o item da masmorra (🌀): não mexe mais na barra', () => {
  it('usar o 🌀 NÃO enche a barra nem dá dia perfeito: só liga o buff (utils/glitchtamaBuff.ts)', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    const prev = { healthPoints: 3, maxHealthPoints: 3, foodInventory: { '🌀': 2 }, perfectDays: 0, evolutionPoints: 5,
      powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, totalXP: 0, evolutionStage: 'rookie' };
    const r1 = applySpecialItem(prev as any, '🌀', now);
    expect(r1.refused).toBeUndefined();
    expect(r1.state.evolutionPoints).toBe(5);
    expect(r1.state.perfectDays).toBe(0);
    expect(r1.state.glitchtamaUsadoEm).toBe(now.getTime());
    expect(applySpecialItem(r1.state as any, '🌀', now).refused).toBe('weekly-cap');
  });
});

describe('a virada credita o gauge', () => {
  const NOW = new Date(2026, 9, 13, 0, 5); // terça
  const st = (done: number, total: number, over: Record<string, unknown> = {}) => ({
    activities: [], completedTasks: [], healthPoints: 3, maxHealthPoints: 3, perfectDays: 0, totalXP: 0,
    powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, evolutionStage: 'rookie', unlockedEvolutions: ['rookie'],
    degeneratedByHP: false, currentBranch: 'harmony', lastDayWasPerfect: false, energyPoints: 0,
    lastResetDate: new Date(2026, 9, 12).toDateString(), evolutionPoints: 7,
    lastDayReport: { saveDay: 30 },
    tasks: Array.from({ length: total }, (_, i) => ({ id: `t${i}`, name: 'x', category: 'work', emoji: '', completed: i < done })),
    ...over,
  });
  it('credita o peso feito, com teto, e reporta', () => {
    const r: any = computeDailyReset(st(3, 5) as any, { now: NOW });
    expect(r.evolutionPoints).toBe(10);
    expect(r.lastDayReport.gaugeGain).toBe(3);
    const cheio: any = computeDailyReset(st(9, 9) as any, { now: NOW });
    expect(cheio.evolutionPoints).toBe(7 + 4);
  });
  it('dia sem nada não tira nada', () => {
    const r: any = computeDailyReset(st(0, 4) as any, { now: NOW });
    expect(r.evolutionPoints).toBe(7);
  });

  describe('16/11/2026: a barra do Ultra só acumula com as 3 megas liberadas', () => {
    const MEGA = { evolutionStage: 'mega-power', currentBranch: 'power', evolutionPoints: 100 };
    it('1 mega: nada entra, nada sai (pontos guardados) e o relatório não promete ganho', () => {
      const r: any = computeDailyReset(st(6, 6, { ...MEGA, unlockedEvolutions: ['mega-power'] }) as any, { now: NOW });
      expect(r.evolutionPoints).toBe(100);
      expect(r.lastDayReport.gaugeGain).toBe(0);
    });
    it('1 mega com a barra ANTIGA já cheia: não evolui ao Ultra e não perde o acumulado', () => {
      const r: any = computeDailyReset(st(6, 6, { ...MEGA, evolutionPoints: ULTRA_PATIENCE_POINTS + 30, unlockedEvolutions: ['mega-power'] }) as any, { now: NOW });
      expect(r.evolutionStage).toBe('mega-power');
      expect(r.evolutionPoints).toBe(ULTRA_PATIENCE_POINTS + 30);
    });
    it('3 megas: o ganho do dia entra normalmente (teto do mega)', () => {
      const r: any = computeDailyReset(st(6, 6, { ...MEGA, unlockedEvolutions: TRES_MEGAS }) as any, { now: NOW });
      expect(r.evolutionPoints).toBe(106);
      expect(r.lastDayReport.gaugeGain).toBe(6);
    });
    it('3 megas: a barra enche exatamente nos 45 dias de teto', () => {
      expect(gaugeFull(ULTRA_PATIENCE_POINTS, 'mega-power', TRES_MEGAS)).toBe(true);
      expect(gaugeFull(ULTRA_PATIENCE_POINTS - 1, 'mega-power', TRES_MEGAS)).toBe(false);
    });
    it('a view diz travada + quantas megas, e o acumulado sobrevive (idempotente)', () => {
      const v = gaugeView({ evolutionPoints: 400, evolutionStage: 'mega-power', unlockedEvolutions: ['mega-power', 'mega-harmony'] });
      expect(v).toMatchObject({ locked: true, full: false, megasLiberadas: 2, megasTotal: 3, goal: ULTRA_PATIENCE_POINTS });
      expect(gaugePointsLeft(400, 'mega-power', ['mega-power'])).toBe(0);
      const livre = gaugeView({ evolutionPoints: 400, evolutionStage: 'mega-power', unlockedEvolutions: TRES_MEGAS });
      expect(livre).toMatchObject({ locked: false, full: true, megasLiberadas: 3 });
      // save sem o campo / lixo: leitura tolerante, nunca quebra
      expect(gaugeView({ evolutionStage: 'mega-power' }).locked).toBe(true);
      expect(gaugeView({ evolutionStage: 'mega-power', unlockedEvolutions: 'x' as any }).megasLiberadas).toBe(0);
      expect(gaugeView({ evolutionStage: 'ultra' }).locked).toBe(false);
    });
  });

  describe('🌀 buff do Glitchtama (+10% nos ganhos, 7 dias)', () => {
    const DIA = 86_400_000;
    const comBuff = (usadoEm: number, over: Record<string, unknown> = {}) => st(4, 4, { glitchtamaUsadoEm: usadoEm, ...over });
    it('ativo: o ganho rende +10% (fração acumula no carry, sem arredondar para zero)', () => {
      let s: any = comBuff(NOW.getTime() - DIA);
      const total = [];
      // 10 dias seguidos de ganho 4 (teto rookie): 40 pontos base -> +4 de bônus no total (0.4/dia acumulando)
      for (let i = 0; i < 10; i++) {
        const antes = s.evolutionPoints;
        s = computeDailyReset({ ...s, lastResetDate: new Date(2026, 9, 12).toDateString(), tasks: st(4, 4).tasks } as any, { now: NOW });
        total.push(s.evolutionPoints - antes);
        s = { ...s, evolutionPoints: s.evolutionPoints, evolutionStage: 'rookie', glitchtamaUsadoEm: NOW.getTime() - DIA };
      }
      expect(total.reduce((a, b) => a + b, 0)).toBe(44);
      expect(s.glitchtamaCarry).toBeLessThan(1);
    });
    it('relatório e pontos concordam (gaugeGain inclui o bônus)', () => {
      const r: any = computeDailyReset(comBuff(NOW.getTime() - DIA, { glitchtamaCarry: 0.8 }) as any, { now: NOW });
      expect(r.lastDayReport.gaugeGain).toBe(5); // 4 + floor(0.4 + 0.8)
      expect(r.evolutionPoints).toBe(7 + 5);
      expect(r.glitchtamaCarry).toBeCloseTo(0.2, 5);
    });
    it('sem buff, expirado (>= 7 dias) ou nunca usado: ganho puro, carry intocado', () => {
      for (const over of [{}, { glitchtamaUsadoEm: NOW.getTime() - 7 * DIA }, { glitchtamaUsadoEm: NOW.getTime() - 30 * DIA }]) {
        const r: any = computeDailyReset(st(4, 4, over) as any, { now: NOW });
        expect(r.evolutionPoints).toBe(11);
        expect(r.lastDayReport.gaugeGain).toBe(4);
        expect(r.glitchtamaCarry ?? 0).toBe(0);
      }
    });
    it('não mexe no que já estava acumulado: só o ganho do dia', () => {
      const r: any = computeDailyReset(comBuff(NOW.getTime() - DIA, { evolutionPoints: 20, glitchtamaCarry: 0.9 }) as any, { now: NOW });
      expect(r.evolutionPoints).toBe(20 + 5);
    });
    it('dia sem ganho não rende bônus', () => {
      const r: any = computeDailyReset(st(0, 4, { glitchtamaUsadoEm: NOW.getTime() - DIA }) as any, { now: NOW });
      expect(r.evolutionPoints).toBe(7);
    });
  });
});

/**
 * SIMULAÇÃO — tempo até evoluir por perfil. Peso feito por dia da semana
 * (seg..dom). Evolui no dia em que o gauge enche (o jogador toca no visor).
 */
function diasAte(meta: 'mega' | 'ultra', semana: number[]): number[] {
  const escada = ['rookie', 'champion-power', 'ultimate-power', 'mega-power'];
  let estagio = 0; let pontos = 0; let dia = 0; const marcos: number[] = [];
  while (dia < 2000) {
    pontos = creditGauge(pontos, semana[dia % 7], escada[estagio]);
    dia++;
    if (gaugeFull(pontos, escada[estagio], TRES_MEGAS)) {
      marcos.push(dia); pontos = 0; estagio++;
      if (meta === 'mega' && estagio === 3) break;
      if (estagio === 4) break;
    }
  }
  return marcos;
}

describe('SIMULAÇÃO: rookie→mega leva SEMANAS, não dias', () => {
  // leve: 2 de peso nos dias úteis, nada no fim de semana (média ≈ 1,4/dia)
  const LEVE = [2, 2, 2, 2, 2, 0, 0];
  // médio: 3 nos úteis, 2 num dia do fim de semana (≈ 2,4/dia)
  const MEDIO = [3, 3, 3, 3, 3, 2, 0];
  // intenso: muito acima do teto todo dia (o teto manda)
  const INTENSO = [9, 9, 9, 9, 9, 9, 9];

  it('curvas registradas (§30)', () => {
    expect(diasAte('mega', INTENSO)).toEqual([8, 17, 29]);
    expect(diasAte('mega', MEDIO)).toEqual([12, 31, 57]);
    expect(diasAte('mega', LEVE)).toEqual([19, 52, 94]);
    // Ultra (com as 3 megas já liberadas): +45 dias de teto do mega no intenso.
    expect(diasAte('ultra', INTENSO)[3]).toBe(29 + 45);
  });

  it('nenhum perfil chega ao mega em menos de 4 semanas', () => {
    for (const p of [LEVE, MEDIO, INTENSO]) expect(diasAte('mega', p)[2]).toBeGreaterThanOrEqual(28);
  });
});

describe('⚡ orçamento de energia', () => {
  it('a energia máxima cabe um dia inteiro de meta com folga (×2)', () => {
    for (const s of ['rookie', 'champion-power', 'ultimate-power', 'mega-power', 'ultra'] as const) {
      expect(getMaxEnergyForStage(s)).toBe(dailyGaugeCap(s) * 2);
    }
  });
});
