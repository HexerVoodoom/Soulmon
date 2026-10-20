/** @vitest-environment jsdom */
/**
 * D-105..D-107 (20/10/2026): as PORTAS. O Clan Hall ficou administrativo; o Bosque, a Guerra e a Feira abrem pelos prédios
 * (Hall: Grove e Feira; Arena: Guerra), e o "i" do Grove mora na linha do título do modal.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';

vi.mock('../../utils/community', async (orig) => {
  const real = await orig<typeof import('../../utils/community')>();
  return { ...real, getGuild: vi.fn(), getGuildRewards: vi.fn(), getGuildWar: vi.fn() };
});
import { getGuild, getGuildRewards, getGuildWar, sanitizeGuildView } from '../../utils/community';
import { AreaView, type AreaViewProps } from '../nav/AreaView';

const guilda = () => sanitizeGuildView({
  id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 2, full: false,
  members: [{ id: 'a1b2c3d4e5f6a700', memberId: 'a1b2c3d4e5f6a700', name: 'Ana', euMesmo: true }, { id: 'a1b2c3d4e5f6a701', memberId: 'a1b2c3d4e5f6a701', name: 'Bia', euMesmo: false }],
  presence: null, threadedToday: null, mine: { cameToday: false, threadToday: false }, progress: 1, target: 5,
  bosque: { stage: null, stageIndex: 0, perto: false, tide: { key: 'T1', size: null }, ornaments: [] }, gestures: [],
  raid: { weekKey: '2026-W40', phenomenon: 'mare', state: 'aberta', ferido: false, lastWeek: null, mine: {} },
})!;

const area = (a: 'hall' | 'arena') => (
  <AreaView {...({ area: a, language: 'pt-BR', guild: { saveId: 'save-12345678', metaDoDiaCumprida: true }, hallContent: () => null } as unknown as AreaViewProps)} />
);

describe('as portas dos prédios (D-107)', { timeout: 20000 }, () => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { get() { return this.parentNode; }, configurable: true });
    vi.mocked(getGuild).mockResolvedValue(guilda());
    vi.mocked(getGuildRewards).mockResolvedValue({ pending: [], scenes: [], trophyOwned: false } as never);
    vi.mocked(getGuildWar).mockResolvedValue({ waiting: null, last: null } as never);
  });
  afterEach(() => {
    cleanup();
    if (original) Object.defineProperty(HTMLElement.prototype, 'offsetParent', original);
    else delete (HTMLElement.prototype as { offsetParent?: unknown }).offsetParent;
  });

  it('Hall > prédio Grove abre room="grove": cena, "Enter the Grove" e o "i" NA LINHA DO TÍTULO do modal', async () => {
    const r = renderWithCss(area('hall'));
    fireEvent.click(r.container.querySelector('[data-area-lot="grove"]')!);
    await waitFor(() => expect(document.querySelector('[data-guild-room-open="grove"]')).toBeTruthy(), { timeout: 8000 });
    await waitFor(() => expect(document.querySelector('[data-guild-bosque-entrar]')).toBeTruthy(), { timeout: 8000 });
    expect(document.querySelector('[data-grove-cena]')).toBeTruthy();
    const slot = document.querySelector('[data-modal-info-slot]')!;
    expect(slot.querySelector('button')).toBeTruthy(); // o "i" está no cabeçalho
    expect(slot.closest('[data-area-sheet-head]')).toBeTruthy();
    // e só um "i" no modal: o corpo não repete
    expect(document.querySelectorAll('[data-guild-room-open="grove"] [aria-label="Como o bosque cresce"]')).toHaveLength(0);
  });

  it('Hall > prédio Feira abre room="feira" (a Feira do clã: missão/rodada), sem Bosque', async () => {
    const r = renderWithCss(area('hall'));
    fireEvent.click(r.container.querySelector('[data-area-lot="feira"]')!);
    await waitFor(() => expect(document.querySelector('[data-guild-room-open="feira"] [data-guild-room="feira"]')).toBeTruthy(), { timeout: 8000 });
    expect(document.querySelector('[data-guild-room="bosque"]')).toBeNull();
  });

  it('Hall > Clan Hall (guilda) NÃO tem mais Bosque, Feira nem Guerra; segue com ficha, membros e código', async () => {
    const r = renderWithCss(area('hall'));
    fireEvent.click(r.container.querySelector('[data-area-lot="guilda"]')!);
    await waitFor(() => expect(document.querySelector('[data-cla-info]')).toBeTruthy(), { timeout: 8000 });
    for (const s of ['bosque', 'feira', 'guerra']) expect(document.querySelector(`[data-guild-room="${s}"]`), s).toBeNull();
    expect(document.querySelector('[data-guild-bosque-entrar]')).toBeNull();
    expect(document.querySelector('[data-guild-room="roda"]')).toBeTruthy();
    expect(document.querySelector('.sm2-coop-cd')!.textContent).toBe('ABCD2345');
  });

  it('Arena > lote Guerra abre room="guerra"', async () => {
    const r = renderWithCss(area('arena'));
    fireEvent.click(r.container.querySelector('[data-area-lot="guerra"]')!);
    await waitFor(() => expect(document.querySelector('[data-guild-room-open="guerra"] [data-guild-room="guerra"]')).toBeTruthy(), { timeout: 8000 });
  });
});
