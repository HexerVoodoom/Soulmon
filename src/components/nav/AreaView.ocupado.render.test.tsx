// @vitest-environment jsdom
/**
 * RODADA 4 (N9): o Soulmon na Fenda/missão do clã NÃO fecha mais duelo, torneio nem passeio — o toque abre a folha.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';

vi.mock('../TournamentPage', () => ({ TournamentPage: () => <p data-stub="torneio">torneio</p> }));
vi.mock('../arena/DueloSheet', () => ({ DueloSheet: () => <p data-stub="duelo">duelo</p> }));
vi.mock('../play/PasseioSheet', () => ({ PasseioSheet: () => <p data-stub="passeio">passeio</p> }));

const base = (area: 'arena' | 'exploracao'): ComponentProps<typeof AreaView> => ({
  area,
  language: 'en-US',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0,
  onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie',
  onEarnPoints: () => {},
  play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: null,
  hallContent: () => <p data-stub="hall">hall</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
}) as unknown as ComponentProps<typeof AreaView>;

describe('AreaView sem trava de Soulmon ocupado', () => {
  for (const [area, id] of [['arena', 'duelo'], ['arena', 'torneio'], ['exploracao', 'passeio']] as const) {
    it(`${area}.${id}: o toque abre a folha`, async () => {
      const { container } = renderWithCss(<AreaView {...base(area)} />);
      await act(async () => { fireEvent.click(container.querySelector(`[data-area-lot="${id}"]`) as HTMLElement); });
      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    });
  }
});

describe('Fenda: entrada direta com descida em curso', () => {
  it('com descida: abre a DungeonGame direto, sem a folha "Descer à Fenda"', async () => {
    const { container } = renderWithCss(<AreaView {...{ ...base('arena'), naMasmorra: true }} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="fenda"]') as HTMLElement); });
    expect(container.textContent).not.toMatch(/Descend|Descer/);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
  it('sem descida: abre a folha da Fenda', async () => {
    const { container } = renderWithCss(<AreaView {...base('arena')} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="fenda"]') as HTMLElement); });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
  it('o Calabouço mostra o NPC próprio na folha', async () => {
    const { container } = renderWithCss(<AreaView {...base('arena')} area={'jogos' as never} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="dungeon"]') as HTMLElement); });
    expect(container.querySelector('img[src*="npc-jogos-dungeon"]')).not.toBeNull();
  });
});
