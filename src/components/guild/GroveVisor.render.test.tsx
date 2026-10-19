/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { GroveVisor, SLOTS_X, ESCALA_CENA, CAMPO_LARGURA, OCUPACAO_COMPLETA, RAZAO_4_5, alturaCaixa } from './GroveVisor';

const ESTACOES = ['outono', 'inverno', 'primavera', 'verao'] as const;
import { createRequire } from 'node:module';

afterEach(cleanup);
const niveis = { outono: 4, inverno: 0, primavera: 2, verao: 5 };

const membros = (n: number, euEm = 0) => Array.from({ length: n }, (_, i) => ({ id: String(i).padStart(2, 'm').repeat(8).slice(0, 16), name: `M${i}`, euMesmo: i === euEm }));
const roda = (n: number, size = n) => ({ size, members: membros(n), bosque: { stage: 'copa' as const, stageIndex: 3, perto: false, ornaments: [] } });

function montar(reducedMotion = false, guild: ReturnType<typeof roda> = roda(1), mySprite = '/meu-sprite.png') {
  const r = render(<GroveVisor language="en-US" guild={guild as never} mySprite={mySprite} niveis={niveis} reducedMotion={reducedMotion} label="Grove panorama" />);
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
  it('arte nítida: a resolução dos assets é >= a exibida; `pixelated` só nos assets do panorama', () => {
    const sharp = createRequire(join(process.cwd(), 'package.json'))('sharp');
    const base = join(process.cwd(), 'src/assets/bosque');
    const TELA_UTIL_ALTA = 844; // o iPhone de referência (390×844); o panorama ocupa a altura toda
    const exibida = { panorama: ESCALA_CENA * TELA_UTIL_ALTA, arvore: Math.max(...ESTACOES.map(e => alturaCaixa(e))) / 100 * TELA_UTIL_ALTA }; // cena a 118 % da altura; caixa da árvore por estação
    return Promise.all([
      sharp(join(base, 'panorama-bosque.webp')).metadata().then((m: { height: number }) => expect(m.height).toBeGreaterThanOrEqual(exibida.panorama)),
      ...readdirSync(base).filter(n => /^arvore-.*\.webp$/.test(n)).map(n =>
        sharp(join(base, n)).metadata().then((m: { height: number }) => expect(m.height, n).toBeGreaterThanOrEqual(exibida.arvore))),
    ]).then(() => {
      const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
      const ini = css.lastIndexOf('/*', css.indexOf('O PANORAMA DO BOSQUE'));
      const regras = css.slice(ini, ini + 6000).replace(/\/\*[\s\S]*?\*\//g, '').split('}').filter(r => /pixelated/.test(r)).map(r => r.trim().split('{')[0].trim());
      expect(regras.every(r => /^\.sm2-grove-(pan-img|arvore)/.test(r) || /sm2-grove-creature/.test(r))).toBe(true);
    });
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


describe('geometria dos campos (D-33): uma árvore por clareira, centrada, sem cortar', () => {
  // largura/altura de cada nível 5 na arte (px da folha) -> a maior largura relativa à altura
  const LARG_5: Record<string, number> = { outono: 659 / 984, inverno: 366 / 569, primavera: 593 / 1079, verao: 538 / 1096 };
  it.each(ESTACOES)('%s: a completa ocupa 90–95 %% do campo e o nível 5 cabe no campo sem tocar o vizinho', e => {
    const campo = CAMPO_LARGURA; // fração da altura da cena
    const h4 = (alturaCaixa(e) / 100 / ESCALA_CENA) * RAZAO_4_5[e] * (504 / 512); // altura do nível 4, fração da altura da cena
    expect(h4 / campo).toBeGreaterThanOrEqual(0.9);
    expect(h4 / campo).toBeLessThanOrEqual(0.95);
    expect(OCUPACAO_COMPLETA).toBeGreaterThanOrEqual(0.9);
    const h5 = (alturaCaixa(e) / 100 / ESCALA_CENA) * (504 / 512);
    expect(h5).toBeGreaterThanOrEqual(h4);
    expect(h5 / h4).toBeLessThanOrEqual(1.25); // "um pouco" acima da completa
    expect((h5 * LARG_5[e]) / campo, 'largura do nível 5 cabe no campo').toBeLessThanOrEqual(1);
  });
  it('os campos são centrados nas clareiras e não se tocam (espaçamento > largura do campo)', () => {
    const xs = ESTACOES.map(e => SLOTS_X[e]);
    const largura = CAMPO_LARGURA * (1129 / 1700) * 100; // % da largura da cena (1700×1129)
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(largura);
    expect(xs[0] - largura / 2).toBeGreaterThan(0);
    expect(xs[3] + largura / 2).toBeLessThan(100);
  });
});

describe('as criaturas do clã no panorama (palco do Bosque)', () => {
  const criaturas = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLImageElement>('[data-grove-creature]'));
  it('1 membro: só a SUA, no centro, em 128 (escala inteira)', () => {
    const { container } = montar(false, roda(1));
    const c = criaturas(container);
    expect(c).toHaveLength(1);
    expect(c[0].getAttribute('data-grove-creature')).toBe('own');
    expect(c[0].width).toBe(128);
    expect(parseFloat(c[0].style.left)).toBe(50);
  });
  it('até 4: todos, na ordem da roda — a sua em 128, as dos outros em 64, da esquerda para a direita', () => {
    const { container } = montar(false, roda(4));
    const c = criaturas(container);
    expect(c.map(x => x.getAttribute('data-grove-creature'))).toEqual(['own', 'other', 'other', 'other']);
    expect(c.map(x => x.width)).toEqual([128, 64, 64, 64]);
    const xs = c.map(x => parseFloat(x.style.left));
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });
  it.each([1, 2, 3, 4])('%i criaturas pisam nos vãos, sem cobrir nenhuma árvore (>= 10 % da cena: meia largura do nível 5 + meia criatura)', n => {
    const { container } = montar(false, roda(n));
    for (const c of criaturas(container)) {
      const x = parseFloat(c.style.left);
      for (const slot of Object.values(SLOTS_X)) expect(Math.abs(x - slot), `criatura em ${x}% sobre árvore em ${slot}%`).toBeGreaterThanOrEqual(10);
    }
  });
  it.each([5, 8, 12])('%i membros: SÓ a sua (a fileira com lacunas é a sala de aula que LV-G2 veta)', n => {
    const { container } = montar(false, roda(n));
    const c = criaturas(container);
    expect(c).toHaveLength(1);
    expect(c[0].getAttribute('data-grove-creature')).toBe('own');
  });
  it('a dos outros é sempre a mesma (hash do id), nunca URL do servidor; a própria é a que o App manda', () => {
    const a = criaturas(montar(false, roda(3)).container).map(c => c.getAttribute('src'));
    cleanup();
    const b = criaturas(montar(false, roda(3)).container).map(c => c.getAttribute('src'));
    expect(b).toEqual(a);
    expect(a[0]).toBe('/meu-sprite.png');
    for (const u of a.slice(1)) expect(u).not.toMatch(/^https?:\/\/(?!localhost)/);
  });
  it('presença não mexe no palco e as criaturas não desenham texto nem opacidade', () => {
    const g = roda(4);
    const um = criaturas(montar(false, g).container).map(c => [c.getAttribute('src'), c.style.left, c.style.opacity, c.style.filter]);
    cleanup();
    const dois = criaturas(montar(false, { ...g, members: g.members.map(m => ({ ...m, apareceuHoje: true })) } as never).container).map(c => [c.getAttribute('src'), c.style.left, c.style.opacity, c.style.filter]);
    expect(dois).toEqual(um);
    for (const [, , o, f] of um) { expect(o).toBe(''); expect(f).toBe(''); }
  });
  it('batem em 2 quadros; com movimento reduzido ficam paradas', () => {
    expect(criaturas(montar(false, roda(2)).container).every(c => c.className.includes('sm2-grove-bob'))).toBe(true);
    cleanup();
    expect(criaturas(montar(true, roda(2)).container).every(c => !c.className.includes('sm2-grove-bob'))).toBe(true);
  });
});
