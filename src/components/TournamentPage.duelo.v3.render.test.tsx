// @vitest-environment jsdom
/**
 * O Torneio no núcleo v3 (PR5, contexto §2.19): a ficha de cada lado vem do SERVIDOR (`duelStart`), os toques
 * vão por balde, e o EMPATE é um resultado válido — sem Honra para ninguém e sem texto de perdedor.
 * A luta em si (`DuelScreen`) é trocada por um stub que entrega os toques na hora: o que se prova aqui é a
 * fiação (`duelStart` → luta → `match` → resultado), não a animação (`DuelScreen.render.test.tsx`).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('./DuelScreen', () => ({
  DuelScreen: (p: { me: unknown; opp: unknown; seed: number; onDone: (t: number[]) => void }) => (
    <div data-duel-stub data-seed={p.seed}>
      <button type="button" onClick={() => p.onDone([5, 7])}>stub-terminar</button>
    </div>
  ),
}));
import { TournamentPage } from './TournamentPage';
import { xpForLevel, BOND_PVP_MIN_LEVEL } from '../utils/bond';

const saveId = 'a'.repeat(32);
const side = (level: number) => ({
  combatant: { level, atk: 4, def: 4, spd: 4, hp: 20, bonus: 0 }, special: { family: 'direct', power: 1 }, fx: { basica: null, especial: null },
});
const OPP = { id: 'p'.repeat(24), name: 'Rival', petName: 'Bicho', stage: 'rookie', duel: { level: 4 } };

function stubApi(matchBody: object) {
  const chamadas: Array<{ url: string; body: any }> = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    chamadas.push({ url: u, body: init?.body ? JSON.parse(String(init.body)) : null });
    const body = /action=opponents/.test(u) ? { opponents: [OPP], me: { duel: { level: 4 } }, matchesLeft: 5 }
      : /action=duelStart/.test(u) ? { seed: 4242, me: side(4), opp: side(4), matchesLeft: 4 }
        : /action=match/.test(u) ? matchBody
          : { rank: [] };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  return chamadas;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const base = {
  saveId, petStage: 'rookie', trophies: [], language: 'en-US', emblems: 0, totalXP: xpForLevel(BOND_PVP_MIN_LEVEL),
};
const lutar = async () => {
  fireEvent.click(await screen.findByRole('button', { name: /Fight — challenge Rival/ }));
  await waitFor(() => expect(document.querySelector('[data-duel-stub]')).not.toBeNull());
  fireEvent.click(screen.getByText('stub-terminar'));
};

describe('Torneio v3 — a fiação do duelo', () => {
  it('duelStart leva a semente do SERVIDOR para a luta e o match recebe os toques por balde (e nada mais)', async () => {
    const chamadas = stubApi({ won: true, draw: false, outcome: 'win', myScore: 40, oppScore: 0, points: 20, matchesLeft: 4, opponent: { name: 'Rival', petName: 'Bicho', stage: 'rookie' } });
    render(<TournamentPage {...base} onEarnEmblems={() => {}} onMatchPlayed={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Fight — challenge Rival/ }));
    await waitFor(() => expect(document.querySelector('[data-duel-stub]')).not.toBeNull());
    expect(document.querySelector('[data-duel-stub]')?.getAttribute('data-seed')).toBe('4242');
    fireEvent.click(screen.getByText('stub-terminar'));
    await waitFor(() => expect(chamadas.some(c => /action=match/.test(c.url))).toBe(true));
    const match = chamadas.find(c => /action=match/.test(c.url))!;
    expect(match.body).toEqual({ id: saveId, opponentId: OPP.id, taps: [5, 7] });
    expect(JSON.stringify(match.body)).not.toMatch(/seed|stats|level|combatant|won/i); // nada que decida o resultado sai do cliente
  });

  it('VITÓRIA: Honra e Vínculo como sempre', async () => {
    stubApi({ won: true, draw: false, outcome: 'win', myScore: 40, oppScore: 0, points: 20, matchesLeft: 4, opponent: { name: 'Rival', petName: 'Bicho', stage: 'rookie' } });
    const onEarn = vi.fn(), onPlayed = vi.fn();
    render(<TournamentPage {...base} onEarnEmblems={onEarn} onMatchPlayed={onPlayed} />);
    await lutar();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Victory' })).toBeTruthy());
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn.mock.calls[0][0]).toBeGreaterThan(0);
    expect(onPlayed).toHaveBeenCalledWith(true);
  });

  it('EMPATE: texto neutro (sem perdedor), sem Honra para ninguém, e a partida conta como jogada', async () => {
    stubApi({ won: false, draw: true, outcome: 'draw', myScore: 0, oppScore: 0, points: 0, matchesLeft: 4, opponent: { name: 'Rival', petName: 'Bicho', stage: 'rookie' } });
    const onEarn = vi.fn(), onPlayed = vi.fn();
    render(<TournamentPage {...base} onEarnEmblems={onEarn} onMatchPlayed={onPlayed} />);
    await lutar();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Draw' })).toBeTruthy());
    expect(document.querySelector('[data-empate]')?.textContent).toMatch(/together/i);
    expect(screen.queryByText(/Defeat|Victory|lost/i)).toBeNull();
    expect(screen.queryByText('Honor')).toBeNull();
    expect(onEarn).not.toHaveBeenCalled(); // nenhuma Honra
    expect(onPlayed).toHaveBeenCalledTimes(1); // a partida foi jogada (Vínculo, como a derrota: falha não pune)
  });

  it('em português o empate também é neutro', async () => {
    stubApi({ won: false, draw: true, outcome: 'draw', myScore: 0, oppScore: 0, points: 0, matchesLeft: 4, opponent: { name: 'Rival', petName: 'Bicho', stage: 'rookie' } });
    render(<TournamentPage {...base} language="pt-BR" onEarnEmblems={() => {}} onMatchPlayed={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Desafiar Rival/ }));
    await waitFor(() => expect(document.querySelector('[data-duel-stub]')).not.toBeNull());
    fireEvent.click(screen.getByText('stub-terminar'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Empate' })).toBeTruthy());
    expect(document.querySelector('[data-empate]')?.textContent).toMatch(/sem pontos/i);
    expect(screen.queryByText(/Derrota|Vitória|perdeu/i)).toBeNull();
  });

  it('erro de rede no duelStart: a luta NÃO acontece e nada é cobrado (nenhuma chamada de match)', async () => {
    const chamadas: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url);
      chamadas.push(u);
      if (/action=duelStart/.test(u)) return new Response(JSON.stringify({ error: 'boom' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      const body = /action=opponents/.test(u) ? { opponents: [OPP], me: { duel: { level: 4 } }, matchesLeft: 5 } : { rank: [] };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    render(<TournamentPage {...base} onEarnEmblems={() => {}} onMatchPlayed={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Fight — challenge Rival/ }));
    await waitFor(() => expect(chamadas.some(u => /action=duelStart/.test(u))).toBe(true));
    await new Promise(r => setTimeout(r, 50));
    expect(document.querySelector('[data-duel-stub]')).toBeNull();
    expect(chamadas.some(u => /action=match/.test(u))).toBe(false);
  });
});
