// @vitest-environment jsdom
/**
 * MODAL FILES (18/11/2026, dono): a pasta da Home refeita como a referência ref3 — moldura e peças aprovadas de `assets/soulmon/ui/files/`,
 * cristal-chama no topo, X redondo à esquerda, título central, "i" no ornamento da moldura, abas finas, grade de slots, e COMIDA como DISQUETE
 * ("esse lance do disquete é só para as comidas"): nome com ".exe" e "×N" embaixo; selecionado = disquete "-sel". Chips, especiais e
 * materiais usam o slot normal com a arte do item.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, screen, within, act, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila, ehDisquete, mochilaTabs } from './Mochila';
import { SPECIAL_ITEMS } from '../../utils/shop';
import { dishKey } from '../../utils/dishItems';

afterEach(cleanup);

const firstOf = (kind: string) => Object.entries(SPECIAL_ITEMS).find(([, v]) => v.kind === kind)?.[0] as string;
const chip = firstOf('chip');
const heart = firstOf('heart');

function abrir(inv: Record<string, number>, language: 'pt-BR' | 'en-US' = 'en-US') {
  return renderWithCss(
    <Mochila open onClose={() => {}} foodInventory={inv} language={language} onUse={() => {}} petTargetRef={{ current: null }} petName="Bito" />,
  );
}

describe('ehDisquete (pura)', () => {
  it('comida, prato e comida premium viram disquete; chip e especiais não', () => {
    expect(ehDisquete('🍎')).toBe(true);
    expect(ehDisquete(dishKey('cha-de-orvalho'))).toBe(true);
    const premium = firstOf('premium');
    if (premium) expect(ehDisquete(premium)).toBe(true);
    expect(ehDisquete(chip)).toBe(false);
    expect(ehDisquete(heart)).toBe(false);
  });
});

describe('modal Files', () => {
  it('casca: moldura Files (ModalFrame) com o cristal no topo, X à esquerda, título e o "i" no ornamento', () => {
    abrir({ '🍎': 2 });
    const dialog = screen.getByRole('dialog', { name: 'Files' });
    expect(dialog.hasAttribute('data-moldura-modal')).toBe(true);
    expect(dialog.className).toContain('sm2-moldura-modal--files');
    const cristal = dialog.querySelector('.sm2-cristal-chama') as HTMLImageElement;
    expect(cristal.getAttribute('src')).toMatch(/cristal-chama/);
    expect(cristal.getAttribute('aria-hidden')).toBe('true');
    expect(within(dialog).getByRole('button', { name: 'Close' }).className).toContain('sm3-files-fechar');
    expect(dialog.querySelector('.sm3-mochila-titulo')!.textContent).toBe('Files');
    const info = dialog.querySelector('[data-moldura-info]') as HTMLElement;
    expect(within(info).getByRole('button', { name: 'How to use an item' })).toBeTruthy();
  });

  it('aba Food: 3 disquetes com "<nome>.exe" e "×N"; chip no slot normal; vazios completam a grade', () => {
    const inv = { '🍎': 2, [dishKey('cha-de-orvalho')]: 1, '☕': 4, [chip]: 1 };
    abrir(inv);
    const itens = [...document.querySelectorAll<HTMLElement>('.sm3-item')];
    expect(itens).toHaveLength(mochilaTabs(inv).comida.length);
    const disquetes = itens.filter(i => i.querySelector('.sm3-item-slot[data-disquete]'));
    expect(disquetes.length).toBe(itens.length - 1);
    for (const d of disquetes) {
      expect(d.querySelector('.sm3-item-nome')!.textContent!.endsWith('.exe')).toBe(true);
      expect(d.querySelector('small')!.textContent).toMatch(/^×\d+$/);
      // a ilustração da comida entra NO rótulo do disquete
      expect(d.querySelector('.sm3-item-slot[data-disquete] .sm3-item-arte')).toBeTruthy();
    }
    const chipEl = itens.find(i => i.getAttribute('data-item') === chip)!;
    expect(chipEl.querySelector('.sm3-item-slot')!.hasAttribute('data-disquete')).toBe(false);
    expect(chipEl.querySelector('.sm3-item-nome')!.textContent!.endsWith('.exe')).toBe(true);
    expect(document.querySelectorAll('[data-slot-vazio]').length).toBe(0);
    expect(screen.getByRole('button', { name: 'Apple.exe × 2' })).toBeTruthy();
  });

  it('selecionado: aria-pressed + data-on (troca para disquete-sel no CSS) e aparece "Use"', () => {
    abrir({ '🍎': 2, '☕': 1 });
    const maca = screen.getByRole('button', { name: 'Apple.exe × 2' });
    fireEvent.click(maca);
    expect(maca.getAttribute('aria-pressed')).toBe('true');
    expect(maca.hasAttribute('data-on')).toBe(true);
    expect(screen.getByRole('button', { name: 'Use Apple.exe' })).toBeTruthy();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.sm3-item\[data-on\] \.sm3-item-slot\[data-disquete\]\s*\{[^}]*files-disquete-sel/);
  });

  it('Specials vazia: texto amigável e nenhum item', () => {
    abrir({ '🍎': 1 });
    fireEvent.click(screen.getByRole('tab', { name: 'Specials' }));
    expect(screen.getByText(/No special items yet/)).toBeTruthy();
    expect(document.querySelector('.sm3-item')).toBeNull();
  });

  it('Specials com item: slot normal (sem disquete, sem .exe)', () => {
    abrir({ [heart]: 2 });
    fireEvent.click(screen.getByRole('tab', { name: 'Specials' }));
    const itens = document.querySelectorAll('.sm3-item');
    expect(itens).toHaveLength(1);
    const el = itens[0];
    expect(el.querySelector('.sm3-item-slot')!.hasAttribute('data-disquete')).toBe(false);
    expect(el.querySelector('.sm3-item-nome')!.textContent!.endsWith('.exe')).toBe(false);
  });

  it('Materials: cada material num slot', async () => {
    abrir({}, 'en-US');
    fireEvent.click(screen.getByRole('tab', { name: 'Materials' }));
    await waitFor(() => expect(document.querySelector('[data-mochila-materiais]')).toBeTruthy(), { timeout: 8000 });
    const btns = document.querySelectorAll('.sm3-material-btn');
    expect(btns.length).toBeGreaterThan(0);
    for (const b of btns) expect(b.querySelector('.sm3-item-slot .sm3-material-icone')).toBeTruthy();
  });

  it('a11y das abas: tablist/tab/tabpanel, foco itinerante e setas/Home/End', () => {
    abrir({ '🍎': 1 });
    const lista = screen.getByRole('tablist');
    const abas = within(lista).getAllByRole('tab');
    expect(abas.map(a => a.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    const painel = screen.getByRole('tabpanel');
    expect(painel.getAttribute('aria-labelledby')).toBe(abas[0].id);
    act(() => abas[0].focus());
    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Specials' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Specials' }));
    fireEvent.keyDown(lista, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Materials' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Food and chips' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(lista, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Materials' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(lista, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Food and chips' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('sm3-aba-comida');
  });

  it('PT: título "Arquivos" e o rótulo das abas traduzido', () => {
    abrir({ '🍎': 1 }, 'pt-BR');
    expect(screen.getByRole('dialog', { name: 'Arquivos' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Comida e chips' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeTruthy();
  });
});
