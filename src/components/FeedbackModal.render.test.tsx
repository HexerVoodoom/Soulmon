// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { HomeFeedbackButton } from './nav/HomeFeedbackButton';
import { sendFeedback, buildFeedbackPayload } from '../utils/feedbackClient';

const ok = (delivered = 'email') => new Response(JSON.stringify({ ok: true, delivered }), { status: 200 });

beforeEach(() => { vi.restoreAllMocks(); });
afterEach(() => cleanup());

async function abrir(language: 'pt-BR' | 'en-US' = 'pt-BR') {
  const r = render(<HomeFeedbackButton language={language} />);
  fireEvent.click(r.container.querySelector('[data-home-feedback]') as HTMLElement);
  return r;
}
const q = (s: string) => document.querySelector(s) as HTMLElement;

describe('FeedbackModal: fluxo', () => {
  it('abre o modal (não um mailto), com os 3 tipos e Enviar desativado sem texto', async () => {
    await abrir();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    const radios = [...document.querySelectorAll('[role="radio"]')].map(e => e.textContent);
    expect(radios).toEqual(['Feedback', 'Sugestão', 'Bug']);
    expect((q('[data-feedback-send]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('marca Bug, escreve, envia e mostra sucesso; payload sem identidade', async () => {
    const f = vi.fn(async () => ok());
    vi.stubGlobal('fetch', f);
    await abrir();
    fireEvent.click(document.querySelectorAll('[role="radio"]')[2]);
    fireEvent.change(q('[data-feedback-text]'), { target: { value: 'Travou na loja' } });
    fireEvent.click(q('[data-feedback-send]'));
    await waitFor(() => expect(q('[data-feedback-sent]')).not.toBeNull());
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/feedback');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ type: 'bug', message: 'Travou na loja', lang: 'pt-BR' });
    expect(Object.keys(body).sort()).toEqual(['build', 'lang', 'message', 'plat', 'type', 'ver']);
  });

  it('falha de envio MANTÉM o texto e oferece tentar de novo; a nova tentativa funciona', async () => {
    const f = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(ok('stored'));
    vi.stubGlobal('fetch', f);
    await abrir();
    fireEvent.change(q('[data-feedback-text]'), { target: { value: 'Minha sugestão longa' } });
    fireEvent.click(q('[data-feedback-send]'));
    await waitFor(() => expect(q('[data-feedback-error]')).not.toBeNull());
    expect((q('[data-feedback-text]') as HTMLTextAreaElement).value).toBe('Minha sugestão longa');
    expect(q('[data-feedback-send]').textContent).toBe('Tentar de novo');
    fireEvent.click(q('[data-feedback-send]'));
    await waitFor(() => expect(q('[data-feedback-sent]')).not.toBeNull());
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('fechar e reabrir depois de falha preserva o rascunho', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    const r = await abrir();
    fireEvent.change(q('[data-feedback-text]'), { target: { value: 'não perder' } });
    fireEvent.click(q('[data-feedback-send]'));
    await waitFor(() => expect(q('[data-feedback-error]')).not.toBeNull());
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(r.container.querySelector('[data-home-feedback]') as HTMLElement);
    await waitFor(() => expect((q('[data-feedback-text]') as HTMLTextAreaElement).value).toBe('não perder'));
  });

  it('EN: rótulos e erro em inglês', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429, headers: { 'Retry-After': '30' } })));
    await abrir('en-US');
    expect([...document.querySelectorAll('[role="radio"]')].map(e => e.textContent)).toEqual(['Feedback', 'Suggestion', 'Bug']);
    fireEvent.change(q('[data-feedback-text]'), { target: { value: 'hi' } });
    fireEvent.click(q('[data-feedback-send]'));
    await waitFor(() => expect(q('[data-feedback-error]').textContent).toMatch(/Too many messages/));
  });
});

describe('feedbackClient', () => {
  it('mapeia status: 429 rate, 400 invalid, 500 server, throw network', async () => {
    const mk = (s: number) => (async () => new Response('{}', { status: s })) as unknown as typeof fetch;
    expect(await sendFeedback('bug', 'x', 'pt-BR', mk(429))).toMatchObject({ ok: false, reason: 'rate' });
    expect(await sendFeedback('bug', 'x', 'pt-BR', mk(400))).toMatchObject({ ok: false, reason: 'invalid' });
    expect(await sendFeedback('bug', 'x', 'pt-BR', mk(500))).toMatchObject({ ok: false, reason: 'server' });
    expect(await sendFeedback('bug', 'x', 'pt-BR', (async () => { throw new Error('x'); }) as unknown as typeof fetch)).toMatchObject({ ok: false, reason: 'network' });
  });
  it('payload: idioma en para en-US e texto aparado', () => {
    expect(buildFeedbackPayload('feedback', '  oi  ', 'en-US')).toMatchObject({ lang: 'en', message: 'oi' });
  });
});
