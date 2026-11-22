// @vitest-environment jsdom
/** Teto diário da Jornada (22/11/2026): atingido o teto de itens, a tela avisa em vez de deixar o jogador abrir baú vazio sem explicação. Números intactos. */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { JourneyScreen } from './JourneyScreen';
import { JOURNEY_ITEMS_DAILY_CAP, emptyLedger, journeyItemsCapReached } from '../../utils/focusJourney';
import type { ActiveJourney } from '../../utils/focusJourneyApi';

afterEach(cleanup);
const ACTIVE = (): ActiveJourney => ({ sid: 's1', seed: 7, mode: 'p25', env: 'forest', keys: [], day: '2026-11-22', startAt: Date.now(), pausedMs: 0, pausedAt: null, pauses: 0 } as ActiveJourney);
const base = { delta: 0, lastItems: null, onPause() {}, onResume() {}, onClaim() {}, onEnd() {}, onClose() {} };

describe('journeyItemsCapReached', () => {
  it('só no teto (16) ou acima; ledger ausente não conta', () => {
    expect(JOURNEY_ITEMS_DAILY_CAP).toBe(16);
    expect(journeyItemsCapReached({ ...emptyLedger('d'), items: 15 })).toBe(false);
    expect(journeyItemsCapReached({ ...emptyLedger('d'), items: 16 })).toBe(true);
    expect(journeyItemsCapReached(null)).toBe(false);
  });
});

describe('aviso de teto do dia na Jornada', () => {
  it('PT: com o teto atingido, mostra o aviso', () => {
    render(<JourneyScreen {...base} language="pt-BR" active={ACTIVE()} tetoDia />);
    expect(document.querySelector('[data-journey-cap]')?.textContent).toContain('Teto do dia atingido');
  });
  it('EN: mesmo aviso em inglês', () => {
    render(<JourneyScreen {...base} language="en-US" active={ACTIVE()} tetoDia />);
    expect(document.querySelector('[data-journey-cap]')?.textContent).toContain('Daily cap reached');
  });
  it('abaixo do teto: sem aviso', () => {
    render(<JourneyScreen {...base} language="pt-BR" active={ACTIVE()} />);
    expect(document.querySelector('[data-journey-cap]')).toBeNull();
  });
});
