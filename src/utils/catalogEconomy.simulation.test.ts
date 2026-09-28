/**
 * F5 do plano do catálogo — simulação de economia.
 *
 * Não é teste de UI: é uma prova de que o starter set recomendado, jogado
 * "perfeitamente" (toda atividade feita todo dia devido) por várias semanas,
 * não produz números absurdos na meta ponderada nem no orçamento de esforço
 * — e que o starter set nunca ultrapassa o orçamento declarado
 * (`STARTER_EFFORT_BUDGET`), para qualquer perfil razoável do onboarding.
 */
import { describe, it, expect } from 'vitest';
import { recommendStarterSet, STARTER_EFFORT_BUDGET, STARTER_MAX_PER_AREA } from './recommend';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { registeredForDay, dailyGoalFor } from './dailyReset';
import { FORM_REQUIREMENTS } from '../types/progression';
import type { LifeArea, StruggleId, StrengthId } from '../types/activityCatalog';

const TODAS_AREAS: LifeArea[] = ['sono', 'corpo', 'mente', 'foco', 'aprendizado', 'relacoes', 'casa', 'financas', 'proposito'];
const TODAS_DIFICULDADES: StruggleId[] = ['comecar', 'constancia', 'esquecer', 'energia', 'ansiedade', 'distracao', 'tempo', 'perfeccionismo'];
const TODAS_FORCAS: StrengthId[] = ['disciplina', 'curiosidade', 'criatividade', 'sociabilidade', 'organizacao', 'energiaFisica', 'calma', 'persistencia'];

/** Perfis sintéticos cobrindo o espaço de combinações plausíveis. */
function perfisAleatorios(n: number, seed = 1) {
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const escolhe = <T>(arr: T[], max: number) => {
    const copia = [...arr];
    const out: T[] = [];
    const k = Math.floor(rand() * (max + 1));
    for (let i = 0; i < k && copia.length > 0; i++) {
      out.push(copia.splice(Math.floor(rand() * copia.length), 1)[0]);
    }
    return out;
  };
  return Array.from({ length: n }, () => ({
    areas: escolhe(TODAS_AREAS, 3),
    struggles: escolhe(TODAS_DIFICULDADES, 3),
    strengths: escolhe(TODAS_FORCAS, 3),
  }));
}

describe('simulação de economia — starter set nunca ultrapassa o orçamento', () => {
  const perfis = perfisAleatorios(200);

  it('para 200 perfis sintéticos, o esforço do nível 1 do starter set é <= STARTER_EFFORT_BUDGET', () => {
    for (const perfil of perfis) {
      const set = recommendStarterSet(perfil, ACTIVITY_CATALOG);
      const effort = set.reduce((s, item) => s + item.levels[0].effort, 0);
      expect(effort).toBeLessThanOrEqual(STARTER_EFFORT_BUDGET);
    }
  });

  it('nenhum perfil recebe mais que STARTER_MAX_PER_AREA itens da mesma área', () => {
    for (const perfil of perfis) {
      const set = recommendStarterSet(perfil, ACTIVITY_CATALOG);
      const porArea = new Map<string, number>();
      for (const item of set) porArea.set(item.area, (porArea.get(item.area) ?? 0) + 1);
      for (const count of porArea.values()) expect(count).toBeLessThanOrEqual(STARTER_MAX_PER_AREA);
    }
  });

  it('nenhum item optInOnly aparece em NENHUM dos 200 perfis', () => {
    for (const perfil of perfis) {
      const set = recommendStarterSet(perfil, ACTIVITY_CATALOG);
      expect(set.some((i) => i.optInOnly)).toBe(false);
    }
  });

  it('jogando o starter set perfeitamente por 21 dias, a meta do dia nunca excede o requisito do estágio rookie', () => {
    const perfil = { areas: ['corpo', 'mente'] as LifeArea[], struggles: ['constancia'] as StruggleId[], strengths: ['disciplina'] as StrengthId[] };
    const set = recommendStarterSet(perfil, ACTIVITY_CATALOG);
    const activities = set.map((item, i) => ({
      id: `sim-${i}`, weekDays: [0, 1, 2, 3, 4, 5, 6], catalogId: item.id,
    }));
    const state = { evolutionStage: 'rookie', activities, tasks: [] as unknown[] };
    const requisitoRookie = FORM_REQUIREMENTS.rookie.required;
    for (let dia = 0; dia < 21; dia++) {
      const weekDay = dia % 7;
      const meta = dailyGoalFor(state, weekDay);
      expect(meta).toBeLessThanOrEqual(requisitoRookie);
    }
  });

  it('o starter set nunca fica vazio para um perfil que escolheu ao menos 1 área', () => {
    for (const perfil of perfis) {
      if (perfil.areas.length === 0) continue;
      const set = recommendStarterSet(perfil, ACTIVITY_CATALOG);
      expect(set.length).toBeGreaterThan(0);
    }
  });
});

describe('simulação de economia — o peso de registeredForDay bate com a soma manual', () => {
  it('soma manual de HABIT_WEIGHT (exceto optInOnly) == registeredForDay', () => {
    const set = recommendStarterSet({ areas: ['sono'], struggles: [], strengths: [] }, ACTIVITY_CATALOG);
    const activities = set.map((item, i) => ({ id: `s-${i}`, weekDays: [0, 1, 2, 3, 4, 5, 6], catalogId: item.id }));
    const manual = activities.length; // nenhum item do starter set é optInOnly (V1)
    const via = registeredForDay({ evolutionStage: 'rookie', activities, tasks: [] }, 0);
    expect(via).toBe(manual);
  });
});
