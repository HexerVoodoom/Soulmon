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
  it('o menu é só de ícone (Desafiar · Loja), abre em Desafiar e a Faixa não é aba', () => {
    renderWithCss(<TournamentPage {...base} shop={shop} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.getAttribute('aria-label'))).toEqual(['Challenge', 'Shop']);
    for (const t of tabs) expect((t.textContent ?? '').replace(/s/g, '')).not.toContain(t.getAttribute('aria-label')!);
    expect(screen.getByRole('tab', { name: 'Challenge' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByRole('tab', { name: 'Tier' })).toBeNull();
  });

  it('explica que o Torneio é ranqueado/social e a Arena é o duelo PvE escalado', () => {
    renderWithCss(<TournamentPage {...base} shop={shop} />);
    fireEvent.click(screen.getByRole('button', { name: 'About the Tournament' }));
    expect(document.querySelector('[data-torneio-info]')!.textContent).toMatch(/season-ranked competition/i);
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

  it('as missões da semana NÃO moram mais no Torneio (07/10/2026): só no menu de Missões da Home', () => {
    renderWithCss(<TournamentPage {...base} shop={shop} />);
    expect(screen.queryByRole('tab', { name: 'Missions' })).toBeNull();
    expect(document.querySelector('[data-weekly-missions]')).toBeNull();
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
  it('o indicador da faixa é o glifo da faixa (Bronze) em 32, sem box, e o Torneio não leva marca de missão', async () => {
    const { container } = renderWithCss(<TournamentPage {...base} shop={shop} />);
    expect(container.querySelector('[data-mission-mark]')).toBeNull();
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
  it('mostra o elemento REAL do Soulmon (combinado incluso), não o do golpe especial', () => {
    const golpe = (tipo: 'basica' | 'especial', id: string, pt: string, en: string) => ({
      tipo, nome: { pt: 'Golpe', en: 'Strike' }, descricao: { pt: '', en: '' },
      elementoId: id, elementoNome: { pt, en }, escolaId: 'conjuracao', recursoId: 'mana',
      area: { tipo: 'unico' }, custo: 'baixo',
    });
    const skills = { rookie: {
      basica: golpe('basica', 'fogo', 'Fogo', 'Fire'),
      especial: golpe('especial', 'agua', 'Água', 'Water'),
      elementoDominante: { id: 'vapor', nome: { pt: 'Vapor', en: 'Steam' } },
    } } as never;
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" skills={skills} onStart={() => {}} />);
    expect(container.querySelector('[data-duelo-elemento]')!.textContent).toBe('Vapor');
  });

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
    expect(document.querySelector('[data-duelo-ajuda]')!.textContent).toMatch(/adversários acompanham o nível/);
    expect(document.querySelector('[data-duelo-ajuda]')!.textContent).toMatch(/modo social ranqueado/);
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
