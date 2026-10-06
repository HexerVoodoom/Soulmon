import { describe, it, expect, vi, afterEach } from 'vitest';
import { autoDefense, defenseRoll, jeitoDefesaBonus } from './autoDefesa';
import {
  ENERGY_MAX, ENERGY_DEALT, ENERGY_TAKEN, ENERGY_CHEER, CHEER_TAPS_FULL, CHEER_TAPS_CAP,
  RING_MULT, RING_OTIMO_MS, RING_BOM_MS, RING_FROM, RING_TO, DODGE_REDUCE, DODGE_OTIMO_MS,
  addEnergy, spendEnergy, strikeEnergy, energyFull, energyRatio, cheerTap, cheerRatio,
  ringSpec, ringScale, ringGrade, dodgeSpec, dodgeGrade,
} from './energia';
import { DODGE_REDUCE_V3, RING_MULT_V3 } from './combate/specials';
import { DUEL_ENERGY_MAX, DUEL_ENERGY_DEALT, DUEL_ENERGY_TAKEN, DUEL_ENERGY_CHEER, DUEL_TAPS_FULL } from '../../functions/api/_duel.js';

afterEach(() => vi.restoreAllMocks());

describe('energia — o modelo (uma barra por lutador; a barra de cheer despeja energia no pet)', () => {
  it('as constantes são as do SERVIDOR (uma regra, um arquivo): o PvP e o PvE enchem do mesmo jeito', () => {
    expect(ENERGY_MAX).toBe(DUEL_ENERGY_MAX);
    expect(ENERGY_DEALT).toBe(DUEL_ENERGY_DEALT);
    expect(ENERGY_TAKEN).toBe(DUEL_ENERGY_TAKEN);
    expect(ENERGY_CHEER).toBe(DUEL_ENERGY_CHEER);
    expect(CHEER_TAPS_FULL).toBe(DUEL_TAPS_FULL);
    expect(CHEER_TAPS_FULL).toBe(24); // lenta de propósito: ~8 s a 3 toques/s
    expect(CHEER_TAPS_CAP).toBeLessThan(CHEER_TAPS_FULL);
  });

  it('cada fator enche um tanto: o cheer pesa MAIS que um ataque dado ou sofrido; nunca passa do máximo', () => {
    expect(addEnergy(0, 'dealt')).toBe(ENERGY_DEALT);
    expect(addEnergy(0, 'taken')).toBe(ENERGY_TAKEN);
    expect(addEnergy(0, 'cheer')).toBe(ENERGY_CHEER);
    expect(ENERGY_CHEER).toBeGreaterThan(Math.max(ENERGY_DEALT, ENERGY_TAKEN));
    expect(addEnergy(ENERGY_MAX - 1, 'cheer')).toBe(ENERGY_MAX);
    expect(addEnergy(Number.NaN, 'dealt')).toBe(ENERGY_DEALT);
    expect(energyFull(ENERGY_MAX)).toBe(true);
    expect(energyFull(ENERGY_MAX - 1)).toBe(false);
    expect(energyRatio(ENERGY_MAX / 2)).toBe(0.5);
    expect(spendEnergy(ENERGY_MAX)).toBe(0);
  });

  it('a barra de cheer: 24 toques despejam energia e ela zera, ficando só o excedente', () => {
    let m = 0; let desp = 0;
    for (let i = 0; i < CHEER_TAPS_FULL - 1; i++) { const r = cheerTap(m); m = r.meter; if (r.discharged) desp++; }
    expect(desp).toBe(0);
    expect(cheerRatio(m)).toBeLessThan(1);
    const r = cheerTap(m);
    expect(r.discharged).toBe(true);
    expect(r.meter).toBe(0);
    expect(cheerTap(5).meter).toBe(6); // toque normal só soma um
  });

  it('o modelo simples e legível: ataque dado + ataque sofrido + cheer enchem a MESMA barra até o especial', () => {
    // 16 por ida-e-volta (9 + 7): a 7ª ida-e-volta enche sem cheer; cada despejo de cheer adianta ~2,25 delas
    let sem = 0; let idas = 0;
    while (!energyFull(sem)) { sem = addEnergy(addEnergy(sem, 'dealt'), 'taken'); idas++; }
    expect(idas).toBe(7);
    let com = 0; let idasCom = 0;
    com = addEnergy(com, 'cheer');
    while (!energyFull(com)) { com = addEnergy(addEnergy(com, 'dealt'), 'taken'); idasCom++; }
    expect(idasCom).toBeLessThan(idas);
  });
});

describe('energia — o ANEL do especial (mecânica ativa do PvE, determinística pela semente)', () => {
  it('mesmo (semente, n) = mesmo anel; n diferente muda a velocidade; fica em 1,5–2,1 s', () => {
    expect(ringSpec(7, 0)).toEqual(ringSpec(7, 0));
    const velocidades = new Set(Array.from({ length: 20 }, (_, n) => ringSpec(7, n).ms));
    expect(velocidades.size).toBeGreaterThan(5);
    for (let n = 0; n < 200; n++) {
      const s = ringSpec(1234 + n, n);
      expect(s.ms).toBeGreaterThanOrEqual(1500);
      expect(s.ms).toBeLessThanOrEqual(2100);
      // o anel encosta no alvo (escala 1) exatamente em targetMs
      expect(ringScale(s.targetMs, s)).toBeCloseTo(1, 1);
    }
  });

  it('o anel encolhe de RING_FROM a RING_TO, sem passar', () => {
    const s = ringSpec(3, 1);
    expect(ringScale(0, s)).toBe(RING_FROM);
    expect(ringScale(s.ms, s)).toBeCloseTo(RING_TO, 5);
    expect(ringScale(s.ms * 2, s)).toBe(RING_TO);
    expect(ringScale(s.ms / 2, s)).toBeLessThan(ringScale(s.ms / 4, s));
  });

  it('a nota: ótimo perto do alvo, bom um pouco mais longe, ruim fora da janela ou sem toque', () => {
    const s = ringSpec(9, 2);
    expect(ringGrade(s.targetMs, s)).toBe('otimo');
    expect(ringGrade(s.targetMs - RING_OTIMO_MS, s)).toBe('otimo');
    expect(ringGrade(s.targetMs + RING_OTIMO_MS + 1, s)).toBe('bom');
    expect(ringGrade(s.targetMs - RING_BOM_MS, s)).toBe('bom');
    expect(ringGrade(s.targetMs + RING_BOM_MS + 1, s)).toBe('ruim');
    expect(ringGrade(0, s)).toBe('ruim'); // cedo demais
    expect(ringGrade(null, s)).toBe('ruim'); // sem toque: o especial sai, fraco
    expect(ringGrade(Number.NaN, s)).toBe('ruim');
  });

  it('os multiplicadores: ruim < bom (=1) < ótimo; um jogador médio fica perto de 1', () => {
    expect(RING_MULT.ruim).toBeLessThan(RING_MULT.bom);
    expect(RING_MULT.bom).toBe(1);
    expect(RING_MULT.otimo).toBeGreaterThan(RING_MULT.bom);
    const media = 0.25 * RING_MULT.ruim + 0.5 * RING_MULT.bom + 0.25 * RING_MULT.otimo;
    expect(media).toBeGreaterThan(0.97);
    expect(media).toBeLessThan(1.08);
  });

  it('Combate v3 (§2.15 P4): o anel vale 0,92 / 1 / 1,08 — a tabela do núcleo, e a ÚNICA (a do Pesadelo e da Masmorra antigos saiu no PR4)', () => {
    expect({ ...RING_MULT }).toEqual({ ruim: 0.92, bom: 1, otimo: 1.08 });
    expect({ ...RING_MULT }).toEqual({ ...RING_MULT_V3 });
  });
});

describe('energia — a ESQUIVA do especial do inimigo (mecânica ativa do PvE)', () => {
  it('mesmo (semente, n) = mesma janela; o projétil leva 1 s e a carga 1–1,5 s', () => {
    expect(dodgeSpec(5, 0)).toEqual(dodgeSpec(5, 0));
    for (let n = 0; n < 100; n++) {
      const s = dodgeSpec(77 + n, n);
      expect(s.castMs).toBeGreaterThanOrEqual(1000);
      expect(s.castMs).toBeLessThanOrEqual(1500);
      expect(s.flightMs).toBe(1000);
      expect(s.impactMs).toBe(s.castMs + s.flightMs);
    }
  });

  it('a nota: só vale com o projétil no ar; no último trecho antes do impacto é ótima; sem gesto = nada', () => {
    const s = dodgeSpec(11, 3);
    expect(dodgeGrade(null, s)).toBe('nada');
    expect(dodgeGrade(s.castMs - 1, s)).toBe('nada'); // cedo demais (ainda carregando)
    expect(dodgeGrade(s.castMs + 1, s)).toBe('bom');
    expect(dodgeGrade(s.impactMs - DODGE_OTIMO_MS - 1, s)).toBe('bom');
    expect(dodgeGrade(s.impactMs - DODGE_OTIMO_MS, s)).toBe('otimo');
    expect(dodgeGrade(s.impactMs, s)).toBe('otimo');
    expect(dodgeGrade(s.impactMs + 1, s)).toBe('nada'); // tarde demais
  });

  it('esquivar REDUZ o dano; sem agir leva o normal; ótimo tira mais que bom', () => {
    expect(DODGE_REDUCE.nada).toBe(0);
    expect(DODGE_REDUCE.bom).toBeGreaterThan(0);
    expect(DODGE_REDUCE.otimo).toBeGreaterThan(DODGE_REDUCE.bom);
    expect(DODGE_REDUCE.otimo).toBeLessThan(1); // nunca zera de graça
    expect({ ...DODGE_REDUCE }).toEqual({ nada: 0, bom: 0.2, otimo: 0.35 }); // v3 (PR3b)
    expect({ ...DODGE_REDUCE }).toEqual({ ...DODGE_REDUCE_V3 });
  });
});
