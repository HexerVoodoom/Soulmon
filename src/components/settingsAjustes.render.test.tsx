// @vitest-environment jsdom
/**
 * Configurações — os ajustes da navegação do dono (01/10/2026,
 * `docs/AJUSTES-NAVEGACAO-2026-10-01.md`, bloco G):
 *  · G2 cada grupo é acordeão FECHADO por padrão;
 *  · G3 "Your plan: Full" virou selo de conta Full (compra única);
 *  · G4 o campo de e-mail para entrar saiu;
 *  · G5 "Seus dados" sem as frases fixas; o "?" revela as duas explicações;
 *  · G7 a linha "Personalidade" saiu (a personalidade é derivada).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { AccountSection } from './AccountSection';
import { ThemeProvider } from '../contexts/ThemeContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/entitlements', () => ({
  fetchEntitlement: vi.fn(async () => ({ tier: 'paid', credits: 7 })),
}));

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  });
}

function renderSettings(language: 'pt-BR' | 'en-US' = 'en-US') {
  return renderWithCss(
    <ThemeProvider>
      <SettingsPage
        useAI={false} onToggleAI={() => {}}
        language={language} onChangeLanguage={() => {}} onOpenGuide={() => {}} onOpenGlossary={() => {}}
        notificationsEnabled={false} onToggleNotifications={() => {}}
        onRestoreFromCloud={async () => true} onLoginWithEmail={async () => 'loaded' as const}
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  installMatchMedia();
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'abcdef0123456789abcdef0123456789');
});

describe('G2 — grupos em acordeão fechado', () => {
  it('todo grupo nasce fechado: só o título e o indicador, corpo escondido', () => {
    renderSettings();
    const toggles = Array.from(document.querySelectorAll('[data-group-toggle]'));
    expect(toggles.length).toBeGreaterThanOrEqual(6);
    for (const t of toggles) {
      expect(t.getAttribute('aria-expanded')).toBe('false');
      const body = document.getElementById(t.getAttribute('aria-controls')!);
      expect(body?.hidden).toBe(true);
    }
    expect(screen.queryAllByRole('switch')).toHaveLength(0);
  });

  it('tocar no título abre (e fecha) o grupo', () => {
    renderSettings();
    const t = screen.getByRole('button', { name: /^Appearance/ });
    fireEvent.click(t);
    expect(t.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeTruthy();
    fireEvent.click(t);
    expect(t.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('G4/G7 — o que saiu', () => {
  it('não há campo de e-mail nem botão "Sign in" por e-mail, nem linha "Personality"', () => {
    renderSettings();
    document.querySelectorAll<HTMLButtonElement>('[data-group-toggle]').forEach(b => fireEvent.click(b));
    expect(document.querySelector('input[type="email"]')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Sign in$/ })).toBeNull();
    expect(screen.queryByText('Personality')).toBeNull();
    expect(screen.queryByText('Personalidade')).toBeNull();
  });
});

describe('G5 — Seus dados: o "?" revela as explicações', () => {
  it('sem tocar no "?", as frases fixas não existem; tocar abre o grupo e mostra as duas', () => {
    renderSettings('en-US');
    expect(screen.queryByText(/leave whenever you want/)).toBeNull();
    expect(screen.queryByText(/You can download everything/)).toBeNull();
    const help = screen.getByRole('button', { name: 'What these buttons do' });
    expect(help.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(help);
    expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[data-data-help-text="export"]')?.textContent).toMatch(/Download my data/);
    expect(document.querySelector('[data-data-help-text="delete"]')?.textContent).toMatch(/Delete my account/);
  });

  it('PT: o par existe', () => {
    renderSettings('pt-BR');
    fireEvent.click(screen.getByRole('button', { name: 'O que estes botões fazem' }));
    expect(document.querySelector('[data-data-help-text="export"]')?.textContent).toMatch(/Baixar meus dados/);
    expect(screen.queryByText(/ir embora quando quiser/)).toBeNull();
  });
});

describe('G3/G9 — selo de conta Full e "Restaurar compras" claro', () => {
  it('conta paga mostra o selo "Full account", e não "Your plan"', async () => {
    renderWithCss(<AccountSection language="en-US" />);
    await waitFor(() => expect(document.querySelector('[data-full-badge]')?.textContent).toMatch('Full account'));
    expect(screen.queryByText(/Your plan/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Restore purchases' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /What "Restore purchases" does/ }));
    expect(screen.getByText(/Nothing is charged/)).toBeTruthy();
  });

  it('PT: "Conta Full" e "Restaurar compras"', async () => {
    renderWithCss(<AccountSection language="pt-BR" />);
    await waitFor(() => expect(document.querySelector('[data-full-badge]')?.textContent).toMatch('Conta Full'));
    expect(screen.getByRole('button', { name: 'Restaurar compras' })).toBeTruthy();
  });
});
