import { describe, it, expect } from 'vitest';
import { PC, MOTIVE_LABEL, OBSTACLE_LABEL, PLAN_SUGGESTIONS, PERCEIVED_LABEL, DECISION_LABEL, YEAR_EXAMPLES, evidenceSentence } from './purposeCopy';
import { MOTIVE_KEYS, OBSTACLE_KEYS, PERCEIVED_KEYS, DECISION_KEYS } from './purpose';

type Bi = { pt: string; en: string };

// R4 do plano: linguagem descritiva, sem culpa e sem promessa. Palavra de cobrança em texto novo reprova.
const PROIBIDAS = /falh|fracass|culp|deveria|devia|tem que|tens que|obrigad|perdeu|perdid|atras|preguiç|desist|dívida|garant|prometo|você consegue|\bfail|should have|\bmust\b|have to|guarantee|promise|behind|lazy|give up|\bdebt\b/i;

const todos: Array<[string, Bi]> = [
  ...Object.entries(PC) as Array<[string, Bi]>,
  ...Object.entries(MOTIVE_LABEL).map(([k, v]): [string, Bi] => [`motive.${k}`, v]),
  ...Object.entries(OBSTACLE_LABEL).map(([k, v]): [string, Bi] => [`obstacle.${k}`, v]),
  ...PLAN_SUGGESTIONS.map((v, i): [string, Bi] => [`plan.${i}`, v]),
  ...Object.entries(PERCEIVED_LABEL).map(([k, v]): [string, Bi] => [`perceived.${k}`, v]),
  ...Object.entries(DECISION_LABEL).map(([k, v]): [string, Bi] => [`decision.${k}`, v]),
  ...Object.entries(YEAR_EXAMPLES).flatMap(([a, list]) => list.map((v, i): [string, Bi] => [`ex.${a}.${i}`, v])),
];

describe('purposeCopy', () => {
  it('toda chave dos tipos tem rótulo nos dois idiomas', () => {
    for (const k of MOTIVE_KEYS) expect(MOTIVE_LABEL[k].pt && MOTIVE_LABEL[k].en).toBeTruthy();
    for (const k of OBSTACLE_KEYS) expect(OBSTACLE_LABEL[k].pt && OBSTACLE_LABEL[k].en).toBeTruthy();
    for (const k of PERCEIVED_KEYS) expect(PERCEIVED_LABEL[k].pt && PERCEIVED_LABEL[k].en).toBeTruthy();
    for (const k of DECISION_KEYS) expect(DECISION_LABEL[k].pt && DECISION_LABEL[k].en).toBeTruthy();
    expect(MOTIVE_KEYS).toHaveLength(12); // 11 motivos + "outro"
  });
  it('paridade PT/EN: nenhum texto vazio nem igual nos dois idiomas (exceto nomes curtos)', () => {
    for (const [k, v] of todos) {
      expect(v.pt.trim(), k).not.toBe('');
      expect(v.en.trim(), k).not.toBe('');
      if (v.pt.length > 12) expect(v.pt, k).not.toBe(v.en);
    }
  });
  it('R4: nenhuma palavra de culpa, cobrança ou promessa', () => {
    for (const [k, v] of todos) {
      expect(v.pt, `${k} (pt)`).not.toMatch(PROIBIDAS);
      expect(v.en, `${k} (en)`).not.toMatch(PROIBIDAS);
    }
  });
  it('a evidência é dita como número, sem adjetivo', () => {
    expect(evidenceSentence(18, 22, true)).toBe('18 de 22');
    expect(evidenceSentence(18, 22, false)).toBe('18 of 22');
  });
});
