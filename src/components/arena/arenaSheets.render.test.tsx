// @vitest-environment jsdom
/**
 * A Arena (minimal-ui F5) — as folhas Torneio e Duelo.
 *
 * Torneio: abre na FAIXA (antes do ranking e antes de desafiar), tem as
 * missões da semana pagas em Emblemas e a loja de Emblemas, que só vende
 * cosmético e só mostra Emblemas. Duelo: mostra a ficha e abre a luta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { TournamentPage } from '../TournamentPage';
import { DueloSheet } from './DueloSheet';
import { TOURNAMENT_ITEMS } from '../../utils/shop';
import { TOURNAMENT_TIERS } from '../../utils/tournamentTiers';
import { weeklyMissionsFor } from '../../utils/weeklyMissions';

const saveId = 'a'.repeat(32);
const base = {
  saveId,
  petStage: 'rookie',
  pvpEnabled: false,
  onTogglePvp: () => {},
  onMatchPlayed: () => {},
  trophies: [],
  language: 'en-US',
  emblems: 20,
  onEarnEmblems: () => {},
  totalXP: 0,
};
const shop = {
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: vi.fn(() => true), onEquip: () => {}, onEquipFurniture: () => {} },
};

beforeEach(() => {
  // O ranking responde com o jogador na faixa Broto (lifetime 150).
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    rank: [{ id: saveId, name: 'Eu', stage: 'rookie', points: 40, lifetime: 150 }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Torneio', () => {
  it('abre na Faixa, com as cinco faixas em fila e a atual marcada', async () => {
    const { container } = renderWithCss(<TournamentPage {...base} shop={shop} />);
    expect(screen.getByRole('tab', { name: 'Tier' }).getAttribute('aria-selected')).toBe('true');
    await waitFor(() => expect(container.querySelector('[data-tier-state="current"]')).not.toBeNull());
    expect(container.querySelectorAll('[data-tier]').length).toBe(TOURNAMENT_TIERS.length);
    expect(container.querySelector('[data-tier-state="current"]')!.getAttribute('data-tier')).toBe('broto');
    expect(container.querySelector('[data-tier="semente"]')!.getAttribute('data-tier-state')).toBe('passed');
  });

  it('as missões da semana aparecem e o resgate paga pelo id', () => {
    const [m] = weeklyMissionsFor('2026-W39');
    const onClaim = vi.fn();
    renderWithCss(
      <TournamentPage
        {...base}
        weeklyMissions={[{ mission: m, count: m.target, done: true, claimed: false }]}
        onClaimWeekly={onClaim}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Missions' }));
    fireEvent.click(screen.getByRole('button', { name: `Claim ${m.emblems} Emblems` }));
    expect(onClaim).toHaveBeenCalledWith(m.id);
  });

  it('a loja de Emblemas: só os prêmios do Torneio, só Emblemas, só cosmético', () => {
    const { container } = renderWithCss(<TournamentPage {...base} shop={shop} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Shop' }));
    const ids = Array.from(container.querySelectorAll('[data-shop-item]')).map(el => el.getAttribute('data-shop-item'));
    expect(ids).toEqual(TOURNAMENT_ITEMS.map(i => i.id));
    const loja = container.querySelector('[data-tournament-shop]')!;
    expect(loja.textContent).not.toContain('Bits');
    expect(loja.querySelector('[data-balance="emblems"]')).not.toBeNull();
    const cheap = TOURNAMENT_ITEMS[0];
    fireEvent.click(screen.getByRole('button', { name: `${cheap.nameEn} — ${cheap.price} Emblems` }));
    expect(shop.actions.onBuy).toHaveBeenCalledWith(cheap.id);
  });

  it('sem `shop`, não há aba de Loja (nada de aba que abre vazia)', () => {
    renderWithCss(<TournamentPage {...base} />);
    expect(screen.queryByRole('tab', { name: 'Shop' })).toBeNull();
  });
});

describe('Duelo', () => {
  it('mostra a ficha padrão sem skills e o botão abre a luta', () => {
    const onStart = vi.fn();
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" onStart={onStart} />);
    expect(container.textContent).toContain('Sua ficha');
    expect(container.textContent).toContain('perder não custa nada');
    fireEvent.click(screen.getByRole('button', { name: 'Começar duelo' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('em inglês, também', () => {
    renderWithCss(<DueloSheet language="en-US" evolutionStage="rookie" onStart={() => {}} />);
    expect(screen.getByRole('button', { name: 'Start duel' })).toBeTruthy();
  });
});
