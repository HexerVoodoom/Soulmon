/**
 * Categorias — fonte única (pedido do dono, 11/11/2026, itens D e E).
 *  D) toda categoria soma o mesmo total e o conjunto é equilibrado entre Poder/Harmonia/Benevolência;
 *  E) tarefa e hábito usam a MESMA lista; ids antigos migram para a categoria equivalente.
 */
import { describe, it, expect } from 'vitest';
import { CATEGORY_ATTRIBUTES } from './attributes';
import { ACTIVITY_CATEGORIES, LEGACY_CATEGORY_MAP, LIFE_AREAS, LIFE_AREA_LABEL, normalizeCategory } from './categories';
import { CATEGORY_ICON_NAME, CATEGORY_ICONS, CATEGORY_LABELS_PT, categoryLabel } from './category-icons';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { CHAT_CATEGORIES } from '../utils/chatActions';
import { CATEGORIES as SERVER_CATEGORIES, LEGACY_CATEGORY_MAP as SERVER_LEGACY } from '../../functions/api/_categories.js';

const SOMA_COMUM = 4;
const cats = [...ACTIVITY_CATEGORIES];
const soma = (c: (typeof cats)[number]) => {
  const a = CATEGORY_ATTRIBUTES[c];
  return a.power + a.harmony + a.benevolence;
};

describe('D — balanceamento de atributos por categoria', () => {
  it('toda categoria soma o mesmo total (4, a soma que já era a mais comum)', () => {
    for (const c of cats) expect(soma(c), c).toBe(SOMA_COMUM);
  });

  it('o conjunto é equilibrado: Poder, Harmonia e Benevolência diferem em no máximo 1 ponto', () => {
    const tot = { power: 0, harmony: 0, benevolence: 0 };
    for (const c of cats) {
      tot.power += CATEGORY_ATTRIBUTES[c].power;
      tot.harmony += CATEGORY_ATTRIBUTES[c].harmony;
      tot.benevolence += CATEGORY_ATTRIBUTES[c].benevolence;
    }
    const v = Object.values(tot);
    expect(v.reduce((a, b) => a + b, 0)).toBe(SOMA_COMUM * cats.length);
    expect(Math.max(...v) - Math.min(...v)).toBeLessThanOrEqual(1); // 40 pontos não dividem por 3: 14/13/13
    expect(tot.power).toBeGreaterThanOrEqual(tot.harmony); // a sobra vai para Poder, o menor de antes
  });

  it('nenhuma categoria favorece só Poder, mas existem categorias com 3 de Poder (como com 3 de Harmonia/Benevolência)', () => {
    for (const k of ['power', 'harmony', 'benevolence'] as const) {
      expect(cats.filter(c => CATEGORY_ATTRIBUTES[c][k] === 3).length, k).toBeGreaterThanOrEqual(2);
    }
    for (const c of cats) expect(CATEGORY_ATTRIBUTES[c].power, c).toBeLessThanOrEqual(3);
  });
});

describe('E — uma lista só de categorias', () => {
  it('hábitos (áreas do catálogo), tarefas (chips), chat e servidor falam das mesmas categorias', () => {
    expect([...ACTIVITY_CATEGORIES]).toEqual([...LIFE_AREAS]);
    expect([...CHAT_CATEGORIES]).toEqual([...LIFE_AREAS]);
    expect([...SERVER_CATEGORIES]).toEqual([...LIFE_AREAS]);
    expect(Object.keys(CATEGORY_ATTRIBUTES).sort()).toEqual([...LIFE_AREAS].sort());
    expect(Object.keys(CATEGORY_ICON_NAME).sort()).toEqual([...LIFE_AREAS].sort());
    expect(Object.keys(CATEGORY_ICONS).sort()).toEqual([...LIFE_AREAS].sort());
    expect(Object.keys(CATEGORY_LABELS_PT).sort()).toEqual([...LIFE_AREAS].sort());
  });

  it('inclui Criatividade e tem 10 categorias', () => {
    expect(LIFE_AREAS).toContain('criatividade');
    expect(LIFE_AREAS).toHaveLength(10);
    expect(LIFE_AREA_LABEL.criatividade).toEqual({ pt: 'Criatividade', en: 'Creativity' });
  });

  it('todo item do catálogo tem como categoria a sua própria área', () => {
    for (const i of ACTIVITY_CATALOG) expect(i.category, i.id).toBe(i.area);
  });

  it('migração: id antigo, caixa baixa de save velho e id novo viram a categoria de hoje; lixo vira undefined', () => {
    expect(normalizeCategory('Health')).toBe('corpo');
    expect(normalizeCategory('Fitness')).toBe('corpo');
    expect(normalizeCategory('Wellness')).toBe('mente');
    expect(normalizeCategory('Discipline')).toBe('foco');
    expect(normalizeCategory('Work')).toBe('foco');
    expect(normalizeCategory('Study')).toBe('aprendizado');
    expect(normalizeCategory('study')).toBe('aprendizado');
    expect(normalizeCategory('Social')).toBe('relacoes');
    expect(normalizeCategory('Creativity')).toBe('criatividade');
    for (const c of LIFE_AREAS) expect(normalizeCategory(c)).toBe(c);
    for (const lixo of [undefined, null, 42, '', 'Hacker', {}, '__proto__', 'constructor']) expect(normalizeCategory(lixo)).toBeUndefined();
    for (const novo of Object.values(LEGACY_CATEGORY_MAP)) expect(LIFE_AREAS).toContain(novo);
  });

  it('o rótulo mostrado tolera id antigo (save velho) e id novo, nos dois idiomas', () => {
    expect(categoryLabel('Study' as never, true)).toBe('Aprendizado');
    expect(categoryLabel('criatividade', false)).toBe('Creativity');
    expect(categoryLabel('lixo' as never, true)).toBe('lixo');
  });

  it('o espelho do servidor tem o mesmo mapa de migração', () => {
    expect(SERVER_LEGACY).toEqual(LEGACY_CATEGORY_MAP);
  });
});

describe('Criatividade — sugestões do catálogo', () => {
  const itens = ACTIVITY_CATALOG.filter(i => i.area === 'criatividade');
  const PROMESSA = /trat|cur[ae]|terapia|treat|cure|therapy|diagn|ansiedade|depress|foco|focus|saúde|health/i;

  it('há sugestões de hábito, todas com evidência declarada', () => {
    expect(itens.length).toBeGreaterThanOrEqual(6);
    for (const i of itens) {
      expect(i.evidence.refs.length, i.id).toBeGreaterThan(0);
      if (i.evidence.level === 'C') expect(i.evidence.note, i.id).toBeTruthy();
    }
  });

  it('a copy que o jogador lê não faz promessa clínica, de saúde ou de foco', () => {
    for (const i of itens) {
      for (const t of [i.why.pt, i.why.en, i.name.pt, i.name.en, ...i.levels.flatMap(l => [l.target.pt, l.target.en])]) {
        expect(t, i.id).not.toMatch(PROMESSA);
      }
    }
  });
});
