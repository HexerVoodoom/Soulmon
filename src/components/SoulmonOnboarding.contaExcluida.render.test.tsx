// @vitest-environment jsdom
/**
 * F1 / A1 / A2 (QA rodada 2, FATAL): e-mail cuja conta tem LÁPIDE (410) não
 * entra no onboarding. O portão mostra o aviso (com cabeçalho e região viva
 * que já existia vazia na montagem) e a pessoa fica na primeira tela; o
 * próximo login do mesmo e-mail passa, porque o servidor limpa a lápide.
 *
 * Também: a mensagem gravada por `reagirContaExcluida` (410 num aparelho que
 * ainda tinha o save) é lida UMA vez na montagem e anunciada pós-mount.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';

const { estado } = vi.hoisted(() => ({
  estado: { excluida: null as null | { mensagem: string; saveId: string }, chamadas: [] as string[] },
}));

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return {
    ...real,
    isAuthConfigured: () => true,
    getCurrentEmail: async () => null,
    entrarComSenha: async (e: string) => { estado.chamadas.push(`entrar:${e}`); return { ok: true, email: e }; },
    criarContaComSenha: async (e: string) => ({ ok: true, email: e }),
    entrarComGoogle: async () => ({ ok: true, email: 'g@exemplo.com' }),
    mandarResetDeSenha: async () => ({ ok: true }),
  };
});
vi.mock('../utils/cloudSave', async () => {
  const real = await vi.importActual<typeof import('../utils/cloudSave')>('../utils/cloudSave');
  return {
    ...real,
    checarContaExcluidaNoLogin: async (e: string) => { estado.chamadas.push(`checar:${e}`); return estado.excluida; },
  };
});

const botao = (nome: string) => fireEvent.click(screen.getByRole('button', { name: nome }));
const ir = (t: string) => fireEvent.click(screen.getByText(t));

async function montar() {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
  await act(async () => {});
}

async function entrar(email: string) {
  botao('New User');
  ir('I am 18 or older');
  ir('I have read and agree to the Terms of Use and the Privacy Policy');
  botao('I already have an account — sign in');
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'segredo123' } });
  await act(async () => { botao('Sign in'); });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
  estado.excluida = null;
  estado.chamadas = [];
});

describe('lápide no login', () => {
  it('conta excluída → NÃO entra no "porquê"; fica no portão com cabeçalho + aviso na região viva', async () => {
    estado.excluida = { mensagem: 'This account was deleted on 03/09. The server frees the email on your next sign-in — try signing in again.', saveId: 'x' };
    await montar();
    // A região viva existe VAZIA desde a montagem (A1).
    const live = document.querySelector('[data-account-deleted-live]')!;
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('');

    await entrar('alguem@exemplo.com');
    expect(estado.chamadas).toEqual(['entrar:alguem@exemplo.com', 'checar:alguem@exemplo.com']);
    expect(screen.queryByText('What should we call you?')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Account deleted' })).toBeTruthy();
    // A região é remontada com a troca de passo (ida ao formulário e volta).
    expect(document.querySelector('[data-account-deleted-live]')!.textContent).toContain('deleted on 03/09');
    // De volta à primeira tela — as duas portas.
    expect(screen.getByRole('button', { name: 'New User' })).toBeTruthy();
    // Nada ficou pendurado no aparelho para a próxima abertura repetir.
    expect(localStorage.getItem(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBeNull();
  });

  it('conta normal → segue para o "porquê" e o aviso não aparece', async () => {
    await montar();
    await entrar('ok@exemplo.com');
    expect(screen.getByText('What should we call you?')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Account deleted' })).toBeNull();
  });

  it('A1: aviso gravado por `reagirContaExcluida` é lido uma vez, apagado, e entra na região viva DEPOIS da montagem', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE, 'This account was deleted. The server frees the email on your next sign-in — try signing in again.');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    // Primeira pintura: região viva vazia (senão o leitor de tela não anuncia).
    expect(document.querySelector('[data-account-deleted-live]')!.textContent).toBe('');
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(screen.getByRole('heading', { name: 'Account deleted' })).toBeTruthy();
    expect(document.querySelector('[data-account-deleted-notice]')!.textContent).toContain('next sign-in');
    expect(localStorage.getItem(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBeNull();
  });

  it('PT: cabeçalho e aviso em português', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE, 'Esta conta foi excluída. O servidor libera o e-mail no próximo login — tente entrar de novo.');
    await montar();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(screen.getByRole('heading', { name: 'Conta excluída' })).toBeTruthy();
  });
});
