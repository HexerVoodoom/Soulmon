// @vitest-environment jsdom
/** ONBOARDING_VELADO cena 0/1: ritual conduzido pelo ancião (D1) e BB do berço sem API (D18). Desligado = Ambra atual. */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { ROTEIRO } from './onboarding/sequencia/copy';

const h = vi.hoisted(() => ({ on: false }));
vi.mock('./onboarding/sequencia/flag', () => ({
  get ONBOARDING_VELADO() { return h.on; },
  onboardingVeladoLigado: () => h.on,
}));

const btn = (n: string) => screen.getByRole('button', { name: n }) as HTMLButtonElement;
function ateAApresentacao() {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
}

describe('ritual conduzido pelo ancião', () => {
  beforeEach(() => { installFakeStorage(); localStorage.setItem('soulmon-language', 'en-US'); });

  it('flag ligado: a apresentação é do ancião, com as falas do copy, e o nome tem o Soulmon dele ao lado', () => {
    h.on = true;
    ateAApresentacao();
    const seq = document.querySelector('[data-npc-sequence]')!;
    expect(seq).toBeTruthy();
    expect(seq.textContent).toContain(ROTEIRO.c0[0].en);
    expect(seq.textContent).not.toMatch(/Ambra/);
    fireEvent.click(seq.querySelector('[data-npc-advance]')!);
    fireEvent.click(document.querySelector('[data-npc-sequence] [data-npc-advance]')!);
    expect(screen.getByText('What should we call you?')).toBeTruthy();
    expect(document.querySelector('[data-anciao-npc]')).toBeTruthy();
    expect(document.querySelector('[data-soulmon-anciao]')).toBeTruthy();
    expect(document.querySelector('[data-onboarding-npc]')).toBeNull();
  });

  it('flag desligado: o oráculo/Ambra atual, sem ancião', () => {
    h.on = false;
    ateAApresentacao();
    const seq = document.querySelector('[data-npc-sequence]')!;
    expect(seq.textContent).toMatch(/Ambra/);
    expect(seq.textContent).not.toContain(ROTEIRO.c0[0].en);
    fireEvent.click(seq.querySelector('[data-npc-advance]')!);
    expect(document.querySelector('[data-onboarding-npc]')).toBeTruthy();
    expect(document.querySelector('[data-anciao-npc]')).toBeNull();
  });
});
