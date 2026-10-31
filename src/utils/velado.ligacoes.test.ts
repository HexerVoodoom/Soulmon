import { describe, it, expect, vi, beforeEach } from 'vitest';

const aiFetch = vi.fn();
vi.mock('./aiClient', () => ({ aiFetch: (...a: unknown[]) => aiFetch(...a) }));

import { pedirFreeRookie } from './freeRookie';
import { refreshVeladoTester } from './veladoTester';
import { isOnboardingVelado, setVeladoTester } from './bbStage';
import { sortearBB } from '../data/bbPool';

beforeEach(() => { aiFetch.mockReset(); setVeladoTester(false); vi.unstubAllGlobals(); });

describe('ligação 1: testador liga isOnboardingVelado após o login', () => {
  it('tester=true liga; sem token / falha desliga', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ tester: true }) })));
    expect(await refreshVeladoTester('tok')).toBe(true);
    expect(isOnboardingVelado()).toBe(true);
    expect(await refreshVeladoTester(null)).toBe(false);
    expect(isOnboardingVelado()).toBe(false);
  });
});

describe('ligação 2: sorteio do BB no nascimento', () => {
  it('é determinístico e respeita o elemento da leitura', () => {
    const a = sortearBB('save-1', { elemento: 'fogo' });
    expect(a?.elemento).toBe('fogo');
    expect(sortearBB('save-1', { elemento: 'fogo' })).toEqual(a);
  });
});

describe('ligação 3: free-rookie', () => {
  it('devolve a imagem do servidor', async () => {
    aiFetch.mockResolvedValue({ ok: true, json: async () => ({ image: 'data:image/png;base64,AA', cached: false }) });
    expect(await pedirFreeRookie('p', 'pf')).toBe('data:image/png;base64,AA');
    expect(aiFetch).toHaveBeenCalledWith('/api/free-rookie', { formId: 'rookie', prompt: 'p', promptFallback: 'pf' });
  });
  it('fallback ou falha = null (usa o inicial pronto)', async () => {
    aiFetch.mockResolvedValue({ ok: true, json: async () => ({ image: null, fallback: true }) });
    expect(await pedirFreeRookie('p')).toBeNull();
    aiFetch.mockRejectedValue(new Error('rede'));
    expect(await pedirFreeRookie('p')).toBeNull();
  });
});
