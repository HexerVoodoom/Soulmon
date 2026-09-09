/**
 * @vitest-environment jsdom
 */
/**
 * O RASCUNHO DO PORTÃO — e a promessa de privacidade que nada vigiava.
 *
 * `gateDraft.ts` não tinha um teste até a sessão de QA de 08/09/2026. Ele
 * guarda a PROVA DO ACEITE dos Termos e atravessa a única viagem para fora do
 * app que existe no fluxo (o redirecionamento do Google / o link de e-mail),
 * então é ele que decide se voltar do login recomeça tudo ou continua de onde
 * parou.
 *
 * Duas promessas escritas no cabeçalho do módulo, nenhuma delas travada:
 *
 *  1. **O e-mail NUNCA entra.** Quem prova posse do e-mail é o Firebase, não o
 *     `localStorage`. A tipagem impede em tempo de compilação; isto aqui olha o
 *     que de fato foi gravado, que é o que um leitor do storage veria.
 *  2. **Consentimento quebrado vale `null`, nunca "presumido".** Um `consent`
 *     corrompido faz o onboarding perguntar de novo — é o lado seguro de errar,
 *     e é o oposto do que um `?? {}` bem-intencionado faria.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readGateDraft, writeGateDraft, clearGateDraft, GATE_DRAFT_VERSION } from './gateDraft';
import { STORAGE_KEYS } from './storageKeys';
import { buildConsentRecord } from './consent';

/** O registro REAL, do próprio construtor — inventar a forma aqui esconderia
 *  justamente uma divergência de forma entre o que se grava e o que se lê. */
const CONSENT = buildConsentRecord(new Date('2026-09-08T12:00:00.000Z'));

const cru = () => localStorage.getItem(STORAGE_KEYS.GATE_DRAFT);

describe('gateDraft — ida e volta', () => {
  beforeEach(() => localStorage.clear());

  it('preserva objetivo, dificuldade e o aceite', () => {
    writeGateDraft({
      soulGoal: 'Terminar a faculdade',
      soulStruggle: 'Procrastinação',
      consent: CONSENT,
    });
    const d = readGateDraft();
    expect(d?.soulGoal).toBe('Terminar a faculdade');
    expect(d?.soulStruggle).toBe('Procrastinação');
    expect(d?.consent).toEqual(CONSENT);
  });

  it('sem rascunho devolve null — e isso não é erro', () => {
    expect(readGateDraft()).toBeNull();
  });

  it('`clearGateDraft` apaga de verdade', () => {
    writeGateDraft({ soulGoal: 'a', soulStruggle: 'b', consent: CONSENT });
    expect(cru()).not.toBeNull();
    clearGateDraft();
    expect(cru()).toBeNull();
    expect(readGateDraft()).toBeNull();
  });
});

describe('🔴 o e-mail NUNCA entra no rascunho', () => {
  beforeEach(() => localStorage.clear());

  it('nada que pareça e-mail é gravado, nem vindo de campo inesperado', () => {
    // O `Pick` da assinatura já barra em tempo de compilação. Este caso olha o
    // BYTE gravado, que é o que alguém abrindo o storage veria — e o que
    // sobreviveria a um `as any` num call site futuro.
    writeGateDraft({
      soulGoal: 'meu objetivo',
      soulStruggle: 'minha dificuldade',
      consent: CONSENT,
      // @ts-expect-error — de propósito: simula o call site descuidado de amanhã
      email: 'alguem@exemplo.com',
      saveId: 'a'.repeat(32),
    });
    const texto = cru() ?? '';
    expect(texto).not.toContain('alguem@exemplo.com');
    expect(texto).not.toContain('@');
    expect(texto).not.toContain('saveId');
    expect(Object.keys(JSON.parse(texto)).sort())
      .toEqual(['consent', 'savedAt', 'soulGoal', 'soulStruggle', 'v']);
  });
});

describe('🔴 o storage é dado NÃO confiável', () => {
  beforeEach(() => localStorage.clear());

  const semear = (valor: string) => localStorage.setItem(STORAGE_KEYS.GATE_DRAFT, valor);

  it('versão diferente é descartada — não migra por adivinhação', () => {
    semear(JSON.stringify({ v: 999, soulGoal: 'x', soulStruggle: 'y', consent: CONSENT }));
    expect(readGateDraft()).toBeNull();
  });

  it('JSON quebrado, tipo errado e vazio não derrubam o onboarding', () => {
    for (const lixo of ['{', 'null', '"texto"', '[]', '42', '']) {
      semear(lixo);
      expect(() => readGateDraft(), lixo).not.toThrow();
      expect(readGateDraft(), lixo).toBeNull();
    }
  });

  it('campos de texto com tipo errado viram string vazia, não `undefined`', () => {
    semear(JSON.stringify({ v: GATE_DRAFT_VERSION, soulGoal: 42, soulStruggle: {}, consent: CONSENT }));
    const d = readGateDraft();
    expect(d?.soulGoal).toBe('');
    expect(d?.soulStruggle).toBe('');
  });

  it('🔴 consentimento corrompido vale NULL — presumido não é consentimento', () => {
    for (const ruim of ['sim', 1, true, [], null, undefined]) {
      semear(JSON.stringify({ v: GATE_DRAFT_VERSION, soulGoal: 'a', soulStruggle: 'b', consent: ruim }));
      const d = readGateDraft();
      expect(d, String(ruim)).not.toBeNull();
      // O rascunho sobrevive (o objetivo não se perde), mas o aceite não é
      // inventado: o portão pergunta de novo.
      expect(d?.consent, String(ruim)).toBeNull();
    }
  });

  it('array vazio NÃO passa por objeto', () => {
    // `typeof [] === 'object'` é a armadilha clássica; aqui o `[]` cai porque
    // `d.consent && typeof d.consent === 'object'` aceitaria — e é por isso que
    // este caso existe, para o dia em que alguém "simplificar" a checagem.
    semear(JSON.stringify({ v: GATE_DRAFT_VERSION, soulGoal: 'a', soulStruggle: 'b', consent: [] }));
    const d = readGateDraft();
    expect(Array.isArray(d?.consent)).toBe(false);
  });
});
