import { describe, it, expect, vi, afterEach } from 'vitest';
import { gerarBBExclusivo, deveGerarBBExclusivo, BB_EXCLUSIVO_ESPERA_MS } from './bbNascimento';
import { sortearBB } from '../data/bbPool';

const PROMPTS = { imagePrompt: 'p', imagePromptFallback: 'pf' };
afterEach(() => { vi.useRealTimers(); });

describe('D31: pagante que já entra pagando gera o BB exclusivo', () => {
  it('paid + prompts -> chama o pipeline com o par de prompts e devolve a imagem', async () => {
    const gerar = vi.fn(async () => 'data:image/png;base64,AA');
    expect(await gerarBBExclusivo({ pago: true, prompts: PROMPTS, gerar })).toBe('data:image/png;base64,AA');
    expect(gerar).toHaveBeenCalledWith('p', 'pf');
  });
  it('falha, vazio ou estouro da espera = null (o chamador cai no pool)', async () => {
    expect(await gerarBBExclusivo({ pago: true, prompts: PROMPTS, gerar: async () => { throw new Error('x'); } })).toBeNull();
    expect(await gerarBBExclusivo({ pago: true, prompts: PROMPTS, gerar: async () => null })).toBeNull();
    vi.useFakeTimers();
    const p = gerarBBExclusivo({ pago: true, prompts: PROMPTS, gerar: () => new Promise(() => {}) });
    await vi.advanceTimersByTimeAsync(BB_EXCLUSIVO_ESPERA_MS + 1);
    expect(await p).toBeNull();
  });
  it('fallback = BB do pool para o mesmo save', async () => {
    const exclusivo = await gerarBBExclusivo({ pago: true, prompts: PROMPTS, gerar: async () => null });
    expect(exclusivo).toBeNull();
    expect(sortearBB('save-1', { elemento: 'fogo' })?.elemento).toBe('fogo');
  });
});

describe('free nunca gera (D30)', () => {
  it('não pago: o pipeline não é chamado', async () => {
    const gerar = vi.fn(async () => 'img');
    expect(await gerarBBExclusivo({ pago: false, prompts: PROMPTS, gerar })).toBeNull();
    expect(await gerarBBExclusivo({ pago: true, prompts: undefined, gerar })).toBeNull();
    expect(gerar).not.toHaveBeenCalled();
  });
});

describe('D32: quem paga DEPOIS mantém o BB do pool e não gera BB', () => {
  it('com BB do pool já escolhido, virar pagante não dispara geração de BB', async () => {
    const bbDoPool = sortearBB('save-free', { elemento: 'agua' });
    expect(bbDoPool).not.toBeNull();
    const gerar = vi.fn(async () => 'img');
    expect(deveGerarBBExclusivo({ pago: true, prompts: PROMPTS, jaTemBB: true })).toBe(false);
    expect(await gerarBBExclusivo({ pago: true, prompts: PROMPTS, jaTemBB: true, gerar })).toBeNull();
    expect(gerar).not.toHaveBeenCalled();
    expect(sortearBB('save-free', { elemento: 'agua' })).toBe(bbDoPool); // o BB do pool permanece (determinístico)
  });
});
