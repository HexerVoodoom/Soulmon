// @vitest-environment jsdom
/**
 * Combate v3 / PR8b — o equipamento na tela: vazio, comprar com Bits ganhos, com fragmentos, equipar/tirar, recusas neutras
 * (Bits insuficientes, Bits de Crédito), sem Provider (nada), arte ausente (fallback de texto) e save hostil.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { xpForLevel } from '../utils/bond';
import { TIER_BITS, TIER_FRAGMENTS, FRAGMENTS_PER_RUN, addFragments, fragmentGain, type EquipmentState } from '../utils/equipment';
import { equipArtNames } from '../utils/equipArt';
import { itemName, refusalText } from '../utils/equipmentCopy';
import EquipmentCard from './EquipmentCard';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify({ eq: gameState.equipment, bits: gameState.gamePoints, origin: gameState.bitsOrigin })}</pre>;
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);

function abrir(save: Record<string, unknown>, language = 'pt-BR') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, ...save }));
  render(<GameStateProvider><EquipmentCard language={language} /><Espiao /></GameStateProvider>);
}
const linha = (id: string) => document.querySelector(`[data-equip-item="${id}"]`)!;
const botao = (id: string, re: RegExp) => Array.from(linha(id).querySelectorAll('button')).find((b) => re.test(b.getAttribute('aria-label') ?? ''))!;
const aviso = () => document.querySelector('[data-equip-aviso]')?.textContent ?? '';

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('EquipmentCard', () => {
  it('sem Provider não renderiza nada (demo, testes)', () => {
    const { container } = render(<EquipmentCard language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });

  it('vazio: 3 slots vazios, 9 itens à venda, texto sem sorteio e sem cobrança', () => {
    abrir({ gamePoints: 0 });
    expect(document.querySelector('[data-equip-state]')!.textContent).toMatch(/Nada equipado ainda/);
    for (const s of ['nucleo', 'carapaca', 'rastro']) expect(document.querySelector(`[data-equip-slot="${s}"]`)!.textContent).toMatch(/Slot vazio/);
    expect(document.querySelectorAll('[data-equip-item]')).toHaveLength(9);
    const t = document.querySelector('[data-equipment-card]')!.textContent!;
    expect(t).toMatch(/sem sorteio/);
    expect(t).not.toMatch(/chance|probabilidade|caixa|\bsorte\b|faltam só|corra|acaba/i);
  });

  it('comprar com Bits GANHOS: debita, possui e equipa na hora; o bônus aparece', () => {
    abrir({ gamePoints: 1000 });
    act(() => { fireEvent.click(botao('eq-nucleo-t1', /Comprar/)); });
    expect(estado().eq.owned).toEqual(['eq-nucleo-t1']);
    expect(estado().eq.equipped.nucleo).toBe('eq-nucleo-t1');
    expect(estado().bits).toBe(1000 - TIER_BITS[0]);
    expect(document.querySelector('[data-equip-state]')!.textContent).toMatch(/ataque \+0,5%/);
    expect(document.querySelector('[data-equip-unequip="nucleo"]')).not.toBeNull();
  });

  it('Bits insuficientes: nada muda e o aviso é neutro', () => {
    abrir({ gamePoints: 10 });
    act(() => { fireEvent.click(botao('eq-nucleo-t1', /Comprar/)); });
    expect(estado().eq.owned).toEqual([]);
    expect(estado().bits).toBe(10);
    expect(aviso()).toBe(refusalText('no-funds', true));
  });

  it('Bits que vieram de Crédito NÃO compram equipamento, e o texto explica sem culpa', () => {
    abrir({ gamePoints: 1000, bitsOrigin: { day: 'Mon Oct 05 2026', free: 0, fromCredits: 700, paidLeft: 700 } });
    act(() => { fireEvent.click(botao('eq-nucleo-t1', /Comprar/)); });
    expect(estado().eq.owned).toEqual([]);
    expect(estado().bits).toBe(1000);
    expect(aviso()).toBe(refusalText('not-earned', true));
    expect(aviso()).toMatch(/servem para outras coisas/);
  });

  it('fragmentos: compra sem tocar nos Bits; sem fragmentos o aviso é neutro', () => {
    abrir({ gamePoints: 7, equipment: { owned: [], equipped: {}, fragments: TIER_FRAGMENTS[0] } });
    act(() => { fireEvent.click(botao('eq-rastro-t1', /fragmentos/)); });
    expect(estado().eq.owned).toEqual(['eq-rastro-t1']);
    expect(estado().eq.fragments).toBe(0);
    expect(estado().bits).toBe(7);
    act(() => { fireEvent.click(botao('eq-rastro-t2', /fragmentos/)); });
    expect(estado().eq.owned).toEqual(['eq-rastro-t1']);
    expect(aviso()).toBe(refusalText('no-fragments', true));
  });

  it('equipar troca a peça e tirar esvazia o slot (a peça continua possuída)', () => {
    abrir({ gamePoints: 0, equipment: { owned: ['eq-nucleo-t1', 'eq-nucleo-t2'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 } });
    act(() => { fireEvent.click(botao('eq-nucleo-t2', /Equipar/)); });
    expect(estado().eq.equipped.nucleo).toBe('eq-nucleo-t2');
    act(() => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-equip-unequip="nucleo"]')!); });
    expect(estado().eq.equipped).toEqual({});
    expect(estado().eq.owned).toEqual(['eq-nucleo-t1', 'eq-nucleo-t2']);
  });

  it('Comércio: a Etiqueta (tal-com-01) aparece no preço do botão', () => {
    abrir({ gamePoints: 5000, totalXP: xpForLevel(5), talentPicks: ['tal-com-01', 'tal-com-01'] });
    expect(linha('eq-nucleo-t2').textContent).toContain(`${Math.ceil(TIER_BITS[1] * 0.92)} Bits`);
  });

  it('save hostil (slot forjado) é descartado na carga e a tela mostra o slot vazio', () => {
    abrir({ equipment: { owned: ['eq-nucleo-t1'], equipped: { rastro: 'eq-nucleo-t1', nucleo: 'eq-carapaca-t3' }, fragments: 1e12 } });
    expect(estado().eq.equipped).toEqual({});
    expect(estado().eq.fragments).toBe(999);
  });

  it('inglês: texto em EN, nunca "Level" nem "Nível"', () => {
    abrir({ gamePoints: 0 }, 'en-US');
    expect(document.querySelector('[data-equip-state]')!.textContent).toMatch(/Nothing equipped yet/);
    expect(document.querySelector('[data-equipment-card]')!.textContent).not.toMatch(/Level|Nível/);
    expect(itemName('rastro', 3, false)).toBe('Ornate Trail');
  });
});

describe('PR8b: a arte e a fonte das fragmentos', () => {
  it('os 13 ícones instalados existem (sem arte nova)', () => {
    expect(equipArtNames().sort()).toEqual([
      'eq-carapaca-t1', 'eq-carapaca-t2', 'eq-carapaca-t3', 'eq-nucleo-t1', 'eq-nucleo-t2', 'eq-nucleo-t3',
      'eq-rastro-t1', 'eq-rastro-t2', 'eq-rastro-t3', 'fragmento', 'slot-carapaca', 'slot-nucleo', 'slot-rastro',
    ]);
  });
  it('a run completa da Masmorra rende fragmentos (com o Comércio, +25% no máximo) e a fonte liga isso', () => {
    expect(addFragments({} as { equipment?: EquipmentState }, fragmentGain(FRAGMENTS_PER_RUN, [])).equipment!.fragments).toBe(FRAGMENTS_PER_RUN);
    expect(fragmentGain(FRAGMENTS_PER_RUN, Array(3).fill('tal-com-02'))).toBeLessThanOrEqual(Math.floor(FRAGMENTS_PER_RUN * 1.25));
    const app = readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');
    const corpo = app.slice(app.indexOf('const handleGlitchtama = useCallback'), app.indexOf("contarMissao('dungeon-runs')"));
    expect(corpo).toMatch(/addFragments\(/);
    expect(corpo).toMatch(/fragmentGain\(FRAGMENTS_PER_RUN/);
  });
});
