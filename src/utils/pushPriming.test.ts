/**
 * WP1.5 — o SEGUNDO convite de notificação.
 *
 * O primeiro já estava certo (só depois da primeira conclusão real). O que
 * faltava era o segundo: quem dispensou no dia 1 nunca mais era convidado, e
 * no dia 1 ninguém ainda sabe se esse app vai importar.
 *
 * As quatro travas abaixo são o que separa "convidar de novo" de "insistir".
 */
import { describe, it, expect } from 'vitest';
import { shouldPrimePush, pushPrimingLine, PRIMING_MIN_HOURS_AFTER_DISMISS } from './pushPriming';

const AGORA = Date.UTC(2026, 8, 6, 12);
const ONTEM = AGORA - 30 * 3_600_000;

const base = {
  daysWithPet: 2,
  notificationsEnabled: false,
  firstDismissedAt: ONTEM,
  secondDismissed: false,
  returningFromAbsence: false,
  now: AGORA,
};

describe('pushPriming — quando o segundo convite acontece', () => {
  it('no D2 e no D3, para quem dispensou o primeiro há mais de um dia', () => {
    expect(shouldPrimePush(base)).toBe(true);
    expect(shouldPrimePush({ ...base, daysWithPet: 3 })).toBe(true);
  });
});

describe('pushPriming — as quatro travas', () => {
  it('nunca no D0 nem no D1 — repetir cedo é insistir', () => {
    expect(shouldPrimePush({ ...base, daysWithPet: 0 })).toBe(false);
    expect(shouldPrimePush({ ...base, daysWithPet: 1 })).toBe(false);
  });

  it('e nunca depois do D3: o momento passou, e insistir vira ruído', () => {
    expect(shouldPrimePush({ ...base, daysWithPet: 4 })).toBe(false);
    expect(shouldPrimePush({ ...base, daysWithPet: 40 })).toBe(false);
  });

  it('UMA vez só — não existe terceiro convite', () => {
    expect(shouldPrimePush({ ...base, secondDismissed: true })).toBe(false);
  });

  it('nunca em cima de quem voltou de uma ausência', () => {
    // Quem some e volta encontra saudade, não um pedido de permissão. É a
    // mesma regra do perdão por ausência, aplicada ao convite.
    expect(shouldPrimePush({ ...base, returningFromAbsence: true })).toBe(false);
  });

  it('nunca para quem já ligou', () => {
    expect(shouldPrimePush({ ...base, notificationsEnabled: true })).toBe(false);
  });

  it('respeita as 24h desde o "agora não"', () => {
    const poucasHoras = AGORA - (PRIMING_MIN_HOURS_AFTER_DISMISS - 1) * 3_600_000;
    expect(shouldPrimePush({ ...base, firstDismissedAt: poucasHoras })).toBe(false);
  });

  it('sem save de idade (`bornAt` ausente) não convida', () => {
    // Sem idade não existe "momento certo", e chutar seria o mesmo erro do
    // pedido na tela de abertura.
    expect(shouldPrimePush({ ...base, daysWithPet: null })).toBe(false);
  });

  it('quem NUNCA dispensou o primeiro não recebe o segundo', () => {
    // Um segundo pedido sem primeiro é só um pedido cedo com outro nome.
    expect(shouldPrimePush({ ...base, firstDismissedAt: null })).toBe(false);
  });
});

describe('pushPriming — a voz', () => {
  it('quem pergunta é o PET, e é pergunta, não anúncio de benefício', () => {
    // "Ative as notificações para não perder seu progresso" é o app falando
    // de si. A única voz que este produto tem para pedir é a da criatura.
    for (const isPt of [true, false]) {
      const linha = pushPrimingLine(isPt);
      expect(linha).toContain('?');
      expect(linha.toLowerCase()).not.toContain('notifica');
      expect(linha.toLowerCase()).not.toContain('notification');
      expect(linha.toLowerCase()).not.toContain('ative');
      expect(linha.toLowerCase()).not.toContain('enable');
    }
  });
});
