// @vitest-environment jsdom
/**
 * §321 (13/11/2026): o nome do clã embaixo do nome (`ui/PlayerName`), a busca enquanto digita (`PlayerSearch`) e o convite do
 * clã de um toque (`guild/GuildInviteSheet`).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { computed, renderWithCss } from '../test/renderEnv';
import { PlayerName } from './ui/PlayerName';
import { PlayerSearch } from './PlayerSearch';
import { GuildInviteSheet } from './guild/GuildInviteSheet';
import { foldPlayerName, type PlayerSearchHit } from '../utils/playerSearch';

const GENTE: PlayerSearchHit[] = [
  { id: 'pid0000000001', name: 'João', guildName: 'Os Lumes', stage: 'rookie' },
  { id: 'pid0000000002', name: 'Joana', stage: 'champion-power' },
  { id: 'pid0000000003', name: 'Joaquim', guildName: 'Raiz Antiga', stage: 'rookie' },
];
/** Busca falsa com a MESMA régua do servidor (prefixo dobrado). */
const buscaFalsa = vi.fn(async (_save: string, q: string) => GENTE.filter(h => foldPlayerName(h.name).startsWith(foldPlayerName(q))));

beforeEach(() => { buscaFalsa.mockClear(); vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); });

describe('PlayerName', () => {
  it('com clã: o nome e, EMBAIXO, o clã em texto pequeno e calmo (tokens)', () => {
    renderWithCss(<PlayerName name="João" guildName="Os Lumes" />);
    const clã = document.querySelector('[data-player-guild]') as HTMLElement;
    expect(clã.textContent).toBe('Clã Os Lumes');
    expect(clã.style.fontSize).toBe('var(--sm2-text-xs)');
    expect(clã.style.color).toBe('var(--sm2-muted)');
    expect((document.querySelector('[data-player-name]') as HTMLElement).style.flexDirection).toBe('column');
  });
  it('sem clã: nada a mais (nem linha vazia)', () => {
    renderWithCss(<PlayerName name="Joana" guildName={null} />);
    expect(document.querySelector('[data-player-guild]')).toBeNull();
    renderWithCss(<PlayerName name="Joana" guildName="   " />);
    expect(document.querySelector('[data-player-guild]')).toBeNull();
  });
});

describe('PlayerSearch — busca enquanto digita', () => {
  const digitar = (v: string) => fireEvent.change(screen.getByRole('searchbox'), { target: { value: v } });

  it('1 letra: a dica do mínimo e NENHUMA chamada', async () => {
    renderWithCss(<PlayerSearch saveId="save-1" language="pt-BR" label="Buscar" search={buscaFalsa} renderAction={() => null} />);
    digitar('j');
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(buscaFalsa).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toMatch(/pelo menos 2 letras/);
  });
  it('"joa": espera ~200 ms, chama UMA vez e mostra nome + clã + miniatura de cada um', async () => {
    renderWithCss(<PlayerSearch saveId="save-1" language="pt-BR" label="Buscar" search={buscaFalsa} renderAction={h => <button type="button">Convidar {h.name}</button>} />);
    digitar('j'); digitar('jo'); digitar('joa');
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    expect(buscaFalsa).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(buscaFalsa).toHaveBeenCalledTimes(1);
    expect(buscaFalsa.mock.calls[0][1]).toBe('joa');
    await waitFor(() => expect(document.querySelectorAll('[data-player-search-hit]')).toHaveLength(3));
    const joao = document.querySelector('[data-player-search-hit="pid0000000001"]')!;
    expect(joao.querySelector('[data-player-name-text]')!.textContent).toBe('João');
    expect(joao.querySelector('[data-player-guild]')!.textContent).toBe('Clã Os Lumes');
    expect(joao.querySelector('img')).not.toBeNull();
    expect(document.querySelector('[data-player-search-hit="pid0000000002"] [data-player-guild]')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('3 pessoas encontradas');
  });
  it('ninguém com esse começo: frase de vazio', async () => {
    renderWithCss(<PlayerSearch saveId="save-1" language="pt-BR" label="Buscar" search={buscaFalsa} renderAction={() => null} />);
    digitar('zz');
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Ninguém com um nome que comece assim/));
  });
  it('erro de rede: frase própria e "Tentar de novo" chama outra vez', async () => {
    const { PlayerSearchError } = await import('../utils/playerSearch');
    const falha = vi.fn(async () => { throw new PlayerSearchError('offline', 0); });
    renderWithCss(<PlayerSearch saveId="save-1" language="pt-BR" label="Buscar" search={falha} renderAction={() => null} />);
    digitar('joa');
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Sem conexão/));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(falha).toHaveBeenCalledTimes(2);
  });
});

describe('GuildInviteSheet — convite de um toque', () => {
  it('toca Convidar → chama o servidor com o pid e a linha vira "Convite enviado"; quem tem clã nasce sem botão ativo', async () => {
    const convidar = vi.fn(async () => 'sent' as const);
    renderWithCss(<GuildInviteSheet saveId="save-1" language="pt-BR" guildName="Os Lumes" onClose={() => {}} search={buscaFalsa} invite={convidar} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'joa' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await waitFor(() => expect(document.querySelectorAll('[data-guild-invite]')).toHaveLength(3));
    expect((document.querySelector('[data-guild-invite="pid0000000001"]') as HTMLButtonElement).textContent).toBe('Já está na roda');
    expect((document.querySelector('[data-guild-invite="pid0000000003"]') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Convidar Joana para o clã' }));
    await waitFor(() => expect(document.querySelector('[data-guild-invite="pid0000000002"]')!.textContent).toMatch(/Convite enviado$/));
    expect(convidar).toHaveBeenCalledWith('save-1', 'pid0000000002', undefined);
  });
  it('§321 (dono, 13/11): todo botão de linha tem a MESMA largura, qualquer que seja o rótulo (Convidar / Já está na roda / Já tem clã / Convite enviado)', async () => {
    renderWithCss(<GuildInviteSheet saveId="save-1" language="pt-BR" guildName="Os Lumes" onClose={() => {}} search={buscaFalsa} invite={vi.fn(async () => 'sent' as const)} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'joa' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await waitFor(() => expect(document.querySelectorAll('[data-guild-invite]')).toHaveLength(3));
    fireEvent.click(screen.getByRole('button', { name: 'Convidar Joana para o clã' }));
    await waitFor(() => expect(document.querySelector('[data-guild-invite="pid0000000002"]')!.getAttribute('data-guild-invite-state')).toBe('sent'));
    const botoes = [...document.querySelectorAll('[data-guild-invite]')] as HTMLElement[];
    expect(new Set(botoes.map(b => b.textContent)).size).toBe(3); // três rótulos diferentes…
    for (const b of botoes) {
      expect(b.classList.contains('sm2-guild-invite-btn')).toBe(true);
      expect(computed(b, 'width')).toBe('11.5rem'); // …e uma largura só
      expect(b.style.width).toBe(''); // nenhum estilo em linha sobrepõe a régua
      expect(parseFloat(b.style.minHeight)).toBeGreaterThanOrEqual(44);
    }
  });
});
