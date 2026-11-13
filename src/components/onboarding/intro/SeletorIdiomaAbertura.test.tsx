// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SeletorIdiomaAbertura } from './SeletorIdiomaAbertura';

afterEach(cleanup);
describe('seletor de idioma antes do opening', () => {
  it('mostra English e Português e devolve a escolha', () => {
    const onEscolher = vi.fn();
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    fireEvent.click(screen.getByText('Português'));
    expect(onEscolher).toHaveBeenCalledWith('pt-BR');
    cleanup(); // uma escolha por montagem (o seletor sai da tela ao escolher)
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    fireEvent.click(screen.getByText('English'));
    expect(onEscolher).toHaveBeenCalledWith('en-US');
  });

  // Bug 13/11/2026: o toque em English não dava resposta visual e a tela só trocava depois de vários toques.
  it('um clique em English basta: o handler dispara uma vez, no primeiro clique', () => {
    const onEscolher = vi.fn();
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onEscolher).toHaveBeenCalledTimes(1);
    expect(onEscolher).toHaveBeenCalledWith('en-US');
  });

  it('alvo de toque >= 48px e estado pressionado já no pointerdown', () => {
    render(<SeletorIdiomaAbertura onEscolher={() => {}} />);
    for (const nome of ['English', 'Português']) {
      const b = screen.getByRole('button', { name: nome });
      expect(parseInt(b.style.minHeight, 10)).toBeGreaterThanOrEqual(48);
      expect(b.className).toContain('sm2-idioma-opcao');
      fireEvent.pointerDown(b);
      expect(b.hasAttribute('data-pressed')).toBe(true);
      fireEvent.pointerUp(b);
      expect(b.hasAttribute('data-pressed')).toBe(false);
    }
  });

  it('nada por cima dos botões: o diálogo é o único filho da camada', () => {
    render(<SeletorIdiomaAbertura onEscolher={() => {}} />);
    const camada = screen.getByTestId('abertura-idioma');
    expect(camada.children).toHaveLength(1);
    expect(camada.firstElementChild?.getAttribute('role')).toBe('dialog');
  });

  /* 2ª rodada (13/11/2026): o `click` de toque some quando o dedo anda além da folga do tap (medido em produção, 4x CPU:
     20 px de arrasto = pointercancel, nenhum click, nenhuma escolha). O toque escolhe no `pointerup`, uma vez só. */
  const caixa = (b: HTMLElement) => vi.spyOn(b, 'getBoundingClientRect').mockReturnValue({ left: 20, right: 370, top: 400, bottom: 450, x: 20, y: 400, width: 350, height: 50, toJSON: () => ({}) } as DOMRect);

  it('toque: escolhe no pointerup dentro do botão, uma vez só (o click sintetizado depois não repete)', () => {
    const onEscolher = vi.fn();
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    const b = screen.getByRole('button', { name: 'English' });
    caixa(b);
    fireEvent.pointerDown(b, { pointerType: 'touch', clientX: 195, clientY: 425 });
    fireEvent.pointerUp(b, { pointerType: 'touch', clientX: 197, clientY: 444 });
    expect(onEscolher).toHaveBeenCalledTimes(1);
    expect(onEscolher).toHaveBeenCalledWith('en-US');
    fireEvent.click(b);
    expect(onEscolher).toHaveBeenCalledTimes(1);
  });

  it('toque solto FORA do botão não escolhe (desistiu)', () => {
    const onEscolher = vi.fn();
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    const b = screen.getByRole('button', { name: 'English' });
    caixa(b);
    fireEvent.pointerUp(b, { pointerType: 'touch', clientX: 195, clientY: 520 });
    expect(onEscolher).not.toHaveBeenCalled();
  });

  it('mouse continua pelo click (pointerup de mouse não escolhe sozinho)', () => {
    const onEscolher = vi.fn();
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    const b = screen.getByRole('button', { name: 'Português' });
    caixa(b);
    fireEvent.pointerUp(b, { pointerType: 'mouse', clientX: 195, clientY: 425 });
    expect(onEscolher).not.toHaveBeenCalled();
    fireEvent.click(b);
    expect(onEscolher).toHaveBeenCalledWith('pt-BR');
  });

  it('o navegador não toma o gesto do botão: touch-action none', () => {
    const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf8');
    expect(css).toMatch(/\.sm2-idioma-opcao \{ touch-action: none; \}/);
  });

  it('o CSS do estado pressionado existe (o tap-highlight do app é transparente)', () => {
    const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf8');
    expect(css).toMatch(/\.sm2-idioma-opcao:active, \.sm2-idioma-opcao\[data-pressed\] \{[^}]*background/);
  });
});

/**
 * A causa raiz do bug: o portão do seletor no App lia o localStorage no render. O `language` nasce 'en-US', então
 * tocar English era `setLanguage('en-US')` sem mudança, o React não re-renderizava e o seletor ficava na tela
 * até um render de outra causa (medido: ~12 s e 3 toques a 4x de CPU). O portão tem que ser estado.
 */
describe('portão do seletor de idioma no App', () => {
  const src = readFileSync(resolve(__dirname, '../../../App.tsx'), 'utf8');
  const i = src.indexOf('<SeletorIdiomaAbertura onEscolher=');
  const portao = src.slice(i - 200, i + 260);

  it('o portão lê estado, não o localStorage no render', () => {
    expect(i).toBeGreaterThan(0);
    expect(portao).toContain('!idiomaEscolhido');
    expect(portao).not.toContain('readLocal(STORAGE_KEYS.LANGUAGE) === null');
  });
  it('escolher marca o estado (re-render garantido mesmo quando o idioma não muda)', () => {
    expect(portao).toContain('setIdiomaEscolhido(true)');
  });
});
