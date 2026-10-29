// @vitest-environment jsdom
/**
 * D-150..D-160: a tela de decisão do elemento (a Iris) entre a geração e o reveal. O caminho é o do ritual pago de
 * verdade (ovo -> compra mockada -> Chocar -> geração real do Oráculo); só a compra e o pedido do sprite são falsos.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { LUZ_EXPANDE_MS, LUZ_SOME_MS } from './OnboardingOvo';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';
import { tocarOvo } from '../test/ovoOnboarding';

const falso = vi.hoisted(() => ({ purchase: vi.fn(), sprite: vi.fn(), credits: vi.fn() }));
vi.mock('../utils/playBilling', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/playBilling')>();
  return {
    ...orig,
    isBillingAvailable: () => true,
    useStoreOpen: () => true,
    purchase: (...a: unknown[]) => falso.purchase(...a),
  };
});
vi.mock('../utils/entitlements', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/entitlements')>();
  return { ...orig, spendCredits: (...a: unknown[]) => falso.credits(...a) };
});
vi.mock('../utils/spriteGen', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/spriteGen')>();
  return { ...orig, requestSprite: (...a: unknown[]) => falso.sprite(...a) };
});

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
const girar = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeAll(async () => {
  await import('../utils/oracle/familias');
  await import('../utils/oracle/motor');
  await import('../utils/soulProfile');
}, 120_000);

async function ateAIris() {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
  await atravessarPerguntasIniciais(false);
  tocarOvo();
  fireEvent.click(btn('Meet your Soulmon'));
  await act(async () => { fireEvent.click(btn(/^Unlock/)); });
  fireEvent.click(btn('Hatch'));
  await girar(LUZ_EXPANDE_MS + LUZ_SOME_MS);
  await vi.waitFor(async () => {
    await girar(500);
    if (!screen.queryByRole('button', { name: 'I love it' })) throw new Error('tela da Iris ainda não abriu');
  }, { timeout: 60_000, interval: 50 });
}

// 21/10/2026 (dono): a tela da Iris está OCULTA (`TELA_GOSTEI_OCULTA` em SoulmonOnboarding.tsx; o fluxo segue direto como "Gostei").
// Reativar estes testes junto com a flag.
describe.skip('D-150: a Iris diz o elemento antes do desenho', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    installFakeStorage();
    falso.purchase.mockReset();
    falso.purchase.mockResolvedValue({ ok: true, ent: { tier: 'paid' } });
    falso.sprite.mockReset();
    falso.sprite.mockResolvedValue({ image: 'data:image/png;base64,AAAA' });
    falso.credits.mockReset();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true, writable: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('mostra nome + elemento + frase, sem classe nem Essência; sem sprite até o "I love it"; trocar de lado muda o texto e chega à apresentação com o nome novo', async () => {
    await ateAIris();
    const regiao = screen.getByRole('status', { name: 'Iris, the Oracle, speaks' });
    const fala = regiao.textContent!;
    expect(fala).toMatch(/Iris/);
    expect(fala).toMatch(/Your Soulmon is \S+\. A \S+ soul/);
    expect(document.body.textContent).not.toMatch(/Essence|essence|Blacksmith/);
    expect(document.querySelector('[data-iris-card]')!.parentElement!.textContent).not.toMatch(/\d+\s?%/);
    expect(falso.sprite).not.toHaveBeenCalled();
    expect(document.querySelector('.sm2-ora-cocoon')).toBeNull();

    // tentar de novo -> lista
    fireEvent.click(btn('Let me try again'));
    expect(screen.getByText('Pick another side')).toBeTruthy();
    expect(screen.getByText('I can look at your soul from another side. Which one feels right?')).toBeTruthy();
    const opcoes = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-element-option]'));
    expect(opcoes.length).toBeGreaterThanOrEqual(2);
    const atual = opcoes.filter(o => o.getAttribute('aria-current') === 'true');
    expect(atual).toHaveLength(1);
    expect(atual[0]).toBe(opcoes[0]);
    expect(atual[0].textContent).toContain('current');
    expect(falso.sprite).not.toHaveBeenCalled();

    // voltar sem escolher mantém o texto
    fireEvent.click(screen.getByRole('button', { name: /^Keep / }));
    expect(screen.getByRole('status', { name: 'Iris, the Oracle, speaks' }).textContent).toBe(fala);

    // escolhe outro lado
    fireEvent.click(btn('Let me try again'));
    const outro = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-element-option]'))[1];
    await act(async () => { fireEvent.click(outro); });
    await vi.waitFor(async () => {
      await girar(200);
      if (!screen.queryByRole('button', { name: 'I love it' })) throw new Error('ainda regerando');
    }, { timeout: 60_000, interval: 50 });
    const nova = screen.getByRole('status', { name: 'Iris, the Oracle, speaks' }).textContent!;
    expect(nova).not.toBe(fala);
    const nomeNovo = /Your Soulmon is (\S+)\./.exec(nova)![1];
    expect(falso.sprite).not.toHaveBeenCalled();

    // Gostei -> reveal, sprite pedido 1x
    fireEvent.click(btn('I love it'));
    await vi.waitFor(async () => { await girar(100); expect(falso.sprite).toHaveBeenCalled(); }, { timeout: 10_000, interval: 50 });
    await girar(300);
    expect(falso.sprite).toHaveBeenCalledTimes(1);
    const hatch = await vi.waitFor(async () => {
      await girar(300);
      const h = screen.queryByRole('button', { name: /^Hatch .+/ });
      if (!h) throw new Error('reveal não abriu');
      return h;
    }, { timeout: 30_000, interval: 50 });
    expect(hatch.textContent).toContain(`Hatch ${nomeNovo}`);
    expect(document.body.textContent).not.toMatch(/ essence/i);
    fireEvent.click(hatch);
    const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
    expect(seq.querySelector('[data-npc-name]')?.textContent).toBe(nomeNovo);
    expect(falso.credits).not.toHaveBeenCalled();
  });

  it('duplo clique em "I love it" pede o desenho 1x', async () => {
    await ateAIris();
    const b = btn('I love it');
    fireEvent.click(b);
    fireEvent.click(b);
    await vi.waitFor(async () => { await girar(100); expect(falso.sprite).toHaveBeenCalled(); }, { timeout: 10_000, interval: 50 });
    await girar(500);
    expect(falso.sprite).toHaveBeenCalledTimes(1);
  });
});
