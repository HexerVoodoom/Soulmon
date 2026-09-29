import { describe, it, expect } from 'vitest';
import {
  observeGrove, acknowledgeGrove, groveAvisoFor, sanitizeGroveLocal, permanenceBand, parseDayLabel,
  formatDayLabel, groveSceneIds, grantGroveScenes, groveStageAt, type GroveLocal,
} from './groveLocal';

const D1 = 'Mon Sep 28 2026';
const D2 = 'Tue Sep 29 2026';
const v = (stageIndex: number, over: Partial<{ gid: string; groveScenes: boolean }> = {}) => ({ gid: 'g1', stageIndex, groveScenes: false, ...over });

describe('memória do aparelho — baseline, marco e aviso', () => {
  it('a 1ª vez é BASELINE: sem cerimônia, sem aviso, telemetria do estágio visto', () => {
    const o = observeGrove(null, v(3), D1);
    expect(o.next).toMatchObject({ gid: 'g1', index: 3, base: 3, pending: null, joinedDay: D1 });
    expect(o.firstSeenStage).toBe(3);
    expect(groveAvisoFor(o.next, D1)).toBeNull();
  });

  it('sem estágio ainda (0): baseline vazio, sem telemetria', () => {
    const o = observeGrove(null, v(0), D1);
    expect(o.next.index).toBe(0);
    expect(o.firstSeenStage).toBeNull();
    expect(o.next.marks).toEqual({});
  });

  it('subir para a Ramagem em diante deixa marco PENDENTE e datado; o aviso vale só naquele dia', () => {
    const base = observeGrove(null, v(1), D1).next;
    const o = observeGrove(base, v(2), D2);
    expect(o.next.pending).toEqual({ index: 2, day: D2 });
    expect(o.next.marks['2']).toBe(D2);
    expect(o.firstSeenStage).toBe(2);
    expect(groveAvisoFor(o.next, D2)).toBe(2);
    expect(groveAvisoFor(o.next, 'Wed Sep 30 2026')).toBeNull(); // aviso, não pendência
  });

  it('a Clareira nova é reconhecida sem cerimônia e sem aviso (não há marco na copy)', () => {
    const base = observeGrove(null, v(0), D1).next;
    const o = observeGrove(base, v(1), D2);
    expect(o.next.pending).toBeNull();
    expect(o.next.index).toBe(1);
    expect(groveAvisoFor(o.next, D2)).toBeNull();
  });

  it('vários estágios de uma vez: celebra o MAIS ALTO, uma vez, e datou todos', () => {
    const base = observeGrove(null, v(1), D1).next;
    const o = observeGrove(base, v(4), D2);
    expect(o.next.pending).toEqual({ index: 4, day: D2 });
    expect(Object.keys(o.next.marks).sort()).toEqual(['1', '2', '3', '4']);
  });

  it('só SOBE: uma vista velha (menor) não desfaz nem cria marco', () => {
    const base = observeGrove(null, v(3), D1).next;
    const o = observeGrove(base, v(1), D2);
    expect(o.next.index).toBe(3);
    expect(o.next.pending).toBeNull();
    expect(o.firstSeenStage).toBeNull();
  });

  it('não repete a telemetria de um estágio que este aparelho já viu', () => {
    let l = observeGrove(null, v(1), D1).next;
    l = observeGrove(l, v(2), D2).next;
    l = acknowledgeGrove(l)!;
    expect(observeGrove(l, v(2), D2).firstSeenStage).toBeNull();
  });

  it('acknowledge fecha o marco e é idempotente', () => {
    const l = observeGrove(observeGrove(null, v(1), D1).next, v(3), D2).next;
    const a = acknowledgeGrove(l)!;
    expect(a.pending).toBeNull();
    expect(a.index).toBe(3);
    expect(acknowledgeGrove(a)).toBe(a);
    expect(acknowledgeGrove(null)).toBeNull();
  });

  it('roda DIFERENTE recomeça a memória (baseline de novo)', () => {
    const l = observeGrove(null, v(4), D1).next;
    const o = observeGrove(l, v(1, { gid: 'g2' }), D2);
    expect(o.next).toMatchObject({ gid: 'g2', index: 1, base: 1, pending: null });
  });

  it('cenários: acompanham `groveScenes` até o estágio atual e nunca diminuem', () => {
    let l = observeGrove(null, v(2, { groveScenes: true }), D1).next;
    expect(l.scenes).toBe(2);
    l = observeGrove(l, v(3, { groveScenes: false }), D2).next;
    expect(l.scenes).toBe(2);
    l = observeGrove(l, v(4, { groveScenes: true }), D2).next;
    expect(l.scenes).toBe(4);
  });
});

describe('cenários no save (G12: ficam com quem sai)', () => {
  it('os ids vão da Clareira até o estágio, e 0 não libera nada', () => {
    expect(groveSceneIds(0)).toEqual([]);
    expect(groveSceneIds(3)).toEqual(['bg-guild-clareira', 'bg-guild-ramagem', 'bg-guild-copa']);
    expect(groveSceneIds(99)).toHaveLength(5);
  });

  it('a entrega é IDEMPOTENTE: a 2ª devolve a MESMA referência (footgun 6: updater roda 2×)', () => {
    const s = { ownedBackgrounds: ['bg-room'], outro: 1 };
    const a = grantGroveScenes(s, groveSceneIds(2));
    expect(a.ownedBackgrounds).toEqual(['bg-room', 'bg-guild-clareira', 'bg-guild-ramagem']);
    expect(grantGroveScenes(a, groveSceneIds(2))).toBe(a);
    expect(grantGroveScenes(a, groveSceneIds(3)).ownedBackgrounds).toHaveLength(4);
    expect(a.outro).toBe(1);
  });

  it('save sem `ownedBackgrounds` não quebra', () => {
    expect(grantGroveScenes({} as { ownedBackgrounds?: string[] }, ['bg-guild-clareira']).ownedBackgrounds).toEqual(['bg-guild-clareira']);
  });
});

describe('dado do disco é não confiável', () => {
  it('lixo vira null; campos fora de faixa são contidos; pending abaixo da Ramagem some', () => {
    expect(sanitizeGroveLocal(null)).toBeNull();
    expect(sanitizeGroveLocal('x')).toBeNull();
    expect(sanitizeGroveLocal({ index: 2 })).toBeNull();
    const l = sanitizeGroveLocal({ gid: 'g', index: 99, tracked: -4, scenes: 'x', marks: { '1': D1, '9': D1, x: D1, '2': 5 }, pending: { index: 1, day: D1 } })!;
    expect(l.index).toBe(5);
    expect(l.tracked).toBe(0);
    expect(l.scenes).toBe(0);
    expect(l.marks).toEqual({ '1': D1 });
    expect(l.pending).toBeNull();
  });
});

describe('datas e faixas', () => {
  it('lê o nome do dia do jogador e o ISO, e formata nos dois idiomas', () => {
    expect(parseDayLabel(D2)?.getDate()).toBe(29);
    expect(parseDayLabel('2026-08-10')?.getMonth()).toBe(7);
    expect(parseDayLabel('lixo')).toBeNull();
    expect(formatDayLabel('2026-08-10', 'pt-BR')).toBe('10 de agosto de 2026');
    expect(formatDayLabel('2026-08-10', 'en-US')).toBe('August 10, 2026');
    expect(formatDayLabel('lixo', 'pt-BR')).toBe('');
  });

  it('permanência em FAIXA (0..3), nunca a data', () => {
    const d = (n: number) => `2026-09-${String(n).padStart(2, '0')}`;
    expect(permanenceBand(d(1), d(3))).toBe(0);
    expect(permanenceBand(d(1), d(8))).toBe(1);
    expect(permanenceBand('2026-08-01', '2026-09-01')).toBe(2);
    expect(permanenceBand('2026-01-01', '2026-09-01')).toBe(3);
    expect(permanenceBand('lixo', d(3))).toBe(0);
    expect(permanenceBand(d(9), d(3))).toBe(0);
  });

  it('o estágio pelo índice', () => {
    expect(groveStageAt(0)).toBeNull();
    expect(groveStageAt(2)).toBe('ramagem');
    expect(groveStageAt(5)).toBe('bosque-antigo');
    expect(groveStageAt(6)).toBeNull();
  });
});

describe('o tipo não carrega nada por pessoa', () => {
  it('as chaves da memória são só id público, índices, datas e cenários', () => {
    const l: GroveLocal = observeGrove(null, v(2), D1).next;
    expect(Object.keys(l).sort()).toEqual(['base', 'gid', 'index', 'joinedDay', 'marks', 'pending', 'scenes', 'tracked']);
  });
});
