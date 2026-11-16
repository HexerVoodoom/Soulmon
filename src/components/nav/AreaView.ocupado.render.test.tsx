// @vitest-environment jsdom
/**
 * RODADA 4 (N9): o Soulmon na Fenda/missão do clã NÃO fecha mais duelo, torneio nem passeio — o toque abre a folha.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, act, screen, waitFor } from '@testing-library/react';
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

describe('Fenda (na Exploração desde #186): duas portas — Entrar no Rift / Ver o mapa (§462)', () => {
  it('com descida: o toque abre a folha com as duas portas; "Descer" entra direto na DungeonGame (sem 2º passo)', async () => {
    const { container } = renderWithCss(<AreaView {...{ ...base('exploracao'), naMasmorra: true }} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="fenda"]') as HTMLElement); });
    await waitFor(() => expect(container.querySelector('[data-masmorra-map]')).not.toBeNull());
    await act(async () => { fireEvent.click(container.querySelector('[data-masmorra-start]') as HTMLElement); });
    expect(container.querySelector('[data-masmorra-start]')).toBeNull();
  });
  it('"Ver o mapa" abre o mapa de andares em tela cheia e o voltar dele devolve à folha', async () => {
    const { container } = renderWithCss(<AreaView {...base('exploracao')} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="fenda"]') as HTMLElement); });
    expect(container.querySelector('[data-rift-map]')).toBeNull();
    await waitFor(() => expect(container.querySelector('[data-masmorra-map]')).not.toBeNull());
    await act(async () => { fireEvent.click(container.querySelector('[data-masmorra-map]') as HTMLElement); });
    expect(await screen.findByText(/Rift map|Mapa da Fenda/)).toBeTruthy();
    expect(container.querySelector('[data-rift-map]')).not.toBeNull();
    await act(async () => { fireEvent.click(container.querySelector('[data-rift-map-close]') as HTMLElement); });
    expect(container.querySelector('[data-rift-map]')).toBeNull();
    await waitFor(() => expect(container.querySelector('[data-masmorra-map]')).not.toBeNull());
  });
  it('sem descida: abre a folha da Fenda', async () => {
    const { container } = renderWithCss(<AreaView {...base('exploracao')} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="fenda"]') as HTMLElement); });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
  it('o Calabouço mostra o NPC próprio na folha', async () => {
    const { container } = renderWithCss(<AreaView {...base('exploracao')} />);
    await act(async () => { fireEvent.click(container.querySelector('[data-area-lot="dungeon"]') as HTMLElement); });
    expect(container.querySelector('img[src*="npc-jogos-dungeon"]')).not.toBeNull();
  });
});
