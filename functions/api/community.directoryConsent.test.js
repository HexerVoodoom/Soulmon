import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

// N-4 da auditoria de rotas: `action=players` devolvia, sem token e para
// qualquer origem, `name` (texto livre, tem gente que digita o nome real),
// `petName`, `stage`, `daysPlaying` e `tasksDone` — estes dois últimos
// descrevem hábito — de TODO perfil salvo. E o perfil é gravado junto do cloud
// save: a pessoa entrava no diretório por consequência de salvar, não por
// escolha.
//
// `action=opponents` já respeitava `p.pvpEnabled` (o gate de consentimento que
// existe e funciona). A decisão do dono foi estender o MESMO gate a `players`,
// em vez de inventar um `directoryEnabled` novo.
//
// Perfil ANTIGO, gravado antes de o campo existir, tem `pvpEnabled` undefined.
// Ele NÃO entra: consentimento não se presume, e `!p.pvpEnabled` — a mesma
// expressão que `opponents` usa — já trata undefined como "não".

const ALICE = 'a'.repeat(32);
const BRUNO = 'b'.repeat(32);
const CAROL = 'c'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}

/** `pvpEnabled` fica FORA do objeto base de propósito: cada caso declara o seu. */
const perfil = (id, extra = {}) => JSON.stringify({
  id, name: `n-${id.slice(0, 4)}`, petName: 'pet', stage: 'rookie',
  attrs: { virus: 1, data: 1, vaccine: 1 },
  friends: [], createdAt: Date.now(), tasksDone: 7, ...extra,
});

const req = (action, params = {}) =>
  new Request(`https://x.dev/api/community?${new URLSearchParams({ action, ...params })}`);

const nomes = async res => (await res.json()).players.map(p => p.name);

describe('N-4 — o diretório público respeita o consentimento que já existe', () => {
  it('quem NÃO ligou o PvP não aparece em players', async () => {
    const env = {
      DIGIAPP_SAVES: fakeKV({
        [`profile:${ALICE}`]: perfil(ALICE, { pvpEnabled: true }),
        [`profile:${BRUNO}`]: perfil(BRUNO, { pvpEnabled: false }),
      }),
    };
    const lista = await nomes(await onRequest({ request: req('players'), env }));
    expect(lista).toEqual([`n-${ALICE.slice(0, 4)}`]);
  });

  it('perfil ANTIGO, com pvpEnabled undefined, também fica de fora', async () => {
    // O lado seguro: consentimento não se presume. Ver o relatório — isto
    // MUDA o comportamento de quem já está no diretório hoje.
    const env = {
      DIGIAPP_SAVES: fakeKV({
        [`profile:${ALICE}`]: perfil(ALICE, { pvpEnabled: true }),
        [`profile:${CAROL}`]: perfil(CAROL), // sem o campo
      }),
    };
    const lista = await nomes(await onRequest({ request: req('players'), env }));
    expect(lista).not.toContain(`n-${CAROL.slice(0, 4)}`);
  });

  it('a busca por nome não é uma porta lateral para quem não consentiu', async () => {
    // O `search` roda no servidor sobre as MESMAS chaves. Se o filtro ficasse
    // depois do search, bastava adivinhar o nome para confirmar a pessoa.
    const env = {
      DIGIAPP_SAVES: fakeKV({ [`profile:${BRUNO}`]: perfil(BRUNO, { pvpEnabled: false }) }),
    };
    const res = await onRequest({ request: req('players', { search: 'n-bbbb' }), env });
    const texto = await res.text();
    expect(JSON.parse(texto).players).toEqual([]);
    expect(texto).not.toContain('n-bbbb');
  });

  it('nem o pid de quem não consentiu vaza no diretório', async () => {
    // `publicProfile` CRIA e indexa o pid (`ensurePid`) como efeito colateral.
    // Filtrar antes de chamá-lo é o que impede o diretório de emitir
    // identidade social para quem nunca pediu para estar nele.
    const env = {
      DIGIAPP_SAVES: fakeKV({ [`profile:${BRUNO}`]: perfil(BRUNO, { pvpEnabled: false }) }),
    };
    await onRequest({ request: req('players'), env });
    const chaves = [...env.DIGIAPP_SAVES.store.keys()];
    expect(chaves.filter(k => k.startsWith('pid:'))).toEqual([]);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`)).pid).toBeUndefined();
  });
});

describe('N-4 — o que NÃO pode mudar', () => {
  it('opponents continua exatamente como estava: só quem ligou o PvP, menos eu', async () => {
    const env = {
      DIGIAPP_SAVES: fakeKV({
        [`profile:${ALICE}`]: perfil(ALICE, { pvpEnabled: true }),
        [`profile:${BRUNO}`]: perfil(BRUNO, { pvpEnabled: false }),
        [`profile:${CAROL}`]: perfil(CAROL, { pvpEnabled: true }),
      }),
    };
    const res = await onRequest({ request: req('opponents', { id: ALICE }), env });
    const { opponents } = await res.json();
    expect(opponents.map(o => o.name)).toEqual([`n-${CAROL.slice(0, 4)}`]);
  });

  it('quem ligou o PvP continua no diretório — com PRESENÇA, sem desempenho', async () => {
    // O N-4 era um filtro de CONSENTIMENTO (só entra quem ligou o PvP) e
    // continua sendo: nada aqui poda quem aparece.
    //
    // O que mudou em 06/09/2026 é o QUE cada linha carrega. `tasksDone` e
    // `rankPoints` saíram do fio (WP4.11, exposição E3, proibição #21): são
    // métrica de desempenho de outra pessoa, e um diretório pesquisável é o
    // pior lugar possível para elas. Este teste dizia "se alguém remover
    // `tasksDone`, a Biblioteca quebra" — não quebra: nenhuma tela o
    // renderizava desde antes disto, ele só trafegava.
    //
    // O corte é no SERVIDOR de propósito. Escondido na UI, o campo volta no dia
    // em que alguém desenhar um cartão novo; ausente do fio, não tem como.
    const env = {
      DIGIAPP_SAVES: fakeKV({ [`profile:${ALICE}`]: perfil(ALICE, { pvpEnabled: true }) }),
    };
    const { players } = await (await onRequest({ request: req('players'), env })).json();
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({
      name: `n-${ALICE.slice(0, 4)}`, petName: 'pet', stage: 'rookie',
      pvpEnabled: true, daysPlaying: 1,
    });
    expect(players[0].id).toMatch(/^[0-9a-f]{24}$/);
    // As duas que não podem voltar.
    expect(players[0]).not.toHaveProperty('tasksDone');
    expect(players[0]).not.toHaveProperty('rankPoints');
  });
});
