/**
 * WP5.1 — quando a oferta pode aparecer.
 *
 * O *value moment* deste app não é o reveal: ali a pessoa ainda não sabe se
 * isso vai servir para alguma coisa. É o primeiro DIA PERFEITO — ela cumpriu o
 * que combinou consigo mesma e viu a criatura responder.
 *
 * As quatro travas abaixo são a diferença entre um convite e um anúncio.
 */
import { describe, it, expect } from 'vitest';
import { shouldOfferAtValueMoment, isoWeekKey } from './offerMoment';

const base = {
  tier: 'demo' as const,
  wasPerfect: true,
  welcomeBack: false,
  daysWithPet: 3,
  lastShownWeek: null,
  currentWeek: '2026-W37',
};

describe('offerMoment — o momento certo', () => {
  it('dia perfeito, quem ainda não comprou, fora do D0', () => {
    expect(shouldOfferAtValueMoment(base)).toBe(true);
  });

  it('dia comum não é value moment', () => {
    expect(shouldOfferAtValueMoment({ ...base, wasPerfect: false })).toBe(false);
  });
});

describe('offerMoment — as quatro travas', () => {
  it('nunca no D0: oferecer no primeiro dia é vender antes de entregar', () => {
    expect(shouldOfferAtValueMoment({ ...base, daysWithPet: 0 })).toBe(false);
  });

  it('sem idade conhecida, na dúvida NÃO oferece', () => {
    expect(shouldOfferAtValueMoment({ ...base, daysWithPet: null })).toBe(false);
  });

  it('nunca em cima de quem voltou de uma ausência', () => {
    // Quem some e volta encontra saudade, não vitrine. É a mesma regra do
    // perdão por ausência, aplicada à oferta.
    expect(shouldOfferAtValueMoment({ ...base, welcomeBack: true })).toBe(false);
  });

  it('no máximo uma vez por semana', () => {
    expect(shouldOfferAtValueMoment({ ...base, lastShownWeek: '2026-W37' })).toBe(false);
    expect(shouldOfferAtValueMoment({ ...base, lastShownWeek: '2026-W36' })).toBe(true);
  });

  it('nunca para quem já comprou', () => {
    expect(shouldOfferAtValueMoment({ ...base, tier: 'paid' })).toBe(false);
    expect(shouldOfferAtValueMoment({ ...base, tier: undefined })).toBe(false);
  });
});

describe('offerMoment — a semana é a MESMA da métrica-norte', () => {
  it('semana ISO começa na segunda', () => {
    // 2026-09-07 é uma segunda; 2026-09-06, o domingo anterior.
    expect(isoWeekKey('2026-09-07')).not.toBe(isoWeekKey('2026-09-06'));
    expect(isoWeekKey('2026-09-07')).toBe(isoWeekKey('2026-09-13'));
  });

  it('data ilegível devolve null — e null nunca vira "pode oferecer"', () => {
    expect(isoWeekKey('ontem')).toBeNull();
  });
});
