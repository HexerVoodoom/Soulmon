// @vitest-environment jsdom
/**
 * O MENU DE MISSÕES DA HOME (07/10/2026): "Hoje" e "Esta semana" separados; sem lista de
 * Materiais, sem "abre amanhã"; o ícone da Home some sem nada a fazer nem a entregar.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MissionsSheet } from './MissionsSheet';
import { MissionsLink } from './MissionsLink';
import { CROSSINGS_EMPTY } from '../../types/travessias';
import { weeklyMissionsFor } from '../../utils/weeklyMissions';

afterEach(cleanup);

const [m] = weeklyMissionsFor('2026-W41');
const sheet = (language: 'en-US' | 'pt-BR') => render(
  <MissionsSheet
    open onClose={() => {}} language={language} crossings={CROSSINGS_EMPTY} onChange={vi.fn()}
    todayKey="2026-10-07" seed="s"
    weekly={[{ mission: m, count: 0, done: false, claimed: false }]} onClaimWeekly={vi.fn()}
    missionProgress={{}} marks={{ daily: 'available', torneio: 'available', conquistas: null }}
    buildings={{ state: undefined, day: '2026-10-07', bondLevel: 99, onClaim: vi.fn() }}
  />,
);

describe('MissionsSheet', () => {
  it('duas seções claras (Today / This week), o caderno em Hoje, e nada de Materials', async () => {
    sheet('en-US');
    await waitFor(() => expect(document.querySelector('[data-building-quest="exploracao.caderno"]')).not.toBeNull());
    const daily = document.querySelector('[data-missions-section="daily"]')!;
    const weekly = document.querySelector('[data-missions-section="weekly"]')!;
    expect(daily.getAttribute('aria-label')).toBe('Today');
    expect(weekly.getAttribute('aria-label')).toBe('This week');
    expect(daily.querySelector('[data-building-quest="exploracao.caderno"]')!.textContent).toContain('Write in the journal');
    expect(daily.querySelector('[data-travessias]')).not.toBeNull();
    expect(weekly.querySelector('[data-building-quest]')).toBeNull();
    // só o caderno fora o passeio: nenhuma outra missão de prédio no menu
    expect(document.querySelectorAll('[data-building-quest]').length).toBe(1);
    const t = document.body.textContent ?? '';
    expect(t).not.toMatch(/Materials|Materiais|opens tomorrow|abre amanhã/i);
    expect(document.querySelector('[data-materials]')).toBeNull();
  });

  it('PT-BR', async () => {
    sheet('pt-BR');
    await waitFor(() => expect(document.querySelector('[data-missions-section="daily"]')).not.toBeNull());
    expect(document.querySelector('[data-missions-section="daily"]')!.getAttribute('aria-label')).toBe('Hoje');
    expect(document.querySelector('[data-missions-section="weekly"]')!.getAttribute('aria-label')).toBe('Esta semana');
  });
});

describe('MissionsLink', () => {
  it('some sem marca; com marca aparece', () => {
    const { container, rerender } = render(<MissionsLink mark={null} label="Missions" markLabel={null} onClick={() => {}} />);
    expect(container.querySelector('[data-missions-link]')).toBeNull();
    rerender(<MissionsLink mark="ready" label="Missions" markLabel="Quest ready" onClick={() => {}} />);
    expect(container.querySelector('[data-missions-link]')).not.toBeNull();
  });
});
