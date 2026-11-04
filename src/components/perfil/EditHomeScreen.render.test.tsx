// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { EditHomeScreen } from './EditHomeScreen';
import { decorOptionsForSlot } from '../../utils/editHome';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { ALL_SHOP_ITEMS } from '../../utils/shop';

afterEach(cleanup);

const BG = 'bg-room';
const indoorLeft = ALL_SHOP_ITEMS.filter(i => i.kind === 'furniture' && i.slot === 'floor-left' && i.fits === 'indoor').slice(0, 2);
const outdoorLeft = ALL_SHOP_ITEMS.find(i => i.kind === 'furniture' && i.slot === 'floor-left' && i.fits === 'outdoor');
const rightItem = ALL_SHOP_ITEMS.find(i => i.kind === 'furniture' && i.slot === 'floor-right' && i.fits !== 'outdoor');

function setup(over: Record<string, unknown> = {}) {
  const onSave = vi.fn(); const onClose = vi.fn();
  const props = {
    language: 'pt-BR' as const,
    ownedFurniture: [...indoorLeft.map(i => i.id), ...(outdoorLeft ? [outdoorLeft.id] : []), rightItem!.id],
    equippedDecor: { 'floor-left': indoorLeft[0].id } as Record<string, string>,
    equippedBackground: BG, onSave, onClose, ...over,
  };
  render(<EditHomeScreen {...(props as never)} />);
  return { onSave, onClose };
}
const slot = (id: string) => document.querySelector(`[data-edit-slot="${id}"]`) as HTMLButtonElement;

describe('Editar Home', () => {
  it('cenário de interior oferece espaços; vazio tem ponto, equipado não', () => {
    expect(PET_BACKGROUNDS[BG].setting).toBe('indoor');
    setup();
    expect(slot('floor-left').getAttribute('data-filled')).toBe('true');
    expect(slot('floor-right').getAttribute('data-filled')).toBe('false');
    expect(slot('floor-right').querySelector('[data-edit-dot]')).toBeTruthy();
    expect(slot('floor-left').querySelector('[data-edit-dot]')).toBeNull();
  });

  it('só lista o que a pessoa tem E cabe no espaço/cenário', () => {
    const ids = decorOptionsForSlot('floor-left', BG, [...indoorLeft.map(i => i.id), outdoorLeft!.id, rightItem!.id]).map(i => i.id);
    expect(ids.sort()).toEqual(indoorLeft.map(i => i.id).sort());
    setup();
    fireEvent.click(slot('floor-left'));
    expect(document.querySelector('[data-edit-option="empty"]')).toBeTruthy();
    for (const i of indoorLeft) expect(document.querySelector(`[data-edit-option="${i.id}"]`)).toBeTruthy();
    expect(document.querySelector(`[data-edit-option="${rightItem!.id}"]`)).toBeNull();
    if (outdoorLeft) expect(document.querySelector(`[data-edit-option="${outdoorLeft.id}"]`)).toBeNull();
  });

  it('rascunho: nada vai ao estado até Salvar; Salvar entrega o mapa final', () => {
    const { onSave } = setup();
    fireEvent.click(slot('floor-right'));
    fireEvent.click(document.querySelector(`[data-edit-option="${rightItem!.id}"]`)!);
    expect(onSave).not.toHaveBeenCalled();
    expect(slot('floor-right').getAttribute('data-filled')).toBe('true');
    fireEvent.click(document.querySelector('[data-edit-home-save]')!);
    expect(onSave).toHaveBeenCalledWith({ 'floor-left': indoorLeft[0].id, 'floor-right': rightItem!.id });
  });

  it('Vazio desequipa no rascunho', () => {
    const { onSave } = setup();
    fireEvent.click(slot('floor-left'));
    fireEvent.click(document.querySelector('[data-edit-option="empty"]')!);
    expect(slot('floor-left').getAttribute('data-filled')).toBe('false');
    fireEvent.click(document.querySelector('[data-edit-home-save]')!);
    expect(onSave).toHaveBeenCalledWith({});
  });

  it('Cancelar descarta: fecha sem salvar', () => {
    const { onSave, onClose } = setup();
    fireEvent.click(slot('floor-left'));
    fireEvent.click(document.querySelector('[data-edit-option="empty"]')!);
    fireEvent.click(document.querySelector('[data-edit-home-cancel]')!);
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Salvar fica desligado sem mudança', () => {
    setup();
    expect((document.querySelector('[data-edit-home-save]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('nada possuído: estado vazio aponta para a loja', () => {
    const onOpenShop = vi.fn();
    setup({ ownedFurniture: [], equippedDecor: {}, onOpenShop });
    fireEvent.click(document.querySelector('[data-edit-home-shop]')!);
    expect(onOpenShop).toHaveBeenCalled();
    expect(screen.getByText(/ainda não tem decoração/)).toBeTruthy();
  });
});
