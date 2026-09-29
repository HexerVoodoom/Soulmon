// @vitest-environment jsdom
/**
 * PAINEL DE GM — só aparece para quem o SERVIDOR disse que é admin nesta
 * abertura (`utils/adminFlag.ts`). Nenhum valor no localStorage ou no save abre.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';
import { setAdminFlag, adminFromEntitlement } from '../utils/adminFlag';
import type { GmActions } from './GmPanel';

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

const gm = (): GmActions => ({
  isCorvo: false, currentForm: 'rookie',
  onGiveBalance: vi.fn(), onUnlockAll: vi.fn(), onGoToForm: vi.fn(),
  onAdoptCorvo: vi.fn(), onFillCare: vi.fn(), onAddPerfectDays: vi.fn(),
});

function montar(language: 'pt-BR' | 'en-US', actions: GmActions | null = gm()) {
  return renderWithCss(
    <ThemeProvider>
      <SettingsPage
        useAI={false} onToggleAI={() => {}}
        aiSettings={{ tone: 'casual', emojiIntensity: 'medium', motivationStyle: 'balanced', customKeywords: '', temperature: 0.85 }}
        onSaveAISettings={() => {}} language={language} onChangeLanguage={() => {}}
        onOpenGuide={() => {}} onOpenGlossary={() => {}}
        notificationsEnabled={false} onToggleNotifications={() => {}}
        onRestoreFromCloud={async () => true} onLoginWithEmail={async () => 'loaded' as const}
        gm={actions ?? undefined}
      />
    </ThemeProvider>,
  );
}

describe('Painel de GM em Configurações', () => {
  beforeEach(() => { cleanup(); installMatchMedia(); localStorage.clear(); act(() => setAdminFlag(false)); });

  it('não-admin: o painel não existe', () => {
    montar('pt-BR');
    expect(screen.queryByText('Painel de GM')).toBeNull();
    expect(document.querySelector('[data-gm-panel]')).toBeNull();
  });

  it('admin forjado no localStorage/save NÃO abre o painel', () => {
    for (const k of ['admin', 'soulmon-admin', 'isAdmin']) localStorage.setItem(k, 'true');
    localStorage.setItem('soulmon_state_v1', JSON.stringify({ admin: true, accountTier: 'paid' }));
    montar('en-US');
    expect(screen.queryByText('GM panel')).toBeNull();
  });

  it('só `admin === true` literal conta', () => {
    expect(adminFromEntitlement({ admin: true })).toBe(true);
    for (const v of ['true', 1, {}, null, undefined, false]) expect(adminFromEntitlement({ admin: v })).toBe(false);
    expect(adminFromEntitlement(null)).toBe(false);
  });

  it.each([
    ['pt-BR', 'Painel de GM', 'Dar saldo', 'todos os seus aparelhos'],
    ['en-US', 'GM panel', 'Give balance', 'all your devices'],
  ] as const)('admin (%s): painel visível e as ações disparam', (language, title, saldo, aviso) => {
    act(() => setAdminFlag(true));
    const actions = gm();
    montar(language, actions);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(new RegExp(aviso))).toBeTruthy();
    fireEvent.click(screen.getByText(saldo));
    expect(actions.onGiveBalance).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('+7'));
    expect(actions.onAddPerfectDays).toHaveBeenCalledWith(7);
  });

  it.each([
    ['pt-BR', 'Adotar o corvinho troca a criatura atual; não há como voltar'],
    ['en-US', 'replaces the current creature; there is no way back'],
  ] as const)('C1 (%s): adotar o corvinho avisa que não há volta', (language, frase) => {
    act(() => setAdminFlag(true));
    montar(language, gm());
    expect(screen.getByText(new RegExp(frase))).toBeTruthy();
  });

  it('admin sem ações passadas: nada renderiza (o App só passa `gm` para admin)', () => {
    act(() => setAdminFlag(true));
    montar('pt-BR', null);
    expect(screen.queryByText('Painel de GM')).toBeNull();
  });
});
