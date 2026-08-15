/**
 * RODADA 8 — o que o OVERLAY MOSTRA, não o fato de ele ter carregado.
 *
 * Medido na rodada 7: `cloudSync.ts` matava 27,4% dos mutantes. O bloco de
 * tabelas copiadas (`cloudSync.test.ts`) morre direitinho; o resto do arquivo —
 * que é justamente onde o save do jogador vira pixel na barra de tarefas —
 * não tinha um único teste. `fetchRemoteSnapshot`, `fetchWallet` e
 * `isAuthRequired` nunca haviam sido chamados com uma resposta HTTP nas mãos.
 *
 * A consequência de um defeito aqui não é erro: é um jogador PLAUSÍVEL E
 * ERRADO. Trocar `hearts: 1` por `hearts: 0` num save sem HP mostra um pet
 * morto para quem está bem; trocar `401 || 403` por `&&` manda "sem conexão"
 * para quem só precisa logar de novo.
 *
 * Por isso cada caso aqui descreve um CENÁRIO DE JOGADOR e afirma o CONTEÚDO do
 * snapshot, com número CRU na expectativa (a expectativa derivada da constante
 * que o teste deveria auditar foi a doença das rodadas 5, 6 e 7).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchRemoteSnapshot,
  fetchWallet,
  isAuthRequired,
  pushCareAction,
  normalizeForRules,
  isSaneCareState,
} from './cloudSync';

const EMAIL = 'mateus@exemplo.com';

/** Uma resposta HTTP de verdade — status e corpo, como o servidor manda. */
function resposta(status: number, body: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** O `fetch` responde a mesma coisa para toda chamada. */
function servidorResponde(...respostas: Array<() => Response | Promise<Response>>) {
  const chamadas: Array<{ url: string; init?: RequestInit }> = [];
  let i = 0;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    chamadas.push({ url: String(input), init });
    const fn = respostas[Math.min(i, respostas.length - 1)];
    i += 1;
    return fn();
  });
  return chamadas;
}

/** O save como ele chega de `/api/save`. */
const saveNaNuvem = (state: Record<string, unknown>) => () => resposta(200, { found: true, state });

beforeEach(() => {
  vi.stubGlobal('window', { soulmonDesktop: undefined });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

// ───────────────────────────────────────────── o save vira o que aparece na tela

describe('save da nuvem → o que o overlay mostra', () => {
  it('mega com 2,5 corações e 3 de energia aparece como 2,5/4 e 3/6', async () => {
    servidorResponde(saveNaNuvem({
      evolutionStage: 'mega-virus', healthPoints: 2.5, energyPoints: 3,
    }));
    const r = await fetchRemoteSnapshot(EMAIL);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.snapshot.stage).toBe('mega-virus');
    expect(r.snapshot.hearts).toBe(2.5);
    expect(r.snapshot.maxHearts).toBe(4);   // número CRU: mega tem 4 corações
    expect(r.snapshot.energy).toBe(3);
    expect(r.snapshot.maxEnergy).toBe(6);   // mega exige 6 tarefas = 6 barras
  });

  it('rookie recém-nascido aparece como 3/3 corações e 0/4 de energia', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'rookie', healthPoints: 3, energyPoints: 0 }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.hearts).toBe(3);
    expect(r.snapshot.maxHearts).toBe(3);
    expect(r.snapshot.energy).toBe(0);
    expect(r.snapshot.maxEnergy).toBe(4);
  });

  it('champion e ultimate mostram 3 corações e 5 barras', async () => {
    for (const stage of ['champion-data', 'ultimate-vaccine']) {
      servidorResponde(saveNaNuvem({ evolutionStage: stage, healthPoints: 1, energyPoints: 5 }));
      const r = await fetchRemoteSnapshot(EMAIL);
      if (!r.ok) throw new Error('esperava snapshot');
      expect(r.snapshot.maxHearts, stage).toBe(3);
      expect(r.snapshot.maxEnergy, stage).toBe(5);
    }
  });

  it('ultra mostra 5 corações e 6 barras', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'ultra', healthPoints: 5, energyPoints: 6 }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.maxHearts).toBe(5);
    expect(r.snapshot.maxEnergy).toBe(6);
  });

  it('estágio desconhecido (save de outra versão) é tratado como rookie, não some', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'lenda-suprema', healthPoints: 2 }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stage).toBe('lenda-suprema'); // o id cru é preservado
    expect(r.snapshot.maxHearts).toBe(3);           // mas a régua é a de rookie
    expect(r.snapshot.maxEnergy).toBe(4);
  });

  it('save SEM estágio nenhum vira rookie com nome de exibição padrão', async () => {
    servidorResponde(saveNaNuvem({ healthPoints: 2 }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stage).toBe('rookie');
    expect(r.snapshot.stageName).toBe('Soulmon');
  });

  it('save SEM HP mostra 1 coração — não 0 (pet morto) e não a barra cheia', async () => {
    // O overlay não pode inventar que o jogador está bem nem que está morrendo.
    servidorResponde(saveNaNuvem({ evolutionStage: 'rookie' }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.hearts).toBe(1);
    expect(r.snapshot.energy).toBe(0);
  });

  it('HP/energia com TIPO errado (string) caem no mesmo padrão de ausência', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'rookie', healthPoints: '3', energyPoints: '2' }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.hearts).toBe(1);
    expect(r.snapshot.energy).toBe(0);
  });

  it('HP zerado (pet degenerando) aparece como 0, não como o padrão 1', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'rookie', healthPoints: 0, energyPoints: 0 }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.hearts).toBe(0);
  });

  it('a pastinha de comida chega inteira; sem pastinha, chega vazia', async () => {
    servidorResponde(saveNaNuvem({ foodInventory: { '🍎': 2, '💗': 1 } }));
    const a = await fetchRemoteSnapshot(EMAIL);
    if (!a.ok) throw new Error('esperava snapshot');
    expect(a.snapshot.foodInventory).toEqual({ '🍎': 2, '💗': 1 });

    servidorResponde(saveNaNuvem({}));
    const b = await fetchRemoteSnapshot(EMAIL);
    if (!b.ok) throw new Error('esperava snapshot');
    expect(b.snapshot.foodInventory).toEqual({});
  });
});

// ───────────────────────────────────────────────────── linha de sprite genérica

describe('linha de sprite: o overlay nunca desenha um bicho de terceiro', () => {
  it('as três linhas próprias passam intactas', async () => {
    for (const linha of ['tapirmon', 'veemon', 'salamon']) {
      servidorResponde(saveNaNuvem({ eggType: linha }));
      const r = await fetchRemoteSnapshot(EMAIL);
      if (!r.ok) throw new Error('esperava snapshot');
      expect(r.snapshot.genericLine, linha).toBe(linha);
    }
  });

  it('linha legada/desconhecida e ausência caem em tapirmon', async () => {
    for (const linha of ['agumon', '', null, undefined, 7]) {
      servidorResponde(saveNaNuvem({ eggType: linha }));
      const r = await fetchRemoteSnapshot(EMAIL);
      if (!r.ok) throw new Error('esperava snapshot');
      expect(r.snapshot.genericLine, String(linha)).toBe('tapirmon');
    }
  });
});

// ─────────────────────────────────────────────── nome da forma na árvore única

describe('nome da forma vem da árvore ÚNICA do jogador', () => {
  const arvore = [
    { stage: 'rookie', name: 'Fagulhito' },
    { stage: 'champion', branch: 'virus', name: 'Fagulharco' },
    { stage: 'champion', branch: 'data', name: 'Fagulhadus' },
  ];

  it('casa nível + galho: champion-data mostra o nome do galho data', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'champion-data', soulmonStages: arvore }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Fagulhadus');
  });

  it('casa nível + galho: champion-virus mostra o OUTRO nome', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'champion-virus', soulmonStages: arvore }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Fagulharco');
  });

  it('estágio sem galho (rookie) casa só pelo nível', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'rookie', soulmonStages: arvore }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Fagulhito');
  });

  it('nível que a árvore não tem cai no nome-base do oráculo', async () => {
    servidorResponde(saveNaNuvem({
      evolutionStage: 'mega-virus', soulmonStages: arvore, soulmonMeta: { baseName: 'Fagulha' },
    }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Fagulha');
  });

  it('sem árvore e sem nome-base, mostra "Soulmon" — nunca undefined na tela', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'rookie', soulmonStages: 'lixo' }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Soulmon');
  });

  it('árvore que guarda o NÍVEL sem galho casa com qualquer galho daquele nível', async () => {
    // O oráculo nem sempre grava `branch`. Sem esta tolerância, quem evoluiu
    // para mega-virus perde o nome da própria forma e vira o nome-base.
    servidorResponde(saveNaNuvem({
      evolutionStage: 'mega-virus',
      soulmonStages: [{ stage: 'mega', name: 'Fagulhomega' }],
      soulmonMeta: { baseName: 'Fagulha' },
    }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Fagulhomega');
  });

  it('forma da árvore SEM nome cai no nome-base em vez de mostrar vazio', async () => {
    servidorResponde(saveNaNuvem({
      evolutionStage: 'rookie', soulmonStages: [{ stage: 'rookie' }], soulmonMeta: { baseName: 'Fagulha' },
    }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.stageName).toBe('Fagulha');
  });

  it('personagem de demo é identificado; save normal não inventa um', async () => {
    servidorResponde(saveNaNuvem({ demoCharacterId: 'kaelen' }));
    const a = await fetchRemoteSnapshot(EMAIL);
    if (!a.ok) throw new Error('esperava snapshot');
    expect(a.snapshot.demoCharacterId).toBe('kaelen');

    servidorResponde(saveNaNuvem({ demoCharacterId: 42 }));
    const b = await fetchRemoteSnapshot(EMAIL);
    if (!b.ok) throw new Error('esperava snapshot');
    expect(b.snapshot.demoCharacterId).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────── tarefas pendentes

describe('lista de tarefas do overlay', () => {
  it('mostra só as pendentes de hoje, na ordem do app', async () => {
    servidorResponde(saveNaNuvem({
      tasks: [
        { id: 't1', name: 'Ler', emoji: '📚', completed: false },
        { id: 't2', name: 'Correr', emoji: '🏃', completed: true },
        { id: 't3', name: 'Beber água', emoji: '💧' },
      ],
    }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.tasks).toEqual([
      { id: 't1', name: 'Ler', emoji: '📚' },
      { id: 't3', name: 'Beber água', emoji: '💧' },
    ]);
  });

  it('tarefa sem emoji ganha ✅; tarefa sem id ou sem nome é descartada', async () => {
    servidorResponde(saveNaNuvem({
      tasks: [
        { id: 't1', name: 'Ler' },
        { name: 'Sem id' },
        { id: 't9' },
        null,
        'texto solto',
      ],
    }));
    const r = await fetchRemoteSnapshot(EMAIL);
    if (!r.ok) throw new Error('esperava snapshot');
    expect(r.snapshot.tasks).toEqual([{ id: 't1', name: 'Ler', emoji: '✅' }]);
  });

  it('`tasks` com tipo hostil vira lista vazia, não derruba o overlay', async () => {
    for (const tasks of [{}, 'x', 3, null, undefined]) {
      servidorResponde(saveNaNuvem({ tasks }));
      const r = await fetchRemoteSnapshot(EMAIL);
      if (!r.ok) throw new Error('esperava snapshot');
      expect(r.snapshot.tasks, JSON.stringify(tasks)).toEqual([]);
    }
  });
});

// ─────────────────────────────────────────────────── o que o servidor responde

describe('resposta do servidor → o motivo certo para o usuário', () => {
  it('401 e 403 pedem LOGIN (não "sem conexão")', async () => {
    for (const status of [401, 403]) {
      servidorResponde(() => resposta(status, { error: 'nope' }));
      const r = await fetchRemoteSnapshot(EMAIL);
      expect(r, String(status)).toEqual({ ok: false, reason: 'unauthenticated' });
    }
  });

  it('500/404 são REDE — nunca pedido de login', async () => {
    for (const status of [404, 500, 502]) {
      servidorResponde(() => resposta(status, { error: 'nope' }));
      const r = await fetchRemoteSnapshot(EMAIL);
      expect(r, String(status)).toEqual({ ok: false, reason: 'network' });
    }
  });

  it('conexão caída é REDE', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    expect(await fetchRemoteSnapshot(EMAIL)).toEqual({ ok: false, reason: 'network' });
  });

  it('200 sem save (`found: false`) é "não encontrado" — não é erro de rede', async () => {
    servidorResponde(() => resposta(200, { found: false }));
    expect(await fetchRemoteSnapshot(EMAIL)).toEqual({ ok: false, reason: 'not-found' });
  });

  it('200 com `found: true` mas sem `state` também é "não encontrado"', async () => {
    servidorResponde(() => resposta(200, { found: true }));
    expect(await fetchRemoteSnapshot(EMAIL)).toEqual({ ok: false, reason: 'not-found' });
  });

  it('200 com corpo ilegível é "não encontrado", não uma exceção', async () => {
    vi.stubGlobal('fetch', async () => new Response('isto não é json', { status: 200 }));
    expect(await fetchRemoteSnapshot(EMAIL)).toEqual({ ok: false, reason: 'not-found' });
  });

  it('`found: false` COM state junto continua sendo "não encontrado"', async () => {
    // O `found` é a resposta do servidor sobre existir save; um `state` residual
    // no corpo não pode transformar isso em "achei".
    servidorResponde(() => resposta(200, { found: false, state: { healthPoints: 3 } }));
    expect(await fetchRemoteSnapshot(EMAIL)).toEqual({ ok: false, reason: 'not-found' });
  });
});

describe('sessão do Electron vai junto na requisição', () => {
  it('com sessão, manda Bearer; a URL leva o saveId derivado do e-mail', async () => {
    vi.stubGlobal('window', { soulmonDesktop: { getAuth: async () => ({ token: 'tok-123' }) } });
    const chamadas = servidorResponde(saveNaNuvem({ healthPoints: 1 }));
    await fetchRemoteSnapshot(EMAIL);

    const { emailToSaveId } = await import('./cloudSync');
    expect(new URL(chamadas[0].url).searchParams.get('id')).toBe(await emailToSaveId(EMAIL));
    expect((chamadas[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  it('sem sessão, NÃO manda Authorization (servidor sem login precisa aceitar)', async () => {
    const chamadas = servidorResponde(saveNaNuvem({ healthPoints: 1 }));
    await fetchRemoteSnapshot(EMAIL);
    expect((chamadas[0].init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────── carteira

describe('carteira (Créditos) lida do servidor', () => {
  it('conta paga com 60 créditos aparece como paga, com 60', async () => {
    servidorResponde(() => resposta(200, { tier: 'paid', credits: 60 }));
    expect(await fetchWallet(EMAIL)).toEqual({ tier: 'paid', credits: 60 });
  });

  it('qualquer coisa diferente de "paid" é demo — o cliente nunca promove a conta', async () => {
    for (const tier of ['demo', 'PAID', 'free', undefined, null, 1]) {
      servidorResponde(() => resposta(200, { tier, credits: 0 }));
      expect(await fetchWallet(EMAIL), String(tier)).toEqual({ tier: 'demo', credits: 0 });
    }
  });

  it('crédito em string vira número; lixo vira 0 — nunca NaN na tela', async () => {
    servidorResponde(() => resposta(200, { tier: 'paid', credits: '50' }));
    expect(await fetchWallet(EMAIL)).toEqual({ tier: 'paid', credits: 50 });

    for (const credits of ['abc', undefined, null, {}]) {
      servidorResponde(() => resposta(200, { tier: 'paid', credits }));
      expect(await fetchWallet(EMAIL), String(credits)).toEqual({ tier: 'paid', credits: 0 });
    }
  });

  it('corpo `null` não derruba a carteira — vira conta demo com 0 crédito', async () => {
    // `res.json()` de um corpo "null" devolve null. Sem o `?.`, ler `.tier` aí
    // lança e a carteira inteira some da tela.
    servidorResponde(() => resposta(200, null));
    expect(await fetchWallet(EMAIL)).toEqual({ tier: 'demo', credits: 0 });
  });

  it('erro do servidor e queda de rede devolvem null (a UI esconde o saldo)', async () => {
    servidorResponde(() => resposta(500, { error: 'x' }));
    expect(await fetchWallet(EMAIL)).toBeNull();

    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    expect(await fetchWallet(EMAIL)).toBeNull();
  });
});

// ───────────────────────────────────────────────────────── exigência de login

describe('o servidor exige login?', () => {
  it('só responde NÃO quando o servidor diz explicitamente `authRequired: false`', async () => {
    servidorResponde(() => resposta(200, { authRequired: false }));
    expect(await isAuthRequired()).toBe(false);
  });

  it('na dúvida (campo ausente, corpo estranho, 500, rede caída) responde SIM', async () => {
    for (const body of [{ authRequired: true }, {}, { authRequired: 'false' }, { authRequired: 0 }]) {
      servidorResponde(() => resposta(200, body));
      expect(await isAuthRequired(), JSON.stringify(body)).toBe(true);
    }
    servidorResponde(() => resposta(500, {}));
    expect(await isAuthRequired()).toBe(true);

    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    expect(await isAuthRequired()).toBe(true);
  });
});

// ────────────────────────────────────── proteção da escrita (conteúdo, não fato)

describe('normalizeForRules devolve os números que as regras leem', () => {
  it('completa o save mínimo com valores exatos', () => {
    const n = normalizeForRules({ evolutionStage: 'rookie' });
    expect(n.healthPoints).toBe(1);
    expect(n.maxHealthPoints).toBe(3);
    expect(n.energyPoints).toBe(0);
    expect(n.foodInventory).toEqual({});
    expect(n.virusPoints).toBe(0);
    expect(n.dataPoints).toBe(0);
    expect(n.vaccinePoints).toBe(0);
    expect(n.totalXP).toBe(0);
    expect(n.attributesSinceLastEvolution).toEqual({ virus: 0, data: 0, vaccine: 0 });
  });

  it('HP 0 é preservado (pet degenerando não pode virar 1 coração de graça)', () => {
    expect(normalizeForRules({ healthPoints: 0 }).healthPoints).toBe(0);
    expect(normalizeForRules({ energyPoints: 0 }).energyPoints).toBe(0);
  });

  it('HP não-numérico vira 1, e o teto sai do ESTÁGIO', () => {
    expect(normalizeForRules({ healthPoints: '2' }).healthPoints).toBe(1);
    expect(normalizeForRules({ healthPoints: null }).healthPoints).toBe(1);
    expect(normalizeForRules({ evolutionStage: 'ultra' }).maxHealthPoints).toBe(5);
    expect(normalizeForRules({ evolutionStage: 'champion-data' }).maxHealthPoints).toBe(3);
    expect(normalizeForRules({ evolutionStage: 42 }).maxHealthPoints).toBe(3);
  });

  it('atributos em string viram número; o resto do save fica intacto', () => {
    const n = normalizeForRules({
      virusPoints: '7', dataPoints: 'x', totalXP: '420',
      perfectDays: 9, soulGoal: 'dormir melhor', tasks: [{ id: 't1' }],
    });
    expect(n.virusPoints).toBe(7);
    expect(n.dataPoints).toBe(0);
    expect(n.totalXP).toBe(420);
    expect(n.perfectDays).toBe(9);
    expect(n.soulGoal).toBe('dormir melhor');
    expect(n.tasks).toEqual([{ id: 't1' }]);
  });
});

describe('isSaneCareState nas FRONTEIRAS (é o que decide gravar ou não)', () => {
  const base = {
    healthPoints: 1, maxHealthPoints: 3, energyPoints: 0,
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
  };

  it('HP exatamente 0 é ACEITO — degeneração é estado legítimo do jogo', () => {
    expect(isSaneCareState({ ...base, healthPoints: 0 })).toBe(true);
  });

  it('HP negativo é recusado', () => {
    expect(isSaneCareState({ ...base, healthPoints: -0.5 })).toBe(false);
  });

  it('item com quantidade exatamente 0 é ACEITO (comeu o último)', () => {
    expect(isSaneCareState({ ...base, foodInventory: { '🍎': 0 } })).toBe(true);
  });

  it('quantidade negativa ou NaN na pastinha é recusada', () => {
    expect(isSaneCareState({ ...base, foodInventory: { '🍎': -1 } })).toBe(false);
    expect(isSaneCareState({ ...base, foodInventory: { '🍎': NaN } })).toBe(false);
  });

  it('QUALQUER um dos sete números faltando ou NaN reprova o estado', () => {
    for (const k of Object.keys(base)) {
      expect(isSaneCareState({ ...base, [k]: NaN }), `${k} NaN`).toBe(false);
      const semCampo = { ...base } as Record<string, unknown>;
      delete semCampo[k];
      expect(isSaneCareState(semCampo), `${k} ausente`).toBe(false);
    }
  });

  it('pastinha ausente não reprova (save antigo continua podendo receber carinho)', () => {
    expect(isSaneCareState({ ...base })).toBe(true);
  });
});

// ───────────────────────────────────────── escrita de volta: motivos e conteúdo

describe('pushCareAction: quando NÃO grava, e por quê', () => {
  it('a regra desistiu (acabou a comida) → "refused", e nada é gravado', async () => {
    const chamadas = servidorResponde(saveNaNuvem({ healthPoints: 1 }));
    const r = await pushCareAction(EMAIL, () => null);
    expect(r).toEqual({ ok: false, reason: 'refused' });
    expect(chamadas.filter(c => c.init?.method === 'POST')).toHaveLength(0);
  });

  it('a regra gerou NaN → "refused" e NENHUM POST (o save do jogador fica intacto)', async () => {
    // Este é o caminho que existe para impedir `JSON.stringify(NaN) === "null"`
    // apagar o progresso de alguém.
    const chamadas = servidorResponde(saveNaNuvem({ healthPoints: 1, evolutionStage: 'rookie' }));
    const r = await pushCareAction(EMAIL, (s) => ({ ...s, healthPoints: NaN }));
    expect(r).toEqual({ ok: false, reason: 'refused' });
    expect(chamadas.filter(c => c.init?.method === 'POST')).toHaveLength(0);
  });

  it('leitura com 401/403 pede login antes de tentar escrever', async () => {
    for (const status of [401, 403]) {
      const chamadas = servidorResponde(() => resposta(status, {}));
      const r = await pushCareAction(EMAIL, (s) => s);
      expect(r, String(status)).toEqual({ ok: false, reason: 'unauthenticated' });
      expect(chamadas.filter(c => c.init?.method === 'POST')).toHaveLength(0);
    }
  });

  it('save inexistente não é sobrescrito por um estado montado do zero', async () => {
    const chamadas = servidorResponde(() => resposta(200, { found: false }));
    const r = await pushCareAction(EMAIL, (s) => s);
    expect(r).toEqual({ ok: false, reason: 'not-found' });
    expect(chamadas.filter(c => c.init?.method === 'POST')).toHaveLength(0);
  });

  it('a LEITURA que falha (500) é rede, e nada é escrito por cima', async () => {
    const chamadas = servidorResponde(() => resposta(500, {}));
    expect(await pushCareAction(EMAIL, (s) => s)).toEqual({ ok: false, reason: 'network' });
    expect(chamadas.filter(c => c.init?.method === 'POST')).toHaveLength(0);
  });

  it('a LEITURA que nem acontece (rede caída) é rede', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    expect(await pushCareAction(EMAIL, (s) => s)).toEqual({ ok: false, reason: 'network' });
  });

  it('leitura com corpo ilegível é "não encontrado" — não sobrescreve o save', async () => {
    const chamadas: Array<{ method?: string }> = [];
    vi.stubGlobal('fetch', async (_i: unknown, init?: RequestInit) => {
      chamadas.push({ method: init?.method });
      return new Response('isto não é json', { status: 200 });
    });
    expect(await pushCareAction(EMAIL, (s) => s)).toEqual({ ok: false, reason: 'not-found' });
    expect(chamadas.filter(c => c.method === 'POST')).toHaveLength(0);
  });

  it('leitura com `found: false` COM state junto também não vira escrita', async () => {
    const chamadas = servidorResponde(() => resposta(200, { found: false, state: { healthPoints: 3 } }));
    expect(await pushCareAction(EMAIL, (s) => s)).toEqual({ ok: false, reason: 'not-found' });
    expect(chamadas.filter(c => c.init?.method === 'POST')).toHaveLength(0);
  });

  it('a ESCRITA rejeitada com 401/403 pede login; com 500, é rede', async () => {
    const leitura = saveNaNuvem({ healthPoints: 1, evolutionStage: 'rookie' });
    for (const [status, reason] of [[401, 'unauthenticated'], [403, 'unauthenticated'], [500, 'network']] as const) {
      servidorResponde(leitura, () => resposta(status, {}));
      const r = await pushCareAction(EMAIL, (s) => ({ ...s, healthPoints: 2 }));
      expect(r, String(status)).toEqual({ ok: false, reason });
    }
  });

  it('conexão que cai NO MEIO da escrita vira rede, não sucesso', async () => {
    let n = 0;
    vi.stubGlobal('fetch', async () => {
      n += 1;
      if (n === 1) return resposta(200, { found: true, state: { healthPoints: 1, evolutionStage: 'rookie' } });
      throw new Error('offline');
    });
    expect(await pushCareAction(EMAIL, (s) => ({ ...s, healthPoints: 2 })))
      .toEqual({ ok: false, reason: 'network' });
  });
});

describe('pushCareAction: o que a regra recebe e o que volta para a tela', () => {
  it('a regra recebe o save JÁ normalizado (sem isso, Math.min(undefined) vira NaN)', async () => {
    servidorResponde(saveNaNuvem({ evolutionStage: 'mega-data', perfectDays: 5 }), () => resposta(200, { ok: true }));
    const vistos: Array<Record<string, unknown>> = [];
    await pushCareAction(EMAIL, (s) => { vistos.push(s); return s; });

    expect(vistos).toHaveLength(1);
    expect(vistos[0].maxHealthPoints).toBe(4);
    expect(vistos[0].healthPoints).toBe(1);
    expect(vistos[0].energyPoints).toBe(0);
    expect(vistos[0].perfectDays).toBe(5); // o resto do save chega inteiro
  });

  it('o snapshot devolvido é o estado DEPOIS da ação, não o de antes', async () => {
    servidorResponde(
      saveNaNuvem({ evolutionStage: 'mega-virus', healthPoints: 1, energyPoints: 0, foodInventory: { '🍎': 2 } }),
      () => resposta(200, { ok: true }),
    );
    const r = await pushCareAction(EMAIL, (s) => ({
      ...s, healthPoints: 2, energyPoints: 1, foodInventory: { '🍎': 1 },
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.snapshot.hearts).toBe(2);
    expect(r.snapshot.maxHearts).toBe(4);
    expect(r.snapshot.energy).toBe(1);
    expect(r.snapshot.maxEnergy).toBe(6);
    expect(r.snapshot.foodInventory).toEqual({ '🍎': 1 });
  });

  /**
   * `snapshotOf` é uma SEGUNDA montagem do snapshot, irmã da que
   * `fetchRemoteSnapshot` faz. Duas cópias da mesma leitura divergem em
   * silêncio (footgun 9): o overlay mostraria uma coisa ao abrir e outra
   * depois de dar comida. Os casos abaixo repetem, pela escrita, o que os de
   * cima afirmam pela leitura.
   */
  it('a linha de sprite do snapshot da ESCRITA segue a mesma regra da leitura', async () => {
    for (const [salvo, esperado] of [
      ['veemon', 'veemon'], ['salamon', 'salamon'], ['tapirmon', 'tapirmon'],
      ['agumon', 'tapirmon'], [undefined, 'tapirmon'],
    ] as const) {
      servidorResponde(
        saveNaNuvem({ evolutionStage: 'rookie', healthPoints: 1, eggType: salvo }),
        () => resposta(200, { ok: true }),
      );
      const r = await pushCareAction(EMAIL, (s) => ({ ...s, healthPoints: 2 }));
      if (!r.ok) throw new Error('esperava sucesso');
      expect(r.snapshot.genericLine, String(salvo)).toBe(esperado);
    }
  });

  it('save sem HP/energia sai da escrita com 1 coração e 0 de energia', async () => {
    // `normalizeForRules` preenche antes da regra rodar, então o snapshot da
    // escrita nunca vê um HP ausente — o `: 1` de `snapshotOf` é rede de
    // segurança inalcançável (`isSaneCareState` já barraria). O que se afirma
    // aqui é o número que chega na barra: 1 de 3, 0 de 4.
    servidorResponde(
      saveNaNuvem({ evolutionStage: 'rookie' }),
      () => resposta(200, { ok: true }),
    );
    const r = await pushCareAction(EMAIL, (s) => s);
    if (!r.ok) throw new Error('esperava sucesso');
    expect(r.snapshot.hearts).toBe(1);
    expect(r.snapshot.energy).toBe(0);
    expect(r.snapshot.maxHearts).toBe(3);
    expect(r.snapshot.maxEnergy).toBe(4);
  });

  it('personagem de demo e nome da forma aparecem no snapshot da escrita', async () => {
    servidorResponde(
      saveNaNuvem({
        evolutionStage: 'champion-data', healthPoints: 2, demoCharacterId: 'orrin',
        soulmonStages: [{ stage: 'champion', branch: 'data', name: 'Fagulhadus' }],
      }),
      () => resposta(200, { ok: true }),
    );
    const r = await pushCareAction(EMAIL, (s) => ({ ...s, energyPoints: 2 }));
    if (!r.ok) throw new Error('esperava sucesso');
    expect(r.snapshot.demoCharacterId).toBe('orrin');
    expect(r.snapshot.stageName).toBe('Fagulhadus');
    expect(r.snapshot.stage).toBe('champion-data');
    expect(r.snapshot.energy).toBe(2);
  });

  it('demoCharacterId com tipo errado não vira personagem de demo na escrita', async () => {
    servidorResponde(
      saveNaNuvem({ evolutionStage: 'rookie', healthPoints: 1, demoCharacterId: 42 }),
      () => resposta(200, { ok: true }),
    );
    const r = await pushCareAction(EMAIL, (s) => ({ ...s, healthPoints: 2 }));
    if (!r.ok) throw new Error('esperava sucesso');
    expect(r.snapshot.demoCharacterId).toBeUndefined();
  });

  it('o corpo do POST leva o estado novo e o mesmo id da URL', async () => {
    const chamadas = servidorResponde(
      saveNaNuvem({ evolutionStage: 'rookie', healthPoints: 1 }),
      () => resposta(200, { ok: true }),
    );
    await pushCareAction(EMAIL, (s) => ({ ...s, healthPoints: 3 }));

    const post = chamadas.find(c => c.init?.method === 'POST')!;
    const body = JSON.parse(String(post.init!.body));
    const { emailToSaveId } = await import('./cloudSync');
    const id = await emailToSaveId(EMAIL);
    expect(body.id).toBe(id);
    expect(new URL(post.url).searchParams.get('id')).toBe(id);
    expect(body.state.healthPoints).toBe(3);
    expect((post.init!.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});
