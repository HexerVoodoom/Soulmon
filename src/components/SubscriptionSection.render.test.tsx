// @vitest-environment jsdom
/**
 * A assinatura cosmética NA TELA (D10): divulgação pré-compra, "Gerenciar
 * assinatura" e a vitrine "Do trimestre" — PT e EN, voz do app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

vi.mock('../utils/playBilling', () => ({
  isBillingAvailable: vi.fn(() => true),
  getSubscriptionOffer: vi.fn(async () => ({ price: 'R$ 9,90', period: 'P3M' })),
  purchaseSubscription: vi.fn(),
  useStoreOpen: vi.fn(() => true),
  billingDisabledMessage: (isPt: boolean) => (isPt ? 'A lojinha está fechada por um tempinho' : 'The shop is closed for a little while'),
}));

import { isBillingAvailable, getSubscriptionOffer, purchaseSubscription, useStoreOpen } from '../utils/playBilling';
import { SubscriptionSection } from './SubscriptionSection';
import { MercadoStallSheet } from './mercado/MercadoSheets';
import { SUBSCRIPTION_ITEMS } from '../utils/shop';
import { _resetSubscriptionStatus, setSubscriptionFromEntitlement } from '../utils/subscription';

beforeEach(() => {
  _resetSubscriptionStatus();
  vi.mocked(isBillingAvailable).mockReturnValue(true);
  vi.mocked(getSubscriptionOffer).mockResolvedValue({ price: 'R$ 9,90', period: 'P3M' });
  vi.mocked(purchaseSubscription).mockReset();
  vi.mocked(useStoreOpen).mockReturnValue(true);
});

describe('kill-switch BILLING_DISABLED na tela da assinatura', () => {
  it('loja fechada: o "Assinar" SOME, a mensagem amigável aparece e "Gerenciar" continua', async () => {
    vi.mocked(useStoreOpen).mockReturnValue(false);
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    await waitFor(() => expect(document.querySelector('[data-subscription-closed]')).toBeTruthy());
    expect(document.querySelector('[data-subscription-closed]')!.textContent).toMatch(/lojinha está fechada/);
    expect(document.querySelector('[data-subscription-subscribe]')).toBeNull();
    expect(document.querySelector('[data-subscription-manage]')).toBeTruthy();
  });
});

describe('Configurações — SubscriptionSection', () => {
  it('PT: mostra a divulgação pré-compra com o preço da Play e o botão de assinar', async () => {
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    await waitFor(() => expect(document.querySelector('[data-subscription-disclosure]')).toBeTruthy());
    const t = document.querySelector('[data-subscription-disclosure]')!.textContent!;
    expect(t).toContain('R$ 9,90 a cada 3 meses');
    expect(t).toMatch(/renova sozinha/);
    expect(t).toMatch(/cancelar/i);
    expect(screen.getByRole('button', { name: 'Assinar por R$ 9,90' })).toBeTruthy();
  });

  it('EN: price, every 3 months, renews automatically, how to cancel', async () => {
    vi.mocked(getSubscriptionOffer).mockResolvedValue({ price: '$1.99', period: 'P3M' });
    renderWithCss(<SubscriptionSection language="en-US" />);
    await waitFor(() => expect(document.querySelector('[data-subscription-disclosure]')).toBeTruthy());
    const t = document.querySelector('[data-subscription-disclosure]')!.textContent!;
    expect(t).toContain('$1.99 every 3 months');
    expect(t).toMatch(/renews automatically/);
    expect(screen.getByRole('button', { name: 'Subscribe for $1.99' })).toBeTruthy();
  });

  it('"Gerenciar assinatura" abre a Central de assinaturas da Play no SKU certo', async () => {
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    const a = (await screen.findByRole('link', { name: 'Gerenciar assinatura' })) as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('https://play.google.com/store/account/subscriptions?sku=soulmon_cosmetic_quarterly&package=com.soulmon');
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('EN: "Manage subscription"', async () => {
    renderWithCss(<SubscriptionSection language="en-US" />);
    expect(await screen.findByRole('link', { name: 'Manage subscription' })).toBeTruthy();
  });

  it('sem preço da Play (produto ainda não existe no Console): NÃO oferece a compra e não inventa preço', async () => {
    vi.mocked(getSubscriptionOffer).mockResolvedValue(null);
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    await waitFor(() => expect(screen.getByText(/não está disponível agora/)).toBeTruthy());
    expect(document.querySelector('[data-subscription-subscribe]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/9,90/);
  });

  it('na web: diz que é do app Android, sem botão de assinar nem de gerenciar', () => {
    vi.mocked(isBillingAvailable).mockReturnValue(false);
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    expect(screen.getByText(/disponível no app Android/)).toBeTruthy();
    expect(document.querySelector('[data-subscription-subscribe]')).toBeNull();
    expect(document.querySelector('[data-subscription-manage]')).toBeNull();
  });

  it('assinatura ativa: mostra o período, esconde o "Assinar" e mantém "Gerenciar"', async () => {
    setSubscriptionFromEntitlement({ subActive: true, subUntil: Date.UTC(2027, 0, 15) });
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    expect(document.querySelector('[data-subscription-status="active"]')?.textContent).toMatch(/Assinatura ativa/);
    expect(document.querySelector('[data-subscription-subscribe]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Gerenciar assinatura' })).toBeTruthy();
  });

  it('vencida: diz que o resgatado continua seu e volta a oferecer, sem culpa', async () => {
    setSubscriptionFromEntitlement({ subActive: false, subUntil: Date.UTC(2026, 5, 1) });
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    expect(document.querySelector('[data-subscription-status="ended"]')?.textContent).toMatch(/continua seu/);
    await waitFor(() => expect(document.querySelector('[data-subscription-subscribe]')).toBeTruthy());
  });

  it('assinar com sucesso abre a vitrine (store) e avisa onde está', async () => {
    vi.mocked(purchaseSubscription).mockResolvedValue({ ok: true, ent: { tier: 'demo', credits: 0, adsLeft: 3, admin: false, subActive: true, subUntil: Date.now() + 1e9 } });
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Assinar por R$ 9,90' }));
    await waitFor(() => expect(screen.getByText(/O conjunto do trimestre está em Cenários e Decoração/)).toBeTruthy());
    expect(purchaseSubscription).toHaveBeenCalledWith('soulmon_cosmetic_quarterly');
  });

  it('fechar a janela da Play é silêncio; pendente e erro têm texto próprio', async () => {
    vi.mocked(purchaseSubscription).mockResolvedValue({ ok: false, reason: 'cancelled' });
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Assinar por R$ 9,90' }));
    await waitFor(() => expect(purchaseSubscription).toHaveBeenCalledTimes(1));
    expect(document.querySelector('p[aria-live]')?.textContent).toBe('');

    vi.mocked(purchaseSubscription).mockResolvedValue({ ok: false, reason: 'pending' });
    fireEvent.click(screen.getByRole('button', { name: 'Assinar por R$ 9,90' }));
    await waitFor(() => expect(screen.getByText(/Pagamento em análise/)).toBeTruthy());
  });

  it('nada de trial nem de pressão na tela', async () => {
    renderWithCss(<SubscriptionSection language="pt-BR" />);
    await waitFor(() => expect(document.querySelector('[data-subscription-disclosure]')).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/gr[aá]tis|teste|trial|só hoje|última chance/i);
  });
});

const base = {
  language: 'pt-BR' as const, points: 0, emblems: 0, credits: 0,
  ownedBackgrounds: ['bg-room'] as string[], equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[], equippedDecor: {} as Record<string, string>,
  missionProgress: {} as Record<string, number>,
  onBuy: () => true, onExchangeCredits: async () => true, onEquip: () => {}, onEquipFurniture: () => {},
};
type Props = Parameters<typeof MercadoStallSheet>[0];
const abrir = (props: Partial<Props> & { stall: Props['stall'] }) => renderWithCss(<MercadoStallSheet {...base} {...props} />);
const shelf = (kind: 'bg' | 'furniture') => document.querySelector(`[data-subscription-shelf="${kind}"]`) as HTMLElement | null;

describe('Mercado — a vitrine "Do trimestre"', () => {
  const bgItem = SUBSCRIPTION_ITEMS.find(i => i.kind === 'bg')!;
  const furn = SUBSCRIPTION_ITEMS.find(i => i.kind === 'furniture')!;

  it('sem assinatura: o item APARECE escurecido e diz o porquê — nunca some em silêncio', () => {
    abrir({ stall: 'background' });
    const s = shelf('bg')!;
    expect(within(s).getByRole('heading', { name: 'Do trimestre' })).toBeTruthy();
    const row = s.querySelector(`[data-subscription-item="${bgItem.id}"]`)!;
    expect(row.getAttribute('data-state')).toBe('locked');
    expect(row.getAttribute('role')).toBe('group');
    expect(row.getAttribute('aria-label')).toMatch(/bloqueado/);
    expect(row.textContent).toMatch(/Faz parte da assinatura do trimestre/);
    expect(within(s).queryByRole('button', { name: /Resgatar/ })).toBeNull();
  });

  it('EN: locked explanation', () => {
    abrir({ stall: 'background', language: 'en-US' });
    expect(shelf('bg')!.textContent).toMatch(/Part of the quarterly subscription/);
  });

  it('com assinatura: "Resgatar" chama o resgate com o id — sem preço, sem Bits', () => {
    const onClaimSubscription = vi.fn(() => true);
    abrir({ stall: 'background', subscriptionActive: true, onClaimSubscription });
    const s = shelf('bg')!;
    const btn = within(s).getByRole('button', { name: new RegExp(`${bgItem.namePt} — Resgatar`) });
    fireEvent.click(btn);
    expect(onClaimSubscription).toHaveBeenCalledWith(bgItem.id);
    expect(s.textContent).not.toMatch(/Bits|Honra/);
  });

  it('já resgatado: vira "Equipar" e CONTINUA assim sem assinatura (posse permanente)', () => {
    const onEquip = vi.fn();
    abrir({ stall: 'background', subscriptionActive: false, ownedBackgrounds: ['bg-room', bgItem.id], onEquip });
    const s = shelf('bg')!;
    const btn = within(s).getByRole('button', { name: new RegExp(`${bgItem.namePt} — Equipar`) });
    expect(s.querySelector(`[data-subscription-item="${bgItem.id}"]`)!.getAttribute('data-state')).toBe('owned');
    fireEvent.click(btn);
    expect(onEquip).toHaveBeenCalledWith(bgItem.id);
  });

  it('decoração: a vitrine existe na loja de Decoração e equipa no espaço do item', () => {
    const onEquipFurniture = vi.fn();
    abrir({ stall: 'decoracao', ownedFurniture: [furn.id], onEquipFurniture });
    const s = shelf('furniture')!;
    fireEvent.click(within(s).getByRole('button', { name: new RegExp(`${furn.namePt} — Equipar`) }));
    expect(onEquipFurniture).toHaveBeenCalledWith(furn.id, furn.slot);
  });

  it('a vitrine da assinatura não aparece na aba de Emblemas nem na de Créditos', () => {
    abrir({ stall: 'background', subscriptionActive: true });
    expect(shelf('bg')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Honra' }));
    expect(shelf('bg')).toBeNull();
  });
});
