/**
 * `/api/transcribe` — a rota que carrega a VOZ da pessoa.
 *
 * O Worker repassa o áudio direto ao Groq Whisper. O que os casos aqui
 * protegem não é "funciona": é **o que a rota se recusa a fazer**.
 *
 * Três coisas, em ordem de dano:
 *
 *  1. **Não vaza a credencial nem o corpo do provedor.** A chave é do
 *     servidor; um `error.message` repassado ao cliente a entregaria de graça.
 *  2. **Não vira túnel.** Rota anônima que aceita corpo binário é upload
 *     gratuito na nossa borda se não tiver teto de tamanho e de taxa.
 *  3. **Não GRAVA o áudio.** Nada aqui escreve em KV. É repasse, e o teste
 *     afirma isso lendo o próprio arquivo — a única forma de um `put` novo
 *     ficar vermelho.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
vi.mock('./_auth.js', async orig => ({
  ...(await orig()),
  // `token-valido-<x>` = outra conta (`<x>@b.c`): os laços abaixo usam contas
  // distintas para o teto POR MINUTO por conta (release/beta-1) não ser o alvo.
  verifyIdToken: vi.fn(async token => (token === 'token-valido' ? { email: 'a@b.c' } : token?.startsWith('token-valido-') ? { email: `${token.slice(13)}@b.c` } : null)),
}));
import { onRequestPost, onRequestOptions } from './transcribe.js';

const GROQ = 'https://api.groq.com/openai/v1/audio/transcriptions';
const CHAVE = 'gsk-duble';
function kvFalso() {
  const m = new Map();
  return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); } };
}
// KV desde a release/beta-1: a transcrição passa pelo `_aiGuard` (cota 10/conta/dia, 100/dia).
const ENV = { GROQ_API_KEY: CHAVE, FIREBASE_PROJECT_ID: 'soulmon-app', get DIGIAPP_SAVES() { return kvFalso(); } };

/** IP próprio por caso: o balde do teto vive no isolate e é compartilhado. */
let n = 0;
const ipNovo = () => `203.0.113.${(n = (n + 1) % 250) + 1}`;

function pedido({ audio, tipo = 'audio/webm;codecs=opus', language = 'pt-BR', ip = ipNovo(), bytes = 2048, token = 'token-valido' } = {}) {
  const form = new FormData();
  if (audio !== null) {
    form.append('audio', audio ?? new Blob([new Uint8Array(bytes)], { type: tipo }), 'recording.webm');
  }
  if (language !== null) form.append('language', language);
  return new Request('https://soulmon.app/api/transcribe', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
const ok = corpo => () => new Response(JSON.stringify({ duration: 5, ...corpo }), {
  status: 200, headers: { 'Content-Type': 'application/json' },
});

beforeEach(() => { chamadas = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe('🔴 desligada por padrão — botão que falha é pior que botão que não existe', () => {
  it('sem GROQ_API_KEY é 503, e NÃO chama ninguém', async () => {
    stubUpstream(ok({ text: 'oi' }));
    for (const env of [{}, { GROQ_API_KEY: '' }, { FIREBASE_PROJECT_ID: 'soulmon-app' }]) {
      const r = await onRequestPost({ request: pedido(), env });
      expect(r.status, JSON.stringify(env)).toBe(503);
      expect((await r.json()).error).toBe('transcribe-not-configured');
    }
    expect(chamadas).toEqual([]);
  });

  it('a configuração é conferida ANTES de ler o corpo', async () => {
    // Ler 2 MB para descobrir que o serviço não existe gasta os dados móveis
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
    const grande = new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: 'audio/webm' });
    const r = await onRequestPost({ request: pedido({ audio: grande }), env: ENV });
    expect(r.status).toBe(413);
    expect(chamadas).toEqual([]);
  });

  it('🔴 duração > 65 s no verbose_json é 413 audio-too-long, SEM texto e SEM devolver a cota', async () => {
    stubUpstream(ok({ text: 'texto longo', duration: 66 }));
    const store = kvFalso();
    const r = await onRequestPost({ request: pedido(), env: { ...ENV, DIGIAPP_SAVES: store } });
    expect(r.status).toBe(413);
    expect(await r.json()).toEqual({ error: 'audio-too-long' });
    const hoje = new Date().toISOString().slice(0, 10);
    expect(await store.get(`ai:transcribe:@all:${hoje}`)).toBe('1');
  });

  it('🔴 duration ausente é 413 (fail-closed)', async () => {
    stubUpstream(() => new Response(JSON.stringify({ text: 'oi' }), { status: 200 }));
    const r = await onRequestPost({ request: pedido(), env: ENV });
    expect(r.status).toBe(413);
    expect((await r.json()).error).toBe('audio-too-long');
  });

  it('🔴 Content-Length gigante é 413 sem chamar o provedor', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const h = new Headers({ 'CF-Connecting-IP': ipNovo(), Authorization: 'Bearer token-valido', 'content-length': String(3 * 1024 * 1024) });
    const espiao = vi.fn(() => { throw new Error('leu o corpo'); });
    const r = await onRequestPost({ request: { headers: h, formData: espiao }, env: ENV });
    expect(espiao).not.toHaveBeenCalled();
    expect(r.status).toBe(413);
    expect(chamadas).toEqual([]);
  });

  it('duração de 65 s passa', async () => {
    stubUpstream(ok({ text: 'oi', duration: 65 }));
    expect((await (await onRequestPost({ request: pedido(), env: ENV })).json()).text).toBe('oi');
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
      const r = await onRequestPost({ request: pedido({ tipo, token: `token-valido-${tipo.replace(/\W/g, '')}` }), env: ENV });
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
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ipNovo(), Authorization: 'Bearer token-valido' },
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
    for (let i = 0; i < 7; i++) ultimo = await onRequestPost({ request: pedido({ ip, token: `token-valido-ip${i}` }), env: ENV });
    expect(ultimo.status).toBe(429);
    expect(ultimo.headers.get('Retry-After')).toBeTruthy();
    expect(chamadas.length).toBe(6);
  });

  it('o teto vem ANTES de tudo — nem lê o corpo, nem confere configuração', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const ip = '198.51.100.202';
    for (let i = 0; i < 6; i++) await onRequestPost({ request: pedido({ ip, token: `token-valido-ipb${i}` }), env: ENV });
    // Mesmo com a configuração AUSENTE, o 7º leva 429 e não 503: quem está em
    // laço não descobre nada sobre o nosso ambiente.
    const r = await onRequestPost({ request: pedido({ ip }), env: {} });
    expect(r.status).toBe(429);
  });
});

describe('🔴 o que a resposta NÃO carrega de volta', () => {
  it('falha de rede no provedor é 502, sem a mensagem do erro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error(`falhou com Bearer ${CHAVE}`); }));
    const r = await onRequestPost({ request: pedido(), env: ENV });
    expect(r.status).toBe(502);
    expect(await r.text()).not.toContain(CHAVE);
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
  it('vai ao endpoint do Groq, com a chave do SERVIDOR e os parâmetros fixos', async () => {
    stubUpstream(ok({ text: 'oi' }));
    await onRequestPost({ request: pedido(), env: ENV });
    expect(chamadas[0].url).toBe(GROQ);
    expect(chamadas[0].init.headers.Authorization).toBe(`Bearer ${CHAVE}`);
    const f = chamadas[0].init.body;
    expect(f.get('model')).toBe('whisper-large-v3');
    expect(f.get('response_format')).toBe('verbose_json');
    expect(f.get('temperature')).toBe('0');
    expect(f.get('language')).toBe('pt');
  });

  it('o nome do arquivo vem do mime REAL, não do nome do cliente', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const casos = [
      ['audio/mp4', 'audio.mp4'], ['audio/webm;codecs=opus', 'audio.webm'], ['audio/ogg', 'audio.ogg'],
      ['audio/x-m4a', 'audio.m4a'], ['audio/mpeg', 'audio.mp3'], ['audio/wav', 'audio.wav'],
    ];
    for (const [tipo, nome] of casos) {
      await onRequestPost({ request: pedido({ tipo, token: `token-valido-n${tipo.replace(/\W/g, '')}` }), env: ENV });
      // O cliente mandou "recording.webm" em todos.
      expect(chamadas.at(-1).init.body.get('file').name, tipo).toBe(nome);
    }
  });

  it('tem TIMEOUT de 25 s: o signal é passado', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const espiao = vi.spyOn(AbortSignal, 'timeout');
    await onRequestPost({ request: pedido(), env: ENV });
    expect(chamadas[0].init.signal).toBeInstanceOf(AbortSignal);
    expect(espiao).toHaveBeenCalledWith(25_000);
    espiao.mockRestore();
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
    expect(semComentarios).toContain('api.groq.com');
  });

  // Desde a release/beta-1 a rota grava CONTADORES de cota (`ai:transcribe:*`)
  // — números, nunca o áudio nem o texto. É isso que este caso trava agora.
  it('na KV só entram contadores `ai:transcribe:*` (números) — nunca áudio nem texto', async () => {
    stubUpstream(ok({ text: 'segredo falado' }));
    const kv = { put: vi.fn(), get: vi.fn(async () => null) };
    const r = await onRequestPost({ request: pedido(), env: { ...ENV, DIGIAPP_SAVES: kv } });
    expect(r.status).toBe(200);
    for (const [k, v] of kv.put.mock.calls) {
      expect(k).toMatch(/^ai:transcribe:/);
      expect(String(v)).toMatch(/^\d+$/);
    }
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

describe('🔴 auditoria de lançamento — a rota não é mais anônima', () => {
  it('sem token é 401 e NÃO chama o provedor', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const r = await onRequestPost({ request: pedido({ token: null }), env: ENV });
    expect(r.status).toBe(401);
    expect(chamadas).toEqual([]);
  });
  it('token inválido é 401 e NÃO chama o provedor', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const r = await onRequestPost({ request: pedido({ token: 'forjado' }), env: ENV });
    expect(r.status).toBe(401);
    expect(chamadas).toEqual([]);
  });
  it('sem FIREBASE_PROJECT_ID é fail-closed (503), nunca aberta', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const { FIREBASE_PROJECT_ID: _omit, ...semAuth } = ENV;
    const r = await onRequestPost({ request: pedido(), env: semAuth });
    expect(r.status).toBe(503);
    expect(chamadas).toEqual([]);
  });
});

describe('cota da transcrição (release/beta-1, abuso-e-custo V4.5 / Q4)', () => {
  it('a 11ª do dia na mesma conta é 429 ai-daily-limit e NÃO chama o provedor', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const env = { GROQ_API_KEY: CHAVE, FIREBASE_PROJECT_ID: 'soulmon-app', DIGIAPP_SAVES: kvFalso() };
    const { resetRateLimits } = await import('./_rateLimit.js');
    for (let i = 0; i < 10; i++) {
      resetRateLimits(); // isola o teto POR MINUTO; aqui o alvo é o diário
      expect((await onRequestPost({ request: pedido(), env })).status).toBe(200);
    }
    resetRateLimits();
    const r = await onRequestPost({ request: pedido(), env });
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe('ai-daily-limit');
    expect(chamadas).toHaveLength(10);
  });

  it('a 5ª no mesmo minuto é 429 ai-rate-limit', async () => {
    stubUpstream(ok({ text: 'oi' }));
    const env = { GROQ_API_KEY: CHAVE, FIREBASE_PROJECT_ID: 'soulmon-app', DIGIAPP_SAVES: kvFalso() };
    for (let i = 0; i < 4; i++) expect((await onRequestPost({ request: pedido(), env })).status).toBe(200);
    const r = await onRequestPost({ request: pedido(), env });
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe('ai-rate-limit');
  });

  it('provedor fora devolve a unidade (não queima a cota do dia)', async () => {
    stubUpstream(() => new Response('x', { status: 500 }));
    const store = kvFalso();
    const env = { GROQ_API_KEY: CHAVE, FIREBASE_PROJECT_ID: 'soulmon-app', DIGIAPP_SAVES: store };
    expect((await onRequestPost({ request: pedido(), env })).status).toBe(502);
    const hoje = new Date().toISOString().slice(0, 10);
    expect(await store.get(`ai:transcribe:@all:${hoje}`)).toBe('0');
  });
});
