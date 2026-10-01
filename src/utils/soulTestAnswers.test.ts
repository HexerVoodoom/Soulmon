import { describe, it, expect } from 'vitest';
import { sanitizeSoulTestAnswers } from './soulTestAnswers';

describe('sanitizeSoulTestAnswers (as 20 do teste no save, 01/10/2026)', () => {
  it('passa os três formatos que o ritual grava', () => {
    const a = {
      'O-ima-1': { kind: 'likert', value: 4 },
      'J-EI-1': { kind: 'forced-choice', choice: 'b' },
      'S-1': { kind: 'scenario', optionId: 'a' },
    };
    expect(sanitizeSoulTestAnswers(a)).toEqual(a);
  });

  it('descarta o malformado e devolve undefined quando nada sobra', () => {
    expect(sanitizeSoulTestAnswers({ x: { kind: 'likert', value: 9 } })).toBeUndefined();
    expect(sanitizeSoulTestAnswers({ x: { kind: 'forced-choice', choice: 'c' } })).toBeUndefined();
    expect(sanitizeSoulTestAnswers('lixo')).toBeUndefined();
    expect(sanitizeSoulTestAnswers([])).toBeUndefined();
    expect(sanitizeSoulTestAnswers({})).toBeUndefined();
    expect(sanitizeSoulTestAnswers({ ok: { kind: 'likert', value: 2 }, ruim: 3 })).toEqual({ ok: { kind: 'likert', value: 2 } });
  });

  it('não copia campo extra (o save vem da nuvem)', () => {
    expect(sanitizeSoulTestAnswers({ x: { kind: 'likert', value: 1, extra: 'y' } })).toEqual({ x: { kind: 'likert', value: 1 } });
  });
});
