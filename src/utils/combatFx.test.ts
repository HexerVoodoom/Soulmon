import { describe, it, expect } from 'vitest';
import {
  fxElementId, fxFrame, visualElementFor, strikeKindForSchool, VISUAL_ELEMENTS, FX_FALLBACK_ELEMENT,
  SCHOOL_STRIKE_FORM, ELEMENT_STRIKE_FORM, skillStrikeForm, elementStrikeForm, specialLabel, SPECIAL_LABEL,
  STAGE_TIMING, DUEL_STEP_MS, impactMs, totalMs,
} from './combatFx';
import { ATTACK_FX_COUNT } from './attackFxArt';
import classSystem from './soulProfile/ficha/classSystem.data.json';
import pool from './soulProfile/bestiary/pool.json';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
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

  it('o golpe BÁSICO segue a tabela da escola (R8: combate físico e a mordida da maldição investem; o resto atira)', () => {
    for (const e of ['combate_fisico', 'maldicao'] as const) expect(strikeKindForSchool(e)).toBe('melee');
    for (const e of ['longo_alcance', 'evocacao', 'conjuracao', 'benca'] as const) expect(strikeKindForSchool(e)).toBe('ranged');
    expect(strikeKindForSchool(undefined)).toBe('ranged');
  });

  it('R8: nenhuma skill sem kind — toda escola × papel (básica/especial) e todo elemento de inimigo tem forma', () => {
    const escolas = Object.keys((classSystem as { escolas: Record<string, unknown> }).escolas);
    expect(escolas.length).toBeGreaterThanOrEqual(6);
    for (const e of escolas) {
      for (const role of ['basica', 'especial'] as const) {
        const f = SCHOOL_STRIKE_FORM[e as keyof typeof SCHOOL_STRIKE_FORM]?.[role];
        expect(['melee', 'ranged'], `${e}/${role}`).toContain(f);
      }
    }
    const elementos = new Set<string>([...CLASS_ELEMENT_ORDER, ...VISUAL_ELEMENTS]);
    for (const c of (pool as { criaturas: Array<{ elementos: string[] }> }).criaturas) c.elementos.forEach(x => elementos.add(x));
    for (const el of elementos) {
      for (const role of ['basica', 'especial'] as const) {
        expect(['melee', 'ranged'], `${el}/${role}`).toContain(ELEMENT_STRIKE_FORM[el]?.[role]);
      }
    }
  });

  it('R8: a forma vem da SKILL (escola/papel ou elemento), sem índice; desconhecido cai à distância', () => {
    expect(skillStrikeForm({ escolaId: 'combate_fisico' }, 'basica')).toBe('melee');
    expect(skillStrikeForm({ escolaId: 'combate_fisico' }, 'especial')).toBe('melee');
    expect(skillStrikeForm({ escolaId: 'conjuracao' }, 'especial')).toBe('ranged');
    expect(skillStrikeForm({ escolaId: 'maldicao' }, 'basica')).toBe('melee');
    expect(skillStrikeForm({ escolaId: 'maldicao' }, 'especial')).toBe('ranged');
    // sem escola (ficha ausente): cai no elemento da skill; sem nada, à distância
    expect(skillStrikeForm({ elementoId: 'marcial' }, 'basica')).toBe('melee');
    expect(skillStrikeForm(undefined, 'basica')).toBe('ranged');
    // determinístico: a mesma skill dá sempre a mesma forma
    const seq = Array.from({ length: 6 }, () => elementStrikeForm('fogo', 'basica'));
    expect(new Set(seq).size).toBe(1);
    expect(elementStrikeForm('fogo', 'basica')).toBe('ranged');
    expect(elementStrikeForm('fogo', 'especial')).toBe('melee');
    expect(elementStrikeForm('planta', 'basica')).toBe(elementStrikeForm('vida', 'basica')); // alias do oráculo
    expect(elementStrikeForm('elemento-que-nao-existe', 'especial')).toBe('ranged');
  });

  it('R8: o rótulo do especial está centralizado (EN e PT)', () => {
    expect(specialLabel(false)).toBe(SPECIAL_LABEL.en);
    expect(specialLabel(true)).toBe(SPECIAL_LABEL.pt);
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
