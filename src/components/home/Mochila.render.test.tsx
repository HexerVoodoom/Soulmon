// @vitest-environment jsdom
/**
 * A MOCHILA (minimal-ui F2) — o USO de item por ARRASTO até o pet.
 *
 * Decisão 3 do dono (23/09/2026): item se usa arrastando até o pet, não
 * tocando. Três contratos, e cada um é um jeito diferente de gastar item por
 * engano se quebrar:
 *  1. soltar SOBRE o pet usa — chama `onUse` (o `handleFeed` do App) UMA vez;
 *  2. soltar FORA não usa nada;
 *  3. TOCAR sem arrastar não usa — só seleciona.
 * E a alternativa acessível: o item selecionado por foco (teclado) ou toque
 * mostra "Usar"/"Use", que chama o mesmo `onUse`.
 *
 * jsdom não faz layout: a caixa do pet é um `getBoundingClientRect` fixo, e os
 * eventos carregam `clientX/Y` — é o que a mochila lê para decidir.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, within, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila, mochilaTabs, pontoSobre, DRAG_THRESHOLD_PX } from './Mochila';

beforeAll(() => {
  // jsdom não tem PointerEvent: um MouseEvent com `pointerId`/`pointerType`
  // basta para o React e para a mochila (que só lê `clientX/Y`).
  if (typeof window.PointerEvent === 'undefined') {
    class PE extends MouseEvent {
      pointerId: number; pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'touch';
      }
    }
    (window as unknown as { PointerEvent: unknown }).PointerEvent = PE;
    (globalThis as unknown as { PointerEvent: unknown }).PointerEvent = PE;
  }
});

/** O pet ocupa [100..200] × [100..200] na tela. */
function alvoDoPet() {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 100, right: 200, top: 100, bottom: 200, width: 100, height: 100, x: 100, y: 100, toJSON() {} }) as DOMRect;
  document.body.appendChild(el);
  const ref = createRef<HTMLElement>() as { current: HTMLElement | null };
  ref.current = el;
  return ref;
}

function montar(over: Partial<Parameters<typeof Mochila>[0]> = {}) {
  const onUse = vi.fn();
  const onTargetChange = vi.fn();
  const petTargetRef = alvoDoPet();
  const r = renderWithCss(
    <Mochila
      open
      onClose={() => {}}
      foodInventory={{ '🍎': 3, '🦠': 1, '💗': 1 }}
      language="pt-BR"
      onUse={onUse}
      petTargetRef={petTargetRef}
      onTargetChange={onTargetChange}
      petName="Bito"
      {...over}
    />,
  );
  return { ...r, onUse, onTargetChange };
}

/** Arrasta o item de (10, 400) até (x, y) e solta. */
function arrastar(item: HTMLElement, x: number, y: number) {
  fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0, pointerType: 'touch' });
  act(() => {
    fireEvent.pointerMove(document, { clientX: 40, clientY: 350, pointerType: 'touch' });
    fireEvent.pointerMove(document, { clientX: x, clientY: y, pointerType: 'touch' });
  });
  act(() => { fireEvent.pointerUp(document, { clientX: x, clientY: y, pointerType: 'touch' }); });
  // o navegador dispara `click` no item depois do arrasto — não pode virar toque
  fireEvent.click(item);
}

describe('Mochila — usar arrastando até o pet', () => {
  it('SOLTAR SOBRE O PET usa o item, uma vez, pelo `onUse` (a regra é do App)', () => {
    const { onUse } = montar();
    arrastar(screen.getByRole('button', { name: 'Maçã × 3' }), 150, 150);
    expect(onUse).toHaveBeenCalledTimes(1);
    expect(onUse).toHaveBeenCalledWith('🍎');
  });

  it('SOLTAR FORA do pet não usa nada', () => {
    const { onUse } = montar();
    arrastar(screen.getByRole('button', { name: 'Maçã × 3' }), 320, 40);
    expect(onUse).not.toHaveBeenCalled();
  });

  it('a borda do pet tem folga (o dedo cobre o item), mas a folga é pequena', () => {
    const r = { left: 100, right: 200, top: 100, bottom: 200 };
    expect(pontoSobre(95, 150, r)).toBe(true);
    expect(pontoSobre(60, 150, r)).toBe(false);
  });

  it('TOCAR sem arrastar não usa — só seleciona e mostra "Usar"', () => {
    const { onUse } = montar();
    const item = screen.getByRole('button', { name: 'Maçã × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
    // tremida de dedo abaixo do limiar ainda é toque
    fireEvent.pointerMove(document, { clientX: 10 + DRAG_THRESHOLD_PX - 2, clientY: 400 });
    fireEvent.pointerUp(document, { clientX: 12, clientY: 400 });
    fireEvent.click(item);
    expect(onUse).not.toHaveBeenCalled();
    expect(item.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Usar Maçã' })).toBeTruthy();
  });

  it('durante o arrasto a folha desce, o fantasma aparece e o pet acende quando o item está sobre ele', () => {
    const { container, onTargetChange } = montar();
    const item = screen.getByRole('button', { name: 'Maçã × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
    act(() => { fireEvent.pointerMove(document, { clientX: 150, clientY: 150 }); });
    expect(container.ownerDocument.querySelector('.sm3-arrastando')).not.toBeNull();
    expect(container.ownerDocument.querySelector('.sm3-fantasma')).not.toBeNull();
    expect(onTargetChange).toHaveBeenLastCalledWith(true);
    act(() => { fireEvent.pointerMove(document, { clientX: 320, clientY: 40 }); });
    expect(onTargetChange).toHaveBeenLastCalledWith(false);
    act(() => { fireEvent.pointerCancel(document); });
    expect(container.ownerDocument.querySelector('.sm3-fantasma')).toBeNull();
  });

  it('pointercancel (o sistema tomou o gesto) nunca usa o item, mesmo sobre o pet', () => {
    const { onUse } = montar();
    const item = screen.getByRole('button', { name: 'Maçã × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
    act(() => { fireEvent.pointerMove(document, { clientX: 150, clientY: 150 }); });
    act(() => { fireEvent.pointerCancel(document); });
    expect(onUse).not.toHaveBeenCalled();
  });
});

describe('Mochila — a alternativa acessível', () => {
  it('FOCO no item (teclado) mostra "Usar", e "Usar" chama o mesmo `onUse`', () => {
    const { onUse } = montar();
    act(() => { screen.getByRole('button', { name: 'Chip de Poder × 1' }).focus(); });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Chip de Poder' }));
    expect(onUse).toHaveBeenCalledWith('🦠');
  });

  it('par EN: "Use <item>" e a dica de arrastar com o nome do pet', () => {
    const { onUse } = montar({ language: 'en-US' });
    expect(screen.getByText('Drag onto Bito to use')).toBeTruthy();
    act(() => { screen.getByRole('button', { name: 'Apple × 3' }).focus(); });
    fireEvent.click(screen.getByRole('button', { name: 'Use Apple' }));
    expect(onUse).toHaveBeenCalledWith('🍎');
  });

  it('as abas são tabs de verdade (role/aria-selected) e trocam o conteúdo', () => {
    montar();
    const dialog = screen.getByRole('dialog', { name: 'Mochila' });
    const comida = within(dialog).getByRole('tab', { name: 'Comida e chips' });
    const esp = within(dialog).getByRole('tab', { name: 'Especiais' });
    expect(comida.getAttribute('aria-selected')).toBe('true');
    fireEvent.click(esp);
    expect(esp.getAttribute('aria-selected')).toBe('true');
    expect(within(dialog).getByRole('button', { name: /Coraçãozinho × 1/ })).toBeTruthy();
  });
});

describe('Mochila — dados e estados', () => {
  it('mochilaTabs: comida + chips numa aba, coraçãozinho/Glitchtama na outra, e só com estoque', () => {
    const t = mochilaTabs({ '🍎': 2, '💾': 1, '💗': 1, '🌀': 0, '🍕': 5 });
    expect(t.comida.map(([e]) => e)).toEqual(['🍕', '🍎', '💾']);
    expect(t.especiais.map(([e]) => e)).toEqual(['💗']);
  });

  it('MOCHILA VAZIA: cada aba diz o que fazer, em PT e EN', () => {
    const pt = montar({ foodInventory: {} });
    expect(screen.getByText('Nada por aqui. Complete tarefas pra ganhar comida.')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Especiais' }));
    expect(screen.getByText(/Os especiais vêm da masmorra/)).toBeTruthy();
    pt.unmount();
    montar({ foodInventory: {}, language: 'en-US' });
    expect(screen.getByText('Nothing here yet. Complete tasks to earn food.')).toBeTruthy();
  });

  it('fechada, não desenha nada', () => {
    const { container } = montar({ open: false });
    expect(container.querySelector('[data-mochila]')).toBeNull();
  });
});
