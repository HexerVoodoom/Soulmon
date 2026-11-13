// @vitest-environment jsdom
/**
 * Beta12 / C1 + C2 — painel do chat: meia tela, tela cheia, mensagens da sessão.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react';

const toastMock = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), warning: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));
const aiFetchMock = vi.hoisted(() => vi.fn());
vi.mock('../utils/aiClient', () => ({ aiFetch: aiFetchMock }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: true }),
  peekServerConfig: () => ({ authRequired: false, transcribeAvailable: true }),
  resetServerConfigCache: () => {},
}));

import { ChatBox } from './ChatBox';

const onSendMessage = vi.fn();
const base = { petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: false, onSendMessage, language: 'pt-BR' as const, spriteSrc: '/sprite.png' };
const CAMPO = 'Falar com seu Soulmon';

function respostaIA(texto: string) {
  return { ok: true, status: 200, json: async () => ({ response: texto }), clone() { return this; } };
}
async function enviar(texto: string) {
  fireEvent.change(screen.getByLabelText(CAMPO), { target: { value: texto } });
  await act(async () => { fireEvent.click(screen.getByLabelText('Enviar mensagem')); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); });

describe('painel do chat (C1/C2)', () => {
  it('começa só como barra: sem painel', () => {
    render(<ChatBox {...base} />);
    expect(document.querySelector('[data-chat-modo]')).toBeNull();
    expect(screen.getByLabelText(CAMPO)).toBeTruthy();
  });

  it('focar no campo abre a meia tela e a barra passa a morar no painel', () => {
    render(<ChatBox {...base} />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    const painel = document.querySelector('[data-chat-modo="meia"]') as HTMLElement;
    expect(painel).toBeTruthy();
    expect(painel.querySelector('[data-chat-maximizar]')).toBeTruthy();
    expect(within(painel).getByLabelText(CAMPO)).toBeTruthy();
    // fechar à esquerda: é o primeiro botão do cabeçalho
    expect(painel.querySelectorAll('header button')[0].hasAttribute('data-chat-fechar')).toBe(true);
    expect(painel.querySelector('[data-chat-log]')?.getAttribute('aria-live')).toBe('polite');
  });

  it('mensagens da sessão aparecem e o painel fecha sem perdê-las', async () => {
    aiFetchMock.mockResolvedValue(respostaIA('Oi, parceiro!'));
    render(<ChatBox {...base} useAI />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    await enviar('oi');
    const log = document.querySelector('[data-chat-log]') as HTMLElement;
    expect(log.querySelectorAll('[data-chat-msg="user"]').length).toBe(1);
    expect(log.querySelectorAll('[data-chat-msg="pet"]').length).toBe(1);
    expect(onSendMessage).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector('[data-chat-fechar]')!);
    expect(document.querySelector('[data-chat-modo]')).toBeNull();
    fireEvent.focus(screen.getByLabelText(CAMPO));
    expect(document.querySelectorAll('[data-chat-msg]').length).toBe(2);
  });

  it('maximizar leva à tela cheia com sprite no canto e fechar; restaurar volta à meia', () => {
    render(<ChatBox {...base} />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    fireEvent.click(document.querySelector('[data-chat-maximizar]')!);
    const cheia = document.querySelector('[data-chat-modo="cheia"]') as HTMLElement;
    expect(cheia).toBeTruthy();
    const topo = cheia.querySelector('header')!;
    expect(topo.firstElementChild?.hasAttribute('data-chat-sprite')).toBe(true);
    expect(topo.firstElementChild?.getAttribute('src')).toBe('/sprite.png');
    expect(cheia.querySelector('[data-chat-fechar]')).toBeTruthy();
    expect(within(cheia).getByLabelText(CAMPO)).toBeTruthy();
    fireEvent.click(cheia.querySelector('[data-chat-restaurar]')!);
    expect(document.querySelector('[data-chat-modo="meia"]')).toBeTruthy();
  });

  it('fechar a tela cheia volta à Home e a conversa continua', async () => {
    aiFetchMock.mockResolvedValue(respostaIA('Oi!'));
    render(<ChatBox {...base} useAI />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    await enviar('oi');
    fireEvent.click(document.querySelector('[data-chat-maximizar]')!);
    fireEvent.click(document.querySelector('[data-chat-fechar]')!);
    expect(document.querySelector('[data-chat-modo]')).toBeNull();
    fireEvent.focus(screen.getByLabelText(CAMPO));
    expect(document.querySelectorAll('[data-chat-msg]').length).toBe(2);
  });

  it('Escape fecha o painel', () => {
    render(<ChatBox {...base} />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    fireEvent.keyDown(document.querySelector('[data-chat-modo]')!, { key: 'Escape' });
    expect(document.querySelector('[data-chat-modo]')).toBeNull();
  });

  it('a ponte (chatSafety) segue local e a resposta também aparece na lista', async () => {
    render(<ChatBox {...base} useAI />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    await enviar('quero morrer');
    expect(aiFetchMock).not.toHaveBeenCalled();
    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[data-chat-msg="pet"]').length).toBe(1);
  });

  it('resposta da IA (inclusive a fala padrão de limite diário) vira fala do Soulmon', async () => {
    aiFetchMock.mockResolvedValue(respostaIA('Por hoje chega de papo.'));
    render(<ChatBox {...base} useAI />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    await enviar('oi');
    expect(screen.getByText('Por hoje chega de papo.')).toBeTruthy();
  });

  it('guarda no máximo 20 mensagens visíveis', async () => {
    aiFetchMock.mockResolvedValue(respostaIA('ok'));
    render(<ChatBox {...base} useAI />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    for (let i = 0; i < 12; i++) await enviar(`m${i}`);
    expect(document.querySelectorAll('[data-chat-msg]').length).toBe(20);
  });

  it('o microfone continua na barra dentro do painel', () => {
    render(<ChatBox {...base} />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    const painel = document.querySelector('[data-chat-modo]') as HTMLElement;
    expect(within(painel).getByLabelText('Gravar mensagem')).toBeTruthy();
  });
});

describe('BUG-05: botão voltar do Android no painel do chat', () => {
  it('voltar fecha tela cheia → meia tela → fechado', async () => {
    const { closeTopBackLayer, hasBackLayer } = await import('../utils/backStack');
    render(<ChatBox {...base} />);
    fireEvent.focus(screen.getByLabelText(CAMPO));
    fireEvent.click(document.querySelector('[data-chat-maximizar]') as HTMLElement);
    expect(document.querySelector('[data-chat-modo="cheia"]')).toBeTruthy();
    act(() => { closeTopBackLayer(); });
    expect(document.querySelector('[data-chat-modo="meia"]')).toBeTruthy();
    act(() => { closeTopBackLayer(); });
    expect(document.querySelector('[data-chat-modo]')).toBeNull();
    expect(hasBackLayer()).toBe(false);
  });
});
