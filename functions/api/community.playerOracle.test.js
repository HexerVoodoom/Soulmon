/**
 * B3 / N-3 — `community?action=player` como ORACULO e-mail -> conta.
 *
 * O ataque, inteiro, sem autenticacao nenhuma e sem nada de dentro do servidor:
 *
 *   1. o `saveId` e SHA-256("soulmon:" + e-mail) truncado em 32 hex. O
 *      algoritmo esta publicado em tres arvores do repo (cliente web, desktop
 *      e `_auth.js`) — logo o atacante deriva o saveId de QUALQUER e-mail que
 *      ele queira testar, offline;
 *   2. `GET /api/community?action=player&id=<saveId>` respondia, gracas ao
 *      fallback `|| id`, com o perfil do dono daquele e-mail;
 *   3. a diferenca entre `{ found: false }` e `{ found: true, player: {...} }`
 *      responde "esse e-mail tem conta no Soulmon?" — e ainda entrega nome,
 *      nome do bicho, dias jogando, tarefas feitas e a lista de amigos.
 *
 * E a segunda metade, que a auditoria nao viu: remover o `|| id` sozinho NAO
 * fecha nada. O `pid` publico era `SHA-256("soulmon-pub:" + saveId)` — outra
 * derivacao publica e sem segredo. O atacante encadeia e-mail -> saveId -> pid
 * e refaz a mesma pergunta pela porta da frente. Um oraculo fechado numa
 * dimensao e aberto em outra continua sendo um oraculo.
 *
 * Estes testes atacam pelas DUAS portas e exigem que as duas respostas sejam
 * indistinguiveis de "esse e-mail nao existe" — no status, no corpo byte a
 * byte, e no trabalho gasto no KV (proxy deterministico de tempo de resposta:
 * um KV a mais e um round-trip a mais).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { onRequest } from './community.js';
import { emailToSaveId } from './_auth.js';
import { resetRateLimits } from './_rateLimit.js';

const COM_CONTA = 'tem.conta@exemplo.com';
const SEM_CONTA = 'nao.tem.conta@exemplo.com';

/** Derivacao publica do pid ANTIGA — a que o atacante conseguia refazer. */
async function pidDerivado(saveId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

/** KV de mentira que registra o TIPO de cada operacao, em ordem. */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const trilha = [];
  return {
    store, trilha,
    get: async k => { trilha.push('get'); return store.get(k) ?? null; },
    put: async (k, v) => { trilha.push('put'); store.set(k, v); },
    delete: async k => { trilha.push('delete'); store.delete(k); },
    list: async ({ prefix }) => {
      trilha.push('list');
      return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
    },
  };
}

const perfil = (id, extra = {}) => JSON.stringify({
  id, name: 'Mateus Silva', petName: 'Kuro', stage: 'champion',
  pvpEnabled: true, attrs: { power: 3, harmony: 2, benevolence: 1 },
  friends: [], tasksDone: 42, createdAt: Date.now(), ...extra,
});

/** Mundo real: a conta de `COM_CONTA` existe, com perfil e indice de pid. */
async function mundo() {
  const saveId = await emailToSaveId(COM_CONTA);
  const pid = await pidDerivado(saveId);
  return fakeKV({
    [`profile:${saveId}`]: perfil(saveId, { pid }),
    [`pid:${pid}`]: saveId,
  });
}

/** Sonda sem token nenhum, IP proprio, e devolve status + corpo + trilha KV. */
async function sondar(kv, id, ip) {
  kv.trilha.length = 0;
  const request = new Request(`https://x.dev/api/community?action=player&id=${id}`, {
    headers: { 'CF-Connecting-IP': ip },
  });
  const res = await onRequest({ request, env: { DIGIAPP_SAVES: kv } });
  return { status: res.status, corpo: await res.text(), trilha: [...kv.trilha] };
}

describe('B3/N-3 — action=player nao responde "esse e-mail tem conta?"', () => {
  beforeEach(() => resetRateLimits());

  it('pela porta do saveId cru: a resposta e identica para e-mail com e sem conta', async () => {
    const kv = await mundo();
    const comConta = await sondar(kv, await emailToSaveId(COM_CONTA), '203.0.113.1');
    const semConta = await sondar(kv, await emailToSaveId(SEM_CONTA), '203.0.113.2');

    expect(comConta.status).toBe(semConta.status);
    expect(comConta.corpo).toBe(semConta.corpo);
    expect(comConta.trilha).toEqual(semConta.trilha);
    // E, explicitamente: nada do perfil vaza.
    expect(comConta.corpo).not.toContain('Kuro');
    expect(comConta.corpo).not.toContain('Mateus');
  });

  it('pela porta do pid derivado do e-mail: idem — a cadeia e-mail->saveId->pid morre', async () => {
    const kv = await mundo();
    const pidCom = await pidDerivado(await emailToSaveId(COM_CONTA));
    const pidSem = await pidDerivado(await emailToSaveId(SEM_CONTA));
    const comConta = await sondar(kv, pidCom, '203.0.113.3');
    const semConta = await sondar(kv, pidSem, '203.0.113.4');

    expect(comConta.status).toBe(semConta.status);
    expect(comConta.corpo).toBe(semConta.corpo);
    expect(comConta.trilha).toEqual(semConta.trilha);
    expect(comConta.corpo).not.toContain('Kuro');
  });

  it('o pid publicado no diretorio NAO e derivavel do saveId', async () => {
    // Enquanto for, o proprio diretorio publico (N-4) e o oraculo: basta
    // derivar o pid do e-mail e procurar na listagem. Nenhuma mudanca em
    // `action=player` conserta isso — a derivacao precisa morrer.
    const kv = await mundo();
    const saveId = await emailToSaveId(COM_CONTA);
    const res = await onRequest({
      request: new Request('https://x.dev/api/community?action=players', {
        headers: { 'CF-Connecting-IP': '203.0.113.5' },
      }),
      env: { DIGIAPP_SAVES: kv },
    });
    const { players } = await res.json();
    expect(players).toHaveLength(1);
    expect(players[0].id).not.toBe(await pidDerivado(saveId));
    expect(players[0].id).not.toContain(saveId);
  });

  it('o upsert de perfil aposenta o pid derivado e apaga o indice dele', async () => {
    // Migracao sem passo de operacao: a conta antiga troca de identidade
    // publica no primeiro cloud save, e o indice adivinhavel some do KV.
    const saveId = await emailToSaveId(COM_CONTA);
    const legado = await pidDerivado(saveId);
    const kv = await mundo();
    const res = await onRequest({
      request: new Request('https://x.dev/api/community?action=profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.8' },
        body: JSON.stringify({ id: saveId, name: 'Mateus Silva', stage: 'champion' }),
      }),
      env: { DIGIAPP_SAVES: kv },
    });
    const { id: novoPid } = await res.json();
    expect(novoPid).not.toBe(legado);
    expect(kv.store.has(`pid:${legado}`)).toBe(false);
    expect(kv.store.get(`pid:${novoPid}`)).toBe(saveId);
  });

  it('o caminho legitimo continua de pe: quem tem o pid do diretorio le o perfil', async () => {
    // O oraculo morre; a rota nao. Este e o par obrigatorio do teste vermelho.
    const kv = await mundo();
    const lista = await onRequest({
      request: new Request('https://x.dev/api/community?action=players', {
        headers: { 'CF-Connecting-IP': '203.0.113.6' },
      }),
      env: { DIGIAPP_SAVES: kv },
    });
    const pidPublico = (await lista.json()).players[0].id;

    const res = await onRequest({
      request: new Request(`https://x.dev/api/community?action=player&id=${pidPublico}`, {
        headers: { 'CF-Connecting-IP': '203.0.113.7' },
      }),
      env: { DIGIAPP_SAVES: kv },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.found).toBe(true);
    expect(body.player.petName).toBe('Kuro');
    expect(body.player.id).toBe(pidPublico);
    // e o saveId continua sem sair daqui
    expect(JSON.stringify(body)).not.toContain(await emailToSaveId(COM_CONTA));
  });
});
