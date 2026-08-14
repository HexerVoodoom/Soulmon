// @vitest-environment jsdom
/**
 * Teste de render do `BottomNav` — a navegação inteira do app é ícone puro,
 * sem rótulo visível. Isso torna o `aria-label` a ÚNICA forma de saber para
 * onde cada botão leva: um rótulo faltando ou só-em-PT não é detalhe estético,
 * é a barra de navegação ficando ilegível para leitor de tela.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('todo botão tem rótulo acessível não vazio', () => {
    const { container } = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    const btns = Array.from(container.querySelectorAll('button'));
    expect(btns.length).toBe(6); // 4 abas + loja + menu
    for (const b of btns) {
      expect(b.getAttribute('aria-label') || '').not.toBe('');
    }
  });

  it('par PT/EN completo na barra — e os dois conjuntos diferem de fato', () => {
    const en = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} />);
    const enLabels = Array.from(en.container.querySelectorAll('button')).map(b => b.getAttribute('aria-label'));
    expect(enLabels).toEqual(['Home', 'Activities', 'Evolution', 'Library', 'Shop', 'Menu']);
    en.unmount();
    const pt = renderWithCss(<BottomNav currentView="main" onNavigate={() => {}} language="pt-BR" />);
    const ptLabels = Array.from(pt.container.querySelectorAll('button')).map(b => b.getAttribute('aria-label'));
    expect(ptLabels).toEqual(['Início', 'Atividades', 'Evolução', 'Biblioteca', 'Loja', 'Menu']);
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

  it('a aba ativa é distinguível no DOM (halo), não só na intenção', () => {
    const { container } = renderWithCss(<BottomNav currentView="evolution" onNavigate={() => {}} />);
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    const glowing = imgs.filter(i => i.style.filter && i.style.filter !== 'none');
    expect(glowing).toHaveLength(1);
    expect(glowing[0].getAttribute('alt')).toBe('Evolution');
  });

  it('nenhuma aba ativa quando a view não é da barra: nada acende falso', () => {
    const { container } = renderWithCss(<BottomNav currentView="oracle" onNavigate={() => {}} />);
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    expect(imgs.filter(i => i.style.filter && i.style.filter !== 'none')).toHaveLength(0);
  });

  it('navegar dispara com a view certa', () => {
    const onNavigate = vi.fn();
    renderWithCss(<BottomNav currentView="main" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Shop' }));
    expect(onNavigate).toHaveBeenCalledWith('shop');
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
