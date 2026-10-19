// @vitest-environment jsdom
/**
 * D-95 (decisão do dono, 19/10/2026): fala ociosa e toque no pet são SÓ frases
 * locais; a cota inteira da IA fica para o chat aberto.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!',
  currentStage: 'rookie', evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3,
  dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10,
  useAI: true, language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 4,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede no teste'))));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('CompanionHUD sem IA no ócio', () => {
  it('60 min visível + 5 toques: /api/chat nunca é chamado e o pet fala local', async () => {
    renderWithCss(<CompanionHUD {...base} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(60 * 60_000); });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByAltText('rookie'));
      await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    }
    const chamadas = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map(c => String(c[0]));
    expect(chamadas.filter(u => u.includes('/api/chat'))).toEqual([]);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
    const bolha = document.querySelector('[role="status"], [aria-live]');
    expect((bolha?.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  it('contrato: o fonte não chama /api/chat', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/CompanionHUD.tsx'), 'utf8');
    expect(src).not.toContain("'/api/chat'");
  });
});
