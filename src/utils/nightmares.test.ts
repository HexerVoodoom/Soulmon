import { describe, it, expect } from 'vitest';
import {
  NIGHTMARES_PER_NIGHT,
  NIGHTMARE_MAX_HEART_CURE,
  buildNightmareWave,
  createNightmareState,
  hasPendingNightmare,
  markFought,
  nightmareDayKey,
  nightmareFlavor,
  nightmareName,
  nightmareRewards,
  nightmaresFor,
  type NightmareState,
} from './nightmares';
import { createRestState, recordNight, type RestState } from './restWindow';
import { LADDER_TIERS } from './dungeon';

// Janela padrão 23:00–07:00.
const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m, d, h, min);

/**
 * Registra `nights` noites consecutivas terminando na manhã de `lastMorning`.
 * `hours` controla a DURAÇÃO do sono — que, por regra, não pode mudar nada.
 */
function withNights(
  count: number,
  lastMorning: Date,
  opts: { hours: number; onTime: boolean },
): RestState {
  let state = createRestState();
  for (let i = count - 1; i >= 0; i--) {
    const morning = new Date(lastMorning.getTime());
    morning.setDate(morning.getDate() - i);
    // Dentro da janela: 23:30. Fora: 19:00 (nem a tolerância de 45min alcança).
    const slept = new Date(morning.getTime());
    slept.setDate(slept.getDate() - 1);
    slept.setHours(opts.onTime ? 23 : 19, 30, 0, 0);
    const woke = new Date(slept.getTime() + opts.hours * 3600_000);
    state = recordNight(state, slept, woke);
  }
  return state;
}

describe('nightmaresFor — teto por noite', () => {
  it('nunca passa de 1 pesadelo por noite', () => {
    const now = at(2026, 7, 20, 8);
    let rest = withNights(7, now, { hours: 8, onTime: true });
    // Regravar a mesma noite várias vezes não cria pesadelos extras.
    rest = recordNight(rest, at(2026, 7, 19, 23, 10), at(2026, 7, 20, 6));
    rest = recordNight(rest, at(2026, 7, 19, 23, 40), at(2026, 7, 20, 7));
    expect(nightmaresFor(rest, now).count).toBe(NIGHTMARES_PER_NIGHT);
    expect(nightmaresFor(rest, now).count).toBeLessThanOrEqual(1);
  });

  it('noite SEM registro → 0 pesadelos e nenhuma perda', () => {
    const now = at(2026, 7, 20, 8);
    const rest = createRestState();
    const offer = nightmaresFor(rest, now);
    expect(offer.count).toBe(0);
    // Nada de negativo em lugar nenhum: não existe punição nesta mecânica.
    expect(offer.count).toBeGreaterThanOrEqual(0);
    expect(buildNightmareWave(rest, 'rookie', now)).toEqual([]);
    const rewards = nightmareRewards(offer.rarity, false);
    expect(rewards.hearts).toBe(0);
    expect(rewards.energy).toBe(0);
    expect(rewards.bits).toBe(0);
  });

  it('noite FORA da janela → 0 pesadelos e nenhuma perda', () => {
    const now = at(2026, 7, 20, 8);
    const rest = withNights(5, now, { hours: 9, onTime: false });
    expect(nightmaresFor(rest, now).count).toBe(0);
    expect(buildNightmareWave(rest, 'champion', now)).toEqual([]);
  });
});

describe('a DURAÇÃO do sono não afeta NADA', () => {
  it('mesma regularidade + noites de 3h e de 11h → resultado IDÊNTICO', () => {
    const now = at(2026, 7, 20, 8);
    const short = withNights(7, now, { hours: 3, onTime: true });
    const long = withNights(7, now, { hours: 11, onTime: true });

    expect(nightmaresFor(short, now, 'mega')).toEqual(nightmaresFor(long, now, 'mega'));
    expect(nightmareRewards(nightmaresFor(short, now).rarity, true)).toEqual(
      nightmareRewards(nightmaresFor(long, now).rarity, true),
    );
  });

  it('dormir MAIS não rende mais pesadelos que dormir pouco', () => {
    const now = at(2026, 7, 20, 8);
    const short = withNights(4, now, { hours: 2, onTime: true });
    const long = withNights(4, now, { hours: 14, onTime: true });
    expect(long.nights.length).toBe(short.nights.length);
    expect(nightmaresFor(long, now).count).toBe(nightmaresFor(short, now).count);
  });
});

describe('a REGULARIDADE é quem escala o tier', () => {
  it('mais regularidade → tier igual ou mais alto, nunca mais baixo', () => {
    const now = at(2026, 7, 20, 8);

    // Baixa regularidade: 1 noite na janela (a de hoje) + 4 fora.
    let low = withNights(5, now, { hours: 8, onTime: false });
    low = recordNight(low, at(2026, 7, 19, 23, 30), at(2026, 7, 20, 7));

    const high = withNights(6, now, { hours: 8, onTime: true });

    const idx = (t: string) => LADDER_TIERS.indexOf(t as never);
    expect(idx(nightmaresFor(high, now, 'mega').tier)).toBeGreaterThan(
      idx(nightmaresFor(low, now, 'mega').tier),
    );
    expect(nightmaresFor(low, now).rarity).toBe('common');
    expect(nightmaresFor(high, now).rarity).toBe('legendary');
  });
});

describe('tier limitado pelo estágio do pet', () => {
  it('um rookie nunca encara acima do próprio tier', () => {
    const now = at(2026, 7, 20, 8);
    const rest = withNights(7, now, { hours: 8, onTime: true });

    expect(nightmaresFor(rest, now, 'mega').tier).toBe('champion');
    expect(nightmaresFor(rest, now, 'rookie').tier).toBe('rookie');

    const wave = buildNightmareWave(rest, 'rookie', now);
    expect(wave.length).toBeGreaterThan(0);
    expect(wave.length).toBeLessThanOrEqual(2);
  });

  it('a onda é curta — bem menor que um andar de masmorra (6)', () => {
    const now = at(2026, 7, 20, 8);
    const rest = withNights(7, now, { hours: 8, onTime: true });
    expect(buildNightmareWave(rest, 'mega', now).length).toBeLessThan(6);
  });
});

describe('estado do combate', () => {
  it('markFought é idempotente', () => {
    const key = nightmareDayKey(at(2026, 7, 20, 8));
    const once = markFought(createNightmareState(), key);
    const twice = markFought(once, key);
    expect(once.fought).toEqual([key]);
    expect(twice.fought).toEqual([key]);
  });

  it('pendência some depois de combater', () => {
    const now = at(2026, 7, 20, 8);
    const rest = withNights(7, now, { hours: 8, onTime: true });
    const nm = createNightmareState();
    expect(hasPendingNightmare(nm, rest, now)).toBe(true);
    const after = markFought(nm, nightmareDayKey(now));
    expect(hasPendingNightmare(after, rest, now)).toBe(false);
  });

  it('pesadelo NÃO combatido expira sem penalidade nenhuma', () => {
    const yesterday = at(2026, 7, 20, 8);
    const today = at(2026, 7, 21, 8);
    // Só a noite de ontem foi registrada; hoje não houve registro.
    const rest = withNights(4, yesterday, { hours: 8, onTime: true });
    const nm: NightmareState = createNightmareState();

    // Ontem havia pendência; hoje ela simplesmente não existe mais.
    expect(hasPendingNightmare(nm, rest, yesterday)).toBe(true);
    expect(hasPendingNightmare(nm, rest, today)).toBe(false);
    // E o estado continua intacto: nada foi cobrado, nada foi zerado.
    expect(nm.fought).toEqual([]);
    expect(nightmareRewards(nightmaresFor(rest, today).rarity, false)).toEqual({
      hearts: 0,
      energy: 0,
      bits: 0,
    });
  });
});

describe('recompensas', () => {
  it('vencer restaura energia e no máximo meio coração', () => {
    for (const rarity of ['common', 'rare', 'legendary'] as const) {
      const r = nightmareRewards(rarity, true);
      expect(r.hearts).toBeLessThanOrEqual(NIGHTMARE_MAX_HEART_CURE);
      expect(r.hearts).toBeGreaterThanOrEqual(0);
      expect(r.energy).toBeGreaterThan(0);
      expect(r.bits).toBeGreaterThan(0);
      expect(r.item).toBeUndefined();
    }
  });

  it('perder NÃO custa nada', () => {
    for (const rarity of ['common', 'rare', 'legendary'] as const) {
      expect(nightmareRewards(rarity, false)).toEqual({ hearts: 0, energy: 0, bits: 0 });
    }
  });
});

describe('textos', () => {
  it('tem EN e PT-BR para toda raridade, e são diferentes entre si', () => {
    for (const rarity of ['common', 'rare', 'legendary'] as const) {
      const en = nightmareName(rarity, 'en');
      const pt = nightmareName(rarity, 'pt-BR');
      expect(en.length).toBeGreaterThan(0);
      expect(pt.length).toBeGreaterThan(0);
      expect(en).not.toBe(pt);
      expect(nightmareFlavor(rarity, 'en')).not.toBe(nightmareFlavor(rarity, 'pt-BR'));
    }
  });
});
