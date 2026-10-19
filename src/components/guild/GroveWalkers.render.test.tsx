/** @vitest-environment jsdom */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GroveWalkers } from './GroveWalkers';
import { GroveCena } from './GroveCena';
import { GUILD_COPY } from '../../utils/guildCopy';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const membros = (n: number, euEm = 0) => Array.from({ length: n }, (_, i) => ({ id: `id-${String(i).padStart(2, '0')}-abcdef`, name: `Nome${i}`, euMesmo: i === euEm }));
const sizes = { own: 52, other: 40 };
const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
const fonte = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

function montar(n: number, reducedMotion = false, language: 'pt-BR' | 'en-US' = 'pt-BR') {
  return render(<GroveWalkers language={language} guild={{ members: membros(n) } as never} mySprite="/eu.png" reducedMotion={reducedMotion} sizes={sizes} baseY={70} />);
}
const sprites = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLImageElement>('[data-grove-creature]'));

describe('GroveWalkers: teto de 12 sprites (D-51/S-10)', () => {
  it.each([1, 4, 5, 12])('%i membros = %i sprites', n => {
    expect(sprites(montar(n).container)).toHaveLength(n);
  });
  it('nunca passa de 12, mesmo com 20 na vista', () => {
    expect(sprites(montar(20).container)).toHaveLength(12);
  });
  it('cada sprite é um botão com nome acessível, e o nome NÃO fica na tela antes do toque (K-13)', () => {
    const { container } = montar(5);
    expect(container.querySelectorAll('button.sm2-grove-walker-btn')).toHaveLength(5);
    expect(container.querySelector('[data-grove-nome]')).toBeNull();
    expect(container.querySelector('[data-grove-fala]')).toBeNull();
    expect(container.textContent).toBe('');
  });
});

describe('contorno e bounce', () => {
  it('todo sprite leva o atributo e a classe do contorno, e o CSS tem 4 drop-shadow (1 px) para ele', () => {
    const c = sprites(montar(6).container);
    for (const img of c) {
      expect(img.hasAttribute('data-grove-outline')).toBe(true);
      expect(img.className).toContain('sm2-grove-walker-img');
      expect(img.className).toContain('sm2-grove-bob'); // o bounce/squash que já existe
    }
    const regra = /\.sm2-grove-walker-img\s*\{([^}]*)\}/.exec(css)![1];
    expect((regra.match(/drop-shadow\(/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(regra).toMatch(/image-rendering:\s*pixelated/);
  });
  it('a própria criatura tem contorno de outra cor (a primária) para se achar', () => {
    expect(css).toMatch(/\.sm2-grove-walker-img\[data-grove-creature="own"\]\s*\{[^}]*var\(--sm2-primary/);
  });
  it('a caminhada e o virar são animação CSS (sem rAF por sprite) e o reduzido as corta', () => {
    expect(css).toMatch(/\.sm2-grove-walker\s*\{[^}]*animation:\s*sm2-grove-walk/);
    expect(css).toMatch(/@keyframes sm2-grove-walk[\s\S]*?translateX/);
    expect(fonte('src/components/guild/GroveWalkers.tsx')).not.toMatch(/requestAnimationFrame|setInterval/);
    const ultimo = css.slice(css.lastIndexOf('@media (prefers-reduced-motion'));
    expect(ultimo).toMatch(/\.sm2-grove-walker,\s*\.sm2-grove-walker-flip\s*\{\s*animation:\s*none\s*!important/);
  });
  it('movimento reduzido: ninguém anda nem bate (e continuam todos lá)', () => {
    const { container } = montar(4, true);
    expect(sprites(container)).toHaveLength(4);
    expect(sprites(container).every(i => !i.className.includes('sm2-grove-bob'))).toBe(true);
    expect(Array.from(container.querySelectorAll<HTMLElement>('[data-grove-walker]')).every(w => w.style.animation === 'none')).toBe(true);
  });
});

describe('toque (D-53): reação visual, nome só ao tocar, sem som', () => {
  it('tocar mostra o nome (sem número) e dispara a reação; some sozinho', () => {
    vi.useFakeTimers();
    const { container } = montar(4);
    const btn = container.querySelectorAll<HTMLButtonElement>('button.sm2-grove-walker-btn')[2];
    fireEvent.click(btn);
    const nome = container.querySelector('[data-grove-nome]')!;
    expect(nome.textContent).toBe('Nome2');
    expect(nome.textContent).not.toMatch(/\d{2,}|ponto|point/i);
    expect(container.querySelectorAll('[data-grove-reacao="true"]')).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(container.querySelector('[data-grove-nome]')).toBeNull();
  });
  it('a sua criatura se chama "Você"/"You"', () => {
    const { container } = montar(3);
    fireEvent.click(container.querySelectorAll<HTMLButtonElement>('button.sm2-grove-walker-btn')[0]);
    expect(container.querySelector('[data-grove-nome]')!.textContent).toBe('Você');
    cleanup();
    const en = montar(3, false, 'en-US');
    fireEvent.click(en.container.querySelectorAll<HTMLButtonElement>('button.sm2-grove-walker-btn')[0]);
    expect(en.container.querySelector('[data-grove-nome]')!.textContent).toBe('You');
  });
  it('sem som: a camada não toca áudio nem importa nada de som (superfície nova nasce muda, K-12)', () => {
    expect(fonte('src/components/guild/GroveWalkers.tsx')).not.toMatch(/Audio|playSfx|sound|\.play\(|sfx/i);
    expect(fonte('src/components/guild/GroveCena.tsx')).not.toMatch(/Audio|playSfx|sound|\.play\(|sfx/i);
  });
});

describe('balões (D-52)', () => {
  it('só depois de 20 s, com frase do banco fixo; some sozinho', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { container } = montar(3);
    act(() => { vi.advanceTimersByTime(19_000); });
    expect(container.querySelector('[data-grove-fala]')).toBeNull();
    act(() => { vi.advanceTimersByTime(1_500); });
    const fala = container.querySelector('[data-grove-fala]')!;
    expect(fala.textContent).toBe(GUILD_COPY['guild.bosque.fala.1'][0]);
    act(() => { vi.advanceTimersByTime(5_000); });
    expect(container.querySelector('[data-grove-fala]')).toBeNull();
  });
  it('desmontar limpa os timers (nada fala depois de sair)', () => {
    vi.useFakeTimers();
    const { unmount } = montar(3);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('GroveCena: a janela do Bosque na ficha do Clã (D-49/D-55/D-56)', () => {
  it('é a MESMA camada de membros (12 sprites) sobre o panorama pintado, e não há SVG vetorial', () => {
    const { container } = render(<GroveCena language="pt-BR" guild={{ members: membros(12), casa: undefined } as never} mySprite="/eu.png" reducedMotion={false} />);
    expect(container.querySelector('[data-grove-cena]')).not.toBeNull();
    expect(container.querySelector('img[data-grove-cena-img]')).not.toBeNull();
    expect(sprites(container)).toHaveLength(12);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('[data-casa-tronco], [data-casa-nucleo], [data-casa-cristal], [data-casa-visor]')).toBeNull();
  });
});
