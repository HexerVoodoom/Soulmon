// @vitest-environment jsdom
/**
 * "DA SUA RODA" (fatia B2, risco 1 da B1): o que a Guilda deu e não se compra precisa ser
 * EQUIPÁVEL — os `bg-guild-*` em `ownedBackgrounds` e a Concha da Maré em `ownedFurniture` ficavam
 * invisíveis porque a vitrine só lista o catálogo. Sem isto, `guild.marco.cenario` ("Está entre os
 * seus cenários") prometia o que a tela não entregava.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet } from './MercadoSheets';
import { GUILD_COPY, guildText } from '../../utils/guildCopy';
import { ALL_SHOP_ITEMS, GUILD_ITEMS, SHOP_ITEMS, TOURNAMENT_ITEMS, isGuildReward } from '../../utils/shop';
import { stallItems, tournamentShopItems, MERCADO_STALLS, STALL_CURRENCIES } from '../../utils/mercadoCatalog';
import { shopBuyRefusal, applyShopBuy } from '../../utils/shopBuy';
import { isShopItemUnlocked } from '../../utils/missions';
import { DECOR_ART } from '../../utils/decorArt';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { RAID_TROPHY_ID, GROVE_STAGES } from '../../utils/guildRules';

const base = {
  language: 'pt-BR' as const, points: 999, emblems: 999, credits: 0,
  ownedBackgrounds: ['bg-room'] as string[], equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[], equippedDecor: {} as Record<string, string>,
  missionProgress: {} as Record<string, number>,
  onBuy: () => true, onExchangeCredits: async () => true, onEquip: () => {}, onEquipFurniture: () => {},
};
type Props = Parameters<typeof MercadoStallSheet>[0];
const abrir = (props: Partial<Props> & { stall: Props['stall'] }) => renderWithCss(<MercadoStallSheet {...base} {...props} />);
const secao = (kind: 'bg' | 'furniture') => document.querySelector(`[data-guild-owned="${kind}"]`) as HTMLElement | null;

describe('cenários da roda: aparecem e equipam, sem preço', () => {
  it('só os possuídos aparecem, com o nome do estágio; a seção tem o título "Do bosque"', () => {
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', 'bg-guild-clareira', 'bg-guild-ramagem'] });
    const s = secao('bg')!;
    expect(within(s).getByRole('heading', { name: guildText('pt-BR', 'guild.cenarios.titulo') })).toBeTruthy();
    expect(s.querySelectorAll('[data-guild-owned-item]')).toHaveLength(2);
    expect(within(s).getByText('Clareira')).toBeTruthy();
    expect(within(s).getByText('Ramagem')).toBeTruthy();
    expect(within(s).queryByText('Copa')).toBeNull();
  });

  it('`guild.marco.cenario` é VERDADEIRA: o estágio que a cerimônia anuncia está na tela para equipar', () => {
    const frase = guildText('pt-BR', 'guild.marco.cenario', { estagio: 'Ramagem' });
    expect(frase).toContain('Já está em Background');
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', 'bg-guild-ramagem'] });
    expect(within(secao('bg')!).getByRole('button', { name: /Ramagem — Equipar/ })).toBeTruthy();
  });

  it('EN: título e "Equip"', () => {
    abrir({ stall: 'background', language: 'en-US', ownedBackgrounds: ['bg-room', 'bg-guild-copa'] });
    const s = secao('bg')!;
    expect(within(s).getByRole('heading', { name: GUILD_COPY['guild.cenarios.titulo'][1] })).toBeTruthy();
    expect(within(s).getByRole('button', { name: 'Canopy — Equip' })).toBeTruthy();
  });

  it('tocar equipa (onEquip com o id) e, equipado, tocar de novo desequipa (null)', () => {
    const onEquip = vi.fn();
    const r = abrir({ stall: 'background', ownedBackgrounds: ['bg-room', 'bg-guild-mata'], onEquip });
    fireEvent.click(within(secao('bg')!).getByRole('button', { name: /Mata — Equipar/ }));
    expect(onEquip).toHaveBeenLastCalledWith('bg-guild-mata');
    r.unmount();
    const onEquip2 = vi.fn();
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', 'bg-guild-mata'], equippedBackground: 'bg-guild-mata', onEquip: onEquip2 });
    const b = within(secao('bg')!).getByRole('button', { name: /Mata — Equipado/ });
    expect(b.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(b);
    expect(onEquip2).toHaveBeenLastCalledWith(null);
  });

  it('sem preço, sem "comprar", sem cadeado, sem contagem do que falta: a seção só tem o nome e o equipar', () => {
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', ...GROVE_STAGES.map(s => `bg-guild-${s}`)] });
    const s = secao('bg')!;
    expect(s.querySelectorAll('[data-guild-owned-item]')).toHaveLength(GROVE_STAGES.length);
    expect(s.textContent).not.toMatch(/Bits|Emblem|Cr[ée]ditos|Credits|comprar|buy|bloquead|locked|faltam?|\d/i);
    expect(s.querySelector('.sm2-num')).toBeNull();
  });

  it('nenhum cenário da roda: nem a seção nem o título (vazio é silêncio)', () => {
    abrir({ stall: 'background' });
    expect(secao('bg')).toBeNull();
    expect(document.body.textContent).not.toContain(guildText('pt-BR', 'guild.cenarios.titulo'));
  });

  it('id desconhecido em `ownedBackgrounds` (dado velho) não desenha nada', () => {
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', 'bg-guild-floresta-do-mal'] });
    expect(secao('bg')).toBeNull();
  });

  it('a Loja de Itens (chips) e a aba de Créditos não desenham a seção', () => {
    abrir({ stall: 'itens', ownedBackgrounds: ['bg-room', 'bg-guild-copa'] });
    expect(secao('bg')).toBeNull();
    expect(secao('furniture')).toBeNull();
  });

  it('os cenários existem em PET_BACKGROUNDS (o equipar tem o que desenhar)', () => {
    for (const s of GROVE_STAGES) expect(PET_BACKGROUNDS[`bg-guild-${s}`], s).toBeTruthy();
  });
});

describe('Concha da Maré: conquista, nunca compra', () => {
  it('possuída, aparece na Decoração, equipa no espaço `trophy` e desequipa', () => {
    const onEquipFurniture = vi.fn();
    const r = abrir({ stall: 'decoracao', ownedFurniture: [RAID_TROPHY_ID], onEquipFurniture });
    fireEvent.click(within(secao('furniture')!).getByRole('button', { name: /Concha da Maré — Equipar/ }));
    expect(onEquipFurniture).toHaveBeenLastCalledWith(RAID_TROPHY_ID, 'trophy');
    r.unmount();
    const off = vi.fn();
    abrir({ stall: 'decoracao', ownedFurniture: [RAID_TROPHY_ID], equippedDecor: { trophy: RAID_TROPHY_ID }, onEquipFurniture: off });
    fireEvent.click(within(secao('furniture')!).getByRole('button', { name: /Concha da Maré — Equipado/ }));
    expect(off).toHaveBeenLastCalledWith(null, 'trophy');
  });

  it('não possuída: não aparece em NENHUMA vitrine (nem com Emblemas de sobra)', () => {
    abrir({ stall: 'decoracao' });
    expect(document.body.textContent).not.toContain('Concha da Maré');
    for (const stall of MERCADO_STALLS) for (const c of STALL_CURRENCIES[stall]) {
      expect(stallItems(stall, c).map(i => i.id)).not.toContain(RAID_TROPHY_ID);
    }
    expect(tournamentShopItems().map(i => i.id)).not.toContain(RAID_TROPHY_ID);
    expect(SHOP_ITEMS.map(i => i.id)).not.toContain(RAID_TROPHY_ID);
    expect(TOURNAMENT_ITEMS.map(i => i.id)).not.toContain(RAID_TROPHY_ID);
  });

  it('catálogo: existe, é decoração do slot `trophy`, sem preço, travada por missão inexistente e com arte', () => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === RAID_TROPHY_ID)!;
    expect(item).toBeTruthy();
    expect(GUILD_ITEMS).toContain(item);
    expect(isGuildReward(item)).toBe(true);
    expect(item).toMatchObject({ kind: 'furniture', slot: 'trophy', fits: 'any', price: 0 });
    expect(item.currency).toBeUndefined();
    expect(item.unlock?.kind).toBe('mission');
    expect(item.nameEn).toBe('Tide shell');
    expect(DECOR_ART[RAID_TROPHY_ID]).toMatch(/trophy-concha-mare/); // arte real da rodada 3 (era o placeholder em SVG)
    // paleta do Visor: nada de magenta/roxo/rosa no placeholder
    expect(decodeURIComponent(DECOR_ART[RAID_TROPHY_ID])).not.toMatch(/#(?:f0f|ff00ff|8b5cf6|a855f7|ec4899|d946ef)/i);
  });

  it('NÃO é vendável por caminho nenhum: destravada de mentira, sem saldo ou com saldo, a compra é recusada', () => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === RAID_TROPHY_ID)!;
    expect(isShopItemUnlocked(item, {})).toBe(false);
    expect(isShopItemUnlocked(item, { [item.unlock!.missionId]: 999 })).toBe(false);
    const rico = { gamePoints: 9999, emblems: 9999, foodInventory: {}, ownedFurniture: [] as string[] };
    expect(shopBuyRefusal(rico, item)).toBe('not-for-sale');
    const r = applyShopBuy(rico, item);
    expect(r.refused).toBe('not-for-sale');
    expect(r.state).toBe(rico);
  });

  it('a compra de item comum continua funcionando (a trava é só da conquista)', () => {
    const chip = SHOP_ITEMS.find(i => i.kind === 'chip')!;
    expect(shopBuyRefusal({ gamePoints: chip.price, foodInventory: {} }, chip)).toBeUndefined();
  });
});
