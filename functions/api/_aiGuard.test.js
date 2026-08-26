import { describe, it, expect, beforeEach } from 'vitest';
import { guardAiRequest, AI_LIMITS } from './_aiGuard.js';

// Este portão é o que separa "a IA custa o que os usuários pagam" de "a IA
// custa o que a internet inteira quiser gastar". Se algum destes testes cair,
// a fatura fica sem teto.

function fakeEnv() {
  const store = new Map();
  return {
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
    },
    _store: store,
  };
}

const req = () => new Request('https://x/api/chat', { method: 'POST' });
const SAVE = 'abcdefgh1234';

describe('portão das rotas de IA', () => {
  let env;
  beforeEach(() => { env = fakeEnv(); });

  it('recusa chamada sem saveId — era assim que um curl gastava a nossa cota', async () => {
    const r = await guardAiRequest(req(), env, 'chat', undefined);
    expect(r).toMatchObject({ ok: false, status: 400, reason: 'missing-save-id' });
  });

  it('recusa saveId com formato inválido', async () => {
    const r = await guardAiRequest(req(), env, 'chat', '../../etc/passwd');
    expect(r.ok).toBe(false);
  });

  it('libera dentro da cota, e entrega o release do par reserva/confirmação (X-1)', async () => {
    const gate = await guardAiRequest(req(), env, 'chat', SAVE);
    expect(gate.ok).toBe(true);
    expect(typeof gate.release, 'quem reserva precisa poder devolver').toBe('function');
  });

  it('bloqueia ao estourar a cota da conta', async () => {
    const limite = AI_LIMITS.sprite.perAccount;
    for (let i = 0; i < limite; i++) {
      expect((await guardAiRequest(req(), env, 'sprite', SAVE)).ok).toBe(true);
    }
    expect(await guardAiRequest(req(), env, 'sprite', SAVE))
      .toMatchObject({ ok: false, status: 429, reason: 'ai-daily-limit' });
  });

  it('a cota de uma conta não consome a de outra', async () => {
    for (let i = 0; i < AI_LIMITS.sprite.perAccount; i++) {
      await guardAiRequest(req(), env, 'sprite', SAVE);
    }
    expect((await guardAiRequest(req(), env, 'sprite', 'outraconta99')).ok).toBe(true);
  });

  it('o teto GLOBAL segura mesmo com saveId trocando a cada chamada', async () => {
    // É o cenário real enquanto o login não estiver ligado: o saveId é só um
    // hash de e-mail, então o atacante inventa um novo toda vez. A cota por
    // conta não pega isso; o teto global é o disjuntor da fatura.
    const global = AI_LIMITS.sprite.globalMonth;
    for (let i = 0; i < global; i++) {
      expect((await guardAiRequest(req(), env, 'sprite', `conta${i}xxxxxxx`)).ok).toBe(true);
    }
    expect(await guardAiRequest(req(), env, 'sprite', 'maisumaconta1'))
      .toMatchObject({ ok: false, status: 503, reason: 'ai-monthly-budget-reached' });
  });

  it('buckets não dividem contador entre si', async () => {
    for (let i = 0; i < AI_LIMITS.sprite.perAccount; i++) {
      await guardAiRequest(req(), env, 'sprite', SAVE);
    }
    expect((await guardAiRequest(req(), env, 'chat', SAVE)).ok).toBe(true);
  });

  it('os contadores expiram sozinhos (não viram lixo permanente no KV)', async () => {
    const env2 = fakeEnv();
    const ttls = [];
    env2.DIGIAPP_SAVES.put = async (_k, _v, opts) => { ttls.push(opts?.expirationTtl); };
    await guardAiRequest(req(), env2, 'chat', SAVE);
    expect(ttls.every(t => typeof t === 'number' && t > 0)).toBe(true);
  });

  it('geração de imagem tem teto bem menor que o chat — é a cara', () => {
    // O de imagem é MENSAL e o do chat é DIÁRIO: comparar os dois números crus
    // já favorece o chat, e ainda assim o de imagem tem que ser menor.
    expect(AI_LIMITS.sprite.globalMonth).toBeLessThan(AI_LIMITS.chat.global);
  });
});
