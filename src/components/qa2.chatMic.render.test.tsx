// @vitest-environment jsdom
/**
 * QA2 (04/10/2026) — o microfone do chat não pode sobreviver ao chat.
 *
 * O `CompanionHUD` desmonta ao sair da Home. Com uma gravação em curso, o
 * `MediaRecorder` e as trilhas ficavam vivos (microfone do aparelho ligado,
 * `chunks` crescendo sem teto). E as trilhas só paravam DEPOIS da transcrição
 * (até 30 s com o microfone "em uso" depois de parar).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: true }),
  resetServerConfigCache: () => {},
}));

import { ChatBox } from './ChatBox';

let track: { stop: ReturnType<typeof vi.fn> };
let recorders: FakeRecorder[];

class FakeRecorder {
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown) { recorders.push(this); }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; void this.onstop?.(); }
}

beforeEach(() => {
  track = { stop: vi.fn() };
  recorders = [];
  (globalThis as any).MediaRecorder = FakeRecorder;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) },
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

const props = {
  petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: false,
  onSendMessage: () => {}, language: 'en-US' as const,
};

async function comecarGravacao() {
  const utils = render(<ChatBox {...props} />);
  const botao = screen.getByLabelText('Record message');
  await act(async () => { fireEvent.click(botao); });
  await act(async () => { await Promise.resolve(); });
  expect(recorders).toHaveLength(1);
  expect(recorders[0].state).toBe('recording');
  return utils;
}

describe('microfone do chat', () => {
  it('desmontar com gravação em curso para o gravador e solta o microfone', async () => {
    const { unmount } = await comecarGravacao();
    expect(track.stop).not.toHaveBeenCalled();
    unmount();
    expect(recorders[0].state).toBe('inactive');
    expect(track.stop).toHaveBeenCalled();
  });

  it('parar a gravação solta o microfone ANTES da transcrição terminar', async () => {
    let soltarFetch: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(res => { soltarFetch = res; })));
    await comecarGravacao();
    await act(async () => { fireEvent.click(screen.getByLabelText('Stop recording')); });
    // a transcrição segue pendente (fetch não resolveu) e o microfone já está livre
    expect(track.stop).toHaveBeenCalled();
    soltarFetch(new Response(JSON.stringify({ text: '' }), { status: 200 }));
  });
});
