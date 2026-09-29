import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import {
  mareDe, colherMare, tamanhoDaFloracao, fecharDiasDoBosque, firmarFio, numDia, diaDeNum,
  GUILD_TIDE_WEEKS, TIDE_BLOOM_TARGET, TIDE_COROLLA_AT, TIDE_SIZES,
} from './_coop.js';

/**
 * MARÉS (WPG-3c, `PLANO-GUILDA.md` §3 linha 🌊): ciclo de 6 semanas, floração
 * colhida NO ESTADO EM QUE ESTIVER, três tamanhos descritivos (Pétala/Corola/
 * Floração cheia — ids `petala|corola|floracao`), peça PERMANENTE em
 * `g.ornaments`. Nenhuma maré falha, nada é resetado.
 */
describe('mareDe', () => {
  it('6 semanas, virando na segunda', () => {
    expect(GUILD_TIDE_WEEKS).toBe(6);
    const seg = '2026-01-05'; // segunda
    let viradas = 0;
    for (let n = 1; n <= 7 * 12; n++) if (mareDe(diaDeNum(numDia(seg) + n)) !== mareDe(diaDeNum(numDia(seg) + n - 1))) viradas++;
    expect(viradas).toBe(2);
    // toda virada cai numa segunda-feira
    for (let n = 1; n <= 7 * 30; n++) {
      const d = diaDeNum(numDia(seg) + n);
      if (mareDe(d) !== mareDe(diaDeNum(numDia(d) - 1))) expect(new Date(`${d}T00:00:00Z`).getUTCDay()).toBe(1);
    }
  });
});

describe('tamanhoDaFloracao', () => {
  it('Pétala < 4 ≤ Corola < 12 ≤ Floração cheia; nada cresceu = nada', () => {
    expect(TIDE_SIZES).toEqual(['petala', 'corola', 'floracao']);
    expect(TIDE_COROLLA_AT).toBe(4);
    expect(TIDE_BLOOM_TARGET).toBe(12);
    expect(tamanhoDaFloracao(0)).toBeNull();
    expect(tamanhoDaFloracao(0.5)).toBe('petala');
    expect(tamanhoDaFloracao(3.99)).toBe('petala');
    expect(tamanhoDaFloracao(4)).toBe('corola');
    expect(tamanhoDaFloracao(11.99)).toBe('corola');
    expect(tamanhoDaFloracao(12)).toBe('floracao');
    expect(tamanhoDaFloracao(50)).toBe('floracao');
  });
});

describe('colherMare', () => {
  it('primeira leitura só marca a maré; virada colhe no estado em que estiver; nada é resetado', () => {
    const g = { bosqueProgress: 3 };
    expect(colherMare(g, '2026-01-05')).toBe(true);
    expect(g.tideBase).toBe(3);
    expect(colherMare(g, '2026-01-06')).toBe(false);
    g.bosqueProgress = 9; // cresceu 6 na maré
    const proxima = diaDeNum(numDia('2026-01-05') + 7 * GUILD_TIDE_WEEKS);
    expect(colherMare(g, proxima)).toBe(true);
    expect(g.ornaments).toEqual([{ tide: mareDe('2026-01-05'), size: 'corola', day: proxima }]);
    expect(g.bosqueProgress).toBe(9); // o Bosque NÃO é zerado
    expect(g.tideBase).toBe(9);
  });

  it('maré sem crescimento não gera peça nem estado de "falhou"; as peças antigas ficam', () => {
    const g = { bosqueProgress: 5, tideKey: mareDe('2026-01-05'), tideBase: 5, ornaments: [{ tide: 'T0', size: 'floracao', day: '2025-01-01' }] };
    colherMare(g, diaDeNum(numDia('2026-01-05') + 7 * GUILD_TIDE_WEEKS));
    expect(g.ornaments).toEqual([{ tide: 'T0', size: 'floracao', day: '2025-01-01' }]);
    expect(JSON.stringify(g)).not.toMatch(/fail|falh|lost|perd/i);
  });

  it('o fechamento do dia colhe a maré DO DIA fechado: fios de antes da virada contam para a maré velha', () => {
    const inicio = numDia('2026-01-05');
    const g = { members: ['a'], desde: { a: '2026-01-05' }, bosqueProgress: 0, progressDay: '2026-01-04' };
    const fios = {};
    for (let n = 0; n < 7 * GUILD_TIDE_WEEKS + 3; n++) {
      const hoje = diaDeNum(inicio + n);
      fios.a = firmarFio(fios.a, hoje);
      fecharDiasDoBosque(g, fios, hoje);
    }
    // 42 dias de 1,0 na primeira maré → floração cheia; a segunda segue aberta.
    expect(g.ornaments).toHaveLength(1);
    expect(g.ornaments[0].size).toBe('floracao');
    expect(g.ornaments[0].tide).toBe(mareDe('2026-01-05'));
  });
});

// ─── pela rota: a vista mostra a peça, nunca número ──────────────────────────
function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const A = 'a'.repeat(32);
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
afterEach(() => vi.useRealTimers());

describe('maré pela rota', () => {
  it('seis semanas de fio → a vista traz a peça (tide/size/day) e a maré corrente, sem número', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const t0 = Date.UTC(2026, 0, 5, 12);
    vi.setSystemTime(new Date(t0));
    const e = { DIGIAPP_SAVES: fakeKV() };
    await chamar(e, 'guildCreate', { id: A, name: 'Roda' });
    let v;
    for (let n = 0; n <= 7 * GUILD_TIDE_WEEKS + 1; n++) {
      vi.setSystemTime(new Date(t0 + n * 86400000));
      v = (await (await chamar(e, 'guildThread', { id: A, kind: 'fio' })).json()).guild;
    }
    expect(v.bosque.ornaments).toHaveLength(1);
    expect(v.bosque.ornaments[0]).toEqual({ tide: mareDe('2026-01-05'), size: 'floracao', day: expect.any(String) });
    expect(v.bosque.tide.key).toBe(mareDe(new Date(Date.now()).toISOString().slice(0, 10)));
    expect(['petala', null]).toContain(v.bosque.tide.size);
    expect(Object.keys(v.bosque.tide).sort()).toEqual(['key', 'size']);
  });
});
