// @vitest-environment jsdom
/**
 * Refino de 19/10/2026 (onda 1A) — Mercado: D-24 (abas Backgrounds | Frames, abre em Backgrounds), D-29 (REVOGADO por D-98: sem "For sale"),
 * D-58 (missões da semana no topo da aba Honra) e D-16 (a moldura de loja trancada no Perfil leva ao Mercado > Frames).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet, STALL_KIND_ORDER } from './MercadoSheets';
import { FrameSelector } from '../ui/AvatarFrame';
import { ProfileEditor } from '../perfil/ProfileEditor';
import { OPEN_FRAME_SHOP_EVENT } from '../../utils/frameShopNav';
import { FRAMES } from '../../utils/frames';
import { weeklyMissionsFor } from '../../utils/weeklyMissions';

afterEach(cleanup);

const base = {
  language: 'en-US' as const, points: 2000, emblems: 50, credits: 0,
  ownedBackgrounds: ['bg-room'] as string[], equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[], equippedDecor: {}, missionProgress: {} as Record<string, number>,
  onBuy: () => true, onExchangeCredits: async () => true, onEquip: () => {}, onEquipFurniture: () => {},
};

describe('D-24: a lojinha de Background tem as abas [Backgrounds, Frames], nessa ordem, e abre em Backgrounds', () => {
  it('a ordem declarada é Backgrounds primeiro', () => {
    expect(STALL_KIND_ORDER).toEqual(['backgrounds', 'frames']);
  });
  it('o menu renderiza Backgrounds à esquerda de Frames; a primeira vem selecionada', () => {
    renderWithCss(<MercadoStallSheet {...base} stall="background" />);
    const grupo = screen.getByRole('tablist', { name: 'What Panora sells' });
    const abas = within(grupo).getAllByRole('tab');
    expect(abas.map(t => t.textContent?.trim())).toEqual(['Backgrounds', 'Frames']);
    expect(abas[0].getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-shop-shelf]')).toBeTruthy();
    expect(document.querySelector('[data-frame-shelf]')).toBeNull();
  });
  it('em PT, Backgrounds | Molduras', () => {
    renderWithCss(<MercadoStallSheet {...base} language="pt-BR" stall="background" />);
    const abas = within(screen.getByRole('tablist', { name: 'O que a Panora vende' })).getAllByRole('tab');
    expect(abas.map(t => t.textContent?.trim())).toEqual(['Backgrounds', 'Molduras']);
  });
  it('`initialKind="frames"` (o Perfil leva a Mercado > Frames) abre direto na aba Frames', () => {
    renderWithCss(<MercadoStallSheet {...base} stall="background" initialKind="frames" />);
    expect(document.querySelector('[data-frame-shelf]')).toBeTruthy();
    expect(document.querySelector('[data-shop-shelf]')).toBeNull();
  });
});

describe('REGISTRO §122: sem seção "For sale"/promoção nas lojinhas (a ordem volta ao normal: "Already yours" no topo)', () => {
  it.each([
    ['background', { ownedBackgrounds: ['bg-room'] as string[] }],
    ['decoracao', { ownedFurniture: ['furn-sofa'] as string[] }],
  ] as const)('%s', (stall, own) => {
    const { container } = renderWithCss(<MercadoStallSheet {...base} {...own} stall={stall} />);
    expect(container.querySelector('[data-shop-for-sale]')).toBeNull();
    expect(container.textContent).not.toContain('For sale');
    expect(container.querySelector('[data-shop-owned]')).not.toBeNull();
  });
  it('sem nada na posse, a prateleira não muda (sem seção de posse)', () => {
    const { container } = renderWithCss(<MercadoStallSheet {...base} ownedBackgrounds={[]} stall="background" />);
    expect(container.querySelector('[data-shop-owned]')).toBeNull();
    expect(container.querySelector('[data-shop-for-sale]')).toBeNull();
  });
});

describe('D-58: as missões da semana abrem a aba Honra do Mercado', () => {
  const mission = weeklyMissionsFor('2026-W43');
  const weekly = mission.map(m => ({ mission: m, count: 0, done: false, claimed: false }));
  it('Honra: o bloco das missões vem ANTES da prateleira; Bits: não aparece', () => {
    const { container } = renderWithCss(<MercadoStallSheet {...base} stall="decoracao" weekly={weekly} onClaimWeekly={() => {}} />);
    expect(container.querySelector('[data-mercado-weekly]')).toBeNull(); // abre em Bits
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    const bloco = container.querySelector('[data-mercado-weekly]') as HTMLElement;
    expect(bloco).not.toBeNull();
    expect(bloco.querySelectorAll('[data-weekly-mission]').length).toBe(mission.length);
    const prateleira = container.querySelector('[data-shop-shelf]') as HTMLElement;
    expect(bloco.compareDocumentPosition(prateleira) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Bits' }));
    expect(container.querySelector('[data-mercado-weekly]')).toBeNull();
  });
  it('o Resgatar chama onClaimWeekly; o saldo e o preço continuam em Honra', () => {
    const onClaimWeekly = vi.fn();
    const pronta = [{ mission: mission[0], count: mission[0].target, done: true, claimed: false }];
    renderWithCss(<MercadoStallSheet {...base} stall="background" weekly={pronta} onClaimWeekly={onClaimWeekly} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Claim ${mission[0].emblems} Honor`) }));
    expect(onClaimWeekly).toHaveBeenCalledWith(mission[0].id);
  });
  it('sem `weekly`, a aba Honra não desenha o bloco', () => {
    const { container } = renderWithCss(<MercadoStallSheet {...base} stall="background" />);
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    expect(container.querySelector('[data-mercado-weekly]')).toBeNull();
  });
});

describe('D-16: moldura de loja trancada leva ao Mercado; nada de comprar no Perfil', () => {
  const shopFrame = FRAMES.find(f => f.origin === 'shop')!;
  const ctx = { owned: [] as string[], lifetimeTierId: 'madeira', seatIds: [] as string[] };

  it('FrameSelector com onOpenShop: a linha trancada é um botão que abre a loja e não há "Comprar"', () => {
    const onOpenShop = vi.fn();
    const { container } = renderWithCss(<FrameSelector ctx={ctx as never} equipped={null} onEquip={() => {}} previewSrc="x.png" isPt={false} onOpenShop={onOpenShop} />);
    expect(container.querySelector('[data-frame-buy]')).toBeNull();
    const linha = container.querySelector(`[data-frame-option="${shopFrame.id}"]`) as HTMLElement;
    expect(linha.hasAttribute('data-frame-locked')).toBe(true);
    fireEvent.click(linha);
    expect(onOpenShop).toHaveBeenCalledOnce();
  });

  const editor = (over: Partial<Parameters<typeof ProfileEditor>[0]> = {}) => renderWithCss(
    <ProfileEditor open onClose={() => {}} language="en-US" saveId={'a'.repeat(32)} avatarId={null} equippedFrame={null} ownedFrames={[]}
      petStage="rookie" onChangeAvatar={() => {}} onChangeFrame={() => {}} userName="Lia" onChangeName={() => {}} {...over} />,
  );
  it('ProfileEditor: não desenha botão de compra (D-16: a compra mora no Mercado)', () => {
    editor();
    expect(document.querySelector('[data-frame-buy]')).toBeNull();
  });
  it('ProfileEditor: tocar na moldura trancada dispara onOpenFrameShop; sem a prop, vai pelo evento do App', () => {
    const onOpenFrameShop = vi.fn();
    editor({ onOpenFrameShop });
    fireEvent.click(document.querySelector(`[data-frame-option="${shopFrame.id}"]`)!);
    expect(onOpenFrameShop).toHaveBeenCalledOnce();
    cleanup();
    const ouvinte = vi.fn();
    window.addEventListener(OPEN_FRAME_SHOP_EVENT, ouvinte);
    editor();
    fireEvent.click(document.querySelector(`[data-frame-option="${shopFrame.id}"]`)!);
    window.removeEventListener(OPEN_FRAME_SHOP_EVENT, ouvinte);
    expect(ouvinte).toHaveBeenCalledOnce();
  });
});

describe('D-15: "Name" vira "Nickname" no editor de perfil, com botão Salvar e campo para o nome do Soulmon', () => {
  it('EN: Nickname; PT: Apelido', () => {
    const ed = (language: 'en-US' | 'pt-BR') => renderWithCss(
      <ProfileEditor open onClose={() => {}} language={language} saveId={'a'.repeat(32)} avatarId={null} equippedFrame={null} ownedFrames={[]}
        petStage="rookie" onChangeAvatar={() => {}} onChangeFrame={() => {}} userName="Lia" onChangeName={() => {}} />,
    );
    ed('en-US');
    expect(document.querySelector('label[for="sm-profile-name"]')!.textContent).toBe('Nickname');
    expect(screen.queryByText('Name')).toBeNull();
    cleanup();
    ed('pt-BR');
    expect(document.querySelector('label[for="sm-profile-name"]')!.textContent).toBe('Apelido');
  });

  it('botão Salvar do apelido e campo + botão Salvar do nome do Soulmon salvam ao clicar', async () => {
    const onChangeName = vi.fn();
    const onChangePetName = vi.fn();
    renderWithCss(
      <ProfileEditor open onClose={() => {}} language="pt-BR" saveId={'a'.repeat(32)} avatarId={null} equippedFrame={null} ownedFrames={[]}
        petStage="rookie" onChangeAvatar={() => {}} onChangeFrame={() => {}}
        userName="Lia" onChangeName={onChangeName}
        petName="Pyraka" onChangePetName={onChangePetName} />,
    );
    const nameInput = document.querySelector('#sm-profile-name') as HTMLInputElement;
    const saveNameBtn = document.querySelector('[data-save-user-name]') as HTMLButtonElement;
    expect(saveNameBtn.disabled).toBe(true);
    fireEvent.change(nameInput, { target: { value: '  Mateus  ' } });
    expect(saveNameBtn.disabled).toBe(false);
    fireEvent.click(saveNameBtn);
    // o apelido reserva o nome no servidor antes de gravar (biblioteca: apelido único): grava assim que a reserva responde
    await waitFor(() => expect(onChangeName).toHaveBeenCalledWith('Mateus'));

    const petInput = document.querySelector('#sm-profile-pet-name') as HTMLInputElement;
    const savePetBtn = document.querySelector('[data-save-pet-name]') as HTMLButtonElement;
    expect(document.querySelector('label[for="sm-profile-pet-name"]')!.textContent).toBe('Nome do Soulmon');
    expect(savePetBtn.disabled).toBe(true);
    fireEvent.change(petInput, { target: { value: '  Bito  ' } });
    expect(savePetBtn.disabled).toBe(false);
    fireEvent.click(savePetBtn);
    expect(onChangePetName).toHaveBeenCalledWith('Bito');
  });
});
