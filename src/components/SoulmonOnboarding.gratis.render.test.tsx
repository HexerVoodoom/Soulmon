// @vitest-environment jsdom
/**
 * "Começar agora — é grátis" (relato do dono, 04/10/2026: "não está avançando").
 *
 * O 1º toque carrega o motor do Oráculo sob demanda. Sem retorno, em rede móvel
 * parecia travado; e se o chunk falhasse, o toque não fazia nada. Contrato:
 *  · enquanto a leitura é preparada o botão fica ocupado (`aria-busy`, desligado)
 *    e mostra "Getting ready…" — toque repetido não dispara outra geração;
 *  · se a geração falhar, aparece o recado âmbar (`role=alert`) e o botão VOLTA a
 *    funcionar para tentar de novo;
 *  · se der certo, avança para a leitura demo.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';

const gerar = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock('../utils/oracle', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/oracle')>();
  gerar.fn.mockImplementation(orig.generateOracleAsync);
  return { ...orig, generateOracleAsync: (...a: Parameters<typeof orig.generateOracleAsync>) => gerar.fn(...a) };
});

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;

function passarPortao() {
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
}

beforeAll(async () => { await import('../utils/oracle/familias'); await import('../utils/oracle/motor'); }, 120_000);

describe('Começar agora — é grátis', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    installFakeStorage();
    renderWithCss(<SoulmonOnboarding onComplete={vi.fn()} />);
    passarPortao();
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('enquanto prepara a leitura, o botão fica ocupado e o toque repetido não gera de novo', async () => {
    await atravessarPerguntasIniciais();
    let liberar!: (v: unknown) => void;
    gerar.fn.mockImplementationOnce(() => new Promise(r => { liberar = r; }));
    const antes = gerar.fn.mock.calls.length;
    fireEvent.click(btn('Start now — it’s free'));
    const ocupado = btn('Getting ready…');
    expect(ocupado.getAttribute('aria-busy')).toBe('true');
    expect(ocupado.disabled).toBe(true);
    fireEvent.click(ocupado);
    expect(gerar.fn.mock.calls.length).toBe(antes + 1);
    // não avançou ainda
    expect(screen.queryByText('Your soul\'s creature')).toBeNull();
    await act(async () => { liberar(undefined); });
  });

  it('se a geração falhar: recado âmbar e o botão volta, para tentar de novo', async () => {
    await atravessarPerguntasIniciais();
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    gerar.fn.mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'));
    await act(async () => { fireEvent.click(btn('Start now — it’s free')); });
    expect(screen.getByRole('alert').textContent).toContain("couldn't start just now");
    const volta = btn('Start now — it’s free');
    expect(volta.disabled).toBe(false);
    expect(aviso).toHaveBeenCalled();
    // ainda na escolha: nada avançou
    expect(screen.getByText('How do you want to start?')).toBeTruthy();
    // e a segunda tentativa funciona
    gerar.fn.mockImplementationOnce(async () => ({ creature: { baseName: 'Teste', bio: { pt: 'x', en: 'x' } } }) as never);
    await act(async () => { fireEvent.click(volta); });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
