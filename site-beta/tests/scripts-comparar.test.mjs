import { describe, it, expect } from 'vitest';
import { canonBetaEmail, comparar, resumo, lerEntradas, mascarar } from '../scripts/comparar-beta-emails.mjs';

describe('paridade com canonBetaEmail do app (_betaAccess.js)', () => {
  it.each([
    ['  Ana@Example.com ', 'ana@example.com'],
    ['a.na+x@gmail.com', 'ana@gmail.com'],
    ['A.Na@googlemail.com', 'ana@gmail.com'],
    ['a.na+x@example.com', 'a.na+x@example.com'],
    ['semarroba', 'semarroba'],
  ])('%s', (i, o) => expect(canonBetaEmail(i)).toBe(o));
});

describe('comparacao', () => {
  const atual = 'ana@gmail.com, bob@example.com;cris@example.com\nbob@example.com lixo';
  const test = 'email,nome\na.na+x@gmail.com,A\ndora@example.com,D\nBOB@example.com,B\n';
  const r = comparar(atual, test);
  it('conta', () => {
    expect([...r.ambos].sort()).toEqual(['ana@gmail.com', 'bob@example.com']);
    expect(r.faltam).toEqual(['dora@example.com']);
    expect(r.aMais).toEqual(['cris@example.com']);
    expect(r.atual.duplicatas).toEqual(['bob@example.com']);
    expect(r.atual.invalidos).toEqual(['lixo']);
    expect(r.uniao).toEqual(['ana@gmail.com', 'bob@example.com', 'cris@example.com', 'dora@example.com']);
  });
  it('resumo so tem iniciais mascaradas', () => {
    const s = resumo(r);
    expect(s).toContain('d***@example.com');
    expect(s).not.toContain('dora@');
    expect(s).toContain('regra do Gmail');
  });
  it('gmail: variantes viram uma so e sao avisadas', () => {
    const j = comparar('a.b@gmail.com,ab+x@gmail.com', 'ab@gmail.com');
    expect(j.atual.conjunto.size).toBe(1);
    expect(j.atual.juntadas).toEqual(['ab@gmail.com']);
  });
  it('lista simples e mascara', () => {
    expect(lerEntradas('a@x.com;b@x.com c@x.com')).toHaveLength(3);
    expect(mascarar('joao@gmail.com')).toBe('j***@gmail.com');
  });
});
