/**
 * R-3 / R-2 — a PERDA SILENCIOSA do cloud save.
 *
 * O preparo da fatia 1 (§A.3.3) mediu o caminho de erro inteiro e achou isto:
 * `cloudSave` colapsava 401 / 403 / 409 / 412 / 413 / 5xx / offline num único
 * `boolean`, e o único chamador real (`GameStateContext.tsx:1050`) **nem lia o
 * retorno**. O resultado não é conflito — é save perdido sem ninguém ver: o
 * jogador joga o dia inteiro, o servidor recusa toda escrita, e a única pista é
 * um `console.warn` que ninguém abre.
 *
 * Estes casos travam o CONTRATO que a fatia 1 vai consumir:
 *
 *   1. cada código HTTP vira uma CLASSE nomeada, não um `false`;
 *   2. cada classe carrega, POR CÓDIGO, a decisão de retentar e a de avisar o
 *      jogador — a tabela não pode morar na cabeça de quem chama;
 *   3. o orçamento de retry é POR `saveId`, com teto e janela (R-2), nunca por
 *      chamada. Com ~14 chamadas/dia (§A.2.3) e teto de 3 por chamada, um 401
 *      permanente viraria 42 requisições autenticadas/dia contra o Firebase.
 *
 * O 409 é tratado como CLASSE aqui de propósito. O `revision` que o produz é da
 * fatia 1 e NÃO é implementado nesta frente — o que se implementa é o caminho
 * de erro tipado que ele vai usar quando chegar.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cloudSave,
  cloudSaveComRetry,
  classifyCloudSaveStatus,
  CLOUD_SAVE_POLICY,
  CLOUD_SAVE_RETRY_TETO,
  CLOUD_SAVE_RETRY_JANELA_MS,
  __resetRetryBudgets,
} from './cloudSave';

const ID = 'a'.repeat(32);
const memoria = new Map<string, string>();

beforeEach(() => {
  memoria.clear();
  __resetRetryBudgets();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

/** Servidor que devolve sempre o mesmo status, contando as chamadas. */
function servidorFixo(status: number) {
  const chamadas: number[] = [];
  vi.stubGlobal('fetch', async () => {
    chamadas.push(Date.now());
    return status === 200
      ? Response.json({ ok: true })
      : Response.json({ error: 'x' }, { status });
  });
  return chamadas;
}

// ───────────────────────────────────────────── 1. o código vira classe

describe('classifyCloudSaveStatus — cada código tem NOME, não `false`', () => {
  // Valores crus de propósito: `expect(...).toBe(POLICY[k])` seria tautologia.
  it.each([
    [0, 'offline'],
    [401, 'auth'],
    [403, 'identity'],
    [409, 'conflict'],
    [412, 'stale'],
    [413, 'too-large'],
    [400, 'client'],
    [404, 'client'],
    [500, 'server'],
    [503, 'server'],
  ])('status %i → %s', (status, esperado) => {
    expect(classifyCloudSaveStatus(status as number)).toBe(esperado);
  });
});

describe('CLOUD_SAVE_POLICY — a decisão por código, escrita uma vez só', () => {
  it('403 NÃO retenta e AVISA: só reconciliar o saveId conserta (B-R1)', () => {
    expect(CLOUD_SAVE_POLICY.identity.retentavel).toBe(false);
    expect(CLOUD_SAVE_POLICY.identity.avisaJogador).toBe(true);
  });

  it('409 NÃO retenta cegamente: quem reconcilia é a fatia 1, não o backoff', () => {
    expect(CLOUD_SAVE_POLICY.conflict.retentavel).toBe(false);
  });

  it('413 NÃO retenta — reenviar o mesmo save grande dá o mesmo 413', () => {
    expect(CLOUD_SAVE_POLICY['too-large'].retentavel).toBe(false);
    expect(CLOUD_SAVE_POLICY['too-large'].avisaJogador).toBe(true);
  });

  it('5xx e offline retentam e NÃO incomodam o jogador (é transitório)', () => {
    expect(CLOUD_SAVE_POLICY.server.retentavel).toBe(true);
    expect(CLOUD_SAVE_POLICY.server.avisaJogador).toBe(false);
    expect(CLOUD_SAVE_POLICY.offline.retentavel).toBe(true);
    expect(CLOUD_SAVE_POLICY.offline.avisaJogador).toBe(false);
  });

  it('401 retenta (o SDK renova o token) mas avisa se insistir', () => {
    expect(CLOUD_SAVE_POLICY.auth.retentavel).toBe(true);
    expect(CLOUD_SAVE_POLICY.auth.avisaJogador).toBe(true);
  });
});

// ───────────────────────────────────────────── 2. cloudSave devolve o tipo

describe('cloudSave devolve o resultado TIPADO, não um booleano', () => {
  it('200 → ok:true e carimba a sincronização', async () => {
    servidorFixo(200);
    const r = await cloudSave(ID, { healthPoints: 3 });
    expect(r.ok).toBe(true);
    expect(memoria.get('digiapp-last-cloud-sync')).toBeTruthy();
  });

  it('403 → identity, status 403, e NENHUM carimbo', async () => {
    servidorFixo(403);
    const r = await cloudSave(ID, { healthPoints: 3 });
    expect(r).toMatchObject({ ok: false, kind: 'identity', status: 403, retentavel: false, avisaJogador: true });
    expect(memoria.get('digiapp-last-cloud-sync')).toBeUndefined();
  });

  it('409 → conflict, e o chamador consegue distinguir de 500', async () => {
    servidorFixo(409);
    expect(await cloudSave(ID, {})).toMatchObject({ ok: false, kind: 'conflict', status: 409 });
    servidorFixo(500);
    expect(await cloudSave(ID, {})).toMatchObject({ ok: false, kind: 'server', status: 500 });
  });

  it('413 → too-large (o save é grande demais; reenviar não resolve)', async () => {
    servidorFixo(413);
    expect(await cloudSave(ID, {})).toMatchObject({ ok: false, kind: 'too-large', status: 413 });
  });

  it('fetch que lança (offline) → offline com status 0, não um 500 inventado', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    expect(await cloudSave(ID, {})).toMatchObject({ ok: false, kind: 'offline', status: 0, retentavel: true });
    expect(memoria.get('digiapp-last-cloud-sync')).toBeUndefined();
  });
});

// ───────────────────────────────────────────── 3. R-2: retry POR saveId

describe('R-2 — orçamento de retry por saveId, com teto e janela', () => {
  /** Espera instantânea, gravando os atrasos pedidos. */
  function relogioFalso() {
    const atrasos: number[] = [];
    return { atrasos, esperar: async (ms: number) => { atrasos.push(ms); } };
  }

  it('5xx retenta com backoff crescente e para no teto do saveId', async () => {
    const chamadas = servidorFixo(500);
    const { atrasos, esperar } = relogioFalso();
    const r = await cloudSaveComRetry(ID, {}, { esperar });

    expect(r.ok).toBe(false);
    // 1 tentativa original + CLOUD_SAVE_RETRY_TETO retentativas, e nunca mais.
    expect(chamadas.length).toBe(1 + CLOUD_SAVE_RETRY_TETO);
    expect(atrasos.length).toBe(CLOUD_SAVE_RETRY_TETO);
    expect(atrasos[0]).toBe(2000);
    expect(atrasos[1]).toBe(8000);
    expect(atrasos[2]).toBe(30000);
    // Teto: os atrasos seguintes não voltam a encolher.
    expect(atrasos[atrasos.length - 1]).toBe(30000);
  });

  it('o teto é do saveId, não da chamada: 3 chamadas seguidas NÃO dão 3× o teto', async () => {
    const chamadas = servidorFixo(500);
    const { esperar } = relogioFalso();
    await cloudSaveComRetry(ID, {}, { esperar });
    const depoisDaPrimeira = chamadas.length;
    await cloudSaveComRetry(ID, {}, { esperar });
    await cloudSaveComRetry(ID, {}, { esperar });
    // Cada chamada nova ainda tenta UMA vez (o jogador mutou o estado), mas o
    // orçamento de RETRY já foi gasto — sem isso seriam 3× o teto.
    expect(chamadas.length).toBe(depoisDaPrimeira + 2);
  });

  it('saveIds diferentes têm orçamentos independentes', async () => {
    const chamadas = servidorFixo(500);
    const { esperar } = relogioFalso();
    await cloudSaveComRetry(ID, {}, { esperar });
    const gastoDoPrimeiro = chamadas.length;
    await cloudSaveComRetry('b'.repeat(32), {}, { esperar });
    expect(chamadas.length).toBe(gastoDoPrimeiro * 2);
  });

  it('a janela reabre o orçamento — o teto não é vitalício', async () => {
    const chamadas = servidorFixo(500);
    const { esperar } = relogioFalso();
    let agora = 1_000_000;
    await cloudSaveComRetry(ID, {}, { esperar, agora: () => agora });
    const gasto = chamadas.length;
    agora += CLOUD_SAVE_RETRY_JANELA_MS + 1;
    await cloudSaveComRetry(ID, {}, { esperar, agora: () => agora });
    expect(chamadas.length).toBe(gasto * 2);
  });

  it('403 não gasta uma única retentativa — não é retentável', async () => {
    const chamadas = servidorFixo(403);
    const { atrasos, esperar } = relogioFalso();
    const r = await cloudSaveComRetry(ID, {}, { esperar });
    expect(chamadas.length).toBe(1);
    expect(atrasos.length).toBe(0);
    expect(r).toMatchObject({ ok: false, kind: 'identity' });
  });

  it('409 não entra em loop de retry (auto-alimentação é o risco, não o conflito)', async () => {
    const chamadas = servidorFixo(409);
    const { esperar } = relogioFalso();
    await cloudSaveComRetry(ID, {}, { esperar });
    expect(chamadas.length).toBe(1);
  });

  it('sucesso DEVOLVE o orçamento: uma falha transitória não penaliza o dia todo', async () => {
    let status = 500;
    const chamadas: number[] = [];
    vi.stubGlobal('fetch', async () => {
      chamadas.push(1);
      return status === 200 ? Response.json({ ok: true }) : Response.json({ e: 1 }, { status });
    });
    const { esperar } = relogioFalso();
    // Falha na 1ª, sucede na 1ª retentativa.
    let n = 0;
    vi.stubGlobal('fetch', async () => {
      chamadas.push(1);
      n += 1;
      return n === 1 ? Response.json({ e: 1 }, { status: 500 }) : Response.json({ ok: true });
    });
    const r = await cloudSaveComRetry(ID, {}, { esperar });
    expect(r.ok).toBe(true);

    // Agora o servidor cai de vez: o orçamento tem que estar CHEIO de novo.
    n = 99;
    const antes = chamadas.length;
    vi.stubGlobal('fetch', async () => { chamadas.push(1); return Response.json({ e: 1 }, { status: 500 }); });
    await cloudSaveComRetry(ID, {}, { esperar });
    expect(chamadas.length - antes).toBe(1 + CLOUD_SAVE_RETRY_TETO);
    void status;
  });
});
