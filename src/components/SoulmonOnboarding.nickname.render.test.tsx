// @vitest-environment jsdom
/**
 * Pedido do dono (01/11/2026): o NICKNAME é a PRIMEIRA pergunta do onboarding, antes até da apresentação da Ambra / do
 * ancião do Velado. É o mesmo `userName` que vira o perfil público (nada de campo novo); não entra no cálculo do oráculo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { writeLocal } from '../utils/safeStorage';

vi.mock('../utils/auth', async (importOriginal) => ({ ...(await importOriginal<typeof import('../utils/auth')>()), isAuthConfigured: () => false }));

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
function passarTermos() {
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
}
const sequencia = () => document.querySelector('[data-npc-sequence]');

describe('nickname como 1ª pergunta', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); });
  afterEach(() => { vi.useRealTimers(); });

  it('depois dos Termos vem o nickname, ANTES da apresentação; só então a Ambra e o ritual', () => {
    renderWithCss(<SoulmonOnboarding onComplete={vi.fn()} />);
    passarTermos();
    expect(sequencia()).toBeNull();
    const campo = screen.getByLabelText('Your name');
    fireEvent.change(campo, { target: { value: 'A' } });
    expect(btn('Continue').getAttribute('aria-disabled')).toBe('true');
    fireEvent.change(campo, { target: { value: 'Corvo Azul' } });
    fireEvent.click(btn('Continue'));
    expect(sequencia()).toBeTruthy();
    fireEvent.click(document.querySelector('[data-npc-skip]')!);
    expect(screen.queryByLabelText('Your name')).toBeNull();
    expect(document.querySelector('button[aria-pressed]')).toBeTruthy();
  });

  it('quem já tem nickname pula a pergunta e vê direto a apresentação', () => {
    installFakeStorage();
    writeLocal(STORAGE_KEYS.USER_NAME, 'Velho Nome');
    renderWithCss(<SoulmonOnboarding onComplete={vi.fn()} />);
    passarTermos();
    expect(screen.queryByLabelText('Your name')).toBeNull();
    expect(sequencia()).toBeTruthy();
  });

  it('o oráculo e o soulProfile não leem o nickname (nenhum módulo deles cita apelido/userName)', () => {
    const lidos = Object.values(import.meta.glob(['../utils/oracle/*.ts', '../utils/soulProfile/**/*.ts', '!../**/*.test.ts'], { eager: true, query: '?raw', import: 'default' })) as string[];
    expect(lidos.length).toBeGreaterThan(5);
    for (const src of lidos) expect(src).not.toMatch(/(nickname|userName)/);
  });
});
