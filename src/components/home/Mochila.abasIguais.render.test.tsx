// @vitest-environment jsdom
/** Files: as três abas têm o MESMO layout (altura fixa, sem ramo por aba) e arrastar não muda o sheet por aba. */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, screen, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila } from './Mochila';
import { SPECIAL_ITEMS } from '../../utils/shop';

afterEach(cleanup);
const heart = Object.entries(SPECIAL_ITEMS).find(([, v]) => v.kind === 'heart')?.[0] as string;

function abrir() {
  return renderWithCss(
    <Mochila open onClose={() => {}} foodInventory={{ '🍎': 2, [heart]: 1 }} language="en-US" onUse={() => {}} petTargetRef={{ current: null }} petName="Bito" />,
  );
}

describe('Files: abas iguais', () => {
  it('a classe do modal e do painel é idêntica nas 3 abas', () => {
    abrir();
    const sig = () => {
      const d = screen.getByRole('dialog', { name: 'Files' });
      return `${d.className}|${(d.querySelector('[role=tabpanel]') as HTMLElement).className}`;
    };
    const comida = sig();
    for (const nome of ['Specials', 'Materials']) {
      fireEvent.click(screen.getByRole('tab', { name: new RegExp(nome, 'i') }));
      expect(sig()).toBe(comida);
    }
  });

  it('arrastar em Specials aplica o mesmo estado que em Food (sem ramo por aba)', () => {
    abrir();
    const estado = () => {
      const item = document.querySelector<HTMLElement>('.sm3-item')!;
      fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
      act(() => { fireEvent.pointerMove(document, { clientX: 150, clientY: 150 }); });
      const c = document.querySelector('[data-mochila]')!.className;
      act(() => { fireEvent.pointerCancel(document); });
      return c;
    };
    const comida = estado();
    fireEvent.click(screen.getByRole('tab', { name: /Specials/i }));
    expect(estado()).toBe(comida);
  });

  it('CSS: altura fixa no modal Files e nenhuma regra de layout condicionada à aba', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.sm3-mochila\.sm3-files \{[^}]*\bheight: 72vh/);
    expect(css).not.toMatch(/sm3-(files|mochila)[^{]*(data-aba|aria-controls="sm3-painel|#sm3-painel)/);
  });
});
