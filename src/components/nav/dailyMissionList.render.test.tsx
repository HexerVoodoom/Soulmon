// @vitest-environment jsdom
/**
 * As missões diárias dos outros recursos na folha de Missões (14/10/2026, REGISTRO §52) e o fim do ícone de "login diário" na Home.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { AvisosLink } from './AvisosLink';
import { CROSSINGS_EMPTY } from '../../types/travessias';
import { bumpDaily, claimDaily, claimFirst, dailyMissionsFor, markFirstForEvent, type DailyMissionsState, type FirstTimesState } from '../../utils/dailyMissions';

afterEach(cleanup);

const DAY = '2026-10-14';
const lista = dailyMissionsFor(DAY, 1);

const mk = (state: DailyMissionsState | undefined, onClaim = vi.fn(), language: 'en-US' | 'pt-BR' = 'en-US') => (
  <MissionsSheet
    open onClose={() => {}} language={language} crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()} todayKey={DAY}
    weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: 'available', torneio: null, conquistas: null }}
    dailies={{ state, day: DAY, bondLevel: 1, onClaim }}
  />
);

describe('DailyMissionList na aba Diárias', () => {
  it('mostra as 3 do dia (PT/EN), sem botão enquanto o evento não aconteceu', async () => {
    render(mk(undefined));
    await waitFor(() => expect(document.querySelector('[data-daily-missions]')).not.toBeNull());
    const rows = [...document.querySelectorAll('[data-daily-mission]')];
    expect(rows.map(r => r.getAttribute('data-daily-mission'))).toEqual(lista.map(m => m.id));
    expect(rows[0].textContent).toContain(lista[0].descEn);
    for (const r of rows) { expect(r.getAttribute('data-status')).toBe('available'); expect(r.querySelector('button')).toBeNull(); }
    cleanup();
    render(mk(undefined, vi.fn(), 'pt-BR'));
    await waitFor(() => expect(document.querySelector('[data-daily-mission]')!.textContent).toContain(lista[0].descPt));
  });

  it('evento real deixa a linha pronta; "Claim" chama o resgate uma vez; paga vira "Claimed" sem botão; reabrir não repete', async () => {
    const onClaim = vi.fn();
    const ev = lista[0].event;
    const pronta = bumpDaily(undefined, DAY, ev);
    const { unmount } = render(mk(pronta, onClaim));
    await waitFor(() => expect(document.querySelector(`[data-daily-mission="${lista[0].id}"]`)).not.toBeNull());
    const li = document.querySelector(`[data-daily-mission="${lista[0].id}"]`)!;
    expect(li.getAttribute('data-status')).toBe('ready');
    const btn = li.querySelector('button')!;
    expect(btn.textContent).toBe('Claim');
    fireEvent.click(btn);
    expect(onClaim).toHaveBeenCalledWith(lista[0].id);
    const pago = claimDaily({ dailyMissions: pronta, buildingQuests: undefined }, DAY, 1, lista[0].id).state;
    unmount();
    render(mk(pago.dailyMissions, onClaim));
    await waitFor(() => expect(document.querySelector(`[data-daily-mission="${lista[0].id}"]`)).not.toBeNull());
    const li2 = document.querySelector(`[data-daily-mission="${lista[0].id}"]`)!;
    expect(li2.getAttribute('data-status')).toBe('claimed');
    expect(li2.querySelector('button')).toBeNull();
    expect(li2.textContent).toContain('Claimed');
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
});

describe('Home sem ícone de login diário nem de Avisos', () => {
  it('o botão de Avisos fica OCULTO por completo (dono, 14/10/2026), mesmo com avisos', () => {
    const { container } = render(<AvisosLink count={2} row={2} label="Notices" countLabel="2 notices" onClick={() => {}} />);
    expect(container.querySelector('[data-avisos-link]')).toBeNull();
    expect(container.innerHTML).toBe('');
  });
});

describe('seção "Primeiras vezes" na aba Diárias', () => {
  const mkF = (state: FirstTimesState | undefined, bond: number, onClaim = vi.fn(), language: 'en-US' | 'pt-BR' = 'en-US') => (
    <MissionsSheet
      open onClose={() => {}} language={language} crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()} todayKey={DAY}
      weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: null, torneio: null, conquistas: null }}
      firsts={{ state, bondLevel: bond, onClaim }}
    />
  );
  it('lista visitas e estreias abertas; pronta mostra Claim, resgatada some e entra na contagem', async () => {
    const onClaim = vi.fn();
    const pronta = markFirstForEvent(undefined, 'dino');
    const { unmount } = render(mkF(pronta, 1, onClaim));
    await waitFor(() => expect(document.querySelector('[data-first-times]')).not.toBeNull());
    expect(document.querySelector('[data-missions-section="first-times"]')!.getAttribute('aria-label')).toBe('First times');
    const li = document.querySelector('[data-first-time="first-minigame"]')!;
    expect(li.getAttribute('data-status')).toBe('ready');
    expect(document.querySelector('[data-first-time="visit:mercado.itens"]')!.textContent).toContain('Visit: ');
    expect(document.querySelector('[data-first-time="visit:hall.feira"]')).toBeNull();
    fireEvent.click(li.querySelector('button')!);
    expect(onClaim).toHaveBeenCalledWith('first-minigame');
    const pago = claimFirst({ firstTimes: pronta, buildingQuests: undefined }, DAY, 1, 'first-minigame').state;
    unmount();
    render(mkF(pago.firstTimes, 1, onClaim, 'pt-BR'));
    await waitFor(() => expect(document.querySelector('[data-first-times]')).not.toBeNull());
    expect(document.querySelector('[data-first-time="first-minigame"]')).toBeNull();
    expect(document.querySelector('[data-first-times-count]')!.textContent).toMatch(/^1 de \d+ já feitas$/);
    expect(document.querySelector('[data-first-time="visit:mercado.itens"]')!.textContent).toContain('Conheça: ');
  });
});

describe('aba Conquistas', () => {
  it('mostra critérios e progresso, sem botão de comprar ou resgatar; a compra é no Mercado (só texto)', async () => {
    render(<MissionsSheet initialTab="achievements" open onClose={() => {}} language="en-US" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()} todayKey={DAY}
      weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: null, torneio: null, conquistas: null }} />);
    await waitFor(() => expect(document.querySelector('[data-conquistas]')).not.toBeNull(), { timeout: 20000 });
    const painel = document.querySelector('[data-missions-panel="achievements"]')!;
    expect(painel.querySelector('[data-achievements-hint]')!.textContent).toContain('Market');
    expect(painel.querySelectorAll('[data-mission]').length).toBeGreaterThan(0);
    for (const b of painel.querySelectorAll('button')) expect(b.textContent ?? '').not.toMatch(/buy|comprar|claim|resgatar|equip/i);
  });
});
