// @vitest-environment jsdom
/**
 * INÍCIO BB (dono, 17/11/2026; REGISTRO §472) — as regras puras do começo novo (`utils/inicioBB.ts`).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  aguardandoChocar, elementoDoInicial, evolucaoPaga, gravarBBNascimento, inicialDoBB, inicialNaoEvolui,
  lerBBNascimento, limparBBNascimento, nasceuBB, prontoParaChocar, sanitizeBBNascimento,
} from './inicioBB';
import { getNextEvolution } from './dailyReset';
import { getSpriteForStage, setOwnSprites, STARTER_IDS, STARTER_SPRITES } from './sprites';
import { STORAGE_KEYS } from './storageKeys';
import { installFakeStorage } from '../test/renderEnv';

describe('quem nasceu BB', () => {
  it('o save nasce BB ou já passou pelo BB; saves de antes nunca', () => {
    expect(nasceuBB({ evolutionStage: 'bb', unlockedEvolutions: ['bb'] })).toBe(true);
    expect(nasceuBB({ evolutionStage: 'rookie', unlockedEvolutions: ['bb', 'rookie'] })).toBe(true);
    expect(nasceuBB({ evolutionStage: 'rookie', unlockedEvolutions: ['rookie'] })).toBe(false);
    expect(nasceuBB({ evolutionStage: 'champion-power', unlockedEvolutions: undefined })).toBe(false);
  });
});

describe('D8 no Início BB: BB → rookie grátis; rookie → champion pede assinatura', () => {
  const free = (stage: string, unlocked: string[]) => ({ accountTier: 'demo' as const, evolutionStage: stage, unlockedEvolutions: unlocked });
  it('o grátis que nasceu BB evolui ao rookie sem pagar e trava no rookie', () => {
    expect(evolucaoPaga(false, free('bb', ['bb']))).toBe(false);
    expect(evolucaoPaga(false, free('rookie', ['bb', 'rookie']))).toBe(true);
  });
  it('pago nunca trava', () => {
    expect(evolucaoPaga(false, { accountTier: 'paid', evolutionStage: 'rookie', unlockedEvolutions: ['bb', 'rookie'] })).toBe(false);
  });
  it('save de antes (não nasceu BB) fica como sempre, sem o interruptor', () => {
    expect(evolucaoPaga(false, free('rookie', ['rookie']))).toBe(false);
    expect(evolucaoPaga(true, free('rookie', ['rookie']))).toBe(true); // com o interruptor do Velado, a regra antiga
  });
  it('o inicial só evolui enquanto é o BB; o BB vai ao rookie', () => {
    expect(inicialNaoEvolui('meteoro', 'bb')).toBe(false);
    expect(inicialNaoEvolui('meteoro', 'rookie')).toBe(true);
    expect(inicialNaoEvolui(undefined, 'rookie')).toBe(false);
    expect(getNextEvolution('bb', 'power', ['bb'])).toBe('rookie');
  });
});

describe('o inicial do BB grátis', () => {
  it('determinístico pela semente e sempre um dos 5', () => {
    expect(inicialDoBB('a@b.c')).toBe(inicialDoBB('a@b.c'));
    const vistos = new Set(Array.from({ length: 200 }, (_, i) => inicialDoBB(`p${i}@x.y`)));
    for (const v of vistos) expect(STARTER_IDS).toContain(v);
    expect(vistos.size).toBe(STARTER_IDS.length);
    expect(elementoDoInicial('meteoro')).toBe('fogo');
  });
  it('no rookie o inicial aparece com a arte DELE, nunca com a do BB (D20)', () => {
    setOwnSprites({ bb: 'blob:bb' });
    try {
      expect(getSpriteForStage('bb', 'meteoro')).toBe('blob:bb');
      expect(getSpriteForStage('rookie', 'meteoro')).toBe(STARTER_SPRITES.meteoro);
      // criatura própria: o rookie sem arte cai no cristal, não no BB
      setOwnSprites({ bb: 'blob:bb' }, 'cristal');
      expect(getSpriteForStage('rookie')).toBe('cristal');
    } finally { setOwnSprites({}); }
  });
});

describe('o marcador "ainda vai chocar" (por aparelho, sem campo no save)', () => {
  beforeEach(() => installFakeStorage());
  it('leitura tolerante e idempotente', () => {
    expect(sanitizeBBNascimento(null)).toBeNull();
    expect(sanitizeBBNascimento('x')).toBeNull();
    expect(sanitizeBBNascimento({ pago: 'sim' })).toEqual({ pago: false });
    const m = sanitizeBBNascimento({ pago: true, prompts: { imagePrompt: 'p' } });
    expect(m).toEqual({ pago: true, prompts: { imagePrompt: 'p', imagePromptFallback: 'p' } });
    expect(sanitizeBBNascimento(m)).toEqual(m);
  });
  it('grava, lê e some depois de chocar', () => {
    gravarBBNascimento({ pago: false });
    expect(localStorage.getItem(STORAGE_KEYS.BB_NASCIMENTO)).toBeTruthy();
    expect(lerBBNascimento()).toEqual({ pago: false });
    limparBBNascimento();
    expect(lerBBNascimento()).toBeNull();
  });
  it('o chocar abre só com o BB no cristal E a arte pronta', () => {
    const m = { pago: false };
    expect(aguardandoChocar(m, 'bb')).toBe(true);
    expect(prontoParaChocar(m, 'bb', undefined)).toBe(false);
    expect(prontoParaChocar(m, 'bb', 'blob:bb')).toBe(true);
    expect(prontoParaChocar(m, 'rookie', 'blob:bb')).toBe(false);
    expect(prontoParaChocar(null, 'bb', 'blob:bb')).toBe(false);
  });
});
