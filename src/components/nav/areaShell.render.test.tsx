// @vitest-environment jsdom
/**
 * O MOLDE DE ÁREA (minimal-ui F4) — `AreaScene` + `AreaSheet`, reusado pelas
 * 6 áreas do Mapa. Cobre só o MOLDE (abrir/fechar, NPC por SUB-LOJA, altura
 * 2/3, backdrop fecha ao tocar fora, título correto por área) — o conteúdo
 * de cada folha é F5.
 *
 * ⚠️ Desde 28/09/2026 (decisão do dono) não existe mais NPC anfitrião fixo
 * na `AreaScene` — o NPC vive só dentro da `AreaSheet` aberta, um por lote
 * (`lotId`), nunca um único "da área inteira".
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';

const lot = (onOpen: () => void): AreaLot[] => [{
  id: 'exemplo', label: 'Itens', left: '50%', top: '38%', ariaLabel: 'Itens', onOpen,
}];

describe('AreaScene', () => {
  it('não desenha NPC nenhum fora de uma folha aberta (o anfitrião fixo saiu)', () => {
    const { container } = renderWithCss(
      <AreaScene areaId="mercado" language="pt-BR" lots={lot(() => {})} />,
    );
    expect(container.querySelector('[data-area-sheet-npc]')).toBeNull();
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
      <AreaSheet areaId="mercado" lotId="itens" language="pt-BR" title="Itens" closeLabel="Fechar" open={open} onClose={() => setOpen(false)}>
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

  it('aberta: diálogo modal nomeado, altura fixa em 2/3 da tela, NPC do LOTE FORA do card (1/3 de cima), com fala', () => {
    const { container } = renderWithCss(<Cenario open />);
    const dlg = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg).not.toBeNull();
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-label')).toBe('Itens');
    expect(dlg.style.height).toBe('66.6667dvh');
    // O NPC vive no 1/3 de cima da tela, transparente e FORA do card.
    const npcZone = container.querySelector('[data-area-sheet-npc-zone]') as HTMLElement;
    expect(npcZone).not.toBeNull();
    expect(dlg.contains(npcZone)).toBe(false);
    expect(npcZone.style.flex).toBe('0 0 33.3333dvh');
    const npc = container.querySelector('[data-area-sheet-npc]');
    expect(npc).not.toBeNull();
    expect(npc!.getAttribute('src')).toBeTruthy();
    // Espaço de balão de fala reservado, com a fala da área (Grom no Mercado).
    const line = container.querySelector('[data-area-sheet-npc-line]')!;
    expect(line.textContent).toContain('Grom');
  });

  it('o NPC muda por SUB-LOJA dentro da mesma área (não é mais um único anfitrião)', () => {
    const itens = renderWithCss(
      <AreaSheet areaId="mercado" lotId="itens" language="pt-BR" title="Itens" closeLabel="Fechar" open onClose={() => {}}>
        <p>x</p>
      </AreaSheet>,
    );
    const srcItens = itens.container.querySelector('[data-area-sheet-npc]')!.getAttribute('src');
    itens.unmount();
    const decoracao = renderWithCss(
      <AreaSheet areaId="mercado" lotId="decoracao" language="pt-BR" title="Decoração" closeLabel="Fechar" open onClose={() => {}}>
        <p>x</p>
      </AreaSheet>,
    );
    const srcDecoracao = decoracao.container.querySelector('[data-area-sheet-npc]')!.getAttribute('src');
    decoracao.unmount();
    expect(srcItens).toBeTruthy();
    expect(srcDecoracao).toBeTruthy();
    expect(srcItens).not.toBe(srcDecoracao);
  });

  it('sub-loja sem NPC próprio cai no placeholder (nunca quebra)', () => {
    const { container } = renderWithCss(
      <AreaSheet areaId="mercado" lotId="conquistas" language="pt-BR" title="Conquistas" closeLabel="Fechar" open onClose={() => {}}>
        <p>x</p>
      </AreaSheet>,
    );
    expect(container.querySelector('[data-area-sheet-npc]')!.getAttribute('src')).toBeTruthy();
  });

  it('título correto por área', () => {
    const { container } = renderWithCss(
      <AreaSheet areaId="arena" lotId="torneio" language="pt-BR" title="Torneio" closeLabel="Fechar" open onClose={() => {}}>
        <p>x</p>
      </AreaSheet>,
    );
    expect(container.querySelector('[role="dialog"]')!.getAttribute('aria-label')).toBe('Torneio');
  });

  it('backdrop fecha ao tocar fora; tocar dentro da folha não fecha', () => {
    const onClose = vi.fn();
    const { container } = renderWithCss(
      <AreaSheet areaId="mercado" lotId="itens" language="pt-BR" title="Itens" closeLabel="Fechar" open onClose={onClose}>
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
      <AreaSheet areaId="mercado" lotId="itens" language="pt-BR" title="Itens" closeLabel="Fechar" open onClose={onClose}>
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
