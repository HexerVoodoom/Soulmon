// @vitest-environment jsdom
/** O Soulsmith em MAPA de chakras (04/11/2026): 3 chakras, balão com as duas opções, brilho quando dá para aprimorar, upgrade pelo balão, EN e Esc. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { xpForLevel } from '../utils/bond';
import ForgeCard from './ForgeCard';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }), cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x', adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify({ forge: gameState.forge, mats: gameState.buildingQuests?.materials })}</pre>;
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);
const bq = (materials: Record<string, number>) => ({ day: 'Mon Oct 05 2026', visited: [], claimed: [], materials });
const nivel1 = (extra: Record<string, unknown> = {}) => ({
  totalXP: xpForLevel(6), equipment: { owned: ['eq-nucleo-t1'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 },
  forge: { v: 2, levels: { 'eq-nucleo-t1': 1 }, picks: {} }, ...extra,
});
function abrir(save: Record<string, unknown>, language = 'pt-BR') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, ...save }));
  render(<GameStateProvider><ForgeCard language={language} view="map" /><Espiao /></GameStateProvider>);
}
const click = (el: Element) => act(() => { fireEvent.click(el); });
const chakra = (s: string) => document.querySelector<HTMLButtonElement>(`[data-vitra-chakra="${s}"]`)!;

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Soulsmith em mapa', () => {
  it('três chakras (um por equipamento), figura e nenhum balão aberto', () => {
    abrir({});
    expect(document.querySelectorAll('[data-vitra-chakra]')).toHaveLength(3);
    expect(document.querySelector('[data-vitra-art]')).not.toBeNull();
    expect(document.querySelector('[data-forge-pop]')).toBeNull();
    expect(document.querySelectorAll('[data-vitra-chakra][data-ready]')).toHaveLength(0);
  });

  it('tela cheia: palco com a proporção da arte, chakras no eixo central sobre os anéis medidos e Voltar quando há onBack', async () => {
    abrir({});
    expect(document.querySelector('[data-vitra-stage]')).not.toBeNull();
    const { CHAKRA } = await import('./forge/VitraMap');
    expect(CHAKRA.nucleo).toMatchObject({ x: 50, y: 29.9 });
    expect(CHAKRA.carapaca).toMatchObject({ x: 50, y: 41.6 });
    expect(CHAKRA.rastro).toMatchObject({ x: 50, y: 53 });
    const spot = chakra('nucleo').parentElement as HTMLElement;
    expect(spot.style.left).toBe('50%'); expect(spot.style.top).toBe('29.9%');
    expect(document.querySelector('[data-vitra-back]')).toBeNull();
    cleanup();
    const onBack = vi.fn();
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' } }));
    render(<GameStateProvider><ForgeCard language="pt-BR" view="map" onBack={onBack} /></GameStateProvider>);
    click(document.querySelector('[data-vitra-back]')!);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('com material o chakra da peça brilha; sem material, não', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }));
    expect(chakra('nucleo').hasAttribute('data-ready')).toBe(true);
    expect(chakra('carapaca').hasAttribute('data-ready')).toBe(false);
    cleanup();
    abrir(nivel1({ buildingQuests: bq({}) }));
    expect(chakra('nucleo').hasAttribute('data-ready')).toBe(false);
  });

  it('tocar abre o balão com as DUAS opções; escolher B e aprimorar debita, sobe o nível e fecha o balão', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }));
    click(chakra('nucleo'));
    const pop = document.querySelector('[data-forge-pop="eq-nucleo-t1"]')!;
    const opcoes = [...pop.querySelectorAll('[data-forge-option]')];
    expect(opcoes.map(o => o.getAttribute('data-forge-attr'))).toEqual(['atk', 'def']);
    expect(pop.textContent).toMatch(/Minério 3\/2/);
    click(opcoes[1]);
    click(pop.querySelector('[data-forge-upgrade-btn]')!);
    expect(document.querySelector('[data-forge-pop]')).toBeNull();
    expect(estado().forge.levels['eq-nucleo-t1']).toBe(2);
    expect(estado().forge.picks['eq-nucleo-t1']).toEqual(['b']);
    expect(estado().mats.ore).toBe(1);
    expect(document.querySelector('[data-forge-seal]')).not.toBeNull();
  });

  it('sem material o botão fica desabilitado e nada é gasto', () => {
    abrir(nivel1({ buildingQuests: bq({}) }));
    click(chakra('nucleo'));
    const btn = document.querySelector<HTMLButtonElement>('[data-forge-upgrade-btn]')!;
    expect(btn.disabled).toBe(true);
    click(btn);
    expect(estado().forge.levels['eq-nucleo-t1']).toBe(1);
  });

  it('peça ainda não forjada: balão informativo, sem opções; tocar de novo e Esc fecham', () => {
    abrir({});
    click(chakra('rastro'));
    expect(document.querySelector('[data-forge-pop]')!.textContent).toMatch(/Ainda não forjado/);
    expect(document.querySelectorAll('[data-forge-option]')).toHaveLength(0);
    click(chakra('rastro'));
    expect(document.querySelector('[data-forge-pop]')).toBeNull();
    click(chakra('rastro'));
    act(() => { fireEvent.keyDown(document.querySelector('[data-vitra-map]')!, { key: 'Escape' }); });
    expect(document.querySelector('[data-forge-pop]')).toBeNull();
  });

  it('inglês: Upgrade, Lv e "More damage"', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }), 'en-US');
    click(chakra('nucleo'));
    const pop = document.querySelector('[data-forge-pop]')!;
    expect(pop.textContent).toMatch(/Lv 1/);
    expect(pop.textContent).toMatch(/More damage/);
    expect(pop.textContent).toMatch(/Upgrade/);
    expect(pop.textContent).not.toMatch(/Nível|Aprimorar/);
  });

  it('peça no nível 2+ oferece Reforjar, que abre o diálogo de refazer', () => {
    abrir(nivel1({ forge: { v: 2, levels: { 'eq-nucleo-t1': 2 }, picks: { 'eq-nucleo-t1': ['a'] } }, buildingQuests: bq({}) }));
    click(chakra('nucleo'));
    click(document.querySelector('[data-forge-reforge]')!);
    expect(document.querySelector('[data-forge-dialog="reforge"]')).not.toBeNull();
  });
});
