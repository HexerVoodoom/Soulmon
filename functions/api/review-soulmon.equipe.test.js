// "Revisar meu Soulmon": 3 pedidos por forma por dia; o 2o/3o, depois de um `sem-problema` da IA, vao por e-mail para a equipe (sem chamar a IA).
// Nenhuma API real: Anthropic e Resend sao mocks de fetch.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { encodePng } from './_png.js';
import { onRequestPost } from './review-soulmon.js';
import { STATUS, REVIEW_LIMITS, readReport } from './_spriteReview.js';
import { teamEmail, TEAM_PREFIX } from './_reviewTeam.js';
import { reviewCopy } from '../../src/components/ReviewSoulmonRow';

const SAVE = 'abcdefgh12345678abcdefgh';
const FORM = 'ultimate-power@sabbat';
const TOK = 'a'.repeat(32);
const URL_ANTES = `https://x.test/api/sprite-image?k=${TOK}`;
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

function kvFake(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store, get: async k => (store.has(k) ? store.get(k) : null),
    getWithMetadata: async k => ({ value: store.has(k) ? store.get(k) : null, metadata: null }),
    put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); },
    list: async ({ prefix = '' } = {}) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const solido = () => {
  const w = 96, d = new Uint8Array(w * w * 4);
  for (let y = 20; y < 76; y++) for (let x = 20; x < 76; x++) d.set([120, 40, 160, 255], (y * w + x) * 4);
  return encodePng(w, w, d);
};
const mkEnv = (extra = {}) => ({
  SOULMON_SAVES: kvFake({
    [`sprite:blob:${TOK}`]: ab(solido()),
    [`sprite:img:${SAVE}:${FORM}`]: JSON.stringify({ image: URL_ANTES, provider: 'higgsfield', at: 1 }),
    [SAVE]: JSON.stringify({ spriteLibrary: { sprites: { [FORM]: { url: URL_ANTES, formId: FORM, at: 1 } } } }),
  }),
  ANTHROPIC_API_KEY: 'k', ...extra,
});
const corpo = (over = {}) => ({ id: SAVE, formId: FORM, spriteUrl: URL_ANTES, soulmonId: 's1', stage: 'ultimate', element: 'sabbat', note: 'as runas sumiram', ...over });
const post = (env, body) => onRequestPost({ request: new Request('https://x.test/api/review-soulmon', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env });
const NADA = { problema: 'nenhum', detalhe: 'ok', acao: 'nada', fundoResidual: 'none' };

/** fetch mock: Anthropic devolve `verdict`; Resend registra e responde ok. */
function mockFetch(verdict, resendOk = true) {
  const calls = { claude: 0, resend: [] };
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    if (String(url).includes('anthropic')) { calls.claude++; return Response.json({ content: [{ type: 'text', text: JSON.stringify(verdict) }], usage: { input_tokens: 1, output_tokens: 1 } }); }
    if (String(url).includes('resend')) { calls.resend.push(JSON.parse(init.body)); return new Response('{}', { status: resendOk ? 200 : 500 }); }
    return new Response('', { status: 404 });
  }));
  return calls;
}
/** Encerra um pedido (a fila andou) para o proximo poder abrir. */
function encerrar(env, id, status = STATUS.FALHOU) {
  const r = JSON.parse(env.SOULMON_SAVES.store.get('review:' + id));
  r.status = status; env.SOULMON_SAVES.store.set('review:' + id, JSON.stringify(r));
}
afterEach(() => vi.unstubAllGlobals());

describe('escalada para a equipe', () => {
  it('1o pedido roda a IA; 2o (depois de sem-problema) NAO chama a IA, vai por e-mail para a equipe e fica aguardando-equipe', async () => {
    const env = mkEnv({ RESEND_API_KEY: 're_test' });
    const calls = mockFetch(NADA);
    const a = await (await post(env, corpo())).json();
    expect(a.report.status).toBe(STATUS.SEM_PROBLEMA);
    expect(calls.claude).toBe(1);
    const b = await (await post(env, corpo({ note: 'de novo, faltam as runas' }))).json();
    expect(b.report.status).toBe(STATUS.EQUIPE);
    expect(calls.claude).toBe(1); // a IA NAO rodou de novo
    expect(calls.resend).toHaveLength(1);
    const mail = calls.resend[0];
    expect(mail.to).toEqual(['soulmon.revisor@gmail.com']);
    expect(mail.subject).toContain(FORM);
    expect(mail.text).toContain(`Forma: ${FORM}`);
    expect(mail.text).toContain('Estagio: ultimate');
    expect(mail.text).toContain('Elemento: sabbat');
    expect(mail.text).toContain(`/api/sprite-image?k=${TOK}`);
    expect(mail.text).toContain('de novo, faltam as runas');
    expect(mail.text).toContain('sem-problema'); // resultado da IA do 1o pedido
    expect(mail.text).toContain('Conta: abcdefgh...'); // saveId resumido
    expect(mail.text).not.toContain(SAVE);
    const r = await readReport(env, b.report.id);
    expect(r.method).toBe('equipe');
  });
  it('sem RESEND_API_KEY a mensagem fica guardada na KV (como o feedback)', async () => {
    const env = mkEnv();
    const calls = mockFetch(NADA);
    await post(env, corpo());
    const b = await (await post(env, corpo())).json();
    expect(calls.resend).toHaveLength(0);
    const chaves = [...env.SOULMON_SAVES.store.keys()].filter(k => k.startsWith(TEAM_PREFIX));
    expect(chaves).toHaveLength(1);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(chaves[0])).reportId).toBe(b.report.id);
  });
  it('Resend falhando tambem deixa guardado e o pedido segue aguardando-equipe', async () => {
    const env = mkEnv({ RESEND_API_KEY: 're_test' });
    mockFetch(NADA, false);
    await post(env, corpo());
    const b = await (await post(env, corpo())).json();
    expect(b.report.status).toBe(STATUS.EQUIPE);
    expect([...env.SOULMON_SAVES.store.keys()].some(k => k.startsWith(TEAM_PREFIX))).toBe(true);
  });
  it('3o pedido do dia (depois que o 2o foi resolvido) tambem vai para a equipe; o 4o bate no limite por forma', async () => {
    const env = mkEnv();
    const calls = mockFetch(NADA);
    await post(env, corpo());
    const b = await (await post(env, corpo())).json();
    encerrar(env, b.report.id);
    const c = await (await post(env, corpo())).json();
    expect(c.report.status).toBe(STATUS.EQUIPE);
    expect(calls.claude).toBe(1);
    encerrar(env, c.report.id);
    const d = await post(env, corpo());
    expect(d.status).toBe(429);
    expect((await d.json()).error).toBe('review-form-limit');
    expect(REVIEW_LIMITS.reportsPerFormPerDay).toBe(3);
  });
  it('se o 1o pedido achou problema (nao foi sem-problema), o 2o segue a regra normal: roda a IA', async () => {
    const env = mkEnv();
    const calls = mockFetch({ problema: 'recorte', detalhe: 'halo', acao: 'regenerar', fundoResidual: 'green' });
    const a = await (await post(env, corpo())).json();
    expect(a.report.status).not.toBe(STATUS.SEM_PROBLEMA);
    encerrar(env, a.report.id, STATUS.MANUAL);
    const b = await (await post(env, corpo())).json();
    expect(b.report.status).not.toBe(STATUS.EQUIPE);
    expect(calls.claude).toBe(2);
  });
  it('sem-problema de um avaliador ANTIGO nao escala: a IA nova roda de novo', async () => {
    const env = mkEnv();
    const calls = mockFetch(NADA);
    const a = await (await post(env, corpo())).json();
    const r = JSON.parse(env.SOULMON_SAVES.store.get('review:' + a.report.id));
    delete r.evalVersion; env.SOULMON_SAVES.store.set('review:' + a.report.id, JSON.stringify(r));
    const b = await (await post(env, corpo())).json();
    expect(b.report.status).toBe(STATUS.SEM_PROBLEMA);
    expect(calls.claude).toBe(2);
  });
  it('pedido repetido enquanto aguarda a equipe devolve o MESMO pedido (botao inativo), sem novo e-mail', async () => {
    const env = mkEnv({ RESEND_API_KEY: 're_test' });
    const calls = mockFetch(NADA);
    await post(env, corpo());
    const b = await (await post(env, corpo())).json();
    const c = await (await post(env, corpo())).json();
    expect(c.report.id).toBe(b.report.id);
    expect(calls.resend).toHaveLength(1);
  });
  it('o e-mail e texto puro, assunto sem quebra de linha', () => {
    const { subject, text } = teamEmail({ id: 'x', saveId: SAVE, formId: 'f\nx', stage: 's', note: 'n', beforeKey: TOK }, null, 'https://x.test', '2026-11-10T00:00:00Z');
    expect(subject).not.toMatch(/[\r\n]/);
    expect(text).toContain('(indisponivel)');
  });
});

describe('textos da UI (sem prometer correcao automatica)', () => {
  it('a linha do Help pede aviso e promete so verificar, em PT e EN', () => {
    expect(reviewCopy('pt-BR').hint).toBe('Se o desenho tiver um problema, nos avise. Vamos verificar para você.');
    expect(reviewCopy('en').hint).toBe("If the drawing has a problem, let us know. We'll check it for you.");
    for (const l of ['pt-BR', 'en']) expect(reviewCopy(l).hint).not.toMatch(/automatic|sozinhos|automaticamente/i);
  });
  it('estado de equipe: "Enviamos para a nossa equipe olhar" / "We sent it to our team to take a look"', () => {
    expect(reviewCopy('pt-BR').sentToTeam).toBe('Enviamos para a nossa equipe olhar');
    expect(reviewCopy('en').sentToTeam).toBe('We sent it to our team to take a look');
  });
});
