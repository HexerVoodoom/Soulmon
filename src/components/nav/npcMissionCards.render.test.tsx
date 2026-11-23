// @vitest-environment jsdom
/** A lista de missões do dia mostra, em cada cartão, NOME, o que fazer, RECOMPENSA e QUEM passa (REGISTRO §314). */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { dailyMissionEntries } from './DailyMissionList';
import { dailyMissionsFor, npcsOfWeek } from '../../utils/dailyMissions';
import { NPC_MISSIONS } from '../../utils/npcMissions';
import { MissionCard } from './MissionCard';
import { giverOf } from './npcGiver';
import { LOT_NPC_VOICE } from '../../utils/areaNpcVoice';

afterEach(cleanup);

const lista = (day: string, bond: number, language: 'pt-BR' | 'en-US') => render(
  <ul>{dailyMissionEntries({ language, state: undefined, day, bondLevel: bond, onClaim: () => {} }).map(e => e.node)}</ul>,
);

describe('cartões das missões do dia: nome, descrição, recompensa e NPC', () => {
  it('missão de NPC: nome em destaque, o que fazer, recompensa visível (mesmo sem estar pronta) e "Com <NPC>" com retrato', () => {
    const day = '2026-12-01';
    const m = npcsOfWeek(day, 10)[0];
    lista(day, 10, 'pt-BR');
    const li = document.querySelector(`[data-daily-mission="${m.id}"]`)!;
    expect(li.getAttribute('data-status')).toBe('available');
    expect(li.textContent).toContain(m.namePt!);
    expect(li.querySelector('[data-mission-desc]')!.textContent).toBe(m.descPt);
    expect(li.querySelector('[data-mission-reward-text]')!.textContent).toMatch(/\+1 \S+/);
    const g = giverOf(m.npc, 'pt-BR')!;
    expect(li.querySelector('[data-mission-giver]')!.textContent).toBe(`Com ${g.name}`);
    expect(li.querySelector('[data-mission-giver-art]')!.getAttribute('src')).toBe(g.art);
  });

  it('a recompensa continua visível DEPOIS de resgatada (REGISTRO §318)', () => {
    const day = '2026-12-01';
    const m = npcsOfWeek(day, 10)[0];
    cleanup();
    render(<ul>{dailyMissionEntries({ language: 'pt-BR', state: { day, counts: {}, claimed: [m.id] }, day, bondLevel: 10, onClaim: () => {} }).map(e => e.node)}</ul>);
    const li = document.querySelector(`[data-daily-mission="${m.id}"]`)!;
    expect(li.getAttribute('data-status')).toBe('claimed');
    expect(li.querySelector('[data-mission-reward-text]')!.textContent).toMatch(/\+1 /);
  });

  it('EN: Reward / From', () => {
    const day = '2026-12-01';
    const m = npcsOfWeek(day, 10)[0];
    lista(day, 10, 'en-US');
    const li = document.querySelector(`[data-daily-mission="${m.id}"]`)!;
    expect(li.querySelector('[data-mission-reward-text]')!.textContent).toMatch(/\+1 /);
    expect(li.querySelector('[data-mission-giver]')!.textContent).toMatch(/^From /);
  });

  it('TODA missão do dia mostra recompensa e quem a passa (as diárias comuns usam o anfitrião do prédio delas)', () => {
    for (const d of ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04']) {
      cleanup();
      lista(d, 10, 'pt-BR');
      const cards = [...document.querySelectorAll('[data-daily-mission]')];
      expect(cards.length).toBe(dailyMissionsFor(d, 10).length);
      for (const c of cards) {
        expect(c.querySelector('[data-mission-reward-text]'), c.getAttribute('data-daily-mission')!).not.toBeNull();
        expect(c.querySelector('[data-mission-giver]'), c.getAttribute('data-daily-mission')!).not.toBeNull();
      }
    }
  });

  it('todo NPC com missão resolve nome e retrato (PT e EN)', () => {
    for (const m of NPC_MISSIONS) for (const l of ['pt-BR', 'en-US'] as const) {
      const g = giverOf(m.npc, l);
      expect(g?.name, `${m.npc} ${l}`).toBeTruthy();
      expect(g?.art, `${m.npc} arte`).toBeTruthy();
    }
    expect(Object.keys(LOT_NPC_VOICE).length).toBeGreaterThan(10);
  });

  it('retrato quadrado do NPC à direita (rosto em foco) e recompensa em ícone com aria-label (12/11/2026)', () => {
    const day = '2026-12-01';
    const m = npcsOfWeek(day, 10)[0];
    lista(day, 10, 'en-US');
    const li = document.querySelector(`[data-daily-mission="${m.id}"]`)!;
    const art = li.querySelector('[data-mission-giver-art]') as HTMLImageElement;
    expect(art.style.objectFit).toBe('cover');
    expect(art.style.objectPosition).toBe('50% 18%');
    expect(art.style.width).toBe(art.style.height);
    const chip = li.querySelector('[data-reward-chip="material"]')!;
    expect(chip.getAttribute('aria-label')).toMatch(/^Reward: \+1 \S+/);
    expect(chip.querySelector('img, span')).not.toBeNull();
  });

  it('sem NPC não há retrato: cartão sem giver não renderiza a imagem', () => {
    cleanup();
    render(<ul><MissionCard language="en-US" attrs={{}} status="open" title="x" /></ul>);
    expect(document.querySelector('[data-mission-giver-art]')).toBeNull();
  });
});
