// @vitest-environment jsdom
/**
 * O CAMINHO VIVO DO JOGADOR ATÉ O SOM — Configurações (canvas Conta §29).
 *
 * Achado do doc-mantenedor em 21/09/2026: o `SettingsModal` ("Ajustes
 * rápidos") ficou sem gatilho vivo, e com ele o mudo global e a trilha eram
 * inalcançáveis pela UI — a fiação existia, ninguém chegava nela. ⚰️ 21/09/2026
 * (decisão #37): o modal foi APAGADO; a SettingsPage é o único caminho. Este teste
 * prova que a `SettingsPage` (a tela que o jogador abre de verdade) expõe as
 * duas chaves, em PT e EN, e que cada toque chega ao dono certo: o mudo no
 * `onToggleSound` do App, a trilha em `ligarTrilha`/`desligarTrilha` (S2: o
 * toque É o gesto).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import type { AISettings } from './AISettingsModal';
import { ThemeProvider } from '../contexts/ThemeContext';
import { esquecerTrilha, trilhaPreferida } from '../utils/trilha';

const AI_SETTINGS: AISettings = {
  tone: 'casual',
  emojiIntensity: 'medium',
  motivationStyle: 'balanced',
  customKeywords: '',
  temperature: 0.85,
};

/** `matchMedia` não existe no jsdom (InstallPrompt/ThemeProvider chamam no 1º efeito). */
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

function montar(language: 'pt-BR' | 'en-US', onToggleSound = () => {}, soundMuted = false) {
  return renderWithCss(
    <ThemeProvider>
      <SettingsPage
        soundMuted={soundMuted}
        onToggleSound={onToggleSound}
        useAI={false}
        onToggleAI={() => {}}
        aiSettings={AI_SETTINGS}
        onSaveAISettings={() => {}}
        language={language}
        onChangeLanguage={() => {}}
        onOpenGuide={() => {}}
        onOpenGlossary={() => {}}
        notificationsEnabled={false}
        onToggleNotifications={() => {}}
        onRestoreFromCloud={async () => true}
        onLoginWithEmail={async () => 'loaded' as const}
      />
    </ThemeProvider>,
  );
}

/** O nome acessível do `SwitchRow` é rótulo + hint; acho a linha pelo texto do rótulo. */
const switchDe = (rotulo: RegExp) =>
  screen.getAllByRole('switch', { hidden: true }).find(e => rotulo.test(e.textContent || '')) as HTMLElement;

describe('Configurações → Som: o jogador alcança o mudo e a trilha', () => {
  beforeEach(() => {
    installMatchMedia();
    localStorage.clear();
    esquecerTrilha();
  });

  it.each([
    ['pt-BR', /^Sons/, /^Trilha/],
    ['en-US', /^Sound effects/, /^Music/],
  ] as const)('%s: as duas chaves existem, com rótulo no idioma', (language, sons, trilha) => {
    montar(language);
    expect(switchDe(sons)).toBeTruthy();
    expect(switchDe(trilha)).toBeTruthy();
  });

  it('tocar em "Sons" chama o dono do mudo (o App), e o estado refletido é `!soundMuted`', () => {
    const onToggleSound = vi.fn();
    montar('pt-BR', onToggleSound, true);
    const sw = switchDe(/^Sons/);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(onToggleSound).toHaveBeenCalledTimes(1);
  });

  it('tocar em "Trilha" liga a chave PRÓPRIA (S2: nasce desligada; o toque é o gesto) e desliga de novo', () => {
    montar('pt-BR');
    const sw = switchDe(/^Trilha/);
    expect(trilhaPreferida()).toBe(false);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(trilhaPreferida()).toBe(true);
    fireEvent.click(sw);
    expect(trilhaPreferida()).toBe(false);
  });

  it('sem `onToggleSound` o grupo não aparece (nada de switch morto)', () => {
    renderWithCss(
      <ThemeProvider>
        <SettingsPage
          useAI={false}
          onToggleAI={() => {}}
          aiSettings={AI_SETTINGS}
          onSaveAISettings={() => {}}
          language="pt-BR"
          onChangeLanguage={() => {}}
          onOpenGuide={() => {}}
          onOpenGlossary={() => {}}
          notificationsEnabled={false}
          onToggleNotifications={() => {}}
          onRestoreFromCloud={async () => true}
          onLoginWithEmail={async () => 'loaded' as const}
        />
      </ThemeProvider>,
    );
    expect(screen.getAllByRole('switch').find(e => /^Sons/.test(e.textContent || ''))).toBeUndefined();
  });
});
