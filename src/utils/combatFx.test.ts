import { describe, it, expect } from 'vitest';
import {
  fxElementId, fxFrame, visualElementFor, strikeKindForSchool, VISUAL_ELEMENTS, FX_FALLBACK_ELEMENT,
  STAGE_TIMING, DUEL_STEP_MS, PVE_STEP_MS, ARENA_STRIKE_MS, ARENA_DEFEND_MS, impactMs, totalMs,
} from './combatFx';
import { ATTACK_FX_COUNT } from './attackFxArt';
import {
  simulateDuel, duelStats, duelSeed, DUEL_CHEER_WINDOWS, DUEL_MAX_TURNS, DUEL_PENDING_MS, DUEL_TAPS_FULL, DUEL_TAPS_CAP,
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
 * RITMO E CALIBRAÇÃO do duelo fantasma (REGISTRO §20.9 e §20.10). O relógio da tela
 * (`DuelScreen`): cada golpe leva `DUEL_STEP_MS − ranged.impact` até COMEÇAR a ação e
 * mais o impacto do tipo dela (investida 460, projétil 760, especial 980 ms); a janela de
 * torcida fecha ao começar a ação de cada golpe do dono. Um "dedo" de `rate` toques/s enche
 * cada janela pelo tempo entre os fechamentos.
 */
describe('duelo fantasma — ritmo e calibração (modelo de tempo da tela)', () => {
  const R = duelStats({ stage: 'rookie' });
  const C = duelStats({ stage: 'champion-power' });
  const N = 1500;
  const pre = DUEL_STEP_MS - STAGE_TIMING.ranged.impact;

  /** Para uma semente: duração (ms), o instante do 1º especial do dono e o resultado de um dedo de `rate` toques/s. */
  function luta(me: typeof R, opp: typeof R, seed: number, rate: number) {
    let cheers: number[] = [];
    let events = simulateDuel({ me, opp, seed, cheers }).events;
    let t = 0; let ultimoFecho = 0; let primeiro: number | null = null;
    for (let i = 0; i < events.length; i++) {
      if (events[i].actor === 'me') {
        const fecho = t + pre;
        cheers = [...cheers, Math.min(DUEL_TAPS_CAP, Math.round(((fecho - ultimoFecho) / 1000) * rate))];
        ultimoFecho = fecho;
        events = simulateDuel({ me, opp, seed, cheers }).events;
        if (!events[i]) break;
        if (events[i].special && primeiro === null) primeiro = fecho;
      }
      const kind = events[i].special ? 'special' : i % 2 === 0 ? 'melee' : 'ranged';
      t += pre + STAGE_TIMING[kind].impact;
    }
    return { dur: t, won: simulateDuel({ me, opp, seed, cheers }).won, primeiro };
  }
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const mediana = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? null;
  const taxa = (me: typeof R, opp: typeof R, rate: number) => {
    let w = 0; const durs: number[] = []; const primeiros: number[] = [];
    for (let i = 0; i < N; i++) {
      const l = luta(me, opp, duelSeed('ritmo', i), rate);
      if (l.won) w++;
      durs.push(l.dur);
      if (l.primeiro != null) primeiros.push(l.primeiro);
    }
    return { win: w / N, dur: media(durs), primeiro: mediana(primeiros) };
  };

  it('a luta dura ~35–45 s (era ~10,6 s, depois ~17 s) e cabe no teto de 5 min do servidor', () => {
    const { dur } = taxa(R, R, 0);
    expect(dur).toBeGreaterThan(33000);
    expect(dur).toBeLessThan(46000);
    expect(DUEL_STEP_MS).toBeGreaterThanOrEqual(1600);
    expect(DUEL_MAX_TURNS * DUEL_STEP_MS).toBeLessThan(DUEL_PENDING_MS / 4);
  });

  it('a ~3 toques/s o primeiro especial do dono sai ANTES do que sairia sozinho (a barra de cheer acelera a energia)', () => {
    const sozinho = taxa(R, R, 0).primeiro!;
    const tocando = taxa(R, R, 3).primeiro!;
    expect(tocando).toBeLessThan(sozinho);
    expect(tocando).toBeGreaterThan(8000); // enche DEVAGAR: nada de especial nos primeiros 8 s
  });

  it('sem torcer ≈ resultado base (~51%); quem toca normal ganha ~+22pp; o teto de toque é ~82%', () => {
    const sem = taxa(R, R, 0).win;
    const normal = taxa(R, R, 3).win;
    const preguica = taxa(R, R, 1.5).win;
    const forte = taxa(R, R, 6).win;
    expect(sem).toBeGreaterThan(0.45);
    expect(sem).toBeLessThan(0.56);
    expect(normal - sem).toBeGreaterThan(0.15);
    expect(normal - sem).toBeLessThan(0.3);
    expect(preguica).toBeGreaterThanOrEqual(sem - 0.02);
    expect(forte).toBeGreaterThanOrEqual(normal);
    let cheia = 0;
    for (let i = 0; i < N; i++) {
      if (simulateDuel({ me: R, opp: R, seed: duelSeed('ritmo', i), cheers: Array(DUEL_CHEER_WINDOWS).fill(DUEL_TAPS_CAP) }).won) cheia++;
    }
    expect(cheia / N).toBeGreaterThan(0.77);
    expect(cheia / N).toBeLessThan(0.87);
    expect(forte).toBeLessThanOrEqual(cheia / N + 0.02); // nenhum ritmo passa do teto
  });

  it('um estágio abaixo: sem torcer ~13%, quem toca normal ~29%, o teto ~41% (a torcida não apaga o estágio)', () => {
    const sem = taxa(R, C, 0).win;
    const normal = taxa(R, C, 3).win;
    expect(sem).toBeLessThan(0.2);
    expect(normal).toBeGreaterThan(sem);
    expect(normal).toBeLessThan(0.42);
  });

  it('a barra de cheer pede 24 toques (≈ 8 s a 3 toques/s) — lenta de propósito', () => {
    expect(DUEL_TAPS_FULL).toBe(24);
    expect(DUEL_TAPS_FULL / 3).toBeGreaterThan(7);
    expect(DUEL_TAPS_FULL / 3).toBeLessThan(9);
  });
});

describe('Arena — o ritmo do turno', () => {
  it('o golpe do pet e o revide ficaram mais LENTOS (eram 1500 e 800 ms)', () => {
    expect(ARENA_STRIKE_MS).toBeGreaterThanOrEqual(2200);
    expect(ARENA_DEFEND_MS).toBeGreaterThanOrEqual(1200);
    // Um turno contra UM inimigo: ~3,8 s ⇒ ~11 toques a 3 toques/s (a barra de cheer de 24 despeja a cada ~2 turnos).
    // (O Duelo da Arena com ENERGIA usa o relógio de PvE — `PVE_STEP_MS` por lado —; estas constantes são do caminho antigo.)
    const turno = (ARENA_STRIKE_MS + ARENA_DEFEND_MS) / 1000;
    expect(turno * 3).toBeGreaterThan(10);
    expect(turno * 3).toBeLessThan(13);
    expect(PVE_STEP_MS).toBe(1700);
  });
});
