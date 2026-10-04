// @vitest-environment jsdom
/**
 * QA2 (04/10/2026) — a resposta da IA com forma inesperada (`{}`, `response`
 * vazio ou não-string) virava `onSendMessage(undefined)` e envenenava o
 * `history` da conversa com um turno sem texto: o servidor passava a recusar o
 * histórico e a IA "caía" até recarregar. Agora cai na resposta local.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

const aiFetch = vi.fn();
vi.mock('../utils/aiClient', () => ({ aiFetch: (...a: unknown[]) => aiFetch(...a) }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: false }),
  resetServerConfigCache: () => {},
}));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn() }) }));

import { ChatBox } from './ChatBox';

const base = { petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: true, language: 'en-US' as const };

async function enviar(onSendMessage: (s: string) => void, texto: string) {
  render(<ChatBox {...base} onSendMessage={onSendMessage} />);
  const campo = screen.getByRole('textbox');
  await act(async () => { fireEvent.focus(campo); });
  await act(async () => { fireEvent.change(campo, { target: { value: texto } }); });
  await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => { aiFetch.mockReset(); });
afterEach(() => { cleanup(); });

describe('resposta da IA com forma inesperada', () => {
  for (const [nome, corpo] of [['sem campo', {}], ['vazia', { response: '   ' }], ['não-string', { response: 42 }]] as const) {
    it(`${nome} cai na resposta local (nunca undefined)`, async () => {
      aiFetch.mockResolvedValue({ ok: true, json: async () => corpo, text: async () => '' });
      const enviada = vi.fn();
      await enviar(enviada, 'hello there');
      expect(enviada).toHaveBeenCalledTimes(1);
      expect(typeof enviada.mock.calls[0][0]).toBe('string');
      expect(enviada.mock.calls[0][0].trim().length).toBeGreaterThan(0);
    });
  }

  it('o histórico seguinte só leva turnos com texto', async () => {
    aiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}), text: async () => '' });
    const enviada = vi.fn();
    render(<ChatBox {...base} onSendMessage={enviada} />);
    const campo = screen.getByRole('textbox');
    const mandar = async (t: string) => {
      await act(async () => { fireEvent.focus(campo); });
      await act(async () => { fireEvent.change(campo, { target: { value: t } }); });
      await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
      await act(async () => { await Promise.resolve(); });
    };
    await mandar('one');
    aiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ response: 'ok!' }), text: async () => '' });
    await mandar('two');
    const body = aiFetch.mock.calls[1][1] as { history: Array<{ role: string; content: unknown }> };
    expect(body.history.length).toBeGreaterThan(0);
    for (const h of body.history) expect(typeof h.content).toBe('string');
  });
});
