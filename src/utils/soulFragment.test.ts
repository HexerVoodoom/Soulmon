import { describe, it, expect } from 'vitest';
import {
  SOUL_FRAGMENT_SAVE_FIELD, soulFragmentName, soulFragmentWord, soulFragmentCount,
  fragmentsGatheredLine, fragmentsSpentLine, fragmentBarLabel, fragmentHowText,
} from './soulFragment';
import {
  hydrateEvolutionPoints, creditGauge, gaugeContribution, gaugeGoalFor, gaugeFull, dailyGaugeCap, gaugeView,
} from './evolutionGauge';
import { FORM_REQUIREMENTS } from '../types/progression';
import { HABIT_WEIGHT } from '../types/taskModel';

describe('Fragmento de Alma — vocabulário', () => {
  it('singular/plural, PT e EN', () => {
    expect(soulFragmentName(1, 'pt-BR')).toBe('Fragmento de Alma');
    expect(soulFragmentName(5, 'pt-BR')).toBe('Fragmentos de Alma');
    expect(soulFragmentName(1, 'en-US')).toBe('Soul Fragment');
    expect(soulFragmentName(0, 'en-US')).toBe('Soul Fragments');
    expect(soulFragmentWord(2, 'pt-BR')).toBe('fragmentos de alma');
    expect(soulFragmentCount(1, 'en-US')).toBe('1 soul fragment');
    expect(soulFragmentCount(12, 'pt-BR')).toBe('12 fragmentos de alma');
    expect(soulFragmentCount(-3, 'en-US')).toBe('0 soul fragments');
  });

  it('nenhuma frase cobra: sem "falta", "faltam", "só" nem "mais N"', () => {
    const textos = [
      fragmentsGatheredLine(0, 'pt-BR'), fragmentsGatheredLine(7, 'pt-BR'),
      fragmentsGatheredLine(0, 'en-US'), fragmentsGatheredLine(7, 'en-US'),
      fragmentsSpentLine(30, 'pt-BR'), fragmentsSpentLine(30, 'en-US'),
      fragmentBarLabel(false, 'pt-BR'), fragmentBarLabel(true, 'en-US'),
      fragmentHowText('pt-BR'), fragmentHowText('en-US'),
    ].join('\n');
    expect(textos).not.toMatch(/falta|only \d|left|remaining|mais \d+|more \d+/i);
  });

  it('o consumo só é dito quando houve consumo', () => {
    expect(fragmentsSpentLine(0, 'pt-BR')).toBe('');
    expect(fragmentsSpentLine(30, 'en-US')).toBe('30 soul fragments gave shape to this evolution.');
  });
});

describe('Fragmento de Alma — o estado salvo não muda de significado', () => {
  it('o campo continua sendo evolutionPoints', () => {
    expect(SOUL_FRAGMENT_SAVE_FIELD).toBe('evolutionPoints');
  });

  it('save antigo: o progresso do gauge vira fragmentos 1:1 (idempotente, nada perdido)', () => {
    expect(hydrateEvolutionPoints({ evolutionPoints: 17, evolutionStage: 'rookie' })).toBe(17);
    // a segunda carga não migra de novo
    const uma = hydrateEvolutionPoints({ evolutionPoints: 17, perfectDays: 99, evolutionStage: 'rookie' });
    expect(hydrateEvolutionPoints({ evolutionPoints: uma, perfectDays: 99, evolutionStage: 'rookie' })).toBe(uma);
    // save de antes do gauge (só perfectDays) segue migrando pela mesma fração
    expect(hydrateEvolutionPoints({ perfectDays: 2, evolutionStage: 'rookie' }))
      .toBe(Math.ceil(2 * FORM_REQUIREMENTS.rookie.gauge / FORM_REQUIREMENTS.rookie.required));
  });

  it('o fragmento é por ESFORÇO e tem teto diário (a meta do estágio)', () => {
    const cap = dailyGaugeCap('rookie');
    expect(cap).toBe(FORM_REQUIREMENTS.rookie.required);
    // tarefa de esforço 3 rende 3; hábito rende HABIT_WEIGHT; vinte triviais não passam do teto
    expect(gaugeContribution(3, 'rookie')).toBe(Math.min(3, cap));
    expect(gaugeContribution(HABIT_WEIGHT, 'rookie')).toBe(HABIT_WEIGHT);
    expect(gaugeContribution(20, 'rookie')).toBe(cap);
    // nunca decresce: dia sem nada credita 0, não tira
    expect(creditGauge(10, 0, 'rookie')).toBe(10);
  });

  it('cheio = consome na evolução: custo é a meta do estágio e a barra enche nela', () => {
    const goal = gaugeGoalFor('rookie');
    expect(gaugeFull(goal, 'rookie')).toBe(true);
    expect(gaugeView({ evolutionPoints: goal, evolutionStage: 'rookie' }).left).toBe(0);
    expect(fragmentsSpentLine(goal, 'pt-BR')).toContain(`${goal} fragmentos de alma`);
  });
});
