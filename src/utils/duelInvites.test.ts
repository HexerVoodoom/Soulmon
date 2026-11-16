import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
  DUEL_INVITE_INITIAL, DUEL_INVITE_MAX, duelInviteCount, duelInviteExchangeRefusal, exchangeDuelInvites, sanitizeDuelInvites,
  spendDuelInvite, type DuelInviteState,
} from './duelInvites';

const NOW = Date.UTC(2026, 10, 16, 12);
const base = (extra: Partial<DuelInviteState> = {}): DuelInviteState => ({ energyPoints: 5, ...extra });

describe('convite de duelo (§458)', () => {
  it('save antigo, sem o campo, tem o estoque inicial de 7', () => {
    expect(duelInviteCount(base())).toBe(DUEL_INVITE_INITIAL);
    expect(duelInviteCount(base({ duelInvites: { n: 99, at: 0 } }))).toBe(DUEL_INVITE_MAX);
    expect(duelInviteCount({ duelInvites: 'lixo' })).toBe(7);
  });
  it('gastar tira 1 e é idempotente quando não há convite', () => {
    const a = spendDuelInvite(base());
    expect(a.duelInvites?.n).toBe(6);
    const zero = base({ duelInvites: { n: 0, at: 0 } });
    expect(spendDuelInvite(zero)).toBe(zero);
  });
  it('conta comum: 1 energia = 5 convites', () => {
    const r = exchangeDuelInvites(base({ duelInvites: { n: 0, at: 0 } }), NOW);
    expect(r.duelInvites?.n).toBe(5);
    expect(r.energyPoints).toBe(4);
  });
  it('conta paga: 1 energia = 7 convites; teto de estoque 7 para todos', () => {
    const r = exchangeDuelInvites(base({ accountTier: 'paid', duelInvites: { n: 0, at: 0 } }), NOW);
    expect(r.duelInvites?.n).toBe(7);
    const c = exchangeDuelInvites(base({ duelInvites: { n: 4, at: 0 } }), NOW);
    expect(c.duelInvites?.n).toBe(7); // 4 + 5 limitado a 7
  });
  it('estoque cheio ou sem energia recusa sem gastar (mesma referência)', () => {
    const cheio = base();
    expect(duelInviteExchangeRefusal(cheio, NOW)).toBe('full');
    expect(exchangeDuelInvites(cheio, NOW)).toBe(cheio);
    const seco = base({ energyPoints: 0, duelInvites: { n: 0, at: 0 } });
    expect(duelInviteExchangeRefusal(seco, NOW)).toBe('no-energy');
    expect(exchangeDuelInvites(seco, NOW)).toBe(seco);
  });
  it('quem tem 0 convites sempre tem caminho: com energia, troca e luta', () => {
    let s = base({ duelInvites: { n: 0, at: 0 } });
    s = exchangeDuelInvites(s, NOW);
    expect(duelInviteCount(spendDuelInvite(s))).toBe(4);
  });
  it('a saneação é idempotente', () => {
    const a = sanitizeDuelInvites({ n: 3.7, at: 12.2 });
    expect(a).toEqual({ n: 3, at: 12 });
    expect(sanitizeDuelInvites(a)).toEqual(a);
  });
  it('a arte aprovada do convite está no lugar, com as dimensões certas', () => {
    for (const [f, w, h] of [['convite-duelo-pt', 192, 288], ['convite-duelo-en', 192, 288], ['convite-duelo-96-pt', 96, 144], ['convite-duelo-96-en', 96, 144]] as const) {
      const p = new URL(`../assets/soulmon/hud/${f}.png`, import.meta.url);
      expect(existsSync(p), f).toBe(true);
      const b = readFileSync(p);
      expect([b.readUInt32BE(16), b.readUInt32BE(20)], f).toEqual([w, h]);
    }
  });
});
