// @vitest-environment jsdom
/**
 * R8 (04/10/2026) — o Torneio: Mestre/Grão-Mestre com "#N", desafiantes NPC na lista vazia (treino, sem
 * partida nem ganho), o "i" ÚNICO e o seletor de molduras (cosmético).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TournamentPage } from './TournamentPage';
import { xpForLevel, BOND_PVP_MIN_LEVEL } from '../utils/bond';
import { TOURNAMENT_NPCS } from '../utils/tournamentNpcs';

const saveId = 'a'.repeat(32);
const base = {
  saveId, petStage: 'rookie', onMatchPlayed: () => {}, trophies: [], language: 'en-US',
  emblems: 0, onEarnEmblems: () => {}, totalXP: xpForLevel(BOND_PVP_MIN_LEVEL),
};

/** Responde por ação: `opponents` vazio, `rank` com o jogador e (opcional) `myPlace`. */
function stubApi(rankBody: object) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(String(url));
    const body = /action=opponents/.test(String(url))
      ? { opponents: [], matchesLeft: 3 }
      : rankBody;
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('R8 — desafiantes NPC quando não há oponentes', () => {
  it('mostra os três, e lutar com um NÃO chama o servidor (treino)', async () => {
    const calls = stubApi({ rank: [] });
    const onEarn = vi.fn();
    const onPlayed = vi.fn();
    render(<TournamentPage {...base} onEarnEmblems={onEarn} onMatchPlayed={onPlayed} />);
    await waitFor(() => expect(document.querySelectorAll('[data-torneio-npc]').length).toBe(TOURNAMENT_NPCS.length));
    expect(screen.queryByText(/Come back later/)).toBeNull();
    const antes = calls.length;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`challenge ${TOURNAMENT_NPCS[0].nameEn} \\(training`) }));
    // a luta abre (DuelScreen) sem nenhuma chamada nova — nada de `duelStart`/`match`
    expect(calls.slice(antes).some(u => /duel|match/.test(u))).toBe(false);
    expect(onEarn).not.toHaveBeenCalled();
    expect(onPlayed).not.toHaveBeenCalled();
  });
});

describe('R8 — o "i" único', () => {
  it('há exatamente UM InfoTip na página e ele cobre faixas, treino, missões, loja e molduras', async () => {
    stubApi({ rank: [] });
    render(<TournamentPage {...base} />);
    await waitFor(() => expect(document.querySelector('[data-tier-indicator]')).not.toBeNull());
    expect(document.querySelectorAll('[data-info-tip]').length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'About the Tournament' }));
    const t = document.querySelector('[data-torneio-info]')!.textContent!;
    for (const w of ['Grandmaster', 'top 20', 'Training', 'missions', 'Honor', 'frame']) expect(t).toContain(w);
  });
});

describe('R8 — Mestre / Grão-Mestre pela posição', () => {
  it('top 20 com lifetime de Diamante → Grão-Mestre com #N no indicador', async () => {
    stubApi({ rank: [{ id: saveId, name: 'Eu', stage: 'rookie', points: 400, lifetime: 1600 }], myPlace: 7 });
    render(<TournamentPage {...base} />);
    const ind = await waitFor(() => {
      const el = document.querySelector('[data-tier-indicator]');
      expect(el?.getAttribute('aria-label')).toMatch(/Grandmaster/);
      return el as HTMLElement;
    });
    expect(ind.querySelector('[data-tier-place="7"]')?.textContent).toContain('#7');
  });

  it('fora do top 100 → volta à faixa de pontos (Diamante)', async () => {
    stubApi({ rank: [{ id: saveId, name: 'Eu', stage: 'rookie', points: 10, lifetime: 1600 }], myPlace: 140 });
    render(<TournamentPage {...base} />);
    await waitFor(() => expect(document.querySelector('[data-tier-indicator]')?.getAttribute('aria-label')).toMatch(/Diamond/));
  });
});

describe('R8 — molduras (cosmético)', () => {
  it('o seletor equipa uma moldura livre e mostra as trancadas sem botão', async () => {
    stubApi({ rank: [{ id: saveId, name: 'Eu', stage: 'rookie', points: 40, lifetime: 150 }] });
    const onEquip = vi.fn();
    render(<TournamentPage {...base} onEquipFrame={onEquip} ownedFrames={['loja-brasa']} equippedFrame="rank-bronze" />);
    const ind = await waitFor(() => {
      const el = document.querySelector('[data-tier-indicator]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    fireEvent.click(ind);
    // a linha do próprio jogador no ranking já sai com a moldura equipada
    expect(document.querySelector('[data-rank-row="me"] [data-avatar-frame="rank-bronze"]')).not.toBeNull();
    fireEvent.click(document.querySelector('[data-frame-open]') as HTMLElement);
    expect(document.querySelector('[data-frame-option="rank-ouro"][data-frame-locked]')).not.toBeNull();
    fireEvent.click(document.querySelector('button[data-frame-option="loja-brasa"]') as HTMLElement);
    expect(onEquip).toHaveBeenCalledWith('loja-brasa');
    fireEvent.click(document.querySelector('button[data-frame-option="none"]') as HTMLElement);
    expect(onEquip).toHaveBeenLastCalledWith(null);
  });
});
