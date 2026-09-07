// @vitest-environment jsdom
/**
 * WP1.7 — o ritual RETOMA de onde parou, e o demo nunca deixa rascunho.
 *
 * Só o render prova os dois lados: (1) com rascunho no storage, a tela abre
 * direto no passo gravado com o campo já preenchido; (2) o caminho grátis,
 * que nunca entra no ritual, não grava nada — um rascunho do demo retomaria
 * um ritual que a pessoa não escolheu.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { writeOracleDraft, clearOracleDraft } from '../utils/oracleDraft';
import { PREMADE_CHARACTERS } from '../utils/monetization';

const rascunho = {
  mode: 'onboarding' as const,
  step: 1,
  soulGoal: '', soulStruggle: '',
  fullName: 'Maria da Silva',
  birthDate: '', birthDateText: '', birthTime: '12:00', birthCity: null, timeUnknown: false,
  favoriteCreature: '', skipFavorite: false, answers: {}, testAnswers: {}, refine: null,
  consent: { acceptedAt: '2026-09-03T10:00:00.000Z', termsVersion: '1', privacyVersion: '1' },
};

describe('SoulmonOnboarding — rascunho do ritual (WP1.7)', () => {
  beforeEach(() => { installFakeStorage(); clearOracleDraft(); });

  it('com rascunho no passo do nome, abre direto nele com o nome preenchido', () => {
    writeOracleDraft(rascunho);
    renderWithCss(<SoulmonOnboarding onComplete={async () => {}} />);
    expect(screen.getByText('What is your full name?')).toBeTruthy();
    expect((screen.getByPlaceholderText('E.g.: Jane Doe') as HTMLInputElement).value).toBe('Maria da Silva');
    // E a intro NÃO aparece: retomar é retomar.
    expect(screen.queryByText('Get started')).toBeNull();
  });

  it('digitar mais no ritual regrava o rascunho (a cada mudança, não só ao sair)', () => {
    writeOracleDraft(rascunho);
    renderWithCss(<SoulmonOnboarding onComplete={async () => {}} />);
    fireEvent.change(screen.getByPlaceholderText('E.g.: Jane Doe'), { target: { value: 'Maria da Silva Santos' } });
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORACLE_DRAFT)!);
    expect(raw.fullName).toBe('Maria da Silva Santos');
    expect(raw.step).toBe(1);
    expect(raw).not.toHaveProperty('email');
  });

  it('o caminho grátis (demo) nunca grava rascunho', () => {
    renderWithCss(<SoulmonOnboarding onComplete={async () => {}} />);
      fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
    fireEvent.click(screen.getByText('I am 18 or older'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    fireEvent.click(screen.getByText('Start now — it’s free'));
    fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
    // O rascunho do RITUAL continua sem existir no caminho grátis. O do
    // PORTÃO (`GATE_DRAFT`) é outra coisa e existe de propósito — ele é o que
    // faz a viagem até o e-mail não cobrar de volta o aceite dos Termos.
    expect(localStorage.getItem(STORAGE_KEYS.ORACLE_DRAFT)).toBeNull();
  });

  it('um rascunho de outro modo é ignorado: o onboarding abre no portão', () => {
    writeOracleDraft({ ...rascunho, mode: 'upgrade' });
    renderWithCss(<SoulmonOnboarding onComplete={async () => {}} />);
    // 07/09/2026 — o primeiro passo passou a ser o portão de identidade; a
    // tela de intro deixou de existir e a marca virou o cabeçalho dele.
    expect(screen.getByText('Before we start')).toBeTruthy();
  });
});
