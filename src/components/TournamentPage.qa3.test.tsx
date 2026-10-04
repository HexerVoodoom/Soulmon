// @vitest-environment jsdom
/**
 * QA3 — "Desafiar" com um duelo já sendo aberto. O botão só travava o oponente da vez
 * (`busy = fighting === o.id`): tocar em OUTRO oponente enquanto o `duelStart` do primeiro
 * voava abria um segundo duelo — o servidor fecha o primeiro como DERROTA e gasta 2 partidas.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { TournamentPage } from './TournamentPage';
import { xpForLevel, BOND_PVP_MIN_LEVEL } from '../utils/bond';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const ficha = { hp: 150, atk: 12 };
const opp = (id: string) => ({ id, name: `Op${id}`, petName: `Bicho${id}`, stage: 'rookie', duel: ficha });

describe('Desafiar não abre dois duelos ao mesmo tempo', () => {
  it('com um duelStart em voo, os OUTROS botões Desafiar ficam travados', async () => {
    const chamadas: string[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      const u = String(url);
      chamadas.push(u);
      if (/action=opponents/.test(u)) return Promise.resolve(new Response(JSON.stringify({ opponents: [opp('p1'), opp('p2')], me: { duel: ficha }, matchesLeft: 5 })));
      if (/action=rank/.test(u)) return Promise.resolve(new Response(JSON.stringify({ rank: [] })));
      return new Promise(() => {}); // duelStart: nunca responde
    }));
    render(<TournamentPage
      saveId={'a'.repeat(32)} petStage="rookie" onMatchPlayed={() => {}} trophies={[]} language="pt-BR"
      emblems={0} onEarnEmblems={() => {}} totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)}
    />);
    fireEvent.click(screen.getByRole('tab', { name: /Desafiar|Challenge/ }));
    const botoes = await waitFor(() => {
      const b = screen.getAllByRole('button', { name: /^Desafiar Op/ });
      expect(b.length).toBe(2);
      return b;
    });
    fireEvent.click(botoes[0]);
    await waitFor(() => expect(chamadas.some(u => /duelStart/.test(u))).toBe(true));
    expect((screen.getByRole('button', { name: 'Desafiar Opp2' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
