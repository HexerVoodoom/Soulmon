import { describe, it, expect } from 'vitest';
import { needsCatalogOnboarding, markCatalogOnboardingSeen, onboardingProfileFrom } from './catalogOnboarding';
import { STRENGTH_LABEL, STRUGGLE_LABEL } from '../types/activityCatalog';

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

describe('onboardingProfileFrom — forças + o que atrapalha para `derivePersonality` (01/10/2026)', () => {
  const forca = Object.keys(STRENGTH_LABEL)[0];
  const trava = Object.keys(STRUGGLE_LABEL)[0];

  it('guarda os MESMOS ids do catálogo que as perguntas usam', () => {
    expect(onboardingProfileFrom({ strengths: [forca], struggles: [trava] }))
      .toEqual({ strengths: [forca], struggles: [trava] });
  });

  it('sem escolha nenhuma não inventa perfil vazio (save fica sem o campo)', () => {
    expect(onboardingProfileFrom(undefined)).toBeUndefined();
    expect(onboardingProfileFrom({ strengths: [], struggles: [] })).toBeUndefined();
  });

  it('o que vem da nuvem é higienizado: só texto, sem duplicata, até 3', () => {
    expect(onboardingProfileFrom({
      strengths: ['a', 'a', 7, null, 'b', 'c', 'd'] as unknown[],
      struggles: 'nao-e-lista' as unknown as unknown[],
    })).toEqual({ strengths: ['a', 'b', 'c'], struggles: [] });
  });
});
