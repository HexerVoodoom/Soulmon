import { describe, it, expect } from 'vitest';
import { mulberry32 } from './combate/rng';
import { CHANCES_POR_ESTAGIO } from './elementoCombinado';
import {
  PROFUNDIDADE_DEGRAUS, celulaMaisProxima, contagemDaEntrada, degrausDeProfundidade, escolherCelula, estagioPorProfundidade, sortearContagem,
} from './dificuldadeEstagio';
import { ENEMY_ROSTER, ENEMY_STAGES, capEnemyStage, maxEnemyStageForLevel, pickEnemy, type EnemyStage } from './enemyRoster';
import { getDungeonEncounter } from './novosSoulmon';
import { planArenaChampion } from './arenaComponentes';

const N = 20000;

describe('sortearContagem (tabela §232 como peso)', () => {
  it('a faixa de cada contagem bate com a linha do estágio (amostra grande, seed)', () => {
    for (const stage of ENEMY_STAGES) {
      const rng = mulberry32(1234);
      const cnt = [0, 0, 0, 0];
      for (let i = 0; i < N; i++) cnt[sortearContagem(stage, rng()).k - 1]++;
      CHANCES_POR_ESTAGIO[stage].forEach((pct, i) => expect(Math.abs((cnt[i] / N) * 100 - pct), `${stage} k=${i + 1}`).toBeLessThan(1.2));
    }
  });
  it('faixa de 0% nunca sai e frac fica em [0,1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 5000; i++) {
      const a = sortearContagem('rookie', rng());
      expect(a.k).toBeLessThanOrEqual(2);
      const b = sortearContagem('champion', rng());
      expect(b.k).not.toBe(4);
      for (const r of [a, b]) { expect(r.frac).toBeGreaterThanOrEqual(0); expect(r.frac).toBeLessThan(1); }
    }
  });
  it('u inválido não quebra', () => {
    expect(sortearContagem('mega', Number.NaN).k).toBe(1);
    expect(sortearContagem('mega', 5).k).toBe(4);
  });
});

describe('célula vazia: vizinho mais próximo', () => {
  it('prefere a própria célula, senão a mais próxima, empate = menos elementos', () => {
    expect(celulaMaisProxima(2, new Set([1, 2]))).toBe(2);
    expect(celulaMaisProxima(4, new Set([1, 3]))).toBe(3);
    expect(celulaMaisProxima(2, new Set([1, 3]))).toBe(1);
    expect(celulaMaisProxima(3, new Set([1]))).toBe(1);
    expect(celulaMaisProxima(2, new Set())).toBeUndefined();
  });
  it('escolherCelula nunca falha com pool não vazio e cai no vizinho; pool vazio = undefined', () => {
    const so1 = ENEMY_ROSTER.filter(e => e.stage === 'mega' && contagemDaEntrada(e) === 1);
    expect(so1.length).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) {
      const c = escolherCelula(so1, 'mega', i / 200)!;
      expect(c.k).toBe(1);
      expect(c.lista.length).toBe(so1.length);
    }
    expect(escolherCelula([], 'mega', 0.5)).toBeUndefined();
  });
});

describe('pickEnemy({ tabela: true })', () => {
  const frac1 = (stage: EnemyStage, seed: number) => {
    const rng = mulberry32(seed);
    let um = 0, total = 0;
    for (let i = 0; i < 6000; i++) {
      const e = pickEnemy(99, rng, { stage, tabela: true });
      if (e.kind === 'mascote') continue;
      total++;
      if (contagemDaEntrada(e) === 1) um++;
    }
    return um / total;
  };
  it('Rookie quase sempre elemento único; a fatia de elemento único só cai conforme o estágio sobe', () => {
    const [r, c, u, m] = ENEMY_STAGES.map(s => frac1(s, 11));
    expect(r).toBeGreaterThan(0.9);
    expect(c).toBeLessThan(r);
    expect(u).toBeLessThan(c + 0.05);
    expect(m).toBeLessThan(0.5);
  });
  it('determinístico: mesma seed, mesma sequência; 2 chamadas de rng por inimigo (portão do corvo + escolha)', () => {
    const run = () => { let n = 0; const base = mulberry32(5); const rng = () => { n++; return base(); }; const ks = Array.from({ length: 50 }, () => pickEnemy(99, rng, { stage: 'ultimate', tabela: true }).key); return { ks, n }; };
    const a = run(), b = run();
    expect(a.ks).toEqual(b.ks);
    expect(a.n).toBe(b.n);
    expect(a.n).toBeLessThanOrEqual(100);
  });
  it('respeita o level: o estágio pedido é rebaixado ao teto', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 300; i++) {
      const e = pickEnemy(10, rng, { stage: 'mega', tabela: true });
      if (e.kind !== 'mascote') expect(e.stage).toBe(capEnemyStage('mega', 10));
    }
    for (let i = 0; i < 300; i++) {
      const e = pickEnemy(3, rng, { stage: 'ultimate', tabela: true });
      if (e.kind !== 'mascote') expect(e.stage).toBe('rookie');
    }
  });
  it('nunca falha: todo estágio devolve criatura, sem repetir enquanto sobrar', () => {
    const rng = mulberry32(9);
    for (const stage of ENEMY_STAGES) {
      const used = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const e = pickEnemy(99, rng, { stage, tabela: true, used });
        expect(e).toBeTruthy();
        if (e.kind !== 'mascote') used.add(e.id);
      }
    }
  });
});

describe('curva de profundidade', () => {
  it('degraus', () => {
    expect(PROFUNDIDADE_DEGRAUS).toEqual([60, 200, 500]);
    expect([1, 59, 60, 199, 200, 499, 500, 999].map(degrausDeProfundidade)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it('desloca o estágio do slot, preso ao teto do level e ao mega, sem nunca descer', () => {
    expect(estagioPorProfundidade('rookie', 1, 'mega')).toBe('rookie');
    expect(estagioPorProfundidade('rookie', 60, 'mega')).toBe('champion');
    expect(estagioPorProfundidade('rookie', 500, 'mega')).toBe('mega');
    expect(estagioPorProfundidade('champion', 500, 'mega')).toBe('mega');
    expect(estagioPorProfundidade('mega', 999, 'mega')).toBe('mega');
    expect(estagioPorProfundidade('rookie', 999, maxEnemyStageForLevel(10))).toBe('champion');
    expect(estagioPorProfundidade('ultimate', 999, maxEnemyStageForLevel(1))).toBe('ultimate');
  });
  it('getDungeonEncounter: andar fundo sobe a forma do slot rookie (level alto); level baixo segura', () => {
    const legacy = () => ({ sprite: 'x', name: 'x', line: 'x' });
    const estagios = (floor: number, lvl: number) => {
      const rng = mulberry32(21);
      const out = new Set<string>();
      for (let i = 0; i < 60; i++) {
        const e = getDungeonEncounter('rookie', new Set(), rng, legacy, lvl, undefined, undefined, floor, lvl);
        if (e.key) out.add(e.key.split('-').pop()!);
      }
      return out;
    };
    expect(estagios(1, 30).has('mega')).toBe(false);
    expect(estagios(500, 30).has('mega')).toBe(true);
    expect(estagios(500, 3).has('champion')).toBe(false);
  });
});

describe('Arena Champion pela tabela', () => {
  it('determinístico, só devolve combinados (2+) e undefined quando a célula é a base', () => {
    for (const el of ['fogo', 'agua', 'luz', 'terra']) {
      for (let i = 0; i < 50; i++) {
        const v = i / 50;
        const p = planArenaChampion(el, v);
        expect(p).toEqual(planArenaChampion(el, v));
        if (p) expect(contagemDaEntrada(p.entry!)).toBeGreaterThanOrEqual(2);
      }
    }
    expect(planArenaChampion('inexistente', 0.5)).toBeUndefined();
  });
});
