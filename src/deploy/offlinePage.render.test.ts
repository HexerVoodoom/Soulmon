// @vitest-environment jsdom
/**
 * Comportamento de public/offline.js dentro do HTML real (jsdom): idioma do
 * aparelho, texto, e o botão recarregando a URL do app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const html = readFileSync(resolve(RAIZ, 'public/offline.html'), 'utf8');
const js = readFileSync(resolve(RAIZ, 'public/offline.js'), 'utf8');
const replace = vi.fn();

function abrir(idioma: string) {
  document.documentElement.innerHTML = html.replace(/^[\s\S]*?<html[^>]*>/, '').replace(/<\/html>[\s\S]*$/, '').replace(/<script[^>]*><\/script>/, '');
  Object.defineProperty(navigator, 'languages', { value: [idioma], configurable: true });
  Object.defineProperty(navigator, 'language', { value: idioma, configurable: true });
  // jsdom não deixa trocar location: o script chama window.location.replace.
  Object.defineProperty(window, 'location', { value: { replace }, configurable: true });
  new Function(js)();
}

beforeEach(() => { replace.mockReset(); });

describe('offline.js', () => {
  it('aparelho em pt-BR: texto em português e lang=pt-BR', () => {
    abrir('pt-BR');
    expect(document.getElementById('titulo')!.textContent).toBe('Sem conexão');
    expect(document.getElementById('tentar')!.textContent).toBe('Tentar de novo');
    expect(document.getElementById('salvo')!.textContent).toMatch(/progresso est[aá] salvo/);
    expect(document.documentElement.getAttribute('lang')).toBe('pt-BR');
  });

  it('qualquer outro idioma: inglês', () => {
    abrir('de-DE');
    expect(document.getElementById('titulo')!.textContent).toBe('No connection');
    expect(document.getElementById('tentar')!.textContent).toBe('Try again');
  });

  it('"Tentar de novo" recarrega a URL do app e trava o botão enquanto tenta', () => {
    abrir('pt-BR');
    const b = document.getElementById('tentar') as HTMLButtonElement;
    b.click();
    expect(replace).toHaveBeenCalledWith('https://soulmon.mateus-sprnd.workers.dev/');
    expect(b.disabled).toBe(true);
    expect(b.textContent).toBe('Tentando…');
  });

  it('quando a rede volta sozinha, recarrega sem o usuário tocar em nada', () => {
    abrir('en-US');
    window.dispatchEvent(new Event('online'));
    expect(replace).toHaveBeenCalledWith("https://soulmon.mateus-sprnd.workers.dev/"); // (ouvintes de aberturas anteriores também disparam)
  });
});
