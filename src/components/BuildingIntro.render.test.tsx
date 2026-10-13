// @vitest-environment jsdom
/**
 * A apresentação do prédio novo: o NPC aparece com nome e busto, fala três balões (um por toque), "Ir lá" e "Depois"
 * são saídas por gesto, Escape é "Depois", e nada fecha sozinho. A fila (um por vez) e o encaixe no App são guard de
 * fonte em `filaDeAvisos.contract.test.ts`.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { BuildingIntro } from './BuildingIntro';
import { buildingIntroView } from '../utils/buildingIntroCopy';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const q = (c: HTMLElement, sel: string) => c.querySelector(sel) as HTMLElement | null;

describe('BuildingIntro', () => {
  it('mostra o prédio, o NPC (busto + nome) e é um diálogo nomeado pelo prédio', () => {
    const { container } = render(<BuildingIntro id="mercado.decoracao" language="en-US" onGo={() => {}} onLater={() => {}} />);
    const v = buildingIntroView('mercado.decoracao', 'en-US');
    // 7.1: é o MESMO bottom sheet dos prédios/mercado (`AreaSheet`), não mais um diálogo central.
    expect(q(container, '[data-area-sheet]')).not.toBeNull();
    expect(q(container, '[data-area-sheet-head] h2')!.textContent).toBe(v.place);
    expect(q(container, '[data-area-sheet-npc]')!.getAttribute('src')).toBeTruthy();
    expect(q(container, '[data-area-sheet-npc]')!.getAttribute('alt')).toBe('');
    expect(container.textContent).toContain('Lasca, the carpenter');
    const dlg = document.querySelector('[role="dialog"]')!;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-label')).toBe(v.place);
  });

  it('três balões, um por toque em "Próximo"; só no último aparece "Ir lá"', () => {
    const onGo = vi.fn();
    const { container } = render(<BuildingIntro id="hall.guilda" language="pt-BR" onGo={onGo} onLater={() => {}} />);
    const passos: string[] = [];
    for (let i = 0; i < 3; i++) {
      passos.push(q(container, '[data-building-intro]')!.getAttribute('data-step')!);
      if (i < 2) {
        expect(q(container, '[data-bi-go]')).toBeNull();
        expect(q(container, '[data-bi-next]')!.textContent).toBe('Próximo');
        fireEvent.click(q(container, '[data-bi-next]')!);
      }
    }
    expect(passos).toEqual(['0', '1', '2']);
    expect(q(container, '[data-bi-next]')).toBeNull();
    expect(onGo).not.toHaveBeenCalled();
    const go = q(container, '[data-bi-go]')!;
    expect(go.textContent).toBe('Ir lá');
    fireEvent.click(go);
    expect(onGo).toHaveBeenCalledWith('hall.guilda');
  });

  it('"Depois" está em TODO passo, e Escape faz o mesmo', () => {
    for (let k = 0; k < 3; k++) {
      const onLater = vi.fn();
      const { container, unmount } = render(<BuildingIntro id="arena.duelo" language="en-US" onGo={() => {}} onLater={onLater} />);
      for (let j = 0; j < k; j++) fireEvent.click(q(container, '[data-bi-next]')!);
      const later = q(container, '[data-bi-later]')!;
      expect(later.textContent).toBe('Later');
      fireEvent.click(later);
      expect(onLater).toHaveBeenCalledWith('arena.duelo');
      unmount();
    }
    const onLater = vi.fn();
    render(<BuildingIntro id="arena.duelo" language="en-US" onGo={() => {}} onLater={onLater} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it('nada fecha sozinho: o tempo passa e nenhuma saída é chamada', () => {
    vi.useFakeTimers();
    const onGo = vi.fn(); const onLater = vi.fn();
    render(<BuildingIntro id="exploracao.masmorra" language="en-US" onGo={onGo} onLater={onLater} />);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(onGo).not.toHaveBeenCalled();
    expect(onLater).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('é muda e sem recompensa (R-NOVA), sem timer próprio; movimento reduzido reduz a entrada e mantém a pausa', () => {
    const src = readFileSync('src/components/BuildingIntro.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src).not.toMatch(/sounds|audioBus|play[A-Z]\w+\(|gamePoints|totalXP|setTimeout|setInterval/);
    const css = readFileSync('src/index.css', 'utf8');
    const bloco = css.slice(css.indexOf('prefers-reduced-motion: reduce'));
    expect(bloco).toContain('.sm-npc-intro { animation: none !important; }');
  });

  it('cada idioma lê o seu texto (EN base, PT-BR par)', () => {
    const en = render(<BuildingIntro id="mercado.ferreiro" language="en-US" onGo={() => {}} onLater={() => {}} />);
    expect(q(en.container, '[data-bi-kicker]')!.textContent).toBe('A new place on the Map');
    en.unmount();
    const pt = render(<BuildingIntro id="mercado.ferreiro" language="pt-BR" onGo={() => {}} onLater={() => {}} />);
    expect(q(pt.container, '[data-bi-kicker]')!.textContent).toBe('Um lugar novo no Mapa');
  });
});
