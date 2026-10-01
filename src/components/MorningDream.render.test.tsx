// @vitest-environment jsdom
/**
 * F2 — o sonho dá o item (decisão do dono, 01/10/2026). Quando a cena tem
 * decoração gêmea, a tela diz que ela veio junto e o "Equipar" aparece
 * SEMPRE; sem gêmeo, não há botão nem linha de decoração.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MorningDream } from './MorningDream';
import { DREAM_CATALOG } from '../utils/restWindow';

const couch = DREAM_CATALOG.find(d => d.id === 'dream-old-couch')!;

describe('MorningDream — Equipar (F2)', () => {
  it('cena com gêmeo: linha da decoração + Equipar que equipa', () => {
    const onEquip = vi.fn();
    render(
      <MorningDream open dream={couch} isNew={false} language="pt-BR" onClose={() => {}}
        decor={{ namePt: 'Sofá Pixel', nameEn: 'Pixel Sofa' }} onEquip={onEquip} />,
    );
    expect(screen.getByText(/decoração Sofá Pixel/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(onEquip).toHaveBeenCalledTimes(1);
  });

  it('cena sem gêmeo: sem Equipar e sem linha de decoração', () => {
    const outro = DREAM_CATALOG.find(d => d.id !== 'dream-old-couch')!;
    const { container } = render(
      <MorningDream open dream={outro} isNew language="en-US" onClose={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: 'Equip' })).toBeNull();
    expect(container.querySelector('[data-dream-decor]')).toBeNull();
  });
});
