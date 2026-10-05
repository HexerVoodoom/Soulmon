/** PR1b (B1) — paridade servidor × cliente: uma barra cheia = um especial, e o cast zera a barra. */
import { describe, it, expect } from 'vitest';
import { simulateDuel, duelSeed, DUEL_ENERGY_MAX } from './_duel.js';
import { strikeEnergy, addEnergy, ENERGY_MAX } from '../../src/utils/energia';

const N = 240;
const R = { hp: 160, atk: 14 };
const C = { hp: 150, atk: 15 };
const runs = () => Array.from({ length: N }, (_, i) =>
  simulateDuel({ me: i % 2 ? R : C, opp: i % 2 ? C : R, seed: duelSeed('pr1b', i), cheers: Array.from({ length: 13 }, (_, k) => (i + k) % 17) }));

const en = (ev, who) => (who === 'me' ? ev.energyMe : ev.energyOpp);
const pre = (ev, who) => (who === 'me' ? ev.preMe : ev.preOpp);

describe(`B1 paridade — ${N} seeds de simulateDuel`, () => {
  it('todo especial deixa a barra do ator em 0; entre dois especiais passa por 0 e volta ao MAX', () => {
    let specials = 0;
    for (const { events } of runs()) {
      const last = { me: null, opp: null };
      events.forEach((ev, i) => {
        if (ev.special) {
          specials++;
          expect(en(ev, ev.actor)).toBe(0);
          expect(pre(ev, ev.actor)).toBe(DUEL_ENERGY_MAX);
        }
        // energia cheia do ator ⇒ a próxima ação DELE é o especial
        for (const who of ['me', 'opp']) {
          if (en(ev, who) >= DUEL_ENERGY_MAX) {
            const next = events.slice(i + 1).find(e => e.actor === who);
            if (next) expect(next.special).toBe(true);
          }
        }
        if (ev.special) last[ev.actor] = i;
      });
    }
    expect(specials).toBeGreaterThan(50);
  });

  it('espelho cliente (energia.ts) reproduz a energia de cada evento', () => {
    expect(ENERGY_MAX).toBe(DUEL_ENERGY_MAX);
    for (const { events } of runs()) {
      for (const ev of events) {
        const other = ev.actor === 'me' ? 'opp' : 'me';
        expect(en(ev, ev.actor)).toBe(strikeEnergy(pre(ev, ev.actor), ev.special));
        expect(en(ev, other)).toBe(addEnergy(pre(ev, other), 'taken'));
      }
    }
  });
});
