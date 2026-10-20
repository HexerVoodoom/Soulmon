// @vitest-environment jsdom
/**
 * D-110: depois do batismo ("Hatch <nome>" do REVEAL pago) o Soulmon SE APRESENTA numa NpcSequence antes de o app
 * abrir. O caminho até o reveal é o do ritual pago de verdade (ovo -> compra mockada -> Chocar -> geração real do
 * Oráculo); só a compra e o pedido do sprite são falsos.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding, type OnboardingCompleteData } from './SoulmonOnboarding';
import { LUZ_EXPANDE_MS, LUZ_SOME_MS } from './OnboardingOvo';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';
import { tocarOvo } from '../test/ovoOnboarding';
import { PET_PASSIVES } from '../utils/passives';
import { PLACEHOLDER_ART } from '../utils/placeholderArt';

const falso = vi.hoisted(() => ({
  purchase: vi.fn(),
  sprite: vi.fn(),
}));
vi.mock('../utils/playBilling', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/playBilling')>();
  return {
    ...orig,
    isBillingAvailable: () => true,
    useStoreOpen: () => true,
    purchase: (...a: unknown[]) => falso.purchase(...a),
  };
});
// A geração do desenho é rede: aqui devolve uma URL fixa (ou falha, para o casulo).
vi.mock('../utils/spriteGen', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/spriteGen')>();
  return { ...orig, requestSprite: (...a: unknown[]) => falso.sprite(...a) };
});

const SPRITE_URL = 'data:image/png;base64,AAAA';
const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;

function passarTermos() {
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
}

beforeAll(async () => {
  await import('../utils/oracle/familias');
  await import('../utils/oracle/motor');
  await import('../utils/soulProfile');
}, 120_000);

/** Ovo -> compra -> Chocar -> geração -> o botão "Hatch <nome>" do reveal. Devolve o nome batizado. */
async function ateOReveal(onComplete: (d: OnboardingCompleteData) => void) {
  renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
  passarTermos();
  await atravessarPerguntasIniciais(false);
  tocarOvo();
  fireEvent.click(btn('Meet your Soulmon'));
  await act(async () => { fireEvent.click(btn(/^Unlock/)); });
  fireEvent.click(btn('Hatch'));
  await act(async () => { await vi.advanceTimersByTimeAsync(LUZ_EXPANDE_MS + LUZ_SOME_MS); });
  // a geração real do Oráculo corre em promessas/imports dinâmicos: avança o relógio até o reveal aparecer
  const batizado = await vi.waitFor(async () => {
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    const hatch = screen.queryByRole('button', { name: /^Hatch .+/ });
    if (!hatch) throw new Error('reveal ainda não abriu');
    return hatch.textContent!.replace(/^Hatch\s+/, '').trim();
  }, { timeout: 60_000, interval: 50 });
  // o desenho chega depois do texto (a cerimônia de espera do reveal): deixa o pedido falso resolver
  await act(async () => { await vi.advanceTimersByTimeAsync(100); });
  await vi.waitFor(() => expect(falso.sprite).toHaveBeenCalled(), { timeout: 10_000 });
  await act(async () => { await vi.advanceTimersByTimeAsync(100); });
  return batizado;
}

describe('D-110: o Soulmon se apresenta depois do batismo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    installFakeStorage();
    falso.purchase.mockReset();
    falso.purchase.mockResolvedValue({ ok: true, ent: { tier: 'paid' } });
    falso.sprite.mockReset();
    falso.sprite.mockResolvedValue({ image: SPRITE_URL });
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true, writable: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('depois do Hatch aparece a NpcSequence (>= 3 falas, arte = sprite do reveal), onComplete só no fim; Skip chama UMA vez com o traço e o nome', async () => {
    const onComplete = vi.fn();
    const nome = await ateOReveal(onComplete);
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Hatch .+/ }));
    // (d) o app NÃO abre antes de a apresentação terminar
    expect(onComplete).not.toHaveBeenCalled();
    const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
    expect(seq).toBeTruthy();
    // (c) a 1ª fala traz o nome batizado
    expect(seq.textContent).toContain(`Hi, I'm ${nome}.`);
    expect(seq.textContent).toContain('digital counterpart of your soul');
    // (a) a arte é a do reveal e o falante é o Soulmon
    expect((seq.querySelector('[data-npc-art]') as HTMLImageElement).getAttribute('src')).toBe(SPRITE_URL);
    expect(seq.querySelector('[data-npc-name]')?.textContent).toBe(nome);

    // >= 3 falas navegáveis: avança 2 toques sem fechar
    const avancar = () => fireEvent.click(document.querySelector('[data-npc-sequence] [data-npc-advance]')!);
    avancar();
    avancar();
    expect(document.querySelector('[data-npc-sequence]')).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    // (b) Skip: onComplete UMA vez, com petPassive válido e o petName batizado
    fireEvent.click(document.querySelector('[data-npc-skip]')!);
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    const dados = onComplete.mock.calls[0][0] as OnboardingCompleteData;
    expect(dados.mode).toBe('oracle');
    expect(dados.petName).toBe(nome);
    expect(PET_PASSIVES.map(p => p.id)).toContain(dados.petPassive);
  });

  it('sem sprite no reveal, a arte é o casulo (dormant), nunca arte de reserva', async () => {
    falso.sprite.mockRejectedValue(new Error('sem rede'));
    const onComplete = vi.fn();
    await ateOReveal(onComplete);
    fireEvent.click(screen.getByRole('button', { name: /^Hatch .+/ }));
    const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
    expect((seq.querySelector('[data-npc-art]') as HTMLImageElement).getAttribute('src')).toBe(PLACEHOLDER_ART.dormant);
  });
});
