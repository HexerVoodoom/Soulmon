// @vitest-environment jsdom
/**
 * A Arena (minimal-ui F5) — as folhas Torneio e Duelo.
 *
 * Torneio: abre em DESAFIAR (02/10/2026; a faixa é o indicador do título), tem as
 * missões da semana pagas em Emblemas e a loja de Emblemas, que só vende
 * cosmético e só mostra Emblemas. Duelo: mostra a ficha e abre a luta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { TournamentPage } from '../TournamentPage';
import { DueloSheet } from './DueloSheet';
import { TOURNAMENT_ITEMS } from '../../utils/shop';
import { TOURNAMENT_LADDER } from '../../utils/tournamentTiers';
import { weeklyMissionsFor } from '../../utils/weeklyMissions';

const saveId = 'a'.repeat(32);
const base = {
  saveId,
  petStage: 'rookie',
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
  // O ranking responde com o jogador na faixa Bronze (lifetime 150).
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    rank: [{ id: saveId, name: 'Eu', stage: 'rookie', points: 40, lifetime: 150 }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Torneio', () => {
  it('o menu é só de ícone (Desafiar · Missões · Loja), abre em Desafiar e a Faixa não é aba', () => {
    renderWithCss(<TournamentPage {...base} shop={shop} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.getAttribute('aria-label'))).toEqual(['Challenge', 'Missions', 'Shop']);
    for (const t of tabs) expect((t.textContent ?? '').replace(/s/g, '')).not.toContain(t.getAttribute('aria-label')!);
    expect(screen.getByRole('tab', { name: 'Challenge' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByRole('tab', { name: 'Tier' })).toBeNull();
  });

  it('a faixa vira indicador do título; tocar abre a folha com as cinco faixas e a atual marcada', async () => {
    const { container } = renderWithCss(<TournamentPage {...base} shop={shop} />);
    const ind = await waitFor(() => {
      const el = container.querySelector('[data-tier-indicator]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(container.querySelector('[data-tier]')).toBeNull();
    fireEvent.click(ind);
    expect(screen.getByRole('dialog', { name: 'Tournament tiers' })).toBeTruthy();
    expect(document.querySelectorAll('[data-tier]').length).toBe(TOURNAMENT_LADDER.length);
    expect(document.querySelector('[data-tier-state="current"]')!.getAttribute('data-tier')).toBe('bronze');
    expect(document.querySelector('[data-tier="madeira"]')!.getAttribute('data-tier-state')).toBe('passed');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('dialog', { name: 'Tournament tiers' })).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: `Claim ${m.emblems} Honor` }));
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
    fireEvent.click(screen.getByRole('button', { name: `${cheap.nameEn} — ${cheap.price} Honor` }));
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(shop.actions.onBuy).toHaveBeenCalledWith(cheap.id);
  });

  it('sem `shop`, não há aba de Loja (nada de aba que abre vazia)', () => {
    renderWithCss(<TournamentPage {...base} />);
    expect(screen.queryByRole('tab', { name: 'Shop' })).toBeNull();
  });
});

describe('Torneio — menu e treino', () => {
  it('Missões usa o "?" amarelo (A2; não a exclamação nem o check) e o indicador da faixa é o glifo da faixa (Bronze) em 32, sem box', async () => {
    const { container } = renderWithCss(<TournamentPage {...base} shop={shop} />);
    const missoes = screen.getByRole('tab', { name: 'Missions' });
    expect(missoes.textContent).toContain('question');
    expect(missoes.textContent).not.toContain('exclamation');
    expect(missoes.querySelector('.sm2-icon')!.className).toMatch(/gold/);
    expect(missoes.textContent).not.toContain('task_alt');
    const ind = await waitFor(() => {
      const el = container.querySelector('[data-tier-indicator]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const glifo = ind.querySelector('.sm2-icon') as HTMLElement;
    expect(glifo.textContent).toContain('military_tech');
    expect(glifo.style.fontSize).toBe('32px');
  });

  it('o TREINO existe sem Vínculo, sem rede e sem oponentes — e abre a luta local', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede'))));
    renderWithCss(<TournamentPage {...base} totalXP={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Train' }));
    expect(screen.queryByRole('button', { name: 'Train' })).toBeNull(); // saiu da folha, entrou a luta
  });
});

describe('Duelo', () => {
  it('mostra a ficha padrão sem skills e o botão abre a luta', () => {
    const onStart = vi.fn();
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" onStart={onStart} />);
    // I9: só o essencial na folha; a explicação mora atrás do "?".
    expect(container.querySelector('[data-duelo-elemento]')).not.toBeNull();
    expect(container.querySelector('[data-duelo-poder]')).not.toBeNull();
    expect(container.textContent).not.toContain('Sua ficha');
    expect(container.textContent).not.toContain('perder não custa nada');
    fireEvent.click(screen.getByRole('button', { name: /O que são elemento, poder e golpes/ }));
    expect(document.querySelector('[data-duelo-ajuda]')!.textContent).toContain('perder não custa nada');
    // A7: o "?" saiu da luta, então a explicação de COMO lutar (torcer, anel, esquiva) mora aqui, no InfoTip único.
    const como = document.querySelector('[data-duelo-como-lutar]')!.textContent!;
    expect(como).toMatch(/torcer/);
    expect(como).toMatch(/anel/);
    expect(como).toMatch(/esquivar/);
    fireEvent.click(screen.getByRole('button', { name: 'Começar duelo' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('em inglês, também', () => {
    renderWithCss(<DueloSheet language="en-US" evolutionStage="rookie" onStart={() => {}} />);
    expect(screen.getByRole('button', { name: 'Start duel' })).toBeTruthy();
  });
});
