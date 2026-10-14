// @vitest-environment jsdom
// @vitest-environment jsdom
/**
 * O MENU DE MISSÕES DA HOME (reescrito em 14/10/2026 para a folha ÚNICA com ABAS: Diárias | Semanal | Conquistas).
 * Antes eram dois acessos (`kind` daily/weekly) e dois ícones; o teste antigo de "Weekly" e de PT-BR falhava na main por assumir
 * essa estrutura e o rótulo antigo. Agora: as abas navegam e PRESERVAM estado, o ícone é um só e fica sempre (esmaecido sem pendência).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MissionsSheet, type MissionsTab } from './MissionsSheet';
import { MissionsLink } from './MissionsLink';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import { claimStroll } from '../../utils/travessiasSave';
import { completeBuildingQuest, claimBuildingQuest, type BuildingQuestState } from '../../utils/buildingQuests';
import { weeklyMissionsFor } from '../../utils/weeklyMissions';

afterEach(cleanup);

const [m] = weeklyMissionsFor('2026-W41');
const sheet = (language: 'en-US' | 'pt-BR', initialTab: MissionsTab = 'daily', state?: BuildingQuestState) => render(
  <MissionsSheet
    initialTab={initialTab}
    open onClose={() => {}} language={language} crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()}
    todayKey="2026-10-07"
    weekly={[{ mission: m, count: 0, done: false, claimed: false }]} onClaimWeekly={vi.fn()}
    missionProgress={{}} marks={{ daily: 'available', torneio: 'available', conquistas: null }}
    buildings={{ state, day: '2026-10-07', bondLevel: 99, onClaim: vi.fn() }}
  />,
);
const tab = (key: string) => document.querySelector<HTMLButtonElement>(`[role="tab"][data-tab-key="${key}"]`)!;
const panel = (key: string) => document.querySelector<HTMLElement>(`[data-missions-panel="${key}"]`);

describe('MissionsSheet: uma folha, três abas', () => {
  it('Daily abre primeiro: Hoje (passeio + journaling); semana e conquistas ainda não montadas', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[data-building-quest="exploracao.caderno"]')).not.toBeNull(), { timeout: 8000 });
    const daily = document.querySelector('[data-missions-section="daily"]')!;
    expect(daily.getAttribute('aria-label')).toBe('Today');
    expect(daily.querySelector('[data-building-quest="exploracao.caderno"]')!.textContent).toContain('Write an entry in your journal');
    expect(daily.querySelector('[data-stroll-line]')!.textContent).toContain('Take a stroll');
    expect(daily.querySelector('[data-travessias]')).toBeNull();
    expect(panel('weekly')).toBeNull();
    expect(panel('achievements')).toBeNull();
    expect(document.querySelectorAll('[data-building-quest]').length).toBe(1);
    expect(document.body.textContent ?? '').not.toMatch(/Materials|Materiais|opens tomorrow|abre amanhã/i);
  });

  it('tablist compacta com as três abas, nome inteiro, aria-selected na ativa', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[role="tablist"]')).not.toBeNull());
    const list = document.querySelector('[role="tablist"]')!;
    expect(list.className).toContain('sm2-kit-tabs-compact');
    expect([...list.querySelectorAll('[role="tab"]')].map(t => t.querySelector('[data-tab-label]')!.textContent)).toEqual(['Dailies', 'Weekly', 'Achievements']);
    expect(tab('daily').getAttribute('aria-selected')).toBe('true');
    expect(tab('weekly').getAttribute('aria-selected')).toBe('false');
  });

  it('tocar na aba troca o painel; voltar preserva o que já estava (não remonta)', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[data-building-quest]')).not.toBeNull(), { timeout: 8000 });
    const quest = document.querySelector('[data-building-quest]')!;
    fireEvent.click(tab('weekly'));
    await waitFor(() => expect(document.querySelector('[data-missions-section="weekly"]')).not.toBeNull(), { timeout: 8000 });
    expect(document.querySelector('[data-missions-section="weekly"]')!.getAttribute('aria-label')).toBe('This week');
    expect(panel('weekly')!.hidden).toBe(false);
    expect(panel('daily')!.hidden).toBe(true);
    fireEvent.click(tab('achievements'));
    await waitFor(() => expect(document.querySelector('[data-missions-section="achievements"]')).not.toBeNull(), { timeout: 8000 });
    expect(document.querySelector('[data-missions-section="achievements"]')!.getAttribute('aria-label')).toBe('Achievements');
    expect(panel('weekly')!.hidden).toBe(true);
    fireEvent.click(tab('daily'));
    expect(panel('daily')!.hidden).toBe(false);
    expect(document.querySelector('[data-building-quest]')).toBe(quest);
  });

  it('deslizar para o lado troca de aba (e não passa do fim)', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[data-missions-swipe]')).not.toBeNull());
    const area = document.querySelector('[data-missions-swipe]')!;
    const swipe = (dx: number) => { fireEvent.pointerDown(area, { clientX: 200, clientY: 100 }); fireEvent.pointerUp(area, { clientX: 200 + dx, clientY: 104 }); };
    swipe(-120);
    expect(tab('weekly').getAttribute('aria-selected')).toBe('true');
    swipe(-120);
    expect(tab('achievements').getAttribute('aria-selected')).toBe('true');
    swipe(-120);
    expect(tab('achievements').getAttribute('aria-selected')).toBe('true');
    swipe(120);
    expect(tab('weekly').getAttribute('aria-selected')).toBe('true');
    swipe(10);
    expect(tab('weekly').getAttribute('aria-selected')).toBe('true');
  });

  it('abre direto numa aba por initialTab (weekly): sem diária montada', async () => {
    sheet('en-US', 'weekly');
    await waitFor(() => expect(document.querySelector('[data-missions-section="weekly"]')).not.toBeNull(), { timeout: 8000 });
    expect(tab('weekly').getAttribute('aria-selected')).toBe('true');
    expect(panel('daily')).toBeNull();
    expect(document.querySelector('[data-building-quest]')).toBeNull();
  });

  it('ponto de pendência na aba que tem marca (com texto para leitor de tela); sem marca, sem ponto', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[role="tablist"]')).not.toBeNull());
    expect(tab('daily').querySelector('[data-tab-dot="available"]')).not.toBeNull();
    expect(tab('weekly').querySelector('[data-tab-dot="available"]')).not.toBeNull();
    expect(tab('achievements').querySelector('[data-tab-dot]')).toBeNull();
    expect(tab('daily').textContent).toContain('Quest available');
  });

  it('PT-BR', async () => {
    sheet('pt-BR');
    await waitFor(() => expect(document.querySelector('[data-missions-section="daily"]')).not.toBeNull());
    expect(document.querySelector('[data-missions-section="daily"]')!.getAttribute('aria-label')).toBe('Hoje');
    expect([...document.querySelectorAll('[role="tab"] [data-tab-label]')].map(t => t.textContent)).toEqual(['Diárias', 'Semanal', 'Conquistas']);
    await waitFor(() => expect(document.querySelector('[data-building-quest]')!.textContent).toContain('Faça um registro no journaling'));
    fireEvent.click(tab('weekly'));
    await waitFor(() => expect(document.querySelector('[data-missions-section="weekly"]')).not.toBeNull(), { timeout: 8000 });
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
      <MissionsSheet open onClose={() => {}} language="en-US" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()}
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
    <MissionsSheet open onClose={() => {}} language={language} crossings={crossings} onClaimStroll={onClaimStroll}
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

describe('MissionsLink: um ícone só', () => {
  it('rótulo, tom, marca e linha; com marca "ready" azul e com "available" dourado', () => {
    const { container, rerender } = render(<MissionsLink mark="available" label="Missions" markLabel="Quest available" onClick={() => {}} />);
    const d = container.querySelector<HTMLElement>('[data-missions-link]')!;
    expect(container.querySelectorAll('[data-missions-link]').length).toBe(1);
    expect(d.getAttribute('aria-label')).toBe('Missions, Quest available');
    expect(d.getAttribute('data-mission-tone')).toBe('gold');
    expect(d.getAttribute('data-mission-mark-home')).toBe('available');
    rerender(<MissionsLink mark="ready" tone="blue" label="Missions" markLabel="Quest ready" onClick={() => {}} />);
    expect(container.querySelector('[data-missions-link]')!.getAttribute('data-mission-tone')).toBe('blue');
  });
  it('sem pendência o ícone FICA (a porta das abas é permanente), esmaecido e só com o rótulo', () => {
    const onClick = vi.fn();
    const { container } = render(<MissionsLink mark={null} label="Missions" markLabel={null} onClick={onClick} />);
    const b = container.querySelector<HTMLElement>('[data-missions-link]')!;
    expect(b).not.toBeNull();
    expect(b.getAttribute('aria-label')).toBe('Missions');
    expect(b.getAttribute('data-mission-mark-home')).toBe('none');
    expect(b.style.opacity).toBe('0.6');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
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
      <MissionsSheet {...props} language="en-US"
        marks={{ daily: null, torneio: null, conquistas: null, firstDay: 'available' }} firstDay={fd} />,
    );
    await waitFor(() => expect(document.querySelector('[data-missions-section="first-day"]')).not.toBeNull());
    const sec = document.querySelector('[data-missions-section="first-day"]')!;
    expect(sec.getAttribute('aria-label')).toBe('First day');
    expect(sec.getAttribute('data-quest-mark')).toBe('available');
    expect(sec.textContent).toContain('You two just met');
    rerender(
      <MissionsSheet {...props} language="pt-BR"
        marks={{ daily: null, torneio: null, conquistas: null }} firstDay={null} />,
    );
    expect(document.querySelector('[data-missions-section="first-day"]')).toBeNull();
  });
});

describe('Hoje sem "!" no título e "Take a stroll" leva ao prédio (11/10/2026)', () => {
  it('o "!" não fica na frente de "Today"; fica só na linha da missão; tocar em "Take a stroll" chama onGoStroll', async () => {
    const onGoStroll = vi.fn();
    render(
      <MissionsSheet
        open onClose={() => {}} language="en-US" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()} onGoStroll={onGoStroll}
        todayKey="2026-10-07" weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}}
        marks={{ daily: 'available', torneio: null, conquistas: null }}
      />,
    );
    await waitFor(() => expect(document.querySelector('[data-missions-section="daily"]')).not.toBeNull());
    const daily = document.querySelector('[data-missions-section="daily"]')!;
    expect(daily.querySelector('h3 [data-mission-mark]')).toBeNull();
    expect(daily.querySelector('[data-stroll-line] [data-mission-mark="available"]')).not.toBeNull();
    fireEvent.click(daily.querySelector('[data-stroll-go]')!);
    expect(onGoStroll).toHaveBeenCalledTimes(1);
  });
});

// Dono, 11/10/2026: toda missão diária com lugar próprio NAVEGA até ele (como o Passeio).
describe('missão do Caderno leva ao prédio', () => {
  it('o texto da linha é um botão que chama onGo("exploracao.caderno"); resgatada, vira texto', async () => {
    const onGo = vi.fn();
    const base = { open: true, onClose: () => {}, language: 'pt-BR' as const, crossings: CROSSINGS_EMPTY, onClaimStroll: vi.fn(), todayKey: '2026-10-07',
      weekly: [], onClaimWeekly: vi.fn(), missionProgress: {}, marks: { daily: 'available' as const, torneio: null, conquistas: null } };
    render(<MissionsSheet {...base} buildings={{ state: undefined, day: '2026-10-07', bondLevel: 99, onClaim: vi.fn(), onGo }} />);
    const go = await waitFor(() => { const b = document.querySelector('[data-building-go="exploracao.caderno"]'); expect(b).not.toBeNull(); return b as HTMLButtonElement; }, { timeout: 8000 });
    fireEvent.click(go);
    expect(onGo).toHaveBeenCalledWith('exploracao.caderno');
    cleanup();
    let st: BuildingQuestState | undefined = completeBuildingQuest(undefined, '2026-10-07', 'exploracao.caderno', 99);
    st = claimBuildingQuest(st, '2026-10-07', 'exploracao.caderno', 99).state ?? st;
    render(<MissionsSheet {...base} buildings={{ state: st, day: '2026-10-07', bondLevel: 99, onClaim: vi.fn(), onGo }} />);
    await waitFor(() => expect(document.querySelector('[data-building-quest]')).not.toBeNull(), { timeout: 8000 });
    expect(document.querySelector('[data-building-go]')).toBeNull();
  });
});
