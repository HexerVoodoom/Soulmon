// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { resetServerConfigCache } from '../utils/serverConfig';
import { ChatBox } from './ChatBox';

const props = {
  petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: false,
  onSendMessage: () => {}, language: 'en-US' as const,
};
const cfg = (t: boolean) => vi.fn(async () => new Response(JSON.stringify({ transcribeAvailable: t }), { status: 200 }));

beforeEach(() => { resetServerConfigCache(); vi.unstubAllGlobals(); });
afterEach(() => { cleanup(); });

describe('microfone só com /api/transcribe disponível', () => {
  it('sem config resolvida: não há microfone', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<ChatBox {...props} />);
    expect(screen.queryByLabelText('Record message')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('após focus com transcribeAvailable:true: microfone aparece', async () => {
    vi.stubGlobal('fetch', cfg(true));
    render(<ChatBox {...props} />);
    await act(async () => { fireEvent.focus(screen.getByLabelText('Talk to your Soulmon')); });
    expect(screen.getByLabelText('Record message')).toBeTruthy();
  });
  it('com false: não aparece', async () => {
    vi.stubGlobal('fetch', cfg(false));
    render(<ChatBox {...props} />);
    await act(async () => { fireEvent.focus(screen.getByLabelText('Talk to your Soulmon')); });
    expect(screen.queryByLabelText('Record message')).toBeNull();
  });
});
