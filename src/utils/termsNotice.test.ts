/**
 * `precisaAvisarTermos` — decisão #24 do QA geral: banner informativo quando a
 * versão dos Termos/Política sobe; nunca bloqueio, nunca para quem não tem
 * registro de consentimento.
 */
import { describe, it, expect } from 'vitest';
import { marcaAvisoTermos, precisaAvisarTermos } from './termsNotice';
import { PRIVACY_VERSION, TERMS_VERSION, buildConsentRecord, normalizeConsent } from './consent';

const T = '2026-09-21';
const P = '2026-09-21';

describe('precisaAvisarTermos', () => {
  it('save SEM consentimento (anterior aos Termos) não vê banner — o primeiro aceite é do onboarding', () => {
    expect(precisaAvisarTermos(undefined, T, P)).toBe(false);
    expect(precisaAvisarTermos(null, T, P)).toBe(false);
  });

  it('consentimento na versão atual: nada a avisar', () => {
    const atual = buildConsentRecord(new Date('2026-09-21T10:00:00Z'));
    expect(precisaAvisarTermos(atual, TERMS_VERSION, PRIVACY_VERSION)).toBe(false);
  });

  it('versão anterior de QUALQUER um dos dois documentos avisa', () => {
    const base = { acceptedAt: '2026-08-25T10:00:00Z' };
    expect(precisaAvisarTermos({ ...base, termsVersion: '2026-08-25', privacyVersion: P }, T, P)).toBe(true);
    expect(precisaAvisarTermos({ ...base, termsVersion: T, privacyVersion: '2026-09-08' }, T, P)).toBe(true);
  });

  it('versão ilegível (`normalizeConsent` sem o campo) conta como anterior — convida a ler, não bloqueia', () => {
    const c = normalizeConsent({ acceptedAt: '2026-08-25T10:00:00Z' });
    expect(c?.termsVersion).toBe('desconhecida');
    expect(precisaAvisarTermos(c, T, P)).toBe(true);
  });

  it('"Ok" gravado para ESTA versão silencia; para uma versão mais velha, não', () => {
    const velho = { acceptedAt: '2026-08-25T10:00:00Z', termsVersion: '2026-08-25', privacyVersion: '2026-08-25' };
    expect(precisaAvisarTermos(velho, T, P, marcaAvisoTermos(T, P))).toBe(false);
    expect(precisaAvisarTermos(velho, T, P, marcaAvisoTermos('2026-09-08', '2026-09-08'))).toBe(true);
    expect(precisaAvisarTermos(velho, T, P, null)).toBe(true);
  });
});
