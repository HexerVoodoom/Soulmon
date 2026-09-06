import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  // trocou `rookie.cap` de 6 para 0 e os 829 testes continuaram VERDES. `cap` é
  // o teto de atividades cadastradas que o save nasce com (`GameStateContext`,
  // linha do `maxActivityCap`) e `required` é o GATE de evolução — errar
  // qualquer um muda o jogo em silêncio.
  it('a TABELA é o contrato: os números exatos, não só a ordem entre eles', () => {
    expect(FORM_REQUIREMENTS).toEqual({
      rookie:   { required: 4, cap: 6 },
      champion: { required: 5, cap: 7 },
      ultimate: { required: 5, cap: 8 },
      mega:     { required: 6, cap: 9 },
      ultra:    { required: 6, cap: 10 },
    });
  });

  /**
   * ⚰️ `daysToEvolve` foi APAGADO em 06/09/2026 (decisão D5).
   *
   * Este teste existe para ele não voltar de fininho, e o motivo vale o
   * espaço: o campo parecia o gate e não era — nenhuma regra o consultava — e
   * mesmo morto enganou TRÊS consumidores diferentes, um por vez, cada um
   * consertado isoladamente sem ninguém perguntar por que o campo existia.
   * Um número morto ao lado do número vivo é um convite permanente ao engano,
   * e a mutação da rodada 7 mostrou que ele podia virar 0 sem quebrar nada.
   *
   * Se a evolução precisar escalar por semanas, mude `required` ou quem o
   * compara. **Não acrescente um segundo número a esta tabela.**
   */
  it('nenhum número de evolução paralelo volta para a tabela', () => {
    for (const level of order) {
      expect(Object.keys(FORM_REQUIREMENTS[level]).sort()).toEqual(['cap', 'required']);
    }
  });

  it('MAX_HP_BY_FORM também é contrato de números', () => {
    expect(MAX_HP_BY_FORM).toEqual({
      rookie: 3, champion: 3, ultimate: 3, mega: 4, ultra: 5,
    });
  });

  it('ultra é terminal — e quem garante isso é a ÁRVORE, não um número', () => {
    // Antes, "ultra é o fim" era afirmado por `daysToEvolve: 999`, uma
    // sentinela num campo que nada lia: a garantia era decorativa. Quem de
    // fato termina a linha é `getNextEvolution`, que devolve o PRÓPRIO estágio
    // quando não há para onde ir (ver `spriteTrigger.targetFormId`). O gate de
    // ultra é o mesmo `required` de todo mundo, e é por isso que ele não pode
    // ser menor que o do mega.
    expect(FORM_REQUIREMENTS.ultra.required)
      .toBeGreaterThanOrEqual(FORM_REQUIREMENTS.mega.required);
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

  // ⚰️ Aqui havia "a consistência ao longo de semanas é o que escala no topo",
  // afirmada sobre `daysToEvolve`. O teste passava e a afirmação era falsa: NADA
  // escalava, porque nada lia o campo. A escada real é `required`, que achata de
  // propósito (testado logo acima). Escalar por semanas continua sendo uma
  // opção de design legítima — mas terá de ser implementada, não declarada.

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

/**
 * ⚰️ O SUBSISTEMA DE NÚMEROS DE EVOLUÇÃO MORTOS (D5 / WP4.1, 06/09/2026).
 *
 * Eram QUATRO tabelas de números para uma regra só:
 *  1. `FORM_REQUIREMENTS.required` — a viva, comparada com `perfectDays`;
 *  2. `FORM_REQUIREMENTS.daysToEvolve` (10/20/30/40/999) — lida por ninguém;
 *  3. `EVOLVE_SEGMENTS` (7/9/11/14/999) no `App.tsx` — alimentava…
 *  4. …`digivolutionSegments`/`digivolutionSegmentsNeeded` no save, escritos em
 *     todo save de todo jogador e lidos por ninguém.
 *
 * As três últimas saíram juntas. Este guard existe porque a única defesa contra
 * um número morto é não deixar nascer o segundo: enquanto (2) existiu, ela
 * enganou o gate de sprite, o rótulo da barra da Evolução e o guia do jogador —
 * três consertos separados, nenhum deles perguntando por que o campo existia.
 */
describe('não existe segundo número de evolução (D5 / WP4.1)', () => {
  const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
  const semComentarios = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('`daysToEvolve` não existe em lugar nenhum do código de produção', () => {
    for (const f of ['src/types/progression.ts', 'src/App.tsx', 'src/components/GuideModal.tsx',
      'src/components/EvolutionPath.tsx', 'src/utils/dailyReset.ts']) {
      expect(semComentarios(ler(f)), `${f} ressuscitou \`daysToEvolve\``).not.toContain('daysToEvolve');
    }
  });

  it('`EVOLVE_SEGMENTS` e os campos de save que ele alimentava não voltaram', () => {
    const app = semComentarios(ler('src/App.tsx'));
    expect(app).not.toContain('EVOLVE_SEGMENTS');
    expect(app).not.toContain('digivolutionSegmentsNeeded');
    const ctx = semComentarios(ler('src/contexts/GameStateContext.tsx'));
    expect(ctx, 'o campo morto voltou ao GameState').not.toContain('digivolutionSegmentsNeeded');
  });

  it('quem decide a evolução manual continua sendo `required`', () => {
    const app = ler('src/App.tsx');
    const corpo = app.slice(app.indexOf('const handleEvolve = useCallback'));
    expect(corpo.slice(0, 600)).toMatch(/FORM_REQUIREMENTS\[getStageLevel\(prev\.evolutionStage\)\]\.required/);
  });
});
