// @vitest-environment jsdom
/**
 * As lojinhas do Mercado (minimal-ui F5) — a reescrita dos testes da
 * `ShopModal` (canvas Loja, D-L1…D-L11; WP4.12; WP5.1), que saiu. A INTENÇÃO
 * de cada um continua aqui:
 *  · compra funciona, saldo insuficiente recusa em âmbar (nunca `danger`),
 *    item já possuído vira "Equipar" e não compra de novo;
 *  · moeda certa por aba — saldo e preço sempre na moeda da aba;
 *  · estados por FORMA (travado, equipado), nunca por opacidade;
 *  · o convite passivo vem DEPOIS do que a pessoa veio ver, só para `demo`;
 *  · Conquistas sem coluna de zeros, com a condição em palavras.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet, ConquistasSheet } from './MercadoSheets';
import { SHOP_ITEMS, TOURNAMENT_ITEMS } from '../../utils/shop';
import { MISSIONS } from '../../utils/missions';

const base = {
  language: 'en-US' as const,
  points: 260,
  emblems: 12,
  credits: 32,
  ownedBackgrounds: ['bg-room'] as string[],
  equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[],
  equippedDecor: {},
  missionProgress: {} as Record<string, number>,
  onBuy: () => true,
  onExchangeCredits: async () => true,
  onEquip: () => {},
  onEquipFurniture: () => {},
};

type Props = Parameters<typeof MercadoStallSheet>[0];
const abrir = (props: Partial<Props> & { stall: Props['stall'] }) =>
  renderWithCss(<MercadoStallSheet {...base} {...props} />);

const lockedBg = SHOP_ITEMS.find(i => i.kind === 'bg' && i.unlock)!;
const bitsBg = SHOP_ITEMS.find(i => i.kind === 'bg' && !i.unlock && i.id !== 'bg-room' && !i.currency)!;
const chip = SHOP_ITEMS.find(i => i.kind === 'chip')!;
const emblemFurn = TOURNAMENT_ITEMS.find(i => i.kind === 'furniture')!;

describe('compra', () => {
  it('comprar chama onBuy com o id e anuncia na região viva', () => {
    const onBuy = vi.fn(() => true);
    const { container } = abrir({ stall: 'itens', onBuy });
    fireEvent.click(screen.getByRole('button', { name: `${chip.nameEn} — ${chip.price} Bits` }));
    expect(onBuy).toHaveBeenCalledWith(chip.id);
    expect(container.querySelector('[role="status"]')!.textContent).toBe(`${chip.nameEn} purchased.`);
  });

  it('saldo insuficiente: preço em tinta muted; o toque abre o "como conseguir" (H8) e não tenta comprar; nunca danger', () => {
    const onBuy = vi.fn(() => false);
    const { container } = abrir({ stall: 'background', points: 10, onBuy });
    const card = screen.getByRole('button', { name: `${bitsBg.nameEn} — ${bitsBg.price} Bits` });
    const price = card.querySelector('.sm2-num') as HTMLElement;
    expect(price.style.color).toBe('var(--sm2-muted)');
    expect(price.style.opacity).toBe('');
    act(() => { fireEvent.click(card); });
    expect(onBuy).not.toHaveBeenCalled();
    const modal = screen.getByRole('dialog', { name: 'How to get Bits' });
    // As regras REAIS, lidas das constantes: os minijogos (com o teto diário) e a troca de Créditos.
    expect(modal.querySelector('[data-how-to-earn-way="jogos"]')!.textContent).toContain('150');
    expect(modal.querySelector('[data-how-to-earn-way="creditos"]')!.textContent).toContain('10 Bits per Credit');
    expect(modal.textContent).toContain(`${bitsBg.nameEn} costs ${bitsBg.price} Bits.`);
    expect(container.innerHTML).not.toContain('danger');
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Got it' })); });
    expect(screen.queryByRole('dialog', { name: 'How to get Bits' })).toBeNull();
  });

  it('sem Honra suficiente, o "como conseguir" fala do Torneio (vitória e derrota rendem)', () => {
    abrir({ stall: 'decoracao', emblems: 0 });
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    act(() => { fireEvent.click(screen.getByRole('button', { name: `${emblemFurn.nameEn} — ${emblemFurn.price} Honor` })); });
    const modal = screen.getByRole('dialog', { name: 'How to get Honor' });
    expect(modal.querySelector('[data-how-to-earn-way="torneio"]')!.textContent).toMatch(/3 Honor per win and 1 per match/);
  });

  it('item já possuído não compra de novo: vira Equipar e chama onEquip', () => {
    const onBuy = vi.fn(() => true);
    const onEquip = vi.fn();
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', bitsBg.id], onBuy, onEquip });
    fireEvent.click(screen.getByRole('button', { name: `${bitsBg.nameEn} — Equip` }));
    expect(onBuy).not.toHaveBeenCalled();
    expect(onEquip).toHaveBeenCalledWith(bitsBg.id);
  });

  it('H7: item que a pessoa JÁ TEM (ex.: o sofá ganho) não aparece à venda — mora em "Já são seus", no topo', () => {
    const { container } = abrir({ stall: 'decoracao', ownedFurniture: ['furn-sofa'] });
    const owned = container.querySelector('[data-shop-owned]') as HTMLElement;
    const forSale = container.querySelector('[data-shop-for-sale]') as HTMLElement;
    expect(owned.querySelector('[data-shop-item="furn-sofa"]')).not.toBeNull();
    expect(forSale.querySelector('[data-shop-item="furn-sofa"]')).toBeNull();
    expect(owned.compareDocumentPosition(forSale) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Sem nada na posse, não há seção nem título de "Já são seus".
    const vazio = abrir({ stall: 'itens' });
    expect(vazio.container.querySelector('[data-shop-owned]')).toBeNull();
  });

  it('equipado = anel por fora do vidro + tag na coluna de texto; nome não quebra; nenhuma opacidade', () => {
    const { container } = abrir({ stall: 'background' });
    const card = screen.getByRole('button', { name: 'Bedroom — Equipped' });
    const glass = card.querySelector('[data-mini-glass]') as HTMLElement;
    expect(glass.style.boxShadow).toContain('var(--sm2-primary-ink)');
    const name = Array.from(card.querySelectorAll('span')).find(s => s.textContent === 'Bedroom') as HTMLElement;
    expect(name.style.whiteSpace).toBe('nowrap');
    const fraca = Array.from(container.querySelectorAll<HTMLElement>('[style*="opacity"]'))
      .filter(el => !el.closest('svg') && el.style.opacity !== '' && Number(el.style.opacity) < 1);
    expect(fraca).toEqual([]);
  });

  it('travado = aria-disabled (não disabled nativo), fora do Tab, tracejado, véu no vidro', () => {
    const onBuy = vi.fn(() => true);
    abrir({ stall: 'background', onBuy });
    const card = screen.getByRole('button', { name: new RegExp(`^${lockedBg.nameEn} — locked:`) });
    expect(card.hasAttribute('disabled')).toBe(false);
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.getAttribute('tabindex')).toBe('-1');
    expect(card.style.border).toContain('dashed');
    expect(card.querySelector('.sm2-shop-veil')).not.toBeNull();
    fireEvent.click(card);
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('a arte vive dentro de um mini-visor (nenhum <img> fora do vidro)', () => {
    const { container } = abrir({ stall: 'decoracao' });
    const imgs = Array.from(container.querySelectorAll('img'));
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) expect(img.closest('[data-mini-glass]')).not.toBeNull();
  });
});

describe('moeda certa por aba', () => {
  it('Decoração abre em Bits: saldo "260 Bits" num <p>, mono primary-ink sem ícone, só preços em Bits', () => {
    const { container } = abrir({ stall: 'decoracao' });
    const p = container.querySelector('[data-balance="bits"]') as HTMLElement;
    expect(p.tagName).toBe('P');
    expect(p.textContent).toBe('260Bits');
    const n = p.querySelector('.sm2-num') as HTMLElement;
    expect(n.style.fontFamily).toBe('var(--sm2-font-mono)');
    expect(n.style.color).toBe('var(--sm2-primary-ink)');
    expect(p.querySelector('svg, .sm2-icon')).toBeNull();
    expect(container.querySelector(`[data-shop-item="${emblemFurn.id}"]`)).toBeNull();
    expect(container.querySelector('[data-shop-shelf]')!.textContent).not.toContain('Honor');
  });

  it('a aba de Emblemas troca saldo E preços: serifa gold-ink, e nenhum preço em Bits', () => {
    const { container } = abrir({ stall: 'decoracao' });
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    const bal = container.querySelector('[data-balance="emblems"] .sm2-num') as HTMLElement;
    expect(bal.textContent).toBe('12');
    expect(bal.style.fontFamily).toBe('var(--sm2-font-serif)');
    expect(bal.style.color).toBe('var(--sm2-gold-ink)');
    expect(container.querySelector('[data-balance="bits"]')).toBeNull();
    const card = screen.getByRole('button', { name: `${emblemFurn.nameEn} — ${emblemFurn.price} Honor` });
    expect(card).toBeTruthy();
    expect(container.querySelector('[data-shop-shelf]')!.textContent).not.toContain('Bits');
  });

  it('comprar na aba de Emblemas manda o id do prêmio (a moeda é decidida pelo item, no App)', () => {
    const onBuy = vi.fn(() => true);
    abrir({ stall: 'decoracao', onBuy });
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    fireEvent.click(screen.getByRole('button', { name: `${emblemFurn.nameEn} — ${emblemFurn.price} Honor` }));
    expect(onBuy).toHaveBeenCalledWith(emblemFurn.id);
  });

  it('Itens tem Bits e Créditos, nunca Emblemas; Créditos = diamond credit-ink + a troca', () => {
    const { container } = abrir({ stall: 'itens' });
    expect(screen.queryByRole('tab', { name: 'Honor' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
    expect(container.querySelector('[style*="--sm2-credit-ink"]')).not.toBeNull();
    const swap = screen.getByRole('button', { name: 'Swap 10 Credits for 100 Bits' });
    expect(swap.hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Swap 60 Credits for 600 Bits' }).hasAttribute('disabled')).toBe(true);
    // Nenhum item à venda na aba de Créditos.
    expect(container.querySelector('[data-shop-item]')).toBeNull();
  });
});

describe('convite passivo (WP5.1)', () => {
  const convite = /stays here whenever you want to look/i;
  it('mora na aba de Créditos de Itens, DEPOIS da troca', () => {
    const { container } = abrir({ stall: 'itens', accountTier: 'demo', onUnlock: () => {} });
    expect(screen.queryByText(convite)).toBeNull(); // não na vitrine de Bits
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
    const troca = container.querySelector('[data-credit-exchange]')!;
    const card = screen.getByText(convite);
    expect(troca.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('nunca na aba de Emblemas', () => {
    abrir({ stall: 'decoracao', accountTier: 'demo', onUnlock: () => {} });
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    expect(screen.queryByText(convite)).toBeNull();
  });

  it('quem já pagou não vê; sem onUnlock não há botão que não leva a lugar nenhum', () => {
    const a = abrir({ stall: 'itens', accountTier: 'paid', onUnlock: () => {} });
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
    expect(screen.queryByText(convite)).toBeNull();
    a.unmount();
    abrir({ stall: 'itens', accountTier: 'demo' });
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
    expect(screen.queryByText(convite)).toBeNull();
  });
});

describe('Conquistas — filtro por categoria, sem coluna de zeros (WP4.12)', () => {
  const COM_CONTAGEM = MISSIONS.filter(m => m.target > 1);
  const zerado = Object.fromEntries(MISSIONS.map(m => [m.id, 0]));

  it('AUTOVERIFICAÇÃO: existem missões com alvo maior que 1', () => {
    expect(COM_CONTAGEM.length).toBeGreaterThan(0);
  });

  it('as abas são categorias, e cada uma mostra só as missões dela', () => {
    const { container } = renderWithCss(<ConquistasSheet language="pt-BR" missionProgress={zerado} />);
    for (const tab of screen.getAllByRole('tab')) {
      fireEvent.click(tab);
      const ids = Array.from(container.querySelectorAll('[data-mission]')).map(el => el.getAttribute('data-mission'));
      const cats = new Set(ids.map(id => MISSIONS.find(m => m.id === id)!.category));
      expect(ids.length).toBeGreaterThan(0);
      expect(cats.size).toBe(1);
    }
    // Nenhuma moeda nesta folha: Conquistas não vende.
    expect(container.textContent).not.toMatch(/Bits|Honra|Créditos/);
  });

  it('sem progresso nenhum, nenhum "0/" aparece — e a condição em palavras sim', () => {
    const { container } = renderWithCss(<ConquistasSheet language="pt-BR" missionProgress={zerado} />);
    for (const tab of screen.getAllByRole('tab')) {
      fireEvent.click(tab);
      expect(container.textContent ?? '').not.toContain('0/');
    }
    // A condição em PALAVRAS é o que substitui o número.
    const m = COM_CONTAGEM[0];
    for (const tab of screen.getAllByRole('tab')) {
      fireEvent.click(tab);
      if (container.querySelector(`[data-mission="${m.id}"]`)) break;
    }
    expect(container.querySelector(`[data-mission="${m.id}"]`)!.textContent).toContain(m.descPt);
  });

  it('com progresso real, o número VOLTA', () => {
    const m = COM_CONTAGEM[0];
    const andando = { ...zerado, [m.id]: 1 };
    const { container } = renderWithCss(<ConquistasSheet language="pt-BR" missionProgress={andando} />);
    for (const tab of screen.getAllByRole('tab')) {
      fireEvent.click(tab);
      if (container.querySelector(`[data-mission="${m.id}"]`)) break;
    }
    const li = container.querySelector(`[data-mission="${m.id}"]`)!;
    expect(li.textContent).toContain(`1/${m.target}`);
    expect(li.textContent).toContain(m.descPt);
  });

  it('concluída = anel primary-ink + check, e diz o que liberou', () => {
    const m = MISSIONS[0];
    const { container } = renderWithCss(<ConquistasSheet language="en-US" missionProgress={{ [m.id]: m.target }} />);
    const li = container.querySelector(`[data-mission="${m.id}"]`) as HTMLElement;
    expect(li.getAttribute('data-done')).toBe('true');
    expect(li.style.border).toContain('var(--sm2-primary-ink)');
    expect(li.textContent).toContain('Unlocked');
  });
});

describe('L4 M4: "Do bosque" no TOPO do segmento, antes dos ~20 cenários da loja', () => {
  it('Background: com cenário do Bosque na posse, a seção vem ANTES da prateleira de compra', () => {
    const { container } = abrir({ stall: 'background', ownedBackgrounds: ['bg-room', 'bg-guild-copa'] });
    const daRoda = container.querySelector('[data-guild-owned="bg"]') as HTMLElement;
    expect(daRoda).toBeTruthy();
    const primeiroDaLoja = container.querySelector(`[aria-label*="${bitsBg.nameEn}"]`) as HTMLElement;
    expect(primeiroDaLoja).toBeTruthy();
    expect(daRoda.compareDocumentPosition(primeiroDaLoja) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // e logo abaixo da cabeça fixa (moeda/saldo), não depois do conteúdo
    const stall = container.querySelector('[data-mercado-stall]') as HTMLElement;
    expect(stall.children[1]).toBe(daRoda);
  });

  it('Decoração: a Concha da Maré também vem antes da lista; sem nada na posse, silêncio (nem o título)', () => {
    const { container, unmount } = abrir({ stall: 'decoracao', ownedFurniture: ['trophy-concha-mare'] });
    const stall = container.querySelector('[data-mercado-stall]') as HTMLElement;
    expect(stall.children[1]).toBe(container.querySelector('[data-guild-owned="furniture"]'));
    unmount();
    const vazio = abrir({ stall: 'decoracao' });
    expect(vazio.container.querySelector('[data-guild-owned]')).toBeNull();
  });
});
