/**
 * WP1.7 — rascunho do ritual do Oráculo.
 *
 * O que se trava aqui: retomável só no mesmo modo, só entre o passo 1 e o
 * último item do teste; nunca carrega e-mail/idade/resultado; sobrevive a
 * lixo no storage sem lançar; e `clear` apaga de verdade.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { installFakeStorage } from '../test/renderEnv';
import {
  readOracleDraft, writeOracleDraft, clearOracleDraft, ORACLE_DRAFT_FORBIDDEN_KEYS, ORACLE_DRAFT_VERSION,
} from './oracleDraft';
import { STORAGE_KEYS } from './storageKeys';

const base = {
  mode: 'onboarding' as const,
  step: 3,
  soulGoal: 'dormir melhor',
  soulStruggle: '',
  fullName: 'Maria da Silva',
  birthDate: '1990-05-04',
  birthDateText: '04/05/1990',
  birthTime: '08:30',
  birthCity: null,
  timeUnknown: false,
  favoriteCreature: '',
  skipFavorite: false,
  answers: { q1: 'a' },
  testAnswers: {},
  refine: null,
  consent: { acceptedAt: '2026-09-03T10:00:00.000Z', termsVersion: '1', privacyVersion: '1' },
};

describe('oracleDraft (WP1.7)', () => {
  beforeEach(() => { installFakeStorage(); clearOracleDraft(); });

  it('grava e lê de volta o mesmo rascunho, com versão e carimbo', () => {
    expect(writeOracleDraft(base, new Date('2026-09-03T12:00:00Z'))).toBe(true);
    const d = readOracleDraft('onboarding', 40);
    expect(d).not.toBeNull();
    expect(d!.v).toBe(ORACLE_DRAFT_VERSION);
    expect(d!.step).toBe(3);
    expect(d!.fullName).toBe('Maria da Silva');
    expect(d!.consent?.acceptedAt).toBe('2026-09-03T10:00:00.000Z');
    expect(d!.savedAt).toBe('2026-09-03T12:00:00.000Z');
  });

  it('não retoma em outro modo, nem no passo 0, nem depois do último item do teste', () => {
    writeOracleDraft(base);
    expect(readOracleDraft('upgrade', 40)).toBeNull();
    writeOracleDraft({ ...base, step: 0 });
    expect(readOracleDraft('onboarding', 40)).toBeNull();
    writeOracleDraft({ ...base, step: 41 });
    expect(readOracleDraft('onboarding', 40)).toBeNull();
    writeOracleDraft({ ...base, step: 40 });
    expect(readOracleDraft('onboarding', 40)?.step).toBe(40);
  });

  it('lixo no storage devolve null sem lançar; versão errada idem', () => {
    localStorage.setItem(STORAGE_KEYS.ORACLE_DRAFT, '{not json');
    expect(readOracleDraft('onboarding', 40)).toBeNull();
    localStorage.setItem(STORAGE_KEYS.ORACLE_DRAFT, JSON.stringify({ ...base, v: 99 }));
    expect(readOracleDraft('onboarding', 40)).toBeNull();
    localStorage.setItem(STORAGE_KEYS.ORACLE_DRAFT, JSON.stringify({ ...base, v: 1, step: 'três' }));
    expect(readOracleDraft('onboarding', 40)).toBeNull();
  });

  it('a decisão SEM VOLTA volta como está: refine true/false/null', () => {
    for (const refine of [true, false, null] as const) {
      writeOracleDraft({ ...base, refine });
      expect(readOracleDraft('onboarding', 40)?.refine).toBe(refine);
    }
  });

  it('o rascunho gravado nunca carrega e-mail, idade do demo, resultado ou cadastro', () => {
    writeOracleDraft(base);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORACLE_DRAFT)!) as Record<string, unknown>;
    for (const k of ORACLE_DRAFT_FORBIDDEN_KEYS) expect(raw, k).not.toHaveProperty(k);
  });

  it('clear apaga de verdade', () => {
    writeOracleDraft(base);
    clearOracleDraft();
    expect(localStorage.getItem(STORAGE_KEYS.ORACLE_DRAFT)).toBeNull();
    expect(readOracleDraft('onboarding', 40)).toBeNull();
  });
});

// QA1 (rodada 6) — o rascunho do ritual não validava a FORMA do que lê
// (o do portão, `gateDraft`, valida). Storage é dado não confiável.
describe('oracleDraft — forma do que vem do storage (QA1)', () => {
  beforeEach(() => { installFakeStorage(); clearOracleDraft(); });
  const gravaCru = (extra: Record<string, unknown>) => localStorage.setItem(
    STORAGE_KEYS.ORACLE_DRAFT,
    JSON.stringify({ v: ORACLE_DRAFT_VERSION, mode: 'onboarding', step: 3, savedAt: 'x', ...extra }),
  );

  it('`answers` só mantém pares texto→texto (array e valores soltos saem)', () => {
    gravaCru({ answers: { q1: 'a', q2: 5, q3: { x: 1 } } });
    expect(readOracleDraft('onboarding', 40)!.answers).toEqual({ q1: 'a' });
    gravaCru({ answers: ['a', 'b'] });
    expect(readOracleDraft('onboarding', 40)!.answers).toEqual({});
  });

  it('`testAnswers` só mantém respostas com a forma de likert/forced-choice/scenario', () => {
    gravaCru({ testAnswers: {
      i1: { kind: 'likert', value: 4 },
      i2: { kind: 'likert', value: 99 },
      i3: 5,
      i4: { kind: 'forced-choice', choice: 'b' },
      i5: null,
    } });
    expect(readOracleDraft('onboarding', 40)!.testAnswers).toEqual({
      i1: { kind: 'likert', value: 4 },
      i4: { kind: 'forced-choice', choice: 'b' },
    });
    gravaCru({ testAnswers: [1, 2, 3] });
    expect(readOracleDraft('onboarding', 40)!.testAnswers).toEqual({});
  });

  it('`birthCity` sem nome/fuso/coordenadas finitas vira null (não chega ao mapa astral)', () => {
    gravaCru({ birthCity: {} });
    expect(readOracleDraft('onboarding', 40)!.birthCity).toBeNull();
    gravaCru({ birthCity: { name: 'X', region: '', country: 'BR', latitude: 'a', longitude: 1, timeZone: 'America/Sao_Paulo' } });
    expect(readOracleDraft('onboarding', 40)!.birthCity).toBeNull();
    const ok = { name: 'Aracaju', region: 'SE', country: 'BR', latitude: -10.9, longitude: -37, timeZone: 'America/Maceio' };
    gravaCru({ birthCity: ok });
    expect(readOracleDraft('onboarding', 40)!.birthCity).toEqual(ok);
  });
});
