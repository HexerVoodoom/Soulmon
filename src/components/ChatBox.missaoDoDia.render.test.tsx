// @vitest-environment jsdom
/**
 * Missão do dia "Conte como você está se sentindo hoje" (11/11/2026): QUALQUER mensagem enviada ao Soulmon conta (`onUserMessage`),
 * sem olhar o conteúdo; sem rede e mensagem vazia NÃO contam; o toque na missão pede foco no campo (`focusRequest`).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

const aiFetch = vi.fn();
vi.mock('../utils/aiClient', () => ({ aiFetch: (...a: unknown[]) => aiFetch(...a) }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: true }),
  peekServerConfig: () => ({ authRequired: false, transcribeAvailable: true }),
  resetServerConfigCache: () => {},
}));
const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

import { ChatBox } from './ChatBox';

const base = { petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: true, language: 'pt-BR' as const };
const ok = { ok: true, status: 200, clone() { return this; }, json: async () => ({ response: 'oi!' }), text: async () => '' };

async function enviar(texto: string) {
  const onSend = vi.fn();
  const onUser = vi.fn();
  render(<ChatBox {...base} onSendMessage={onSend} onUserMessage={onUser} />);
  const campo = screen.getByRole('textbox') as HTMLInputElement;
  await act(async () => { fireEvent.focus(campo); });
  await act(async () => { fireEvent.change(campo, { target: { value: texto } }); });
  await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
  await act(async () => { await Promise.resolve(); });
  return { onSend, onUser, campo };
}

let online = true;
beforeEach(() => {
  aiFetch.mockReset();
  online = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('chat conta para a missão do dia', () => {
  it('qualquer mensagem enviada conta UMA vez (sem exigir conteúdo)', async () => {
    aiFetch.mockResolvedValue(ok);
    const { onUser, onSend } = await enviar('qualquer coisa');
    expect(onSend).toHaveBeenCalledWith('oi!');
    expect(onUser).toHaveBeenCalledTimes(1);
  });
  it('sem rede a mensagem não saiu: não conta', async () => {
    online = false;
    const { onUser } = await enviar('oi');
    expect(onUser).not.toHaveBeenCalled();
  });
  it('mensagem vazia não conta', async () => {
    aiFetch.mockResolvedValue(ok);
    const { onUser } = await enviar('   ');
    expect(onUser).not.toHaveBeenCalled();
  });
  it('o toque na missão (focusRequest recente) põe o foco no campo; um pedido velho não refoca', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<ChatBox {...base} onSendMessage={() => {}} focusRequest={0} />);
    const campo = screen.getByRole('textbox') as HTMLInputElement;
    expect(document.activeElement).not.toBe(campo);
    rerender(<ChatBox {...base} onSendMessage={() => {}} focusRequest={Date.now()} />);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(document.activeElement).toBe(campo);
    expect(campo.readOnly).toBe(false);
    cleanup();
    render(<ChatBox {...base} onSendMessage={() => {}} focusRequest={Date.now() - 60_000} />);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(document.activeElement).not.toBe(screen.getByRole('textbox'));
  });
});
