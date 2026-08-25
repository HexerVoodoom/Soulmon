// @vitest-environment jsdom
/**
 * O OPT-OUT, PERCORRIDO PELA TELA — e a política amarrada ao `EVENT_SCHEMA`.
 *
 * O buraco que fechou aqui: a telemetria foi ligada em produção com o padrão
 * LIGADO, `setTelemetryEnabled` sem nenhum call site fora do módulo (ou seja,
 * opt-out inalcançável) e uma política de privacidade que não mencionava o
 * envio. Testar o módulo de novo não pegaria nada disso: os três defeitos
 * moravam FORA dele — na tela que não chamava e no HTML que não declarava.
 *
 * Por isso este arquivo faz duas coisas que nenhum outro teste faz:
 *  1. clica no interruptor de verdade e olha `isTelemetryEnabled` e a fila;
 *  2. lê `public/privacidade.html` e exige que ele cite CADA evento e CADA
 *     prop do `EVENT_SCHEMA`, nas duas línguas. Acrescentar um evento sem
 *     mexer na política passa a quebrar a suíte — que é o único jeito de a
 *     divergência doc↔código não nascer de novo em silêncio.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import type { AISettings } from './AISettingsModal';
import { ThemeProvider } from '../contexts/ThemeContext';
import {
  isTelemetryEnabled,
  resetTelemetryForTest,
  pendingTelemetry,
  track,
  telemetryConsentCopy,
  EVENT_SCHEMA,
  TELEMETRY_EVENTS,
} from '../utils/telemetry';

/** Os ajustes de IA não são o assunto aqui — só precisam ser válidos. */
const AI_SETTINGS: AISettings = {
  tone: 'casual',
  emojiIntensity: 'medium',
  motivationStyle: 'balanced',
  customKeywords: '',
  temperature: 0.85,
};

/**
 * `matchMedia` não existe no jsdom, e `InstallPrompt`/`ThemeProvider` chamam no
 * primeiro efeito. Stub mínimo: nada aqui depende do resultado da consulta.
 */
function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function renderSettings(language: 'pt-BR' | 'en-US' = 'pt-BR') {
  return renderWithCss(
    <ThemeProvider>
      <SettingsPage
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

const toggleOf = (language: 'pt-BR' | 'en-US') =>
  screen.getByRole('switch', { name: new RegExp(telemetryConsentCopy(language).toggleLabel, 'i') });

describe('Configurações → Seus dados: o interruptor de estatísticas existe e desliga', () => {
  beforeEach(() => {
    installMatchMedia();
    resetTelemetryForTest();
  });

  it('está na tela, no estado que o módulo diz (padrão: ligado)', () => {
    renderSettings();
    expect(isTelemetryEnabled()).toBe(true);
    expect(toggleOf('pt-BR').getAttribute('aria-checked')).toBe('true');
  });

  it('clicar desliga DE VERDADE — `isTelemetryEnabled` reflete', () => {
    renderSettings();
    fireEvent.click(toggleOf('pt-BR'));
    expect(isTelemetryEnabled()).toBe(false);
    expect(toggleOf('pt-BR').getAttribute('aria-checked')).toBe('false');
  });

  it('desligado, nenhum evento sai — a fila fica vazia', () => {
    renderSettings();
    fireEvent.click(toggleOf('pt-BR'));
    for (const event of TELEMETRY_EVENTS) {
      track(event, event === 'onboarding_step' ? { step: 1, funnel: 1 } : event === 'day_active' ? { effort: 3 } : undefined);
    }
    expect(pendingTelemetry()).toEqual([]);
  });

  it('e desligar APAGA o que já estava na fila', () => {
    renderSettings();
    track('install');
    expect(pendingTelemetry()).toHaveLength(1);
    fireEvent.click(toggleOf('pt-BR'));
    expect(pendingTelemetry()).toEqual([]);
  });

  it('a preferência sobrevive ao reload (mora no storage, não no estado do React)', () => {
    const view = renderSettings();
    fireEvent.click(toggleOf('pt-BR'));
    view.unmount();
    renderSettings(); // nova montagem = o que o reload faz
    expect(isTelemetryEnabled()).toBe(false);
    expect(toggleOf('pt-BR').getAttribute('aria-checked')).toBe('false');
    // e liga de novo pelo mesmo lugar
    fireEvent.click(toggleOf('pt-BR'));
    expect(isTelemetryEnabled()).toBe(true);
  });

  it('em inglês, o rótulo é o do módulo (nenhuma segunda cópia da copy)', () => {
    renderSettings('en-US');
    expect(toggleOf('en-US')).toBeTruthy();
    expect(telemetryConsentCopy('en-US').toggleLabel).toBe('Send usage stats');
  });
});

// ---------------------------------------------------------------------------

describe('política ↔ EVENT_SCHEMA: a doc não pode ficar para trás do código', () => {
  const html = fs.readFileSync(path.resolve(process.cwd(), 'public/privacidade.html'), 'utf8');

  /** As duas metades do documento: PT em cima, EN depois da âncora `id="en"`. */
  const cut = html.indexOf('id="en"');
  const pt = html.slice(0, cut);
  const en = html.slice(cut);

  it('o arquivo tem mesmo as duas línguas', () => {
    expect(cut).toBeGreaterThan(0);
    expect(pt).toContain('Estatísticas de uso');
    expect(en).toContain('Usage stats');
  });

  it.each(TELEMETRY_EVENTS)('a política nomeia o evento `%s` em PT e em EN', event => {
    expect(pt).toContain(`<code>${event}</code>`);
    expect(en).toContain(`<code>${event}</code>`);
  });

  const props = [...new Set(
    Object.values(EVENT_SCHEMA).flatMap(schema => (schema ? Object.keys(schema) : [])),
  )];

  it.each(props)('a política nomeia a prop `%s` em PT e em EN', prop => {
    expect(pt).toContain(`<code>${prop}</code>`);
    expect(en).toContain(`<code>${prop}</code>`);
  });

  it('declara o pseudônimo e que nada de conteúdo vai junto', () => {
    expect(pt).toMatch(/pseudonimizado/i);
    expect(en).toMatch(/pseudonymous/i);
    // O conteúdo do onboarding é o que mais dói se vazar — nomeado explicitamente.
    for (const half of [pt, en]) {
      expect(half).toContain('<code>soulGoal</code>');
      expect(half).toContain('<code>soulStruggle</code>');
    }
  });

  it('diz onde desligar, com o mesmo rótulo que a tela mostra', () => {
    expect(pt).toContain(telemetryConsentCopy('pt-BR').toggleLabel);
    expect(en).toContain(telemetryConsentCopy('en-US').toggleLabel);
  });
});
