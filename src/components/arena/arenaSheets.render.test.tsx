// @vitest-environment jsdom
/**
 * A Arena (minimal-ui F5) — as folhas Torneio e Duelo.
 *
 * Torneio: abre em DESAFIAR (02/10/2026; a faixa é o indicador do título). Desde 19/10/2026 (D-58) é SÓ de lutas: sem loja de
 * Emblemas e sem o botão "Train" (a Honra se gasta no Mercado, aba Honra). Duelo: mostra a ficha e abre a luta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { TournamentPage } from '../TournamentPage';
import { DueloSheet } from './DueloSheet';
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

beforeEach(() => {
  // O ranking responde com o jogador na faixa Bronze (lifetime 150).
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    rank: [{ id: saveId, name: 'Eu', stage: 'rookie', points: 40, lifetime: 150 }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Torneio', () => {
  it('D-58: sem menu de abas — o Torneio é só de lutas (nada de Loja) e a Faixa não é aba', () => {
    renderWithCss(<TournamentPage {...base} />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryByRole('tab', { name: 'Shop' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Tier' })).toBeNull();
  });

  it('explica que o Torneio é ranqueado/social e a Arena é o duelo PvE escalado', () => {
    renderWithCss(<TournamentPage {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'About the Tournament' }));
    expect(document.querySelector('[data-torneio-info]')!.textContent).toMatch(/RANKED mode.*server draws opponents.*you don.t choose.*Open Arena/is);
  });

  it('a faixa vira indicador do título; tocar abre a folha com as cinco faixas e a atual marcada', async () => {
    const { container } = renderWithCss(<TournamentPage {...base} />);
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
    renderWithCss(<TournamentPage {...base} />);
    expect(screen.queryByRole('tab', { name: 'Missions' })).toBeNull();
    expect(document.querySelector('[data-weekly-missions]')).toBeNull();
  });

  it('D-58: não há loja de Emblemas no Torneio (mora no Mercado, aba Honra)', () => {
    const { container } = renderWithCss(<TournamentPage {...base} />);
    expect(container.querySelector('[data-tournament-shop]')).toBeNull();
    expect(container.querySelector('[data-shop-item]')).toBeNull();
    // A Honra segue visível como saldo no topo (o rótulo acessível diz "Honor: N").
    expect(container.querySelector('[aria-label^="Honor:"]')).not.toBeNull();
  });
});

describe('Torneio — faixa e luta', () => {
  it('o indicador da faixa é o glifo da faixa (Bronze) em 32, sem box, e o Torneio não leva marca de missão', async () => {
    const { container } = renderWithCss(<TournamentPage {...base} />);
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

  it('D-58: o botão "Train" saiu do Torneio (com e sem Vínculo mínimo)', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede'))));
    renderWithCss(<TournamentPage {...base} totalXP={0} />);
    expect(screen.queryByRole('button', { name: 'Train' })).toBeNull();
    expect(document.querySelector('[data-torneio-treino]')).toBeNull();
  });
});

describe('Duelo', () => {
  it('11.3: a Arena livre NÃO mostra mais elemento nem golpes do Soulmon (moram no Perfil)', () => {
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" onStart={() => {}} />);
    expect(container.querySelector('[data-duelo-elemento]')).toBeNull();
    expect(container.querySelector('[data-duelo-golpes]')).toBeNull();
    expect(container.querySelector('[data-duelo-poder]')).not.toBeNull();
  });

  it('F6 (beta-2): o Poder tem ícone PRÓPRIO (as garras) e a palavra "Poder N" — o raio é o glifo da energia', () => {
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" onStart={() => {}} />);
    const poder = container.querySelector('[data-duelo-poder]')!;
    expect(poder.textContent).toMatch(/^Poder \d+$/);
    expect(poder.querySelector('img[data-pixel-icon="art"]')!.getAttribute('src')).toMatch(/atributo-poder/);
    expect(poder.textContent).not.toMatch(/bolt/);
    expect(poder.querySelector('.sm2-icon')).toBeNull(); // sem glifo Material (o raio)
    const en = renderWithCss(<DueloSheet language="en-US" evolutionStage="rookie" onStart={() => {}} />);
    expect(en.container.querySelector('[data-duelo-poder]')!.textContent).toMatch(/^Power \d+$/);
  });

  it('mostra a ficha padrão sem skills e o botão abre a luta', () => {
    const onStart = vi.fn();
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" onStart={onStart} />);
    // I9: só o essencial na folha; a explicação mora atrás do "?".
    expect(container.querySelector('[data-duelo-poder]')).not.toBeNull();
    expect(container.textContent).not.toContain('Sua ficha');
    expect(container.textContent).not.toContain('perder não custa nada');
    fireEvent.click(screen.getByRole('button', { name: /Como funciona a Arena/ }));
    expect(document.querySelector('[data-duelo-ajuda]')!.textContent).toContain('perder não custa nada');
    expect(document.querySelector('[data-duelo-ajuda]')!.textContent).toMatch(/você ESCOLHE os adversários.*poder parecido/);
    expect(document.querySelector('[data-duelo-ajuda]')!.textContent).toMatch(/modo ranqueado.*sorteia/);
    // A7: o "?" saiu da luta, então a explicação de COMO lutar (torcer, anel, esquiva) mora aqui, no InfoTip único.
    const como = document.querySelector('[data-duelo-como-lutar]')!.textContent!;
    expect(como).toMatch(/torcer/);
    expect(como).toMatch(/anel/);
    expect(como).toMatch(/esquivar/);
    fireEvent.click(screen.getByRole('button', { name: 'Lutar' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('ARENA = você escolhe: três desafios de poder parecido, e a semente do escolhido vai para a luta', async () => {
    const onStart = vi.fn();
    const { container } = renderWithCss(<DueloSheet language="pt-BR" evolutionStage="rookie" onStart={onStart} />);
    await waitFor(() => expect(container.querySelectorAll('[data-arena-card]').length).toBe(3));
    expect(container.querySelector('[data-arena-escolha]')!.textContent).toMatch(/Você escolhe contra quem lutar/);
    fireEvent.click(container.querySelector('[data-arena-card="2"]')!);
    expect(container.querySelector('[data-arena-card="2"]')!.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Lutar' }));
    expect(typeof onStart.mock.calls[0][0]).toBe('number');
  });

  it('em inglês, também', () => {
    renderWithCss(<DueloSheet language="en-US" evolutionStage="rookie" onStart={() => {}} />);
    expect(screen.getByRole('button', { name: 'Fight' })).toBeTruthy();
  });
});
