// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { AreaSheet } from './AreaSheet';
import { RESTAURANT_CHEF_ART } from '../../assets/soulmon/npcs';
import { restaurantNpcVoice } from '../../utils/restaurantCopy';
import { chefsOn } from '../../utils/restaurant';

beforeEach(() => { installDomGlobals(); });
afterEach(cleanup);

const base = { areaId: 'mercado' as const, lotId: 'restaurante', language: 'en-US' as const, title: 'Restaurant', closeLabel: 'Close', open: true, onClose: () => {} };

describe('AreaSheet: o Restaurante mostra o chef certo (15/11/2026)', () => {
  it('domingo: os DOIS bustos lado a lado, na ordem Snapjaw, Caldo, e o nome dos dois no balão', () => {
    const chefs = chefsOn(0);
    render(<AreaSheet {...base} npcArt={RESTAURANT_CHEF_ART[chefs[0]]} npcArt2={RESTAURANT_CHEF_ART[chefs[1]]} npcVoice={restaurantNpcVoice(chefs, false)} />);
    const imgs = [...document.querySelectorAll('[data-area-sheet-npc]')] as HTMLImageElement[];
    expect(imgs).toHaveLength(2);
    expect(imgs.map(i => i.getAttribute('src'))).toEqual([RESTAURANT_CHEF_ART.snapjaw, RESTAURANT_CHEF_ART.caldo]);
    expect(document.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Snapjaw & Broth');
  });

  it('terça: só o Caldo, com a fala dele (um busto)', () => {
    const chefs = chefsOn(2);
    render(<AreaSheet {...base} npcArt={RESTAURANT_CHEF_ART[chefs[0]]} npcVoice={restaurantNpcVoice(chefs, false)} />);
    const imgs = [...document.querySelectorAll('[data-area-sheet-npc]')] as HTMLImageElement[];
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('src')).toBe(RESTAURANT_CHEF_ART.caldo);
  });
});
