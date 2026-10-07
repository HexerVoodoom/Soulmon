// @vitest-environment jsdom
/**
 * O BOTÃO DEMO DA HOME (07/10/2026) — o portão tem a porta SEM conta: DEMO →
 * escolha dos 5 iniciais (nome, tipo e arte) → `onStartDemo(id)`. Sem login, sem
 * termos, sem perguntas. O que a demo grava (Vínculo 5, sem XP) é de
 * `utils/demoStart.ts` e está em `demoMode.test.ts`; aqui se prova o FLUXO de tela.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return { ...real, isAuthConfigured: () => true, getCurrentEmail: async () => null };
});

async function montar(props: { onStartDemo?: (id: never) => void } = {}) {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} {...props as object} />);
  await act(async () => {});
}

describe('o botão DEMO no portão', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
  });

  it('aparece na home, com o rótulo "DEMO", acessível, e uma linha que diz a regra', async () => {
    await montar({ onStartDemo: vi.fn() });
    const b = screen.getByRole('button', { name: 'DEMO — try it without an account' }) as HTMLButtonElement;
    expect(b.textContent).toBe('DEMO');
    expect(b.hasAttribute('disabled')).toBe(false);
    expect(document.body.textContent).toContain('Saved on this device only.');
    // o login continua sendo a ação principal da tela
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  });

  it('em PT o rótulo continua "DEMO" e o nome acessível é traduzido', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    await montar({ onStartDemo: vi.fn() });
    const b = screen.getByRole('button', { name: 'DEMO — experimentar sem conta' });
    expect(b.textContent).toBe('DEMO');
  });

  it('sem `onStartDemo` o portão não mostra o botão', async () => {
    await montar();
    expect(document.querySelector('[data-demo-button]')).toBeNull();
  });

  it('DEMO abre a escolha: os 5 iniciais, cada um com nome e TIPO, e a regra da demo em uma linha', async () => {
    await montar({ onStartDemo: vi.fn() });
    fireEvent.click(document.querySelector('[data-demo-button]')!);
    const cards = document.querySelectorAll('button[data-demo-char]');
    expect(cards.length).toBe(5);
    expect(document.body.textContent).toContain('Choose your Soulmon');
    expect(document.body.textContent).toContain('Bond level 5');
    expect(document.body.textContent).toContain('No XP, no purchases and no PvP.');
    for (const c of PREMADE_CHARACTERS) {
      const card = document.querySelector(`button[data-demo-char="${c.id}"]`)!;
      expect(card.textContent).toContain(c.name);
      expect(card.textContent).toContain(c.typeEn);
      expect(card.getAttribute('aria-label')).toContain(c.typeEn);
      expect(card.querySelector('img')!.getAttribute('src')).toBeTruthy();
    }
    expect(document.body.textContent).toContain('Steel + Battering Ram');
    expect(document.body.textContent).toContain('Spring + Vital Melody');
  });

  it('escolher um chama `onStartDemo` com o id — qualquer um dos 5', async () => {
    for (const c of PREMADE_CHARACTERS) {
      document.body.innerHTML = '';
      const onStartDemo = vi.fn();
      await montar({ onStartDemo });
      fireEvent.click(document.querySelector('[data-demo-button]')!);
      fireEvent.click(document.querySelector(`button[data-demo-char="${c.id}"]`)!);
      expect(onStartDemo).toHaveBeenCalledExactlyOnceWith(c.id);
    }
  });

  it('em PT a escolha diz os tipos em PT e a seta de voltar devolve ao portão', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    await montar({ onStartDemo: vi.fn() });
    fireEvent.click(document.querySelector('[data-demo-button]')!);
    expect(document.body.textContent).toContain('Aço + Aríete');
    expect(document.body.textContent).toContain('Nascente + Melodia Vital');
    expect(document.body.textContent).toContain('Sem XP, sem compras e sem PvP');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(document.querySelector('[data-demo-button]')).toBeTruthy();
  });
});
