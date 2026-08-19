// @vitest-environment jsdom
/**
 * Teste de render do `BottomNav`.
 *
 * O que este arquivo trava, e por quê:
 *
 * 1. **Teto de 4 destinos + menu** (PLANO-DESIGN §5). A contagem de botões é o
 *    único jeito de impedir que a barra volte a crescer uma célula por vez —
 *    foi assim que ela chegou a 6 sem ninguém decidir. A Biblioteca saiu para
 *    o menu; o caso do menu abaixo garante que ela continua alcançável.
 * 2. **Rótulo visível == rótulo acessível**. Se divergirem, a barra vira
 *    adivinhação para metade dos usuários.
 * 3. **FILL é o estado, e o estado não é só cor**: o item ativo é o único com
 *    o sublinhado, e o único com `aria-current`.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { BottomNav } from './BottomNav';

/** O sublinhado ciano do item ativo (barra inline, não `::after` de classe). */
function underlines(root: ParentNode) {
  return Array.from(root.querySelectorAll('[data-nav-underline]'));
}

describe('BottomNav', () => {
  it('teto de 4 destinos + menu: cinco botões, todos com rótulo acessível', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    const btns = Array.from(container.querySelectorAll('button'));
    expect(btns.length).toBe(5); // Início, Atividades, Evolução, Loja + Menu
    for (const b of btns) {
      expect(b.getAttribute('aria-label') || '').not.toBe('');
    }
  });

  it('par PT/EN completo na barra — e os dois conjuntos diferem de fato', () => {
    const en = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    const enLabels = Array.from(en.container.querySelectorAll('button')).map(b => b.getAttribute('aria-label'));
    expect(enLabels).toEqual(['Home', 'Activities', 'Evolution', 'Shop', 'Menu']);
    en.unmount();
    const pt = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} language="pt-BR" />);
    const ptLabels = Array.from(pt.container.querySelectorAll('button')).map(b => b.getAttribute('aria-label'));
    expect(ptLabels).toEqual(['Início', 'Atividades', 'Evolução', 'Loja', 'Menu']);
  });

  it('a barra tem altura declarada no CSS real (senão o rodapé colapsa)', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    // jsdom não resolve `var()`; então checamos os dois lados da fronteira:
    // a regra usa o token, e o token existe com valor em px ≥ 44.
    const nav = container.querySelector('nav')!;
    expect(window.getComputedStyle(nav).height).toBe('var(--sm-bottomnav-h)');
    const token = window.getComputedStyle(document.documentElement)
      .getPropertyValue('--sm-bottomnav-h').trim();
    expect(token).toMatch(/^\d+(\.\d+)?px$/);
    expect(parseFloat(token)).toBeGreaterThanOrEqual(44);
  });

  it('todo destino mostra o rótulo NA TELA, igual ao rótulo acessível', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} language="pt-BR" />);
    const btns = Array.from(container.querySelectorAll('button'));
    const visiveis = btns.map(b => b.querySelector('.sm-bottom-nav-label')?.textContent ?? '');
    expect(visiveis).toEqual(['Início', 'Atividades', 'Evolução', 'Loja', 'Menu']);
    expect(visiveis).toEqual(btns.map(b => b.getAttribute('aria-label')));
  });

  it('o rótulo é Rubik ≥12px — Silkscreen a 8px reprovava legibilidade', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    const label = container.querySelector('.sm-bottom-nav-label') as HTMLElement;
    expect(label.style.fontFamily).toBe('var(--sm2-font-text)');
    expect(label.style.fontSize).toBe('var(--sm2-text-xs)');
    const xs = window.getComputedStyle(document.documentElement)
      .getPropertyValue('--sm2-text-xs').trim();
    expect(parseFloat(xs)).toBeGreaterThanOrEqual(12);
  });

  it('ÍCONE NUNCA DENTRO DE BOX: nada de PNG, nada de moldura em volta do glifo', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    expect(container.querySelectorAll('img')).toHaveLength(0);
    const icons = Array.from(container.querySelectorAll('.sm2-icon')) as HTMLElement[];
    expect(icons.length).toBe(5);
    for (const i of icons) {
      expect(i.style.background).toBe('');
      expect(i.style.border).toBe('');
      // o ícone é decorativo: o rótulo ao lado já diz o nome
      expect(i.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('o eixo FILL é o estado: ativo preenche (1), inativo não (0)', () => {
    const { container } = renderWithCss(<BottomNav currentView="evolution" onNavigate={() => {}} />);
    const icons = Array.from(container.querySelectorAll('.sm2-icon')) as HTMLElement[];
    const fills = icons.map(i => i.style.getPropertyValue('--sm2-icon-fill'));
    expect(fills).toEqual(['0', '0', '1', '0', '0']);
    // e o preenchido é o que carrega o tom de destaque
    expect(icons[2].className).toContain('sm2-icon-primary');
    expect(icons[0].className).toContain('sm2-icon-muted');
  });

  it('a seleção também carrega em FORMA: um sublinhado só na fileira', () => {
    const { container } = renderWithCss(<BottomNav currentView="evolution" onNavigate={() => {}} />);
    const bars = underlines(container);
    expect(bars).toHaveLength(1);
    expect((bars[0] as HTMLElement).style.background).toBe('var(--sm2-primary-fill)');
    expect((bars[0] as HTMLElement).style.height).toBe('3px');
    const ativo = bars[0].parentElement!;
    expect(ativo.getAttribute('aria-label')).toBe('Evolution');
    expect(ativo.getAttribute('aria-current')).toBe('page');
  });

  it('a Loja é DESTINO (navega para uma view), então recebe aria-current', () => {
    const { container } = renderWithCss(<BottomNav currentView="shop" onNavigate={() => {}} />);
    const loja = screen.getByRole('button', { name: 'Shop' });
    expect(loja.getAttribute('aria-current')).toBe('page');
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('o Menu é AÇÃO, não destino: nunca recebe aria-current', () => {
    const { container } = renderWithCss(<BottomNav currentView="settings" onNavigate={() => {}} />);
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu.getAttribute('aria-current')).toBeNull();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    // Configurações mora no menu: o menu acende, e nenhuma aba finge ser a página
    expect(underlines(container)).toHaveLength(1);
  });

  it('nenhuma aba ativa quando a view não é da barra: nada acende falso', () => {
    const { container } = renderWithCss(<BottomNav currentView="oracle" onNavigate={() => {}} />);
    expect(underlines(container)).toHaveLength(0);
    const fills = Array.from(container.querySelectorAll('.sm2-icon'))
      .map(i => (i as HTMLElement).style.getPropertyValue('--sm2-icon-fill'));
    expect(fills.every(f => f === '0')).toBe(true);
  });

  it('navegar dispara com a view certa', () => {
    const onNavigate = vi.fn();
    renderWithCss(<BottomNav currentView="main" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Shop' }));
    expect(onNavigate).toHaveBeenCalledWith('shop');
  });

  it('a Biblioteca saiu da barra mas NÃO do app: mora no menu e navega', () => {
    const onNavigate = vi.fn();
    renderWithCss(<BottomNav currentView="main" onNavigate={onNavigate} />);
    expect(screen.queryByRole('button', { name: 'Library' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Library' }));
    expect(onNavigate).toHaveBeenCalledWith('library');
  });

  it('o menu abre, mostra as ações e o backdrop fecha (saída de emergência)', () => {
    const onOpenCredits = vi.fn();
    const { container } = renderWithCss(
      <BottomNav currentView="main" onNavigate={() => {}} onOpenCredits={onOpenCredits} onResetOnboarding={() => {}} />,
    );
    expect(screen.queryByText('Settings')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Credits')).toBeTruthy();
    expect(screen.getByText('Redo the ritual')).toBeTruthy();
    // backdrop = a div fixa inset:0 logo antes do popover
    const backdrop = Array.from(container.querySelectorAll('div')).find(
      d => d.style.position === 'fixed' && d.style.inset === '0px',
    )!;
    fireEvent.click(backdrop);
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('Escape fecha o menu (teclado tem a mesma saída que o toque)', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByText('Settings')).toBeTruthy();
    fireEvent.keyDown(container.querySelector('nav')!, { key: 'Escape' });
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('sem handlers opcionais o menu não oferece ação morta', () => {
    renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.queryByText('Credits')).toBeNull();
    expect(screen.queryByText('Redo the ritual')).toBeNull();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('escolher Configurações fecha o menu e navega', () => {
    const onNavigate = vi.fn();
    renderWithCss(<BottomNav currentView="main" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByText('Settings'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
    expect(screen.queryByText('Settings')).toBeNull();
  });
});
