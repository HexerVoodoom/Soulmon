import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FRAMES, FRAME_ID_RE, FRAMES_MAX_OWNED, frameById, sanitizeOwnedFrames, sanitizeEquippedFrame,
  frameAvailable, resolveEquippedFrame, availableFrames, type FrameContext,
} from './frames';
import { TOURNAMENT_LADDER, TOURNAMENT_TIERS } from './tournamentTiers';

const ctx = (over: Partial<FrameContext> = {}): FrameContext => ({ owned: [], lifetimeTierId: 'madeira', seatIds: [], ...over });

describe('molduras — catálogo', () => {
  it('ids únicos e no formato que o servidor aceita', () => {
    const ids = FRAMES.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(FRAME_ID_RE);
  });

  it('há uma moldura de rank para CADA degrau da escada (Madeira…Grão-Mestre) e nenhuma sobrando', () => {
    const rank = FRAMES.filter(f => f.origin === 'rank').map(f => f.tierId);
    expect(rank).toEqual(TOURNAMENT_LADDER.map(t => t.id));
  });

  it('as quatro origens existem, cada uma com o dado que a descreve', () => {
    expect(new Set(FRAMES.map(f => f.origin))).toEqual(new Set(['rank', 'shop', 'achievement', 'event']));
    for (const f of FRAMES) {
      expect(f.namePt && f.nameEn).toBeTruthy();
      if (f.origin === 'shop') expect(f.price).toBeGreaterThan(0);
      if (f.origin === 'achievement' || f.origin === 'event') expect(f.howPt && f.howEn).toBeTruthy();
    }
  });

  it('é COSMÉTICA: nenhum campo da moldura carrega efeito de jogo', () => {
    const permitidos = new Set(['id', 'namePt', 'nameEn', 'origin', 'tierId', 'price', 'howPt', 'howEn', 'look']);
    for (const f of FRAMES) for (const k of Object.keys(f)) expect(permitidos.has(k), `${f.id}.${k}`).toBe(true);
  });
});

describe('molduras — disponibilidade', () => {
  it('as de rank seguem a faixa de pontos (só sobem) e o lugar ocupado', () => {
    const livres = (c: FrameContext) => availableFrames(c).filter(f => f.origin === 'rank').map(f => f.tierId);
    expect(livres(ctx())).toEqual(['madeira']);
    expect(livres(ctx({ lifetimeTierId: 'ouro' }))).toEqual(['madeira', 'bronze', 'prata', 'ouro']);
    // a ordem interna de `frames.ts` espelha TOURNAMENT_TIERS
    expect(livres(ctx({ lifetimeTierId: TOURNAMENT_TIERS[TOURNAMENT_TIERS.length - 1].id })).length).toBe(TOURNAMENT_TIERS.length);
    expect(livres(ctx({ lifetimeTierId: 'diamante', seatIds: ['mestre'] })).includes('mestre')).toBe(true);
    expect(livres(ctx({ lifetimeTierId: 'diamante' })).includes('mestre')).toBe(false);
  });

  it('loja/conquista/evento só com posse', () => {
    const f = frameById('loja-folhagem')!;
    expect(frameAvailable(f, ctx())).toBe(false);
    expect(frameAvailable(f, ctx({ owned: ['loja-folhagem'] }))).toBe(true);
  });

  it('equipada que deixou de valer (lugar perdido, id velho, lixo) vira SEM moldura — nunca lança', () => {
    expect(resolveEquippedFrame('rank-mestre', ctx({ lifetimeTierId: 'diamante' }))).toBeNull();
    expect(resolveEquippedFrame('nao-existe', ctx())).toBeNull();
    expect(resolveEquippedFrame(42, ctx())).toBeNull();
    expect(resolveEquippedFrame(null, ctx())).toBeNull();
    expect(resolveEquippedFrame('rank-madeira', ctx())?.id).toBe('rank-madeira');
  });
});

describe('molduras — sanitização do save', () => {
  it('posse: descarta lixo, repetição e estoura o teto sem lançar', () => {
    expect(sanitizeOwnedFrames('x')).toEqual([]);
    expect(sanitizeOwnedFrames(['a', 'a', 'B!', 7, null, 'loja-brasa'])).toEqual(['a', 'loja-brasa']);
    const muitos = Array.from({ length: FRAMES_MAX_OWNED + 50 }, (_, i) => `f-${i}`);
    expect(sanitizeOwnedFrames(muitos).length).toBe(FRAMES_MAX_OWNED);
  });

  it('equipada: string no formato ou null', () => {
    expect(sanitizeEquippedFrame('rank-ouro')).toBe('rank-ouro');
    expect(sanitizeEquippedFrame('<script>')).toBeNull();
    expect(sanitizeEquippedFrame({})).toBeNull();
  });

  it('paridade com o servidor: save.js usa o MESMO formato e teto', () => {
    const src = readFileSync('functions/api/save.js', 'utf8');
    expect(src).toContain(`const FRAME_ID_RE = ${String(FRAME_ID_RE)};`);
    expect(src).toContain(`FRAMES_MAX_OWNED = ${FRAMES_MAX_OWNED}`);
  });
});
