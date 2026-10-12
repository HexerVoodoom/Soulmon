// @vitest-environment jsdom
/**
 * Cliente do beta fechado + aviso de recusa de sprite (release/beta-1).
 * Critérios: 403 `beta-closed` troca o app pela tela própria (PT/EN, identidade);
 * a recusa de sprite mostra UM aviso claro por código e não quebra.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
const authMock = vi.hoisted(() => ({ getCurrentEmail: vi.fn(async () => 'a.na@gmail.com'), signOut: vi.fn(async () => {}), authHeaders: vi.fn(async () => ({})) }));
vi.mock('./auth', () => authMock);
import { installDomGlobals } from '../test/renderEnv';
import { detectBetaClosed, _resetBetaClosed, isBetaClosedNow, trocarContaBetaFechado } from './betaClosed';
import { cloudSave, cloudLoad } from './cloudSave';
import { useEffect } from 'react';
import { fireEvent } from '@testing-library/react';
import { RECONCILE_KEYS } from './storageKeys';
import { BetaClosedGate } from '../components/BetaClosedGate';
import { avisarRecusaDeSprite, _resetAvisosDeSprite } from './spriteGen';
import { STORAGE_KEYS } from './storageKeys';

// A tela é `lazy` (fora do chunk de entrada). Sob carga, a 1ª transformação do módulo pelo
// Vitest passou de 1 s (falha vista no gate:fuso/Tokyo; isolada passa). Pré-carregar o módulo
// tira o relógio do teste sem afrouxar o que ele afirma.
beforeAll(async () => { await import('../components/BetaClosedScreen'); });
beforeEach(() => { installDomGlobals(); localStorage.clear(); _resetBetaClosed(); _resetAvisosDeSprite(); toast.mockReset(); });
afterEach(() => { cleanup(); });

const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('beta fechado no app', () => {
  it('só 403 com error/reason beta-closed marca; outros 403 não', async () => {
    expect(await detectBetaClosed(res(403, { error: 'forbidden' }))).toBe(false);
    expect(await detectBetaClosed(res(401, { error: 'beta-closed' }))).toBe(false);
    expect(isBetaClosedNow()).toBe(false);
    expect(await detectBetaClosed(res(403, { reason: 'beta-closed' }))).toBe(true);
    expect(isBetaClosedNow()).toBe(true);
  });

  it('o gate troca o app pela tela com identidade (PT) assim que o servidor diz beta-closed', async () => {
    render(<BetaClosedGate><p>app de verdade</p></BetaClosedGate>);
    expect(screen.getByText('app de verdade')).toBeTruthy();
    await act(async () => { await detectBetaClosed(res(403, { error: 'beta-closed' })); });
    expect(screen.queryByText('app de verdade')).toBeNull();
    expect(await screen.findByRole('heading', { name: 'O Soulmon está em teste fechado' })).toBeTruthy(); // tela lazy
    expect(document.querySelector('[data-beta-closed] img[alt="Soulmon"]')).toBeTruthy();
  });

  it('EN quando o idioma salvo é inglês', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
    await detectBetaClosed(res(403, { error: 'beta-closed' }));
    render(<BetaClosedGate><p>app</p></BetaClosedGate>);
    expect(await screen.findByRole('heading', { name: 'Soulmon is in a closed test' })).toBeTruthy();
  });
});

describe('recusa de sprite: mensagem clara, uma vez', () => {
  const msg = { 'pt-BR': 'O ateliê do Oráculo está fechado por enquanto.', en: "The Oracle's studio is closed for now." };
  it('sprite-disabled mostra o texto do servidor uma vez por sessão; código sem aviso não mostra', () => {
    expect(avisarRecusaDeSprite('sprite-disabled', msg)).toBe(true);
    expect(avisarRecusaDeSprite('sprite-disabled', msg)).toBe(false);
    expect(avisarRecusaDeSprite('ai-quota-unavailable', msg)).toBe(false);
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(msg['pt-BR']);
  });
});

describe('C1: a tela mostra o e-mail da sessão e deixa trocar de conta', () => {
  it('mostra o e-mail, orienta a pedir ao Mateus e o botão troca de conta', async () => {
    await detectBetaClosed(res(403, { error: 'beta-closed' }));
    const recarregar = vi.fn();
    render(<BetaClosedGate><p>app</p></BetaClosedGate>);
    await vi.waitFor(() => expect(document.querySelector('[data-beta-email]')!.textContent).toContain('a.na@gmail.com'));
    expect(document.body.textContent).toMatch(/peça ao Mateus para incluir este e-mail/);
    expect(await screen.findByRole('button', { name: 'Trocar de conta' })).toBeTruthy();
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, '{"petName":"Rascunho"}');
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'b'.repeat(32));
    await trocarContaBetaFechado(recarregar);
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBeNull();
    expect(JSON.parse(localStorage.getItem(RECONCILE_KEYS.CONFLICT_BACKUP)!).motivo).toBe('beta-closed');
    expect(authMock.signOut).toHaveBeenCalled();
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('EN: "Switch account" e "ask Mateus"', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
    await detectBetaClosed(res(403, { error: 'beta-closed' }));
    render(<BetaClosedGate><p>app</p></BetaClosedGate>);
    expect(await screen.findByRole('button', { name: 'Switch account' })).toBeTruthy();
    expect(document.body.textContent).toMatch(/ask Mateus to add this e-mail/);
  });
});

describe('B1: o veredito beta-closed não monta estado nem grava save por cima', () => {
  const ID = 'c'.repeat(32);
  const SALVO = '{"petName":"Verdadeiro","level":9}';

  it('GET 403 beta-closed: cloudLoad devolve null e NÃO toca o save local', async () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, SALVO);
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, ID);
    vi.stubGlobal('fetch', vi.fn(async () => res(403, { error: 'beta-closed' })));
    expect(await cloudLoad(ID)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBe(SALVO);
    expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBe(ID);
    expect(isBetaClosedNow()).toBe(true);
    vi.unstubAllGlobals();
  });

  it('POST 403 beta-closed: cloudSave falha sem retentar e sem mexer no local', async () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, SALVO);
    const f = vi.fn(async () => res(403, { error: 'beta-closed' }));
    vi.stubGlobal('fetch', f);
    const r = await cloudSave(ID, { petName: 'Outro' });
    expect(r.ok).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBe(SALVO);
    vi.unstubAllGlobals();
  });

  it('com o veredito, o app (filho do gate) DESMONTA: efeito que gravaria save para de rodar', async () => {
    let gravacoes = 0;
    function AppFalso() {
      useEffect(() => { const t = setInterval(() => { gravacoes++; localStorage.setItem(STORAGE_KEYS.GAME_STATE, '{"sobrescrito":true}'); }, 5); return () => clearInterval(t); }, []);
      return <p>app</p>;
    }
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, SALVO);
    render(<BetaClosedGate><AppFalso /></BetaClosedGate>);
    await act(async () => { await detectBetaClosed(res(403, { error: 'beta-closed' })); });
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, SALVO); // estado no momento do veredito
    const antes = gravacoes;
    await new Promise(r => setTimeout(r, 40));
    expect(gravacoes).toBe(antes);
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBe(SALVO);
    expect(screen.queryByText('app')).toBeNull();
    void fireEvent;
  });
});
