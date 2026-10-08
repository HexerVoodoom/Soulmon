// @vitest-environment jsdom
/**
 * O MENU DE MISSÕES DA HOME (07/10/2026): "Hoje" e "Esta semana" separados; sem lista de
 * Materiais, sem "abre amanhã"; o ícone da Home some sem nada a fazer nem a entregar.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { MissionsLink } from './MissionsLink';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import { claimStroll } from '../../utils/travessiasSave';
import { completeBuildingQuest, claimBuildingQuest, type BuildingQuestState } from '../../utils/buildingQuests';
import { weeklyMissionsFor } from '../../utils/weeklyMissions';

afterEach(cleanup);

const [m] = weeklyMissionsFor('2026-W41');
const sheet = (language: 'en-US' | 'pt-BR', kind: 'daily' | 'weekly' = 'daily', state?: BuildingQuestState) => render(
  <MissionsSheet
    kind={kind}
    open onClose={() => {}} language={language} crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()}
    todayKey="2026-10-07"
    weekly={[{ mission: m, count: 0, done: false, claimed: false }]} onClaimWeekly={vi.fn()}
    missionProgress={{}} marks={{ daily: 'available', torneio: 'available', conquistas: null }}
    buildings={{ state, day: '2026-10-07', bondLevel: 99, onClaim: vi.fn() }}
  />,
);

describe('MissionsSheet — dois acessos', () => {
  it('Daily: só Hoje (linha do passeio + journaling); a semana e as conquistas NÃO estão aqui', async () => {
    sheet('en-US', 'daily');
    await waitFor(() => expect(document.querySelector('[data-building-quest="exploracao.caderno"]')).not.toBeNull(), { timeout: 8000 });
    const daily = document.querySelector('[data-missions-section="daily"]')!;
    expect(daily.getAttribute('aria-label')).toBe('Today');
    expect(document.querySelector('[data-missions-sheet]')!.getAttribute('data-missions-sheet')).toBe('daily');
    expect(daily.querySelector('[data-building-quest="exploracao.caderno"]')!.textContent).toContain('Write an entry in your journal');
    expect(daily.querySelector('[data-stroll-line]')!.textContent).toContain('Take a stroll');
    expect(daily.querySelector('[data-travessias]')).toBeNull();
    expect(daily.querySelector('[data-travessia-card]')).toBeNull();
    expect(daily.querySelector('[data-travessia-fiz]')).toBeNull();
    expect(document.querySelector('[data-missions-section="weekly"]')).toBeNull();
    expect(document.querySelector('[data-missions-section="achievements"]')).toBeNull();
    expect(document.querySelectorAll('[data-building-quest]').length).toBe(1);
    expect(document.body.textContent ?? '').not.toMatch(/Materials|Materiais|opens tomorrow|abre amanhã/i);
  });

  it('Weekly: Esta semana + Conquistas; nada de diária', async () => {
    sheet('en-US', 'weekly');
    await waitFor(() => expect(document.querySelector('[data-missions-section="weekly"]')).not.toBeNull(), { timeout: 8000 });
    expect(document.querySelector('[data-missions-section="weekly"]')!.getAttribute('aria-label')).toBe('This week');
    expect(document.querySelector('[data-missions-section="achievements"]')!.getAttribute('aria-label')).toBe('Achievements');
    expect(document.querySelector('[data-missions-section="daily"]')).toBeNull();
    expect(document.querySelector('[data-building-quest]')).toBeNull();
    expect(document.querySelector('[data-travessias]')).toBeNull();
  });

  it('PT-BR', async () => {
    sheet('pt-BR', 'daily');
    await waitFor(() => expect(document.querySelector('[data-missions-section="daily"]')).not.toBeNull());
    expect(document.querySelector('[data-missions-section="daily"]')!.getAttribute('aria-label')).toBe('Hoje');
    await waitFor(() => expect(document.querySelector('[data-building-quest]')!.textContent).toContain('Faça um registro no journaling'));
    cleanup();
    sheet('pt-BR', 'weekly');
    await waitFor(() => expect(document.querySelector('[data-missions-section="weekly"]')).not.toBeNull());
    expect(document.querySelector('[data-missions-section="weekly"]')!.getAttribute('aria-label')).toBe('Esta semana');
  });
});

describe('journaling: aponta, pronta, Resgatar, resgatada', () => {
  const D = '2026-10-07';
  it('aponta: só o texto, sem botão', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[data-building-quest]')).not.toBeNull(), { timeout: 8000 });
    const li = document.querySelector('[data-building-quest]')!;
    expect(li.getAttribute('data-status')).toBe('available');
    expect(li.querySelector('button')).toBeNull();
  });
  it('pronta: "Claim" é a única ação; resgatada: discreta, sem botão', async () => {
    const pronta = completeBuildingQuest(undefined, D, 'exploracao.caderno', 99);
    const onClaim = vi.fn();
    const mk = (state: BuildingQuestState | undefined) => (
      <MissionsSheet kind="daily" open onClose={() => {}} language="en-US" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()}
        todayKey={D} weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: null, torneio: null, conquistas: null }}
        buildings={{ state, day: D, bondLevel: 99, onClaim }} />
    );
    const { rerender } = render(mk(pronta));
    await waitFor(() => expect(document.querySelector('[data-building-quest]')).not.toBeNull(), { timeout: 8000 });
    const li = document.querySelector('[data-building-quest]')!;
    expect(li.getAttribute('data-status')).toBe('ready');
    const btns = li.querySelectorAll('button');
    expect(btns.length).toBe(1);
    expect(btns[0].textContent).toBe('Claim');
    fireEvent.click(btns[0]);
    expect(onClaim).toHaveBeenCalledWith('exploracao.caderno');
    rerender(mk(claimBuildingQuest(pronta, D, 'exploracao.caderno', 99).state));
    const li2 = document.querySelector('[data-building-quest]')!;
    expect(li2.getAttribute('data-status')).toBe('claimed');
    expect(li2.querySelector('button')).toBeNull();
    expect(li2.textContent).toContain('Claimed');
  });
});

describe('a linha "Take a stroll": aponta, pronta, Claim, resgatada (a experiência vive no NPC)', () => {
  const D = '2026-10-07';
  const mk = (crossings: CrossingsState, onClaimStroll = vi.fn(), language: 'en-US' | 'pt-BR' = 'en-US') => (
    <MissionsSheet kind="daily" open onClose={() => {}} language={language} crossings={crossings} onClaimStroll={onClaimStroll}
      todayKey={D} weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: null, torneio: null, conquistas: null }} />
  );
  const feita: CrossingsState = { ...CROSSINGS_EMPTY, active: { region: 'floresta', challenge: 'x' }, doneDay: D };
  it('aponta: só texto + "!", sem botão, sem propostas, sem timer; o PasseioSheet nem é montado', async () => {
    render(mk(CROSSINGS_EMPTY));
    await waitFor(() => expect(document.querySelector('[data-stroll-line]')).not.toBeNull());
    const li = document.querySelector('[data-stroll-line]')!;
    expect(li.getAttribute('data-status')).toBe('point');
    expect(li.textContent).toContain('Take a stroll');
    expect(li.querySelector('button')).toBeNull();
    expect(li.querySelector('[data-mission-mark="available"]')).not.toBeNull();
    expect(document.querySelector('[data-travessias], [data-travessia-card], [data-travessia-ativa]')).toBeNull();
  });
  it('pronta: "?" e "Claim" como única ação; o clique chama o resgate; resgatada fica discreta', async () => {
    const onClaim = vi.fn();
    const { rerender } = render(mk(feita, onClaim));
    await waitFor(() => expect(document.querySelector('[data-stroll-line]')).not.toBeNull());
    const li = document.querySelector('[data-stroll-line]')!;
    expect(li.getAttribute('data-status')).toBe('ready');
    expect(li.querySelector('[data-mission-mark="ready"]')).not.toBeNull();
    const btns = li.querySelectorAll('button');
    expect(btns.length).toBe(1);
    expect(btns[0].textContent).toBe('Claim');
    fireEvent.click(btns[0]);
    expect(onClaim).toHaveBeenCalledTimes(1);
    rerender(mk(claimStroll(feita, D), onClaim));
    const li2 = document.querySelector('[data-stroll-line]')!;
    expect(li2.getAttribute('data-status')).toBe('claimed');
    expect(li2.querySelector('button')).toBeNull();
    expect(li2.textContent).toContain('Claimed');
  });
  it('PT-BR', async () => {
    const { rerender } = render(mk(CROSSINGS_EMPTY, vi.fn(), 'pt-BR'));
    await waitFor(() => expect(document.querySelector('[data-stroll-line]')!.textContent).toContain('Faça um passeio'));
    rerender(mk(feita, vi.fn(), 'pt-BR'));
    expect(document.querySelector('[data-stroll-line] button')!.textContent).toBe('Resgatar');
  });
});

describe('MissionsLink — dois ícones separados', () => {
  it('diário e semanal são botões distintos, cada um com seu rótulo, tom e linha; cada um some sozinho', () => {
    const { container, rerender } = render(<>
      <MissionsLink kind="daily" mark="available" label="Daily missions" markLabel="Quest available" onClick={() => {}} />
      <MissionsLink kind="weekly" row={2} mark="ready" tone="blue" label="Weekly missions" markLabel="Quest ready" onClick={() => {}} />
    </>);
    const d = container.querySelector<HTMLElement>('[data-missions-kind="daily"]')!;
    const w = container.querySelector<HTMLElement>('[data-missions-kind="weekly"]')!;
    expect(d.getAttribute('aria-label')).toBe('Daily missions, Quest available');
    expect(w.getAttribute('aria-label')).toBe('Weekly missions, Quest ready');
    expect(d.getAttribute('data-mission-tone')).toBe('gold');
    expect(w.getAttribute('data-mission-tone')).toBe('blue');
    expect(d.getAttribute('data-mission-mark-home')).toBe('available');
    expect(w.getAttribute('data-mission-mark-home')).toBe('ready');
    expect(d.style.top).not.toBe(w.style.top);
    rerender(<>
      <MissionsLink kind="daily" mark={null} label="Daily missions" markLabel={null} onClick={() => {}} />
      <MissionsLink kind="weekly" mark="ready" tone="blue" label="Weekly missions" markLabel="Quest ready" onClick={() => {}} />
    </>);
    expect(container.querySelector('[data-missions-kind="daily"]')).toBeNull();
    expect(container.querySelector('[data-missions-kind="weekly"]')).not.toBeNull();
  });
  it('some sem marca; com marca aparece', () => {
    const { container, rerender } = render(<MissionsLink mark={null} label="Missions" markLabel={null} onClick={() => {}} />);
    expect(container.querySelector('[data-missions-link]')).toBeNull();
    rerender(<MissionsLink mark="ready" label="Missions" markLabel="Quest ready" onClick={() => {}} />);
    expect(container.querySelector('[data-missions-link]')).not.toBeNull();
  });
});

describe('o primeiro dia é missão (07/10/2026): vive no menu, não na Home', () => {
  it('a seção "First day" aparece com o cartão e a marca "!"; sem o progresso, some', async () => {
    const fd = { day: '2026-10-07', done: [] as never[] };
    const props = {
      open: true, onClose: () => {}, crossings: CROSSINGS_EMPTY, onClaimStroll: vi.fn(),
      todayKey: '2026-10-07', weekly: [], onClaimWeekly: vi.fn(), missionProgress: {},
    };
    const { rerender } = render(
      <MissionsSheet kind="daily" {...props} language="en-US"
        marks={{ daily: null, torneio: null, conquistas: null, firstDay: 'available' }} firstDay={fd} />,
    );
    await waitFor(() => expect(document.querySelector('[data-missions-section="first-day"]')).not.toBeNull());
    const sec = document.querySelector('[data-missions-section="first-day"]')!;
    expect(sec.getAttribute('aria-label')).toBe('First day');
    expect(sec.getAttribute('data-quest-mark')).toBe('available');
    expect(sec.textContent).toContain('You two just met');
    rerender(
      <MissionsSheet kind="daily" {...props} language="pt-BR"
        marks={{ daily: null, torneio: null, conquistas: null }} firstDay={null} />,
    );
    expect(document.querySelector('[data-missions-section="first-day"]')).toBeNull();
  });
});
