import { describe, it, expect } from 'vitest';
import {
  BALAO_PRIORIDADE, balaoKey, dispensar, escolherBalao, foiDispensado, sanitizeBalaoDourado, balaoDouradoText, balaoDouradoAria,
  BALAO_DOURADO_VISIVEL_MS, BALAO_IGNORADOS_PARA_DISPENSAR, registrarIgnorado, sanitizeBalaoIgnorados,
} from './balaoDourado';

const D1 = '2026-11-15';
const D2 = '2026-11-16';

describe('balões dourados: chave, dispensa e persistência diária (G5)', () => {
  it('a chave é balaoDourado:<tipo>:<AAAA-MM-DD>', () => {
    expect(balaoKey('grove', D1)).toBe('balaoDourado:grove:2026-11-15');
  });
  it('dispensar grava o dia; no MESMO dia não reaparece, no dia seguinte volta', () => {
    const reg = dispensar(undefined, 'rift', D1);
    expect(foiDispensado(reg, 'rift', D1)).toBe(true);
    expect(escolherBalao({ rift: true }, reg, D1)).toBeNull();
    expect(escolherBalao({ rift: true }, reg, D2)).toBe('rift');
  });
  it('é por TIPO: dispensar um não apaga os outros', () => {
    const reg = dispensar(undefined, 'achado', D1);
    expect(escolherBalao({ achado: true, rift: true }, reg, D1)).toBe('rift');
  });
  it('idempotente: dispensar de novo devolve o MESMO objeto (sem regravar o save)', () => {
    const reg = dispensar(undefined, 'grove', D1);
    expect(dispensar(reg, 'grove', D1)).toBe(reg);
  });
  it('só guarda o dia corrente: as chaves de outros dias caem (o campo não cresce)', () => {
    const reg = dispensar(dispensar(undefined, 'grove', D1), 'rift', D2);
    expect(Object.keys(reg)).toEqual([balaoKey('rift', D2)]);
  });
  it('dia inválido não grava nada', () => {
    expect(dispensar(undefined, 'grove', 'ontem')).toEqual({});
  });
  it('leitura tolerante do save: lixo, tipo desconhecido e valor falso saem', () => {
    expect(sanitizeBalaoDourado(null)).toBeUndefined();
    expect(sanitizeBalaoDourado([1, 2])).toBeUndefined();
    expect(sanitizeBalaoDourado({ 'balaoDourado:grove:2026-11-15': true, 'balaoDourado:x:2026-11-15': true, 'balaoDourado:rift:2026-11-15': 1, lixo: true }))
      .toEqual({ 'balaoDourado:grove:2026-11-15': true });
    expect(sanitizeBalaoDourado({ __proto__: { 'balaoDourado:grove:2026-11-15': true } })).toBeUndefined();
  });
});

describe('fila por prioridade, um visível (G6)', () => {
  it('a ordem é Bosque sob ataque > Fenda > achado', () => {
    expect(BALAO_PRIORIDADE).toEqual(['grove', 'rift', 'achado']);
    expect(escolherBalao({ grove: true, rift: true, achado: true }, undefined, D1)).toBe('grove');
  });
  it('o dispensado libera o próximo, um por vez', () => {
    let reg = undefined as ReturnType<typeof dispensar> | undefined;
    const todos = { grove: true, rift: true, achado: true } as const;
    expect(escolherBalao(todos, reg, D1)).toBe('grove');
    reg = dispensar(reg, 'grove', D1);
    expect(escolherBalao(todos, reg, D1)).toBe('rift');
    reg = dispensar(reg, 'rift', D1);
    expect(escolherBalao(todos, reg, D1)).toBe('achado');
    reg = dispensar(reg, 'achado', D1);
    expect(escolherBalao(todos, reg, D1)).toBeNull();
  });
  it('sem condição não aparece (G4: sem ataque, sem balão do Bosque)', () => {
    expect(escolherBalao({ grove: false }, undefined, D1)).toBeNull();
    expect(escolherBalao({}, undefined, D1)).toBeNull();
  });
});

describe('falas e rótulos (G7, G8)', () => {
  for (const t of BALAO_PRIORIDADE) {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      it(`${t}/${lang}: fala sem cobrança, sem número e rótulo com o destino`, () => {
        const f = balaoDouradoText(t, lang);
        expect(f.length).toBeGreaterThan(8);
        expect(f).not.toMatch(/\d/);
        expect(f).not.toMatch(/n[ãa]o perca|don'?t miss|rápido|hurry|culpa|você precisa|you must|tarefas? pendentes?/i);
        expect(balaoDouradoAria(t, lang).length).toBeGreaterThan(3);
      });
    }
  }
  it('o balão do Bosque anuncia o destino', () => {
    expect(balaoDouradoAria('grove', 'pt-BR')).toBe('Abrir o Bosque');
    expect(balaoDouradoAria('grove', 'en-US')).toBe('Open the Grove');
  });
});

describe('§383: "Se ignorar 2x ou 5s dispensa"', () => {
  it('constantes: 5 s na tela, 2 ignorados', () => {
    expect(BALAO_DOURADO_VISIVEL_MS).toBe(5000);
    expect(BALAO_IGNORADOS_PARA_DISPENSAR).toBe(2);
  });
  it('o 1º ignorado só conta; o 2º do mesmo dia dispensa', () => {
    const a = registrarIgnorado(undefined, 'rift', D1);
    expect(a).toEqual({ reg: { [balaoKey('rift', D1)]: 1 }, dispensa: false });
    const b = registrarIgnorado(a.reg, 'rift', D1);
    expect(b.dispensa).toBe(true);
    expect(b.reg[balaoKey('rift', D1)]).toBe(2);
  });
  it('a contagem é por tipo e por dia: o dia seguinte recomeça (e solta o anterior)', () => {
    const a = registrarIgnorado(undefined, 'rift', D1);
    expect(registrarIgnorado(a.reg, 'grove', D1).dispensa).toBe(false);
    const b = registrarIgnorado(a.reg, 'rift', D2);
    expect(b).toEqual({ reg: { [balaoKey('rift', D2)]: 1 }, dispensa: false });
  });
  it('dia inválido não conta nem dispensa', () => {
    expect(registrarIgnorado(undefined, 'rift', 'ontem')).toEqual({ reg: {}, dispensa: false });
  });
  it('leitura tolerante do aparelho', () => {
    expect(sanitizeBalaoIgnorados(null)).toEqual({});
    expect(sanitizeBalaoIgnorados([1])).toEqual({});
    expect(sanitizeBalaoIgnorados({ [balaoKey('rift', D1)]: 1, 'balaoDourado:xyz:2026-11-15': 1, [balaoKey('grove', D1)]: 'x', [balaoKey('achado', D1)]: 1.5 }))
      .toEqual({ [balaoKey('rift', D1)]: 1 });
  });
  it('o 2º ignorado grava o MESMO registro do toque: o balão não volta no dia', () => {
    const reg = dispensar(undefined, 'grove', D1);
    expect(escolherBalao({ grove: true }, reg, D1)).toBeNull();
    expect(escolherBalao({ grove: true }, reg, D2)).toBe('grove');
  });
});
