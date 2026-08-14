import { describe, it, expect } from 'vitest';
import {
  getStageLevel, getStageBranch, canSelectWeekdays, FORM_REQUIREMENTS, MAX_HP_BY_FORM,
  clampBranch, AVAILABLE_BRANCHES,
} from './progression';

describe('getStageLevel', () => {
  it('maps rookie', () => {
    expect(getStageLevel('rookie')).toBe('rookie');
  });

  it('maps champion/ultimate/mega ids by prefix, regardless of branch', () => {
    expect(getStageLevel('champion-virus')).toBe('champion');
    expect(getStageLevel('champion-data')).toBe('champion');
    expect(getStageLevel('champion-vaccine')).toBe('champion');
    expect(getStageLevel('ultimate-virus')).toBe('ultimate');
    expect(getStageLevel('mega-data')).toBe('mega');
  });

  it('maps ultra', () => {
    expect(getStageLevel('ultra')).toBe('ultra');
  });

  it('classifies legacy static names (dungeon wild roster / sprite fallback)', () => {
    expect(getStageLevel('tapirmon')).toBe('rookie');
    expect(getStageLevel('tuskmon')).toBe('champion');
    expect(getStageLevel('gigadramon')).toBe('ultimate');
    expect(getStageLevel('gaioumon')).toBe('mega');
    expect(getStageLevel('gaioumon-itto')).toBe('ultra');
  });

  it('falls back to rookie for unknown stages', () => {
    expect(getStageLevel('unknown-creature')).toBe('rookie');
  });
});

describe('getStageBranch', () => {
  it('extracts the attribute embedded in the id', () => {
    expect(getStageBranch('champion-virus')).toBe('virus');
    expect(getStageBranch('mega-vaccine')).toBe('vaccine');
  });

  it('returns null when there is no branch (rookie/ultra/legacy names)', () => {
    expect(getStageBranch('rookie')).toBeNull();
    expect(getStageBranch('ultra')).toBeNull();
    expect(getStageBranch('tapirmon')).toBeNull();
  });
});

describe('canSelectWeekdays', () => {
  it('is always true — the Soulmon tree starts at rookie, no pre-rookie stages', () => {
    expect(canSelectWeekdays('rookie')).toBe(true);
    expect(canSelectWeekdays('champion-virus')).toBe(true);
    expect(canSelectWeekdays('ultra')).toBe(true);
  });
});

describe('FORM_REQUIREMENTS consistency', () => {
  const order = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;

  // ATENÇÃO — este é o único caso que olha para os NÚMEROS. Todos os outros
  // deste bloco afirmam RELAÇÕES (`>=`, `>`), e relação sobrevive a quase
  // qualquer valor: a rodada 7 (mutation testing, `scripts/mutation-sweep.mjs`)
  // trocou `rookie.cap` de 6 para 0, `rookie.daysToEvolve` de 10 para 0 e
  // `ultra.daysToEvolve` de 999 para 0 e os 829 testes continuaram VERDES.
  // `cap` é o teto de atividades cadastradas que o save nasce com
  // (`GameStateContext` linha do `maxActivityCap`) e `daysToEvolve` é o número
  // que o guia mostra ao jogador — errar qualquer um muda o jogo em silêncio.
  it('a TABELA é o contrato: os números exatos, não só a ordem entre eles', () => {
    expect(FORM_REQUIREMENTS).toEqual({
      rookie:   { required: 4, cap: 6,  daysToEvolve: 10 },
      champion: { required: 5, cap: 7,  daysToEvolve: 20 },
      ultimate: { required: 5, cap: 8,  daysToEvolve: 30 },
      mega:     { required: 6, cap: 9,  daysToEvolve: 40 },
      // 999 é SENTINELA de "não há próximo estágio", e o laço de monotonia
      // abaixo pula justamente o último índice — por isso ele passava com 0.
      ultra:    { required: 6, cap: 10, daysToEvolve: 999 },
    });
  });

  it('MAX_HP_BY_FORM também é contrato de números', () => {
    expect(MAX_HP_BY_FORM).toEqual({
      rookie: 3, champion: 3, ultimate: 3, mega: 4, ultra: 5,
    });
  });

  it('ultra é terminal: exige mais dias que qualquer estágio anterior', () => {
    // O laço de `daysToEvolve` crescente termina em `order.length - 1`, ou seja
    // NUNCA olha para ultra. Sem esta linha, ultra podia evoluir "de graça".
    for (const level of order) {
      if (level === 'ultra') continue;
      expect(FORM_REQUIREMENTS.ultra.daysToEvolve).toBeGreaterThan(FORM_REQUIREMENTS[level].daysToEvolve);
    }
  });

  // A carga DIÁRIA nunca diminui, mas achata no topo de propósito: o que deve
  // crescer nos estágios finais é a consistência ao longo de semanas
  // (daysToEvolve), não quantas tarefas cabem num dia. Exigência diária que
  // sobe sem parar é o que faz o jogador desistir no terço final.
  it('required nunca diminui de um estágio para o outro', () => {
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].required).toBeGreaterThanOrEqual(
        FORM_REQUIREMENTS[order[i - 1]].required,
      );
    }
  });

  it('a carga diária achata no topo em vez de escalar indefinidamente', () => {
    const primeiroPasso = FORM_REQUIREMENTS.champion.required - FORM_REQUIREMENTS.rookie.required;
    const ultimoPasso = FORM_REQUIREMENTS.ultra.required - FORM_REQUIREMENTS.mega.required;
    expect(ultimoPasso).toBeLessThan(primeiroPasso);
    // Teto duro: nenhum estágio pode exigir mais que 6 tarefas por dia.
    for (const level of order) {
      expect(FORM_REQUIREMENTS[level].required).toBeLessThanOrEqual(6);
    }
  });

  it('a consistência ao longo de semanas é o que escala no topo', () => {
    for (let i = 1; i < order.length - 1; i++) {
      expect(FORM_REQUIREMENTS[order[i]].daysToEvolve).toBeGreaterThan(
        FORM_REQUIREMENTS[order[i - 1]].daysToEvolve,
      );
    }
  });

  it('cap increases monotonically across stages', () => {
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].cap).toBeGreaterThan(
        FORM_REQUIREMENTS[order[i - 1]].cap,
      );
    }
  });
});

// `clampBranch` é chamado por `getNextEvolution` (utils/dailyReset.ts) e pelo
// seletor da página de Evolução, e não tinha NENHUM teste: a rodada 7 trocou o
// fallback `AVAILABLE_BRANCHES[0]` por `[1]` sem quebrar nada.
describe('clampBranch', () => {
  it('devolve o galho quando ele está disponível', () => {
    for (const b of AVAILABLE_BRANCHES) expect(clampBranch(b)).toBe(b);
  });

  it('galho fora da lista cai no PRIMEIRO disponível, não num qualquer', () => {
    // O save vem do localStorage/nuvem: `currentBranch` é dado não confiável e
    // o tipo do TS não vale nada em runtime.
    expect(clampBranch('inexistente' as never)).toBe(AVAILABLE_BRANCHES[0]);
    expect(clampBranch('inexistente' as never)).toBe('virus');
  });
});

describe('MAX_HP_BY_FORM', () => {
  it('all stages have positive HP', () => {
    const stages = Object.keys(MAX_HP_BY_FORM) as (keyof typeof MAX_HP_BY_FORM)[];
    stages.forEach(stage => {
      expect(MAX_HP_BY_FORM[stage]).toBeGreaterThan(0);
    });
  });

  it('ultra has highest HP', () => {
    expect(MAX_HP_BY_FORM['ultra']).toBeGreaterThan(MAX_HP_BY_FORM['mega']);
  });
});
