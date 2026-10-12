import { describe, it, expect, beforeEach } from 'vitest';
import {
  SUBSCRIPTION_SKU, ANDROID_PACKAGE, manageSubscriptionUrl, periodPhrase, subscriptionDisclosure,
  getSubscriptionStatus, setSubscriptionFromEntitlement, _resetSubscriptionStatus,
} from './subscription';
import { sanitizeEntitlement } from './entitlements';

beforeEach(() => _resetSubscriptionStatus());

describe('Gerenciar assinatura', () => {
  it('o link é o formato oficial da Play, com o SKU e o package do app', () => {
    expect(manageSubscriptionUrl()).toBe('https://play.google.com/store/account/subscriptions?sku=soulmon_cosmetic_quarterly&package=com.hexervoodoom.soulmon');
    expect(SUBSCRIPTION_SKU).toBe('soulmon_cosmetic_quarterly');
    expect(ANDROID_PACKAGE).toBe('com.hexervoodoom.soulmon');
  });
});

describe('divulgação pré-compra', () => {
  it('PT: preço localizado, a cada 3 meses, renovação automática, como cancelar, e o que não muda', () => {
    const t = subscriptionDisclosure('pt-BR', 'R$ 9,90', 'P3M')!.join('\n');
    expect(t).toContain('R$ 9,90 a cada 3 meses');
    expect(t).toMatch(/renova sozinha a cada 3 meses/);
    expect(t).toMatch(/cancelar/i);
    expect(t).toContain('Gerenciar assinatura');
    expect(t).toMatch(/não dá Créditos/);
    expect(t).toMatch(/fica seu para sempre/);
  });

  it('EN: price, every 3 months, automatic renewal, how to cancel', () => {
    const t = subscriptionDisclosure('en-US', '$1.99', 'P3M')!.join('\n');
    expect(t).toContain('$1.99 every 3 months');
    expect(t).toMatch(/renews automatically every 3 months/);
    expect(t).toMatch(/cancel/i);
    expect(t).toContain('Manage subscription');
    expect(t).toMatch(/no Credits/);
  });

  it('o preço é o que a Play deu, não um número escrito à mão', () => {
    const t = subscriptionDisclosure('pt-BR', '€ 1,99', 'P3M')!.join('\n');
    expect(t).toContain('€ 1,99');
    expect(t).not.toContain('9,90');
  });

  it('sem trial e sem pressão: nada de "grátis", "teste", "só hoje", "última chance"', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const t = subscriptionDisclosure(lang, 'X', 'P3M')!.join('\n');
      expect(t).not.toMatch(/gr[aá]tis|free|teste|trial|só hoje|only today|última chance|last chance/i);
    }
  });

  it('período desconhecido ou vazio: sem divulgação (não se oferece o que não se sabe dizer)', () => {
    expect(subscriptionDisclosure('pt-BR', 'R$ 9,90', '')).toBeNull();
    expect(subscriptionDisclosure('pt-BR', 'R$ 9,90', 'P45D')).toBeNull();
    expect(periodPhrase('P3M', 'en-US')).toBe('every 3 months');
  });
});

describe('a store da vigência', () => {
  it('abre e fecha com o que o servidor disse', () => {
    expect(getSubscriptionStatus()).toEqual({ active: false, until: 0 });
    setSubscriptionFromEntitlement({ subActive: true, subUntil: 123 });
    expect(getSubscriptionStatus()).toEqual({ active: true, until: 123 });
    setSubscriptionFromEntitlement({ subActive: false, subUntil: 123 });
    expect(getSubscriptionStatus()).toEqual({ active: false, until: 123 });
  });

  it('resposta nula (offline) mantém o último estado conhecido', () => {
    setSubscriptionFromEntitlement({ subActive: true, subUntil: 5 });
    setSubscriptionFromEntitlement(null);
    expect(getSubscriptionStatus().active).toBe(true);
  });

  it('conta que nunca assinou (sem os campos) fica fechada', () => {
    setSubscriptionFromEntitlement({});
    expect(getSubscriptionStatus()).toEqual({ active: false, until: 0 });
  });
});

describe('sanitizeEntitlement e a assinatura', () => {
  it('só aceita booleano e número finito positivo', () => {
    expect(sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0, subActive: 'true', subUntil: 'x' })).toEqual({ tier: 'demo', credits: 0, adsLeft: 0, admin: false });
    expect(sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0, subActive: true, subUntil: 99 })).toMatchObject({ subActive: true, subUntil: 99 });
  });
  it('a assinatura não vira tier nem Créditos', () => {
    const e = sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0, subActive: true, subUntil: 99 })!;
    expect(e.tier).toBe('demo');
    expect(e.credits).toBe(0);
  });
});
