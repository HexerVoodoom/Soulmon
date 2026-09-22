/**
 * QA (rodada A, 21/09/2026) — matriz consent × versões × avisoVisto de
 * `precisaAvisarTermos`, incluindo o que `termsNotice.test.ts` não cobre:
 * versão FUTURA no save (nuvem à frente do aparelho), `avisoVisto` torto,
 * versão malformada dos DOIS lados, e a fronteira exata (igual não avisa).
 */
import { describe, it, expect } from 'vitest';
import { marcaAvisoTermos, precisaAvisarTermos } from './termsNotice';
import type { ConsentRecord } from './consent';

const T = '2026-09-21';
const P = '2026-09-21';
const c = (termsVersion: string, privacyVersion: string): ConsentRecord =>
  ({ acceptedAt: '2026-08-25T10:00:00Z', termsVersion, privacyVersion });

describe('precisaAvisarTermos — matriz', () => {
  it('versão FUTURA no save (save veio de um app mais novo) NÃO avisa', () => {
    expect(precisaAvisarTermos(c('2027-01-01', '2027-01-01'), T, P)).toBe(false);
    expect(precisaAvisarTermos(c('2027-01-01', P), T, P)).toBe(false);
    expect(precisaAvisarTermos(c(T, '2026-12-31'), T, P)).toBe(false);
  });

  it('um documento futuro e o outro anterior → avisa (o anterior manda)', () => {
    expect(precisaAvisarTermos(c('2027-01-01', '2026-01-01'), T, P)).toBe(true);
    expect(precisaAvisarTermos(c('2026-01-01', '2027-01-01'), T, P)).toBe(true);
  });

  it('fronteira: igual não avisa; um dia antes avisa', () => {
    expect(precisaAvisarTermos(c(T, P), T, P)).toBe(false);
    expect(precisaAvisarTermos(c('2026-09-20', P), T, P)).toBe(true);
    expect(precisaAvisarTermos(c(T, '2026-09-20'), T, P)).toBe(true);
  });

  it('avisoVisto de versão antiga, torto ou vazio não silencia', () => {
    const velho = c('2026-08-25', '2026-08-25');
    for (const visto of [marcaAvisoTermos('2026-08-25', '2026-08-25'), '', 'lixo', `${T}|`, `|${P}`, `${T}|${P}|extra`, marcaAvisoTermos(P, T).split('|').reverse().join('|') + 'x']) {
      expect(precisaAvisarTermos(velho, T, P, visto), `visto=${JSON.stringify(visto)}`).toBe(true);
    }
  });

  it('avisoVisto exato silencia MESMO com consentimento ilegível', () => {
    expect(precisaAvisarTermos(c('desconhecida', 'desconhecida'), T, P, marcaAvisoTermos(T, P))).toBe(false);
  });

  it('versão malformada no save (não é AAAA-MM-DD) conta como anterior — inclusive formatos "quase" certos', () => {
    for (const v of ['2026-9-21', '21/09/2026', '2026-09-21T00:00:00Z', 'v2', ' 2026-09-21', '']) {
      expect(precisaAvisarTermos(c(v, P), T, P), `terms=${JSON.stringify(v)}`).toBe(true);
    }
  });

  it('consent com campos de tipo errado (vindo da nuvem sem normalizar) não lança', () => {
    const torto = { acceptedAt: 1, termsVersion: 20260921, privacyVersion: null } as unknown as ConsentRecord;
    expect(() => precisaAvisarTermos(torto, T, P)).not.toThrow();
  });

  it('marcaAvisoTermos é injetiva para as versões válidas (não colide trocando a ordem)', () => {
    expect(marcaAvisoTermos('2026-01-01', '2026-02-02')).not.toBe(marcaAvisoTermos('2026-02-02', '2026-01-01'));
  });
});
