import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

/**
 * O modo cooperativo (Fase 4.3, `docs/PLANO-COOP.md`).
 *
 * O que estes testes protegem NÃO é o caminho feliz — é a razão de o modo
 * existir do jeito que existe:
 *
 *  1. **Nenhuma contagem individual sai do servidor.** O item 4.2 do
 *     `PLANO-EVOLUCAO.md` registra que 31,3% relataram efeito psicológico
 *     negativo de comparação em ambiente de leaderboard. Um grupo que mostrasse
 *     quanto cada membro fez reinventaria o leaderboard entre amigos, onde a
 *     comparação dói mais. Presença é binária; o número é do grupo.
 *  2. **Sair é limpo.** A meta encolhe junto com o grupo — senão sair vira
 *     sabotagem, e o grupo pressiona a pessoa a ficar.
 *  3. **Nenhum saveId vaza.** Ele é a chave do cloud save e o hash do e-mail.
 *  4. **Entra-se por código, nunca por busca** — grupo achável é raide de
 *     estranho, e o diretório já respeita consentimento (N-4).
 */

const ANA = 'a'.repeat(32);
const BIA = 'b'.repeat(32);
const CAU = 'c'.repeat(32);
const DAN = 'd'.repeat(32);
const ELI = 'e'.repeat(32);

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

const perfil = (id, nome) => JSON.stringify({
  id, name: nome, petName: 'pet', stage: 'rookie', pvpEnabled: false,
  friends: [], createdAt: Date.now(),
});

/** Sem `FIREBASE_PROJECT_ID`: `authorizeSaveAccess` é fail-open por decisão de
 *  migração, e é assim que se testa o COMPORTAMENTO. Que as rotas recusam sem
 *  token está travado em `community.test.js` (lista `ACOES_COM_ATOR`). */
function env() {
  return {
    DIGIAPP_SAVES: fakeKV({
      [`profile:${ANA}`]: perfil(ANA, 'Ana'),
      [`profile:${BIA}`]: perfil(BIA, 'Bia'),
      [`profile:${CAU}`]: perfil(CAU, 'Cau'),
      [`profile:${DAN}`]: perfil(DAN, 'Dan'),
      [`profile:${ELI}`]: perfil(ELI, 'Eli'),
    }),
  };
}

function req(action, { method = 'GET', body, params = {} } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/community?${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}

const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });

async function criar(e, id, name = 'Time da manhã') {
  const res = await chamar(e, 'coopCreate', { method: 'POST', body: { id, name } });
  expect(res.status).toBe(200);
  return (await res.json()).group;
}

async function entrar(e, id, code) {
  const res = await chamar(e, 'coopJoin', { method: 'POST', body: { id, code } });
  return { status: res.status, body: await res.json() };
}

const checkin = (e, id) => chamar(e, 'coopCheckin', { method: 'POST', body: { id } });
const ver = async (e, id) => (await (await chamar(e, 'coop', { params: { id } })).json()).group;

describe('coop — o grupo', () => {
  it('criar devolve um grupo de um membro, com código', async () => {
    const e = env();
    const g = await criar(e, ANA);
    expect(g.members).toHaveLength(1);
    expect(g.members[0].name).toBe('Ana');
    expect(g.code).toMatch(/^[A-Z2-9]{8}$/);
    expect(g.progress).toBe(0);
  });

  it('quem não tem grupo recebe `null` — e isso não é erro', async () => {
    const e = env();
    const res = await chamar(e, 'coop', { params: { id: ANA } });
    expect(res.status).toBe(200);
    expect((await res.json()).group).toBeNull();
  });

  it('entra-se pelo CÓDIGO; um código inventado não abre nada', async () => {
    const e = env();
    await criar(e, ANA);
    const r = await entrar(e, BIA, 'ZZZZZZZZ');
    expect(r.status).toBe(404);
    expect(await ver(e, BIA)).toBeNull();
  });

  it('o grupo não é alcançável pelo diretório público', async () => {
    // Se `players` passar a devolver grupos, entrar deixa de exigir convite.
    const e = env();
    await criar(e, ANA, 'Segredo');
    const res = await chamar(e, 'players');
    expect(await res.text()).not.toContain('Segredo');
  });

  it('teto de 4: o quinto é recusado, e o grupo segue íntegro', async () => {
    const e = env();
    const g = await criar(e, ANA);
    for (const quem of [BIA, CAU, DAN]) expect((await entrar(e, quem, g.code)).status).toBe(200);
    const quinto = await entrar(e, ELI, g.code);
    expect(quinto.status).toBe(409);
    expect((await ver(e, ANA)).members).toHaveLength(4);
  });

  it('um grupo por pessoa — criar ou entrar de novo é recusado', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await entrar(e, BIA, g.code);
    const outro = await chamar(e, 'coopCreate', { method: 'POST', body: { id: BIA, name: 'Outro' } });
    expect(outro.status).toBe(409);
  });

  it('nome vazio não cria grupo', async () => {
    const e = env();
    const res = await chamar(e, 'coopCreate', { method: 'POST', body: { id: ANA, name: '   ' } });
    expect(res.status).toBe(400);
  });
});

describe('coop — a comparação individual NÃO existe (a razão do desenho)', () => {
  it('a resposta traz presença binária, nunca quanto cada um fez', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await entrar(e, BIA, g.code);
    await checkin(e, ANA);

    const vista = await ver(e, ANA);
    const ana = vista.members.find(m => m.euMesmo);
    const bia = vista.members.find(m => !m.euMesmo);

    expect(ana.apareceuHoje).toBe(true);
    expect(bia.apareceuHoje).toBe(false);
    // Nada que ordene um contra o outro pode existir no objeto do membro.
    for (const m of vista.members) {
      expect(Object.keys(m).sort()).toEqual(['apareceuHoje', 'euMesmo', 'id', 'name', 'stage']);
    }
  });

  it('o progresso é do GRUPO — um número só', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await entrar(e, BIA, g.code);
    await checkin(e, ANA);
    await checkin(e, BIA);
    const vista = await ver(e, ANA);
    expect(vista.progress).toBe(2);
    expect(vista.target).toBe(10); // 2 membros × 5
  });

  it('nenhum saveId sai na resposta', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await entrar(e, BIA, g.code);
    await checkin(e, ANA);
    const bruto = await (await chamar(e, 'coop', { params: { id: ANA } })).text();
    for (const save of [ANA, BIA]) expect(bruto).not.toContain(save);
  });
});

describe('coop — check-in', () => {
  it('é idempotente no dia: marcar duas vezes conta uma', async () => {
    // É a única garantia que o servidor consegue dar sozinho sobre um fato que
    // ele não observa. Sem ela, o progresso do grupo é só um botão de apertar.
    const e = env();
    await criar(e, ANA);
    await checkin(e, ANA);
    await checkin(e, ANA);
    await checkin(e, ANA);
    expect((await ver(e, ANA)).progress).toBe(1);
  });

  it('só marca sobre si mesmo — sem grupo, não há o que marcar', async () => {
    const e = env();
    const res = await checkin(e, ANA);
    expect(res.status).toBe(404);
  });

  it('o progresso nunca passa da meta', async () => {
    const e = env();
    await criar(e, ANA);
    const kv = e.DIGIAPP_SAVES;
    const gid = await kv.get(`coopOf:${ANA}`);
    const g = JSON.parse(await kv.get(`coop:${gid}`));
    // Sete dias marcados, meta de 5: a barra não pode estourar o próprio teto.
    g.checkins[ANA] = ['1', '2', '3', '4', '5', '6', '7'];
    await kv.put(`coop:${gid}`, JSON.stringify(g));
    const vista = await ver(e, ANA);
    expect(vista.progress).toBe(5);
    expect(vista.target).toBe(5);
  });

  it('a semana vira sozinha e zera o progresso, sem job agendado', async () => {
    const e = env();
    await criar(e, ANA);
    await checkin(e, ANA);
    const kv = e.DIGIAPP_SAVES;
    const gid = await kv.get(`coopOf:${ANA}`);
    const g = JSON.parse(await kv.get(`coop:${gid}`));
    g.weekKey = '1999-W01';
    await kv.put(`coop:${gid}`, JSON.stringify(g));
    expect((await ver(e, ANA)).progress).toBe(0);
  });
});

describe('coop — sair é limpo, e é a exigência escrita da Fase 4.3', () => {
  it('sair encolhe a META junto — sair não pode ser sabotagem', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await entrar(e, BIA, g.code);
    await entrar(e, CAU, g.code);
    expect((await ver(e, ANA)).target).toBe(15);

    await chamar(e, 'coopLeave', { method: 'POST', body: { id: CAU } });

    const depois = await ver(e, ANA);
    expect(depois.members).toHaveLength(2);
    expect(depois.target).toBe(10);
  });

  it('quem sai não deixa o próprio progresso pesando no grupo', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await entrar(e, BIA, g.code);
    await checkin(e, ANA);
    await checkin(e, BIA);
    await chamar(e, 'coopLeave', { method: 'POST', body: { id: BIA } });
    const depois = await ver(e, ANA);
    expect(depois.progress).toBe(1);
    expect(depois.target).toBe(5);
  });

  it('sair sem grupo responde ok — não existe estado de erro para desistir', async () => {
    const e = env();
    const res = await chamar(e, 'coopLeave', { method: 'POST', body: { id: ANA } });
    expect(res.status).toBe(200);
  });

  it('o último a sair apaga o grupo, sem lápide', async () => {
    const e = env();
    const g = await criar(e, ANA);
    await chamar(e, 'coopLeave', { method: 'POST', body: { id: ANA } });
    expect(await ver(e, ANA)).toBeNull();
    const sobrou = [...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('coop'));
    expect(sobrou).toEqual([]);
    // E o código morre com ele: um convite antigo não ressuscita nada.
    expect((await entrar(e, BIA, g.code)).status).toBe(404);
  });

  it('quem saiu pode entrar em outro grupo — nada fica preso', async () => {
    const e = env();
    const g1 = await criar(e, ANA);
    await entrar(e, BIA, g1.code);
    await chamar(e, 'coopLeave', { method: 'POST', body: { id: BIA } });
    const g2 = await criar(e, CAU, 'Outro time');
    expect((await entrar(e, BIA, g2.code)).status).toBe(200);
  });
});
