// @vitest-environment jsdom
/**
 * Cartões de missão e "Ir" (dono, 14/10/2026, REGISTRO §62): um CARTÃO por missão em todas as abas, o "!" é o amarelo da paleta,
 * toda missão com lugar LEVA até ele (prédio fechado mostra o requisito em vez de navegar) e o "This week" não tem "!" na frente.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { MissionsLink } from './MissionsLink';
import { CROSSINGS_EMPTY } from '../../types/travessias';
import { dailyMissionsFor } from '../../utils/dailyMissions';
import { dailyTarget, weeklyTarget, achievementTarget } from '../../utils/missionTargets';
import { weeklyMissionPool, type WeeklyMission } from '../../utils/weeklyMissions';

afterEach(cleanup);

const DAY = '2026-10-14';
const semanal = (id: WeeklyMission['id']): WeeklyMission => weeklyMissionPool().find(m => m.id === id)!;
const T = { timeout: 20000 };

const mk = (over: Partial<Parameters<typeof MissionsSheet>[0]> = {}) => (
  <MissionsSheet
    open onClose={() => {}} language="en-US" crossings={CROSSINGS_EMPTY} onClaimStroll={vi.fn()} todayKey={DAY}
    weekly={[]} onClaimWeekly={vi.fn()} missionProgress={{}} marks={{ daily: 'available', torneio: 'available', conquistas: null }}
    bondLevel={99} onGoBuilding={vi.fn()}
    dailies={{ state: undefined, day: DAY, bondLevel: 99, onClaim: vi.fn() }}
    firsts={{ state: undefined, bondLevel: 99, onClaim: vi.fn() }}
    {...over}
  />
);

describe('um cartão por missão, com o "!" amarelo', () => {
  it('Diárias: o passeio, as 6 do dia e as primeiras vezes são cartões separados, cada um com seu "!" dourado e sem azul', async () => {
    render(mk());
    await waitFor(() => expect(document.querySelectorAll('[data-first-time]').length).toBeGreaterThan(0), T);
    const cartoes = [...document.querySelectorAll('li[data-mission-card]')];
    const dosDias = document.querySelectorAll('[data-daily-mission]').length;
    expect(dosDias).toBe(6);
    expect(cartoes.length).toBe(1 + dosDias + document.querySelectorAll('[data-first-time]').length);
    for (const c of cartoes) {
      expect(c.parentElement!.tagName).toBe('UL');
      expect(c.querySelector('[data-mission-mark="available"][data-mission-tone="gold"]')).not.toBeNull();
    }
    expect(document.querySelector('[data-quest-tone="blue"], [data-mission-tone="blue"]')).toBeNull();
  });

  it('Semanal: cada missão é um cartão, o "!" é dourado (não azul) e NÃO há "!" na frente de "This week"', async () => {
    render(mk({ initialTab: 'weekly', weekly: [semanal('rest-nights'), semanal('dungeon-runs')].map(mission => ({ mission, count: 0, done: false, claimed: false })) }));
    await waitFor(() => expect(document.querySelector('[data-missions-section="weekly"]')).not.toBeNull(), T);
    const sec = document.querySelector('[data-missions-section="weekly"]')!;
    expect(sec.getAttribute('aria-label')).toBe('This week');
    expect(sec.querySelector('h3 [data-mission-mark]')).toBeNull();
    expect(sec.querySelectorAll('li[data-mission-card]').length).toBe(2);
    expect(sec.querySelector('[data-mission-tone="blue"]')).toBeNull();
    expect(sec.querySelector('[data-mission-mark="available"][data-mission-tone="gold"]')).not.toBeNull();
  });

  it('Conquistas: continua um cartão por conquista', async () => {
    render(mk({ initialTab: 'achievements' }));
    await waitFor(() => expect(document.querySelector('[data-conquistas]')).not.toBeNull(), T);
    const itens = document.querySelectorAll('[data-conquistas] li[data-mission]');
    expect(itens.length).toBeGreaterThan(0);
    for (const li of itens) expect(li.parentElement!.tagName).toBe('UL');
  });

  it('o ícone da Home usa o "!" dourado, sem círculo (sem fundo nem borda)', () => {
    const { container } = render(<MissionsLink mark="available" tone="gold" label="Missions" markLabel="Quest available" onClick={() => {}} />);
    const b = container.querySelector<HTMLElement>('[data-missions-link]')!;
    expect(b.getAttribute('data-mission-tone')).toBe('gold');
    expect(b.style.background).toBe('transparent');
    expect(b.style.border === 'none' || b.style.borderStyle === 'none').toBe(true);
  });
});

describe('toda missão com lugar leva até ele', () => {
  it('diária de minijogo: tocar no título chama onGoBuilding com o prédio; cuidado leva à Home', async () => {
    const onGo = vi.fn();
    render(mk({ onGoBuilding: onGo }));
    await waitFor(() => expect(document.querySelectorAll('[data-daily-mission]').length).toBe(6), T);
    const lista = dailyMissionsFor(DAY, 99);
    const predio = lista.find(m => dailyTarget(m) !== 'home' && dailyTarget(m) !== null);
    if (predio) {
      fireEvent.click(document.querySelector(`[data-daily-mission="${predio.id}"] [data-mission-go]`)!);
      expect(onGo).toHaveBeenLastCalledWith(predio.building);
    }
    const cuidado = lista.find(m => dailyTarget(m) === 'home');
    if (cuidado) {
      fireEvent.click(document.querySelector(`[data-daily-mission="${cuidado.id}"] [data-mission-go]`)!);
      expect(onGo).toHaveBeenLastCalledWith('home');
    }
    expect(predio || cuidado).toBeTruthy();
  });

  it('primeira vez de prédio leva ao prédio; a estreia do passeio leva ao Passeio', async () => {
    const onGo = vi.fn();
    render(mk({ onGoBuilding: onGo }));
    await waitFor(() => expect(document.querySelector('[data-first-time="visit:hall.feira"]')).not.toBeNull(), T);
    fireEvent.click(document.querySelector('[data-first-time="visit:hall.feira"] [data-mission-go]')!);
    expect(onGo).toHaveBeenLastCalledWith('hall.feira');
    fireEvent.click(document.querySelector('[data-first-time="first-stroll"] [data-mission-go]')!);
    expect(onGo).toHaveBeenLastCalledWith('exploracao.passeio');
  });

  it('semanal com prédio aberto leva até ele', async () => {
    const onGo = vi.fn();
    render(mk({ initialTab: 'weekly', onGoBuilding: onGo, weekly: [{ mission: semanal('dungeon-runs'), count: 0, done: false, claimed: false }] }));
    await waitFor(() => expect(document.querySelector('[data-weekly-mission="dungeon-runs"] [data-mission-go]')).not.toBeNull(), T);
    fireEvent.click(document.querySelector('[data-weekly-mission="dungeon-runs"] [data-mission-go]')!);
    expect(onGo).toHaveBeenCalledWith('exploracao.masmorra');
  });

  it('PRÉDIO FECHADO não navega: sem "Ir", mostra o requisito de Vínculo', async () => {
    const onGo = vi.fn();
    render(mk({ initialTab: 'weekly', bondLevel: 1, onGoBuilding: onGo, weekly: [{ mission: semanal('tournament-match'), count: 0, done: false, claimed: false }] }));
    await waitFor(() => expect(document.querySelector('[data-weekly-mission="tournament-match"]')).not.toBeNull(), T);
    const c = document.querySelector('[data-weekly-mission="tournament-match"]')!;
    expect(c.querySelector('[data-mission-go]')).toBeNull();
    expect(c.querySelector('[data-mission-lock]')!.textContent).toMatch(/Opens at Bond \d/);
    expect(onGo).not.toHaveBeenCalled();
  });

  it('conquista de Masmorra leva à Masmorra', async () => {
    const onGo = vi.fn();
    render(mk({ initialTab: 'achievements', onGoBuilding: onGo, missionsClaimed: [] }));
    await waitFor(() => expect(document.querySelector('[data-conquistas]')).not.toBeNull(), T);
    fireEvent.click(document.querySelector('[data-conquistas] [role="tab"][data-tab-key="dungeon"]')!);
    await waitFor(() => expect(document.querySelector('[data-conquistas] [data-mission-go]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-conquistas] [data-mission-go]')!);
    expect(onGo).toHaveBeenCalledWith('exploracao.masmorra');
  });
});

describe('tabela de destinos', () => {
  it('toda semanal e toda categoria de conquista têm destino resolvido (prédio, Home ou nenhum)', () => {
    for (const m of weeklyMissionPool()) expect(weeklyTarget(m.id) === null || typeof weeklyTarget(m.id) === 'string').toBe(true);
    expect(weeklyTarget('dungeon-runs')).toBe('exploracao.masmorra');
    expect(weeklyTarget('tournament-match')).toBe('arena.torneio');
    expect(weeklyTarget('shower')).toBe('home');
    expect(achievementTarget('constancy')).toBeNull();
    expect(achievementTarget('games')).toBe('jogos.salao');
  });
});
