// @vitest-environment jsdom
/**
 * Regressão dos 3 bugs do decor achados pelo dono na Home real (REGISTRO §484):
 *  1. tocar no Fliperama de Canto não abria o Salão de jogos (e o Espelho, o Perfil): o botão morava na camada de TRÁS (`aria-hidden`), sob o
 *     grupo do pet que cobre o palco todo. Agora é uma camada própria, depois do pet no DOM e com z-index acima.
 *  2. o cogumelo não "acendia" ao apagar a luz: o véu da noite (55% de escuro) fica por cima da decoração. O brilho agora vai numa camada depois do véu.
 *  3. a PAREDE era desenhada por último, na frente das outras peças. Agora é a primeira (atrás de tudo).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { DRAW_ORDER } from './PetStageDecor';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_SLOTS, SLOT_ORDER, decorFitsSetting } from '../utils/petStage';
import { ALL_SHOP_ITEMS } from '../utils/shop';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
  healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10, useAI: false,
  language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 8,
};

beforeAll(async () => { await import('./home/Mochila'); await import('./ChatBox'); });
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste')))); });
afterEach(() => { vi.unstubAllGlobals(); });

/** Um cenário que aceita o item no slot dado (ou em qualquer slot livre do item). */
function cena(itemId: string, slotId?: string) {
  const item = ALL_SHOP_ITEMS.find(i => i.id === itemId)!;
  for (const [k, bg] of Object.entries(PET_BACKGROUNDS)) {
    if (!decorFitsSetting(item.fits ?? 'any', bg.setting)) continue;
    const slot = slotId ?? item.slot;
    if (slot && bg.slots.includes(slot as never)) return { bgId: k, slot: slot as (typeof SLOT_ORDER)[number] };
  }
  throw new Error(`sem cenário para ${itemId}`);
}

const z = (el: Element | null) => Number((el as HTMLElement | null)?.style.zIndex || 0);
const indice = (pai: Element, filho: Element) => [...pai.children].indexOf(filho);

describe('1. toque nas peças, na Home real', () => {
  it('Fliperama de Canto: o botão existe fora de aria-hidden, com z-index acima do grupo do pet; tocar chama o Salão de jogos', () => {
    const { bgId, slot } = cena('furn-arcade-cab');
    const go = vi.fn();
    const { container } = renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ [slot]: 'furn-arcade-cab' }} onGoToBuilding={go} />);
    const botao = container.querySelector('[data-decor-arcade]') as HTMLElement;
    expect(botao, 'o botão do fliperama tem de existir na Home real').not.toBeNull();
    expect(botao.getAttribute('aria-label')).toBe('Abrir minigames');
    expect(botao.closest('[aria-hidden="true"]'), 'dentro de aria-hidden o leitor de tela não o anuncia').toBeNull();
    const camada = botao.closest('[data-decor-toques]') as HTMLElement;
    const grupoDoPet = container.querySelector('[data-pet-group]') as HTMLElement;
    expect(camada.parentElement).toBe(grupoDoPet.parentElement);
    expect(z(camada)).toBeGreaterThan(z(grupoDoPet));
    expect(camada.className).toContain('pointer-events-none'); // o contêiner nunca captura toque; só o botão
    fireEvent.click(botao);
    expect(go).toHaveBeenCalledWith('jogos.salao');
  });
  it('Espelho Escuro abre o Perfil', () => {
    const { bgId, slot } = cena('furn-el-sombra');
    const go = vi.fn();
    const { container } = renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ [slot]: 'furn-el-sombra' }} onGoToBuilding={go} />);
    const botao = container.querySelector('[data-decor-espelho]') as HTMLElement;
    expect(botao.getAttribute('aria-label')).toBe('Abrir perfil');
    fireEvent.click(botao);
    expect(go).toHaveBeenCalledWith('laboratorio.perfil');
  });
});

describe('2. o cogumelo acende quando a luz se apaga (soneca = a luz do display)', () => {
  const montar = (isSleeping: boolean) => {
    const { bgId, slot } = cena('furn-mushrooms');
    return renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ [slot]: 'furn-mushrooms' }} isSleeping={isSleeping} />).container;
  };
  it('acordado: brilho desligado; dormindo: ligado, e a camada vem DEPOIS do véu da noite e acima dele', () => {
    const dia = montar(false);
    expect(dia.querySelector('[data-decor-brilhos] .sm-decor-brilho')?.hasAttribute('data-on')).toBe(false);
    expect(dia.querySelector('[data-sleep-veil]')).toBeNull();
  });
  it('dormindo', () => {
    const noite = montar(true);
    const brilho = noite.querySelector('[data-decor-brilhos]') as HTMLElement;
    expect(noite.querySelector('[data-decor-brilhos] .sm-decor-brilho')?.hasAttribute('data-on')).toBe(true);
    expect(noite.querySelector('[data-decor-brilhos] .sm-decor-luz-halo')?.hasAttribute('data-on')).toBe(true);
    const veu = noite.querySelector('[data-sleep-veil]') as HTMLElement;
    expect(veu.parentElement).toBe(brilho.parentElement);
    expect(indice(brilho.parentElement!, brilho)).toBeGreaterThan(indice(veu.parentElement!, veu));
  });
});

describe('2b. lanterna e fogueira apagam quando a luz se apaga', () => {
  it.each(['furn-lantern', 'furn-campfire'])('%s: aceso acordado, apagado dormindo', (id) => {
    const { bgId, slot } = cena(id);
    const dia = renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ [slot]: id }} isSleeping={false} />).container;
    expect(dia.querySelector('.sm-decor-luz-halo')?.hasAttribute('data-on')).toBe(true);
    const noite = renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ [slot]: id }} isSleeping />).container;
    const halos = [...noite.querySelectorAll('.sm-decor-luz-halo')];
    expect(halos.length).toBeGreaterThan(0);
    expect(halos.every(h => !h.hasAttribute('data-on'))).toBe(true);
  });
});

describe('3. a parede fica ATRÁS de tudo', () => {
  it('ordem de desenho: a parede é a primeira; nenhum outro espaço a antecede', () => {
    expect(DRAW_ORDER[0]).toBe('wall');
    expect([...DRAW_ORDER].sort()).toEqual([...SLOT_ORDER].sort());
    expect(DECOR_SLOTS.wall).toBeTruthy();
  });
  it('no DOM da Home real, a peça de parede vem antes das de chão e do grupo do pet', () => {
    const wall = ALL_SHOP_ITEMS.find(i => i.kind === 'furniture' && i.slot === 'wall')!;
    const chao = ALL_SHOP_ITEMS.find(i => i.kind === 'furniture' && i.slot === 'floor-right' && i.fits === 'any')!;
    const bgId = Object.keys(PET_BACKGROUNDS).find(k => PET_BACKGROUNDS[k].slots.includes('wall') && PET_BACKGROUNDS[k].slots.includes('floor-right') && decorFitsSetting(wall.fits ?? 'any', PET_BACKGROUNDS[k].setting) && decorFitsSetting(chao.fits ?? 'any', PET_BACKGROUNDS[k].setting))!;
    const { container } = renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ wall: wall.id, 'floor-right': chao.id }} />);
    const caixas = [...container.querySelectorAll('[aria-hidden="true"] > div[title]')];
    const titulos = caixas.map(c => c.getAttribute('title'));
    expect(titulos[0], 'a parede é a primeira peça desenhada').toBe(wall.namePt);
    expect(titulos).toContain(chao.namePt);
  });
});
