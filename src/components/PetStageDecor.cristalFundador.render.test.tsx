// @vitest-environment jsdom
/** Cristal Fundador: sempre aceso (nunca escurece nem apaga com o pet dormindo) e com fogo em tira de quadros que para em movimento reduzido. */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { decorFitsSetting } from '../utils/petStage';
import { ALL_SHOP_ITEMS, SHOP_ITEMS, TOURNAMENT_ITEMS } from '../utils/shop';

const ID = 'furn-cristal-fundador';
const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
  healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10, useAI: false,
  language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 8,
};
beforeAll(async () => { await import('./home/Mochila'); await import('./ChatBox'); });
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste')))); });
afterEach(() => { vi.unstubAllGlobals(); });

function cena() {
  const item = ALL_SHOP_ITEMS.find(i => i.id === ID)!;
  const bgId = Object.keys(PET_BACKGROUNDS).find(k => PET_BACKGROUNDS[k].slots.includes(item.slot!) && decorFitsSetting(item.fits ?? 'any', PET_BACKGROUNDS[k].setting))!;
  return { bgId, slot: item.slot! };
}
const montar = (isSleeping: boolean) => {
  const { bgId, slot } = cena();
  return renderWithCss(<CompanionHUD {...base} equippedBackground={bgId} equippedDecor={{ [slot]: ID }} isSleeping={isSleeping} />).container;
};

describe('Cristal Fundador', () => {
  it('existe no catálogo, nunca à venda (fora de SHOP_ITEMS e TOURNAMENT_ITEMS), fits any', () => {
    const it_ = ALL_SHOP_ITEMS.find(i => i.id === ID)!;
    expect(it_.kind).toBe('furniture');
    expect(it_.fits).toBe('any');
    expect(it_.namePt).toBe('Cristal Fundador');
    expect(it_.nameEn).toBe('Founder Crystal');
    expect([...SHOP_ITEMS, ...TOURNAMENT_ITEMS].some(i => i.id === ID)).toBe(false);
  });
  it.each([false, true])('isSleeping=%s: halo aceso e a arte nunca escurece', (dorme) => {
    const c = montar(dorme);
    const halos = [...c.querySelectorAll('.sm-decor-luz-halo')];
    expect(halos.length).toBeGreaterThan(0);
    expect(halos.every(h => h.hasAttribute('data-on'))).toBe(true);
    const imgs = [...c.querySelectorAll('[aria-hidden="true"] img')] as HTMLElement[];
    expect(imgs.some(i => /brightness\(\.5\)/.test(i.style.filter))).toBe(false);
  });
  it('dormindo: a camada acima do véu da noite repete a peça acesa, com o fogo', () => {
    const c = montar(true);
    const brilhos = c.querySelector('[data-decor-brilhos]') as HTMLElement;
    const veu = c.querySelector('[data-sleep-veil]') as HTMLElement;
    expect([...brilhos.parentElement!.children].indexOf(brilhos)).toBeGreaterThan([...veu.parentElement!.children].indexOf(veu));
    expect(brilhos.querySelector('.sm-decor-brilho')?.hasAttribute('data-on')).toBe(true);
    expect(brilhos.querySelector('.sm-decor-luz-halo')?.hasAttribute('data-on')).toBe(true);
    expect(brilhos.querySelector('[data-decor-chama]')).not.toBeNull();
  });
  it('a camada de fogo é uma tira de 5 quadros em steps(N-1) e fica parada em movimento reduzido', () => {
    const c = montar(false);
    const f = c.querySelector('[data-decor-chama]') as HTMLElement;
    expect(f.getAttribute('data-quadros')).toBe('5');
    expect(f.style.backgroundSize).toBe('500% 100%');
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.sm-decor-chama\s*\{[^}]*steps\(4, jump-none\)/);
    const reduzido = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('MOVIMENTO REDUZIDO')));
    expect(reduzido.slice(0, reduzido.indexOf('}\n}'))).toMatch(/\.sm-decor-chama,[\s\S]*animation: none !important/);
  });
});
