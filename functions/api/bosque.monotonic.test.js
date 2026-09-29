import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import {
  BOSQUE_THRESHOLDS, BOSQUE_STAGES, bosqueStageFor, fecharDiasDoBosque, firmarFio,
  numDia, diaDeNum, lerGrupo, coopFioKey,
} from './_coop.js';

/**
 * LV-G3 — A OBRA NUNCA REGRIDE (`PLANO-GUILDA.md` §3 linha 🌳, §13).
 *
 * Propriedade, 500 sementes: nenhuma sequência de fios, entradas, saídas e
 * exclusões faz o progresso, o estágio ou as peças de maré diminuírem. Sair e
 * ser excluído só mudam a taxa futura — os fios de quem sai somam ao total
 * ANÔNIMO (`fiosAvulsos`). E LV-G8: o fio vale 1, nunca o peso da tarefa.
 */

let s = 1;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

/** O passo de `coopLeave` sobre o estado puro (o mesmo algoritmo). */
function sair(g, fios, m) {
  const f = fios[m];
  if (f) {
    const pend = f.days.filter(d => !g.progressDay || d > g.progressDay);
    if (pend.length) {
      g.fiosAvulsos = { ...(g.fiosAvulsos || {}) };
      for (const d of pend) g.fiosAvulsos[d] = (g.fiosAvulsos[d] ?? 0) + 1;
    }
  }
  g.members = g.members.filter(x => x !== m);
  delete fios[m];
}

describe('bosque.monotonic — propriedade (500 sementes)', () => {
  it('nenhuma sequência de fios/entradas/saídas/exclusões reduz progresso, estágio ou peças', () => {
    for (let seed = 1; seed <= 500; seed++) {
      s = seed;
      const inicio = numDia('2026-01-05');
      let proximo = 0;
      const novo = () => `m${proximo++}`;
      const g = { members: [novo()], desde: {}, bosqueProgress: 0 };
      g.desde[g.members[0]] = diaDeNum(inicio);
      const fios = {};
      let ultimoP = 0, ultimoIdx = 0, ultimasPecas = 0;
      const dias = 20 + Math.floor(rnd() * 200);
      for (let n = 0; n < dias; n++) {
        const hoje = diaDeNum(inicio + n);
        for (const m of [...g.members]) {
          const r = rnd();
          if (r < 0.55) fios[m] = firmarFio(fios[m], hoje);
          else if (r < 0.58 && g.members.length > 1) sair(g, fios, m); // saída ou exclusão
        }
        if (rnd() < 0.08 && g.members.length < 12) { const m = novo(); g.members.push(m); g.desde[m] = hoje; }
        fecharDiasDoBosque(g, fios, hoje);
        // leitura repetida no mesmo dia é idempotente
        const antes = g.bosqueProgress;
        fecharDiasDoBosque(g, fios, hoje);
        expect(g.bosqueProgress).toBe(antes);

        const { stageIndex } = bosqueStageFor(g.bosqueProgress);
        expect(g.bosqueProgress, `seed ${seed} dia ${n}`).toBeGreaterThanOrEqual(ultimoP);
        expect(stageIndex, `seed ${seed} dia ${n}`).toBeGreaterThanOrEqual(ultimoIdx);
        expect((g.ornaments ?? []).length).toBeGreaterThanOrEqual(ultimasPecas);
        ultimoP = g.bosqueProgress; ultimoIdx = stageIndex; ultimasPecas = (g.ornaments ?? []).length;
      }
    }
  });

  it('um dia soma no máximo 1,0 (todos cumpriram), nunca mais — e nunca negativo', () => {
    const g = { members: ['a', 'b'], desde: { a: '2026-01-01', b: '2026-01-01' }, bosqueProgress: 0, progressDay: '2026-01-01', fiosAvulsos: { '2026-01-02': 3 } };
    const fios = { a: firmarFio(null, '2026-01-02'), b: firmarFio(null, '2026-01-02') };
    fecharDiasDoBosque(g, fios, '2026-01-03');
    expect(g.bosqueProgress).toBe(1);
    expect(g.fiosAvulsos).toEqual({});
  });

  it('LV-G8: o fio vale 1 independente do peso — não existe caminho que some peso', () => {
    const f = firmarFio(firmarFio(null, '2026-01-02'), '2026-01-02');
    expect(f.distinctDays).toBe(1);
    expect(firmarFio(null, '2026-01-02').distinctDays).toBe(1);
  });

  it('estágio derivado: limiares [2,10,25,50,90] e os cinco ids estáveis', () => {
    expect(BOSQUE_THRESHOLDS).toEqual([2, 10, 25, 50, 90]);
    expect(bosqueStageFor(0)).toEqual({ stage: null, stageIndex: 0, perto: false });
    expect(bosqueStageFor(1.99).stageIndex).toBe(0);
    expect(bosqueStageFor(1.7).perto).toBe(true);
    expect(bosqueStageFor(1.5).perto).toBe(false);
    expect(bosqueStageFor(2)).toEqual({ stage: 'clareira', stageIndex: 1, perto: false });
    expect(bosqueStageFor(9.9).perto).toBe(true);
    expect(bosqueStageFor(90)).toEqual({ stage: 'bosque-antigo', stageIndex: 5, perto: false });
    expect(bosqueStageFor(1e6).stage).toBe(BOSQUE_STAGES[4]);
  });
});

// ─── de ponta a ponta, pela rota ─────────────────────────────────────────────
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
const sid = r => r.padEnd(32, '0');
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
afterEach(() => vi.useRealTimers());

describe('bosque.monotonic — pela rota', () => {
  it('quem SAI com fio de hoje: o fio soma ao total anônimo no fechamento; o progresso nunca desce', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-01T12:00:00Z'));
    const e = { DIGIAPP_SAVES: fakeKV() };
    const A = sid('aa'), B = sid('bb');
    const g = (await (await chamar(e, 'guildCreate', { id: A, name: 'Roda' })).json()).guild;
    await chamar(e, 'guildJoin', { id: B, code: g.code });
    await chamar(e, 'guildThread', { id: A, kind: 'fio' });
    await chamar(e, 'guildThread', { id: B, kind: 'fio' });
    await chamar(e, 'guildLeave', { id: B });
    expect(e.DIGIAPP_SAVES.store.has(coopFioKey(g.id, B))).toBe(false);
    vi.setSystemTime(new Date('2026-09-03T12:00:00Z'));
    await chamar(e, 'guild', { id: A }, 'GET');
    // A (membro) + B (avulso) firmaram, de 2 → 1,0 e não 0,5 nem 1/1 com B perdido.
    expect((await lerGrupo(e, g.id)).bosqueProgress).toBeCloseTo(1, 9);
    // Outra saída / volta não tira nada.
    await chamar(e, 'guildJoin', { id: B, code: g.code });
    await chamar(e, 'guildLeave', { id: B });
    vi.setSystemTime(new Date('2026-09-05T12:00:00Z'));
    await chamar(e, 'guild', { id: A }, 'GET');
    expect((await lerGrupo(e, g.id)).bosqueProgress).toBeGreaterThanOrEqual(1);
  });
});

describe('mutantes que sobreviveram à 1ª rodada', () => {
  it('o fio avulso de quem saiu entra nos DOIS lados da razão (1 de 3, não 0 de 2)', () => {
    const g = { members: ['a', 'c'], desde: {}, bosqueProgress: 0, progressDay: '2026-01-01', fiosAvulsos: { '2026-01-02': 1 } };
    fecharDiasDoBosque(g, {}, '2026-01-03');
    expect(g.bosqueProgress).toBeCloseTo(1 / 3, 9);
  });

  it('dois fechamentos CONCORRENTES a partir da mesma cópia velha não somam o dia duas vezes', async () => {
    const { atualizarBosque, gravarGrupo } = await import('./_coop.js');
    const e = { DIGIAPP_SAVES: fakeKV() };
    const velho = { id: 'g'.repeat(20), code: 'ABCDEFGH', members: ['a'.repeat(32)], desde: {}, bosqueProgress: 1, progressDay: '2026-01-01', tideKey: 'x', tideBase: 1 };
    velho.tideKey = (await import('./_coop.js')).mareDe('2026-01-03');
    await gravarGrupo(e, velho);
    e.DIGIAPP_SAVES.store.set(coopFioKey(velho.id, velho.members[0]), JSON.stringify(firmarFio(null, '2026-01-02')));
    const copia1 = structuredClone(velho), copia2 = structuredClone(velho);
    await atualizarBosque(e, copia1, '2026-01-03');
    await atualizarBosque(e, copia2, '2026-01-03');
    expect((await lerGrupo(e, velho.id)).bosqueProgress).toBeCloseTo(2, 9);
  });
});
