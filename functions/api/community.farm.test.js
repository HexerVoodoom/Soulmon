/**
 * PR13 / ALTO-2 da auditoria: fazenda de pontos/Honra com conta própria. Decisão do dono (06/10/2026):
 *  - oponente muito abaixo do seu level rende ~0;
 *  - vencer o MESMO oponente várias vezes no dia rende cada vez menos (por par, por dia).
 * Não pune derrota: o que se PERDE (-8 / -4) não muda.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { simulateDuel, DUEL_DAY_MS } from './_duel.js';
import {
  HONRA_PONTOS_VITORIA, HONRA_PONTOS_DEFESA, HONRA_FATOR_POR_REPETICAO, ganhoDePontos, fatorPorLevel, fatorPorRepeticao, motivoDoCorte, HONRA_PISO_POR_LEVEL,
  HONRA_LEVEL_CARENCIA, HONRA_LEVEL_QUEDA,
} from './_honra.js';

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const PIDB = 'p'.repeat(24);
const PIDA = 'q'.repeat(24);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed)); const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, pid) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid });
const mkEnv = ({ a = {}, b = {}, fa = 90, fb = 90 } = {}) => {
  const kv = fakeKV({
    [`profile:${A}`]: perfil(A, PIDA), [`pid:${PIDA}`]: A,
    [`profile:${B}`]: perfil(B, PIDB), [`pid:${PIDB}`]: B,
    [A]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000, ...a }),
    [B]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000, ...b }),
  });
  kv.meta.set(A, { t: Date.now(), f: Date.now() - fa * DUEL_DAY_MS });
  kv.meta.set(B, { t: Date.now(), f: Date.now() - fb * DUEL_DAY_MS });
  return { DIGIAPP_SAVES: kv };
};
const call = async (env, as, action, body) => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${as}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: as, ...body }),
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};
const rankDe = (env, id) => { const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(id)); return k ? JSON.parse(env.DIGIAPP_SAVES.store.get(k)) : null; };
const perfilDe = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${id}`));

/** Uma partida completa de `as` contra `pidOponente`, com a semente forçada para o resultado `alvo` ('me' = quem desafia vence). */
async function jogar(env, as, pidOponente, alvo) {
  const d = await call(env, as, 'duelStart', { opponentId: pidOponente });
  if (d.status !== 200) return d;
  const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(as));
  const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k));
  for (let seed = 1; seed < 800; seed++) {
    if (simulateDuel({ me: rec.pending.sides.me, opp: rec.pending.sides.opp, seed, taps: [] }).winner === alvo) { rec.pending.seed = seed; break; }
  }
  env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec));
  return call(env, as, 'match', { opponentId: pidOponente, taps: [] });
}

const SOMA_DIA = HONRA_FATOR_POR_REPETICAO.reduce((t, f) => t + HONRA_PONTOS_VITORIA * f, 0); // 20 + 10 + 5 + 0

describe('ALTO-2: as regras puras (nomeadas) do rendimento', () => {
  it('level: carência total, queda linear e zero abaixo do fim da queda; level ausente não pune', () => {
    expect(fatorPorLevel(10, 10)).toBe(1);
    expect(fatorPorLevel(10 + HONRA_LEVEL_CARENCIA, 10)).toBe(1);
    expect(fatorPorLevel(10 + HONRA_LEVEL_CARENCIA + HONRA_LEVEL_QUEDA / 2, 10)).toBeCloseTo(0.5);
    expect(fatorPorLevel(10 + HONRA_LEVEL_CARENCIA + HONRA_LEVEL_QUEDA, 10)).toBe(0);
    expect(fatorPorLevel(40, 1)).toBe(0);
    expect(fatorPorLevel(1, 40)).toBe(1); // vencer quem é MAIOR nunca é reduzido
    expect(fatorPorLevel(undefined, 3)).toBe(1);
    expect(fatorPorLevel(NaN, NaN)).toBe(1);
  });
  it('repetição: cada vitória do dia contra o mesmo oponente rende menos; depois da lista vale o último fator', () => {
    expect([0, 1, 2, 3, 4, 99].map(fatorPorRepeticao)).toEqual([1, 0.5, 0.25, 0, 0, 0]);
    expect(fatorPorRepeticao(-3)).toBe(1);
    expect(fatorPorRepeticao(1.5)).toBe(1);
  });
  it('ganhoDePontos junta os dois fatores e arredonda', () => {
    expect(ganhoDePontos(HONRA_PONTOS_VITORIA, 5, 5, 0)).toEqual({ gain: 20, factor: 1 });
    expect(ganhoDePontos(HONRA_PONTOS_VITORIA, 5, 5, 1).gain).toBe(10);
    expect(ganhoDePontos(HONRA_PONTOS_VITORIA, 40, 1, 0).gain).toBe(HONRA_PISO_POR_LEVEL); // piso, não 0
    expect(ganhoDePontos(HONRA_PONTOS_VITORIA, 40, 1, 3).gain).toBe(0); // repetição ainda zera
    expect(ganhoDePontos(HONRA_PONTOS_DEFESA, 5, 5, 0).gain).toBe(10);
  });
});

describe('ALTO-2: fazenda com conta própria', () => {
  it('A vence a conta B (level 1) 5x no dia: soma dos pontos ≤ o teto por par, bem abaixo dos +100 de antes', async () => {
    const env = mkEnv();
    for (let i = 0; i < 5; i++) {
      const r = await jogar(env, A, PIDB, 'me');
      expect(r.status, JSON.stringify(r.json)).toBe(200);
      expect(r.json.outcome).toBe('win');
    }
    expect(rankDe(env, A).points).toBe(SOMA_DIA); // 35
    expect(rankDe(env, A).points).toBeLessThan(100);
    expect(perfilDe(env, A).lifetimePoints).toBe(SOMA_DIA); // o contador da faixa também
    expect(rankDe(env, A).wins).toBe(5);
  });

  it('a resposta diz o ganho e o fator (o app o aplica à Honra): 1ª vitória 100%, 2ª 50%, 4ª 0%', async () => {
    const env = mkEnv();
    const r = [];
    for (let i = 0; i < 4; i++) r.push((await jogar(env, A, PIDB, 'me')).json);
    expect(r.map(x => x.gain)).toEqual([20, 10, 5, 0]);
    expect(r.map(x => x.honorFactor)).toEqual([1, 0.5, 0.25, 0]);
  });

  it('o contador por par zera no dia seguinte', async () => {
    const env = mkEnv();
    for (let i = 0; i < 3; i++) await jogar(env, A, PIDB, 'me');
    const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(A));
    const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k)); rec.day = '2000-01-01'; env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec));
    const r = await jogar(env, A, PIDB, 'me');
    expect(r.json.gain).toBe(20);
  });

  it('level: A (mega) vence B (level 1) e leva o PISO de pontos (não 0); B não perde mais que o de sempre (-4)', async () => {
    const env = mkEnv({ a: { evolutionStage: 'mega-power', perfectDays: 9 }, b: { perfectDays: 0 }, fa: 400, fb: 0 });
    const r = await jogar(env, A, PIDB, 'me');
    expect(r.json.outcome).toBe('win');
    expect(r.json.gain).toBe(HONRA_PISO_POR_LEVEL);
    expect(r.json.honorFactor).toBe(0); // a Honra segue cortada; só os pontos têm piso
    expect(r.json.gainReason).toBe('level');
    expect(rankDe(env, A).points).toBe(HONRA_PISO_POR_LEVEL);
    expect(perfilDe(env, A).lifetimePoints ?? 0).toBe(HONRA_PISO_POR_LEVEL);
    expect(rankDe(env, B).losses).toBe(1);
  });

  it('o desafiante que PERDE de propósito para a conta B também não farma: a defesa repetida rende menos', async () => {
    const env = mkEnv();
    for (let i = 0; i < 5; i++) await jogar(env, A, PIDB, 'opp'); // A perde de propósito 5x
    expect(rankDe(env, B).points).toBe(Math.round(HONRA_PONTOS_DEFESA * 1) + 5 + 3 + 0 + 0); // 10 + 5 + 3 (2,5 arredondado) + 0 + 0 (piso só vale com repetição > 0)
    expect(rankDe(env, B).points).toBeLessThan(50);
  });

  it('derrota NÃO é punida a mais: perder segue custando -8 (mínimo 0) e vale também depois de várias vitórias', async () => {
    const env = mkEnv();
    for (let i = 0; i < 4; i++) await jogar(env, A, PIDB, 'me'); // 35
    const r = await jogar(env, A, PIDB, 'opp');
    expect(r.json.outcome).toBe('loss');
    expect(rankDe(env, A).points).toBe(SOMA_DIA - 8);
  });
});

/* Por que a faixa "não anda" (investigação 11/11/2026): lifetime só soma em VITÓRIA e o ganho cai a 0 com oponente 9+ níveis
   abaixo ou a partir da 4ª vitória no mesmo oponente no dia. Estes testes só documentam a regra vigente; não a mudam. */
describe('motivoDoCorte e a velocidade da faixa', () => {
  it('diz por que cortou, sem mudar o ganho', () => {
    expect(motivoDoCorte(5, 5, 0)).toBeNull();
    expect(motivoDoCorte(20, 5, 0)).toBe('level');
    expect(motivoDoCorte(5, 5, 1)).toBe('repeat');
    expect(motivoDoCorte(20, 5, 3)).toBe('level');
    expect(motivoDoCorte(undefined, 5, 0)).toBeNull();
  });

  it('oponente 9+ níveis abaixo nunca soma; o par repetido soma 20+10+5 e para', () => {
    expect(ganhoDePontos(HONRA_PONTOS_VITORIA, 15, 6, 0).gain).toBe(3);
    const dia = [0, 1, 2, 3, 4].map(n => ganhoDePontos(HONRA_PONTOS_VITORIA, 5, 5, n).gain);
    expect(dia).toEqual([20, 10, 5, 0, 0]);
  });

  it('simulação: partidas até cruzar a faixa (5 partidas/dia, 20 por vitória cheia)', () => {
    const partidasAte = (alvo, lvMe, lvOpp, oponentesDistintos) => {
      let pts = 0, n = 0;
      for (let dia = 0; dia < 400 && pts < alvo; dia++) {
        const vistas = {};
        for (let j = 0; j < 5 && pts < alvo; j++) {
          const o = j % oponentesDistintos; const w = vistas[o] ?? 0;
          pts += ganhoDePontos(HONRA_PONTOS_VITORIA, lvMe, lvOpp, w).gain; vistas[o] = w + 1; n++;
        }
      }
      return pts >= alvo ? n : Infinity;
    };
    expect(partidasAte(100, 5, 5, 5)).toBe(5);           // 5 oponentes de nível igual: Bronze em 1 dia
    expect(partidasAte(1000, 10, 10, 5)).toBe(50);       // 1000 pts a 20/vitória = 50 vitórias = 10 dias
    expect(partidasAte(100, 10, 10, 1)).toBe(12);        // sempre o mesmo oponente: 35/dia, 3 dias
    expect(partidasAte(100, 20, 10, 5)).toBe(34);        // oponentes 10 níveis abaixo: piso 3 (5/dia de 3,3,3,... com 5 distintos) = 34 vitórias
    expect(partidasAte(1000, 20, 10, 5)).toBe(334);      // 1000 pts só contra quem está muito abaixo: 334 vitórias (~67 dias, bem mais lento que 50)
  });
});
