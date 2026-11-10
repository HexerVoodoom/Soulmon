import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isReviewableSpriteUrl, checkReviews, submitReview, reviewPollDelay, isActive, REVIEW_POLL } from './reviewSoulmon';

vi.mock('./auth', () => ({ authHeaders: async () => ({ Authorization: 'Bearer t' }) }));
vi.mock('./safeStorage', () => ({ readLocal: () => 'abcdefgh12345678' }));

const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const F = 'ultimate-power@sabbat';
const URL_OK = '/api/sprite-image?k=' + 'a'.repeat(32);

describe('Pedir revisao do meu Soulmon (cliente)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('so revisa sprite que o NOSSO servidor guardou', () => {
    expect(isReviewableSpriteUrl('https://x.test' + URL_OK)).toBe(true);
    expect(isReviewableSpriteUrl('data:image/png;base64,AAAA')).toBe(false);
    expect(isReviewableSpriteUrl('https://x.test/api/sprite-image?k=zz')).toBe(false);
  });

  it('intervalo: 2 min nos primeiros 10 min, 10 min depois, e desiste aos 24 h', () => {
    expect(reviewPollDelay(0)).toBe(2 * 60_000);
    expect(reviewPollDelay(9 * 60_000)).toBe(2 * 60_000);
    expect(reviewPollDelay(10 * 60_000)).toBe(10 * 60_000);
    expect(reviewPollDelay(23 * 3600_000)).toBe(10 * 60_000);
    expect(reviewPollDelay(REVIEW_POLL.giveUpMs)).toBeNull();
  });

  it('ativo = pendente/avaliando/regenerando... e deixa de ser apos 24 h ou ao concluir', () => {
    const now = 1_000_000_000;
    expect(isActive({ status: 'avaliando', createdAt: now - 1000 }, now)).toBe(true);
    expect(isActive({ status: 'pendente-sem-chave', createdAt: now - 1000 }, now)).toBe(true);
    expect(isActive({ status: 'avaliando', createdAt: now - 25 * 3600_000 }, now)).toBe(false);
    for (const s of ['consertado', 'sem-problema', 'falhou'] as const) expect(isActive({ status: s, createdAt: now }, now)).toBe(false);
    expect(isActive(null)).toBe(false);
  });

  it('o pedido leva a forma equipada, a URL e o id do save, e nenhuma imagem', async () => {
    const f = vi.fn(async () => resp({ report: { id: 'r1', status: 'pendente' } }));
    await submitReview({ formId: F, spriteUrl: URL_OK, element: 'sabbat', stage: 'ultimate', prompt: 'p' }, f as unknown as typeof fetch);
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ id: 'abcdefgh12345678', formId: F, element: 'sabbat', prompt: 'p' });
    expect(Object.keys(body).some(k => /image|file|upload|base64/i.test(k))).toBe(false);
  });

  it('checkReviews aplica o conserto UMA vez, avisa o concluido, confirma (ack) e empurra o parado', async () => {
    const apply = vi.fn();
    const calls: string[] = [];
    const now = 10_000_000;
    const f = vi.fn(async (_u: string, init?: RequestInit) => {
      if (init?.method === 'POST') { calls.push(JSON.parse(init.body as string).action); return resp({ report: {} }); }
      return resp({ reports: [
        { id: 'a', formId: F, status: 'consertado', createdAt: now - 5000, afterUrl: '/api/sprite-image?k=' + 'b'.repeat(32), applied: false },
        { id: 'b', formId: 'rookie', status: 'consertado', createdAt: now - 5000, afterUrl: '/x', applied: true },
        { id: 'c', formId: 'mega-power', status: 'aguardando-regeneracao', createdAt: now - 5 * 60_000, afterUrl: null, applied: false },
        { id: 'd', formId: 'champion-power', status: 'sem-problema', createdAt: now - 5000, afterUrl: null, applied: false },
      ] });
    });
    const r = await checkReviews(apply, f as unknown as typeof fetch, now);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(F, '/api/sprite-image?k=' + 'b'.repeat(32));
    expect(r.finished.map(x => x.id).sort()).toEqual(['a', 'd']);
    expect(calls.sort()).toEqual(['ack', 'ack', 'continue']);
  });

  it('GET que falha nao muda nada (reports null)', async () => {
    const r = await checkReviews(vi.fn(), (async () => resp({}, 500)) as unknown as typeof fetch);
    expect(r).toEqual({ reports: null, finished: [] });
  });
});

describe('motivo no pedido (aditivo)', () => {
  it('submitReview manda `motivo` so quando informado (cliente antigo nao manda)', async () => {
    const corpos: Record<string, unknown>[] = [];
    const f = vi.fn(async (_u: string, init?: RequestInit) => { corpos.push(JSON.parse(init?.body as string)); return Response.json({ ok: true }); });
    const snap = { formId: 'rookie', spriteUrl: '/api/sprite-image?k=' + 'a'.repeat(32) };
    await submitReview(snap, f as unknown as typeof fetch);
    await submitReview(snap, f as unknown as typeof fetch, 'recorte');
    expect('motivo' in corpos[0]).toBe(false);
    expect(corpos[1].motivo).toBe('recorte');
  });
});
