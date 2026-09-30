import { describe, it, expect } from 'vitest';
import {
  REFUGE_INVITE_EMPTY, acceptRefugeInvite, dismissRefugeInvite, markRefugeShown, sanitizeRefugeInvite, shouldInviteRefuge,
} from './convite';

const D = '2026-09-30';
describe('convite ao Refúgio', () => {
  it('só com humor 1 ou 2 — nunca 3+, nunca sem humor', () => {
    expect(shouldInviteRefuge(undefined, 1, D)).toBe(true);
    expect(shouldInviteRefuge(undefined, 2, D)).toBe(true);
    for (const m of [3, 4, 5, null, undefined]) expect(shouldInviteRefuge(undefined, m, D)).toBe(false);
  });

  it('exibido hoje continua de pé hoje; depois, só a partir de 3 dias', () => {
    const s = markRefugeShown(undefined, D);
    expect(shouldInviteRefuge(s, 1, D)).toBe(true);
    expect(shouldInviteRefuge(s, 1, '2026-10-01')).toBe(false);
    expect(shouldInviteRefuge(s, 1, '2026-10-02')).toBe(false);
    expect(shouldInviteRefuge(s, 1, '2026-10-03')).toBe(true);
  });

  it('dispensar some até amanhã; aceitar também', () => {
    expect(shouldInviteRefuge(dismissRefugeInvite(undefined, D), 1, D)).toBe(false);
    expect(shouldInviteRefuge(acceptRefugeInvite(undefined, D), 1, D)).toBe(false);
  });

  it('duas dispensas seguidas = 7 dias de silêncio; aceitar zera a contagem', () => {
    let s = dismissRefugeInvite(undefined, D);
    s = dismissRefugeInvite(s, '2026-10-03');
    expect(s.silencedUntil).toBe('2026-10-10');
    expect(shouldInviteRefuge(s, 1, '2026-10-09')).toBe(false);
    expect(shouldInviteRefuge(s, 1, '2026-10-10')).toBe(true);
    const a = acceptRefugeInvite(dismissRefugeInvite(undefined, D), '2026-10-03');
    expect(a.dismissStreak).toBe(0);
  });

  it('é idempotente (StrictMode roda updater 2×) e não guarda o humor', () => {
    const s = markRefugeShown(undefined, D);
    expect(markRefugeShown(s, D)).toBe(s);
    const d = dismissRefugeInvite(s, D);
    expect(dismissRefugeInvite(d, D)).toBe(d);
    expect(JSON.stringify(d)).not.toMatch(/mood|humor/i);
  });

  it('higieniza lixo do save', () => {
    expect(sanitizeRefugeInvite(null)).toBeUndefined();
    expect(sanitizeRefugeInvite({ lastShownDay: 'x', dismissStreak: 99, silencedUntil: 3 })).toEqual({
      lastShownDay: undefined, dismissedDay: undefined, acceptedDay: undefined, dismissStreak: 2, silencedUntil: undefined,
    });
    expect(REFUGE_INVITE_EMPTY.dismissStreak).toBe(0);
  });
});
