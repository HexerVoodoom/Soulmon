/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { GroveVisor } from './GroveVisor';

afterEach(cleanup);
const niveis = { outono: 4, inverno: 0, primavera: 2, verao: 5 };

function montar(reducedMotion = false) {
  const r = render(<GroveVisor language="en-US" niveis={niveis} reducedMotion={reducedMotion} label="Grove panorama" />);
  const pan = r.container.querySelector<HTMLElement>('.sm2-grove-pan')!;
  Object.defineProperty(pan, 'clientWidth', { configurable: true, value: 390 });
  Object.defineProperty(pan, 'scrollWidth', { configurable: true, value: 1200 });
  pan.scrollTo = vi.fn() as never;
  return { ...r, pan };
}

describe('GroveVisor: panorama de tela cheia (D-29/D-31/D-33)', () => {
  it('4 lugares, um por estação: árvore no nível atual ou lugar vazio', () => {
    const { container } = montar();
    const slots = Array.from(container.querySelectorAll<HTMLElement>('[data-grove-slot]'));
    expect(slots.map(s => s.dataset.groveSlot)).toEqual(['outono', 'inverno', 'primavera', 'verao']);
    expect(slots.map(s => s.dataset.nivel)).toEqual(['4', '0', '2', '5']);
    expect(slots[1].querySelector('img')).toBeNull();
    expect(slots[1].querySelector('.sm2-grove-vazio')).not.toBeNull();
    expect(slots[0].querySelector('img')!.getAttribute('src')).toMatch(/arvore-outono-4/);
    expect(slots[3].querySelector('img')!.getAttribute('src')).toMatch(/arvore-verao-5/);
    expect(slots[1].getAttribute('aria-label')).toMatch(/Pine tree, Winter: empty spot/);
  });
  it('nunca pixelado: nenhum image-rendering pixelated no panorama nem nas árvores', () => {
    const { container } = montar();
    for (const img of container.querySelectorAll<HTMLElement>('img')) expect(img.style.imageRendering).not.toBe('pixelated');
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
    const bloco = css.slice(css.indexOf('O PANORAMA DO BOSQUE'), css.indexOf('O PANORAMA DO BOSQUE') + 6000);
    expect(bloco).not.toMatch(/pixelated/);
  });
  it('região focável com nome; setas do teclado movem UMA tela', () => {
    const { pan } = montar();
    expect(pan.getAttribute('role')).toBe('region');
    expect(pan.tabIndex).toBe(0);
    expect(pan.getAttribute('aria-label')).toBe('Grove panorama');
    fireEvent.keyDown(pan, { key: 'ArrowRight' });
    expect(pan.scrollTo).toHaveBeenLastCalledWith({ left: 390, behavior: 'smooth' });
    fireEvent.keyDown(pan, { key: 'ArrowLeft' });
    expect(pan.scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' });
  });
  it('movimento reduzido: behavior auto', () => {
    const { pan } = montar(true);
    fireEvent.keyDown(pan, { key: 'ArrowRight' });
    expect(pan.scrollTo).toHaveBeenLastCalledWith({ left: 390, behavior: 'auto' });
    expect(pan.style.scrollBehavior).toBe('auto');
  });
});

describe('D-32: o Bosque só se acessa pelo Hall', () => {
  const raiz = join(process.cwd(), 'src');
  const arquivos: string[] = [];
  (function varrer(d: string) {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) varrer(p);
      else if (/\.(tsx|ts)$/.test(n) && !/\.test\.(tsx|ts)$/.test(n)) arquivos.push(p);
    }
  })(raiz);
  const norm = (p: string) => relative(raiz, p).split(sep).join('/');

  it('<GroveVisor só aparece na folha do Bosque (GroveFolha)', () => {
    const usos = arquivos.filter(f => /<GroveVisor\b/.test(readFileSync(f, 'utf8'))).map(norm);
    expect(usos).toEqual(['components/guild/GroveFolha.tsx']);
  });
  it('<GroveFolha só nasce no Salão da Guilda (GuildSheet), que só o Hall monta', () => {
    const usos = arquivos.filter(f => /<GroveFolha\b/.test(readFileSync(f, 'utf8'))).map(norm);
    expect(usos).toEqual(['components/guild/GuildSheet.tsx']);
    const donos = arquivos.filter(f => /<GuildSheet\b/.test(readFileSync(f, 'utf8'))).map(norm);
    expect(donos).toEqual(['components/nav/AreaView.tsx']);
  });
  it('GroveFolha é import dinâmico (fora do chunk de entrada)', () => {
    const src = readFileSync(join(raiz, 'components/guild/GuildSheet.tsx'), 'utf8');
    expect(src).toMatch(/lazy\(\(\) => import\('\.\/GroveFolha'\)\)/);
    expect(src).not.toMatch(/^import (?!type).*GroveFolha'/m);
  });
});
