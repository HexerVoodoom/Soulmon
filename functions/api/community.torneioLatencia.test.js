/**
 * Torneio lento (22/11/2026): `opponents` lia até 300 perfis EM SÉRIE (um round-trip de KV por perfil) e `rank&id=` até 50.
 * O KV falso abaixo simula latência por operação e mede a CONCORRÊNCIA: a leitura tem de sair em lotes paralelos.
 * A resposta não muda (mesmos campos); só a ordem em que o KV é consultado.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

const season = new Date().toISOString().slice(0, 7);
const ME = 'a'.repeat(32);
const N = 120;
const idOf = (i) => `${(i + 1).toString(16).padStart(8, '0')}${'c'.repeat(24)}`;
const pidOf = (i) => `${(i + 1).toString(16).padStart(6, '0')}${'d'.repeat(18)}`;

function fakeKV(seed, latencia = 0) {
  const store = new Map(Object.entries(seed)); const meta = new Map();
  const m = { emVoo: 0, pico: 0, ops: 0, perfisEmVoo: 0, picoPerfis: 0 };
  const op = async (fn, k = '') => {
    const perfil = String(k).startsWith('profile:');
    m.ops++; m.emVoo++; m.pico = Math.max(m.pico, m.emVoo);
    if (perfil) { m.perfisEmVoo++; m.picoPerfis = Math.max(m.picoPerfis, m.perfisEmVoo); }
    if (latencia) await new Promise(r => setTimeout(r, latencia));
    m.emVoo--; if (perfil) m.perfisEmVoo--; return fn();
  };
  return {
    store, m,
    get: k => op(() => store.get(k) ?? null, k),
    getWithMetadata: k => op(() => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null })),
    put: (k, v, o) => op(() => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); }),
    delete: k => op(() => { store.delete(k); meta.delete(k); }),
    list: ({ prefix }) => op(() => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: meta.get(name) })), list_complete: true })),
  };
}
const mkEnv = (latencia) => {
  const seed = {
    [`profile:${ME}`]: JSON.stringify({ id: ME, name: 'me', stage: 'rookie', pvpEnabled: true, pid: 'z'.repeat(24), lifetimePoints: 500 }),
    [`rank:${season}:${ME}`]: JSON.stringify({ points: 600, wins: 0, losses: 0, day: '2000-01-01', matchesToday: 0 }),
  };
  for (let i = 0; i < N; i++) {
    const id = idOf(i);
    seed[`profile:${id}`] = JSON.stringify({ id, name: `n${i}`, petName: 'B', stage: 'rookie', pvpEnabled: true, pid: pidOf(i), lifetimePoints: 500 });
    seed[`pid:${pidOf(i)}`] = id;
    seed[`rank:${season}:${id}`] = JSON.stringify({ points: i * 10, wins: 0, losses: 0, day: '2000-01-01', matchesToday: 0 });
  }
  return { DIGIAPP_SAVES: fakeKV(seed, latencia) };
};
const chamar = async (env, q) => {
  const t = performance.now();
  const r = await onRequest({ request: new Request(`https://x.dev/api/community?${q}`), env });
  const ms = performance.now() - t;
  expect(r.status).toBe(200);
  return { body: await r.json(), ms };
};

describe('Torneio: leituras do KV em paralelo', () => {
  it('opponents: pico de leituras simultâneas > 1 e a resposta mantém 3 oponentes', async () => {
    const env = mkEnv(3);
    const { body, ms } = await chamar(env, `action=opponents&id=${ME}`);
    console.log(`[bench] opponents N=${N} lat=3ms: ${ms.toFixed(0)} ms, ops=${env.DIGIAPP_SAVES.m.ops}, pico=${env.DIGIAPP_SAVES.m.pico}`);
    expect(body.opponents).toHaveLength(3);
    // Determinístico (sem relógio): as leituras de PERFIL saem em lotes; em série o pico seria 1. (Medido: ~530 ms em série, ~100 ms em lotes.)
    expect(env.DIGIAPP_SAVES.m.picoPerfis).toBeGreaterThan(1);
  });
  it('rank com id: pico de leituras simultâneas > 1', async () => {
    const env = mkEnv(3);
    const frio = await chamar(env, `action=rank&id=${ME}`); // preenche o índice da season (uma vez)
    const { body, ms } = await chamar(env, `action=rank&id=${ME}`);
    console.log(`[bench] rank&id N=${N} lat=3ms: frio ${frio.ms.toFixed(0)} ms, morno ${ms.toFixed(0)} ms, pico=${env.DIGIAPP_SAVES.m.pico}`);
    expect(body.rank.length).toBeGreaterThan(0);
    // Em série o pico de perfis lidos juntos era 1 (medido: ~820 ms morno / ~1300 ms frio; em lotes ~40 / ~65 ms).
    expect(env.DIGIAPP_SAVES.m.picoPerfis).toBeGreaterThan(1);
  });
});
