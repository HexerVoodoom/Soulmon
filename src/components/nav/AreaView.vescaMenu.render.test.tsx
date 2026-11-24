// @vitest-environment jsdom
/**
 * Menu do prédio da Vesca (lote `evolucao`): UM só voltar, o do canto da folha. No menu ele fecha; nas sub-telas (Centro de Evolução e
 * Criar poção) volta ao menu de 2 botões; o Esc faz o mesmo. Não existe mais o círculo de voltar inline no corpo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss, installDomGlobals } from '../../test/renderEnv';
import { GameStateProvider } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { AreaView } from './AreaView';

vi.mock('../../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }), cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x', adoptCloudSave: async () => false,
}));
vi.mock('../../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

const base = (): ComponentProps<typeof AreaView> => ({
  area: 'laboratorio', language: 'pt-BR',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {}, play: {},
  labTab: 'evolution', onLabTab: () => {},
  labContent: <p data-testid="lab-evo">arvore</p>,
  potionContent: (onBack: () => void) => <div data-testid="lab-potion"><button type="button" onClick={onBack}>sai</button></div>,
  hallContent: () => <p>hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
  initialSheet: 'evolucao', onInitialSheetConsumed: vi.fn(),
}) as unknown as ComponentProps<typeof AreaView>;

beforeEach(() => { installDomGlobals(); localStorage.clear(); localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], totalXP: 100000 })); });
afterEach(cleanup);

const montar = () => renderWithCss(<GameStateProvider><AreaView {...base()} /></GameStateProvider>);
const canto = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-area-sheet-close]')!;

describe('menu da Vesca: voltar único', () => {
  it('Centro de Evolução aberto: o voltar do canto leva ao menu (não fecha); no menu, fecha', () => {
    const { container } = montar();
    expect(container.querySelector('[data-testid="lab-evo"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-area-sheet-close]')).toHaveLength(1);
    expect(container.querySelector('[data-back-arrow]')).toBeNull();
    fireEvent.click(canto(container));
    expect(container.querySelector('[data-lab-choice]')).not.toBeNull();
    expect(container.querySelector('[data-testid="lab-evo"]')).toBeNull();
    fireEvent.click(canto(container));
    expect(container.querySelector('[data-lab-choice]')).toBeNull();
  });

  it('Criar poção: o voltar do canto volta ao menu; Esc idem; sem círculo inline; no menu o Esc fecha', () => {
    const { container } = montar();
    fireEvent.click(canto(container)); // evolução -> menu
    fireEvent.click(container.querySelector('[data-lab-choice-potion]')!);
    expect(container.querySelector('[data-testid="lab-potion"]')).not.toBeNull();
    expect(container.querySelector('[data-back-arrow]')).toBeNull();
    expect(container.querySelector('[data-potion-menu-back]')).toBeNull();
    fireEvent.click(canto(container));
    expect(container.querySelector('[data-lab-choice]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-lab-choice-potion]')!);
    fireEvent.keyDown(container.querySelector('[role="dialog"]') ?? document.body, { key: 'Escape' });
    expect(container.querySelector('[data-lab-choice]')).not.toBeNull();
    fireEvent.keyDown(container.querySelector('[role="dialog"]') ?? document.body, { key: 'Escape' });
    expect(container.querySelector('[data-lab-choice]')).toBeNull();
  });
});
