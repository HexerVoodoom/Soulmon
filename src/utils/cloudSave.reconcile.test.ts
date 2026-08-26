/**
 * B-R1 — re-derivar o `saveId` no login, para o 403 permanente nunca acontecer.
 *
 * O problema, medido no preparo da fatia 1 (§B.2.2, Classe 1): quem nunca logou
 * tem `SAVE_ID = crypto.randomUUID()` (`GameStateContext.tsx:1043`,
 * `App.tsx:548`). Esse UUID passa no `VALID_ID` do servidor
 * (`^[a-zA-Z0-9_-]{8,64}$`), então hoje ele funciona. No instante em que a
 * fatia 1 ligar o `enforced: true`, o servidor compara `emailToSaveId(email)`
 * com o UUID, não bate, e devolve **403**. E a tabela da ADR manda "não
 * retentar; forçar re-login" — só que **re-login não conserta**, porque o erro
 * não está no token, está no `SAVE_ID` gravado no aparelho. O jogador entra num
 * laço de "faça login" → "já estou logado" → 403, para sempre.
 *
 * A decisão do dono é re-derivar no login: recalcular o `saveId` a partir do
 * e-mail autenticado e reapontar o save local para a chave nova, SUBINDO o
 * estado que a pessoa já tinha.
 *
 * ## As duas decisões de dado que estes casos travam
 *
 * **1. Chave derivada VAZIA na nuvem → migra, não adota.** O estado local é o
 * único que existe: reaponta a identidade e sobe. Ninguém perde nada.
 *
 * **2. Chave derivada JÁ OCUPADA na nuvem + estado local sob o UUID → a NUVEM
 * ganha, e o local vai para um backup.** O motivo é assimetria de reversão:
 * sobrescrever a nuvem destrói o progresso de OUTRO aparelho de forma
 * irrecuperável (o servidor não versiona — `save.js:101` é um `put` cego); já
 * "perder" o estado local é recuperável, porque este código o guarda byte a
 * byte antes de trocar. É a mesma decisão que o app já tomou em
 * `App.tsx:872-877` ("apagar o save antigo de alguém seria bem pior do que
 * perder o progresso local recente") — não é regra nova, é a regra existente
 * aplicada ao caminho que faltava.
 *
 * **3. A chave antiga (UUID) NUNCA é apagada.** Nem local nem na nuvem. O
 * cliente só para de escrever nela e registra o id anterior, para que qualquer
 * recuperação manual continue possível. Apagar dado de jogador em produção como
 * efeito colateral de uma migração de identidade é exatamente o tipo de coisa
 * que não tem volta.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  emailToSaveId,
  reconcileSaveId,
  RECONCILE_KEYS,
  __resetRetryBudgets,
} from './cloudSave';

const EMAIL = 'jogadora@exemplo.com';
const UUID_ANTIGO = '3f1c2b8a-77aa-4d1e-9f0b-5c6d7e8f9a01';
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

/**
 * Servidor de mentira com um mapa de saves. Registra todo POST para os casos
 * poderem afirmar O QUE subiu e SOB QUAL chave.
 */
function servidor(nuvem: Record<string, unknown> = {}) {
  const posts: Array<{ id: string; state: unknown }> = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const id = new URL(url, 'https://x').searchParams.get('id')!;
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { state: unknown };
      posts.push({ id, state: body.state });
      nuvem[id] = body.state;
      return Response.json({ ok: true });
    }
    return id in nuvem
      ? Response.json({ found: true, state: nuvem[id] })
      : Response.json({ found: false });
  });
  return { posts, nuvem };
}

// ──────────────────────────────── caminho 1: quem NUNCA logou (o do 403)

describe('quem nunca logou: UUID local + login → migra para a chave derivada', () => {
  it('reaponta o SAVE_ID para emailToSaveId e NÃO fica com o UUID', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    servidor();

    const r = await reconcileSaveId(EMAIL, { gamePoints: 7 });

    expect(r.estado).toBe('migrado');
    expect(memoria.get('digiapp-save-id')).toBe(await emailToSaveId(EMAIL));
    expect(memoria.get('digiapp-save-id')).not.toBe(UUID_ANTIGO);
  });

  it('SOBE o estado que a pessoa já tinha, sob a chave nova — progresso não some', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    const { posts } = servidor();

    await reconcileSaveId(EMAIL, { gamePoints: 7, evolutionStage: 'champion' });

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe(await emailToSaveId(EMAIL));
    expect(posts[0].state).toMatchObject({ gamePoints: 7, evolutionStage: 'champion' });
  });

  it('grava o e-mail e guarda o id anterior — a chave antiga não é apagada', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    servidor();

    await reconcileSaveId(EMAIL, { gamePoints: 7 });

    expect(memoria.get('digiapp-user-email')).toBe(EMAIL);
    expect(memoria.get(RECONCILE_KEYS.PREVIOUS_SAVE_ID)).toBe(UUID_ANTIGO);
  });

  it('o resultado nomeia o id anterior, para o app poder registrar/diagnosticar', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    servidor();
    const r = await reconcileSaveId(EMAIL, {});
    expect(r).toMatchObject({ estado: 'migrado', anterior: UUID_ANTIGO });
  });
});

// ──────────────────────────────── caminho 2: já existe save na chave derivada

describe('conflito: chave derivada JÁ ocupada + estado local sob o UUID', () => {
  it('adota o save da NUVEM (o outro aparelho não pode ser destruído)', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    memoria.set('digiapp_state_v3', JSON.stringify({ gamePoints: 1 }));
    const derivado = await emailToSaveId(EMAIL);
    servidor({ [derivado]: { gamePoints: 500, evolutionStage: 'ultra' } });

    const r = await reconcileSaveId(EMAIL, { gamePoints: 1 });

    expect(r.estado).toBe('adotado');
    expect(JSON.parse(memoria.get('digiapp_state_v3')!)).toMatchObject({ gamePoints: 500 });
    expect(memoria.get('digiapp-save-id')).toBe(derivado);
  });

  it('NÃO sobrescreve a nuvem com o estado local — nenhum POST na adoção', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    const derivado = await emailToSaveId(EMAIL);
    const { posts } = servidor({ [derivado]: { gamePoints: 500 } });

    await reconcileSaveId(EMAIL, { gamePoints: 1 });

    expect(posts).toHaveLength(0);
  });

  it('GUARDA o estado local antes de trocar — nada é perdido em nenhum caminho', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    const derivado = await emailToSaveId(EMAIL);
    servidor({ [derivado]: { gamePoints: 500 } });

    await reconcileSaveId(EMAIL, { gamePoints: 1, tasks: ['correr'] });

    const backup = JSON.parse(memoria.get(RECONCILE_KEYS.CONFLICT_BACKUP)!);
    expect(backup.saveId).toBe(UUID_ANTIGO);
    expect(backup.state).toMatchObject({ gamePoints: 1, tasks: ['correr'] });
  });
});

// ──────────────────────────────── caminho 3: quem JÁ está logado hoje

describe('quem já está logado hoje NÃO pode ser mexido', () => {
  it('SAVE_ID já derivado → sem-mudanca, sem rede, sem reescrita', async () => {
    const derivado = await emailToSaveId(EMAIL);
    memoria.set('digiapp-save-id', derivado);
    const chamadas: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => { chamadas.push(url); return Response.json({ found: false }); });

    const r = await reconcileSaveId(EMAIL, { gamePoints: 9 });

    expect(r).toMatchObject({ estado: 'sem-mudanca', saveId: derivado });
    expect(chamadas).toHaveLength(0);
    expect(memoria.get(RECONCILE_KEYS.PREVIOUS_SAVE_ID)).toBeUndefined();
  });

  it('caixa e espaços no e-mail não fazem o alinhado parecer desalinhado', async () => {
    memoria.set('digiapp-save-id', await emailToSaveId(EMAIL));
    vi.stubGlobal('fetch', async () => { throw new Error('não deveria ir à rede'); });
    expect((await reconcileSaveId('  Jogadora@Exemplo.COM ', {})).estado).toBe('sem-mudanca');
  });
});

// ──────────────────────────────── caminho 4: degradação

describe('degradação — nunca deixar o app apontado para um save que não existe', () => {
  it('e-mail vazio não move nada', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    vi.stubGlobal('fetch', async () => { throw new Error('não deveria ir à rede'); });
    expect((await reconcileSaveId('   ', {})).estado).toBe('sem-email');
    expect(memoria.get('digiapp-save-id')).toBe(UUID_ANTIGO);
  });

  it('storage recusando a gravação: a IDENTIDADE não troca (dado antes de id)', async () => {
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    servidor();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (k === 'digiapp-save-id') throw new DOMException('cheio', 'QuotaExceededError');
        memoria.set(k, v);
      },
      removeItem: (k: string) => { memoria.delete(k); },
    });

    const r = await reconcileSaveId(EMAIL, { gamePoints: 7 });

    expect(r.estado).toBe('storage');
    expect(memoria.get('digiapp-save-id')).toBe(UUID_ANTIGO);
  });

  it('nuvem fora do ar na LEITURA não migra às cegas — 500 não é "chave vazia"', async () => {
    // Tratar 500 como "não existe save lá" faria o cliente SOBRESCREVER o save
    // do outro aparelho assim que a rede voltasse. Dúvida não migra.
    memoria.set('digiapp-save-id', UUID_ANTIGO);
    const posts: unknown[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') { posts.push(url); return Response.json({ ok: true }); }
      return Response.json({ error: 'kv down' }, { status: 500 });
    });

    const r = await reconcileSaveId(EMAIL, { gamePoints: 7 });

    expect(r.estado).toBe('indeterminado');
    expect(memoria.get('digiapp-save-id')).toBe(UUID_ANTIGO);
    expect(posts).toHaveLength(0);
  });
});
