import { describe, it, expect } from 'vitest';
import {
  computeCarePattern, resolveBranch, patternBranch, CARE_PATTERNS, CARE_WINDOW_DAYS,
} from './carePattern';

const NOW = new Date('2026-08-15T12:00:00');
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return { completedAt: d.toISOString() };
};

describe('padrão de cuidado — leitura', () => {
  it('quem aparece quase todo dia é Constante', () => {
    const done = Array.from({ length: 10 }, (_, i) => daysAgo(i));
    const r = computeCarePattern(done, NOW);
    expect(r.pattern.id).toBe('constante');
    expect(r.confident).toBe(true);
    expect(r.activeDays).toBe(10);
  });

  it('quem empilha tudo num dia só é Explosivo', () => {
    const done = Array.from({ length: 12 }, (_, i) => daysAgo(2, 8 + (i % 10)));
    const r = computeCarePattern(done, NOW);
    expect(r.pattern.id).toBe('explosivo');
    expect(r.concentration).toBe(1);
  });

  it('sem histórico suficiente a leitura não é confiável', () => {
    expect(computeCarePattern([], NOW).confident).toBe(false);
    expect(computeCarePattern([daysAgo(1), daysAgo(2)], NOW).confident).toBe(false);
    expect(computeCarePattern(undefined, NOW).confident).toBe(false);
  });

  it('ignora o que está fora da janela e datas inválidas', () => {
    const antigo = Array.from({ length: 8 }, (_, i) => daysAgo(CARE_WINDOW_DAYS + 5 + i));
    expect(computeCarePattern(antigo, NOW).total).toBe(0);
    expect(computeCarePattern([{ completedAt: 'nao é data' }], NOW).total).toBe(0);
  });

  it('todo padrão tem textos nos dois idiomas', () => {
    for (const p of Object.values(CARE_PATTERNS)) {
      expect(p.namePt && p.nameEn && p.descPt && p.descEn && p.emoji).toBeTruthy();
    }
  });
});

describe('padrão de cuidado — escolha do galho', () => {
  const constante = computeCarePattern(Array.from({ length: 10 }, (_, i) => daysAgo(i)), NOW);
  const explosivo = computeCarePattern(Array.from({ length: 12 }, (_, i) => daysAgo(2, 8 + (i % 10))), NOW);
  const fraco = computeCarePattern([daysAgo(1)], NOW);

  it('os atributos continuam mandando quando há um vencedor claro', () => {
    const pts = { power: 10, harmony: 2, benevolence: 1 };
    // Mesmo com padrão Constante (que puxa benevolência), poder ganha por ser maior.
    expect(resolveBranch(pts, constante)).toBe('power');
  });

  it('o padrão só desempata', () => {
    const empate = { power: 5, harmony: 5, benevolence: 5 };
    expect(resolveBranch(empate, constante)).toBe('benevolence');
    expect(resolveBranch(empate, explosivo)).toBe('power');
  });

  it('desempata apenas entre os que empataram', () => {
    // Explosivo puxa poder, mas poder não está no empate — não pode inventar.
    const empate = { power: 1, harmony: 7, benevolence: 7 };
    expect(['harmony', 'benevolence']).toContain(resolveBranch(empate, explosivo));
  });

  it('leitura fraca não decide nada — cai no galho atual', () => {
    const empate = { power: 5, harmony: 5, benevolence: 5 };
    expect(resolveBranch(empate, fraco, 'harmony')).toBe('harmony');
    expect(resolveBranch(empate, fraco, 'benevolence')).toBe('benevolence');
  });

  it('sem atributo nenhum usa o padrão, ou o galho atual', () => {
    const zero = { power: 0, harmony: 0, benevolence: 0 };
    expect(resolveBranch(zero, explosivo)).toBe('power');
    expect(resolveBranch(zero, fraco, 'benevolence')).toBe('benevolence');
  });

  it('nenhum padrão é melhor: cada um puxa um galho diferente', () => {
    const alvos = new Set([patternBranch('constante'), patternBranch('explosivo'), patternBranch('equilibrado')]);
    expect(alvos.size).toBe(3);
  });
});
