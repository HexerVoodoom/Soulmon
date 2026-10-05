import { describe, it, expect } from 'vitest';
import {
  simulateDuel, duelStats, duelSeed, sanitizeTaps, cheerDischarges, sanitizeCheers, cheerMultiplier,
  DUEL_MAX_TURNS, DUEL_CHEER_WINDOWS, DUEL_TAPS_FULL, DUEL_TAPS_CAP, DUEL_SPECIAL_MULT, DUEL_PERFECT_MULT,
  DUEL_ENERGY_MAX, DUEL_ENERGY_DEALT, DUEL_ENERGY_TAKEN, DUEL_ENERGY_CHEER, DUEL_PENDING_MS, TIMING_CHEER_ENABLED,
} from './_duel.js';

const R = duelStats({ stage: 'rookie' });
const C = duelStats({ stage: 'champion-power' });
const CHEIA = Array(DUEL_CHEER_WINDOWS).fill(DUEL_TAPS_CAP);
const rate = (me, opp, cheers, n = 2000) => {
  let w = 0;
  for (let i = 0; i < n; i++) w += simulateDuel({ me, opp, seed: duelSeed('s', i), cheers }).won ? 1 : 0;
  return w / n;
};
/** O dedo: `perSec` toques por segundo, uma janela = 2 passos de 1,7 s (um golpe do dono a cada 3,4 s). */
const dedo = (perSec) => Array.from({ length: DUEL_CHEER_WINDOWS }, () => Math.min(DUEL_TAPS_CAP, Math.round(perSec * 3.4)));

describe('duelo fantasma — a ENERGIA (04/10/2026, REGISTRO §20.10)', () => {
  it('a torcida por TIMING está desligada (o código antigo fica guardado)', () => {
    expect(TIMING_CHEER_ENABLED).toBe(false);
    // Reaproveitável depois: continuam exportados e coerentes.
    expect(cheerMultiplier(0)).toBe(1);
    expect(cheerMultiplier(1)).toBe(DUEL_PERFECT_MULT);
    expect(sanitizeCheers([9, -1, 'x', 0.5])).toEqual([1, 0, 0]);
  });

  it('é determinístico pela semente', () => {
    const a = simulateDuel({ me: R, opp: C, seed: 42, cheers: [3, 8, 0, 12] });
    const b = simulateDuel({ me: R, opp: C, seed: 42, cheers: [3, 8, 0, 12] });
    expect(a).toEqual(b);
  });

  it('o modelo: UMA barra por lutador; dado, sofrido e cheer enchem; cheio = o especial no golpe seguinte', () => {
    expect(DUEL_ENERGY_MAX).toBe(100);
    // o CHEER é um tanto maior que um ataque dado/sofrido
    expect(DUEL_ENERGY_CHEER).toBeGreaterThan(DUEL_ENERGY_DEALT);
    expect(DUEL_ENERGY_CHEER).toBeGreaterThan(DUEL_ENERGY_TAKEN);
    const { events } = simulateDuel({ me: R, opp: R, seed: 11, cheers: [] });
    // sem torcer: a energia do dono sobe 9 por golpe dado e 7 por golpe sofrido, e o especial ZERA a barra sem render "dado" (PR1b/B1)
    let en = 0;
    for (const e of events) {
      if (e.actor === 'me') {
        if (en >= DUEL_ENERGY_MAX) { expect(e.special).toBe(true); en = 0; }
        else { expect(e.special).toBe(false); en = Math.min(DUEL_ENERGY_MAX, en + DUEL_ENERGY_DEALT); }
      } else en = Math.min(DUEL_ENERGY_MAX, en + DUEL_ENERGY_TAKEN);
      expect(e.energyMe).toBe(en);
    }
  });

  it('o ESPECIAL sai DIRETO nos dois lutadores (sem mecânica): dano ×2 e a barra é gasta', () => {
    expect(DUEL_SPECIAL_MULT).toBe(2);
    const { events } = simulateDuel({ me: R, opp: R, seed: 5, cheers: [] });
    const meus = events.filter(e => e.actor === 'me' && e.special);
    const deles = events.filter(e => e.actor === 'opp' && e.special);
    expect(meus.length).toBeGreaterThan(0);
    expect(deles.length).toBeGreaterThan(0); // o fantasma também solta o dele
    for (const e of events.filter(x => x.special)) {
      const barra = e.actor === 'me' ? e.preMe : e.preOpp;
      expect(barra).toBeGreaterThanOrEqual(DUEL_ENERGY_MAX); // só dispara com a barra cheia
    }
  });

  it('o cheer: o medidor enche com os toques das janelas, despeja ENERGIA e o excedente fica', () => {
    // 24 toques acumulados (2 janelas de 12) = UM despejo na 2ª janela
    expect(cheerDischarges([12, 12]).slice(0, 2)).toEqual([false, true]);
    expect(cheerDischarges([16, 16, 16]).slice(0, 3)).toEqual([false, true, true]); // 16 · 32→8 · 24→0
    const { events } = simulateDuel({ me: R, opp: R, seed: 9, cheers: [16, 16, 0] });
    const meus = events.filter(e => e.actor === 'me');
    expect(meus[0].meter).toBe(16);
    expect(meus[1].meter).toBe(8); // 32 - 24
    expect(meus[2].meter).toBe(8);
  });

  it('a torcida só SOMA: nunca troca vitória por derrota', () => {
    for (let i = 0; i < 400; i++) {
      const seed = duelSeed('x', i);
      const sem = simulateDuel({ me: R, opp: R, seed, cheers: [] });
      const com = simulateDuel({ me: R, opp: R, seed, cheers: CHEIA });
      if (sem.won) expect(com.won).toBe(true);
    }
  });

  it('torcer depois não reescreve os golpes já mostrados (a tela anima por prefixo)', () => {
    const base = simulateDuel({ me: R, opp: R, seed: 7, cheers: [] }).events;
    const com = simulateDuel({ me: R, opp: R, seed: 7, cheers: [0, 0, 0, 16, 16, 16, 16] }).events;
    let myStrikes = 0, i = 0;
    for (; i < base.length; i++) {
      if (base[i].actor === 'me' && myStrikes === 3) break;
      if (base[i].actor === 'me') myStrikes++;
    }
    expect(com.slice(0, i)).toEqual(base.slice(0, i));
  });

  it('o TETO: 24 toques enchem o medidor (lento), 16 por janela, e o jogo todo rende no máximo 13×16 toques', () => {
    expect(DUEL_TAPS_FULL).toBe(24);
    expect(DUEL_TAPS_CAP).toBe(16);
    expect(DUEL_CHEER_WINDOWS).toBe(DUEL_MAX_TURNS / 2);
    // forjar não passa do teto: no máximo ⌊208/24⌋ = 8 despejos no jogo todo
    const forjado = cheerDischarges(Array(DUEL_CHEER_WINDOWS).fill(1e9));
    expect(forjado.filter(Boolean).length).toBeLessThanOrEqual(Math.floor((DUEL_CHEER_WINDOWS * DUEL_TAPS_CAP) / DUEL_TAPS_FULL));
    expect(cheerDischarges(CHEIA)).toEqual(forjado);
  });

  it('higieniza os toques vindos da rede e põe TETO por janela', () => {
    const s = sanitizeTaps([99, -1, 'x', 4]);
    expect(s).toHaveLength(DUEL_CHEER_WINDOWS);
    expect(s.slice(0, 4)).toEqual([DUEL_TAPS_CAP, 0, 0, 4]);
    expect(s.slice(4).every(n => n === 0)).toBe(true);
    expect(sanitizeTaps([2.9, NaN, Infinity]).slice(0, 3)).toEqual([2, 0, 0]);
    expect(sanitizeTaps(null)).toEqual(Array(DUEL_CHEER_WINDOWS).fill(0));
    // Toque ilimitado (ou janelas a mais) não rende mais que o teto.
    const forjado = simulateDuel({ me: R, opp: R, seed: 5, cheers: Array(200).fill(1e9) });
    const cheio = simulateDuel({ me: R, opp: R, seed: 5, cheers: CHEIA });
    expect(forjado).toEqual(cheio);
  });

  it('a luta é LONGA: até 26 golpes, ~22–24 em média (≈ 35–42 s a 1,7 s por golpe)', () => {
    let soma = 0;
    const n = 600;
    for (let i = 0; i < n; i++) {
      const ev = simulateDuel({ me: R, opp: R, seed: duelSeed('len', i), cheers: [] }).events;
      expect(ev.length).toBeLessThanOrEqual(DUEL_MAX_TURNS);
      soma += ev.length;
    }
    const media = soma / n;
    expect(media).toBeGreaterThan(20);
    expect(media * 1.7).toBeGreaterThan(34);
    expect(media * 1.7).toBeLessThan(50);
    // o teto de duração do servidor segue em 5 min (forfeit): a luta animada cabe com folga
    expect(DUEL_PENDING_MS).toBe(5 * 60 * 1000);
    expect(DUEL_MAX_TURNS * 1.7 * 1000).toBeLessThan(DUEL_PENDING_MS / 4);
  });

  it('calibração: sem torcer ~50%; quem toca normal ~72%; o teto ~82%; um estágio abaixo ~13% / ~29% / ~41%', () => {
    expect(rate(R, R, [])).toBeGreaterThan(0.44);
    expect(rate(R, R, [])).toBeLessThan(0.56);
    // Decisão do dono (05/10/2026, contexto §2.13, PR1b): "uma barra, um uso" — o cast não rende
    // "dado"; a torcida normal caiu de ~0,72 para ~0,645 e isso foi ACEITO (faixa baixada).
    expect(rate(R, R, dedo(3))).toBeGreaterThan(0.6);
    expect(rate(R, R, dedo(3))).toBeLessThan(0.8);
    expect(rate(R, R, CHEIA)).toBeGreaterThan(0.75);
    expect(rate(R, C, [])).toBeLessThan(0.22);
    expect(rate(R, C, CHEIA)).toBeGreaterThan(0.3);
    expect(rate(R, C, CHEIA)).toBeLessThan(0.5);
  });

  it('a ficha pública não carrega atributo cru', () => {
    expect(Object.keys(duelStats({ stage: 'mega', attrs: { power: 99 } })).sort()).toEqual(['atk', 'hp']);
  });
});
