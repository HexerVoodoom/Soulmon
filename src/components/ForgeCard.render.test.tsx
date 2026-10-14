// @vitest-environment jsdom
/**
 * O Soulsmith na tela (07/10/2026): peças e níveis, materiais, aprimorar com a ESCOLHA entre duas opções, refazer a escolha com Bits ganhos,
 * motivos de recusa em texto, peça comprada antes (nível equivalente), equipar/tirar, sem Provider, EN e save hostil.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { xpForLevel } from '../utils/bond';
import { FRAGMENTS_PER_RUN, addFragments, fragmentGain, type EquipmentState } from '../utils/equipment';
import { REDO_BITS } from '../utils/forge';
import { equipArtNames } from '../utils/equipArt';
import { itemName } from '../utils/equipmentCopy';
import { forgeRefusalText } from '../utils/forgeCopy';
import ForgeCard from './ForgeCard';

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
  return <pre data-testid="estado">{JSON.stringify({ eq: gameState.equipment, forge: gameState.forge, bits: gameState.gamePoints, mats: gameState.buildingQuests?.materials })}</pre>;
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);

function abrir(save: Record<string, unknown>, language = 'pt-BR') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, ...save }));
  render(<GameStateProvider><ForgeCard language={language} /><Espiao /></GameStateProvider>);
}
const peca = (id: string) => document.querySelector(`[data-forge-piece="${id}"]`)!;
const q = (sel: string) => document.querySelector<HTMLButtonElement>(sel)!;
const click = (el: Element) => act(() => { fireEvent.click(el); });
const bq = (materials: Record<string, number>) => ({ day: 'Mon Oct 05 2026', visited: [], claimed: [], materials });
const nivel1 = (extra: Record<string, unknown> = {}) => ({
  totalXP: xpForLevel(6), equipment: { owned: ['eq-nucleo-t1'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 },
  forge: { v: 2, levels: { 'eq-nucleo-t1': 1 }, picks: {} }, ...extra,
});

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('ForgeCard', () => {
  it('sem Provider não renderiza nada (demo, testes)', () => {
    const { container } = render(<ForgeCard language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });

  it('vazio: UMA entrada por tipo (3), cada uma dizendo de qual missão vem, nenhum botão de compra e texto sem sorteio nem cobrança', () => {
    abrir({ gamePoints: 5000 });
    expect(document.querySelector('[data-forge-stock]')).toBeNull();
    expect(document.querySelector('[data-equip-state]')).toBeNull();
    expect(document.querySelectorAll('[data-forge-piece]')).toHaveLength(3);
    // Ajuste do dono (14/10/2026): sem parágrafo explicativo — só o nome do item.
    expect(peca('eq-nucleo-t1').querySelector('[data-forge-upgrade-locked]')).toBeNull();
    expect(peca('eq-nucleo-t1').textContent).not.toMatch(/Vem da missão/);
    expect(document.querySelectorAll('[data-forge-card] button')).toHaveLength(0); // peça ainda não obtida: card informativo, sem botão
    expect(document.querySelectorAll('[data-forge-upgrade]')).toHaveLength(0);
    const t = document.querySelector('[data-forge-card]')!.textContent!;
    expect(t).not.toMatch(/Comprar|chance|probabilidade|caixa|\bsorte\b|faltam só|corra|acaba/i);
    expect(estado().bits).toBe(5000);
  });

  it('aprimorar: o modal pede a ESCOLHA entre A e B, mostra o efeito em %, e confirmar debita os materiais e sobe o nível', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }));
    expect(peca('eq-nucleo-t1').querySelector('[data-forge-bonus]')!.textContent).toBe('+0,1% Ataque');
    expect(peca('eq-nucleo-t1').textContent).toMatch(/Minério 3\/2/);
    click(q('[data-forge-upgrade-btn="eq-nucleo-t1"]'));
    const dlg = document.querySelector('[data-forge-dialog="upgrade"]')!;
    // As DUAS opções são IGUAIS (11/10/2026): nome do ganho + efeito em palavras, o mesmo valor, e nada de "A/B" nem "a correta".
    expect(dlg.textContent).toMatch(/Mais dano · \+0,1%/);
    expect(dlg.textContent).toMatch(/Mais defesa · \+0,1%/);
    expect(dlg.textContent).toMatch(/As duas opções valem o mesmo/);
    expect(dlg.textContent).not.toMatch(/\bA ·|\bB ·|do próprio slot|vizinho|neighbour|slot’s own/);
    const opcoes = [...dlg.querySelectorAll('[data-forge-option]')] as HTMLElement[];
    expect(opcoes.map(o => o.getAttribute('data-forge-attr'))).toEqual(['atk', 'def']);
    // Mesmo peso visual: as duas ocupam a mesma caixa; só a ESCOLHIDA ganha contorno.
    expect(opcoes[0].style.padding).toBe(opcoes[1].style.padding);
    expect(dlg.textContent).toMatch(/param em 5%/);
    click(dlg.querySelector('[data-forge-option="b"] input')!);
    click(q('[data-forge-confirm]'));
    expect(document.querySelector('[data-forge-dialog]')).toBeNull();
    expect(estado().forge.levels['eq-nucleo-t1']).toBe(2);
    expect(estado().forge.picks['eq-nucleo-t1']).toEqual(['b']);
    expect(estado().mats.ore).toBe(1);
    expect(peca('eq-nucleo-t1').textContent).toMatch(/\+0,1% Defesa/);
    // Sem comparação Agora/Próximo (ajuste do dono, 14/10/2026).
    expect(peca('eq-nucleo-t1').textContent).not.toMatch(/Agora|Próximo|Now|Next/);
  });

  it('peça possuída: UM botão só (Upgrade), sem Equipar nem Tirar; o nome acompanha o tier da peça', () => {
    abrir(nivel1(), 'en-US');
    expect(peca('eq-nucleo-t1').querySelector('[data-equipped-badge]')).toBeNull();
    expect(peca('eq-nucleo-t1').textContent).not.toMatch(/Part of your soul/i);
    expect(peca('eq-nucleo-t1').textContent).toMatch(/Copper Core/);
    expect(document.querySelector('[data-equip-unequip]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Unequip|Tirar|\bEquip\b|Equipar/);
    expect(document.querySelector('[data-equip-btn]')).toBeNull();
    const botoes = Array.from(peca('eq-nucleo-t1').querySelectorAll('button'));
    expect(botoes).toHaveLength(1);
    expect(botoes[0].textContent).toBe('Upgrade');
    expect(peca('eq-carapaca-t1').querySelector('button')).toBeNull();
    expect(peca('eq-carapaca-t1').textContent).not.toMatch(/Comes from/);
    expect(estado().eq.owned).toEqual(['eq-nucleo-t1']);
  });

  it('save antigo com peça possuída e "tirada" volta equipada na carga', () => {
    abrir({ totalXP: xpForLevel(6), equipment: { owned: ['eq-nucleo-t1'], equipped: {}, fragments: 0 } });
    expect(estado().eq.equipped.nucleo).toBe('eq-nucleo-t1');
    expect(peca("eq-nucleo-t1").querySelector("[data-equipped-badge]")).toBeNull(); // selo "Parte da sua alma" removido
  });

  it('celebração: não aparece ao abrir nem ao cancelar; aparece após o upgrade confirmado, com movimento', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }), 'en-US');
    expect(document.querySelector('[data-forge-seal]')).toBeNull();
    click(q('[data-forge-upgrade-btn="eq-nucleo-t1"]'));
    click(q('[data-forge-cancel]'));
    expect(document.querySelector('[data-forge-seal]')).toBeNull();
    click(q('[data-forge-upgrade-btn="eq-nucleo-t1"]'));
    click(q('[data-forge-confirm]'));
    const seal = document.querySelector('[data-forge-seal]')!;
    expect(seal.textContent).toMatch(/Upgraded!.*Lv 2/);
    expect(peca('eq-nucleo-t1').getAttribute('data-motion')).toBe('full');
    expect(document.querySelectorAll('[data-forge-fx="spark"]').length).toBeGreaterThan(0);
    expect(estado().eq.owned).toEqual(['eq-nucleo-t1']);
  });

  it('celebração com movimento reduzido: mantém o selo textual e tira as faíscas', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: /reduce/.test(query), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    window.matchMedia = (globalThis as unknown as { matchMedia: typeof window.matchMedia }).matchMedia;
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }), 'pt-BR');
    click(q('[data-forge-upgrade-btn="eq-nucleo-t1"]'));
    click(q('[data-forge-confirm]'));
    expect(document.querySelector('[data-forge-seal]')!.textContent).toMatch(/Aprimorado!.*Nv 2/);
    expect(peca('eq-nucleo-t1').getAttribute('data-motion')).toBe('reduced');
    expect(document.querySelector('[data-forge-fx]')).toBeNull();
  });

  it('Cancelar não gasta nada', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }));
    click(q('[data-forge-upgrade-btn="eq-nucleo-t1"]'));
    click(q('[data-forge-cancel]'));
    expect(document.querySelector('[data-forge-dialog]')).toBeNull();
    expect(estado().forge.levels['eq-nucleo-t1']).toBe(1);
    expect(estado().mats.ore).toBe(3);
  });

  it('falta material: o botão fica desabilitado e o MOTIVO aparece em texto neutro', () => {
    abrir(nivel1({ buildingQuests: bq({}) }));
    expect(q('[data-forge-upgrade-btn="eq-nucleo-t1"]').disabled).toBe(true);
    const why = peca('eq-nucleo-t1').querySelector('[data-forge-why]')!.textContent!;
    expect(why).toBe(forgeRefusalText('no-materials', true));
    expect(why).not.toMatch(/corra|acaba|última|perde/i);
  });

  it('falta Vínculo: o motivo diz de qual Vínculo abre o nível', () => {
    abrir(nivel1({ totalXP: 0, buildingQuests: bq({ ore: 9 }) }));
    expect(q('[data-forge-upgrade-btn="eq-nucleo-t1"]').disabled).toBe(true);
    expect(peca('eq-nucleo-t1').querySelector('[data-forge-why]')!.textContent).toMatch(/Vínculo 2/);
  });

  it('refazer a escolha com Bits GANHOS: confirma, troca A↔B, debita e os materiais ficam', () => {
    abrir(nivel1({ gamePoints: 1000, buildingQuests: bq({ ore: 1 }), forge: { v: 2, levels: { 'eq-nucleo-t1': 2 }, picks: { 'eq-nucleo-t1': ['b'] } } }));
    click(q(`[data-forge-redo="eq-nucleo-t1:2"]`));
    const dlg = document.querySelector('[data-forge-dialog="redo"]')!;
    expect(dlg.textContent).toMatch(new RegExp(`${REDO_BITS} Bits ganhos`));
    expect(dlg.textContent).toMatch(/Escolha atual/);
    click(q('[data-forge-confirm]'));
    expect(estado().forge.picks['eq-nucleo-t1'] ?? ['a']).not.toContain('b');
    expect(estado().bits).toBe(1000 - REDO_BITS);
    expect(estado().mats.ore).toBe(1);
  });

  it('refazer com Bits que vieram de Crédito: o botão fica desabilitado e o texto explica sem culpa', () => {
    abrir(nivel1({ gamePoints: 1000, bitsOrigin: { day: 'Mon Oct 05 2026', free: 0, fromCredits: 900, paidLeft: 900 }, forge: { v: 2, levels: { 'eq-nucleo-t1': 2 }, picks: { 'eq-nucleo-t1': ['b'] } } }));
    click(q(`[data-forge-redo="eq-nucleo-t1:2"]`));
    expect(q('[data-forge-confirm]').disabled).toBe(true);
    expect(document.querySelector('[data-forge-redo-note]')!.textContent).toMatch(/servem para outras coisas/);
    expect(estado().bits).toBe(1000);
  });

  it('peça comprada antes do Soulsmith (sem registro) aparece no nível equivalente, sem perder nada', () => {
    abrir({ totalXP: xpForLevel(6), equipment: { owned: ['eq-nucleo-t3'], equipped: { nucleo: 'eq-nucleo-t3' }, fragments: 0 } });
    expect(peca('eq-nucleo-t3').textContent).toMatch(/\+1,5% Ataque/);
    expect(peca('eq-nucleo-t3').textContent).not.toMatch(/Lv 15/);
    expect(peca('eq-nucleo-t3').textContent).not.toMatch(/Upgrade/);
  });

  it('save com dois tiers do mesmo tipo: UM card, no tier mais alto, sem Equipar (migração: fica o mais alto)', () => {
    abrir({ totalXP: xpForLevel(6), equipment: { owned: ['eq-nucleo-t1', 'eq-nucleo-t2'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 } });
    expect(document.querySelectorAll('[data-forge-piece]')).toHaveLength(3);
    expect(estado().eq.owned).toEqual(['eq-nucleo-t2']);
    expect(estado().eq.equipped.nucleo).toBe('eq-nucleo-t2');
    expect(peca('eq-nucleo-t2').textContent).toMatch(/Núcleo polido/);
    expect(document.querySelector('[data-equip-btn]')).toBeNull();
  });

  it('save hostil (slot forjado, nível absurdo) é descartado na carga', () => {
    abrir({ equipment: { owned: ['eq-nucleo-t1'], equipped: { rastro: 'eq-nucleo-t1' }, fragments: 1e12 }, forge: { v: 2, levels: { 'eq-nucleo-t1': 99, 'eq-xxx': 3 }, picks: { 'eq-nucleo-t1': ['b', 'b', 'b', 'b', 'b', 'b'] } } });
    expect(estado().eq.equipped).toEqual({ nucleo: 'eq-nucleo-t1' });
    expect(estado().eq.fragments).toBe(999);
    expect(estado().forge.levels).toEqual({ 'eq-nucleo-t1': 15 });
    expect(estado().forge.picks['eq-nucleo-t1']).toHaveLength(14);
  });

  it('inglês: texto em EN primeiro, "Soulsmith", "Lv", nunca "Nível"', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 2 }) }), 'en-US');
    const t = document.querySelector('[data-forge-card]')!.textContent!;
    expect(t).toMatch(/Soulsmith/);
    expect(peca('eq-nucleo-t1').querySelector('[data-forge-bonus]')!.textContent).toBe('+0.1% Attack');
    expect(t).toMatch(/Ore 2\/2/);
    expect(t).not.toMatch(/Nível|Vem da/);
    expect(itemName('rastro', 3, false)).toBe('Ornate Trail');
  });
});

describe('o modal de aprimorar em inglês (11/10/2026)', () => {
  it('as duas opções são iguais e diretas: "More damage" OR "More defense", sem A/B', () => {
    abrir(nivel1({ buildingQuests: bq({ ore: 3 }) }), 'en-US');
    click(q('[data-forge-upgrade-btn="eq-nucleo-t1"]'));
    const t = document.querySelector('[data-forge-dialog="upgrade"]')!.textContent!;
    expect(t).toMatch(/More damage · \+0\.1%/);
    expect(t).toMatch(/More defense · \+0\.1%/);
    expect(t).toMatch(/Both options are worth the same/);
    expect(t).toMatch(/Your Soulmon hits a little harder/);
    expect(t).not.toMatch(/\bA ·|\bB ·|neighbouring|slot’s own/);
  });
});

describe('a arte e a fonte dos fragmentos', () => {
  it('os 13 ícones instalados existem (sem arte nova)', () => {
    expect(equipArtNames().sort()).toEqual([
      'eq-carapaca-t1', 'eq-carapaca-t2', 'eq-carapaca-t3', 'eq-nucleo-t1', 'eq-nucleo-t2', 'eq-nucleo-t3',
      'eq-rastro-t1', 'eq-rastro-t2', 'eq-rastro-t3', 'fragmento', 'slot-carapaca', 'slot-nucleo', 'slot-rastro',
    ]);
  });
  it('a run completa da Masmorra rende fragmentos (com o Comércio, +25% no máximo) — agora pagam o "refazer"', () => {
    expect(addFragments({} as { equipment?: EquipmentState }, fragmentGain(FRAGMENTS_PER_RUN, [])).equipment!.fragments).toBe(FRAGMENTS_PER_RUN);
    expect(fragmentGain(FRAGMENTS_PER_RUN, Array(3).fill('tal-com-02'))).toBeLessThanOrEqual(Math.floor(FRAGMENTS_PER_RUN * 1.25));
    const app = readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');
    const corpo = app.slice(app.indexOf('const handleGlitchtama = useCallback'), app.indexOf("contarMissao('dungeon-runs')"));
    // 11/10/2026 (REGISTRO §36): a conta do marco mudou para `utils/dungeonRewards.ts` (a MESMA da descida que continua sozinha); o App a chama
    expect(corpo).toMatch(/applyMilestoneItem\(/);
    const conta = readFileSync(`${process.cwd()}/src/utils/dungeonRewards.ts`, 'utf8');
    expect(conta).toMatch(/addFragments\(/);
    expect(conta).toMatch(/fragmentGain\(FRAGMENTS_PER_RUN/);
  });
});
