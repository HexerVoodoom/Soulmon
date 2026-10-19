// @vitest-environment jsdom
/**
 * D-96 — erros distintos no chat (`/api/chat`) e no microfone (`/api/transcribe`),
 * EN e PT-BR, com a copy aprovada (`utils/chatErrorCopy.ts`).
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
import { CHAT_ERR, MIC_ERR } from '../utils/chatErrorCopy';

type Lang = 'en-US' | 'pt-BR';
const base = (language: Lang) => ({ petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: true, language });
const resp = (status: number, error?: string) => ({
  ok: false, status,
  clone() { return this; },
  json: async () => (error ? { error } : {}),
  text: async () => '',
});

async function enviar(language: Lang, texto = 'hello there') {
  const onSend = vi.fn();
  render(<ChatBox {...base(language)} onSendMessage={onSend} />);
  const campo = screen.getByRole('textbox') as HTMLInputElement;
  await act(async () => { fireEvent.focus(campo); });
  await act(async () => { fireEvent.change(campo, { target: { value: texto } }); });
  await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
  await act(async () => { await Promise.resolve(); });
  return { onSend, campo };
}

let online = true;
beforeEach(() => {
  aiFetch.mockReset();
  Object.values(toastMock).forEach(f => (f as ReturnType<typeof vi.fn>).mockClear?.());
  online = true;
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('chat: erro por status', () => {
  const toasts: Array<[string, number, string | undefined, keyof typeof CHAT_ERR]> = [
    ['401', 401, undefined, 'unauthenticated'],
    ['403 beta-closed', 403, 'beta-closed', 'betaClosed'],
    ['400 missing-save-id', 400, 'missing-save-id', 'missingSaveId'],
    ['500 AI not configured', 500, 'AI not configured', 'notSwitchedOn'],
    ['503 chat-disabled', 503, 'chat-disabled', 'notSwitchedOn'],
  ];
  for (const lang of ['en-US', 'pt-BR'] as const) {
    for (const [nome, status, erro, chave] of toasts) {
      it(`${nome} -> toast (${lang}) + resposta local`, async () => {
        aiFetch.mockResolvedValue(resp(status, erro));
        const { onSend } = await enviar(lang);
        const par = CHAT_ERR[chave];
        expect(toastMock.warning).toHaveBeenCalledWith(lang === 'pt-BR' ? par.pt : par.en);
        expect(onSend).toHaveBeenCalledTimes(1);
        expect(onSend.mock.calls[0][0].trim().length).toBeGreaterThan(0);
      });
    }
    it(`429 -> bolha busy (${lang}), sem toast`, async () => {
      aiFetch.mockResolvedValue(resp(429));
      const { onSend } = await enviar(lang);
      expect(onSend).toHaveBeenCalledWith(lang === 'pt-BR' ? CHAT_ERR.busy.pt : CHAT_ERR.busy.en);
      expect(toastMock.warning).not.toHaveBeenCalled();
    });
    it(`502 -> bolha upstream (${lang})`, async () => {
      aiFetch.mockResolvedValue(resp(502));
      const { onSend } = await enviar(lang);
      expect(onSend).toHaveBeenCalledWith(lang === 'pt-BR' ? CHAT_ERR.upstream.pt : CHAT_ERR.upstream.en);
    });
    it(`500 genérico -> bolha serverError (${lang}), sem toast antigo`, async () => {
      aiFetch.mockResolvedValue(resp(500, 'boom'));
      const { onSend } = await enviar(lang);
      expect(onSend).toHaveBeenCalledWith(lang === 'pt-BR' ? CHAT_ERR.serverError.pt : CHAT_ERR.serverError.en);
      expect(toastMock.warning).not.toHaveBeenCalled();
    });
    it(`timeout (AbortError) -> bolha serverError (${lang})`, async () => {
      aiFetch.mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' }));
      const { onSend } = await enviar(lang);
      expect(onSend).toHaveBeenCalledWith(lang === 'pt-BR' ? CHAT_ERR.serverError.pt : CHAT_ERR.serverError.en);
    });
    it(`offline (navigator.onLine=false) -> toast offline, texto de volta no campo (${lang})`, async () => {
      online = false;
      const { onSend, campo } = await enviar(lang, 'olá pet');
      expect(aiFetch).not.toHaveBeenCalled();
      expect(toastMock.warning).toHaveBeenCalledWith(lang === 'pt-BR' ? CHAT_ERR.offline.pt : CHAT_ERR.offline.en);
      expect(onSend).not.toHaveBeenCalled();
      expect(campo.value).toBe('olá pet');
    });
    it(`TypeError de rede -> toast offline e texto preservado (${lang})`, async () => {
      aiFetch.mockRejectedValue(new TypeError('Failed to fetch'));
      const { onSend, campo } = await enviar(lang, 'olá pet');
      expect(toastMock.warning).toHaveBeenCalledWith(lang === 'pt-BR' ? CHAT_ERR.offline.pt : CHAT_ERR.offline.en);
      expect(onSend).not.toHaveBeenCalled();
      expect(campo.value).toBe('olá pet');
    });
  }
});

// ── microfone ──────────────────────────────────────────────────────────────
let recorders: Array<{ stop: () => void }>;
class FakeRecorder {
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() { recorders.push(this); }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; void this.onstop?.(); }
}

async function gravarEParar(language: Lang) {
  recorders = [];
  (globalThis as any).MediaRecorder = FakeRecorder;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) },
  });
  render(<ChatBox {...base(language)} onSendMessage={vi.fn()} />);
  await act(async () => { fireEvent.click(screen.getByLabelText(language === 'pt-BR' ? 'Gravar mensagem' : 'Record message')); });
  await act(async () => { await Promise.resolve(); });
  await act(async () => { fireEvent.click(screen.getByLabelText(language === 'pt-BR' ? 'Parar gravação' : 'Stop recording')); });
  // o `import('../utils/auth')` dinâmico leva alguns ticks na 1ª vez
  await act(async () => { await vi.waitFor(() => { expect(toastMock.error).toHaveBeenCalled(); }, { timeout: 3000 }); });
}

describe('microfone: erro por status', () => {
  const casos: Array<[number, string | undefined, keyof typeof MIC_ERR]> = [
    [401, undefined, 'unauthenticated'],
    [403, 'beta-closed', 'betaClosed'],
    [413, 'audio-too-long', 'tooLong'],
    [413, 'audio-too-large', 'tooLarge'],
    [415, undefined, 'unsupported'],
    [429, undefined, 'rateLimited'],
    [503, undefined, 'unavailable'],
    [500, undefined, 'serverError'],
    [502, undefined, 'serverError'],
  ];
  for (const lang of ['en-US', 'pt-BR'] as const) {
    for (const [status, erro, chave] of casos) {
      it(`${status} ${erro ?? ''} -> mic.${chave} (${lang})`, async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
          ok: false, status, clone() { return this; }, json: async () => (erro ? { error: erro } : {}),
        })));
        await gravarEParar(lang);
        const par = MIC_ERR[chave];
        expect(toastMock.error).toHaveBeenCalledWith(lang === 'pt-BR' ? par.pt : par.en);
      });
    }
    it(`TypeError de rede -> mic.offline (${lang})`, async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
      await gravarEParar(lang);
      expect(toastMock.error).toHaveBeenCalledWith(lang === 'pt-BR' ? MIC_ERR.offline.pt : MIC_ERR.offline.en);
    });
    it(`AbortError -> mic.serverError (${lang})`, async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(Object.assign(new Error('a'), { name: 'AbortError' }))));
      await gravarEParar(lang);
      expect(toastMock.error).toHaveBeenCalledWith(lang === 'pt-BR' ? MIC_ERR.serverError.pt : MIC_ERR.serverError.en);
    });
  }

  it('parada automática aos 60 s mostra toast.info autoStop60', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ text: '' }), { status: 200 })));
      recorders = [];
      (globalThis as any).MediaRecorder = FakeRecorder;
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) },
      });
      render(<ChatBox {...base('en-US')} onSendMessage={vi.fn()} />);
      await act(async () => { fireEvent.click(screen.getByLabelText('Record message')); });
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await vi.advanceTimersByTimeAsync(60_500); });
      expect(toastMock.info).toHaveBeenCalledWith(MIC_ERR.autoStop60.en);
    } finally { vi.useRealTimers(); }
  });
});
