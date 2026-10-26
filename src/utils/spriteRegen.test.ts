import { describe, it, expect } from 'vitest';
import { emptySpriteLibrary, recordSprite, discardNewSprite, tuneVisor, displaySprite, normalizeSpriteLibrary, type SpriteLibrary } from './spriteLibrary';
import {
  SPRITE_REGEN_COST_CREDITS, regenAvailability, markRegenUsed, clearRegenUsed, regenFailureWhy, regenMonthOf, newRegenOpId,
} from './spriteRegen';

const URL_A = 'https://images.higgs.ai/a.png';
const URL_B = 'https://images.higgs.ai/b.png';
const F = 'rookie';
const NOW = Date.parse('2026-10-26T12:00:00Z');

const comPrimeira = (): SpriteLibrary => recordSprite(emptySpriteLibrary(), { url: URL_A, formId: F, at: 1 }, { adopt: 'now' });
const input = (over: Partial<Parameters<typeof regenAvailability>[0]> = {}) => ({
  accountTier: 'paid' as const, credits: 100, library: comPrimeira(), formId: F, now: NOW, busy: false, ...over,
});

describe('regenAvailability', () => {
  it('só conta paga vê o botão; demo e desconhecida ficam sem ele', () => {
    expect(regenAvailability(input({ accountTier: 'demo' }))).toBe('hidden');
    expect(regenAvailability(input({ accountTier: undefined }))).toBe('hidden');
    expect(regenAvailability(input())).toBe('ok');
  });
  it('sem a 1ª geração da forma não há o que gerar de novo', () => {
    expect(regenAvailability(input({ library: emptySpriteLibrary() }))).toBe('hidden');
  });
  it('sem saldo (49) abre os Créditos; com 50 pode', () => {
    expect(SPRITE_REGEN_COST_CREDITS).toBe(50);
    expect(regenAvailability(input({ credits: 49 }))).toBe('no-credits');
    expect(regenAvailability(input({ credits: 50 }))).toBe('ok');
  });
  it('mês usado trava e o mês seguinte destrava', () => {
    const lib = markRegenUsed(comPrimeira(), F, '2026-10');
    expect(regenAvailability(input({ library: lib }))).toBe('month-used');
    expect(regenAvailability(input({ library: lib, now: Date.parse('2026-11-01T00:00:00Z') }))).toBe('ok');
  });
  it('geração em andamento trava', () => {
    expect(regenAvailability(input({ busy: true }))).toBe('busy');
  });
  it('com uma nova esperando a escolha, o estado é "choosing" (antes de mês usado e de saldo)', () => {
    const lib = markRegenUsed(recordSprite(comPrimeira(), { url: URL_B, formId: F, at: 2 }, { adopt: 'ask', dayKey: '2026-10-26' }), F, '2026-10');
    expect(regenAvailability(input({ library: lib, credits: 0 }))).toBe('choosing');
  });
});

describe('manter a atual × usar a nova', () => {
  const nova = () => recordSprite(comPrimeira(), { url: URL_B, formId: F, at: 2 }, { adopt: 'ask', dayKey: '2026-10-26' });

  it('enquanto escolhe, a tela mostra a ATUAL (a anterior) e a nova espera', () => {
    const lib = nova();
    expect(displaySprite(lib, F)?.url).toBe(URL_A);
    expect(lib.sprites[F].url).toBe(URL_B);
    expect(lib.previousSprites?.[F].url).toBe(URL_A);
  });
  it('usar a nova adota e guarda SÓ a versão anterior', () => {
    const lib = tuneVisor(nova(), F);
    expect(displaySprite(lib, F)?.url).toBe(URL_B);
    expect(lib.previousSprites?.[F].url).toBe(URL_A);
    expect(lib.pendingTune).toBeNull();
  });
  it('manter a atual descarta a nova, limpa a escolha e não deixa "anterior" sobrando', () => {
    const lib = discardNewSprite(nova(), F);
    expect(lib.sprites[F].url).toBe(URL_A);
    expect(displaySprite(lib, F)?.url).toBe(URL_A);
    expect(lib.pendingTune).toBeNull();
    expect(lib.previousSprites).toBeUndefined();
  });
  it('manter a atual não devolve a cota do mês (o sorteio aconteceu)', () => {
    const lib = discardNewSprite(markRegenUsed(nova(), F, '2026-10'), F);
    expect(lib.regenUsed).toEqual({ [F]: '2026-10' });
  });
  it('manter a atual fora da escolha não mexe em nada', () => {
    const lib = comPrimeira();
    expect(discardNewSprite(lib, F)).toBe(lib);
  });
  it('uma 2ª regeração (depois de usar a nova) guarda como anterior a que estava valendo', () => {
    const URL_C = 'https://images.higgs.ai/c.png';
    const l1 = tuneVisor(nova(), F);
    const l2 = recordSprite(l1, { url: URL_C, formId: F, at: 3 }, { adopt: 'ask', dayKey: '2026-11-26' });
    expect(l2.previousSprites?.[F].url).toBe(URL_B);
    expect(discardNewSprite(l2, F).sprites[F].url).toBe(URL_B);
  });
});

describe('espelho do mês e leitura tolerante', () => {
  it('markRegenUsed / clearRegenUsed', () => {
    const lib = markRegenUsed(comPrimeira(), F, '2026-10');
    expect(lib.regenUsed).toEqual({ [F]: '2026-10' });
    const sem = clearRegenUsed(lib, F);
    expect('regenUsed' in sem).toBe(false);
    expect(clearRegenUsed(sem, F)).toBe(sem);
  });
  it('save com lixo no campo novo vira ausente; save bom sobrevive ao ciclo normalize', () => {
    expect('regenUsed' in normalizeSpriteLibrary({ sprites: {}, regenUsed: 'x' })).toBe(false);
    const lib = markRegenUsed(comPrimeira(), F, '2026-10');
    expect(normalizeSpriteLibrary(JSON.parse(JSON.stringify(lib))).regenUsed).toEqual({ [F]: '2026-10' });
  });
  it('mês no formato do servidor', () => {
    expect(regenMonthOf(NOW)).toBe('2026-10');
  });
});

describe('falhas e opId', () => {
  it('traduz o código do servidor', () => {
    expect(regenFailureWhy(429, 'regen-monthly-limit')).toBe('month-used');
    expect(regenFailureWhy(402, 'insufficient-credits')).toBe('no-credits');
    expect(regenFailureWhy(402, 'paid-tier-required')).toBe('not-paid');
    expect(regenFailureWhy(409, 'regen-needs-first-generation')).toBe('no-first');
    expect(regenFailureWhy(202, '')).toBe('busy');
    expect(regenFailureWhy(503, 'sprite-regen-disabled')).toBe('unavailable');
    expect(regenFailureWhy(0, 'network error')).toBe('offline');
    expect(regenFailureWhy(500, 'internal error')).toBe('failed');
    expect(regenFailureWhy(503, 'ai-quota-unavailable')).toBe('failed');
  });
  it('opId tem o formato que o servidor aceita e é único por gesto', () => {
    const a = newRegenOpId();
    const b = newRegenOpId();
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(a).not.toBe(b);
  });
});
