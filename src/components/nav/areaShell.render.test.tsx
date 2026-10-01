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
import { NPC_SCALE, NPC_MAX_WIDTH_PCT, NPC_BASE_MAX_WIDTH_PCT } from './npcScale';

const lot = (onOpen: () => void): AreaLot[] => [{
  id: 'exemplo', label: 'Itens', left: '50%', top: '38%', ariaLabel: 'Itens', onOpen,
}];

describe('AreaScene', () => {
  it('fundo full screen: a cena é fixed inset:0 e cobre o viewport', () => {
    const { container } = renderWithCss(<AreaScene areaId="mercado" language="pt-BR" lots={lot(() => {})} />);
    const sc = container.querySelector('[data-area-scene]') as HTMLElement;
    expect(sc.style.position).toBe('fixed');
    expect(sc.style.inset).toMatch(/^0(px)?( 0(px)?){0,3}$/);
    expect(sc.style.overflow).toBe('hidden');
    expect(sc.style.zIndex).toBe('0');
    expect(sc.style.margin).toBe('');
    expect(sc.style.minHeight).toBe('');
  });

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
    // O CARD (a folha em si) tem 2/3 da tela; o diálogo é a moldura que também
    // segura o ✕ e o NPC (H4, 01/10/2026).
    const card = container.querySelector('[data-area-sheet]') as HTMLElement;
    expect(dlg.contains(card)).toBe(true);
    expect(card.style.height).toBe('66.6667dvh');
    // O NPC vive no 1/3 de cima da tela, transparente e FORA do card — e
    // ENCOLHE antes de invadir o card (H3), num plano abaixo dele.
    const npcZone = container.querySelector('[data-area-sheet-npc-zone]') as HTMLElement;
    expect(npcZone).not.toBeNull();
    expect(card.contains(npcZone)).toBe(false);
    expect(npcZone.style.flex).toBe('0 1 33.3333dvh');
    expect(Number(npcZone.style.zIndex)).toBeLessThan(Number(card.style.zIndex));
    // H4: o ✕ fica no canto superior ESQUERDO, acima do NPC, fora do card e
    // dentro do diálogo (o foco preso o alcança).
    const close = container.querySelector('[data-area-sheet-close]') as HTMLElement;
    expect(dlg.contains(close)).toBe(true);
    expect(card.contains(close)).toBe(false);
    expect(close.style.position).toBe('absolute');
    expect(close.style.left).toBe('16px');
    expect(close.compareDocumentPosition(npcZone) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const npc = container.querySelector('[data-area-sheet-npc]');
    expect(npc).not.toBeNull();
    expect(npc!.getAttribute('src')).toBeTruthy();
    // Espaço de balão de fala reservado, com a fala do LOTE: a banca de Itens
    // é da Lamela desde 01/10/2026 (antes herdava o Grom da área).
    const line = container.querySelector('[data-area-sheet-npc-line]')!;
    expect(line.textContent).toContain('Lamela');
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

describe('NPC 1,4x (pedido do dono, 29/09/2026)', () => {
  it('a constante vale 1.4 e o teto de largura é o de antes vezes ela', () => {
    expect(NPC_SCALE).toBe(1.4);
    expect(NPC_BASE_MAX_WIDTH_PCT).toBe(46);
    expect(NPC_MAX_WIDTH_PCT).toBeCloseTo(64.4, 5);
  });
  it('a folha aplica NPC_MAX_WIDTH_PCT no <img> do NPC', () => {
    const { container } = renderWithCss(<Cenario open />);
    const img = container.querySelector('[data-area-sheet-npc]') as HTMLElement;
    expect(img.style.maxWidth).toBe(`${NPC_MAX_WIDTH_PCT}%`);
    expect(img.style.height).toBe('100%');
  });
});
