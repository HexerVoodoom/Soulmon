// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { syncModalFlag, watchModalLayer, Z_ABOVE_BACK } from './modalLayer';

afterEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('data-modal-open'); });

describe('modal acima do voltar', () => {
  it('liga o flag com um dialog aria-modal e desliga quando ele some', () => {
    expect(syncModalFlag()).toBe(false);
    document.body.innerHTML = '<div role="dialog" aria-modal="true"></div>';
    expect(syncModalFlag()).toBe(true);
    expect(document.body.hasAttribute('data-modal-open')).toBe(true);
    document.body.innerHTML = '';
    expect(syncModalFlag()).toBe(false);
    expect(document.body.hasAttribute('data-modal-open')).toBe(false);
  });
  it('ignora modal oculto', () => {
    document.body.innerHTML = '<div role="dialog" aria-hidden="true"></div>';
    expect(syncModalFlag()).toBe(false);
  });
  it('o observador reage a modal que entra e sai do DOM', async () => {
    const stop = watchModalLayer();
    const d = document.createElement('div');
    d.setAttribute('role', 'dialog');
    document.body.appendChild(d);
    await new Promise(r => setTimeout(r, 60));
    expect(document.body.hasAttribute('data-modal-open')).toBe(true);
    d.remove();
    await new Promise(r => setTimeout(r, 60));
    expect(document.body.hasAttribute('data-modal-open')).toBe(false);
    stop();
  });
});

describe('contrato de CSS e camadas', () => {
  const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
  it('com modal aberto o voltar da página esmaece e não recebe toque; o de dentro do modal fica de fora', () => {
    const bloco = css.slice(css.indexOf('body[data-modal-open] .sm2-area-back'));
    expect(bloco).toMatch(/opacity:\s*\.18/);
    expect(bloco).toMatch(/pointer-events:\s*none/);
    expect(bloco).toContain(':not([aria-modal="true"] .sm2-area-back)');
  });
  it('nenhum diálogo de tela cheia com zIndex numérico fica abaixo do voltar (45)', () => {
    const ruins: string[] = [];
    const varre = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) { varre(p); continue; }
        if (!/\.tsx$/.test(n) || /\.test\./.test(n)) continue;
        for (const [i, l] of readFileSync(p, 'utf8').split('\n').entries()) {
          if (/(role="dialog"|aria-modal)/.test(l) && /inset: 0/.test(l) && /position: '(fixed|absolute)'/.test(l)) {
            const m = l.match(/zIndex: (\d+)/);
            if (m && Number(m[1]) <= 45) ruins.push(`${p}:${i + 1} zIndex ${m[1]}`);
          }
        }
      }
    };
    varre(join(process.cwd(), 'src/components'));
    expect(ruins).toEqual([]);
    expect(Z_ABOVE_BACK).toBeGreaterThan(45);
  });
});
