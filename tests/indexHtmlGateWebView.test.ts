// @vitest-environment jsdom
// ===========================================================================
// GUARD — o gate de WebView antigo do `index.html` (QA geral #19, 21/09/2026)
// roda DE VERDADE aqui, com `CSS.supports` de mentira por caso.
//
// O gate é um IIFE inline, sem import, antes do bundle. Ninguém nunca o
// executou fora de um navegador. Extraímos o bloco pelo comentário-título e
// rodamos no jsdom com um `CSS` controlado: o que se prova é que ele reage a
// CADA requisito (oklch, color-mix, aninhamento) e que um navegador SEM `CSS`
// (muito velho) recebe o aviso em vez de uma exceção.
// ===========================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import indexHtml from '../index.html?raw';
import { FEEDBACK_EMAIL } from '../src/components/FeedbackLink';

/** O bloco `<script>` que contém o gate, sem as tags. */
function fonteDoGate(): string {
  const blocos = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const gate = blocos.find(b => b.includes('AVISO DE WEBVIEW ANTIGO'));
  if (!gate) throw new Error('bloco do gate não encontrado no index.html');
  return gate;
}

type Supports = (a: string, b?: string) => boolean;

/** Executa o gate com um `CSS` e um `navigator` controlados. */
const UA_ANDROID_WV = 'Mozilla/5.0 (Linux; Android 11; wv) Chrome/83.0';

function rodar(opts: { css?: { supports?: Supports } | undefined; language?: string; userAgent?: string }) {
  document.body.innerHTML = '<div id="splash"><span id="sp-loading"></span></div><div id="root"></div>';
  const g = globalThis as unknown as Record<string, unknown>;
  const cssAntes = g.CSS;
  const navAntes = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  if (opts.css === undefined) delete g.CSS; else g.CSS = opts.css;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { language: opts.language ?? 'en-US', userAgent: opts.userAgent ?? UA_ANDROID_WV },
  });
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(fonteDoGate())();
  } finally {
    if (cssAntes === undefined) delete g.CSS; else g.CSS = cssAntes;
    if (navAntes) Object.defineProperty(globalThis, 'navigator', navAntes);
  }
  const root = document.getElementById('root')!;
  return {
    avisou: root.textContent!.length > 0,
    texto: root.textContent ?? '',
    splash: document.getElementById('splash'),
    links: [...root.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href') ?? '', texto: a.textContent ?? '' })),
    lang: document.documentElement.lang,
  };
}

const suportaTudo: Supports = () => true;
const suportaExceto = (bloqueado: (a: string, b?: string) => boolean): Supports => (a, b) => !bloqueado(a, b);

describe('0. AUTOVERIFICAÇÃO — o bloco existe e roda', () => {
  it('extrai o bloco e ele contém as três perguntas', () => {
    const f = fonteDoGate();
    expect(f).toContain("CSS.supports('color', 'oklch(0 0 0)')");
    expect(f).toContain("CSS.supports('color', 'color-mix(in srgb, red, blue)')");
    expect(f).toContain("CSS.supports('selector(&)')");
  });

  it('com tudo suportado, NADA é montado e a splash fica', () => {
    const r = rodar({ css: { supports: suportaTudo } });
    expect(r.avisou).toBe(false);
    expect(r.splash).not.toBeNull();
  });
});

describe('1. cada requisito, sozinho, dispara o aviso', () => {
  it('só `selector(&)` falso (WebView 111: oklch ok, aninhamento não) → avisa', () => {
    const r = rodar({ css: { supports: suportaExceto((a, b) => a === 'selector(&)' && b === undefined) } });
    expect(r.avisou).toBe(true);
    expect(r.texto).toMatch(/An update is needed/);
    expect(r.splash, 'a splash tem que sair — senão cobre o aviso').toBeNull();
  });

  it('só `oklch` falso → avisa', () => {
    const r = rodar({ css: { supports: suportaExceto((a, b) => a === 'color' && /oklch/.test(b ?? '')) } });
    expect(r.avisou).toBe(true);
  });

  it('só `color-mix` falso → avisa', () => {
    const r = rodar({ css: { supports: suportaExceto((a, b) => a === 'color' && /color-mix/.test(b ?? '')) } });
    expect(r.avisou).toBe(true);
  });
});

describe('2. navegador muito velho', () => {
  it('`CSS` undefined → não lança, e avisa', () => {
    expect(() => rodar({ css: undefined })).not.toThrow();
    const r = rodar({ css: undefined });
    expect(r.avisou).toBe(true);
  });

  it('`CSS` existe mas sem `supports` → não lança, e avisa', () => {
    const r = rodar({ css: {} });
    expect(r.avisou).toBe(true);
  });

  it('`CSS.supports` que LANÇA (implementação quebrada) → não derruba a página (try/catch), e não avisa', () => {
    // OBSERVADO: exceção dentro do IIFE cai no `catch (e) {}`; o aviso NÃO é
    // montado e o bundle segue tentando carregar. É o comportamento de
    // "na dúvida, não bloqueie" — registrado para não virar surpresa.
    const r = rodar({ css: { supports: () => { throw new TypeError('quebrado'); } } });
    expect(r.avisou).toBe(false);
  });
});

describe('3. idioma e injeção', () => {
  it('pt-BR recebe o texto em português; o userAgent entra como TEXTO, nunca como HTML', () => {
    document.body.innerHTML = '<div id="root"></div>';
    const g = globalThis as unknown as Record<string, unknown>;
    const cssAntes = g.CSS;
    delete g.CSS;
    const navAntes = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true, value: { language: 'pt-BR', userAgent: '<img src=x onerror="window.__xss=1">' },
    });
    try { new Function(fonteDoGate())(); } finally {
      if (cssAntes === undefined) delete g.CSS; else g.CSS = cssAntes;
      if (navAntes) Object.defineProperty(globalThis, 'navigator', navAntes);
    }
    const root = document.getElementById('root')!;
    expect(root.textContent).toMatch(/Precisamos de uma atualização/);
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x');
  });
});

describe('4. ramo por plataforma (skeptic #4 / design D1, D3, D4, D2)', () => {
  const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
  const UA_FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; rv:100.0) Gecko/20100101 Firefox/100.0';

  it('Android: fala do WebView e oferece DOIS links-botão para a Play (WebView e Chrome)', () => {
    const r = rodar({ css: undefined, userAgent: UA_ANDROID_WV, language: 'pt-BR' });
    expect(r.texto).toMatch(/Android System WebView/);
    const play = r.links.filter(l => l.href.startsWith('https://play.google.com/store/apps/details?id='));
    expect(play.map(l => l.href.split('id=')[1])).toEqual(['com.google.android.webview', 'com.android.chrome']);
    expect(play.every(l => l.texto.length > 0)).toBe(true);
  });

  it('iOS: texto genérico de navegador desatualizado, SEM link para a Play', () => {
    const r = rodar({ css: undefined, userAgent: UA_IOS, language: 'en-US' });
    expect(r.avisou).toBe(true);
    expect(r.texto).not.toMatch(/Android System WebView|Play Store/);
    expect(r.texto).toMatch(/browser is out of date/i);
    expect(r.links.some(l => l.href.includes('play.google.com'))).toBe(false);
  });

  it('Firefox desktop em pt: genérico, em português', () => {
    const r = rodar({ css: undefined, userAgent: UA_FIREFOX, language: 'pt-BR' });
    expect(r.texto).toMatch(/navegador está desatualizado/);
    expect(r.texto).not.toMatch(/WebView/);
  });

  // QA rodada 2 (skeptic #5 / design A8): navegador de terceiro em Android
  // NÃO é WebView — mandá-lo atualizar o "Android System WebView" é conselho
  // errado. Só `; wv)` (ou o UA `Version/X.Y … Chrome/` do WebView antigo)
  // ganha os botões da Play.
  const UA_SAMSUNG = 'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.0.0 Mobile Safari/537.36';
  const UA_FIREFOX_ANDROID = 'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/109.0';
  const UA_CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36';
  const UA_WV_ANTIGO = 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 5 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36';

  it('Samsung Internet em Android: genérico, sem link para a Play', () => {
    const r = rodar({ css: undefined, userAgent: UA_SAMSUNG, language: 'en-US' });
    expect(r.avisou).toBe(true);
    expect(r.texto).not.toMatch(/Android System WebView/);
    expect(r.links.some(l => l.href.includes('play.google.com'))).toBe(false);
  });

  it('Firefox Android: genérico, sem link para a Play', () => {
    const r = rodar({ css: undefined, userAgent: UA_FIREFOX_ANDROID, language: 'pt-BR' });
    expect(r.texto).toMatch(/navegador está desatualizado/);
    expect(r.texto).not.toMatch(/WebView/);
  });

  it('Chrome (navegador, sem `wv`) em Android: genérico', () => {
    const r = rodar({ css: undefined, userAgent: UA_CHROME_ANDROID, language: 'en-US' });
    expect(r.texto).not.toMatch(/Android System WebView/);
  });

  it('WebView com `; wv)` E WebView antigo (`Version/4.0 … Chrome/`) → ramo do WebView', () => {
    for (const ua of [UA_ANDROID_WV, UA_WV_ANTIGO]) {
      const r = rodar({ css: undefined, userAgent: ua, language: 'en-US' });
      expect(r.texto, ua).toMatch(/Android System WebView/);
      expect(r.links.filter(l => l.href.includes('play.google.com'))).toHaveLength(2);
    }
  });

  it('`documentElement.lang` acompanha o idioma do aviso', () => {
    expect(rodar({ css: undefined, language: 'pt-BR' }).lang).toBe('pt-BR');
    expect(rodar({ css: undefined, language: 'en-US' }).lang).toBe('en');
  });

  it('há um `mailto:` e é o MESMO endereço de FeedbackLink.tsx (contrato)', () => {
    for (const ua of [UA_ANDROID_WV, UA_IOS]) {
      const r = rodar({ css: undefined, userAgent: ua });
      const mail = r.links.filter(l => l.href.startsWith('mailto:'));
      expect(mail).toHaveLength(1);
      expect(mail[0].href).toBe(`mailto:${FEEDBACK_EMAIL}`);
      expect(mail[0].texto).toBe(FEEDBACK_EMAIL);
    }
  });

  it('links são montados com createElement (não há innerHTML com concatenação no bloco)', () => {
    const f = fonteDoGate();
    expect(f).not.toMatch(/innerHTML\s*=\s*['"`][^'"`]*\+/);
    expect(f).toContain("document.createElement('a')");
  });
});
