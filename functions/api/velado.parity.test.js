/**
 * PARIDADE da forma BB entre o app (`src/utils/bbStage.ts`) e o servidor (`_velado.js`), mais a recusa
 * motivada nas duas rotas que validam o estágio (Duelo PvP, Guilda). Interruptor `ONBOARDING_VELADO`.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_velado.js';
import { BB_STAGE, bbRefusal, bbRefusalText } from '../../src/utils/bbStage';
import { loadDuelSideWithSprite } from './_duelLoad.js';

const LIGADO = { ONBOARDING_VELADO: '1' };
const memKv = (obj) => ({ getWithMetadata: async (k) => ({ value: obj[k] ?? null, metadata: { f: Date.now() } }) });

describe('a forma BB é a MESMA nos dois lados', () => {
  it('mesmo id de estágio', () => { expect(srv.BB_STAGE).toBe(BB_STAGE); });
  it('com o interruptor ligado, a decisão bate em todo estágio e em lixo', () => {
    for (const st of ['bb', 'rookie', 'champion-power', 'ultra', 'BB', '', null, undefined, 42]) {
      expect(srv.bbRefusal(LIGADO, st), String(st)).toBe(bbRefusal({ evolutionStage: st }));
    }
  });
  it('DESLIGADO por padrão: o servidor nunca recusa', () => {
    for (const env of [undefined, {}, { ONBOARDING_VELADO: '' }, { ONBOARDING_VELADO: '0' }, { ONBOARDING_VELADO: 'false' }]) {
      expect(srv.bbRefusal(env, 'bb')).toBeNull();
      expect(srv.isOnboardingVelado(env)).toBe(false);
    }
  });
  it('a copy EN+PT do servidor é a do app', () => {
    expect(srv.BB_LOCKED_MESSAGE.pt).toBe(bbRefusalText(true));
    expect(srv.BB_LOCKED_MESSAGE.en).toBe(bbRefusalText(false));
  });
});

describe('Duelo/Guilda: o save em BB não luta e não entra, com motivo (só com o interruptor ligado)', () => {
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
  it('DESLIGADO + bb => idêntico ao de hoje (sem recusa)', async () => {
    const r = await loadDuelSideWithSprite(env('bb', false), 'aaaaaaaa');
    expect(r.bbLocked).toBeUndefined();
  });
});
