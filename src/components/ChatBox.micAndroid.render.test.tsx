// @vitest-environment jsdom
/**
 * 04/11/2026 — microfone "ativo e mudo" no Android. Erros de acesso viram
 * aviso (toast), não mensagem no chat; sem motor de gravação = aviso claro;
 * MODIFY_AUDIO_SETTINGS declarado no manifesto.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';

const toastMock = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), warning: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: true }),
  peekServerConfig: () => ({ authRequired: false, transcribeAvailable: true }),
  resetServerConfigCache: () => {},
}));

import { ChatBox } from './ChatBox';
import { MIC_ERR } from '../utils/chatErrorCopy';

const onSendMessage = vi.fn();
const props = { petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: false, onSendMessage, language: 'en-US' as const };

class FakeRecorder {
  state = 'inactive'; mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; void this.onstop?.(); }
}

function setGum(fn: unknown) {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: fn ? { getUserMedia: fn } : undefined });
}
async function clicar(label: string) {
  await act(async () => { fireEvent.click(screen.getByLabelText(label)); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => { vi.clearAllMocks(); (globalThis as any).MediaRecorder = FakeRecorder; });
afterEach(() => { vi.unstubAllGlobals(); cleanup(); });

describe('microfone no Android', () => {
  it('permissão negada pelo WebView vira aviso, não mensagem no chat', async () => {
    setGum(vi.fn(async () => { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); }));
    render(<ChatBox {...props} />);
    await clicar('Record message');
    expect(toastMock.error).toHaveBeenCalledWith(MIC_ERR.denied.en);
    expect(onSendMessage).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Record message')).toBeTruthy();
  });

  it('sem motor de gravação: aviso claro e não fica ativo', async () => {
    setGum(null);
    render(<ChatBox {...props} />);
    await clicar('Record message');
    expect(toastMock.error).toHaveBeenCalledWith(MIC_ERR.noEngine.en);
    expect(screen.getByLabelText('Record message')).toBeTruthy();
  });

  it('ao começar avisa como parar e o botão vira "parar"', async () => {
    setGum(vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })));
    render(<ChatBox {...props} />);
    await clicar('Record message');
    expect(toastMock.info).toHaveBeenCalledWith(MIC_ERR.recording.en);
    expect(screen.getByLabelText('Stop recording')).toBeTruthy();
  });

  it('manifesto declara RECORD_AUDIO e MODIFY_AUDIO_SETTINGS (Capacitor pede os dois)', () => {
    const m = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
    expect(m).toContain('android.permission.RECORD_AUDIO');
    expect(m).toContain('android.permission.MODIFY_AUDIO_SETTINGS');
  });
});
