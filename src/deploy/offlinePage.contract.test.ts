/**
 * TELA DE ERRO DE REDE DO APK (beta-play-01)
 * ==========================================
 * O APK carrega `server.url` (Worker remoto). Sem rede o WebView mostraria a
 * página de erro do Chrome. `server.errorPath` faz o Capacitor abrir, em vez
 * disso, `https://localhost/<errorPath>` — arquivo empacotado no APK via webDir.
 * Estes testes travam a cadeia inteira: config -> arquivo em public/ -> URL certa
 * -> PT/EN -> botão -> promessa de progresso salvo -> CSP-limpo (sem script inline).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(resolve(RAIZ, p), 'utf8');
const cap = JSON.parse(ler('capacitor.config.json'));
const html = ler('public/offline.html');
const js = ler('public/offline.js');

describe('server.errorPath do Capacitor', () => {
  it('aponta para um arquivo que existe em public/ (e portanto em dist/ e no APK)', () => {
    expect(cap.server.errorPath).toBe('offline.html');
    expect(existsSync(resolve(RAIZ, 'public', cap.server.errorPath))).toBe(true);
  });

  it('dist/ (commitado, é o que o `cap sync` empacota) tem a mesma página e o mesmo script', () => {
    expect(ler('dist/offline.html')).toBe(html);
    expect(ler('dist/offline.js')).toBe(js);
  });

  it('o botão recarrega EXATAMENTE a server.url do app', () => {
    const m = /var SOULMON_URL = '([^']+)'/.exec(js);
    expect(m?.[1]).toBe(cap.server.url);
  });
});

describe('página offline: conteúdo e identidade', () => {
  it('tem os dois idiomas, o botão "Tentar de novo" e a promessa de progresso salvo', () => {
    for (const frase of ['Tentar de novo', 'Try again', 'Sem conexão', 'No connection']) {
      expect(html + js).toContain(frase);
    }
    expect(js).toMatch(/Seu progresso est[aá] salvo/);
    expect(js).toMatch(/Your progress is saved/);
  });

  it('usa os tokens --sm2-* e o mascote da marca (data-URI do mascote.png), sem arte nova', () => {
    expect(html).toContain('--sm2-bg: #08191a');
    expect(html).toContain('--sm2-primary-fill: #5ff3e0');
    const png = readFileSync(resolve(RAIZ, 'src/assets/brand/final/mascote.png')).toString('base64');
    expect(html).toContain(`data:image/png;base64,${png}`);
  });

  it('é compatível com a CSP: nenhum <script> inline, só /offline.js', () => {
    const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].map(m => m[0]);
    expect(scripts).toEqual(['<script src="/offline.js">']);
    expect(html).not.toMatch(/\son[a-z]+=/i);
  });

  it('acessibilidade: lang, alvo de toque >= 48px, foco visível, movimento reduzido', () => {
    expect(html).toContain('<html lang=');
    expect(html).toMatch(/min-height:\s*48px/);
    expect(html).toContain(':focus-visible');
    expect(html).toContain('prefers-reduced-motion: reduce');
  });

  it('não depende de rede: nenhum http(s) externo no HTML', () => {
    expect(html).not.toMatch(/(src|href)=["']https?:/i);
  });
});
