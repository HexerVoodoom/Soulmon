// @vitest-environment jsdom
/**
 * A tela da Hexsmith (01/11/2026): 5 Portas no mapa, forjar com saldo debita e equipa, recusa mostra o motivo, trocar não tira a posse,
 * desequipar (no botão do próprio HEX, 13/11/2026) mantém o item, e não existe botão de vender/descartar.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { GameStateProvider, useGameState } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { HEX_COSTS, HEX_SLOTS } from '../../utils/hexsmith';
import { elementsMatchingBases, potionKey } from '../../utils/elementPotion';
import { ALL_ELEMENT_IDS } from '../../utils/elementDex';
import { hexRefusalText } from '../../utils/hexsmithCopy';
import HexsmithSheet from './HexsmithSheet';

const forjaServidor = vi.fn(async (): Promise<{ ok: true; already: boolean } | { ok: false; kind: string }> => ({ ok: true, already: false }));
vi.mock('../../utils/cloudSave', () => ({
  cloudHexForge: () => forjaServidor(),
  cloudHexRename: async () => ({ ok: false, kind: 'offline' }),
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
const forjar = (id: string) => act(async () => { fireEvent.click(q(`[data-hex-forge="${id}"]`)); await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => { installDomGlobals(); localStorage.clear(); forjaServidor.mockClear(); forjaServidor.mockImplementation(async () => ({ ok: true, already: false })); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('HexsmithSheet', () => {
  it('sem Provider não renderiza nada', () => {
    const { container } = render(<HexsmithSheet language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });

  it('mostra as 5 Portas ao redor do Soulmon, todos vazios, com rótulo acessível', () => {
    abrir({});
    const slots = document.querySelectorAll('[data-hex-slot]');
    expect(slots).toHaveLength(5);
    for (const s of HEX_SLOTS) expect(q(`[data-hex-slot="${s}"]`).getAttribute('aria-label')).toMatch(/Vazio/);
    // o código hex fica num Disclosure fechado
    expect(document.querySelectorAll('[data-hex-line]')).toHaveLength(0);
    click(screen.getByRole('button', { name: 'Código hex' }));
    expect(document.querySelectorAll('[data-hex-line]')).toHaveLength(5);
  });

  it('o rótulo da Porta mostra o valor atual; Porta cheia = um ícone só (o do elemento)', () => {
    abrir({ hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } } });
    const g = q('[data-hex-slot="garra"]');
    expect(g.textContent).toBe('Garra · Água');
    expect(g.getAttribute('aria-label')).toBe('Porta da Garra: Água');
    expect(g.querySelectorAll('img, svg')).toHaveLength(1);
    expect(g.querySelector('[data-hex-glyph]')).toBeNull();
    // arte final em vigor: porta vazia usa o PNG da porta (apagado), não o glifo SVG
    const c = q('[data-hex-slot="coroa"]');
    expect(c.querySelector('[data-hex-glyph]')).toBeNull();
    expect(c.querySelector('img')!.getAttribute('data-empty')).toBe('true');
    expect(document.querySelector('[data-hex-map] img[src*="mapa-portas"]')).not.toBeNull();
    expect(q('[data-hex-slot="coroa"]').textContent).toBe('Coroa');
  });

  it('forjar com saldo (servidor confirma) debita poções e Bits e equipa no slot vazio; o código hex mostra o reescrito', async () => {
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'a'.repeat(32));
    abrir({ gamePoints: 2000, foodInventory: { [potionKey('agua')]: 3 }, equipment: { owned: [], equipped: {}, fragments: HEX_COSTS.element.fragments } });
    click(q('[data-hex-slot="garra"]'));
    click(q('[data-hex-item="garra:agua"]'));
    await forjar('garra:agua');
    expect(forjaServidor).toHaveBeenCalledTimes(1);
    const s = estado();
    expect(s.bits).toBe(2000 - HEX_COSTS.element.bits);
    expect(s.food[potionKey('agua')]).toBeUndefined();
    expect(s.hx.owned).toEqual(['garra:agua']);
    expect(s.hx.equipped.garra).toBe('garra:agua');
    click(screen.getByRole('button', { name: 'Código hex', hidden: true }));
    expect(q('[data-hex-line="garra"]').textContent).toMatch(/Água.*era/);
  });

  it('sem rede: erro claro e NADA forja localmente (§216)', async () => {
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'a'.repeat(32));
    forjaServidor.mockImplementation(async () => ({ ok: false, kind: 'offline' }));
    abrir({ gamePoints: 2000, foodInventory: { [potionKey('agua')]: 3 }, equipment: { owned: [], equipped: {}, fragments: HEX_COSTS.element.fragments } });
    click(q('[data-hex-slot="garra"]'));
    click(q('[data-hex-item="garra:agua"]'));
    await forjar('garra:agua');
    const s = estado();
    expect(s.bits).toBe(2000);
    expect(s.hx?.owned ?? []).toEqual([]);
    expect(document.querySelector('[data-hex-aviso]')!.textContent).toMatch(/Sem conexão/);
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

  it('trocar o item equipado não remove a posse; desequipar mantém; não há vender/descartar', () => {
    abrir({ hexsmith: { owned: ['couraca:fogo', 'couraca:agua'], equipped: { couraca: 'couraca:fogo' } } });
    click(q('[data-hex-slot="couraca"]'));
    click(q('[data-hex-equip="couraca:agua"]'));
    expect(estado().hx).toEqual({ owned: ['couraca:fogo', 'couraca:agua'], equipped: { couraca: 'couraca:agua' } });
    expect(document.querySelector('[data-hex-is-equipped]')!.textContent).toMatch(/Água.*Equipado/);
    click(q('[data-hex-unequip="couraca:agua"]'));
    expect(estado().hx).toEqual({ owned: ['couraca:fogo', 'couraca:agua'], equipped: {} });
    const txt = document.body.textContent!;
    expect(txt).not.toMatch(/vender|sell|descartar|discard|jogar fora/i);
    // possuídos não aparecem no catálogo de forja
    expect(document.querySelector('[data-hex-item="couraca:fogo"]')).toBeNull();
  });

  it('HEX possuído (13/11/2026): UM botão grande alterna Equipar ⇄ Desequipar; sem a linha "Esvaziar a porta"; trocar substitui', () => {
    for (const [lang, equip, unequip, equipped, empty] of [['pt-BR', 'Equipar', 'Desequipar', 'Equipado', /Esvaziar a porta/], ['en', 'Equip', 'Unequip', 'Equipped', /Empty the Port/]] as const) {
      abrir({ hexsmith: { owned: ['coroa:dot', 'coroa:heal'], equipped: {} } }, lang);
      click(q('[data-hex-slot="coroa"]'));
      expect(document.body.textContent).not.toMatch(empty);
      expect(document.querySelector('[data-hex-clear]')).toBeNull();
      // não equipado: um botão só por linha, rótulo de AÇÃO, alvo do kit (não o CtaButton do site)
      const row = q('[data-hex-owned="coroa:dot"]');
      expect(row.querySelectorAll('button')).toHaveLength(1);
      const b = q('[data-hex-equip="coroa:dot"]');
      expect(b.textContent).toBe(equip);
      expect(b.className).toMatch(/(^| )sm2-kit-btn .*sm2-hex-equip-btn/);
      expect(b.className).not.toMatch(/cta/i);
      expect(b.getAttribute('data-state')).toBe('idle');
      click(b);
      expect(estado().hx.equipped.coroa).toBe('coroa:dot');
      // equipado: o MESMO lugar vira ✓ Equipado + Desequipar, com rótulo acessível que diz o estado
      const u = q('[data-hex-unequip="coroa:dot"]');
      expect(u.getAttribute('data-state')).toBe('equipped');
      expect(u.querySelector('.sm2-hex-equip-state')!.textContent).toMatch(new RegExp(`${equipped}$`));
      expect(u.querySelector('.sm2-hex-equip-state .sm2-icon, .sm2-hex-equip-state svg')).not.toBeNull();
      expect(u.querySelector('.sm2-hex-equip-action')!.textContent).toBe(unequip);
      expect(u.getAttribute('aria-label')).toBe(`${unequip}: ${lang === 'en' ? 'Lingering damage' : 'Dano contínuo'} (${equipped})`);
      // equipar OUTRO com um já equipado: troca direto (a regra de equipHexItem), o anterior segue na posse
      click(q('[data-hex-equip="coroa:heal"]'));
      expect(estado().hx).toEqual({ owned: ['coroa:dot', 'coroa:heal'], equipped: { coroa: 'coroa:heal' } });
      expect(document.querySelector('[data-hex-unequip="coroa:dot"]')).toBeNull();
      click(q('[data-hex-unequip="coroa:heal"]'));
      expect(estado().hx.equipped).toEqual({});
      cleanup(); localStorage.clear();
    }
  });

  it('coroa por família: cada família mostra a própria coroa-<familia>.png (a coroa única só é reserva)', () => {
    abrir({ hexsmith: { owned: ['coroa:dot'], equipped: { coroa: 'coroa:dot' } } });
    const img = q('[data-hex-slot="coroa"]').querySelector('img')!;
    expect(img.getAttribute('data-hex-crown')).toBe('dot');
    expect(img.getAttribute('src')).toMatch(/coroa-dot/);
  });

  it('Coroa equipada: SEM anel/glow/borda redonda; ícone direto, maior, aria-hidden; botão do slot rotulado', () => {
    abrir({ hexsmith: { owned: ['coroa:dot'], equipped: { coroa: 'coroa:dot' } } });
    const btn = q('[data-hex-slot="coroa"]');
    expect(btn.getAttribute('aria-label')).toMatch(/Coroa|Porta/);
    const img = btn.querySelector('img')!;
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(Number(img.getAttribute('width'))).toBeGreaterThanOrEqual(44);
    // jsdom não carrega o CSS: confere a fonte
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
    expect(css).not.toMatch(/\.sm2-hex-art\[data-hex-crown\] \{/);
    const bloco = css.slice(css.indexOf('.sm2-hex-art {'), css.indexOf('.sm2-hex-slot {'));
    expect(bloco).not.toMatch(/box-shadow|border-radius|border:/);
    expect(bloco).toMatch(/clip-path: polygon/);
    expect(css).toMatch(/\.sm2-hex-slot \{[^}]*width: 56px; height: 56px/);
  });

  it('linhas de lista: ícone maior (Seus HEXes 56, Forja 40), sem anel', () => {
    abrir({ gamePoints: 2000, hexsmith: { owned: ['coroa:dot'], equipped: {} } });
    click(q('[data-hex-slot="coroa"]'));
    expect(Number(q('[data-hex-owned="coroa:dot"]').querySelector('img')!.getAttribute('width'))).toBe(56);
    expect(Number(q('[data-hex-item]').querySelector('img')!.getAttribute('width'))).toBe(40);
  });

  it('catálogo de elemento: 210 itens, quem pode pagar vem primeiro, filtro por bases e uma rolagem só', () => {
    abrir({ gamePoints: 2000, foodInventory: { [potionKey('luz')]: 3 }, equipment: { owned: [], equipped: {}, fragments: HEX_COSTS.element.fragments } });
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
    expect(q('[data-hex-slot="coroa"]').getAttribute('aria-label')).toMatch(/^Crown Port: Empty/);
  });

  it('cada Porta abre com a linha do que ela faz, embaixo do título (PT e EN)', () => {
    for (const lang of ['pt-BR', 'en']) for (const s of HEX_SLOTS) {
      abrir({}, lang);
      click(q(`[data-hex-slot="${s}"]`));
      const d = document.querySelector(`[data-hex-desc="${s}"]`)?.textContent ?? '';
      expect(d.length, `${lang}/${s}`).toBeGreaterThan(5);
      cleanup();
    }
  });

  it('tabela de custo (12/11): colunas Item/Custo; poção como ÍCONE com o estoque embaixo; tocar abre o tooltip de como conseguir; fecha ao tocar fora', () => {
    abrir({ gamePoints: 2000, foodInventory: { [potionKey('agua')]: 1 }, equipment: { owned: [], equipped: {}, fragments: 5 } });
    click(q('[data-hex-slot="garra"]'));
    const head = document.querySelector('.sm2-hex-thead')!;
    expect(head.textContent).toBe('ItemCusto');
    const cell = q('[data-hex-item="garra:agua"]').closest('li')!;
    const pot = cell.querySelector('[data-hex-cost-potion="agua"]')!;
    expect(pot.querySelector('img')).not.toBeNull();
    expect(pot.querySelector('[data-hex-potion-qty]')!.textContent).toBe(`1/${HEX_COSTS.element.potions}`);
    expect(cell.querySelector('[data-hex-cost-fragments]')!.textContent).toBe(`5/${HEX_COSTS.element.fragments}`);
    expect(cell.querySelectorAll('.sm2-hex-plus')).toHaveLength(2);
    expect(cell.querySelector('[data-hex-cost-bits]')!.textContent).toMatch(/\d/);
    click(cell.querySelector('[data-hex-cost-bits] button[data-info-tip]')!);
    expect(document.querySelector('[data-hex-bits-tip]')).not.toBeNull();
    act(() => { fireEvent.pointerDown(document.body); });
    click(cell.querySelector('[data-hex-cost-fragments] button[data-info-tip]')!);
    expect(document.querySelector('[data-hex-fragments-tip]')!.textContent).toMatch(/Masmorra/);
    act(() => { fireEvent.pointerDown(document.body); });
    expect(document.querySelector('[data-hex-potion-tip]')).toBeNull();
    click(pot.querySelector('button[data-info-tip]')!);
    expect(document.querySelector('[data-hex-potion-tip]')!.textContent).toMatch(/essências de Água/);
    expect(q('[data-hex-item="garra:agua"]').getAttribute('aria-pressed')).toBe('false'); // tocar a poção não seleciona o item
    act(() => { fireEvent.pointerDown(document.body); });
    expect(document.querySelector('[data-hex-potion-tip]')).toBeNull();
  });
});
