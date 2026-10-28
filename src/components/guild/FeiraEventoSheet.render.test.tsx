// @vitest-environment jsdom
/**
 * A FOLHA DO EVENTO DA FEIRA (cliente): chefe (atacar, já bateu, offline, chefe caído), resgate idempotente ao reabrir e o Desafio
 * de cada jogo com uma instância de teste (o servidor entrega, o cliente desenha, ESPERA o piso e envia a solução).
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import { FeiraEventoSheet, type FeiraApi } from './FeiraEventoSheet';
import { GuildError } from '../../utils/community';
import { FEIRA_TRAIL_MIN_MS, type FeiraAttack, type FeiraClaim, type FeiraEvento, type FeiraTrail } from '../../utils/feira';
import { resetClaimMemoryForTests } from '../../utils/guildClaimLocal';
import { seededRng, startSequence } from '../../utils/mente/eco';
import { feiraText, FEIRA_COPY } from '../../utils/feiraCopy';

const mem = new Map<string, string>();
const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); }, clear: () => mem.clear(), key: () => null, length: 0 };
beforeEach(() => { mem.clear(); vi.stubGlobal('localStorage', storage); resetClaimMemoryForTests(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const me = { sprite: 'me.png', name: 'Igni', element: 'neutro' };
const boss: FeiraEvento = { k: 0, kind: 'boss', level: 1, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 80, canAttack: true };
const attackRes: FeiraAttack = {
  dmg: 120, seconds: 30, log: [{ k: 'a', t: 2, s: 0, f: 0.1 }],
  boss: { bossId: 'arauto-do-fim', level: 1, bossHpPct: 70, dead: false }, evento: { ...boss, bossHpPct: 70, canAttack: false },
};
const rest = (claimable: boolean): FeiraEvento => ({ k: 1, kind: 'rest', level: 2, claimable, claimK: claimable ? 0 : null });
const claimRes: FeiraClaim = { k: 0, level: 1, bossId: 'arauto-do-fim', receipt: 'rec-1', reward: { emblems: 3, bits: 40, sap: 10, trophyId: null, element: 'fogo', essences: [] } };
const trailEv: FeiraEvento = { k: 2, kind: 'trail', level: 3, trail: { pending: true, cleared: false, marks: 2 }, gate: 'locked' };

const mk = (over: Partial<FeiraApi> = {}): FeiraApi => ({
  get: vi.fn(async () => null), attack: vi.fn(async () => attackRes), claim: vi.fn(async () => claimRes),
  start: vi.fn(async () => null), done: vi.fn(async () => ({ reward: { emblems: 1, sap: 3 }, receipt: 'tr-1', evento: null })),
  sleep: vi.fn(async () => {}), ...over,
});
const open = (evento: FeiraEvento, api: FeiraApi, language: 'en-US' | 'pt-BR' = 'en-US', onCredit = vi.fn()) => {
  const r = render(<FeiraEventoSheet language={language} saveId="save-12345" evento={evento} me={me} onClose={() => {}} onCredit={onCredit} api={api} skipReplay />);
  return { ...r, onCredit };
};
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;

describe('Chefe', () => {
  it('mostra o chefe e só o AGREGADO do clã; atacar abre a luta e o resultado com o dano do próprio golpe', async () => {
    const api = mk();
    open(boss, api);
    expect(q('[data-feira-evento="boss"]')).not.toBeNull();
    expect(q('[data-feira-pool]')!.getAttribute('data-feira-pool')).toBe('80');
    expect(document.body.textContent).toContain('Herald of the End');
    fireEvent.click(q('[data-feira-atacar]')!);
    await waitFor(() => expect(q('[data-boss-fight], [data-result-kind="boss"]')).not.toBeNull());
    expect(api.attack).toHaveBeenCalledWith('save-12345', undefined);
    expect(screen.getByText('You dealt 120 damage.')).toBeTruthy();
    expect(document.body.textContent!.toLowerCase()).not.toMatch(/fail|falh/);
  });

  it('já bateu hoje (429): frase calma, sem botão de atacar, nada gasto', async () => {
    const api = mk({ attack: vi.fn(async () => { throw new GuildError('dailyLimit', 429); }) });
    open(boss, api);
    fireEvent.click(q('[data-feira-atacar]')!);
    await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('en-US', 'boss.today')));
    expect(q('[data-feira-atacar]')).toBeNull();
  });

  it('chefe já caiu (409) e sem rede (unavailable): cada um com a sua frase, e dá para tentar de novo', async () => {
    const api = mk({ attack: vi.fn().mockRejectedValueOnce(new GuildError('unavailable', 0)).mockRejectedValueOnce(new GuildError('server', 409)) });
    open(boss, api, 'pt-BR');
    fireEvent.click(q('[data-feira-atacar]')!);
    await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('pt-BR', 'boss.offline')));
    expect(q('[data-feira-atacar]')).not.toBeNull();
    fireEvent.click(q('[data-feira-atacar]')!);
    await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('pt-BR', 'boss.gone')));
  });

  it('Feira desligada no meio (attack → null): frase calma e nada quebra', async () => {
    open(boss, mk({ attack: vi.fn(async () => null) }));
    fireEvent.click(q('[data-feira-atacar]')!);
    await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('en-US', 'boss.gone')));
  });

  it('boss sem canAttack: só o "fechar" (nada de botão que não faz nada)', () => {
    open({ ...boss, canAttack: false }, mk());
    expect(q('[data-feira-atacar]')).toBeNull();
    expect(q('[data-feira-fechar]')).not.toBeNull();
  });
});

describe('Resgate (descanso com recompensa)', () => {
  it('colhe, credita Emblemas/Bits UMA vez e, ao reabrir com o mesmo recibo, não credita de novo', async () => {
    const api = mk();
    const a = open(rest(true), api);
    fireEvent.click(q('[data-feira-colher]')!);
    await waitFor(() => expect(q('[data-feira-colhido]')).not.toBeNull());
    expect(a.onCredit).toHaveBeenCalledTimes(1);
    expect(a.onCredit).toHaveBeenCalledWith({ receipt: 'rec-1', emblems: 3, bits: 40, trophyId: null, essences: [] });
    a.unmount();
    const b = open(rest(true), api); // reabriu (o servidor devolveu o mesmo recibo)
    fireEvent.click(q('[data-feira-colher]')!);
    await waitFor(() => expect(q('[data-feira-colhido]')).not.toBeNull());
    expect(b.onCredit).not.toHaveBeenCalled();
  });

  it('nada a colher (404 → null): frase calma; descanso sem resgate só convida a fechar', async () => {
    const a = open(rest(true), mk({ claim: vi.fn(async () => null) }));
    fireEvent.click(q('[data-feira-colher]')!);
    await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('en-US', 'rest.nothing')));
    expect(a.onCredit).not.toHaveBeenCalled();
    cleanup();
    open(rest(false), mk());
    expect(q('[data-feira-colher]')).toBeNull();
    expect(document.body.textContent).toContain(feiraText('en-US', 'rest.line'));
  });
});

describe('Desafio', () => {
  const stub = (game: FeiraTrail['game'], puzzle: unknown): FeiraTrail => ({ k: 2, game, seed: 42, puzzle } as FeiraTrail);
  const iniciar = async (trail: FeiraTrail, api = mk()) => {
    const a = open(trailEv, { ...api, start: vi.fn(async () => trail) });
    expect(q('[data-feira-porta]')).not.toBeNull(); // porta travada: só informa
    fireEvent.click(q('[data-feira-comecar]')!);
    await waitFor(() => expect(q(`[data-trail-game="${trail.game}"]`)).not.toBeNull());
    return { ...a, api };
  };
  const enviar = async () => {
    await waitFor(() => expect((q('[data-trail-send]') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(q('[data-trail-send]')!);
  };

  it('Zip: desenha a instância do servidor, só envia com o caminho fechado, espera o piso e mostra o livro Ganhou', async () => {
    const t = stub('zip', { size: 4, numbers: [0, 12] });
    const { api, onCredit } = await iniciar(t);
    expect((q('[data-trail-send]') as HTMLButtonElement).disabled).toBe(true);
    for (const c of [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12]) fireEvent.click(q(`[data-zip-cell="${c}"]`)!);
    await enviar();
    await waitFor(() => expect(api.done).toHaveBeenCalled());
    expect(api.done).toHaveBeenCalledWith('save-12345', { path: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12] }, undefined);
    expect((api.sleep as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBeGreaterThan(FEIRA_TRAIL_MIN_MS.zip - 1000);
    await waitFor(() => expect(q('[data-result-title]')!.textContent).toBe(feiraText('en-US', 'trail.done')));
    expect(q('[data-result-honor]')!.textContent).toBe('+1');
    expect(q('[data-result-sap]')!.textContent).toBe('+3');
    expect(onCredit).toHaveBeenCalledWith({ receipt: 'tr-1', emblems: 1, bits: 0, trophyId: null });
  });

  it('Colcha: dois toques por colcha; envia os retângulos', async () => {
    const clues = [0, 2, 8, 10].map(cell => ({ cell, area: 4, shape: 'square' }));
    const { api } = await iniciar(stub('patches', { size: 4, clues }));
    for (const [a, b] of [[0, 5], [2, 7], [8, 13], [10, 15]]) { fireEvent.click(q(`[data-patch-cell="${a}"]`)!); fireEvent.click(q(`[data-patch-cell="${b}"]`)!); }
    await enviar();
    await waitFor(() => expect(api.done).toHaveBeenCalled());
    const sol = (api.done as ReturnType<typeof vi.fn>).mock.calls[0][1] as { rects: unknown[] };
    expect(sol.rects).toHaveLength(4);
    expect(sol.rects).toContainEqual({ r: 0, c: 0, h: 2, w: 2 });
  });

  it('Picross: pinta pelas pistas; envia as células (1/0)', async () => {
    const { api } = await iniciar(stub('picross', { size: 3, rows: [[3], [], []], cols: [[1], [1], [1]] }));
    for (const c of [0, 1, 2]) fireEvent.click(q(`[data-picross-cell="0-${c}"]`)!);
    await enviar();
    await waitFor(() => expect(api.done).toHaveBeenCalled());
    expect((api.done as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({ cells: [[1, 1, 1], [0, 0, 0], [0, 0, 0]] });
  });

  it('Troca: responde carta a carta; só envia ao fim do baralho', async () => {
    const deck = Array.from({ length: 10 }, (_, i) => ({ forma: 'young', lugar: 'sky', rule: 'forma', art: i }));
    const { api } = await iniciar(stub('troca', { deck }));
    for (let i = 0; i < 10; i++) { expect((q('[data-trail-send]') as HTMLButtonElement).disabled).toBe(true); fireEvent.click(q('[data-troca-left]')!); }
    await enviar();
    await waitFor(() => expect(api.done).toHaveBeenCalled());
    expect((api.done as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({ sides: Array(10).fill('left') });
    expect((api.sleep as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBeGreaterThan(FEIRA_TRAIL_MIN_MS.troca - 1000);
  });

  it('Eco: assiste, repete e envia a pontuação ao atingir o alvo', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { api } = await iniciar(stub('eco', { par: 3 }));
    const seq = startSequence(seededRng(42));
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(q('[data-eco-phase]')!.getAttribute('data-eco-phase')).toBe('input');
    for (const s of seq) fireEvent.click(q(`[data-eco-stone="${s}"]`)!);
    await enviar();
    await waitFor(() => expect(api.done).toHaveBeenCalled());
    expect((api.done as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({ score: 3 });
  });

  it('solução errada (400): frase gentil e dá para tentar de novo, sem crédito', async () => {
    const t = stub('troca', { deck: Array.from({ length: 10 }, (_, i) => ({ forma: 'young', lugar: 'sky', rule: 'forma', art: i })) });
    const err = Object.assign(new GuildError('server', 400, undefined, undefined, { error: 'wrong solution' }));
    const { api, onCredit } = await iniciar(t, mk({ done: vi.fn(async () => { throw err; }) }));
    for (let i = 0; i < 10; i++) fireEvent.click(q('[data-troca-right]')!);
    await enviar();
    await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('en-US', 'trail.wrong')));
    expect(onCredit).not.toHaveBeenCalled();
    expect((q('[data-trail-send]') as HTMLButtonElement).disabled).toBe(false);
    expect(api.done).toHaveBeenCalledTimes(1);
  });

  it('limite do dia (429), rápido demais (400) e sem rede: cada um com a sua frase calma', async () => {
    const t = stub('troca', { deck: Array.from({ length: 10 }, (_, i) => ({ forma: 'young', lugar: 'sky', rule: 'forma', art: i })) });
    const done = vi.fn()
      .mockRejectedValueOnce(new GuildError('dailyLimit', 429))
      .mockRejectedValueOnce(new GuildError('server', 400, undefined, undefined, { error: 'too fast' }))
      .mockRejectedValueOnce(new GuildError('unavailable', 0));
    await iniciar(t, mk({ done }));
    for (let i = 0; i < 10; i++) fireEvent.click(q('[data-troca-left]')!);
    for (const key of ['trail.limit', 'trail.slow', 'boss.offline'] as const) {
      await enviar();
      await waitFor(() => expect(q('[data-feira-nota]')!.textContent).toBe(feiraText('en-US', key)));
    }
  });

  it('já cumprido hoje: nenhum botão de começar; a porta não aparece', () => {
    open({ ...trailEv, trail: { pending: false, cleared: true, marks: 3 }, gate: null }, mk());
    expect(q('[data-feira-comecar]')).toBeNull();
    expect(q('[data-feira-porta]')).toBeNull();
    expect(q('[data-feira-marcas]')!.getAttribute('data-feira-marcas')).toBe('3');
  });
});

describe('copy', () => {
  it('toda chave tem EN e PT preenchidos, sem vocabulário de cobrança nem culpa', () => {
    const veto = /\b(falt\w*|ausente|missing|absent|not yet|ainda n[aã]o|you failed|voc[eê] (errou|falhou))\b/i;
    for (const [k, [en, pt]] of Object.entries(FEIRA_COPY)) {
      expect(en.trim().length, k).toBeGreaterThan(0);
      expect(pt.trim().length, k).toBeGreaterThan(0);
      expect(en, k).not.toMatch(veto);
      expect(pt, k).not.toMatch(veto);
    }
  });
});
