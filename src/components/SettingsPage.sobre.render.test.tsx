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
    // Compliance #6 (21/09/2026): sons, sem revisão humana, não é emergência.
    expect(p.textContent).toMatch(/alguns sons \(evolução, regressão e conclusão de tarefa\)/);
    expect(p.textContent).toMatch(/sem revisão humana/);
    expect(p.textContent).toMatch(/não é um serviço de emergência/);
    // Tom de fato, não de alerta (L11): nada de "atenção"/"cuidado".
    expect(p.textContent).not.toMatch(/atenção|cuidado|aviso/i);
    const link = screen.getByRole('link', { name: /O que o chat recebe/ }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/privacidade.html#chat-contexto');
  });

  it('EN: o par existe e difere do PT', () => {
    renderSettings('en-US');
    const p = screen.getByText(/AI-generated/);
    expect(p.textContent).toMatch(/Groq/);
    expect(p.textContent).toMatch(/some sounds \(evolution, regression and task completion\)/);
    expect(p.textContent).toMatch(/no human review/);
    expect(p.textContent).toMatch(/not an emergency service/);
    // A5: EN aponta para a âncora inglesa da política.
    const link = screen.getByRole('link', { name: /What the chat receives/ });
    expect(link.getAttribute('href')).toBe('/privacidade.html#chat-context');
    expect(screen.queryByText(/gerad[ao]s por IA/)).toBeNull();
  });
});

describe('Ajuda — falar com quem faz o Soulmon', () => {
  it('PT: é um mailto com assunto, versão, trecho curto do código e origem em PT; sem _blank; hint diz o endereço', () => {
    renderSettings('pt-BR');
    const a = screen.getByRole('link', { name: /Falar com quem faz o Soulmon/ }) as HTMLAnchorElement;
    const href = a.getAttribute('href') ?? '';
    expect(href.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    // `mailto:` não abre aba — `_blank` nele deixava uma aba branca (B2).
    expect(a.getAttribute('target')).toBeNull();
    expect(a.textContent).toContain(FEEDBACK_EMAIL);
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('subject')).toBe('Soulmon');
    const body = params.get('body') ?? '';
    expect(body).toContain(`Versão: ${APP_VERSION}`);
    expect(body).toContain('Origem: configurações');
    expect(body).not.toContain('settings');
    // Só o prefixo do id — o id inteiro localiza o save pelo algoritmo público.
    expect(body).toContain('Código: abcdef01');
    expect(body).not.toContain('abcdef0123456789abcdef0123456789');
  });

  it('EN: rótulo e corpo em inglês', () => {
    renderSettings('en-US');
    const a = screen.getByRole('link', { name: /Talk to the people who make Soulmon/ }) as HTMLAnchorElement;
    const href = decodeURIComponent(a.getAttribute('href') ?? '');
    expect(href).toContain(`Version: ${APP_VERSION}`);
    expect(href).toContain('From: settings');
  });

  it('a linha fica no grupo Ajuda, logo ACIMA da versão (B3) — não em Sobre', () => {
    renderSettings('pt-BR');
    const a = screen.getByRole('link', { name: /Falar com quem faz o Soulmon/ });
    const versao = screen.getByText(`Soulmon ${APP_VERSION}`);
    const ajuda = screen.getByText('Ajuda');
    const sobre = screen.getByText('Sobre');
    const pos = (el: Element) => (ajuda.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(pos(a)).toBe(true);
    expect((a.compareDocumentPosition(versao) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true);
    expect((versao.compareDocumentPosition(sobre) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true);
  });

  it('a versão do rodapé e a do e-mail são a MESMA constante', () => {
    renderSettings('pt-BR');
    expect(screen.getByText(`Soulmon ${APP_VERSION}`)).toBeTruthy();
  });
});
