// @vitest-environment jsdom
/**
 * As missões diárias dos outros recursos na folha de Missões (14/10/2026, REGISTRO §52) e o fim do ícone de "login diário" na Home.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { AvisosLink } from './AvisosLink';
import { NoticeToast, noticeToastText, parseNoticeSeen, pickNoticeKey, recordNoticeShown } from '../NoticeToast';
import { pickPresentation } from '../../utils/presentationQueue';
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

describe('aba Conquistas: resgate explícito, a compra segue no Mercado', () => {
  const feito = (id: string) => ({ [id]: 99999 });
  const mkC = (claimed: string[] | undefined, onClaim = vi.fn(), progress: Record<string, number> = feito('mission-mega')) => (
    <MissionsSheet initialTab="achievements" open onClose={() => {}} language="en-US" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()} todayKey={DAY}
      weekly={[]} onClaimWeekly={vi.fn()} missionProgress={progress} marks={{ daily: null, torneio: null, conquistas: null }}
      missionsClaimed={claimed} onClaimMission={onClaim} />
  );
  it('bloqueada: critério e progresso, sem botão; cumprida e não resgatada: Claim; resgatada: "compre no Mercado", sem botão', async () => {
    const onClaim = vi.fn();
    const { rerender } = render(mkC([], onClaim, { 'mission-mega': 0 }));
    await waitFor(() => expect(document.querySelector('[data-conquistas]')).not.toBeNull(), { timeout: 20000 });
    const painel = document.querySelector('[data-missions-panel="achievements"]')!;
    expect(painel.querySelector('[data-achievements-hint]')!.textContent).toContain('Market');
    expect(painel.querySelectorAll('[data-mission]').length).toBeGreaterThan(0);
    expect(painel.querySelector('[data-claim-mission]')).toBeNull();
    rerender(mkC([], onClaim));
    const claim = painel.querySelector('[data-claim-mission="mission-mega"]') as HTMLButtonElement;
    expect(claim.textContent).toBe('Claim');
    for (const b of painel.querySelectorAll('button')) expect(b.textContent ?? '').not.toMatch(/buy|comprar|equip/i);
    fireEvent.click(claim);
    expect(onClaim).toHaveBeenCalledWith('mission-mega');
    rerender(mkC(['mission-mega'], onClaim));
    expect(painel.querySelector('[data-claim-mission]')).toBeNull();
    expect(painel.querySelector('[data-mission-buy-hint]')!.textContent).toContain('buy it in the Background stall at the Market');
  });
  it('save ainda não migrado (claimed ausente): a cumprida já vale como resgatada, sem botão', async () => {
    render(mkC(undefined));
    await waitFor(() => expect(document.querySelector('[data-conquistas]')).not.toBeNull(), { timeout: 20000 });
    expect(document.querySelector('[data-claim-mission]')).toBeNull();
    expect(document.querySelector('[data-mission-buy-hint]')).not.toBeNull();
  });
});

describe('NoticeToast: termos uma única vez na vida, convites 1×/dia', () => {
  it('termos: depois de mostrado nunca mais volta, nem no dia seguinte; convite volta no dia seguinte', () => {
    let dia: string | null = null; let sempre: string | null = null;
    const mostrar = (d: string, k: 'termos' | 'refeicao') => { const r = recordNoticeShown(dia, sempre, d, k); dia = r.dia; sempre = r.sempre; };
    const presentes = ['termos', 'refeicao'];
    const escolher = (d: string) => pickNoticeKey(presentes, parseNoticeSeen(dia, d), (sempre ?? '').split(','));
    expect(escolher('2026-10-14')).toBe('refeicao');
    mostrar('2026-10-14', 'refeicao');
    expect(escolher('2026-10-14')).toBe('termos');
    mostrar('2026-10-14', 'termos');
    expect(escolher('2026-10-14')).toBeNull();
    expect(escolher('2026-10-15')).toBe('refeicao');
    mostrar('2026-10-15', 'refeicao');
    expect(escolher('2026-10-15')).toBeNull();
    expect(escolher('2026-10-20')).toBe('refeicao');
    expect(sempre).toBe('termos');
  });
  it('recordNoticeShown é idempotente para o registro de uma vez só e ignora lixo', () => {
    const a = recordNoticeShown(null, 'termos', '2026-10-14', 'termos');
    expect(a.sempre).toBe('termos');
    expect(parseNoticeSeen('lixo', '2026-10-14')).toEqual([]);
    expect(recordNoticeShown('2026-10-13|refeicao', null, '2026-10-14', 'refugio').dia).toBe('2026-10-14|refugio');
  });
});

describe('NoticeToast', () => {
  it('escolhe o primeiro aviso acionável ainda não visto, na ordem de importância; informativos e HP/incubação não entram', () => {
    expect(pickNoticeKey(['hp', 'carga', 'termos', 'refeicao'], [])).toBe('refeicao');
    expect(pickNoticeKey(['hp', 'termos', 'refeicao'], ['refeicao'])).toBe('termos');
    expect(pickNoticeKey(['hp', 'incubacao', 'carga', 'marcoBosque', 'semanal', 'priming', 'checkin'], [])).toBeNull();
    expect(pickNoticeKey(['termos'], ['termos'])).toBeNull();
  });
  it('PT/EN e o toque abre a folha de Avisos e fecha o balão (não é modal)', () => {
    const onOpen = vi.fn(); const onDone = vi.fn();
    const { container, rerender } = render(<NoticeToast noticeKey="refugio" language="pt-BR" onOpen={onOpen} onDone={onDone} />);
    const b = container.querySelector('[data-notice-toast="refugio"]') as HTMLElement;
    expect(b.textContent).toBe(noticeToastText('refugio', 'pt-BR'));
    expect(b.getAttribute('role')).toBe('status');
    expect(b.getAttribute('aria-modal')).toBeNull();
    rerender(<NoticeToast noticeKey="refugio" language="en-US" onOpen={onOpen} onDone={onDone} />);
    expect(container.textContent).toContain('Refuge');
    fireEvent.click(b);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalled();
  });
  it('na fila: leve, não segura a tela e perde para qualquer modal ou para o balão de prédio', () => {
    expect(pickPresentation({ noticeToast: true })).toBe('noticeToast');
    expect(pickPresentation({ noticeToast: true, unlockToast: true })).toBe('unlockToast');
    expect(pickPresentation({ noticeToast: true, checkIn: true }, 'noticeToast')).toBe('checkIn');
  });
});
