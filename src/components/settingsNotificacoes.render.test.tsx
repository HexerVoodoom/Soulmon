// @vitest-environment jsdom
/**
 * Config → "What Soulmon sends you" / "Your data" (19/10/2026, D-17, D-19..D-21, REGISTRO §117):
 * Vibrate mora no grupo de envio; "Meal reminders" e "AI chat" não existem; o opt-out da IA é uma linha em "Your data".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, cleanup, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    }),
  });
}

function montar(language: 'pt-BR' | 'en-US', onToggleAI = () => {}, onChangeMealRhythm = vi.fn()) {
  const r = renderWithCss(
    <ThemeProvider>
      <SettingsPage
        useAI
        onToggleAI={onToggleAI}
        language={language}
        onChangeLanguage={() => {}}
        onOpenGuide={() => {}}
        onOpenGlossary={() => {}}
        notificationsEnabled
        onToggleNotifications={() => {}}
        mealRhythm={{ inApp: true, push: true, times: {} } as never}
        onChangeMealRhythm={onChangeMealRhythm}
        onRestoreFromCloud={async () => true}
        onLoginWithEmail={async () => 'loaded' as const}
      />
    </ThemeProvider>,
  );
  document.querySelectorAll<HTMLButtonElement>('[data-group-toggle][aria-expanded="false"]').forEach(b => fireEvent.click(b));
  return r;
}

const grupo = (titulo: RegExp) => {
  const h = screen.getAllByText(titulo)[0];
  return (h.closest('section,[data-group],div[class*="group"]') ?? h.parentElement!.parentElement!) as HTMLElement;
};

describe('Configurações: notificações e dados (REGISTRO §117)', () => {
  beforeEach(() => { installMatchMedia(); localStorage.clear(); });
  afterEach(() => cleanup());

  it('EN: sem "Meal reminders" nem "AI chat"; "Meal check-ins" existe; sem "No pressure"', () => {
    montar('en-US');
    expect(screen.queryByText(/Meal reminders/)).toBeNull();
    expect(screen.queryByText(/^AI chat$/)).toBeNull();
    expect(screen.getAllByRole('switch', { hidden: true }).some(e => /Meal check-ins/.test(e.textContent || ''))).toBe(true);
    expect(document.body.textContent).not.toMatch(/No pressure/i);
  });

  it('o toggle de check-ins grava convite e push juntos', () => {
    const onMeal = vi.fn();
    montar('en-US', () => {}, onMeal);
    const sw = screen.getAllByRole('switch', { hidden: true }).find(e => /Meal check-ins/.test(e.textContent || ''))!;
    fireEvent.click(sw);
    expect(onMeal).toHaveBeenCalledWith(expect.objectContaining({ inApp: false, push: false }));
  });

  it('o opt-out da IA é UMA linha, fora do grupo de envio', () => {
    const onAI = vi.fn();
    montar('en-US', onAI);
    const linhas = screen.getAllByRole('switch', { hidden: true }).filter(e => /Send chat to AI provider/.test(e.textContent || ''));
    expect(linhas).toHaveLength(1);
    fireEvent.click(linhas[0]);
    expect(onAI).toHaveBeenCalledTimes(1);
    expect(within(grupo(/What Soulmon sends you/)).queryByText(/Send chat to AI provider/)).toBeNull();
  });

  it('PT: Vibrar quando o foco acabar vive no grupo de envio, não em Seus dados', () => {
    montar('pt-BR');
    const vib = screen.getAllByRole('switch', { hidden: true }).find(e => /Vibrar quando o foco acabar/.test(e.textContent || ''))!;
    expect(vib).toBeTruthy();
    expect(within(grupo(/O que o Soulmon te manda/)).queryByText(/Vibrar quando o foco acabar/)).not.toBeNull();
    expect(within(grupo(/Seus dados/)).queryByText(/Vibrar quando o foco acabar/)).toBeNull();
  });
});
