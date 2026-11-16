// @vitest-environment jsdom
/**
 * §439: o painel do chat fecha ao tocar fora, ao abrir outra superfície (diálogo novo, foco em outro painel, outra aba)
 * e com Esc; tocar/digitar dentro dele não fecha. Sem backdrop e sem inertizar irmãos: o resto da tela segue interativo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), warning: vi.fn(), success: vi.fn() } }));
vi.mock('../utils/aiClient', () => ({ aiFetch: vi.fn() }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: true }),
  peekServerConfig: () => ({ authRequired: false, transcribeAvailable: true }),
  resetServerConfigCache: () => {},
}));

import { ChatBox } from './ChatBox';

const base = { petName: 'Bito', mood: 'idle' as const, evolutionStage: 'rookie', useAI: false, onSendMessage: vi.fn(), language: 'pt-BR' as const, spriteSrc: '/sprite.png' };
const CAMPO = 'Falar com seu Soulmon';
const painel = () => document.querySelector('[data-chat-modo]');

function abrir() {
  render(<><nav><button type="button" data-aba>Outra aba</button></nav><ChatBox {...base} /></>);
  fireEvent.focus(screen.getByLabelText(CAMPO));
  expect(painel()).toBeTruthy();
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); });

describe('chat fecha ao sair de cena', () => {
  it('toque fora fecha', () => {
    abrir();
    fireEvent.pointerDown(document.body);
    expect(painel()).toBeNull();
  });

  it('toque dentro (cabeçalho, lista, campo) NÃO fecha', () => {
    abrir();
    fireEvent.pointerDown(document.querySelector('[data-chat-log]') as HTMLElement);
    fireEvent.pointerDown(document.querySelector('.sm3-chatpanel-topo') as HTMLElement);
    fireEvent.pointerDown(screen.getByLabelText(CAMPO));
    fireEvent.focusIn(screen.getByLabelText(CAMPO));
    expect(painel()).toBeTruthy();
  });

  it('tela cheia também: dentro não fecha, fora fecha', () => {
    abrir();
    fireEvent.click(document.querySelector('[data-chat-maximizar]') as HTMLElement);
    expect(painel()?.getAttribute('data-chat-modo')).toBe('cheia');
    fireEvent.pointerDown(document.querySelector('[data-chat-log]') as HTMLElement);
    expect(painel()).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(painel()).toBeNull();
  });

  it('trocar de aba (toque na navegação) fecha, e a navegação continua clicável', () => {
    abrir();
    const aba = screen.getByText('Outra aba');
    const clicou = vi.fn();
    aba.addEventListener('click', clicou);
    fireEvent.pointerDown(aba);
    expect(painel()).toBeNull();
    fireEvent.click(aba);
    expect(clicou).toHaveBeenCalled();
  });

  it('abrir outro modal fecha', async () => {
    abrir();
    await act(async () => {
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      document.body.appendChild(modal);
      await Promise.resolve();
    });
    expect(painel()).toBeNull();
  });

  it('foco indo para outro painel fecha', () => {
    abrir();
    fireEvent.focusIn(screen.getByText('Outra aba'));
    expect(painel()).toBeNull();
  });

  it('Esc fecha', () => {
    abrir();
    fireEvent.keyDown(screen.getByLabelText(CAMPO), { key: 'Escape' });
    expect(painel()).toBeNull();
  });

  it('não deixa irmãos inertes nem aria-hidden (classe de bug do modal inerte)', () => {
    abrir();
    const aba = screen.getByText('Outra aba');
    expect(aba.closest('[inert],[aria-hidden="true"]')).toBeNull();
    fireEvent.pointerDown(document.body);
    expect(aba.closest('[inert],[aria-hidden="true"]')).toBeNull();
  });
});
