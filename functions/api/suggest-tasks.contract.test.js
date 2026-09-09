/**
 * `/api/suggest-tasks` — o que SAI do modelo, e o que VAI para ele.
 *
 * A rota já tinha teste (`aiRoutes.release.test.js`), mas só do CONTADOR: a
 * ordem entre a checagem de chave e o portão de volume, e quem consome cota.
 * Está escrito lá, com todas as letras: *"o que se mede aqui é o CONTADOR,
 * nunca o corpo da resposta."*
 *
 * O corpo é justamente o que ninguém afirmava (medido em 09/09/2026), e ele
 * tem dois lados perigosos:
 *
 *  · **A ENTRADA sai daqui.** `goalText` é texto livre em que a pessoa
 *    descreve um objetivo de vida, e ele vai para um processador nos EUA. A
 *    minimização (N-3) tira identificador direto e corta em 300. Se ela sair
 *    numa refatoração, o vazamento é silencioso: a rota continua respondendo
 *    igual, e o que muda é só o que o terceiro passa a receber.
 *  · **A SAÍDA vai para o estado do jogo.** O modelo devolve JSON livre, e o
 *    resultado vira tarefa no save do jogador. `category` fora da lista
 *    quebraria o mapa de ícones do cliente; `name` sem teto entra num campo
 *    que a interface não corta.
 *
 * Este arquivo mede o corpo. O contador continua sendo assunto do outro.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost as suggest } from './suggest-tasks.js';
import { ENT_PREFIX } from './_entitlements.js';

const SAVE = 'abcdefgh12345678';

/** A lista fechada que o cliente sabe desenhar (`CATEGORY_ICONS`). */
const CATEGORIAS = ['Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness'];

function fakeEnv() {
  const store = new Map([[ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' })]]);
  return {
    GROQ_API_KEY: 'k',
    DIGIAPP_SAVES: {
      get: async k => store.get(k) ?? null,
      put: async (k, v) => { store.set(k, v); },
    },
  };
}

const pedido = corpo => new Request('https://soulmon.test/api/suggest-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: SAVE, ...corpo }),
});

/** Captura o que foi ENVIADO ao Groq, e devolve o que o teste mandar. */
let enviado;
function stubGroq(conteudo) {
  enviado = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    enviado.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ choices: [{ message: { content: conteudo } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }));
}

const sugestoes = async corpo => (await (await suggest({ request: pedido(corpo), env: fakeEnv() })).json()).suggestions;

/** O texto que foi realmente para o processador de fora. */
const promptEnviado = () => enviado[0].body.messages.map(m => m.content).join('\n');

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-08-10T12:00:00Z')); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('🔴 a ENTRADA é minimizada antes de sair para o processador de fora (N-3)', () => {
  it('e-mail e telefone no objetivo NÃO chegam ao Groq', async () => {
    stubGroq('[]');
    await sugestoes({ goalText: 'quero falar mais com joao.silva@exemplo.com, tel 11 98765-4321' });
    const texto = promptEnviado();
    expect(texto).not.toContain('joao.silva@exemplo.com');
    expect(texto).not.toContain('98765-4321');
  });

  it('o objetivo é cortado em 300 — texto livre não tem teto por si', async () => {
    stubGroq('[]');
    await sugestoes({ goalText: 'a'.repeat(5000) });
    // Sobra o prompt de sistema em volta; o que se mede é a maior sequência do
    // texto do usuário que sobreviveu.
    const maior = (promptEnviado().match(/a+/g) || []).reduce((m, s) => Math.max(m, s.length), 0);
    expect(maior).toBeLessThanOrEqual(300);
  });

  it('o objetivo legítimo CHEGA — senão os dois casos acima seriam vácuo', async () => {
    stubGroq('[]');
    await sugestoes({ goalText: 'dormir melhor durante a semana' });
    expect(promptEnviado()).toContain('dormir melhor durante a semana');
  });

  it('só as tags da lista fechada saem daqui — o resto é descartado', async () => {
    stubGroq('[]');
    await sugestoes({ goalText: 'foco', categories: ['Health', 'NaoExiste', 'Work', '<script>'] });
    const texto = promptEnviado();
    expect(texto).toContain('Health');
    expect(texto).toContain('Work');
    expect(texto).not.toContain('NaoExiste');
    expect(texto).not.toContain('<script>');
  });

  it('`categories` que não é lista não derruba a rota', async () => {
    stubGroq('[]');
    for (const categories of ['Health', { a: 1 }, 42, null]) {
      const res = await suggest({ request: pedido({ goalText: 'foco', categories }), env: fakeEnv() });
      expect(res.status, String(categories)).toBe(200);
    }
  });

  it('o idioma escolhido chega ao prompt — a sugestão sai na língua da pessoa', async () => {
    stubGroq('[]');
    await sugestoes({ goalText: 'foco', language: 'pt-BR' });
    expect(promptEnviado()).toContain('Brazilian Portuguese');

    await sugestoes({ goalText: 'foco', language: 'en-US' });
    expect(enviado.at(-1).body.messages.map(m => m.content).join('\n')).toContain('English');
  });
});

describe('sem objetivo E sem tag, nem chega a chamar a IA', () => {
  it('é 400, e nenhuma chamada de rede acontece', async () => {
    stubGroq('[]');
    for (const corpo of [{}, { goalText: '' }, { goalText: '   ' }, { goalText: '', categories: [] }, { categories: ['NaoExiste'] }]) {
      const res = await suggest({ request: pedido(corpo), env: fakeEnv() });
      expect(res.status, JSON.stringify(corpo)).toBe(400);
    }
    expect(enviado).toEqual([]);
  });

  it('só as tags, sem objetivo, JÁ basta — o campo de texto é opcional', async () => {
    stubGroq('[]');
    const res = await suggest({ request: pedido({ categories: ['Health'] }), env: fakeEnv() });
    expect(res.status).toBe(200);
  });
});

describe('🔴 a SAÍDA do modelo vira TAREFA no save — e é sanitizada', () => {
  it('categoria fora da lista vira `Wellness`, nunca o que o modelo inventou', async () => {
    // O cliente resolve o ícone por `CATEGORY_ICONS[category]`. Uma categoria
    // inventada não tem ícone e a linha aparece quebrada no save do jogador.
    stubGroq(JSON.stringify([
      { name: 'Correr', category: 'Fitness' },
      { name: 'Meditar', category: 'Espiritualidade' },
      { name: 'Ler', category: null },
      { name: 'Beber água', category: '<script>' },
    ]));
    const s = await sugestoes({ goalText: 'saúde' });
    expect(s.map(x => x.category)).toEqual(['Fitness', 'Wellness', 'Wellness', 'Wellness']);
    for (const x of s) expect(CATEGORIAS).toContain(x.category);
  });

  it('o nome é cortado em 60 — o modelo não respeita o "max 40 chars" do prompt', async () => {
    stubGroq(JSON.stringify([{ name: 'x'.repeat(500), category: 'Work' }]));
    const s = await sugestoes({ goalText: 'foco' });
    expect(s[0].name).toHaveLength(60);
  });

  it('item sem nome utilizável é DESCARTADO, não vira tarefa vazia', async () => {
    stubGroq(JSON.stringify([
      { name: '', category: 'Work' },
      { name: '   ', category: 'Work' },
      { name: null, category: 'Work' },
      {},
      'só uma string',
      null,
      { name: 'Sobrevive', category: 'Work' },
    ]));
    expect(await sugestoes({ goalText: 'foco' })).toEqual([{ name: 'Sobrevive', category: 'Work' }]);
  });

  it('no máximo 6 sugestões chegam ao cliente, mesmo se o modelo mandar 50', async () => {
    stubGroq(JSON.stringify(
      Array.from({ length: 50 }, (_, i) => ({ name: `Tarefa ${i}`, category: 'Work' })),
    ));
    expect(await sugestoes({ goalText: 'foco' })).toHaveLength(6);
  });

  it('resposta que NÃO é lista (objeto, string, número) devolve lista vazia — não quebra', async () => {
    for (const conteudo of ['{"name":"Correr"}', '"texto"', '42', 'null']) {
      stubGroq(conteudo);
      const res = await suggest({ request: pedido({ goalText: 'foco' }), env: fakeEnv() });
      // 200 com lista vazia, ou 502 se nem parseou — o que não pode é 500 nem
      // uma lista com lixo dentro.
      if (res.status === 200) expect((await res.json()).suggestions).toEqual([]);
      else expect(res.status, conteudo).toBe(502);
    }
  });

  it('JSON dentro de cerca markdown é resgatado — o modelo ignora "no fences"', async () => {
    // O prompt pede "raw JSON array (no markdown fences)". Ele desobedece, e a
    // extração por regex existe justamente por isso.
    stubGroq('Claro! Aqui está:\n```json\n[{"name":"Correr","category":"Fitness"}]\n```\nEspero que ajude!');
    expect(await sugestoes({ goalText: 'foco' })).toEqual([{ name: 'Correr', category: 'Fitness' }]);
  });

  it('resposta 200 sem conteúdo nenhum vira lista vazia, e não erro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })));
    const res = await suggest({ request: pedido({ goalText: 'foco' }), env: fakeEnv() });
    expect(res.status).toBe(200);
    expect((await res.json()).suggestions).toEqual([]);
  });
});

describe('CORS', () => {
  it('a resposta de sucesso e a de erro carregam CORS — senão o app lê "falha de rede"', async () => {
    stubGroq('[]');
    const ok = await suggest({ request: pedido({ goalText: 'foco' }), env: fakeEnv() });
    const ruim = await suggest({ request: pedido({}), env: fakeEnv() });
    for (const r of [ok, ruim]) {
      expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*');
    }
  });
});
