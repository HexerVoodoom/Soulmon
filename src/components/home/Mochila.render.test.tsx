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
import { screen, fireEvent, within, act, waitFor } from '@testing-library/react';
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
      foodInventory={{ '🍎': 3, '👊': 1, '💗': 1 }}
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
    arrastar(screen.getByRole('button', { name: 'Maçã.exe × 3' }), 150, 150);
    expect(onUse).toHaveBeenCalledTimes(1);
    expect(onUse).toHaveBeenCalledWith('🍎');
  });

  it('SOLTAR FORA do pet não usa nada', () => {
    const { onUse } = montar();
    arrastar(screen.getByRole('button', { name: 'Maçã.exe × 3' }), 320, 40);
    expect(onUse).not.toHaveBeenCalled();
  });

  it('a borda do pet tem folga (o dedo cobre o item), mas a folga é pequena', () => {
    const r = { left: 100, right: 200, top: 100, bottom: 200 };
    expect(pontoSobre(95, 150, r)).toBe(true);
    expect(pontoSobre(60, 150, r)).toBe(false);
  });

  it('TOCAR sem arrastar não usa — só seleciona e mostra "Usar"', () => {
    const { onUse } = montar();
    const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
    // tremida de dedo abaixo do limiar ainda é toque
    fireEvent.pointerMove(document, { clientX: 10 + DRAG_THRESHOLD_PX - 2, clientY: 400 });
    fireEvent.pointerUp(document, { clientX: 12, clientY: 400 });
    fireEvent.click(item);
    expect(onUse).not.toHaveBeenCalled();
    expect(item.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Usar Maçã.exe' })).toBeTruthy();
  });

  it('durante o arrasto a folha desce, o fantasma aparece e o pet acende quando o item está sobre ele', () => {
    const { container, onTargetChange } = montar();
    const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
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
    const item = screen.getByRole('button', { name: 'Maçã.exe × 3' });
    fireEvent.pointerDown(item, { clientX: 10, clientY: 400, button: 0 });
    act(() => { fireEvent.pointerMove(document, { clientX: 150, clientY: 150 }); });
    act(() => { fireEvent.pointerCancel(document); });
    expect(onUse).not.toHaveBeenCalled();
  });
});

describe('Mochila — a alternativa acessível', () => {
  it('FOCO no item (teclado) mostra "Usar", e "Usar" chama o mesmo `onUse`', () => {
    const { onUse } = montar();
    act(() => { screen.getByRole('button', { name: 'Chip de Poder.exe × 1' }).focus(); });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Chip de Poder.exe' }));
    expect(onUse).toHaveBeenCalledWith('👊');
  });

  it('par EN: "Use <item>" e a dica de arrastar com o nome do pet', () => {
    const { onUse } = montar({ language: 'en-US' });
    expect(screen.queryByText('Drag onto Bito to use')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'How to use an item' }));
    expect(screen.getByText('Drag onto Bito to use')).toBeTruthy();
    act(() => { screen.getByRole('button', { name: 'Apple.exe × 3' }).focus(); });
    fireEvent.click(screen.getByRole('button', { name: 'Use Apple.exe' }));
    expect(onUse).toHaveBeenCalledWith('🍎');
  });

  it('as abas são tabs de verdade (role/aria-selected) e trocam o conteúdo', () => {
    montar();
    const dialog = screen.getByRole('dialog', { name: 'Arquivos' });
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
    const t = mochilaTabs({ '🍎': 2, '🎶': 1, '💗': 1, '🌀': 0, '🍕': 5 });
    expect(t.comida.map(([e]) => e)).toEqual(['🍕', '🍎', '🎶']);
    expect(t.especiais.map(([e]) => e)).toEqual(['💗']);
  });

  it('MOCHILA VAZIA: cada aba diz o que fazer, em PT e EN', () => {
    const pt = montar({ foodInventory: {} });
    expect(screen.getByText('Nada por aqui. Complete tarefas pra ganhar comida.')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Especiais' }));
    expect(screen.getByText(/Os especiais vêm da Fenda/)).toBeTruthy();
    pt.unmount();
    montar({ foodInventory: {}, language: 'en-US' });
    expect(screen.getByText('Nothing here yet. Complete tasks to earn food.')).toBeTruthy();
  });

  it('fechada, não desenha nada', () => {
    const { container } = montar({ open: false });
    expect(container.querySelector('[data-mochila]')).toBeNull();
  });
});

/** A seção dos materiais (a aba tem o mesmo nome acessível, então se acha pelo data-attr). */
const secMateriais = async () => {
  await waitFor(() => expect(document.querySelector('[data-mochila-materiais]')).toBeTruthy(), { timeout: 8000 });
  return document.querySelector('[data-mochila-materiais]') as HTMLElement;
};

describe('Mochila - materiais (ingrediente-recurso: aparece SEMPRE, com ×0; toque abre o tooltip de onde conseguir)', () => {
  const abrirMateriais = async (over: Partial<Parameters<typeof Mochila>[0]> = {}) => {
    const r = montar({ language: 'en-US', materials: { spark: 3, gear: 12 }, ...over });
    fireEvent.click(screen.getByRole('tab', { name: 'Materials' }));
    const sec = await secMateriais();
    return { ...r, sec };
  };

  it('lista TODOS os 16 materiais do catálogo, mesmo com ×0, com ícone, nome e quantidade', async () => {
    const { sec } = await abrirMateriais();
    expect(sec.querySelectorAll('[data-material]:not([data-material-extra])')).toHaveLength(16); // + os 3 recursos extras (Fragmento do Soulsmith, de Boss, Essências)
    // ícone: o PNG de `MaterialIcon` (carregado sob demanda) ou, enquanto não chega, o emoji do material
    const icone = within(sec).getByLabelText('Spark × 3').querySelector('.sm3-material-icone')!;
    expect(icone.querySelector('img') !== null || (icone.textContent ?? '').includes('✨')).toBe(true);
    expect(within(sec).getByLabelText('Gear × 12')).toBeTruthy();
    expect(within(sec).getByLabelText('Moss × 0')).toBeTruthy();
  });

  it('sem NENHUM material no save a seção continua inteira (×0) e o vazio dos outros especiais segue', async () => {
    montar({ language: 'en-US', foodInventory: { '🍎': 1 }, materials: {} });
    fireEvent.click(screen.getByRole('tab', { name: 'Materials' }));
    const sec = await secMateriais();
    expect(sec.querySelectorAll('[data-material]:not([data-material-extra])')).toHaveLength(16); // + os 3 recursos extras (Fragmento do Soulsmith, de Boss, Essências)
    expect(within(sec).getByLabelText('Spark × 0')).toBeTruthy();
    // os materiais NÃO moram mais na aba Especiais (C1): lá o vazio dos especiais aparece sem a seção
    fireEvent.click(screen.getByRole('tab', { name: 'Specials' }));
    expect(document.querySelector('[data-mochila-materiais]')).toBeNull();
    expect(document.querySelector('[data-mochila-vazia]')).toBeTruthy();
  });

  it('as outras abas e itens especiais NÃO mudam: comida sem estoque continua fora', () => {
    montar({ foodInventory: { '🍎': 1 }, materials: {} });
    expect(document.querySelector('[data-material]')).toBeNull();
  });

  it('tocar no ícone abre o tooltip (aria-expanded) com ONDE conseguir; tocar de novo, Esc e toque fora fecham', async () => {
    const { sec } = await abrirMateriais();
    const btn = within(sec).getByLabelText('Moss × 0');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const pop = document.querySelector('[data-material-pop="moss"]')!;
    expect(pop.textContent).toMatch(/Found at Refuge, Focus expeditions/);
    expect(pop.textContent).not.toMatch(/corra|hurry|only|acaba/i);
    fireEvent.click(btn);
    expect(document.querySelector('[data-material-pop]')).toBeNull();
    fireEvent.click(btn);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(document.querySelector('[data-material-pop]')).toBeNull();
    expect(document.querySelector('[data-mochila]')).toBeTruthy(); // Esc fechou só o tooltip, não a folha
    fireEvent.click(btn);
    fireEvent.pointerDown(document.body);
    expect(document.querySelector('[data-material-pop]')).toBeNull();
  });

  it('"Go there" chama o callback com o PRÉDIO do material e fecha a mochila', async () => {
    const onGo = vi.fn();
    const onClose = vi.fn();
    const { sec } = await abrirMateriais({ onGoToBuilding: onGo, onClose });
    fireEvent.click(within(sec).getByLabelText('Ore × 0'));
    fireEvent.click(document.querySelector('[data-material-go]')!);
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(onGo).toHaveBeenCalledWith('exploracao.fenda');
    expect(onClose).toHaveBeenCalled();
  });

  it('PT: "Ir lá" e o texto em português', async () => {
    montar({ materials: {}, onGoToBuilding: () => {} });
    fireEvent.click(screen.getByRole('tab', { name: 'Materiais' }));
    fireEvent.click(await screen.findByLabelText('Faísca × 0'));
    expect(document.querySelector('[data-material-go]')!.textContent).toBe('Ir lá');
    expect(document.querySelector('[data-material-where]')!.textContent).toMatch(/^Encontrado em .*Expedições do Foco$/);
  });

  it('demo: prédio social bloqueado não recebe o "Go there" e diz que não está disponível; os liberados seguem', async () => {
    const onGo = vi.fn();
    const { sec } = await abrirMateriais({ demo: true, onGoToBuilding: onGo });
    fireEvent.click(within(sec).getByLabelText('Fang × 0')); // Duelo (arena.duelo) — bloqueado na demo
    expect(document.querySelector('[data-material-go]')).toBeNull();
    expect(document.querySelector('[data-material-demo]')!.textContent).toMatch(/Not available in the demo/);
    fireEvent.click(within(sec).getByLabelText('Ore × 0')); // Masmorra — liberada
    expect(document.querySelector('[data-material-go]')).toBeTruthy();
  });
  it('cabeçalho: Fechar (X), título e "i" na MESMA linha; Fechar tem alvo ≥44 e rótulo, e não existe "Voltar"', () => {
    const onClose = vi.fn();
    montar({ onClose });
    const head = document.querySelector('.sm3-mochila-head') as HTMLElement;
    const fechar = within(head).getByRole('button', { name: 'Fechar' });
    expect(fechar.className).toContain('sm2-ora-back'); // alvo 44×44 (index.css)
    // Moldura da etapa 3: o título é a placa do topo e o "i" o disco do canto (as duas peças do quadro, fora do `head`).
    const dialog = head.closest('[role="dialog"]') as HTMLElement;
    expect(dialog.querySelector('[data-moldura-placa] h2')!.textContent).toBe('Arquivos');
    expect(within(dialog.querySelector('[data-moldura-info]') as HTMLElement).getByLabelText('Como usar um item')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /voltar/i })).toBeNull();
    fireEvent.click(fechar);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Mochila — materiais: para que serve e onde usar (10/11/2026)', () => {
  const abrir = async (over: Partial<Parameters<typeof Mochila>[0]> = {}) => {
    const lang = over.language ?? 'pt-BR';
    montar({ language: lang, materials: { gear: 2 }, ...over });
    fireEvent.click(screen.getByRole('tab', { name: lang === 'pt-BR' ? 'Materiais' : 'Materials' }));
    await secMateriais();
  };
  it('um material com uso mostra o Soulsmith (principal e apoio) e o Restaurante, derivados do código', async () => {
    await abrir();
    fireEvent.click(document.querySelector('[data-material-btn="gear"]')!);
    const usos = [...document.querySelectorAll('[data-material-use]')].map(e => e.textContent).join(' | ');
    expect(usos).toMatch(/^Usar em Soulsmith/);
  }, 60000);
  it('material sem uso hoje diz isso (Cifra), em PT', async () => {
    await abrir();
    fireEvent.click(document.querySelector('[data-material-btn="cipher"]')!);
    expect(document.querySelector('[data-material-no-use]')!.textContent).toBe('Ainda não tem uso: por enquanto só coleciona.');
  }, 60000);
  it('material sem uso hoje diz isso (Cipher), em EN', async () => {
    await abrir({ language: 'en-US' });
    fireEvent.click(document.querySelector('[data-material-btn="cipher"]')!);
    expect(document.querySelector('[data-material-no-use]')!.textContent).toBe('No use yet: for now it is just collected.');
  }, 60000);
  it('os recursos extras aparecem com a quantidade: Fragmento do Soulsmith e Fragmento de Boss; as Essências NÃO ficam na Bolsa', async () => {
    await abrir({ extras: { fragments: 7, bossShards: 2 } });
    const q = (id: string) => document.querySelector(`[data-material="${id}"] small`)!.textContent;
    expect(q('soulsmith-fragment')).toBe('×7');
    expect(q('boss-shard')).toBe('×2');
    expect(document.querySelector('[data-material="essences"]')).toBeNull();
    fireEvent.click(document.querySelector('[data-material-btn="soulsmith-fragment"]')!);
    expect(document.querySelector('[data-material-where]')!.textContent).toBe('Encontrado em Fenda (descer, marcos de profundidade, Rift Sem Fim)');
    expect(document.querySelector('[data-material-use]')!.textContent).toBe('Usar em Soulsmith');
    fireEvent.click(document.querySelector('[data-material-btn="boss-shard"]')!);
    expect(document.querySelector('[data-material-where]')!.textContent).toMatch(/^Encontrado em Elemental Fusion/);
    expect(document.querySelector('[data-material-no-use]')).not.toBeNull();
  }, 60000);
});
