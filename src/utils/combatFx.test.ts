import { describe, it, expect } from 'vitest';
import {
  fxElementId, fxFrame, visualElementFor, strikeKindForSchool, VISUAL_ELEMENTS, FX_FALLBACK_ELEMENT,
  STAGE_TIMING, DUEL_STEP_MS, ARENA_STRIKE_MS, ARENA_DEFEND_MS, impactMs, totalMs,
} from './combatFx';
import { ATTACK_FX_COUNT } from './attackFxArt';
import {
  simulateDuel, duelStats, duelSeed, specialSlots, DUEL_CHEER_STRIKES, DUEL_TAPS_FULL, DUEL_TAPS_CAP,
} from '../../functions/api/_duel.js';

describe('inventário da arte de skill por elemento (a base da cena de combate)', () => {
  it('os 17 elementos base têm TODOS os estados que a cena usa (cast, slash, orb, impact, defended, aura)', () => {
    for (const id of VISUAL_ELEMENTS) {
      for (const estado of ['cast', 'slash', 'orb', 'impact', 'defended', 'aura'] as const) {
        expect(fxFrame(id, estado), `${id}:${estado}`).toBeTruthy();
      }
    }
    // E o neutro (o fallback) também.
    for (const estado of ['cast', 'slash', 'orb', 'impact', 'defended', 'aura'] as const) {
      expect(fxFrame(FX_FALLBACK_ELEMENT, estado)).toBeTruthy();
    }
  });

  it('o glob achou a arte inteira: 154 elementos × 6 estados', () => {
    expect(ATTACK_FX_COUNT).toBe(154 * 6);
  });

  it('id sem arte cai no neutro; ids do oráculo sem arte caem no mais próximo', () => {
    expect(fxElementId(undefined)).toBe('neutro');
    expect(fxElementId('')).toBe('neutro');
    expect(fxElementId('elemento-que-nao-existe')).toBe('neutro');
    expect(fxElementId('planta')).toBe('vida');
    expect(fxElementId('industrial')).toBe('aco');
    expect(fxElementId('fogo')).toBe('fogo');
    expect(fxFrame('elemento-que-nao-existe', 'orb')).toBe(fxFrame('neutro', 'orb'));
    // Derivado também tem arte própria (não cai no neutro).
    expect(fxElementId('vapor')).toBe('vapor');
    expect(fxFrame('vapor', 'orb')).not.toBe(fxFrame('neutro', 'orb'));
  });

  it('fogo usa a arte de fogo e água a de água (cada elemento tem a SUA arte)', () => {
    expect(fxFrame('fogo', 'orb')).not.toBe(fxFrame('agua', 'orb'));
    expect(fxFrame('fogo', 'slash')).toMatch(/fx-fogo-slash/);
    expect(fxFrame('agua', 'defended')).toMatch(/fx-agua-defended/);
  });
});

describe('o elemento visual do oponente e a ação de cada escola', () => {
  it('o oponente recebe um elemento determinístico (o servidor não publica elemento)', () => {
    expect(visualElementFor('abc')).toBe(visualElementFor('abc'));
    const ids = Array.from({ length: 300 }, (_, i) => visualElementFor(`jogador-${i}`));
    for (const e of ids) expect(VISUAL_ELEMENTS).toContain(e);
    expect(new Set(ids).size).toBeGreaterThanOrEqual(12); // espalha, não colapsa num elemento
  });

  it('só o combate físico investe; as outras escolas atiram', () => {
    expect(strikeKindForSchool('combate_fisico')).toBe('melee');
    for (const e of ['longo_alcance', 'evocacao', 'conjuracao', 'benca', 'maldicao'] as const) {
      expect(strikeKindForSchool(e)).toBe('ranged');
    }
    expect(strikeKindForSchool(undefined)).toBe('ranged');
  });

  it('movimento reduzido: o impacto chega logo (só o flash), sem trajeto', () => {
    for (const k of ['melee', 'ranged', 'special'] as const) {
      expect(impactMs(k, true)).toBeLessThan(impactMs(k, false));
      expect(totalMs(k, true)).toBeLessThanOrEqual(STAGE_TIMING.reduced.total);
    }
  });
});

/**
 * RITMO E CALIBRAÇÃO do duelo fantasma (REGISTRO §20.9). O relógio da tela
 * (`DuelScreen`): cada golpe leva `DUEL_STEP_MS − ranged.impact` até COMEÇAR a ação e
 * mais o impacto do tipo dela (investida 460, projétil 760, especial 980 ms); a
 * janela de torcida fecha ao começar a ação do golpe de torcida. Um "dedo" de
 * `rate` toques/s enche as janelas pelo tempo entre os fechamentos.
 */
describe('duelo fantasma — ritmo e calibração (modelo de tempo da tela)', () => {
  const R = duelStats({ stage: 'rookie' });
  const C = duelStats({ stage: 'champion-power' });
  const N = 1500;
  const pre = DUEL_STEP_MS - STAGE_TIMING.ranged.impact;

  /** Para uma semente: duração da luta (ms), toques por janela de um dedo de `rate` toques/s e o instante do 1º especial. */
  function luta(me: typeof R, opp: typeof R, seed: number, rate: number) {
    const base = simulateDuel({ me, opp, seed, cheers: [] }).events;
    const taps: number[] = [];
    let t = 0; let ultimoFecho = 0; let meus = 0;
    const inicios: number[] = [];
    const meuSlot: Array<number | null> = [];
    for (let i = 0; i < base.length; i++) {
      inicios.push(t);
      const slot = base[i].actor === 'me' ? DUEL_CHEER_STRIKES.indexOf(meus) : -1;
      meuSlot.push(slot >= 0 ? slot : null);
      if (base[i].actor === 'me') meus++;
      if (slot >= 0) {
        const fecho = t + pre;
        taps[slot] = Math.min(DUEL_TAPS_CAP, Math.round(((fecho - ultimoFecho) / 1000) * rate));
        ultimoFecho = fecho;
      }
      const kind = slot >= 0 && specialSlots(taps)[slot] ? 'special' : i % 2 === 0 ? 'melee' : 'ranged';
      t += pre + STAGE_TIMING[kind].impact;
    }
    const cheers = DUEL_CHEER_STRIKES.map((_, i) => taps[i] ?? 0);
    const esp = specialSlots(cheers);
    const slotDoPrimeiro = esp.indexOf(true);
    const iPrimeiro = slotDoPrimeiro < 0 ? -1 : meuSlot.indexOf(slotDoPrimeiro);
    const sim = simulateDuel({ me, opp, seed, cheers });
    return { dur: t, cheers, won: sim.won, primeiro: iPrimeiro < 0 ? null : inicios[iPrimeiro] + pre };
  }
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const taxa = (me: typeof R, opp: typeof R, rate: number) => {
    let w = 0; const durs: number[] = []; const primeiros: number[] = [];
    for (let i = 0; i < N; i++) {
      const l = luta(me, opp, duelSeed('ritmo', i), rate);
      if (l.won) w++;
      durs.push(l.dur);
      if (l.primeiro != null) primeiros.push(l.primeiro);
    }
    return { win: w / N, dur: media(durs), primeiro: primeiros.sort((a, b) => a - b)[Math.floor(primeiros.length / 2)] ?? null, comEspecial: primeiros.length / N };
  };

  it('a luta dura ~17 s (eram ~10,6 s a 900 ms por golpe)', () => {
    const { dur } = taxa(R, R, 0);
    expect(dur).toBeGreaterThan(14000);
    expect(dur).toBeLessThan(20000);
    expect(DUEL_STEP_MS).toBeGreaterThanOrEqual(1400);
  });

  it('a ~3 toques/s o PRIMEIRO especial sai por volta dos 10 s tocando (8 a 12 s)', () => {
    const { primeiro, comEspecial } = taxa(R, R, 3);
    expect(comEspecial).toBeGreaterThan(0.9);
    expect(primeiro!).toBeGreaterThan(8000);
    expect(primeiro!).toBeLessThan(12500);
  });

  it('sem torcer ≈ resultado base (~51%); quem toca normal ganha ~+23pp; o gauge CHEIO nas 3 janelas é o teto (~82%)', () => {
    const sem = taxa(R, R, 0).win;
    const normal = taxa(R, R, 3).win;
    const preguica = taxa(R, R, 1.5).win;
    const forte = taxa(R, R, 6).win;
    expect(sem).toBeGreaterThan(0.46);
    expect(sem).toBeLessThan(0.56);
    expect(normal - sem).toBeGreaterThan(0.17);
    expect(normal - sem).toBeLessThan(0.3);
    expect(preguica).toBeGreaterThanOrEqual(sem);
    expect(forte).toBeGreaterThanOrEqual(normal);
    let cheia = 0;
    for (let i = 0; i < N; i++) {
      if (simulateDuel({ me: R, opp: R, seed: duelSeed('ritmo', i), cheers: [DUEL_TAPS_CAP, DUEL_TAPS_CAP, DUEL_TAPS_CAP] }).won) cheia++;
    }
    expect(cheia / N).toBeGreaterThan(0.78);
    expect(cheia / N).toBeLessThan(0.86);
    expect(forte).toBeLessThanOrEqual(cheia / N + 0.02); // nenhum ritmo passa do teto
  });

  it('um estágio abaixo: sem torcer ~14%, quem toca normal ~30%, o teto ~38% (a torcida não apaga o estágio)', () => {
    const sem = taxa(R, C, 0).win;
    const normal = taxa(R, C, 3).win;
    expect(sem).toBeLessThan(0.2);
    expect(normal).toBeGreaterThan(sem);
    expect(normal).toBeLessThan(0.42);
  });

  it('o gauge pede 16 toques (≈ 5,3 s a 3 toques/s)', () => {
    expect(DUEL_TAPS_FULL).toBe(16);
    expect(DUEL_TAPS_FULL / 3).toBeGreaterThan(5);
    expect(DUEL_TAPS_FULL / 3).toBeLessThan(7);
  });
});

describe('Arena — o ritmo do turno', () => {
  it('o golpe do pet e o revide ficaram mais LENTOS (eram 1500 e 800 ms)', () => {
    expect(ARENA_STRIKE_MS).toBeGreaterThanOrEqual(2200);
    expect(ARENA_DEFEND_MS).toBeGreaterThanOrEqual(1200);
    // Um turno contra UM inimigo: ~3,8 s ⇒ ~11 toques a 3 toques/s (gauge de 16: especial a cada 2 turnos).
    const turno = (ARENA_STRIKE_MS + ARENA_DEFEND_MS) / 1000;
    expect(turno * 3).toBeGreaterThan(10);
    expect(turno * 3).toBeLessThan(13);
  });
});
