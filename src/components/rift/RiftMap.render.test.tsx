// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { RiftMap } from './RiftMap';
import { rewindToSet, type RiftMapSave } from '../../utils/riftMap';

afterEach(cleanup);
const SAVE: RiftMapSave = { dungeonDepthRecord: 9 }; // atual = nó 4 (andares 9-10); visitados 0..3

function mount(save: RiftMapSave = SAVE, extra: Partial<Parameters<typeof RiftMap>[0]> = {}) {
  const onRewind = vi.fn();
  const onClose = vi.fn();
  const r = render(<RiftMap language="en-US" save={save} sprite="data:image/png;base64,AAAA" onRewind={onRewind} onClose={onClose} {...extra} />);
  return { ...r, onRewind, onClose };
}
const node = (c: HTMLElement, i: number) => c.querySelector(`[data-rift-node="${i}"]`) as HTMLElement;

describe('RiftMap', () => {
  it('renderiza só uma janela de nós (virtualizado), com o atual presente', () => {
    const { container } = mount();
    const n = container.querySelectorAll('[data-rift-node]').length;
    expect(n).toBeGreaterThan(3);
    expect(n).toBeLessThan(25);
    expect(node(container, 4)).toBeTruthy();
    expect(node(container, 4).dataset.state).toBe('current');
  });

  it('nós não visitados: círculo preto com "?" e rótulo dos andares; visitados mostram o ícone', () => {
    const { container } = mount();
    const locked = node(container, 5);
    expect(locked.dataset.state).toBe('locked');
    expect(locked.querySelector('button')?.textContent).toBe('?');
    expect(node(container, 5).querySelector('[data-rift-node-label]')?.textContent).toBe('11-12');
    expect(node(container, 1).dataset.state).toBe('visited');
    expect(node(container, 1).querySelector('button')?.textContent).not.toBe('?');
    expect(node(container, 1).querySelector('[data-rift-node-label]')?.textContent).toBe('Fire 1 & 2');
    expect(container.querySelector('[data-rift-map-veil]')).toBeTruthy();
  });

  it('o que ainda não foi alcançado é PRETO (não cinza/branco) e a fronteira tem gradiente, sem corte seco', () => {
    const { container } = mount();
    const bg = (container.querySelector('[data-rift-map-veil]') as HTMLElement).style.background;
    expect(bg).toContain('linear-gradient');
    expect(bg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/); // nasce transparente
    expect(bg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.9\)/); // chega ao preto quase opaco
    expect(bg).not.toMatch(/96,\s*100,\s*106/);
  });

  it('o sprite do Soulmon fica AO LADO do nó atual, e só nele', () => {
    const { container } = mount();
    expect(container.querySelectorAll('[data-rift-sprite]')).toHaveLength(1);
    expect(node(container, 4).querySelector('[data-rift-sprite]')).toBeTruthy();
  });

  it('nó "?" mostra aviso calmo e NÃO abre modal; nó atual só avisa', () => {
    const { container, getByRole } = mount();
    fireEvent.click(node(container, 5).querySelector('button') as HTMLElement);
    expect(getByRole('status').textContent).toContain("haven't reached");
    expect(container.ownerDocument.querySelector('[data-rift-ask-yes]')).toBeNull();
    fireEvent.click(node(container, 4).querySelector('button') as HTMLElement);
    expect(getByRole('status').textContent).toContain('You are here');
  });

  it('nó visitado: modal "Voltar para este nó?" → pop-up "Sem volta" → só então chama onRewind', () => {
    const { container, onRewind } = mount();
    fireEvent.click(node(container, 1).querySelector('button') as HTMLElement);
    const doc = container.ownerDocument;
    expect(doc.body.textContent).toContain('Go back to these floors?');
    fireEvent.click(doc.querySelector('[data-rift-ask-no]') as HTMLElement);
    expect(onRewind).not.toHaveBeenCalled();
    fireEvent.click(node(container, 1).querySelector('button') as HTMLElement);
    fireEvent.click(doc.querySelector('[data-rift-ask-yes]') as HTMLElement);
    expect(doc.body.textContent).toContain("can't be undone");
    expect(onRewind).not.toHaveBeenCalled();
    fireEvent.click(doc.querySelector('[data-rift-sure-no]') as HTMLElement);
    expect(onRewind).not.toHaveBeenCalled();
    fireEvent.click(node(container, 1).querySelector('button') as HTMLElement);
    fireEvent.click(doc.querySelector('[data-rift-ask-yes]') as HTMLElement);
    fireEvent.click(doc.querySelector('[data-rift-sure-yes]') as HTMLElement);
    expect(onRewind).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('com descida em andamento, tocar num nó visitado só avisa (não abre o modal)', () => {
    const { container } = mount({ dungeonDepthRecord: 9, dungeonAway: { layer: 9 } });
    fireEvent.click(node(container, 1).querySelector('button') as HTMLElement);
    expect(container.ownerDocument.querySelector('[data-rift-ask-yes]')).toBeNull();
    expect(container.querySelector('[data-rift-map-note]')?.textContent).toContain('out of the Rift');
  });

  it('depois de voltar, o sprite muda para o nó escolhido e o recorde segue', () => {
    const after = rewindToSet(SAVE, 1);
    const { container } = mount(after);
    expect(node(container, 1).dataset.state).toBe('current');
    expect(node(container, 1).querySelector('[data-rift-sprite]')).toBeTruthy();
    expect(after.dungeonDepthRecord).toBe(9);
  });

  it('PT: textos do mapa', () => {
    const { container } = mount(SAVE, { language: 'pt-BR' });
    expect(container.textContent).toContain('Mapa da Fenda');
  });

  it('o voltar do cabeçalho fecha', () => {
    const { container, onClose } = mount();
    fireEvent.click(container.querySelector('[data-rift-map-close]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
