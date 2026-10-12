// @vitest-environment jsdom
/**
 * O SOULMON NA MASMORRA FECHA O QUE USA O SOULMON (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * Os lotes que mandam o Soulmon fazer algo de verdade (duelo, torneio, passeio) não abrem a folha enquanto ele está na masmorra:
 * o toque chama o aviso `onBusy` (o `App` abre o "Ele está na masmorra" com o "Retirar da masmorra"). Mesma regra para o
 * `initialSheet` (a Home manda para o passeio) e, no sentido contrário, descer à masmorra com o Soulmon em missão da guilda.
 * Fora da masmorra o MESMO toque abre a folha (o controle).
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';

vi.mock('../TournamentPage', () => ({ TournamentPage: () => <p data-stub="torneio">torneio</p> }));
vi.mock('../arena/DueloSheet', () => ({ DueloSheet: () => <p data-stub="duelo">duelo</p> }));
vi.mock('../play/PasseioSheet', () => ({ PasseioSheet: () => <p data-stub="passeio">passeio</p> }));

const base = (area: 'arena' | 'exploracao', over: Record<string, unknown> = {}): ComponentProps<typeof AreaView> => ({
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
  ...over,
}) as unknown as ComponentProps<typeof AreaView>;

const lote = (c: HTMLElement, id: string) => c.querySelector(`[data-area-lot="${id}"]`) as HTMLElement;
const dialogo = (c: HTMLElement) => c.querySelector('[role="dialog"]');
async function toque(el: HTMLElement) { await act(async () => { fireEvent.click(el); }); }

describe('AreaView com o Soulmon na masmorra', () => {
  for (const [area, id, acao] of [['arena', 'duelo', 'duelo'], ['arena', 'torneio', 'torneio'], ['exploracao', 'passeio', 'passeio']] as const) {
    it(`${area}.${id}: o toque NÃO abre a folha e chama o aviso "${acao}"`, async () => {
      const onBusy = vi.fn();
      const { container } = renderWithCss(<AreaView {...base(area, { ocupado: { naMasmorra: true, missaoFora: false, onBusy } })} />);
      await toque(lote(container, id));
      expect(dialogo(container)).toBeNull();
      expect(container.querySelector('[data-stub]')).toBeNull();
      expect(onBusy).toHaveBeenCalledWith(acao);
    });

    it(`${area}.${id}: CONTROLE — fora da masmorra o mesmo toque abre a folha`, async () => {
      const onBusy = vi.fn();
      const { container } = renderWithCss(<AreaView {...base(area, { ocupado: { naMasmorra: false, missaoFora: false, onBusy } })} />);
      await toque(lote(container, id));
      expect(dialogo(container)).not.toBeNull();
      expect(onBusy).not.toHaveBeenCalled();
    });
  }

  it('abrir direto pelo `initialSheet` (a linha "Take a stroll" da Home) também cai no aviso, sem abrir a folha', async () => {
    const onBusy = vi.fn();
    const { container } = renderWithCss(<AreaView {...base('exploracao', { initialSheet: 'passeio', ocupado: { naMasmorra: true, missaoFora: false, onBusy } })} />);
    await act(async () => {});
    expect(dialogo(container)).toBeNull();
    expect(onBusy).toHaveBeenCalledWith('passeio');
  });

  it('sem a prop `ocupado` nada é trancado (as outras telas e testes não mudam)', async () => {
    const { container } = renderWithCss(<AreaView {...base('arena')} />);
    await toque(lote(container, 'duelo'));
    expect(dialogo(container)).not.toBeNull();
  });

  it('os lotes que NÃO usam o Soulmon seguem abertos na masmorra (a própria masmorra, o Caderno, os jogos)', async () => {
    const onBusy = vi.fn();
    const { container } = renderWithCss(<AreaView {...base('exploracao', { ocupado: { naMasmorra: true, missaoFora: false, onBusy } })} />);
    await toque(lote(container, 'masmorra'));
    expect(dialogo(container)).not.toBeNull();
    expect(onBusy).not.toHaveBeenCalled();
  });

  it('Soulmon em MISSÃO da guilda não desce à masmorra: o "Enter the dungeon" chama o aviso', async () => {
    const onBusy = vi.fn();
    const { container } = renderWithCss(<AreaView {...base('exploracao', { ocupado: { naMasmorra: false, missaoFora: true, onBusy } })} />);
    await toque(lote(container, 'masmorra'));
    await waitFor(() => expect(container.querySelector('[data-masmorra-start]')).not.toBeNull(), { timeout: 20000 });
    await toque(container.querySelector('[data-masmorra-start]') as HTMLElement);
    expect(onBusy).toHaveBeenCalledWith('masmorra-em-missao');
    expect(container.querySelector('[data-battle-stage]')).toBeNull();
  });
});
