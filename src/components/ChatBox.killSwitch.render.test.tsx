// @vitest-environment jsdom
/**
 * Kill-switch `CHAT_DISABLED` no app: o servidor responde 503 `chat-disabled`;
 * o pet responde localmente e o aviso é o CALMO ("não está ligado agora"), não
 * o de falha.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

const aiFetch = vi.fn();
vi.mock('../utils/aiClient', () => ({ aiFetch: (...a: unknown[]) => aiFetch(...a) }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: false, billingDisabled: false, chatDisabled: true }),
  resetServerConfigCache: () => {},
}));
const { toast } = vi.hoisted(() => ({ toast: Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn() }) }));
vi.mock('sonner', () => ({ toast }));

import { ChatBox } from './ChatBox';

beforeEach(() => { aiFetch.mockReset(); toast.warning.mockReset(); });
afterEach(() => { cleanup(); });

describe('CHAT_DISABLED', () => {
  it('503 chat-disabled → resposta local + aviso calmo (PT)', async () => {
    const corpo = { error: 'chat-disabled', message: { pt: 'x', en: 'y' } };
    aiFetch.mockResolvedValue({ ok: false, status: 503, json: async () => corpo, clone() { return this; }, text: async () => JSON.stringify(corpo) });
    const enviada = vi.fn();
    render(<ChatBox petName="Bito" mood="idle" evolutionStage="rookie" useAI onSendMessage={enviada} language="pt-BR" />);
    const campo = screen.getByRole('textbox');
    await act(async () => { fireEvent.focus(campo); });
    await act(async () => { fireEvent.change(campo, { target: { value: 'oi' } }); });
    await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
    await act(async () => { await Promise.resolve(); });
    await vi.waitFor(() => expect(enviada).toHaveBeenCalledTimes(1));
    expect(typeof enviada.mock.calls[0][0]).toBe('string');
    expect(enviada.mock.calls[0][0].trim()).not.toBe('');
    expect(toast.warning).toHaveBeenCalledWith('O chat inteligente não está ligado agora — respostas simples continuam.');
  });

  it('429 (cota do dia ou provedores gratuitos no limite) → o pet diz que está cansado, sem toast de erro', async () => {
    const corpo = { error: 'ai-busy' };
    aiFetch.mockResolvedValue({ ok: false, status: 429, json: async () => corpo, clone() { return this; }, text: async () => '' });
    const enviada = vi.fn();
    render(<ChatBox petName="Bito" mood="idle" evolutionStage="rookie" useAI onSendMessage={enviada} language="pt-BR" />);
    const campo = screen.getByRole('textbox');
    await act(async () => { fireEvent.focus(campo); });
    await act(async () => { fireEvent.change(campo, { target: { value: 'oi' } }); });
    await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
    await vi.waitFor(() => expect(enviada).toHaveBeenCalledTimes(1));
    expect(enviada.mock.calls[0][0]).toMatch(/cansadinho/);
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
