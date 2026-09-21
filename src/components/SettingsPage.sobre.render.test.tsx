// @vitest-environment jsdom
/**
 * Configurações › Sobre — o que o QA geral de 21/09/2026 mandou pôr na tela:
 *  · decisão #22: a imagem da criatura e as falas do chat são geradas por IA,
 *    com o link para a seção da política que diz o que o chat recebe;
 *  · item 4 do maestro: "Falar com quem faz o Soulmon" → `mailto:` com a
 *    versão e um trecho do código no corpo.
 * PT-BR e EN, e os dois conjuntos diferem de fato (regra "Idioma").
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import type { AISettings } from './AISettingsModal';
import { ThemeProvider } from '../contexts/ThemeContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { APP_VERSION, FEEDBACK_EMAIL } from './FeedbackLink';

const AI_SETTINGS: AISettings = {
  tone: 'casual', emojiIntensity: 'medium', motivationStyle: 'balanced', customKeywords: '', temperature: 0.85,
};

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

function renderSettings(language: 'pt-BR' | 'en-US') {
  return renderWithCss(
    <ThemeProvider>
      <SettingsPage
        useAI={false} onToggleAI={() => {}} aiSettings={AI_SETTINGS} onSaveAISettings={() => {}}
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

describe('Sobre — IA declarada (#22)', () => {
  it('PT: diz que imagem e falas são geradas por IA, nomeia os provedores e liga à política', () => {
    renderSettings('pt-BR');
    const p = screen.getByText(/gerad[ao]s por IA/);
    expect(p.textContent).toMatch(/Higgsfield/);
    expect(p.textContent).toMatch(/Gemini/);
    expect(p.textContent).toMatch(/Groq/);
    // Tom de fato, não de alerta (L11): nada de "atenção"/"cuidado".
    expect(p.textContent).not.toMatch(/atenção|cuidado|aviso/i);
    const link = screen.getByRole('link', { name: /O que o chat recebe/ }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/privacidade.html#chat-contexto');
  });

  it('EN: o par existe e difere do PT', () => {
    renderSettings('en-US');
    expect(screen.getByText(/AI-generated/).textContent).toMatch(/Groq/);
    expect(screen.getByRole('link', { name: /What the chat receives/ })).toBeTruthy();
    expect(screen.queryByText(/gerad[ao]s por IA/)).toBeNull();
  });
});

describe('Sobre — falar com quem faz o Soulmon', () => {
  it('PT: é um mailto com assunto, versão e trecho curto do código', () => {
    renderSettings('pt-BR');
    const a = screen.getByRole('link', { name: /Falar com quem faz o Soulmon/ }) as HTMLAnchorElement;
    const href = a.getAttribute('href') ?? '';
    expect(href.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('subject')).toBe('Soulmon');
    const body = params.get('body') ?? '';
    expect(body).toContain(`Versão: ${APP_VERSION}`);
    // Só o prefixo do id — o id inteiro localiza o save pelo algoritmo público.
    expect(body).toContain('Código: abcdef01');
    expect(body).not.toContain('abcdef0123456789abcdef0123456789');
  });

  it('EN: rótulo e corpo em inglês', () => {
    renderSettings('en-US');
    const a = screen.getByRole('link', { name: /Talk to the people who make Soulmon/ }) as HTMLAnchorElement;
    expect(decodeURIComponent(a.getAttribute('href') ?? '')).toContain(`Version: ${APP_VERSION}`);
  });

  it('a versão do rodapé e a do e-mail são a MESMA constante', () => {
    renderSettings('pt-BR');
    expect(screen.getByText(`Soulmon ${APP_VERSION}`)).toBeTruthy();
  });
});
