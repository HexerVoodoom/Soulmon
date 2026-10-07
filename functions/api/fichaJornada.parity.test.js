/**
 * PARIDADE da ficha da jornada entre o app (`fichaJornada.ts`, `comportamento.ts`) e o servidor (`_fichaJornada.js`) +
 * o que o `save.js` faz com ela (Combate v3 / PR15c): forma saneada, plano recalculado, imutabilidade por estagio, e a
 * familia gravada que o duelo le. Nunca confiar no cliente; nunca recusar o save por causa disso.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_fichaJornada.js';
import { onRequest } from './save.js';
import { duelSide, SPECIAL_FAMILY_IDS } from './_duel.js';
import { sanitizeFichaJornada, ESTAGIOS_COM_JANELA } from '../../src/utils/fichaJornada';
import { PESO_COMPORTAMENTO, MIN_AMOSTRA, GALHO_PARA_ELEMENTO, planoDoComportamento } from '../../src/utils/soulProfile/ficha/comportamento';
import { SPECIAL_FAMILIES } from '../../src/utils/combate/specials';
import { CLASS_ELEMENT_ORDER } from '../../src/utils/soulProfile/types';

let s = 777;
const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;

describe('constantes: mudou de um lado, mude os dois', () => {
  it('peso, amostra minima, estagios, familias e a tabela galho->elemento sao os mesmos', () => {
    expect(srv.PESO_COMPORTAMENTO).toBe(PESO_COMPORTAMENTO);
    expect(srv.MIN_AMOSTRA).toBe(MIN_AMOSTRA);
    expect(srv.ESTAGIOS_COM_JANELA).toEqual(ESTAGIOS_COM_JANELA);
    expect(srv.FAMILIAS_VALIDAS).toEqual([...SPECIAL_FAMILIES]);
    expect(srv.FAMILIAS_VALIDAS).toEqual(SPECIAL_FAMILY_IDS);
    expect(srv.GALHO_PARA_ELEMENTO).toEqual(GALHO_PARA_ELEMENTO);
    for (const g of Object.values(srv.GALHO_PARA_ELEMENTO)) for (const id of Object.keys(g)) expect(CLASS_ELEMENT_ORDER).toContain(id);
  });
});

describe('o plano do servidor e o do app (vetores gerados + bordas)', () => {
  const bordas = [
    { power: 0, harmony: 0, benevolence: 0 }, { power: 29, harmony: 0, benevolence: 0 }, { power: 30, harmony: 0, benevolence: 0 },
    { power: 10, harmony: 10, benevolence: 9.99 }, { power: 1e9, harmony: 1, benevolence: 1 }, { power: -5, harmony: 40, benevolence: 0 },
    { power: NaN, harmony: 31, benevolence: 0 }, { power: Infinity, harmony: 0, benevolence: 0 }, { power: '30', harmony: 0, benevolence: 0 },
    null, undefined, {}, [], 7,
  ];
  it('mesma decisao (plano ou nulo) e mesmos pesos', () => {
    const casos = [...bordas, ...Array.from({ length: 3000 }, () => ({ power: Math.floor(rnd() * 80), harmony: Math.floor(rnd() * 80), benevolence: Math.floor(rnd() * 80) }))];
    for (const j of casos) expect(srv.planoDoComportamento(j), JSON.stringify(j)).toEqual(planoDoComportamento(j));
  });
  it('invariante a volume e soma 1', () => {
    const p = srv.planoDoComportamento({ power: 40, harmony: 10, benevolence: 5 });
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    const q = srv.planoDoComportamento({ power: 400, harmony: 100, benevolence: 50 });
    for (const k of Object.keys(p)) expect(q[k]).toBeCloseTo(p[k], 12);
  });
});

describe('sanitize: registro honesto do cliente passa igual; lixo vira ausente', () => {
  it('registros gerados pelo cliente atravessam o servidor sem mudar', () => {
    for (let i = 0; i < 500; i++) {
      const estagios = {};
      for (const st of ESTAGIOS_COM_JANELA) {
        if (rnd() < 0.4) continue;
        const galhos = { power: Math.floor(rnd() * 90), harmony: Math.floor(rnd() * 90), benevolence: Math.floor(rnd() * 90) };
        const plano = planoDoComportamento(galhos);
        estagios[st] = { galhos, at: rnd() < 0.5 ? 'Tue Oct 06 2026' : '2026-10-06', ...(plano ? { plano } : {}), ...(rnd() < 0.5 ? { familia: SPECIAL_FAMILIES[Math.floor(rnd() * 7)] } : {}) };
      }
      const ficha = { v: 1, estagios };
      expect(srv.sanitizeFichaJornada(ficha), JSON.stringify(ficha)).toEqual(sanitizeFichaJornada(ficha));
    }
  });
  it('forma invalida = ausente; estagio desconhecido, galho forjado, familia forjada e plano forjado sao saneados', () => {
    for (const x of [null, undefined, 1, 'a', [], {}, { estagios: [] }, { estagios: { rookie: { galhos: { power: 99 } } } }, { estagios: { champion: 5 } }]) expect(srv.sanitizeFichaJornada(x)).toBeUndefined();
    const out = srv.sanitizeFichaJornada({ v: 9, estagios: {
      rookie: { galhos: { power: 99 } }, __proto__x: {},
      champion: { galhos: { power: 1e30, harmony: -4, benevolence: 'x' }, at: 'amanha', familia: 'hack', plano: { fogo: 1 } },
      mega: { galhos: { power: 50, harmony: 0, benevolence: 0 }, at: '2026-10-06', familia: 'dot', plano: { vida: 1 } },
    } });
    expect(Object.keys(out.estagios)).toEqual(['champion', 'mega']);
    expect(out.estagios.champion).toEqual({ galhos: { power: srv.GALHO_MAX, harmony: 0, benevolence: 0 }, at: '', plano: srv.planoDoComportamento({ power: srv.GALHO_MAX, harmony: 0, benevolence: 0 }) });
    expect(out.estagios.mega.familia).toBe('dot');
    expect(out.estagios.mega.plano).toEqual(srv.planoDoComportamento({ power: 50, harmony: 0, benevolence: 0 })); // o plano enviado e ignorado
  });
  it('at implausivel (ano antigo, ano distante, mes invalido) vira vazio', () => {
    for (const a of ['1999-01-01', '2999-01-01', '2026-13-01', 'Tue Foo 06 2026', 5, null]) expect(srv.cleanAt(a)).toBe('');
    expect(srv.cleanAt('2026-10-06')).toBe('2026-10-06');
  });
});

const ID = 'c'.repeat(32);
function fakeKV() {
  const store = new Map(); const meta = new Map();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async (k) => { store.delete(k); meta.delete(k); },
  };
}
async function post(env, state) {
  const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }), env });
  expect(res.status).toBe(200);
  return JSON.parse(env.DIGIAPP_SAVES.store.get(ID));
}
const REG = (power, familia) => ({ galhos: { power, harmony: 0, benevolence: 0 }, at: 'Tue Oct 06 2026', ...(familia ? { familia } : {}) });

describe('save.js: imutabilidade por estagio, sem rejeitar o save', () => {
  it('sem o campo, nada muda e o resto do save e gravado', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    const out = await post(env, { perfectDays: 3 });
    expect(out.perfectDays).toBe(3);
    expect('fichaJornada' in out).toBe(false);
  });
  it('estagio ja gravado nao e sobrescrito; estagio novo entra; o resto do save segue', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    await post(env, { fichaJornada: { v: 1, estagios: { champion: REG(90) } } });
    const out = await post(env, { perfectDays: 9, fichaJornada: { v: 1, estagios: { champion: { galhos: { power: 0, harmony: 99, benevolence: 0 }, at: '2026-01-01' }, ultimate: REG(40) } } });
    expect(out.perfectDays).toBe(9);
    expect(out.fichaJornada.estagios.champion.galhos).toEqual({ power: 90, harmony: 0, benevolence: 0 });
    expect(out.fichaJornada.estagios.champion.at).toBe('Tue Oct 06 2026');
    expect(out.fichaJornada.estagios.ultimate.galhos.power).toBe(40);
  });
  it('a familia entra UMA vez (espelho do cliente) e depois nao muda', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    await post(env, { fichaJornada: { v: 1, estagios: { champion: REG(90) } } });
    let out = await post(env, { fichaJornada: { v: 1, estagios: { champion: REG(90, 'dot') } } });
    expect(out.fichaJornada.estagios.champion.familia).toBe('dot');
    out = await post(env, { fichaJornada: { v: 1, estagios: { champion: REG(90, 'spdBuff') } } });
    expect(out.fichaJornada.estagios.champion.familia).toBe('dot');
  });
  it('familia forjada fora da lista fechada e descartada; campo todo invalido some sem derrubar o save', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    const out = await post(env, { fichaJornada: { v: 1, estagios: { mega: REG(50, 'godmode') } } });
    expect(out.fichaJornada.estagios.mega.familia).toBeUndefined();
    const env2 = { DIGIAPP_SAVES: fakeKV() };
    const out2 = await post(env2, { perfectDays: 1, fichaJornada: 'lixo' });
    expect(out2.perfectDays).toBe(1);
    expect('fichaJornada' in out2).toBe(false);
  });
  it('save legado gravado sem sanitize (galhos gigantes) e saneado ao ser regravado', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    env.DIGIAPP_SAVES.store.set(ID, JSON.stringify({ fichaJornada: { v: 1, estagios: { champion: { galhos: { power: 5 }, at: 'x' } } } }));
    const out = await post(env, { fichaJornada: { v: 1, estagios: { champion: REG(90) } } });
    expect(out.fichaJornada.estagios.champion.galhos.power).toBe(5);
  });
});

describe('o duelo le a familia GRAVADA, nao o cache editavel', () => {
  const skills = (familia) => ({ rookie: {}, champion: { basica: { escolaId: 'conjuracao' }, especial: { escolaId: 'conjuracao', familia, elementoId: 'fogo' } } });
  const base = (extra) => ({ evolutionStage: 'champion-power', totalXP: 0, soulmonSkills: skills('direct'), ...extra });
  it('familia gravada vence o cache; sem registro ou fora da lista cai no cache como antes', () => {
    const f = (extra) => duelSide(base(extra)).fx.familia;
    expect(f({})).toBe('direct');
    expect(f({ fichaJornada: { v: 1, estagios: { champion: REG(50, 'shield') } } })).toBe('shield');
    expect(f({ fichaJornada: { v: 1, estagios: { champion: REG(50, 'hack') } } })).toBe('direct');
    expect(f({ fichaJornada: { v: 1, estagios: { mega: REG(50, 'shield') } } })).toBe('direct');
    expect(f({ fichaJornada: 'lixo' })).toBe('direct');
  });
});
