// @vitest-environment jsdom
/**
 * BETA-FULL (18/10/2026): e-mail da allowlist `BETA_EMAILS` entra como PAGO. Na tela do ovo o servidor (via
 * `fetchBetaFull`, decidido pelo token) já diz que há plano: o ovo nasce "comprado" (só o "Chocar"), sem modal de
 * compra e sem demo. Quem não está na lista (ou a consulta falha) vê a escolha de sempre.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';
import { tocarOvo } from '../test/ovoOnboarding';
import { pendingTelemetry, resetTelemetryForTest } from '../utils/telemetry';

const ctl = vi.hoisted(() => ({ betaFull: false, chamadas: 0 }));
vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return { ...real, isAuthConfigured: () => true, getCurrentEmail: async () => 'tester@exemplo.com' };
});
vi.mock('../utils/entitlements', async () => {
  const real = await vi.importActual<typeof import('../utils/entitlements')>('../utils/entitlements');
  return { ...real, fetchBetaFull: async () => { ctl.chamadas++; return ctl.betaFull; } };
});

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;

beforeAll(async () => { await import('../utils/oracle/familias'); await import('../utils/oracle/motor'); }, 120_000);

describe('BETA-FULL na tela do ovo', () => {
  beforeEach(() => {
    vi.useFakeTimers(); installFakeStorage(); resetTelemetryForTest(); ctl.chamadas = 0;
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true, writable: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  async function ateOOvo() {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
    fireEvent.click(screen.getByText('I am 18 or older'));
    fireEvent.click(btn('Continue'));
    await atravessarPerguntasIniciais(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  }

  it('allowlist: o ovo ja vem comprado — so "Chocar", sem compra nem guia, sem evento purchase', async () => {
    ctl.betaFull = true;
    await ateOOvo();
    expect(ctl.chamadas).toBeGreaterThan(0);
    expect(btn('Hatch')).toBeTruthy(); // ja de cara, sem tocar 5x
    expect(document.querySelector('[data-ovo-chocar]')).toBeTruthy();
    tocarOvo();
    expect(screen.queryByRole('button', { name: 'Meet your Soulmon' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lend me a guide Soulmon' })).toBeNull();
    expect(pendingTelemetry().filter(r => r.e === 'purchase')).toEqual([]);
  });

  it('fora da lista (ou consulta falha): a escolha de sempre — compra e guia', async () => {
    ctl.betaFull = false;
    await ateOOvo();
    tocarOvo();
    expect(btn('Meet your Soulmon')).toBeTruthy();
    expect(btn('Lend me a guide Soulmon')).toBeTruthy();
  });
});
