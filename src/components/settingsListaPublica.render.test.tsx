// @vitest-environment jsdom
/**
 * TORC-5 — o interruptor "Aparecer na lista pública do Torneio", em Seus dados.
 *
 * Contrato: uma linha discreta (sem copy longa na tela), ligada por padrão; a
 * explicação mora atrás do "?" do grupo; sem o callback a linha não existe; o
 * toque chama o callback e NADA mais (quem grava a escolha é o GameState).
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function abrirGrupos() {
  document.querySelectorAll<HTMLButtonElement>('[data-group-toggle][aria-expanded="false"]').forEach(b => fireEvent.click(b));
}

function renderSettings(props: { language?: 'pt-BR' | 'en-US'; showInPublicList?: boolean; onToggleShowInPublicList?: () => void }) {
  installMatchMedia();
  const r = renderWithCss(
    <ThemeProvider>
      <SettingsPage
        useAI={false}
        onToggleAI={() => {}}
        language={props.language ?? 'pt-BR'}
        onChangeLanguage={() => {}}
        onOpenGuide={() => {}}
        onOpenGlossary={() => {}}
        notificationsEnabled={false}
        onToggleNotifications={() => {}}
        onRestoreFromCloud={async () => true}
        onLoginWithEmail={async () => 'loaded' as const}
        showInPublicList={props.showInPublicList}
        onToggleShowInPublicList={props.onToggleShowInPublicList}
      />
    </ThemeProvider>,
  );
  abrirGrupos();
  return r;
}

describe('Configurações → Seus dados → lista pública do Torneio', () => {
  it('PT: a linha existe, vem LIGADA por padrão e não carrega copy longa', () => {
    renderSettings({ onToggleShowInPublicList: () => {} });
    const sw = screen.getByRole('switch', { name: /Aparecer na lista pública do Torneio/ });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.querySelector('.sm2-conta-s')).toBeNull();
  });

  it('EN: o rótulo é o par em inglês', () => {
    renderSettings({ language: 'en-US', onToggleShowInPublicList: () => {} });
    expect(screen.getByRole('switch', { name: /Show me on the public Tournament list/ })).toBeTruthy();
  });

  it('desligado no save → o interruptor reflete OFF', () => {
    renderSettings({ showInPublicList: false, onToggleShowInPublicList: () => {} });
    expect(screen.getByRole('switch', { name: /Aparecer na lista pública/ }).getAttribute('aria-checked')).toBe('false');
  });

  it('o "?" de Seus dados revela a explicação da linha', () => {
    renderSettings({ onToggleShowInPublicList: () => {} });
    expect(screen.queryByText(/você some da lista na hora/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'O que estes botões fazem' }));
    expect(screen.getByText(/você some da lista na hora/)).toBeTruthy();
  });

  it('o toque chama o callback uma vez', () => {
    const onToggle = vi.fn();
    renderSettings({ onToggleShowInPublicList: onToggle });
    fireEvent.click(screen.getByRole('switch', { name: /Aparecer na lista pública/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sem callback a linha não existe', () => {
    renderSettings({});
    expect(screen.queryByRole('switch', { name: /lista pública/ })).toBeNull();
  });
});
