import { describe, it, expect } from 'vitest';
import { needsCatalogOnboarding, markCatalogOnboardingSeen } from './catalogOnboarding';

describe('needsCatalogOnboarding', () => {
  it('save sem a flag precisa do convite (novo E antigo — mesmo mecanismo)', () => {
    expect(needsCatalogOnboarding({})).toBe(true);
  });

  it('save com a flag já não precisa', () => {
    expect(needsCatalogOnboarding({ catalogOnboardingSeenAt: '2026-09-28T00:00:00.000Z' })).toBe(false);
  });
});

describe('markCatalogOnboardingSeen', () => {
  it('grava a data na primeira vez', () => {
    const s = markCatalogOnboardingSeen({} as { catalogOnboardingSeenAt?: string }, new Date('2026-09-28T12:00:00.000Z'));
    expect(s.catalogOnboardingSeenAt).toBe('2026-09-28T12:00:00.000Z');
  });

  it('é idempotente: não sobrescreve a data já gravada', () => {
    const s1 = markCatalogOnboardingSeen({} as { catalogOnboardingSeenAt?: string }, new Date('2026-09-28T12:00:00.000Z'));
    const s2 = markCatalogOnboardingSeen(s1, new Date('2026-10-01T00:00:00.000Z'));
    expect(s2.catalogOnboardingSeenAt).toBe('2026-09-28T12:00:00.000Z');
  });

  it('não apaga nenhum outro campo do estado', () => {
    const s = markCatalogOnboardingSeen({ activities: ['a', 'b'] } as any, new Date());
    expect((s as any).activities).toEqual(['a', 'b']);
  });
});
