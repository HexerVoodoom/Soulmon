// @vitest-environment jsdom
/**
 * O Passeio na Home (dono, 16/11/2026): vira linha como qualquer tarefa, "Stroll"/"Passeio" em turquesa antes do nome; concluído
 * (pela Home OU pelo NPC, o mesmo `applyStrollNow`) FICA marcado como feito na lista, e no dia seguinte a marca some.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { dailyOffer } from '../../utils/travessias';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';

// Relógio preso em AGORA (só `Date`): a janela do Passeio escolhido (pickAt + MISSION_WINDOW_MS) é medida com Date.now().
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-16T15:00:00Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const HOJE = '2026-11-16';
const AGORA = new Date('2026-11-16T15:00:00Z').getTime();
const m = dailyOffer(HOJE, 'seed')[0];
const mk = (crossings: CrossingsState, todayKey: string, language: 'en-US' | 'pt-BR') => (
  <MissionsSheet open onClose={() => {}} language={language} crossings={crossings} onClaimStroll={vi.fn()} onDoneStroll={vi.fn()}
    todayKey={todayKey} weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: null, torneio: null, conquistas: null }} />
);
const linha = () => document.querySelector('[data-stroll-line]') as HTMLElement;

describe('linha do Passeio escolhido e concluído', () => {
  const escolhido: CrossingsState = { ...CROSSINGS_EMPTY, active: { region: m.region.id, challenge: m.challenge.id }, pickDay: HOJE, pickAt: AGORA };
  it.each([['pt-BR', 'Passeio'], ['en-US', 'Stroll']] as const)('%s: a palavra vem em turquesa antes do nome, com "Feito/Done" aberto', async (lang, palavra) => {
    render(mk(escolhido, HOJE, lang));
    await waitFor(() => expect(linha()).not.toBeNull());
    const w = linha().querySelector('[data-stroll-word]') as HTMLElement;
    expect(w.textContent).toBe(palavra);
    expect(w.style.color).toBe('var(--sm2-primary-ink)');
    expect(linha().textContent!.startsWith(palavra)).toBe(true);
    expect(linha().querySelector('[data-stroll-done]')).not.toBeNull();
  });

  it('concluído (qualquer porta): a linha FICA marcada como feita, ainda com "Stroll" turquesa, sem botão de concluir', async () => {
    const c = { ...escolhido, doneDay: HOJE, claimDay: HOJE, sceneDay: HOJE, pickAt: null };
    render(mk(c, HOJE, 'en-US'));
    await waitFor(() => expect(linha()).not.toBeNull());
    expect(linha().getAttribute('data-status')).toBe('claimed');
    expect(linha().querySelector('[data-stroll-word]')!.textContent).toBe('Stroll');
    expect(linha().querySelector('[data-stroll-done]')).toBeNull();
  });

  it('no dia seguinte a marca de feito some: volta a "Take a stroll"', async () => {
    const c = { ...escolhido, doneDay: HOJE, claimDay: HOJE, pickAt: null };
    render(mk(c, '2026-11-17', 'en-US'));
    await waitFor(() => expect(linha()).not.toBeNull());
    expect(linha().getAttribute('data-status')).toBe('point');
    expect(linha().textContent).toContain('Take a stroll');
  });
});
