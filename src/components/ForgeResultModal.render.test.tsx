// @vitest-environment jsdom
/**
 * Modal de resultado de forja (23/11/2026): Hexsmith (só após o servidor confirmar, um por forja, `already` e erro não abrem)
 * e poção de elemento (base e composta, só quando o craft foi aceito). Estrutura que sustenta 360/375/412 px.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { HEX_COSTS } from '../utils/hexsmith';
import { potionKey } from '../utils/elementPotion';
import { ALL_ELEMENT_IDS } from '../utils/elementDex';
import { ElementPotionSheet } from './ElementPotionSheet';
import HexsmithSheet from './hex/HexsmithSheet';

const forja = vi.fn(async (): Promise<{ ok: true; already: boolean } | { ok: false; kind: string }> => ({ ok: true, already: false }));
vi.mock('../utils/cloudSave', () => ({
  cloudHexForge: () => forja(),
  cloudHexRename: async () => ({ ok: false, kind: 'offline' }),
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

const q = (s: string) => document.querySelector<HTMLElement>(s)!;
const modais = () => document.querySelectorAll('[data-forge-result]');
const click = (el: Element) => act(() => { fireEvent.click(el); });
const forjar = () => act(async () => { fireEvent.click(q('[data-hex-forge="garra:agua"]')); await Promise.resolve(); await Promise.resolve(); });
const hexEstado = () => JSON.parse(document.querySelector('[data-testid="estado"]')!.textContent!);

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState.hexsmith)}</pre>;
}
function abrirHex(language = 'pt-BR', hexsmith?: unknown) {
  localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'a'.repeat(32));
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({
    activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, defeatedElements: [...ALL_ELEMENT_IDS], gamePoints: 2000, hexsmith,
    foodInventory: { [potionKey('agua')]: 3 }, equipment: { owned: [], equipped: {}, fragments: HEX_COSTS.element.fragments },
  }));
  render(<GameStateProvider><HexsmithSheet language={language} sprite="/x.png" petElement="fogo" /><Espiao /></GameStateProvider>);
  click(q('[data-hex-slot="garra"]'));
  click(q('[data-hex-item="garra:agua"]'));
}

beforeEach(() => {
  installDomGlobals(); localStorage.clear(); forja.mockClear();
  forja.mockImplementation(async () => ({ ok: true, already: false }));
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede'))));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Hexsmith: modal de resultado', () => {
  it('servidor confirma: abre UM modal com nome, efeito, X e acoes; Equipar agora equipa e fecha', async () => {
    abrirHex();
    await forjar();
    expect(modais().length).toBe(1);
    expect(q('[data-forge-result]').closest('[role="dialog"]')).not.toBeNull();
    expect(q('[data-forge-result-name]').textContent).toBeTruthy();
    expect(q('[data-forge-result-effect]').textContent).toBeTruthy();
    expect(q('[data-popup-titulo]').textContent).toBe('HEX forjado');
    expect(q('.sm2-popup-fechar')).not.toBeNull();
    expect(q('[data-forge-result-close]').textContent).toBe('Fechar');
    await act(async () => { fireEvent.click(q('[data-forge-result-primary]')); });
    expect(modais().length).toBe(0);
    expect(hexEstado().equipped.garra).toBe('garra:agua');
  });
  it('Fechar nao troca o HEX ja equipado; EN traduz', async () => {
    abrirHex('en-US', { owned: ['garra:fogo'], equipped: { garra: 'garra:fogo' } });
    await forjar();
    expect(q('[data-popup-titulo]').textContent).toBe('HEX forged');
    expect(q('[data-forge-result-primary]').textContent).toBe('Equip now');
    click(q('[data-forge-result-close]'));
    expect(modais().length).toBe(0);
    expect(hexEstado().equipped.garra).toBe('garra:fogo');
  });
  it('already (reentrega do servidor): nao abre modal', async () => {
    forja.mockImplementation(async () => ({ ok: true, already: true }));
    abrirHex();
    await forjar();
    expect(modais().length).toBe(0);
  });
  it('erro/recusa: so a mensagem, nenhum modal de sucesso', async () => {
    forja.mockImplementation(async () => ({ ok: false, kind: 'saldo' }));
    abrirHex();
    await forjar();
    expect(modais().length).toBe(0);
    expect(q('[data-hex-aviso]')).not.toBeNull();
  });
  it('uma forja = uma chamada ao servidor = um modal', async () => {
    abrirHex();
    await forjar();
    expect(modais().length).toBe(1);
    expect(forja).toHaveBeenCalledTimes(1);
  });
});

describe('Pocao de elemento: modal de resultado', () => {
  const base = { open: true, language: 'pt-BR' as const, onBack: () => {}, essences: { agua: 100 }, unlocked: ['agua'] };
  const criar = () => { click(q('[data-potion-create="agua"]')); click(q('[data-potion-confirm]')); };
  it('craft aceito: abre UM modal com a pocao; Fechar fecha', () => {
    render(<ElementPotionSheet {...base} onCraft={() => true} />);
    criar();
    expect(modais().length).toBe(1);
    expect(q('[data-forge-result-name]').textContent).toContain('Poção de');
    expect(q('[data-forge-result-primary]')).toBeNull();
    click(q('[data-forge-result-close]'));
    expect(modais().length).toBe(0);
  });
  it('craft recusado (false): sem modal', () => {
    render(<ElementPotionSheet {...base} onCraft={() => false} />);
    criar();
    expect(modais().length).toBe(0);
  });
  it('composta: tambem abre o modal', () => {
    const inv = { [potionKey('agua')]: 1, [potionKey('terra')]: 1 };
    render(<ElementPotionSheet {...base} essences={{ pantano: 50 }} inventory={inv} unlocked={['agua', 'terra', 'pantano']} onCraft={() => true} />);
    const b = q('[data-potion-create="pantano"]') as HTMLButtonElement | null;
    expect(b).not.toBeNull();
    expect(b!.disabled).toBe(false);
    click(b!); click(q('[data-potion-confirm]'));
    expect(modais().length).toBe(1);
  });
});

describe('Modal de resultado: estrutura 360/375/412', () => {
  it('sem largura fixa > 328px, popup central inline, quebra de linha segura', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    const bloco = css.slice(css.indexOf('MODAL DE RESULTADO DE FORJA'));
    expect(bloco).toContain('overflow-wrap: anywhere');
    expect(/(?<!min-|max-)width:\s*(\d+)px/.test(bloco)).toBe(false);
    const src = readFileSync(resolve(__dirname, './ForgeResultModal.tsx'), 'utf8');
    expect(src).toMatch(/maxWidth=\{328\}/);
    expect(src).toContain('titulo="inline"');
  });
});
