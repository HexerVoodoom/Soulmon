// @vitest-environment jsdom
/**
 * Cliente do beta fechado + aviso de recusa de sprite (release/beta-1).
 * Critérios: 403 `beta-closed` troca o app pela tela própria (PT/EN, identidade);
 * a recusa de sprite mostra UM aviso claro por código e não quebra.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
import { installDomGlobals } from '../test/renderEnv';
import { detectBetaClosed, _resetBetaClosed, isBetaClosedNow } from './betaClosed';
import { BetaClosedGate } from '../components/BetaClosedGate';
import { avisarRecusaDeSprite, _resetAvisosDeSprite } from './spriteGen';
import { STORAGE_KEYS } from './storageKeys';

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
    expect(screen.getByRole('heading', { name: 'O Soulmon está em teste fechado' })).toBeTruthy();
    expect(document.querySelector('[data-beta-closed] img[alt="Soulmon"]')).toBeTruthy();
  });

  it('EN quando o idioma salvo é inglês', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
    await detectBetaClosed(res(403, { error: 'beta-closed' }));
    render(<BetaClosedGate><p>app</p></BetaClosedGate>);
    expect(screen.getByRole('heading', { name: 'Soulmon is in a closed test' })).toBeTruthy();
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
