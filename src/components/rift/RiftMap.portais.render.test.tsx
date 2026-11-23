// @vitest-environment jsdom
// Portais e indicador do mapa do Rift (REGISTRO §471).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { RiftMap } from './RiftMap';
import { riftScrollTopFor, type RiftMapSave } from '../../utils/riftMap';

afterEach(cleanup);

function mount(save: RiftMapSave, language: 'en-US' | 'pt-BR' = 'en-US') {
  const onRewind = vi.fn();
  const onTeleport = vi.fn();
  const r = render(<RiftMap language={language} save={save} sprite="data:image/png;base64,AAAA" onRewind={onRewind} onTeleport={onTeleport} onClose={() => {}} />);
  return { ...r, onRewind, onTeleport };
}
const node = (c: HTMLElement, i: number) => c.querySelector(`[data-rift-node="${i}"]`) as HTMLElement;
async function scrollToNode(c: HTMLElement, i: number) {
  const sc = c.querySelector('[data-rift-map-scroll]') as HTMLElement;
  sc.scrollTop = riftScrollTopFor(i, 640);
  await act(async () => { sc.dispatchEvent(new Event('scroll')); await new Promise(r => requestAnimationFrame(() => r(null))); });
}

describe('RiftMap — indicador da descida', () => {
  it('o nó atual mostra "Camada N · <elemento> parte", nos dois idiomas', () => {
    const en = mount({ dungeonDepthRecord: 9, dungeonAway: { layer: 9 } });
    expect(en.container.querySelector('[data-rift-here]')?.textContent).toMatch(/^Layer 9 · .+ 1$/);
    cleanup();
    const pt = mount({ dungeonDepthRecord: 10, dungeonAway: { layer: 10 } }, 'pt-BR');
    expect(pt.container.querySelector('[data-rift-here]')?.textContent).toMatch(/^Camada 10 · .+ 2$/);
    expect(pt.container.querySelectorAll('[data-rift-here]')).toHaveLength(1);
  });
});

describe('RiftMap — portais', () => {
  it('portal ainda não alcançado: aro tracejado, sem brilho, e tocar só avisa', async () => {
    const { container, getByRole, onTeleport } = mount({ dungeonDepthRecord: 20, dungeonResumeLayer: 19 });
    await scrollToNode(container, 24);
    const ring = node(container, 24).querySelector('[data-rift-portal]') as HTMLElement;
    expect(ring.dataset.portalState).toBe('locked');
    expect(ring.hasAttribute('data-rift-portal-glow')).toBe(false);
    fireEvent.click(node(container, 24).querySelector('button') as HTMLElement);
    expect(onTeleport).not.toHaveBeenCalled();
    expect(getByRole('status').textContent).toBeTruthy();
  });

  it('fora de um nó de portal, os portais liberados NÃO brilham', async () => {
    const { container } = mount({ dungeonDepthRecord: 100, dungeonResumeLayer: 51 });
    await scrollToNode(container, 24);
    const ring = node(container, 24).querySelector('[data-rift-portal]') as HTMLElement;
    expect(ring.dataset.portalState).toBe('unlocked');
    expect(ring.hasAttribute('data-rift-portal-glow')).toBe(false);
  });

  it('com o jogador no nó de um portal, todo portal liberado brilha; tocar em outro liberado teletransporta', async () => {
    const { container, onTeleport } = mount({ dungeonDepthRecord: 100, dungeonResumeLayer: 99 }); // no portal 100 (nó 49)
    const here = node(container, 49).querySelector('[data-rift-portal]') as HTMLElement;
    expect(here.hasAttribute('data-rift-portal-glow')).toBe(true);
    expect(here.dataset.portalState).toBe('here');
    await scrollToNode(container, 24);
    const ring = node(container, 24).querySelector('[data-rift-portal]') as HTMLElement;
    expect(ring.hasAttribute('data-rift-portal-glow')).toBe(true);
    fireEvent.click(node(container, 24).querySelector('button') as HTMLElement);
    expect(onTeleport).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('com descida em andamento, tocar no portal só avisa (não teleporta)', async () => {
    const { container, onTeleport, getByRole } = mount({ dungeonDepthRecord: 100, dungeonAway: { layer: 100 } });
    await scrollToNode(container, 24);
    fireEvent.click(node(container, 24).querySelector('button') as HTMLElement);
    expect(onTeleport).not.toHaveBeenCalled();
    expect(getByRole('status').textContent).toContain('Rift');
  });

  it('nó logo abaixo do portal atual: "Descer" aplica direto (sem o "Sem volta")', () => {
    const { container, onRewind } = mount({ dungeonDepthRecord: 150, dungeonResumeLayer: 49 }); // no portal 50 (nó 24)
    const doc = container.ownerDocument;
    fireEvent.click(node(container, 25).querySelector('button') as HTMLElement);
    expect(doc.body.textContent).toContain('Go down to these floors?');
    fireEvent.click(doc.querySelector('[data-rift-ask-yes]') as HTMLElement);
    expect(onRewind).toHaveBeenCalledExactlyOnceWith(25);
    expect(doc.querySelector('[data-rift-sure-yes]')).toBeNull();
  });
});
