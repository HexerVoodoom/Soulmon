/**
 * BETA12 (B2) — a escolha COMPLEMENTAR/SIMILAR nas Configurações.
 *  - COMPLEMENTAR é o padrão (campo ausente no save);
 *  - o rótulo NUNCA revela o tipo do jogador (nem fala em teste de personalidade);
 *  - a fiação existe: i18n → SettingsPage → App → save → fala/chat.
 * Lê as FONTES (os testes de render de Configurações dependem de jsdom).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { translations } from './i18n';

const src = (rel: string) => readFileSync(resolve(__dirname, '..', rel), 'utf8');

describe('modo da voz do Soulmon nas Configurações', () => {
  const pt = (translations as Record<string, { settings: Record<string, string> }>)['pt-BR'].settings;
  const en = (translations as Record<string, { settings: Record<string, string> }>)['en-US'].settings;
  const KEYS = ['voiceMode', 'voiceModeComplementary', 'voiceModeSimilar', 'voiceModeHint'];

  it('os quatro textos existem nos dois idiomas', () => {
    for (const k of KEYS) {
      expect(pt[k], `pt ${k}`).toBeTruthy();
      expect(en[k], `en ${k}`).toBeTruthy();
    }
  });
  it('o rótulo não revela o tipo do jogador nem fala em personalidade/teste', () => {
    const REVELA = /extrovert|introvert|tipo d[eo]|personalidade|personality|big five|teste|test|arqu[eé]tipo|archetype|traço|trait/i;
    for (const k of KEYS) {
      expect(pt[k], `pt ${k}`).not.toMatch(REVELA);
      expect(en[k], `en ${k}`).not.toMatch(REVELA);
    }
  });
  it('COMPLEMENTAR é o padrão e a fiação existe de ponta a ponta', () => {
    const settings = src('components/SettingsPage.tsx');
    expect(settings).toMatch(/voiceMode = 'complementar'/);
    expect(settings).toMatch(/onChangeVoiceMode\(o\.k\)/);
    const app = src('App.tsx');
    expect(app).toMatch(/voiceMode=\{gameState\.soulmonVoiceMode \?\? 'complementar'\}/);
    expect(app).toMatch(/soulmonVoiceMode: m/);
    expect(app).toMatch(/setPetVoiceArchetype\(soulmonCharacter\.archetype\)/);
    expect(app).toContain('aiSettings, soulmonCharacter)');
    const ctx = src('contexts/GameStateContext.tsx');
    expect(ctx).toMatch(/soulmonVoiceMode\?: SoulmonVoiceMode/);
    expect(ctx).toMatch(/soulmonVoiceMode: sanitizeVoiceMode\(loadedState\.soulmonVoiceMode\)/);
  });
  it('nenhuma tela escreve o arquétipo do Soulmon: a UI só importa o que muda a fala', () => {
    // O App passa o arquétipo ao módulo de voz e ao chat; nenhum JSX o imprime.
    const app = src('App.tsx');
    expect(app).not.toMatch(/\{soulmonCharacter\./);
    expect(app).not.toMatch(/\{bigFive/);
  });
});
