// @vitest-environment jsdom
/**
 * O MOLDE DE ÁREA (minimal-ui F4) — `AreaScene` + `AreaSheet`, reusado pelas
 * 6 áreas do Mapa. Cobre só o MOLDE (abrir/fechar, NPC visível, min-height,
 * backdrop fecha ao tocar fora, título correto por área) — o conteúdo de
 * cada folha é F5.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { AREAS } from '../../navigation';

const lot = (onOpen: () => void): AreaLot[] => [{
  id: 'exemplo', label: 'Itens', left: '50%', top: '38%', ariaLabel: 'Itens', onOpen,
}];

describe('AreaScene', () => {
  it('desenha o NPC anfitrião da área certa, com a fala dele', () => {
    const { container } = renderWithCss(
      <AreaScene areaId="mercado" language="pt-BR" lots={lot(() => {})} />,
    );
    const npc = container.querySelector('[data-area-npc]')!;
    expect(npc.textContent).toContain('Grom');
    expect(npc.querySelector('img')?.getAttribute('src')).toBeTruthy();
  });

  it('a fala do NPC muda por área e por idioma', () => {
    const arena = renderWithCss(<AreaScene areaId="arena" language="en-US" lots={[]} />);
    expect(arena.container.querySelector('[data-area-npc]')!.textContent).toContain('Vultrak');
    arena.unmount();
    const hallPt = renderWithCss(<AreaScene areaId="hall" language="pt-BR" lots={[]} />);
    expect(hallPt.container.querySelector('[data-area-npc]')!.textContent).toContain('Lumi');
  });

  it('as 6 áreas têm NPC próprio (nenhuma cai no mesmo genérico)', () => {
    const nomes = AREAS.map(id => {
      const r = renderWithCss(<AreaScene areaId={id} language="pt-BR" lots={[]} />);
      const src = r.container.querySelector('[data-area-npc] img')!.getAttribute('src');
      r.unmount();
      return src;
    });
    expect(new Set(nomes).size).toBe(6);
  });

  it('lote de exemplo: toque abre a folha (via callback do lote)', () => {
    const onOpen = vi.fn();
    const { container } = renderWithCss(
      <AreaScene areaId="jogos" language="pt-BR" lots={lot(onOpen)} />,
    );
    fireEvent.click(container.querySelector('[data-area-lot="exemplo"]')!);
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

function Cenario({ open: initialOpen }: { open: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <AreaScene areaId="mercado" language="pt-BR" lots={lot(() => setOpen(true))}>
      <AreaSheet areaId="mercado" title="Itens" closeLabel="Fechar" open={open} onClose={() => setOpen(false)}>
        <p>placeholder</p>
      </AreaSheet>
    </AreaScene>
  );
}

describe('AreaSheet', () => {
  it('fechada por padrão: nem o diálogo nem o NPC-de-cima existem no DOM', () => {
    const { container } = renderWithCss(<Cenario open={false} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[data-area-sheet-npc]')).toBeNull();
  });

  it('aberta: diálogo modal nomeado, min-height 62%, NPC visível acima da folha', () => {
    const { container } = renderWithCss(<Cenario open />);
    const dlg = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg).not.toBeNull();
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-label')).toBe('Itens');
    expect(dlg.style.minHeight).toBe('62%');
    const npc = container.querySelector('[data-area-sheet-npc]');
    expect(npc).not.toBeNull();
    expect(npc!.getAttribute('src')).toBeTruthy();
  });

  it('título correto por área', () => {
    const { container } = renderWithCss(
      <AreaSheet areaId="arena" title="Torneio" closeLabel="Fechar" open onClose={() => {}}>
        <p>x</p>
      </AreaSheet>,
    );
    expect(container.querySelector('[role="dialog"]')!.getAttribute('aria-label')).toBe('Torneio');
  });

  it('backdrop fecha ao tocar fora; tocar dentro da folha não fecha', () => {
    const onClose = vi.fn();
    const { container } = renderWithCss(
      <AreaSheet areaId="mercado" title="Itens" closeLabel="Fechar" open onClose={onClose}>
        <p>conteúdo</p>
      </AreaSheet>,
    );
    fireEvent.click(container.querySelector('[data-area-sheet]')!);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[data-area-sheet-backdrop]')!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Escape fecha, e o botão de fechar tem nome acessível', () => {
    const onClose = vi.fn();
    const { container } = renderWithCss(
      <AreaSheet areaId="mercado" title="Itens" closeLabel="Fechar" open onClose={onClose}>
        <p>conteúdo</p>
      </AreaSheet>,
    );
    const closeBtn = container.querySelector('[data-area-sheet-close]')!;
    expect(closeBtn.getAttribute('aria-label')).toBe('Fechar');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('abrir pelo lote, depois fechar pelo backdrop — ciclo completo', () => {
    const { container } = renderWithCss(<Cenario open={false} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(container.querySelector('[data-area-lot="exemplo"]')!);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-area-sheet-backdrop]')!);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
