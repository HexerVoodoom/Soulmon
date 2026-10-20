// @vitest-environment jsdom
/**
 * O quadro da aba Diárias (dono, 20/10/2026): especial aberta no topo com rótulo + linha fina; resgatada vai para o fim;
 * pronta ("?") acima da aberta; especial concluída desce, sem rótulo nem linha.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { CROSSINGS_EMPTY } from '../../types/travessias';
import { bumpDaily, dailyMissionsFor } from '../../utils/dailyMissions';

afterEach(cleanup);

const DAY = '2026-10-20';
const lista = dailyMissionsFor(DAY, 1);

type Sp = { day: string; kind: 'steps' | 'rest'; done: boolean } | undefined;
const mk = (special: Sp, crossings = CROSSINGS_EMPTY, dailyState = undefined as ReturnType<typeof bumpDaily> | undefined, language: 'en-US' | 'pt-BR' = 'en-US') => (
  <MissionsSheet
    open onClose={() => {}} language={language} crossings={crossings} onClaimStroll={vi.fn()} todayKey={DAY}
    weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: 'available', torneio: null, conquistas: null }}
    dailies={{ state: dailyState, day: DAY, bondLevel: 1, onClaim: vi.fn() }}
    special={{ state: special, stepsToday: 1000, stepGoal: 7000, tomorrowKind: 'rest' }}
  />
);
const order = () => [...document.querySelectorAll('[data-daily-board] > li')].map(li => {
  const a = li as HTMLElement;
  if (a.hasAttribute('data-special-label')) return 'label';
  if (a.hasAttribute('data-mission-divider')) return 'divider';
  if (a.hasAttribute('data-special-tomorrow')) return 'tomorrow';
  if (a.hasAttribute('data-special-mission')) return 'special';
  if (a.hasAttribute('data-stroll-line')) return 'stroll';
  if (a.hasAttribute('data-daily-mission')) return `daily:${a.getAttribute('data-daily-mission')}`;
  return 'other';
});

describe('DailyMissionBoard', () => {
  it('especial aberta: rótulo, cartão, dica, linha fina, depois as normais', async () => {
    render(mk({ day: DAY, kind: 'rest', done: false }));
    await waitFor(() => expect(document.querySelector('[data-daily-board]')).not.toBeNull());
    const o = order();
    expect(o.slice(0, 4)).toEqual(['label', 'special', 'tomorrow', 'divider']);
    expect(o[4]).toBe('stroll');
    expect(document.querySelector('[data-special-label]')!.textContent).toBe('Special mission');
    expect(document.querySelector('[data-mission-divider]')!.getAttribute('role')).toBe('separator');
    expect(document.querySelectorAll('[data-daily-board]').length).toBe(1);
  });
  it('PT-BR: rótulo "Missão especial"', async () => {
    render(mk({ day: DAY, kind: 'rest', done: false }, CROSSINGS_EMPTY, undefined, 'pt-BR'));
    await waitFor(() => expect(document.querySelector('[data-special-label]')).not.toBeNull());
    expect(document.querySelector('[data-special-label]')!.textContent).toBe('Missão especial');
  });
  it('especial concluída vai ao fim, sem rótulo nem linha', async () => {
    render(mk({ day: DAY, kind: 'rest', done: true }));
    await waitFor(() => expect(document.querySelector('[data-daily-board]')).not.toBeNull());
    const o = order();
    expect(o).not.toContain('label');
    expect(o).not.toContain('divider');
    expect(o.indexOf('special')).toBeGreaterThan(o.indexOf('stroll'));
    expect(o[o.length - 1]).toBe('tomorrow');
    expect(o[o.length - 2]).toBe('special');
  });
  it('sem especial: sem rótulo nem linha', async () => {
    render(mk(undefined));
    await waitFor(() => expect(document.querySelector('[data-daily-board]')).not.toBeNull());
    expect(order()).not.toContain('label');
    expect(order()).not.toContain('divider');
  });
  it('missão pronta ("?") sobe acima das abertas; passeio resgatado vai para o fim', async () => {
    const ev = lista[2].event;
    const pronta = bumpDaily(undefined, DAY, ev);
    const claimedStroll = { ...CROSSINGS_EMPTY, doneDay: DAY, claimDay: DAY };
    render(mk(undefined, claimedStroll, pronta));
    await waitFor(() => expect(document.querySelector('[data-daily-board]')).not.toBeNull());
    const o = order();
    const status = (id: string) => document.querySelector(`[data-daily-mission="${id}"]`)!.getAttribute('data-status');
    expect(status(lista[2].id)).toBe('ready');
    expect(o[0]).toBe(`daily:${lista[2].id}`);
    const stroll = document.querySelector('[data-stroll-line]')!.getAttribute('data-status');
    expect(stroll).toBe('claimed');
    expect(o[o.length - 1]).toBe('stroll');
    expect(o.indexOf(`daily:${lista[0].id}`)).toBeLessThan(o.indexOf('stroll'));
  });
});
