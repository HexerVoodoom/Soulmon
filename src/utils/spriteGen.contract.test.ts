/**
 * O CONTRATO do cliente com `/api/generate-sprite`.
 *
 * Duas coisas que, faltando, invalidam o resto do trabalho:
 *
 * 1. **`formId` no corpo do POST.** O servidor já lê e repassa
 *    (`generate-sprite.js:181,205`) e já implementa `perFormLifetime: 3`
 *    (`_aiGuard.js:157,217-256`). Sem o `formId` do cliente, o teto por forma
 *    não tem o que separar — e o servidor, por decisão consciente
 *    (`_aiGuard.js:179-186`), não destrava nada quando ele falta: só deixa de
 *    haver disjuntor local.
 * 2. **409 ≠ 402.** O 402 é cota da CONTA (`custo-geracao-sprite.md` §5); o 409
 *    é "esta forma esgotou as 3 tentativas dela". Confundir os dois desliga a
 *    árvore inteira por causa de um galho.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { requestSprite, SpriteGenError, pixelizeDataUrl } from './spriteGen';
import { classifyCloudSaveStatus, CLOUD_SAVE_POLICY } from './cloudSave';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockFetch(res: Response) {
  const fn = vi.fn().mockResolvedValue(res);
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** O corpo que o cliente de fato enviou. */
const sentBody = (fn: ReturnType<typeof vi.fn>) => JSON.parse(fn.mock.calls[0][1].body as string);

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => 'a'.repeat(64),
    setItem: () => {},
    removeItem: () => {},
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('`formId` vai no corpo do POST', () => {
  it('quando informado, chega ao servidor', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { image: 'https://cdn/x.png', provider: 'higgsfield' }));
    const out = await requestSprite('desenhe', { formId: 'champion-power' });
    expect(sentBody(fetchMock).formId).toBe('champion-power');
    expect(out.image).toBe('https://cdn/x.png');
  });

  it('o prompt de fallback continua indo junto — a recusa de conteúdo custa 2', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { image: 'x' }));
    await requestSprite('p', { promptFallback: 'sem referências', formId: 'ultra' });
    const body = sentBody(fetchMock);
    expect(body.promptFallback).toBe('sem referências');
    expect(body.formId).toBe('ultra');
  });
});

describe('409 e 402 são contratos diferentes', () => {
  it('402 `sprite-lifetime-cap` → a CONTA parou', async () => {
    mockFetch(jsonResponse(402, { error: 'sprite-lifetime-cap' }));
    const err = await requestSprite('p', { formId: 'ultra' }).catch(e => e);
    expect(err).toBeInstanceOf(SpriteGenError);
    expect(err.reason).toBe('lifetime-cap');
    expect(err.status).toBe(402);
    expect(err.retryable).toBe(false);
  });

  it('409 `sprite-form-cap` → só ESTA forma parou, e não é 402', async () => {
    mockFetch(jsonResponse(409, {
      error: 'sprite-form-cap',
      message: { 'pt-BR': 'Esta forma resistiu…', en: 'This form resisted…' },
    }));
    const err = await requestSprite('p', { formId: 'mega-harmony' }).catch(e => e);
    expect(err.reason).toBe('form-cap');
    expect(err.reason).not.toBe('lifetime-cap');
    expect(err.status).toBe(409);
    expect(err.retryable).toBe(false);
    // A mensagem honesta do servidor (PT+EN) chega ao cliente.
    expect(err.serverMessage.en).toContain('resisted');
  });

  it('429 é "amanhã", 503 de orçamento é "mês que vem" — nenhum dos dois é terminal de conta', async () => {
    mockFetch(jsonResponse(429, { error: 'ai-daily-limit' }));
    expect((await requestSprite('p').catch(e => e)).reason).toBe('daily-limit');
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', { getItem: () => 'a'.repeat(64), setItem: () => {}, removeItem: () => {} });
    mockFetch(jsonResponse(503, { error: 'ai-monthly-budget-reached' }));
    expect((await requestSprite('p').catch(e => e)).reason).toBe('budget');
  });

  it('202 não é erro de ninguém: outro aparelho está desenhando a mesma forma', async () => {
    mockFetch(jsonResponse(202, { pending: true, retryAfter: 20 }));
    const err = await requestSprite('p', { formId: 'rookie' }).catch(e => e);
    expect(err.reason).toBe('pending');
    expect(err.retryAfter).toBe(20);
  });

  it('rede que nem chegou ao servidor tem status 0 — nada foi cobrado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const err = await requestSprite('p', { formId: 'rookie' }).catch(e => e);
    expect(err.status).toBe(0);
    expect(err.reason).toBe('error');
  });
});

/**
 * ITEM 0.2 DO ROTEIRO DE CORTE — 401 e 403 são portas DIFERENTES.
 *
 * Enquanto `enforced: false`, o `_aiGuard.js` deixa passar e nada disto aparece.
 * No instante em que a fatia 1 ligar `enforced: true`, a rota de sprite passa a
 * devolver os dois códigos, e eles pedem coisas OPOSTAS do jogador
 * (`preparo-fatia1.md` §0.2 e §0.4):
 *
 *  - **401** — o token venceu. O SDK do Firebase renova sozinho de hora em
 *    hora; uma retentativa pega a renovação, e só se insistir é que vira "faça
 *    login". Retentar AJUDA.
 *  - **403** — o token é bom; o `SAVE_ID` do aparelho é que não é o derivado do
 *    e-mail (§B.2.2, Classe 1). Retentar dá 403 de novo, e re-login TAMBÉM não
 *    conserta: quem conserta é `reconcileSaveId`. Retentar é laço infinito.
 *
 * Colapsar os dois num `auth` só faz o cliente pedir login a quem já está
 * logado — o beco sem saída que `cloudSave.ts` já nomeou de `identity`. É
 * daquele arquivo que este vocabulário vem, de propósito: dois nomes para o
 * mesmo 403 seriam duas verdades sobre o que dizer ao jogador.
 */
describe('0.2 — 401 e 403 nas rotas de IA: nomes diferentes, porque pedem gestos diferentes', () => {
  it('401 → `auth`, e retentar tem chance real (o token renova sozinho)', async () => {
    mockFetch(jsonResponse(401, { error: 'unauthenticated' }));
    const err = await requestSprite('p', { formId: 'rookie' }).catch(e => e);
    expect(err).toBeInstanceOf(SpriteGenError);
    expect(err.reason).toBe('auth');
    expect(err.status).toBe(401);
    expect(
      err.retryable,
      'CLOUD_SAVE_POLICY.auth.retentavel é true: uma retentativa pega a renovação do token',
    ).toBe(true);
  });

  it('403 → `identity`, e NÃO é `auth`: re-login não conserta `SAVE_ID` errado', async () => {
    mockFetch(jsonResponse(403, { error: 'forbidden' }));
    const err = await requestSprite('p', { formId: 'rookie' }).catch(e => e);
    expect(err.reason).toBe('identity');
    expect(
      err.reason,
      '403 tratado como 401 manda o jogador logar de novo para tomar 403 de novo, para sempre',
    ).not.toBe('auth');
    expect(err.status).toBe(403);
    expect(
      err.retryable,
      'CLOUD_SAVE_POLICY.identity.retentavel é false: o erro está no aparelho, não no token',
    ).toBe(false);
  });

  it('o vocabulário é o MESMO de `cloudSave.ts` — não um segundo dicionário', () => {
    // Se `classifyCloudSaveStatus` mudar de ideia sobre 401/403, o cliente de
    // sprite muda junto. Duas tabelas separadas divergiriam em silêncio, e a
    // copy de produto (§0.4) passaria a depender de qual arquivo se leu.
    expect(classifyCloudSaveStatus(401)).toBe('auth');
    expect(classifyCloudSaveStatus(403)).toBe('identity');
    expect(CLOUD_SAVE_POLICY.auth.retentavel).toBe(true);
    expect(CLOUD_SAVE_POLICY.identity.retentavel).toBe(false);
  });
});

/**
 * REGRESSÃO X-8 — a 9ª divergência doc↔código do projeto, e a primeira criada
 * pela própria squad.
 *
 * O JSDoc de `guardAiRequest` dizia *"⚠️ `src/utils/spriteGen.ts` ainda não
 * envia"* o `formId`. Era verdade quando foi escrito e deixou de ser na fatia 2.
 * Uma linha de comentário — mas ela mente sobre o DISJUNTOR que protege dinheiro:
 * quem ler e acreditar pode "simplificar" o ramo `hasFormCap` por achá-lo morto,
 * e sem ele um loop de retentativa numa forma só passa a consumir o vitalício de
 * 26 gerações da conta inteira (achado X-1 do mesmo gate).
 *
 * Os testes acima provam o comportamento; este prova que a DOCUMENTAÇÃO do
 * servidor não contradiz esse comportamento. Guard textual é a ferramenta certa
 * aqui porque o objeto medido é, ele mesmo, texto.
 */
describe('REGRESSÃO X-8 — o comentário do servidor não pode contradizer o cliente', () => {
  const guard = () => readFileSync('functions/api/_aiGuard.js', 'utf-8');

  it('X-8: o cliente envia `formId` no POST de /api/generate-sprite', () => {
    const cliente = readFileSync('src/utils/spriteGen.ts', 'utf-8');
    expect(
      /aiFetch\(\s*'\/api\/generate-sprite',\s*\{[^}]*\bformId\b/.test(cliente),
      'o corpo do POST parou de levar formId — o teto POR FORMA fica sem o que separar',
    ).toBe(true);
  });

  it('X-8: o `_aiGuard.js` não afirma que o cliente "ainda não envia"', () => {
    expect(
      guard(),
      'comentário do disjuntor de dinheiro voltou a mentir sobre o cliente (X-8)',
    ).not.toMatch(/ainda n[ãa]o envia/i);
  });
});

/**
 * F-1 (auditoria-cliente.md), segunda porta: `loadImage` faz `img.src = src`
 * com uma string que veio da REDE (`requestSprite` → `body.image`). É um
 * `<img src>` de verdade, com dado que este processo não escolheu.
 *
 * Não é XSS (`<img>` não executa `javascript:` nem `data:text/html`), mas é o
 * mesmo beacon do achado: um GET para o host de quem controlou a resposta.
 * A guarda é a MESMA função do acervo — dois dicionários de esquema divergiriam
 * em silêncio, que é o erro que este repositório já evitou em `SpriteFailKind`.
 */
describe('F-1: pixelizeDataUrl só aceita esquema da allowlist', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://evil.example/x.png',
    'x',
  ])('recusa %j antes de tocar no canvas', async (url) => {
    await expect(pixelizeDataUrl(url)).rejects.toThrow(/esquema|scheme/i);
  });
});
