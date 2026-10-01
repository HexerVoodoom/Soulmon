// @vitest-environment jsdom
/**
 * As 20 do teste no save (decisão do dono, 01/10/2026): quem respondeu no
 * grátis e depois compra NÃO responde de novo — o ritual de upgrade pula o
 * teste e, da última pergunta do ritual, vai direto à geração.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { writeOracleDraft, clearOracleDraft } from '../utils/oracleDraft';
import { ORACLE_QUESTIONS } from '../utils/oracle';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';
import type { Answers } from '../utils/soulProfile/personality/types';

const CIDADE = { name: 'São Paulo', region: 'SP', country: 'BR', latitude: -23.55, longitude: -46.63, timeZone: 'America/Sao_Paulo' };
const QUIZ_START = 6;
const ULTIMA = QUIZ_START + ORACLE_QUESTIONS.length - 1;

const VINTE: Answers = Object.fromEntries(SOUL_TEST_ITEMS.map(it => [it.id,
  it.kind === 'scenario' ? { kind: 'scenario', optionId: it.options[0].id }
    : it.kind === 'forced-choice' ? { kind: 'forced-choice', choice: 'a' }
      : { kind: 'likert', value: 3 }])) as Answers;

function rascunhoUpgrade() {
  const cinco = Object.fromEntries(ORACLE_QUESTIONS.slice(0, -1).map(q => [q.id, q.options[0].id]));
  writeOracleDraft({
    mode: 'upgrade', step: ULTIMA, soulGoal: '', soulStruggle: '',
    fullName: 'Jane Doe', birthDate: '1994-09-03', birthDateText: '03/09/1994', birthTime: '12:00',
    birthCity: CIDADE, timeUnknown: false, favoriteCreature: '', skipFavorite: false,
    answers: cinco, testAnswers: {}, refine: true, consent: null,
  } as never);
}

async function responderUltima() {
  const ultima = ORACLE_QUESTIONS[ORACLE_QUESTIONS.length - 1];
  fireEvent.click(screen.getByRole('button', { name: ultima.options[0].text.en }));
  await act(async () => { vi.advanceTimersByTime(200); });
}

describe('upgrade com as 20 do teste já no save', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); clearOracleDraft(); });
  afterEach(() => { vi.useRealTimers(); });

  it('sem as 20 salvas, a última do ritual leva ao 1º item do teste', async () => {
    rascunhoUpgrade();
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} mode="upgrade" onRevealed={() => {}} />);
    await responderUltima();
    expect(screen.getByText(/Question 1 of 20/)).toBeTruthy();
  });

  it('com as 20 salvas, o teste é pulado: vai à geração', async () => {
    rascunhoUpgrade();
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} mode="upgrade" onRevealed={() => {}} savedTestAnswers={VINTE} />);
    await responderUltima();
    expect(screen.queryByText(/of 20/)).toBeNull();
    expect(document.querySelector('.sm2-ora-wait')).toBeTruthy();
  });
});
