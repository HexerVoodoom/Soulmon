// @vitest-environment jsdom
/**
 * A DEMO NÃO ENTRA EM PvP (07/10/2026) — os prédios sociais do mapa ficam inertes:
 * Arena (Torneio, Duelo, Feira) e Hall (Biblioteca, Amigos, Guilda). O toque não
 * abre folha nenhuma e mostra a recusa curta na faixa de aviso do mapa. Fora da
 * demo o MESMO toque abre a folha (o controle do teste).
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';

// As folhas sociais são `lazy` e falam com a rede: aqui só importa se a folha ABRE.
vi.mock('../TournamentPage', () => ({ TournamentPage: () => <p data-stub="torneio">torneio</p> }));
vi.mock('../guild/GuildSheet', () => ({ GuildSheet: () => <p data-stub="guilda">guilda</p> }));
vi.mock('../arena/DueloSheet', () => ({ DueloSheet: () => <p data-stub="duelo">duelo</p> }));

const base = (area: 'arena' | 'hall', over: Record<string, unknown> = {}): ComponentProps<typeof AreaView> => ({
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

async function toque(el: HTMLElement) {
  await act(async () => { fireEvent.click(el); });
}

describe('AreaView na demo', () => {
  for (const [area, ids] of [['arena', ['torneio', 'duelo', 'feira']], ['hall', ['biblioteca', 'amigos', 'guilda']]] as const) {
    for (const id of ids) {
      it(`${area}.${id}: toque inerte, sem folha, com a recusa curta`, async () => {
        const { container } = renderWithCss(<AreaView {...base(area, { demo: true })} />);
        expect(lote(container, id)).not.toBeNull();
        await toque(lote(container, id));
        expect(dialogo(container)).toBeNull();
        expect(container.querySelector('[data-stub]')).toBeNull();
        expect(container.textContent).toContain('Not available in the demo.');
      });
    }
  }

  it('em PT a recusa também é curta e sem culpa', async () => {
    const { container } = renderWithCss(<AreaView {...base('arena', { demo: true, language: 'pt-BR' })} />);
    await toque(lote(container, 'torneio'));
    expect(container.textContent).toContain('Não disponível na demo.');
  });

  it('abrir direto pelo `initialSheet` (missão da Home → Torneio) também não entra na demo', () => {
    const { container } = renderWithCss(<AreaView {...base('arena', { demo: true, initialSheet: 'torneio' })} />);
    expect(dialogo(container)).toBeNull();
    expect(container.textContent).toContain('Not available in the demo.');
  });

  it('CONTROLE: fora da demo o mesmo toque abre a folha, sem recusa', async () => {
    const { container } = renderWithCss(<AreaView {...base('arena')} />);
    await toque(lote(container, 'torneio'));
    expect(dialogo(container)).not.toBeNull();
    expect(container.textContent).not.toContain('Not available in the demo.');
  });
});
