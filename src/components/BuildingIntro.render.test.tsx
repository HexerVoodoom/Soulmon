// @vitest-environment jsdom
/**
 * A apresentação do prédio novo (14/10/2026): tela cheia com o NPC grande, sem botões "continuar/depois", toque avança,
 * "Pular" no canto superior esquerdo. Vários prédios viram UMA sequência. A fila (um por vez, ao MOSTRAR marca visto) é
 * `utils/presentationQueue.test.ts` + `filaDeAvisos.contract.test.ts`.
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
  it('mostra o NPC (arte + nome) em tela cheia, como diálogo nomeado, sem o bottom sheet', () => {
    const { container } = render(<BuildingIntro ids={['mercado.decoracao']} language="en-US" onFinish={() => {}} />);
    expect(q(container, '[data-area-sheet]')).toBeNull();
    expect(q(container, '[data-npc-art]')!.getAttribute('src')).toBeTruthy();
    expect(q(container, '[data-npc-name]')!.textContent).toBe(buildingIntroView('mercado.decoracao', 'en-US').npcName);
    const dlg = document.querySelector('[role="dialog"]')!;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
  });

  it('três falas por prédio, uma por toque; o toque na última fecha como "done"', () => {
    const onFinish = vi.fn();
    const { container } = render(<BuildingIntro ids={['hall.guilda']} language="pt-BR" onFinish={onFinish} />);
    const v = buildingIntroView('hall.guilda', 'pt-BR');
    for (let i = 0; i < 3; i++) {
      expect(q(container, '[data-npc-sequence]')!.getAttribute('data-step')).toBe(String(i));
      expect(container.textContent).toContain(v.lines[i]);
      expect(onFinish).not.toHaveBeenCalled();
      fireEvent.click(q(container, '[data-npc-advance]')!);
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('done');
  });

  it('vários prédios = UMA sequência (3 falas cada), e "Pular" encerra tudo de uma vez', () => {
    const onFinish = vi.fn();
    const { container } = render(<BuildingIntro ids={['mercado.itens', 'mercado.decoracao', 'arena.duelo']} language="en-US" onFinish={onFinish} />);
    for (let i = 0; i < 4; i++) fireEvent.click(q(container, '[data-npc-advance]')!);
    expect(q(container, '[data-npc-sequence]')!.getAttribute('data-step')).toBe('4'); // já no 2º prédio
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent.click(q(container, '[data-npc-skip]')!);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('skip');
  });

  it('nada fecha sozinho: o tempo passa e nenhuma saída é chamada', () => {
    vi.useFakeTimers();
    const onFinish = vi.fn();
    render(<BuildingIntro ids={['arena.fenda']} language="en-US" onFinish={onFinish} />);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(onFinish).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('é muda e sem recompensa (R-NOVA), sem timer próprio', () => {
    for (const f of ['src/components/BuildingIntro.tsx', 'src/components/NpcSequence.tsx']) {
      const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(src).not.toMatch(/sounds|audioBus|play[A-Z]\w+\(|gamePoints|totalXP|setTimeout|setInterval/);
    }
  });

  it('cada idioma lê o seu texto (EN base, PT-BR par)', () => {
    const en = render(<BuildingIntro ids={['mercado.ferreiro']} language="en-US" onFinish={() => {}} />);
    expect(en.container.textContent).toContain(buildingIntroView('mercado.ferreiro', 'en-US').lines[0]);
    expect(q(en.container, '[data-npc-skip]')!.textContent).toBe('Skip');
    en.unmount();
    const pt = render(<BuildingIntro ids={['mercado.ferreiro']} language="pt-BR" onFinish={() => {}} />);
    expect(pt.container.textContent).toContain(buildingIntroView('mercado.ferreiro', 'pt-BR').lines[0]);
    expect(q(pt.container, '[data-npc-skip]')!.textContent).toBe('Pular');
  });
});
