// @vitest-environment jsdom
/** Vínculo: a árvore deixou de ser inline — cartão com pontos livres + botão que abre a árvore em TELA CHEIA. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { xpForLevel } from '../utils/bond';
import TalentTreeEntry from './TalentTreeEntry';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }), cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x', adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

function abrir(save: Record<string, unknown>, language = 'pt-BR') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, ...save }));
  render(<GameStateProvider><TalentTreeEntry language={language} /></GameStateProvider>);
}
beforeEach(() => { installDomGlobals(); localStorage.clear(); });
afterEach(() => cleanup());

describe('TalentTreeEntry', () => {
  it('sem Provider não renderiza nada', () => {
    const { container } = render(<TalentTreeEntry language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });

  it('com pontos livres: diz quantos, acende o indicador e NÃO traz a árvore inline', () => {
    abrir({ totalXP: xpForLevel(6) });
    expect(document.querySelector('[data-talent-free]')!.textContent).toMatch(/pontos? dispon/);
    expect(document.querySelector('[data-lot-indicator="talent"]')).not.toBeNull();
    expect(document.querySelector('[data-talent-tree]')).toBeNull();
    expect(document.querySelector('[data-talent-fullscreen]')).toBeNull();
  });

  it('Vínculo 1: um ponto, no singular', () => {
    abrir({ totalXP: 0 });
    expect(document.querySelector('[data-talent-free]')!.textContent).toBe('1 ponto disponível');
  });

  it('o botão abre a árvore em tela cheia (dialog fixo) e o voltar fecha', { timeout: 30000 }, async () => {
    abrir({ totalXP: xpForLevel(6) });
    act(() => { fireEvent.click(document.querySelector('[data-talent-open]')!); });
    const full = document.querySelector<HTMLElement>('[data-talent-fullscreen]')!;
    expect(full.getAttribute('role')).toBe('dialog');
    expect(full.style.position).toBe('fixed');
    expect(full.style.inset).toMatch(/0/);
    await waitFor(() => expect(full.querySelector('[data-talent-tree]')).not.toBeNull(), { timeout: 25000 });
    // só a árvore, o Fechar e o Resetar: sem título, descrição nem resumo
    expect(full.querySelector('[data-talent-state]')).toBeNull();
    expect(full.querySelector('[data-talent-now]')).toBeNull();
    expect(full.querySelector('[data-talent-close]')!.getAttribute('aria-label')).toBe('Fechar');
    expect(full.textContent).not.toMatch(/Talentos do Vínculo|O que a sua árvore/);
    act(() => { fireEvent.click(document.querySelector('[data-talent-close]')!); });
    expect(document.querySelector('[data-talent-fullscreen]')).toBeNull();
  });

  it('inglês e Esc', () => {
    abrir({ totalXP: xpForLevel(6) }, 'en-US');
    expect(document.querySelector('[data-talent-open]')!.textContent).toBe('Open talent tree');
    act(() => { fireEvent.click(document.querySelector('[data-talent-open]')!); });
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(document.querySelector('[data-talent-fullscreen]')).toBeNull();
  });
});
