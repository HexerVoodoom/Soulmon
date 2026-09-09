/**
 * `/api/transcribe` — a rota que carrega a VOZ da pessoa.
 *
 * Ela nasceu junto com estes testes (09/09/2026), substituindo um `fetch`
 * direto do navegador para `*.supabase.co` com o JWT do projeto embarcado no
 * bundle. O que os casos aqui protegem não é "funciona": é **o que a rota se
 * recusa a fazer**.
 *
 * Três coisas, em ordem de dano:
 *
 *  1. **Não vaza o destino nem a credencial.** O id do projeto vira HOST da
 *     chamada e a chave é do servidor. Um `error.message` repassado ao cliente
 *     entrega os dois de graça.
 *  2. **Não vira túnel.** Rota anônima que aceita corpo binário é upload
 *     gratuito na nossa borda se não tiver teto de tamanho e de taxa.
 *  3. **Não GRAVA o áudio.** Nada aqui escreve em KV. É repasse, e o teste
 *     afirma isso lendo o próprio arquivo — a única forma de um `put` novo
 *     ficar vermelho.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { onRequestPost, onRequestOptions } from './transcribe.js';

const PROJECT = 'evvcdsnijxbyctipfnkt';
const ENV = { SUPABASE_PROJECT_ID: PROJECT, SUPABASE_ANON_KEY: 'jwt-do-servidor' };

/** IP próprio por caso: o balde do teto vive no isolate e é compartilhado. */
let n = 0;
const ipNovo = () => `203.0.113.${(n = (n + 1) % 250) + 1}`;

function pedido({ audio, tipo = 'audio/webm;codecs=opus', language = 'pt-BR', ip = ipNovo(), bytes = 2048 } = {}) {
  const form = new FormData();
  if (audio !== null) {
    form.append('audio', audio ?? new Blob([new Uint8Array(bytes)], { type: tipo }), 'recording.webm');
  }
  if (language !== null) form.append('language', language);
  return new Request('https://soulmon.app/api/transcribe', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip },
    body: form,
  });
}

let chamadas;
function stubUpstream(resposta) {
  chamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    chamadas.push({ url: String(url), init });
    return resposta();
  }));
}
const ok = corpo => () => new Response(JSON.stringify(corpo), {
  status: 200, headers: { 'Content-Type': 'application/json' },
});

beforeEach(() => { chamadas = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe('🔴 desligada por padrão — botão que falha é pior que botão que não existe', () => {
  it('sem as variáveis do provedor é 503, e NÃO chama ninguém', async () => {
    stubUpstream(ok({ text: 'oi' }));
    for (const env of [{}, { SUPABASE_PROJECT_ID: PROJECT }, { SUPABASE_ANON_KEY: 'k' }]) {
      const r = await onRequestPost({ request: pedido(), env });
      expect(r.status, JSON.stringify(env)).toBe(503);
      expect((await r.json()).error).toBe('transcribe-not-configured');
    }
    expect(chamadas).toEqual([]);
  });

  it('🔴 id de projeto TORTO é 503 — senão vira SSRF por configuração', async () => {
    // O id vira HOST. `evil.com/` ou `x.attacker.net` numa variável de ambiente
    // montaria uma URL para outro domínio, com a NOSSA chave no cabeçalho.
    stubUpstream(ok({ text: 'oi' }));
    for (const id of ['evil.com', 'a', 'PROJETO', 'abc.def', '../x', 'a'.repeat(41), 'proj eto']) {
      const r = await onRequestPost({ request: pedido(), env: { ...ENV, SUPABASE_PROJECT_ID: id } });
      expect(r.status, id).toBe(503);
    }
    expect(chamadas).toEqual([]);
  });

  it('a configuração é conferida ANTES de ler o corpo', async () => {
    // Ler 4 MB para descobrir que o serviço não existe gasta os dados móveis
    // da pessoa por nada.
    stubUpstream(ok({ text: 'oi' }));
    const req = pedido();
    const espiao = vi.spyOn(req, 'formData');
    await onRequestPost({ request: req, env: {} });
    expect(espiao).not.toHaveBeenCalled();
  });
});

describe('o que entra', () => {
  it('sem áudio é 400', async () => {
    stubUpstream(ok({ text: '' }));
    expect((await onRequestPost({ request: pedido({ audio: null }), env: ENV })).status).toBe(400);
    expect(chamadas).toEqual([]);
  });

  it('áudio VAZIO é 400 — gravação de zero segundo não custa uma chamada paga', async () => {
    stubUpstream(ok({ text: '' }));
    const vazio = new Blob([], { type: 'audio/webm' });
    expect((await onRequestPost({ request: pedido({ audio: vazio }), env: ENV })).status).toBe(400);
    expect(chamadas).toEqual([]);
  });

  it('🔴 áudio grande demais é 413 — a rota é anônima e aceita binário', async () => {
    stubUpstream(ok({ text: '' }));
    const grande = new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: 'audio/webm' });
    const r = await onRequestPost({ request: pedido({ audio: grande }), env: ENV });
    expect(r.status).toBe(413);
    expect(chamadas).toEqual([]);
  });

  it('tipo que não é áudio é 415', async () => {
    stubUpstream(ok({ text: '' }));
    for (const tipo of ['text/html', 'application/zip', 'image/png', '', 'audio']) {
      const r = await onRequestPost({ request: pedido({ tipo }), env: ENV });
      expect(r.status, tipo).toBe(415);
    }
    expect(chamadas).toEqual([]);
  });

  it('os tipos que um MediaRecorder produz PASSAM — senão o caso acima seria vácuo', async () => {
    stubUpstream(ok({ text: 'oi' }));
    for (const tipo of ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4', 'audio/wav']) {
      const r = await onRequestPost({ request: pedido({ tipo }), env: ENV });
      expect(r.status, tipo).toBe(200);
    }
  });

  it('o idioma é lista FECHADA, e vai como código de base', async () => {
    stubUpstream(ok({ text: 'oi' }));
    for (const [enviado, esperado] of [
      ['pt-BR', 'pt'], ['pt', 'pt'], ['en-US', 'en'], ['en', 'en'],
      ['fr', 'en'], ['x'.repeat(500), 'en'], ['', 'en'],
    ]) {
      await onRequestPost({ request: pedido({ language: enviado }), env: ENV });
      expect(chamadas.at(-1).init.body.get('language'), enviado).toBe(esperado);
    }
  });

  it('corpo que não é formulário é 400', async () => {
    stubUpstream(ok({ text: '' }));
    const req = new Request('https://soulmon.app/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ipNovo() },
      body: '{"nao":"e form"}',
    });
    expect((await onRequestPost({ request: req, env: ENV })).status).toBe(400);
  });
});

describe('🔴 o teto por IP — transcrição é a chamada mais cara do projeto', () => {
  it('o 7º pedido do mesmo IP no minuto é 429', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const ip = '198.51.100.201';
    let ultimo;
    for (let i = 0; i < 7; i++) ultimo = await onRequestPost({ request: pedido({ ip }), env: ENV });
    expect(ultimo.status).toBe(429);
    expect(ultimo.headers.get('Retry-After')).toBeTruthy();
    expect(chamadas.length).toBe(6);
  });

  it('o teto vem ANTES de tudo — nem lê o corpo, nem confere configuração', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const ip = '198.51.100.202';
    for (let i = 0; i < 6; i++) await onRequestPost({ request: pedido({ ip }), env: ENV });
    // Mesmo com a configuração AUSENTE, o 7º leva 429 e não 503: quem está em
    // laço não descobre nada sobre o nosso ambiente.
    const r = await onRequestPost({ request: pedido({ ip }), env: {} });
    expect(r.status).toBe(429);
  });
});

describe('🔴 o que a resposta NÃO carrega de volta', () => {
  it('falha de rede no provedor é 502, sem a mensagem do erro', async () => {
    // A mensagem carrega a URL montada, e a URL carrega o id do projeto.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error(`falhou em https://${PROJECT}.supabase.co/x`); }));
    const r = await onRequestPost({ request: pedido(), env: ENV });
    expect(r.status).toBe(502);
    const texto = await r.text();
    expect(texto).not.toContain(PROJECT);
    expect(texto).not.toContain('supabase');
  });

  it('erro do provedor é 502, e o corpo dele não é repassado', async () => {
    stubUpstream(() => new Response('quota exceeded for key sk-abc123', { status: 429 }));
    const r = await onRequestPost({ request: pedido(), env: ENV });
    expect(r.status).toBe(502);
    expect(await r.text()).not.toContain('sk-abc123');
  });

  it('resposta ilegível do provedor é 502, não 500 nem 200 com lixo', async () => {
    stubUpstream(() => new Response('isto não é json', { status: 200 }));
    expect((await onRequestPost({ request: pedido(), env: ENV })).status).toBe(502);
  });

  it('🔴 SÓ o texto atravessa — metadado do provedor fica do lado de cá', async () => {
    stubUpstream(ok({
      text: 'oi bichinho',
      request_id: 'req_segredo',
      model: 'whisper-1',
      audio_url: 'https://storage.example/gravacao.webm',
    }));
    const corpo = await (await onRequestPost({ request: pedido(), env: ENV })).json();
    expect(corpo).toEqual({ text: 'oi bichinho' });
  });

  it('texto gigante do provedor é cortado — o campo do chat não é ilimitado', async () => {
    stubUpstream(ok({ text: 'a'.repeat(9000) }));
    const corpo = await (await onRequestPost({ request: pedido(), env: ENV })).json();
    expect(corpo.text).toHaveLength(2000);
  });

  it('texto ausente vira string vazia, e não "undefined" na caixa de texto', async () => {
    stubUpstream(ok({}));
    expect((await (await onRequestPost({ request: pedido(), env: ENV })).json()).text).toBe('');
  });
});

describe('a chamada ao provedor', () => {
  it('vai para o HOST derivado do id, com a chave do SERVIDOR no cabeçalho', async () => {
    stubUpstream(ok({ text: 'oi' }));
    await onRequestPost({ request: pedido(), env: ENV });
    expect(chamadas[0].url).toBe(`https://${PROJECT}.supabase.co/functions/v1/make-server-7de212d9/transcribe`);
    expect(chamadas[0].init.headers.Authorization).toBe('Bearer jwt-do-servidor');
  });

  it('tem TIMEOUT — sem ele a requisição fica pendurada até o limite do isolate', async () => {
    stubUpstream(ok({ text: 'oi' }));
    await onRequestPost({ request: pedido(), env: ENV });
    expect(chamadas[0].init.signal).toBeTruthy();
  });
});

describe('🔴 a rota NÃO grava o áudio', () => {
  it('não existe escrita de armazenamento no arquivo', async () => {
    // Afirmação sobre o CÓDIGO porque é a única forma de um `put` novo ficar
    // vermelho: a política de privacidade diz que o áudio é repassado e não
    // guardado, e essa promessa não pode depender de alguém lembrar.
    //
    // ⚠️ Os COMENTÁRIOS saem antes da checagem: o cabeçalho do arquivo cita
    // "R2" e "KV" justamente para explicar que não os usa, e a primeira versão
    // deste caso ficou vermelha por causa da própria explicação. Guard que
    // reclama do texto em vez do código treina quem lê a apagar o comentário.
    const semComentarios = readFileSync(join(__dirname, 'transcribe.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const proibido of ['.put(', 'DIGIAPP_SAVES', 'SOULMON_SAVES', 'PUSH_SUBSCRIPTIONS', 'R2_', 'caches.']) {
      expect(semComentarios.includes(proibido), `\`${proibido}\` apareceu no CÓDIGO de transcribe.js`).toBe(false);
    }
    // AUTOVERIFICAÇÃO: a remoção de comentários não pode ter comido o arquivo.
    expect(semComentarios).toContain('onRequestPost');
    expect(semComentarios).toContain('supabase.co');
  });

  it('a rota não recebe binding de KV nenhum para poder gravar', async () => {
    stubUpstream(ok({ text: 'oi' }));
    // Passa um `env` com KV disponível; a resposta tem que ser idêntica.
    const kv = { put: vi.fn(), get: vi.fn() };
    const r = await onRequestPost({ request: pedido(), env: { ...ENV, DIGIAPP_SAVES: kv } });
    expect(r.status).toBe(200);
    expect(kv.put).not.toHaveBeenCalled();
  });
});

describe('CORS', () => {
  it('o preflight e as respostas de erro carregam CORS', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const pre = await onRequestOptions();
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const ruim = await onRequestPost({ request: pedido({ audio: null }), env: ENV });
    expect(ruim.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
