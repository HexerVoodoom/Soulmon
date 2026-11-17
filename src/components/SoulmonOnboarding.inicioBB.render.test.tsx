// @vitest-environment jsdom
/**
 * INÍCIO BB (dono, 17/11/2026; REGISTRO §472) — o fim do onboarding:
 *
 *   perguntas → (sem acesso) "Want to generate your own Soulmon?" [assinar | agora não] → "Your Soulmon will be ready soon"
 *   → `onComplete` (o jogo abre com o Soulmon no cristal; o CHOCAR é na Home, `ChocarBB`).
 *   Com acesso (compra confirmada / BETA_EMAILS): sem pergunta, leitura do oráculo → "ready soon" → `onComplete` (oracle).
 *
 * Nunca há ovo, reveal, batismo nem "pronto para chocar" no onboarding novo; o "Me empreste um Soulmon guia" saiu.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding, type OnboardingCompleteData } from './SoulmonOnboarding';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';
import { STARTER_IDS } from '../utils/sprites';

const compra = vi.hoisted(() => ({ purchase: vi.fn() }));
vi.mock('../utils/playBilling', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/playBilling')>();
  return { ...orig, isBillingAvailable: () => true, useStoreOpen: () => true, purchase: (...a: unknown[]) => compra.purchase(...a) };
});

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;

function passarTermos(pt = false) {
  fireEvent.click(screen.getByText(pt
    ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
    : 'I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText(pt ? 'Tenho 18 anos ou mais' : 'I am 18 or older'));
  fireEvent.click(btn(pt ? 'Continuar' : 'Continue'));
}

beforeAll(async () => { await import('../utils/oracle/familias'); await import('../utils/oracle/motor'); await import('../utils/soulProfile'); }, 120_000);

describe('Início BB — o fim do onboarding', () => {
  beforeEach(() => {
    vi.useFakeTimers(); installFakeStorage(); compra.purchase.mockReset();
    window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => { vi.useRealTimers(); });

  async function ateAOferta(onComplete: (d: OnboardingCompleteData) => void = () => {}, pt = false) {
    if (pt) localStorage.setItem('soulmon-language', 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
    passarTermos(pt);
    await atravessarPerguntasIniciais(pt);
  }

  it('EN: sem acesso, a pergunta de assinar com o aviso do bebê (só agora, no nascimento); sem ovo nem guia', async () => {
    await ateAOferta();
    expect(screen.getByText('Want to generate your own Soulmon?')).toBeTruthy();
    expect(document.querySelector('[data-inicio-bb-aviso]')?.textContent).toBe(
      'The first form, the baby, is only drawn for you now, at birth: it is not generated again later. The other forms can become yours later on, if you subscribe.');
    expect(btn('Subscribe and generate mine')).toBeTruthy();
    expect(btn('Not now')).toBeTruthy();
    expect(document.querySelector('[data-ovo]')).toBeNull();
    expect(screen.queryByText(/guide Soulmon/)).toBeNull();
    expect(screen.queryByText(/ready to hatch/)).toBeNull();
  });

  it('PT: os mesmos textos em português', async () => {
    await ateAOferta(() => {}, true);
    expect(screen.getByText('Quer gerar o seu próprio Soulmon?')).toBeTruthy();
    expect(document.querySelector('[data-inicio-bb-aviso]')?.textContent).toBe(
      'A primeira forma, o bebê, só é desenhada para você agora, no nascimento: depois ela não é gerada de novo. As outras formas podem ser suas mais tarde, se você assinar.');
    expect(btn('Assinar e gerar o meu')).toBeTruthy();
    expect(btn('Agora não')).toBeTruthy();
  });

  it('"Assinar" abre o modal de compra EXISTENTE; "Not now" do modal volta à pergunta', async () => {
    await ateAOferta();
    fireEvent.click(btn('Subscribe and generate mine'));
    expect(btn(/^Unlock/)).toBeTruthy();
    fireEvent.click(btn('Not now'));
    expect(screen.getByText('Want to generate your own Soulmon?')).toBeTruthy();
  });

  it('recusou: "ready soon" e, ao entrar, o jogo abre no grátis com um inicial (o BB vem do pool depois)', async () => {
    const onComplete = vi.fn();
    await ateAOferta(onComplete);
    fireEvent.click(btn('Not now'));
    expect(screen.getByText('Your Soulmon will be ready soon')).toBeTruthy();
    expect(screen.getByText("It's taking shape inside the crystal. When it's ready, you help it hatch.")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled(); // o jogo NÃO abre antes do "Enter"
    await act(async () => { fireEvent.click(btn('Enter')); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    const d = onComplete.mock.calls[0][0] as OnboardingCompleteData;
    expect(d.mode).toBe('demo');
    expect(STARTER_IDS).toContain((d as { demoCharacterId: string }).demoCharacterId);
  });

  it('comprou: sem pergunta, a leitura roda e vai ao "ready soon" (nunca reveal/batismo); entra como oracle com o prompt do BB', async () => {
    compra.purchase.mockResolvedValue({ ok: true, ent: { tier: 'paid' } });
    const onComplete = vi.fn();
    await ateAOferta(onComplete);
    fireEvent.click(btn('Subscribe and generate mine'));
    await act(async () => { fireEvent.click(btn(/^Unlock/)); });
    vi.useRealTimers(); // a leitura do oráculo é real (import + cálculo): espera de verdade
    expect(await screen.findByText('Your Soulmon will be ready soon', {}, { timeout: 45_000 })).toBeTruthy();
    expect(screen.queryByText(/Name your Soulmon/)).toBeNull();
    expect(screen.queryByText(/^Hatch /)).toBeNull();
    await act(async () => { fireEvent.click(btn('Enter')); });
    const d = onComplete.mock.calls[0][0] as Extract<OnboardingCompleteData, { mode: 'oracle' }>;
    expect(d.mode).toBe('oracle');
    expect(d.revealSprite).toBeUndefined();
    expect(d.oracleResult.creature.bbPrompts?.imagePrompt).toBeTruthy();
  }, 60_000);
});
