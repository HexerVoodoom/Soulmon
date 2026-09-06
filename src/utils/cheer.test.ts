/**
 * WP2.13 e WP2.14 — as falas que não valem nada, e é isso que as faz valer.
 *
 * A ressalva #16 da revisão é a régua: fala do meio do caminho e fala rara
 * NÃO podem dar bônus. Se derem, viram marco por acidente — e a escada de
 * maturidade passa a ter seis degraus sem ninguém ter decidido isso.
 */
import { describe, it, expect } from 'vitest';
import { HABIT_MILESTONES, HABIT_CHEER_AT, HABIT_TIER_BONUS, cheerReached } from '../types/taskModel';
import { habitTier, attributeMultiplier } from './habitRhythm';
import { PET_VOICE_LINES, RARE_CHEER_RATE, rolledRareCheer } from './petVoice';

describe('WP2.13 — fala do meio do caminho não é marco', () => {
  it('os três dias de fala não colidem com os três marcos', () => {
    for (const n of HABIT_CHEER_AT) {
      expect(HABIT_MILESTONES as readonly number[]).not.toContain(n);
    }
  });

  it('a lista de MARCOS não mudou — 7/21/66, de Lally et al.', () => {
    expect([...HABIT_MILESTONES]).toEqual([7, 21, 66]);
  });

  it('cruzar um dia de fala NÃO muda tier nem rendimento', () => {
    // É a trava do pacote: se mudar, virou marco.
    for (const n of HABIT_CHEER_AT) {
      expect(habitTier(n)).toBe(habitTier(n - 1));
      expect(attributeMultiplier(n)).toBe(attributeMultiplier(n - 1));
    }
  });

  it('`cheerReached` responde UMA vez, no cruzamento', () => {
    expect(cheerReached(2, 3)).toBe(3);
    expect(cheerReached(3, 4)).toBeNull();
    expect(cheerReached(35, 36)).toBe(36);
    expect(cheerReached(0, 0)).toBeNull();
  });

  it('nenhuma fala diz quanto falta', () => {
    // O número que falta é a conta que transforma constância em cobrança.
    for (const l of [...PET_VOICE_LINES.cheer.pt, ...PET_VOICE_LINES.cheer.en]) {
      expect(l).not.toMatch(/\d/);
      expect(l.toLowerCase()).not.toMatch(/falt|missing|left/);
    }
  });
});

describe('WP2.14 — a fala rara vale ZERO', () => {
  it('a taxa é pequena e fixa', () => {
    expect(RARE_CHEER_RATE).toBeGreaterThan(0);
    expect(RARE_CHEER_RATE).toBeLessThan(0.15);
  });

  it('o sorteio é determinístico dado o `pick` — e não muda nada além da frase', () => {
    expect(rolledRareCheer(0)).toBe(true);
    expect(rolledRareCheer(0.99)).toBe(false);
    // A prova de que a recompensa é idêntica com e sem o sorteio: a função
    // devolve um BOOLEANO e não toca em estado nenhum. Se um dia ela receber
    // ou devolver GameState, deixou de ser fala e virou economia.
    expect(typeof rolledRareCheer(0.01)).toBe('boolean');
  });

  it('as frases raras não prometem prêmio', () => {
    for (const l of [...PET_VOICE_LINES.rare.pt, ...PET_VOICE_LINES.rare.en]) {
      expect(l.toLowerCase()).not.toMatch(/bits|item|prêmio|prize|bônus|bonus|raro|rare/);
    }
  });

  it('o bônus por tier continua vindo SÓ dos marcos', () => {
    expect(Object.keys(HABIT_TIER_BONUS).sort()).toEqual(['sapling', 'seed', 'sprout', 'tree']);
  });
});
