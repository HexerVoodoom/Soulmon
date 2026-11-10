// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, cleanup } from '@testing-library/react';
import { useReviewWatcher } from './useReviewWatcher';
import { ReviewSoulmonRow, ReviewResultModal, reviewResultMessage } from '../components/ReviewSoulmonRow';

vi.mock('../utils/auth', () => ({ authHeaders: async () => ({ Authorization: 'Bearer t' }) }));
vi.mock('../utils/safeStorage', () => ({ readLocal: () => 'abcdefgh12345678', writeLocal: () => {}, readFlag: () => false, readFlagOr: (_k: string, d: boolean) => d, writeFlag: () => {} }));

const F = 'ultimate-power@sabbat';
const SNAP = { formId: F, spriteUrl: '/api/sprite-image?k=' + 'a'.repeat(32), element: 'sabbat', stage: 'ultimate' };
const MIN = 60_000;

/** Um servidor de mentira: o estado do pedido mora aqui (persistencia = o que o GET devolve). */
function servidor() {
  let report: Record<string, unknown> | null = null;
  const posts: string[] = [];
  const gets = { n: 0 };
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      const action = body.action ?? 'report';
      posts.push(action);
      if (action === 'report') {
        if (report && ['avaliando', 'pendente'].includes(report.status as string)) return Response.json({ ok: true, created: false, report });
        report = { id: 'r1', formId: body.formId, status: 'avaliando', createdAt: Date.now(), afterUrl: null, applied: false };
        return Response.json({ ok: true, created: true, report });
      }
      if (action === 'ack' && report) report.applied = true;
      return Response.json({ report });
    }
    if (u.startsWith('/api/review-soulmon?')) { gets.n += 1; return Response.json({ reports: report ? [report] : [] }); }
    throw new Error('url inesperada ' + u);
  });
  return {
    f, posts, gets,
    set: (patch: Record<string, unknown>) => { report = { ...(report as object), ...patch }; },
    has: () => report !== null,
  };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const mount = (srv: ReturnType<typeof servidor>, extra: Partial<Parameters<typeof useReviewWatcher>[0]> = {}) => {
  vi.stubGlobal('fetch', srv.f);
  const onApplyFix = vi.fn();
  const onFinished = vi.fn();
  const hook = renderHook(() => useReviewWatcher({ snapshot: SNAP, onApplyFix, onFinished, ...extra }));
  return { ...hook, onApplyFix, onFinished };
};

describe('useReviewWatcher', () => {
  it('sem pedido: UM GET ao abrir e nenhum timer depois (nada de polling)', async () => {
    const srv = servidor();
    const { result } = mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(srv.gets.n).toBe(1);
    expect(result.current.active).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(60 * MIN); });
    expect(srv.gets.n).toBe(1);
  });

  it('tocar envia o pedido, deixa o botao ativo (inativo na tela) e nao duplica', async () => {
    const srv = servidor();
    const { result } = mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await result.current.request(); });
    expect(result.current.active).toBe(true);
    expect(srv.posts.filter(p => p === 'report')).toHaveLength(1);
    // um segundo toque (ex.: duplo toque) devolve o MESMO pedido ativo
    await act(async () => { await result.current.request(); });
    expect(result.current.current?.id).toBe('r1');
    expect(result.current.active).toBe(true);
  });

  it('backoff: a cada 2 min nos primeiros 10 min, depois a cada 10 min', async () => {
    const srv = servidor();
    srv.set({ id: 'r1', formId: F, status: 'avaliando', createdAt: Date.now(), afterUrl: null, applied: false });
    mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(srv.gets.n).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(2 * MIN); });
    expect(srv.gets.n).toBe(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(2 * MIN); });
    expect(srv.gets.n).toBe(3);
    // 1 min depois NAO checa de novo
    await act(async () => { await vi.advanceTimersByTimeAsync(MIN); });
    expect(srv.gets.n).toBe(3);
    // chega aos 10 min: 4 checagens de 2 em 2 (t=2,4,6,8,10) => 6 GETs no total
    await act(async () => { await vi.advanceTimersByTimeAsync(5 * MIN); });
    expect(srv.gets.n).toBe(6);
    // agora de 10 em 10: em 9 min nada, em +1 min mais um GET
    await act(async () => { await vi.advanceTimersByTimeAsync(9 * MIN); });
    expect(srv.gets.n).toBe(6);
    await act(async () => { await vi.advanceTimersByTimeAsync(MIN); });
    expect(srv.gets.n).toBe(7);
  });

  it('conclui: aplica o sprite novo, avisa UMA vez, confirma, e o botao volta', async () => {
    const srv = servidor();
    srv.set({ id: 'r1', formId: F, status: 'avaliando', createdAt: Date.now(), afterUrl: null, applied: false });
    const { result, onApplyFix, onFinished } = mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.active).toBe(true);
    srv.set({ status: 'consertado', afterUrl: '/api/sprite-image?k=' + 'b'.repeat(32) });
    await act(async () => { await vi.advanceTimersByTimeAsync(2 * MIN); });
    expect(onApplyFix).toHaveBeenCalledWith(F, '/api/sprite-image?k=' + 'b'.repeat(32));
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(false);
    // sem timer depois de concluido e o aviso nao repete
    const antes = srv.gets.n;
    await act(async () => { await vi.advanceTimersByTimeAsync(30 * MIN); });
    expect(srv.gets.n).toBe(antes);
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('persistencia: reabrir o app (novo mount) relê o pedido ativo do servidor e o aviso pendente aparece', async () => {
    const srv = servidor();
    srv.set({ id: 'r1', formId: F, status: 'consertado', createdAt: Date.now() - 20 * MIN, afterUrl: '/api/sprite-image?k=' + 'b'.repeat(32), applied: false });
    const { onApplyFix, onFinished } = mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(onApplyFix).toHaveBeenCalledTimes(1);
    expect(onFinished).toHaveBeenCalledTimes(1);
    const segundo = mount(srv); // outra abertura: ja confirmado, nao avisa de novo
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(segundo.onFinished).not.toHaveBeenCalled();
  });

  it('sem polling com o app em segundo plano; ao voltar, checa na hora', async () => {
    const srv = servidor();
    srv.set({ id: 'r1', formId: F, status: 'avaliando', createdAt: Date.now(), afterUrl: null, applied: false });
    mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    const vis = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(30 * MIN); });
    expect(srv.gets.n).toBe(1);
    vis.mockReturnValue('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(0); });
    expect(srv.gets.n).toBe(2);
  });

  it('pedido com mais de 24 h nao e ativo (botao livre) e nao agenda checagem', async () => {
    const srv = servidor();
    srv.set({ id: 'r1', formId: F, status: 'avaliando', createdAt: Date.now() - 25 * 60 * MIN, afterUrl: null, applied: false });
    const { result } = mount(srv);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.active).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(60 * MIN); });
    expect(srv.gets.n).toBe(1);
  });

  it('cooldown do servidor vira erro "cooldown" e o botao continua livre', async () => {
    const srv = servidor();
    const f = vi.fn(async (url: string, init?: RequestInit) => (init?.method === 'POST' ? Response.json({ error: 'review-cooldown' }, { status: 429 }) : srv.f(url, init)));
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useReviewWatcher({ snapshot: SNAP, onApplyFix: vi.fn(), onFinished: vi.fn() }));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await result.current.request(); });
    expect(result.current.error).toBe('cooldown');
    expect(result.current.active).toBe(false);
  });
});

describe('ReviewSoulmonRow', () => {
  const base = { active: false, sending: false, error: null, reviewable: true, onRequest: vi.fn() };
  it('em revisao: botao DESATIVADO e o texto "Seu Soulmon esta em revisao" (PT/EN)', () => {
    const { rerender } = render(<ReviewSoulmonRow language="pt-BR" review={{ ...base, active: true }} />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Seu Soulmon está em revisão');
    rerender(<ReviewSoulmonRow language="en-US" review={{ ...base, active: true }} />);
    expect(screen.getByRole('status').textContent).toBe('Your Soulmon is under review');
  });
  it('livre: botao ativo com o rotulo certo e toque chama o pedido; reativa ao concluir', () => {
    const onRequest = vi.fn();
    const { rerender } = render(<ReviewSoulmonRow language="pt-BR" review={{ ...base, active: true, onRequest }} />);
    rerender(<ReviewSoulmonRow language="pt-BR" review={{ ...base, active: false, onRequest }} />);
    const b = screen.getByRole('button') as HTMLButtonElement;
    expect(b.disabled).toBe(false);
    expect(b.textContent).toContain('Pedir revisão do meu Soulmon');
    act(() => { b.click(); });
    // o toque abre a escolha do MOTIVO (um de dois); so a escolha envia o pedido
    expect(onRequest).not.toHaveBeenCalled();
    act(() => { (document.querySelector('[data-review-motivo="recorte"]') as HTMLButtonElement).click(); });
    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onRequest).toHaveBeenCalledWith('recorte');
  });
  it('os dois motivos PT/EN e o envio de cada um', () => {
    const onRequest = vi.fn();
    const { rerender } = render(<ReviewSoulmonRow language="pt-BR" review={{ ...base, onRequest }} />);
    act(() => { (screen.getByRole('button') as HTMLButtonElement).click(); });
    expect(document.querySelector('[data-review-motivo="estilo"]')?.textContent).toBe('Estilo inconsistente');
    expect(document.querySelector('[data-review-motivo="recorte"]')?.textContent).toBe('Recorte com falhas');
    act(() => { (document.querySelector('[data-review-motivo="estilo"]') as HTMLButtonElement).click(); });
    expect(onRequest).toHaveBeenLastCalledWith('estilo');
    rerender(<ReviewSoulmonRow language="en-US" review={{ ...base, onRequest }} />);
    act(() => { (screen.getAllByRole('button')[0] as HTMLButtonElement).click(); });
    expect(document.querySelector('[data-review-motivo="estilo"]')?.textContent).toBe('Inconsistent style');
    expect(document.querySelector('[data-review-motivo="recorte"]')?.textContent).toBe('Cutout has flaws');
  });
  it('mensagens de conclusao PT/EN', () => {
    expect(reviewResultMessage('pt-BR', [{ status: 'consertado' }])).toBe('Revisão concluída — seu Soulmon foi atualizado.');
    expect(reviewResultMessage('pt-BR', [{ status: 'sem-problema' }])).toContain('está tudo certo');
    expect(reviewResultMessage('en-US', [{ status: 'consertado' }])).toContain('was updated');
    render(<ReviewResultModal language="pt-BR" message="oi" onClose={() => {}} />);
  });
});
