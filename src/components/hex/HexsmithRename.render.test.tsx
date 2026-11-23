// @vitest-environment jsdom
/**
 * Renomear na Hexsmith (11/11/2026): 2 botões hexagonais (lápis = Soulmon, chama = especial) na linha da Coroa; o modal valida o texto,
 * mostra o custo (HEX_RENAME_COST), pede confirmação antes de gastar e só o servidor debita; o editor antigo não existe mais.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { GameStateProvider, useGameState } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { ALL_ELEMENT_IDS } from '../../utils/elementDex';
import { HEX_RENAME_COST, hexRenameClean, hexRenameRefusal, applyServerHexRename } from '../../utils/hexsmithRename';
import HexsmithSheet from './HexsmithSheet';

const renomeiaServidor = vi.fn(async (_s: string, _g: unknown, _k: string, nome: string): Promise<{ ok: true; already: boolean; nome: string } | { ok: false; kind: string }> => ({ ok: true, already: false, nome }));
vi.mock('../../utils/cloudSave', () => ({
  cloudHexForge: async () => ({ ok: false, kind: 'server' }),
  cloudHexRename: (s: string, g: unknown, k: string, n: string) => renomeiaServidor(s, g, k, n),
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify({ bits: gameState.gamePoints, pet: gameState.soulmonMeta?.petName, esp: gameState.especialNome })}</pre>;
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);
function abrir(save: Record<string, unknown> = {}) {
  localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'a'.repeat(32));
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, defeatedElements: [...ALL_ELEMENT_IDS], gamePoints: 1000, ...save }));
  render(<GameStateProvider><HexsmithSheet language="pt-BR" sprite="/x.png" petElement="fogo" /><Espiao /></GameStateProvider>);
}
const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
const digitar = (v: string) => act(() => { fireEvent.change(q('#hex-rename-input'), { target: { value: v } }); });
const click = async (el: Element) => act(async () => { fireEvent.click(el); await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => { installDomGlobals(); localStorage.clear(); renomeiaServidor.mockClear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Hexsmith: renomear', () => {
  it('mostra os 2 botões hexagonais (lápis e chama) além das 5 Portas', () => {
    abrir();
    expect(document.querySelectorAll('[data-hex-slot]')).toHaveLength(5);
    expect(q('[data-hex-rename="pet"]').getAttribute('aria-label')).toBe('Trocar o nome do Soulmon');
    expect(q('[data-hex-rename="especial"]').getAttribute('aria-label')).toBe('Trocar o nome do especial');
    expect(q('[data-hex-rename="pet"] svg, [data-hex-rename="pet"] img')).toBeTruthy();
    expect(q('[data-hex-rename="especial"] svg, [data-hex-rename="especial"] img')).toBeTruthy();
  });

  it('validação pura: vazio, palavrão, símbolo, mesmo nome e saldo', () => {
    const gs = { gamePoints: 1000, soulmonMeta: { petName: 'Brasa' }, especialNome: 'Raio' };
    expect(hexRenameClean('  Maré   Viva ')).toBe('Maré Viva');
    expect(hexRenameRefusal(gs, 'pet', '   ')).toBe('empty');
    expect(hexRenameRefusal(gs, 'pet', 'Caralho')).toBe('invalid');
    expect(hexRenameRefusal(gs, 'pet', 'Raio!')).toBe('invalid');
    expect(hexRenameRefusal(gs, 'pet', 'A'.repeat(21))).toBe('invalid');
    expect(hexRenameRefusal(gs, 'pet', 'Brasa')).toBe('same');
    expect(hexRenameRefusal(gs, 'especial', 'Brasa')).toBeUndefined();
    expect(hexRenameRefusal({ ...gs, gamePoints: HEX_RENAME_COST - 1 }, 'pet', 'Novo')).toBe('bits');
    // §373: Bits de Crédito também pagam
    expect(hexRenameRefusal({ ...gs, gamePoints: 1000, bitsOrigin: { day: 'x', free: 0, fromCredits: 1000, paidLeft: 1000 } }, 'pet', 'Novo')).toBeUndefined();
  });

  it('o custo aparece no modal e o botão só habilita com texto válido', () => {
    abrir();
    act(() => { fireEvent.click(q('[data-hex-rename="pet"]')); });
    expect(q('[data-hex-rename-cost]').textContent).toContain(String(HEX_RENAME_COST));
    const go = q('[data-hex-rename-go]') as HTMLButtonElement;
    digitar('Caralho');
    expect(go.disabled).toBe(true);
    digitar('Brasa Viva');
    expect(go.disabled).toBe(false);
  });

  it('lápis: pede confirmação antes de gastar; confirmar chama o servidor e debita 200 Bits, trocando só o nome do Soulmon', async () => {
    abrir();
    act(() => { fireEvent.click(q('[data-hex-rename="pet"]')); });
    digitar('Brasa Viva');
    await click(q('[data-hex-rename-go]'));
    expect(renomeiaServidor).not.toHaveBeenCalled();
    expect(estado().bits).toBe(1000);
    expect(q('[data-hex-rename-confirm]').textContent).toContain(String(HEX_RENAME_COST));
    await click(q('[data-hex-rename-yes]'));
    expect(renomeiaServidor).toHaveBeenCalledTimes(1);
    expect(renomeiaServidor.mock.calls[0].slice(2)).toEqual(['pet', 'Brasa Viva']);
    expect(estado()).toMatchObject({ bits: 1000 - HEX_RENAME_COST, pet: 'Brasa Viva' });
    expect(estado().esp).toBeUndefined();
  });

  it('chama: troca o nome do especial', async () => {
    abrir();
    act(() => { fireEvent.click(q('[data-hex-rename="especial"]')); });
    digitar('Raio Solar');
    await click(q('[data-hex-rename-go]'));
    await click(q('[data-hex-rename-yes]'));
    expect(renomeiaServidor.mock.calls[0].slice(2)).toEqual(['especial', 'Raio Solar']);
    expect(estado()).toMatchObject({ bits: 1000 - HEX_RENAME_COST, esp: 'Raio Solar' });
  });

  it('saldo insuficiente: botão desabilitado e nada é debitado', () => {
    abrir({ gamePoints: HEX_RENAME_COST - 1 });
    act(() => { fireEvent.click(q('[data-hex-rename="pet"]')); });
    digitar('Brasa Viva');
    expect((q('[data-hex-rename-go]') as HTMLButtonElement).disabled).toBe(true);
    expect(q('[data-hex-rename-refusal="bits"]')).toBeTruthy();
    expect(renomeiaServidor).not.toHaveBeenCalled();
  });

  it('servidor offline: nada é debitado localmente e o aviso aparece', async () => {
    renomeiaServidor.mockImplementationOnce(async () => ({ ok: false, kind: 'offline' }));
    abrir();
    act(() => { fireEvent.click(q('[data-hex-rename="pet"]')); });
    digitar('Brasa Viva');
    await click(q('[data-hex-rename-go]'));
    await click(q('[data-hex-rename-yes]'));
    expect(estado().bits).toBe(1000);
    expect(q('[data-hex-rename-aviso]').textContent).toMatch(/Sem conexão/);
    expect(screen.getByText(/Sem conexão/)).toBeTruthy();
  });

  it('applyServerHexRename nunca deixa saldo negativo e `already` não debita', () => {
    const base = { gamePoints: 50, soulmonMeta: { baseName: 'X' } };
    expect(applyServerHexRename(base, 'pet', 'Novo', true).gamePoints).toBe(0);
    expect(applyServerHexRename({ ...base, gamePoints: 500 }, 'especial', 'Novo', false).gamePoints).toBe(500);
  });
});
