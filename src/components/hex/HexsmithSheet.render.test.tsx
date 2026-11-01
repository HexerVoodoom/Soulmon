// @vitest-environment jsdom
/**
 * A tela da Hexsmith (01/11/2026): 5 encaixes no mapa, forjar com saldo debita e equipa, recusa mostra o motivo, trocar não tira a posse,
 * esvaziar mantém o item, e não existe botão de vender/descartar.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { GameStateProvider, useGameState } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { HEX_COSTS, HEX_SLOTS } from '../../utils/hexsmith';
import { elementsMatchingBases, potionKey } from '../../utils/elementPotion';
import { ALL_ELEMENT_IDS } from '../../utils/elementDex';
import { hexRefusalText } from '../../utils/hexsmithCopy';
import HexsmithSheet from './HexsmithSheet';

vi.mock('../../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify({ hx: gameState.hexsmith, bits: gameState.gamePoints, food: gameState.foodInventory, frag: gameState.equipment?.fragments })}</pre>;
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);
function abrir(save: Record<string, unknown>, language = 'pt-BR') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, defeatedElements: [...ALL_ELEMENT_IDS], ...save }));
  render(<GameStateProvider><HexsmithSheet language={language} sprite="/x.png" petElement="fogo" /><Espiao /></GameStateProvider>);
}
const q = (sel: string) => document.querySelector<HTMLButtonElement>(sel)!;
const click = (el: Element) => act(() => { fireEvent.click(el); });

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('HexsmithSheet', () => {
  it('sem Provider não renderiza nada', () => {
    const { container } = render(<HexsmithSheet language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });

  it('mostra os 5 encaixes ao redor do Soulmon, todos vazios, com rótulo acessível', () => {
    abrir({});
    const slots = document.querySelectorAll('[data-hex-slot]');
    expect(slots).toHaveLength(5);
    for (const s of HEX_SLOTS) expect(q(`[data-hex-slot="${s}"]`).getAttribute('aria-label')).toMatch(/Vazio/);
    // o código hex fica num Disclosure fechado
    expect(document.querySelectorAll('[data-hex-line]')).toHaveLength(0);
    click(screen.getByRole('button', { name: 'Código hex' }));
    expect(document.querySelectorAll('[data-hex-line]')).toHaveLength(5);
  });

  it('o rótulo do encaixe mostra o valor atual; encaixe cheio = um ícone só (o do elemento)', () => {
    abrir({ hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } } });
    const g = q('[data-hex-slot="garra"]');
    expect(g.textContent).toBe('Garra · Água');
    expect(g.querySelectorAll('img, svg')).toHaveLength(1);
    expect(g.querySelector('[data-hex-glyph]')).toBeNull();
    expect(q('[data-hex-slot="coroa"]').textContent).toBe('Coroa');
  });

  it('forjar com saldo debita poções e Bits e equipa no slot vazio; o código hex mostra o reescrito', () => {
    abrir({ gamePoints: 2000, foodInventory: { [potionKey('agua')]: 3 } });
    click(q('[data-hex-slot="garra"]'));
    click(q('[data-hex-item="garra:agua"]'));
    click(q('[data-hex-forge="garra:agua"]'));
    const s = estado();
    expect(s.bits).toBe(2000 - HEX_COSTS.element.bits);
    expect(s.food[potionKey('agua')]).toBeUndefined();
    expect(s.hx.owned).toEqual(['garra:agua']);
    expect(s.hx.equipped.garra).toBe('garra:agua');
    click(screen.getByRole('button', { name: 'Código hex', hidden: true }));
    expect(q('[data-hex-line="garra"]').textContent).toMatch(/Água.*era/);
  });

  it('recusa: o Forjar fica desabilitado e o motivo aparece (convite, sem cobrança)', () => {
    abrir({ gamePoints: 5000, foodInventory: { [potionKey('agua')]: 1 } });
    click(q('[data-hex-slot="garra"]'));
    click(q('[data-hex-item="garra:agua"]'));
    expect(q('[data-hex-forge="garra:agua"]').disabled).toBe(true);
    const r = document.querySelector('[data-hex-refusal]')!;
    expect(r.getAttribute('data-hex-refusal')).toBe('potions');
    expect(r.textContent).toBe(hexRefusalText('potions', true, 'Água'));
    expect(r.textContent).not.toMatch(/corra|faltam só|culpa|deve/i);
    // coroa sem fragmentos
    cleanup(); localStorage.clear();
    abrir({ gamePoints: 5000, equipment: { owned: [], equipped: {}, fragments: 0 } });
    click(q('[data-hex-slot="coroa"]'));
    click(q('[data-hex-item="coroa:heal"]'));
    expect(document.querySelector('[data-hex-refusal]')!.getAttribute('data-hex-refusal')).toBe('fragments');
    expect(estado().bits).toBe(5000);
  });

  it('trocar o item equipado não remove a posse; esvaziar mantém; não há vender/descartar', () => {
    abrir({ hexsmith: { owned: ['couraca:fogo', 'couraca:agua'], equipped: { couraca: 'couraca:fogo' } } });
    click(q('[data-hex-slot="couraca"]'));
    click(q('[data-hex-equip="couraca:agua"]'));
    expect(estado().hx).toEqual({ owned: ['couraca:fogo', 'couraca:agua'], equipped: { couraca: 'couraca:agua' } });
    expect(document.querySelector('[data-hex-is-equipped]')!.textContent).toMatch(/Água.*Equipado/);
    click(q('[data-hex-clear] button'));
    expect(estado().hx).toEqual({ owned: ['couraca:fogo', 'couraca:agua'], equipped: {} });
    const txt = document.body.textContent!;
    expect(txt).not.toMatch(/vender|sell|descartar|discard|jogar fora/i);
    // possuídos não aparecem no catálogo de forja
    expect(document.querySelector('[data-hex-item="couraca:fogo"]')).toBeNull();
  });

  it('catálogo de elemento: 210 itens, quem pode pagar vem primeiro, filtro por bases e uma rolagem só', () => {
    abrir({ gamePoints: 2000, foodInventory: { [potionKey('luz')]: 3 } });
    click(q('[data-hex-slot="amuleto"]'));
    const items = document.querySelectorAll('[data-hex-item]');
    expect(items).toHaveLength(210);
    expect(items[0].getAttribute('data-hex-item')).toBe('amuleto:luz');
    const ul = q('[data-hex-catalog]');
    expect(ul.style.maxHeight).toBe('');
    expect(ul.style.overflowY).toBe('');
    // sem busca de texto nem checkbox
    expect(document.querySelector('input[type="search"], input[type="checkbox"]')).toBeNull();
    // filtro por bases: o mesmo ElementBaseSlots do Laboratório
    click(q('[data-slot="0"]'));
    click(q('[data-base="agua"]'));
    const want = elementsMatchingBases(['agua']).map((v) => `amuleto:${v}`);
    const got = [...document.querySelectorAll('[data-hex-item]')].map((b) => b.getAttribute('data-hex-item'));
    expect(got.sort()).toEqual(want.sort());
  });

  it('elemento não desbloqueado no Drive não aparece no catálogo', () => {
    abrir({ defeatedElements: ['fogo', 'agua'] });
    click(q('[data-hex-slot="garra"]'));
    const got = [...document.querySelectorAll('[data-hex-item]')].map((b) => b.getAttribute('data-hex-item')).sort();
    expect(got).toEqual(['garra:agua', 'garra:fogo']);
  });

  it('seleção tonal: escolhido = aria-pressed + data-on; sem saldo continua marcado; Forjar com aria-describedby no motivo', () => {
    abrir({ gamePoints: 0 });
    click(q('[data-hex-slot="garra"]'));
    const it = q('[data-hex-item="garra:agua"]');
    expect(it.getAttribute('data-ok')).toBe('false');
    click(it);
    expect(it.getAttribute('aria-pressed')).toBe('true');
    expect(it.getAttribute('data-on')).toBe('true');
    const b = q('[data-hex-forge="garra:agua"]');
    expect(b.style.width).toBe('');
    const r = document.querySelector('[data-hex-refusal]')!;
    expect(b.getAttribute('aria-describedby')).toBe(r.id);
  });

  it('EN: rótulos em inglês', () => {
    abrir({}, 'en');
    expect(q('[data-hex-slot="coroa"]').getAttribute('aria-label')).toMatch(/^Crown: Empty/);
  });
});
