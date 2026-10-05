/**
 * Story PR2 (combate v3) — XP e level do Soulmon, derivados. Cada `describe`
 * leva o numero do criterio de aceite da story.
 */
import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, STAGE_LEVEL_CAPS, levelCapFor } from '../types/progression';
import { degeneratedPerfectDays } from './dailyReset';
import { mulberry32 } from './combate/rng';
import { MAX_LEVEL, firstLevelOfStage } from './combate/level';
import {
  dayXP, soulXP, soulLevel, levelFor, statPoints, soulCombatant, soulLevelLine, soulLevelLabel,
  XP_COMPLETE_DAY_SHARE, XP_COMPLETE_DAY, XP_EFFORT_MAX, XP_PER_LEVEL,
} from './soulXP';

const STAGES = Object.keys(FORM_REQUIREMENTS) as Array<keyof typeof FORM_REQUIREMENTS>;
const idOf = (s: string, branch = 'power') => (s === 'rookie' || s === 'ultra' ? s : `${s}-${branch}`);

describe('criterio 1 — soulLevel = min(levelFor(soulXP), levelCapFor(stage))', () => {
  it('o vetor de tetos vem de FORM_REQUIREMENTS, nao de lista escrita aqui', () => {
    let acc = 0;
    const esperado = STAGES.map(s => (acc += FORM_REQUIREMENTS[s].cap));
    expect([...STAGE_LEVEL_CAPS]).toEqual(esperado);
    STAGES.forEach((s, i) => expect(levelCapFor(idOf(s))).toBe(esperado[i]));
  });

  it('com dias de sobra o level trava no teto do estagio; nunca passa', () => {
    for (const s of STAGES) {
      const lv = soulLevel({ evolutionStage: idOf(s), perfectDays: 500 });
      expect(lv).toBe(levelCapFor(idOf(s)));
      expect(lv).toBeLessThanOrEqual(MAX_LEVEL);
    }
  });

  it('o level e exatamente o min das duas funcoes em amostra declarada', () => {
    for (const s of STAGES) for (let d = 0; d <= 14; d++) {
      const st = { evolutionStage: idOf(s), perfectDays: d };
      expect(soulLevel(st)).toBe(Math.min(levelFor(soulXP(st)), levelCapFor(st.evolutionStage)));
    }
  });

  it('o estagio novo comeca no primeiro level dele (a evolucao zera perfectDays, nao o level)', () => {
    STAGES.forEach((s, i) => expect(soulLevel({ evolutionStage: idOf(s), perfectDays: 0 })).toBe(firstLevelOfStage(i)));
  });

  it('lixo no save nunca lanca e cai em level 1', () => {
    for (const lixo of [undefined, null, NaN, -3, Infinity, 'x' as unknown as number]) {
      expect(soulLevel({ evolutionStage: 'qualquer', perfectDays: lixo as number })).toBe(1);
    }
  });
});

describe('criterio 2 — XP por esforco/meta, 66/34, nunca por contagem', () => {
  const SEMANA = 7;
  /** Dia com meta cumprida: `pesos` e a lista de pesos de esforco das tarefas. */
  const dia = (pesos: number[]) => {
    const total = pesos.reduce((a, b) => a + b, 0);
    return { complete: true, effortDone: total, effortGoal: total };
  };

  it('semana com meta cumprida todo dia: a fracao do dia completo fica em 66% +-5pp', () => {
    let doDia = 0, total = 0;
    for (let d = 0; d < SEMANA; d++) {
      const x = dayXP(dia([1, 2, 3]));
      doDia += dayXP({ ...dia([1, 2, 3]), effortDone: 0 });
      total += x;
    }
    const frac = doDia / total;
    expect(Math.abs(frac - XP_COMPLETE_DAY_SHARE)).toBeLessThanOrEqual(0.05);
  });

  it('dobrar o NUMERO de tarefas com o mesmo esforco total nao muda o XP', () => {
    const quatro = dia([2, 2, 1, 1]);        // esforco total 6, 4 tarefas
    const oito = dia([1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5]); // 8 tarefas, total 6
    expect(oito.effortDone).toBe(quatro.effortDone);
    expect(dayXP(oito)).toBe(dayXP(quatro));
  });

  /** A regra #16 como predicado: o XP so pode depender do esforco, nunca de quantas tarefas. */
  const invarianteDeContagem = (xpDe: (pesos: number[]) => number) => {
    const pesosA = [2, 2, 1, 1];                       // 4 tarefas, esforco 6
    const pesosB = [1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5];   // 8 tarefas, esforco 6
    return xpDe(pesosA) === xpDe(pesosB);
  };
  const xpReal = (pesos: number[]) => dayXP(dia(pesos));
  const xpPorContagem = (pesos: number[]) => XP_COMPLETE_DAY + XP_EFFORT_MAX * Math.min(1, pesos.length / 8);

  it('o predicado pega a regra #16: o XP real passa, o XP por contagem reprova', () => {
    expect(invarianteDeContagem(xpReal)).toBe(true);
    expect(invarianteDeContagem(xpPorContagem)).toBe(false);
  });

  it('esforco acima da meta nao rende mais (teto da parcela)', () => {
    expect(dayXP({ complete: true, effortDone: 99, effortGoal: 6 })).toBe(XP_PER_LEVEL);
  });

  it('um dia perfeito vale exatamente um level (XP_PER_LEVEL)', () => {
    expect(dayXP(dia([1, 1, 1, 1]))).toBe(XP_PER_LEVEL);
  });
});

describe('criterio 3 — invariante do total (mesmo estagio + mesmo level => mesmos pontos)', () => {
  const N = 400;
  it(`gerador de ${N} estados (semente fixa): statPoints so depende do level, com Glitchtama, degeneracao e zerar`, () => {
    const r = mulberry32(20261005);
    const porChave = new Map<string, number>();
    for (let i = 0; i < N; i++) {
      const s = STAGES[Math.floor(r() * STAGES.length)];
      let perfectDays = Math.floor(r() * 14);
      const glitchtama = r() < 0.4 ? 1 + Math.floor(r() * 3) : 0;   // soma em perfectDays, nao em totalPerfectDays
      perfectDays += glitchtama;
      if (r() < 0.3) perfectDays = degeneratedPerfectDays(perfectDays, s);     // degeneracao
      if (r() < 0.2) perfectDays = 0;                                          // zerar na evolucao
      const st = { evolutionStage: idOf(s, ['power', 'harmony', 'benevolence'][Math.floor(r() * 3)]), perfectDays,
        powerPoints: Math.floor(r() * 50), harmonyPoints: Math.floor(r() * 50), benevolencePoints: Math.floor(r() * 50) };
      const lv = soulLevel(st);
      const pts = statPoints(lv);
      const c = soulCombatant(st);
      const chave = `${s}:${lv}`;
      if (porChave.has(chave)) expect(pts).toBe(porChave.get(chave));
      else porChave.set(chave, pts);
      // pontos distribuidos + base do estagio batem com o level
      const base = Math.ceil(1.5 ** STAGES.indexOf(s));
      expect(c.atk + c.def + c.spd - 3 * base).toBe(pts);
    }
    expect(porChave.size).toBeGreaterThan(10);
  });

  it('a Glitchtama (perfectDays +1, totalPerfectDays igual) sobe o level como um dia real', () => {
    const sem = soulLevel({ evolutionStage: 'champion-power', perfectDays: 2 });
    const com = soulLevel({ evolutionStage: 'champion-power', perfectDays: 3 });
    expect(com).toBe(sem + 1);
  });
});

describe('criterio 4 — desce e volta, sem XP guardado', () => {
  it('degenerar baixa o level; recuperar devolve o MESMO level e os MESMOS stats', () => {
    const antes = { evolutionStage: 'mega-power', perfectDays: 6, powerPoints: 40, harmonyPoints: 10, benevolencePoints: 12 };
    const caiu = { ...antes, evolutionStage: 'ultimate-power', perfectDays: degeneratedPerfectDays(antes.perfectDays, 'ultimate') };
    expect(soulLevel(caiu)).toBeLessThan(soulLevel(antes));
    const voltou = { ...caiu, evolutionStage: antes.evolutionStage, perfectDays: antes.perfectDays };
    expect(soulLevel(voltou)).toBe(soulLevel(antes));
    expect(soulCombatant(voltou)).toEqual(soulCombatant(antes));
  });

  it('soulXP e puro: nada alem do proprio estado entra (duas chamadas, mesmo resultado)', () => {
    const st = { evolutionStage: 'ultimate-harmony', perfectDays: 4 };
    expect(soulXP(st)).toBe(soulXP({ ...st }));
  });
});

describe('criterio 5 - a copy do level que desceu e neutra', () => {
  it('o rotulo e Lv N, nunca a palavra nivel/level; EN primeiro, depois PT-BR', () => {
    expect(soulLevelLabel(7)).toBe('Lv 7');
    for (const lang of ['en-US', 'pt-BR']) expect(soulLevelLine(7, true, lang)).not.toMatch(/n[ií]vel|level/i);
    expect(soulLevelLine(7, true, 'en-US')).toMatch(/full days/);
    expect(soulLevelLine(7, true, 'pt-BR')).toMatch(/dias completos/);
  });
  // A varredura de frase de perda/FOMO sobre estas strings mora em copy.semFomo.contract.test.ts.
});
