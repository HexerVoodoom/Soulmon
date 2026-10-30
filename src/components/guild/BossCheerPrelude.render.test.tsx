// @vitest-environment jsdom
/** Torcida no Chefe da Feira: os toques viram baldes de tempo, vão na requisição do ataque; sem toque = o ataque de sempre. */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { BossCheerPrelude, addBossTap, BOSS_CHEER_BUCKETS } from './BossCheerPrelude';
import { FeiraEventoSheet, type FeiraApi } from './FeiraEventoSheet';
import type { FeiraAttack, FeiraEvento } from '../../utils/feira';
import { CHEER } from '../../utils/combate/specials';

const mem = new Map<string, string>();
const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); }, clear: () => mem.clear(), key: () => null, length: 0 };
beforeEach(() => { mem.clear(); vi.stubGlobal('localStorage', storage); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const me = { sprite: 'me.png', name: 'Igni', element: 'neutro' };
const boss: FeiraEvento = { k: 0, kind: 'boss', level: 1, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 80, canAttack: true };
const attackRes: FeiraAttack = {
  dmg: 120, seconds: 30, log: [{ k: 'a', t: 2, s: 0, f: 0.1 }],
  boss: { bossId: 'arauto-do-fim', level: 1, bossHpPct: 70, dead: false }, evento: { ...boss, bossHpPct: 70, canAttack: false },
};

describe('addBossTap', () => {
  it('conta no balde do instante, aparado no teto por balde e dentro da janela', () => {
    let t: number[] = [];
    for (let i = 0; i < 40; i++) t = addBossTap(t, 100);
    expect(t[0]).toBe(CHEER.tapsCapPerBucket);
    expect(addBossTap(t, CHEER.bucketSeconds * 1000 + 1)[1]).toBe(1);
    expect(addBossTap(t, 999_000)).toEqual(t);
    expect(t).toHaveLength(BOSS_CHEER_BUCKETS);
  });
});

describe('BossCheerPrelude', () => {
  it('tocar na cena e em "Go!" entrega os baldes uma vez só', () => {
    const onGo = vi.fn();
    const { container } = render(<BossCheerPrelude language="en-US" bossId="arauto-do-fim" level={1} poolPct={80} me={me} onGo={onGo} />);
    const layer = container.querySelector('[data-torcida-layer]')!;
    fireEvent.pointerDown(layer); fireEvent.pointerDown(layer);
    fireEvent.click(container.querySelector('[data-boss-cheer-go]')!);
    fireEvent.click(container.querySelector('[data-boss-cheer-go]')!);
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(onGo.mock.calls[0][0][0]).toBe(2);
  });
});

describe('FeiraEventoSheet: atacar passa pela torcida', () => {
  const mk = (): FeiraApi => ({
    get: vi.fn(async () => null), attack: vi.fn(async () => attackRes), claim: vi.fn(async () => null),
    start: vi.fn(async () => null), done: vi.fn(async () => null), sleep: vi.fn(async () => {}),
  });
  const abrir = (api: FeiraApi) => render(<FeiraEventoSheet language="en-US" saveId="save-12345" evento={boss} me={me} onClose={() => {}} onCredit={() => {}} api={api} />);

  it('com toques: o ataque leva os baldes; o resultado é o do servidor', async () => {
    const api = mk();
    abrir(api);
    fireEvent.click(document.querySelector('[data-feira-atacar]')!);
    await waitFor(() => expect(document.querySelector('[data-boss-cheer]')).not.toBeNull());
    fireEvent.pointerDown(document.querySelector('[data-torcida-layer]')!);
    fireEvent.click(document.querySelector('[data-boss-cheer-go]')!);
    await waitFor(() => expect(api.attack).toHaveBeenCalledTimes(1));
    const args = vi.mocked(api.attack).mock.calls[0];
    expect(args[2]![0]).toBe(1);
    await waitFor(() => expect(document.querySelector('[data-boss-fight], [data-result-kind="boss"]')).not.toBeNull());
  });

  it('sem toque: o ataque sai exatamente como antes (sem o 3º argumento)', async () => {
    const api = mk();
    abrir(api);
    fireEvent.click(document.querySelector('[data-feira-atacar]')!);
    await waitFor(() => expect(document.querySelector('[data-boss-cheer-go]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-boss-cheer-go]')!);
    await waitFor(() => expect(api.attack).toHaveBeenCalledWith('save-12345', undefined));
    expect(vi.mocked(api.attack).mock.calls[0]).toHaveLength(2);
  });
});
