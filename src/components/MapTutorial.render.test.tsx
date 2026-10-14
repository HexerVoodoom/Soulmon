// @vitest-environment jsdom
/** O tutorial do mapa na `NpcSequence`: uma fala de abertura (corvo) + uma por área (NPC da área), PT-BR/EN, Pular. */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MapTutorial } from './MapTutorial';
import { MAP_TOUR_STEPS } from '../utils/welcomeTour';

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

describe('MapTutorial', () => {
  it('PT-BR: abre no corvo, passa por TODAS as falas tocando e termina como done, uma vez', () => {
    const onFinish = vi.fn();
    const { container } = render(<MapTutorial language="pt-BR" onFinish={onFinish} />);
    expect(container.textContent).toContain('Este é o mapa');
    expect(container.querySelector('[data-npc-skip]')!.textContent).toBe('Pular');
    for (let i = 0; i < MAP_TOUR_STEPS.length; i++) fireEvent.click(container.querySelector('[data-npc-advance]')!);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('done');
  });
  it('as falas de área listam os prédios e a Masmorra está aberta desde o 1º dia', () => {
    const { container } = render(<MapTutorial language="en-US" onFinish={() => {}} />);
    for (let i = 0; i < MAP_TOUR_STEPS.length - 1; i++) {
      if (container.textContent!.includes('Dungeon')) break;
      fireEvent.click(container.querySelector('[data-npc-advance]')!);
    }
    expect(container.textContent).toContain('open from day one');
    expect(container.textContent).toContain('Dungeon');
  });
  it('Pular encerra a sequência inteira como skip', () => {
    const onFinish = vi.fn();
    const { container } = render(<MapTutorial language="en-US" onFinish={onFinish} />);
    fireEvent.click(container.querySelector('[data-npc-skip]')!);
    expect(onFinish).toHaveBeenCalledWith('skip');
  });
});
