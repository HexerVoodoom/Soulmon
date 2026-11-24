// @vitest-environment jsdom
/** 24/11/2026 (opção A): o pagante não vê "Limite atingido" nem UnlockNudge no CreateModal; o demo continua igual a antes. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { CreateModal } from './CreateModal';

afterEach(cleanup);
const mk = (extra: Record<string, unknown>) => render(
  <CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="pt-BR" activitiesCount={12} {...extra} />,
);

describe('CreateModal: limite como sugestão', () => {
  it('pagante (App passa teto Infinity): sem "Limite atingido", sem dica, sem convite de desbloqueio', () => {
    mk({ activitiesCap: Infinity, capIsDemoBoundary: false, onUnlock: () => {} });
    expect(document.body.textContent).not.toMatch(/Limite atingido|sem limites|Quer um teto/i);
    expect(document.querySelector('[data-create-cap-hint]')).toBeNull();
  });
  it('demo no teto: igual a hoje (Limite atingido + dica + convite)', () => {
    mk({ activitiesCap: 6, activitiesCount: 6, capIsDemoBoundary: true, onUnlock: () => {} });
    expect(document.body.textContent).toMatch(/Limite atingido/);
    expect(document.querySelector('[data-create-cap-hint]')?.textContent).toMatch(/^Modo grátis: até 6 hábitos ativos/);
    expect(document.body.textContent).toMatch(/Quer um teto que cresce com você\?/);
  });
  it('App: só o demo recebe teto duro na UI; o pagante recebe Infinity', () => {
    const app = readFileSync('src/App.tsx', 'utf8').replace(/\r\n/g, '\n');
    expect(app).toMatch(/const hardHabitCap = tierForRules === 'demo' \? activityCapFor\('demo', gameState\.maxActivityCap\) : Infinity;/);
    expect(app).toMatch(/activitiesCap=\{hardHabitCap\}/);
    expect(app).toMatch(/habitsCap=\{hardHabitCap\}/);
  });
});
