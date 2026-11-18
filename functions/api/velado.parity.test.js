/**
 * PARIDADE da forma BB entre o app (`src/utils/bbStage.ts`) e o servidor (`_velado.js`), mais a recusa
 * motivada nas duas rotas que validam o estágio (Duelo PvP, Guilda). Interruptor `ONBOARDING_VELADO`.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_velado.js';
import { BB_STAGE, bbRefusal, bbRefusalText } from '../../src/utils/bbStage';
import { recusaGeracaoBB } from '../../src/utils/inicioBB';
import { loadDuelSideWithSprite } from './_duelLoad.js';

const LIGADO = { ONBOARDING_VELADO: '1' };
const memKv = (obj) => ({ getWithMetadata: async (k) => ({ value: obj[k] ?? null, metadata: { f: Date.now() } }) });

describe('a forma BB é a MESMA nos dois lados', () => {
  it('mesmo id de estágio', () => { expect(srv.BB_STAGE).toBe(BB_STAGE); });
  it('com ou sem o interruptor, a decisão bate em todo estágio e em lixo (Início BB, 17/11/2026)', () => {
    for (const env of [LIGADO, undefined, {}, { ONBOARDING_VELADO: '0' }]) {
      for (const st of ['bb', 'rookie', 'champion-power', 'ultra', 'BB', '', null, undefined, 42]) {
        expect(srv.bbRefusal(env, st), String(st)).toBe(bbRefusal({ evolutionStage: st }));
      }
    }
  });
  it('o interruptor segue DESLIGADO por padrão; quem não é BB nunca é recusado', () => {
    for (const env of [undefined, {}, { ONBOARDING_VELADO: '' }, { ONBOARDING_VELADO: '0' }, { ONBOARDING_VELADO: 'false' }]) {
      expect(srv.isOnboardingVelado(env)).toBe(false);
      for (const st of ['rookie', 'champion-power', 'ultra', undefined]) expect(srv.bbRefusal(env, st)).toBeNull();
    }
  });
  it('a copy EN+PT do servidor é a do app', () => {
    expect(srv.BB_LOCKED_MESSAGE.pt).toBe(bbRefusalText(true));
    expect(srv.BB_LOCKED_MESSAGE.en).toBe(bbRefusalText(false));
  });
});

describe('Duelo/Guilda: o save em BB não luta e não entra, com motivo (com ou sem o interruptor)', () => {
  const env = (stage, flag) => ({ ...(flag ? LIGADO : {}), SOULMON_SAVES: memKv({ aaaaaaaa: JSON.stringify({ evolutionStage: stage, perfectDays: 2, totalXP: 10 }) }) });
  it('ligado + bb => bbLocked e sem ficha', async () => {
    const r = await loadDuelSideWithSprite(env('bb', true), 'aaaaaaaa');
    expect(r.bbLocked).toBe(true);
    expect(r.side).toBeNull();
  });
  it('ligado + rookie => luta como sempre', async () => {
    const r = await loadDuelSideWithSprite(env('rookie', true), 'aaaaaaaa');
    expect(r.bbLocked).toBeUndefined();
    expect(r.side).not.toBeNull();
  });
  it('DESLIGADO + bb => também recusa (Início BB: todo save novo nasce BB)', async () => {
    const r = await loadDuelSideWithSprite(env('bb', false), 'aaaaaaaa');
    expect(r.bbLocked).toBe(true);
  });
  it('DESLIGADO + rookie => idêntico ao de hoje', async () => {
    const r = await loadDuelSideWithSprite(env('rookie', false), 'aaaaaaaa');
    expect(r.bbLocked).toBeUndefined();
    expect(r.side).not.toBeNull();
  });
});

describe('BB personalizado só no nascimento: a MESMA decisão nos dois lados (REGISTRO §472)', () => {
  const casos = [
    null, undefined, 'lixo', [], {},
    { evolutionStage: 'bb', unlockedEvolutions: ['bb'], soulmonStages: [{}] },
    { evolutionStage: 'bb', unlockedEvolutions: ['bb'], spriteLibrary: { sprites: { bb: { url: 'u' } } } },
    { evolutionStage: 'bb', unlockedEvolutions: ['bb'], spriteLibrary: { sprites: { bb: { url: '' } } } },
    { evolutionStage: 'rookie', unlockedEvolutions: ['bb', 'rookie'] },
    { evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], soulmonStages: [{}] },
    { evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], demoCharacterId: 'meteoro' },
    { evolutionStage: 'rookie', unlockedEvolutions: ['rookie'] },
  ];
  it('cliente e servidor batem em todo caso, com e sem pedido de desenho novo', () => {
    for (const c of casos) for (const regenerar of [false, true]) {
      expect(srv.recusaGeracaoBB(c, { regenerar }), JSON.stringify(c)).toBe(recusaGeracaoBB(c, { regenerar }));
    }
  });
  it('nascimento (sem save, ou em bb sem arte) passa; arte de BB, já evoluído, save antigo ou reroll recusam', () => {
    expect(srv.recusaGeracaoBB(null)).toBeNull();
    expect(srv.recusaGeracaoBB(casos[5])).toBeNull();
    expect(srv.recusaGeracaoBB({}, { regenerar: true })).toBe('bb-birth-only');
    for (const i of [6, 8, 9, 10]) expect(srv.recusaGeracaoBB(casos[i]), String(i)).toBe('bb-birth-only');
  });
});
