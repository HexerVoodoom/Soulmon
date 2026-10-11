// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SpritePoseRows } from './SpritePoseRows';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';
import { registerSpritePoseWriter } from '../utils/spritePose';

let off: (() => void) | undefined;
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  });
});
afterEach(() => { off?.(); off = undefined; });

describe('SpritePoseRows', () => {
  it('PT: "Virar Soulmon" liga pelo applySpritePose', () => {
    const w = vi.fn(); off = registerSpritePoseWriter(w);
    renderWithCss(<SpritePoseRows language="pt-BR" pose={undefined} />);
    const sw = screen.getByRole('switch', { name: /Virar Soulmon/ });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(w).toHaveBeenCalledWith({ flipX: true });
  });
  it('EN: "Flip Soulmon" desliga quando já está ligado', () => {
    const w = vi.fn(); off = registerSpritePoseWriter(w);
    renderWithCss(<SpritePoseRows language="en-US" pose={{ flipX: true, altitude: 'ground' }} />);
    const sw = screen.getByRole('switch', { name: /Flip Soulmon/ });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    expect(w).toHaveBeenCalledWith({ flipX: false });
  });
  it('voar sobe, aterrissar desce', () => {
    const w = vi.fn(); off = registerSpritePoseWriter(w);
    const { rerender } = renderWithCss(<SpritePoseRows language="pt-BR" pose={{ altitude: 'ground' }} />);
    fireEvent.click(screen.getByRole('switch', { name: /voando/ }));
    expect(w).toHaveBeenLastCalledWith({ altitude: 'air' });
    rerender(<SpritePoseRows language="pt-BR" pose={{ altitude: 'air' }} />);
    expect(screen.getByRole('switch', { name: /voando/ }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('switch', { name: /voando/ }));
    expect(w).toHaveBeenLastCalledWith({ altitude: 'ground' });
  });
  it('aparece em Configurações > Aparência', () => {
    renderWithCss(
      <ThemeProvider>
        <SettingsPage useAI={false} onToggleAI={() => {}} language="en-US" onChangeLanguage={() => {}}
          onOpenGuide={() => {}} onOpenGlossary={() => {}} notificationsEnabled={false} onToggleNotifications={() => {}}
          onRestoreFromCloud={async () => true} onLoginWithEmail={async () => 'loaded' as const} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Appearance/ }));
    expect(screen.getByRole('switch', { name: /Flip Soulmon/ })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /Soulmon flying/ })).toBeTruthy();
  });
});
