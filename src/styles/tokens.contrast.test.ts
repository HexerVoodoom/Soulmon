import { describe, it, expect, beforeAll } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// CONTRASTE MEDIDO, NOS DOIS TEMAS — verificação NUMÉRICA, não visual.
//
// O footgun 10 do CLAUDE.md diz exatamente por que este arquivo existe:
// "não confie só no screenshot (o cinza quase-preto sobre fundo bem escuro
// ainda *parece* legível)". Na faixa de 3:1 a 5:1 o olho mente e o pixel não.
// Então os pares declarados são medidos aqui, na fórmula da WCAG 2.x, e o
// teste é o portão.
//
// Três coisas são travadas:
//   1. PARIDADE DE TEMA (footgun 10): todo token de cor `--sm2-*` existe no
//      bloco claro E no escuro. Token só em `:root` fica preso no valor
//      claro sob `[data-theme="dark"]` — é o bug recorrente do projeto.
//   2. CONTRASTE: os pares (ink,surface) (muted,surface) (primary,bg)
//      (gold,surface) (btn-text,primary) + os que a paleta acrescentou,
//      nos dois temas, em AA.
//   3. TINTA × FILL: `*-ink` e `*-fill` do mesmo acento NUNCA têm o mesmo
//      valor. É a regra estrutural que impede o bug de voltar por descuido.
//
// O cálculo da WCAG é escrito aqui, à mão: são 12 linhas e uma dependência
// nova para isso seria pior que o problema.
//
// O CSS é lido do DISCO (e não por `?raw`): o vitest desliga o processamento
// de CSS e `import './index.css?raw'` chega como string vazia — o teste
// passaria sempre, pelo motivo errado. Mesmo encanamento (e mesmo motivo:
// o `npx tsc --noEmit` não carrega os tipos do Node) de
// `src/index.css.contract.test.ts`.
// ═══════════════════════════════════════════════════════════════════════════

let cssRaw = '';

beforeAll(async () => {
  const specFs = 'node:fs';
  const specUrl = 'node:url';
  const fs = await import(/* @vite-ignore */ specFs);
  const { fileURLToPath } = await import(/* @vite-ignore */ specUrl);
  const aqui = fileURLToPath(new URL('.', import.meta.url));
  cssRaw = fs.readFileSync(`${aqui}../index.css`, 'utf8');
});

// ── WCAG 2.x, relative luminance + contrast ratio ─────────────────────────

/** Canal sRGB 0–255 → linear. */
function canalLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** `#RGB` / `#RRGGBB` / `rgba(r,g,b,a)` → [r,g,b] 0–255 + alfa. */
export function parseCor(cor: string): { rgb: [number, number, number]; a: number } {
  const s = cor.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
    return {
      rgb: [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)],
      a: 1,
    };
  }
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (rgba) {
    const p = rgba[1].split(',').map(x => Number(x.trim()));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  }
  throw new Error(`cor não reconhecida: ${cor}`);
}

/** Composição sobre um fundo opaco — cor translúcida não tem luminância própria. */
function sobre(frente: string, fundo: string): [number, number, number] {
  const f = parseCor(frente);
  const b = parseCor(fundo);
  if (f.a >= 1) return f.rgb;
  return [0, 1, 2].map(i => f.rgb[i] * f.a + b.rgb[i] * (1 - f.a)) as [number, number, number];
}

export function luminancia(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(canalLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG. `frente` translúcida é composta sobre `fundo`. */
export function contraste(frente: string, fundo: string): number {
  const l1 = luminancia(sobre(frente, fundo));
  const l2 = luminancia(parseCor(fundo).rgb);
  const [alto, baixo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (alto + 0.05) / (baixo + 0.05);
}

// ── leitura dos tokens do CSS ─────────────────────────────────────────────

/**
 * Tokens `--sm2-*` de todo bloco cujo seletor CASA com o predicado.
 *
 * Varre regra a regra em vez de casar um seletor literal: a fundação declara
 * o mesmo tema em mais de um bloco (`:root`, `:root, [data-theme="light"]`,
 * e o bloco separado do `--sm2-icon-grad`), e casar string exata deixaria um
 * deles de fora em silêncio — que é exatamente o modo de falha que este
 * arquivo existe para impedir.
 */
function tokensOnde(casa: (seletor: string) => boolean): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(?:^|\n)([^{}\n][^{}]*)\{([^}]*)\}/g;
  let bloco: RegExpExecArray | null;
  while ((bloco = re.exec(cssRaw))) {
    const seletor = bloco[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!casa(seletor)) continue;
    for (const m of bloco[2].matchAll(/(--sm2-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      out[m[1]] = m[2].trim();
    }
  }
  return out;
}

const ehSeletorClaro = (s: string) =>
  /^:root(\s*,\s*\[data-theme="light"\])?$/.test(s) ||
  /^\[data-theme="light"\]$/.test(s);
const ehSeletorEscuro = (s: string) => /^\[data-theme="dark"\]$/.test(s);

function temaClaro(): Record<string, string> {
  return tokensOnde(ehSeletorClaro);
}
function tokensDoBlocoEscuro(): Record<string, string> {
  return tokensOnde(ehSeletorEscuro);
}
function temaEscuro(): Record<string, string> {
  // O escuro herda tudo do claro e sobrescreve o que declara — é assim que a
  // cascata funciona no navegador, e medir só o bloco escuro esconderia
  // justamente o token que ESQUECERAM de sobrescrever.
  return { ...temaClaro(), ...tokensDoBlocoEscuro() };
}

/** Tokens que são COR (os únicos que precisam existir nos dois temas). */
function ehCor(v: string): boolean {
  return /^(#|rgba?\()/.test(v.trim());
}

describe('a leitura do CSS funciona (senão o guard vira decoração)', () => {
  it('leu o index.css do disco', () => {
    expect(cssRaw.length).toBeGreaterThan(100_000);
  });

  it('achou os dois blocos de tokens', () => {
    expect(Object.keys(temaClaro()).length).toBeGreaterThan(20);
    expect(Object.keys(tokensDoBlocoEscuro()).length).toBeGreaterThan(15);
  });

  it('a fórmula bate com os valores canônicos da WCAG', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // Par publicado pela W3C como exemplo de 4,5:1 exato.
    expect(contraste('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contraste('#777777', '#ffffff')).toBeLessThan(4.5);
  });
});

// ── 1. FOOTGUN 10: paridade de tema ───────────────────────────────────────

describe('FOOTGUN 10 — nenhum token de cor fica preso num tema', () => {
  it('todo `--sm2-*` de cor do tema claro é redeclarado no escuro', () => {
    const claro = temaClaro();
    const escuro = tokensDoBlocoEscuro();
    const presos = Object.entries(claro)
      .filter(([k, v]) => ehCor(v) && !(k in escuro))
      .map(([k, v]) => `${k}: ${v}`);
    expect(
      presos,
      `tokens de cor declarados só no tema claro (ficam PRESOS no valor claro\n` +
        `quando [data-theme="dark"] está ativo — é o bug recorrente):\n${presos.join('\n')}`,
    ).toEqual([]);
  });

  it('o escuro não inventa token de cor que o claro não tem', () => {
    const claro = temaClaro();
    const escuro = tokensDoBlocoEscuro();
    const orfaos = Object.entries(escuro)
      .filter(([k, v]) => ehCor(v) && !(k in claro))
      .map(([k]) => k);
    expect(orfaos, `só no escuro (some no tema claro): ${orfaos.join(', ')}`).toEqual([]);
  });

  it('os dois temas declaram --sm2-icon-grad (GRAD -25 só no escuro)', () => {
    expect(temaClaro()['--sm2-icon-grad']).toBe('0');
    expect(temaEscuro()['--sm2-icon-grad']).toBe('-25');
  });
});

// ── 2. CONTRASTE MEDIDO ───────────────────────────────────────────────────

/** [nome, token da frente, token do fundo, mínimo] */
type Par = [string, string, string, number];

const AA_TEXTO = 4.5; // texto normal
const AA_UI = 3; // componente de UI / texto grande (≥24px, ou ≥19px bold)

const PARES: Par[] = [
  // Os cinco pares exigidos na direção de arte.
  ['ink sobre surface', '--sm2-ink', '--sm2-surface', AA_TEXTO],
  ['muted sobre surface', '--sm2-muted', '--sm2-surface', AA_TEXTO],
  ['primary sobre bg', '--sm2-primary-ink', '--sm2-bg', AA_TEXTO],
  ['gold sobre surface', '--sm2-gold-ink', '--sm2-surface', AA_TEXTO],
  ['btn-text sobre primary', '--sm2-on-primary', '--sm2-primary-fill', AA_TEXTO],
  // O resto da paleta, porque um par não medido é um par que vai quebrar.
  ['ink sobre bg', '--sm2-ink', '--sm2-bg', AA_TEXTO],
  ['ink sobre surface-2', '--sm2-ink', '--sm2-surface-2', AA_TEXTO],
  ['muted sobre bg', '--sm2-muted', '--sm2-bg', AA_TEXTO],
  ['muted sobre surface-2', '--sm2-muted', '--sm2-surface-2', AA_TEXTO],
  ['primary sobre surface', '--sm2-primary-ink', '--sm2-surface', AA_TEXTO],
  ['gold sobre bg', '--sm2-gold-ink', '--sm2-bg', AA_TEXTO],
  ['danger sobre surface', '--sm2-danger-ink', '--sm2-surface', AA_TEXTO],
  ['danger sobre bg', '--sm2-danger-ink', '--sm2-bg', AA_TEXTO],
  ['btn-text sobre gold-fill', '--sm2-on-gold', '--sm2-gold-fill', AA_TEXTO],
  ['btn-text sobre danger-fill', '--sm2-on-danger', '--sm2-danger-fill', AA_TEXTO],
  ['btn-text sobre primary-deep', '--sm2-on-primary', '--sm2-primary-deep', AA_TEXTO],
  // O visor é escuro nos DOIS temas — a tinta dele não é a da página.
  ['viewport-ink dentro do visor', '--sm2-viewport-ink', '--sm2-viewport-bg', AA_TEXTO],
  // A tarefa assombrada (P5, canvas Home): tinta PRÓPRIA, sólida, sobre a
  // superfície do painel e sobre a página. A proposta do lead (`#6E8AA3` no
  // escuro) dava 4,21:1 sobre `surface` e foi clareada aqui, pelo número.
  ['haunted sobre surface', '--sm2-haunted', '--sm2-surface', AA_TEXTO],
  ['haunted sobre bg', '--sm2-haunted', '--sm2-bg', AA_TEXTO],
  ['haunted sobre surface-2', '--sm2-haunted', '--sm2-surface-2', AA_TEXTO],
  // Fills e superfícies: 3:1, o mínimo de componente não-textual (1.4.11).
  ['primary-fill sobre bg (UI)', '--sm2-primary-fill', '--sm2-bg', AA_UI],
  ['primary-fill sobre surface (UI)', '--sm2-primary-fill', '--sm2-surface', AA_UI],
  ['gold-fill sobre bg (UI)', '--sm2-gold-fill', '--sm2-bg', AA_UI],
  ['gold-fill sobre surface (UI)', '--sm2-gold-fill', '--sm2-surface', AA_UI],
  ['danger-fill sobre surface (UI)', '--sm2-danger-fill', '--sm2-surface', AA_UI],
];

for (const [nomeTema, tokens] of [
  ['tema claro', temaClaro],
  ['tema escuro', temaEscuro],
] as const) {
  describe(`contraste AA — ${nomeTema}`, () => {
    for (const [nome, frente, fundo, min] of PARES) {
      it(`${nome} ≥ ${min}:1`, () => {
        const t = tokens();
        const cf = t[frente];
        const cb = t[fundo];
        expect(cf, `token ausente: ${frente}`).toBeTruthy();
        expect(cb, `token ausente: ${fundo}`).toBeTruthy();
        const r = contraste(cf, cb);
        expect(
          Number(r.toFixed(2)),
          `${nome} (${nomeTema}): ${cf} sobre ${cb} = ${r.toFixed(2)}:1, mínimo ${min}:1`,
        ).toBeGreaterThanOrEqual(min);
      });
    }
  });
}

// ── 2b. O TOAST ───────────────────────────────────────────────────────────
//
// O toast é o canal de ERRO, OFFLINE e IA-INDISPONÍVEL do app inteiro (11
// call-sites). Até agosto/2026 ele era o scaffold do Figma intacto: lia tema
// do `next-themes` (que este app nunca configurou) e amarrava `--normal-bg` a
// `var(--popover)` — token shadcn CONGELADO no tema claro (footgun 10).
// Medido com o app em tema escuro: creme #FFFCF0 com texto #DC7609 a 13px,
// 3,08:1, idêntico ao tema claro.
//
// A peça foi refeita sobre `--sm2-*` (`src/components/ui/sonner.tsx` + a regra
// no fim de `src/index.css`): fundo SEMPRE `--sm2-surface`, e o tipo do toast
// é lido pela TINTA + faixa lateral, nunca por fundo saturado. Este bloco
// existe para que o MAPA DE TIPOS tenha um dono medido: mudar a tinta de um
// tipo do toast quebra aqui, e não na tela de um usuário.
const PARES_TOAST: Par[] = [
  ['toast neutro — título', '--sm2-ink', '--sm2-surface', AA_TEXTO],
  ['toast — descrição', '--sm2-muted', '--sm2-surface', AA_TEXTO],
  ['toast error — título', '--sm2-danger-ink', '--sm2-surface', AA_TEXTO],
  ['toast warning — título', '--sm2-gold-ink', '--sm2-surface', AA_TEXTO],
  ['toast success/info — título', '--sm2-primary-ink', '--sm2-surface', AA_TEXTO],
  // A faixa lateral e a borda são o sinal NÃO-TEXTUAL do tipo: 3:1 (1.4.11).
  ['toast error — faixa', '--sm2-danger-ink', '--sm2-bg', AA_UI],
  ['toast warning — faixa', '--sm2-gold-ink', '--sm2-bg', AA_UI],
  ['toast success/info — faixa', '--sm2-primary-ink', '--sm2-bg', AA_UI],
];

for (const [nomeTema, tokens] of [
  ['tema claro', temaClaro],
  ['tema escuro', temaEscuro],
] as const) {
  describe(`contraste do TOAST — ${nomeTema}`, () => {
    for (const [nome, frente, fundo, min] of PARES_TOAST) {
      it(`${nome} ≥ ${min}:1`, () => {
        const t = tokens();
        const cf = t[frente];
        const cb = t[fundo];
        expect(cf, `token ausente: ${frente}`).toBeTruthy();
        expect(cb, `token ausente: ${fundo}`).toBeTruthy();
        const r = contraste(cf, cb);
        expect(
          Number(r.toFixed(2)),
          `${nome} (${nomeTema}): ${cf} sobre ${cb} = ${r.toFixed(2)}:1, mínimo ${min}:1`,
        ).toBeGreaterThanOrEqual(min);
      });
    }
  });
}

describe('o toast não voltou a ser o scaffold do Figma', () => {
  it('a regra do toast existe no index.css e é toda `--sm2-*`', () => {
    // O seletor em INÍCIO DE LINHA, e não a primeira ocorrência do texto: o
    // comentário da regra CITA `[data-sonner-toast].sm2-toast` e `var(--popover)`
    // para explicar por que aquele token não pode voltar — casar dentro do
    // comentário faria o teste reprovar a própria documentação dele.
    const i = cssRaw.indexOf("\n[data-sonner-toast].sm2-toast");
    expect(i, 'a regra do toast sumiu de src/index.css').toBeGreaterThan(0);
    const bloco = cssRaw.slice(i).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(bloco).toContain('var(--sm2-surface)');
    expect(bloco).toContain('var(--sm2-text-sm)');
    // Os tokens shadcn congelados no tema claro — footgun 10.
    expect(bloco).not.toMatch(/var\(--popover|var\(--foreground|var\(--background/);
  });

  it('o texto do toast é 14px (o piso do sistema é 12, mas isto é decisão)', () => {
    const t = temaClaro();
    expect(t['--sm2-text-sm']).toBe('14px');
  });
});

// ── 3. A REGRA TINTA × FILL ───────────────────────────────────────────────

describe('tinta e fill nunca são a mesma cor', () => {
  // O par existe justamente para que "usar a cor do botão como cor de texto"
  // seja impossível de fazer sem perceber. Se os dois valores convergirem, o
  // par vira decoração e o bug de contraste volta pela porta da frente.
  const ACENTOS = ['gold', 'danger'] as const;

  for (const [nomeTema, tokens] of [
    ['tema claro', temaClaro],
    ['tema escuro', temaEscuro],
  ] as const) {
    for (const acento of ACENTOS) {
      it(`${acento}-ink ≠ ${acento}-fill (${nomeTema})`, () => {
        const t = tokens();
        const ink = t[`--sm2-${acento}-ink`];
        const fill = t[`--sm2-${acento}-fill`];
        expect(ink, `--sm2-${acento}-ink ausente`).toBeTruthy();
        expect(fill, `--sm2-${acento}-fill ausente`).toBeTruthy();
        if (acento === 'gold') {
          expect(ink.toLowerCase()).not.toBe(fill.toLowerCase());
        }
        // `danger` pode coincidir num tema (o vermelho já é legível nos dois
        // papéis), mas os DOIS tokens têm que existir: é o que permite
        // separá-los depois sem caçar call-site.
        expect(ehCor(ink) && ehCor(fill)).toBe(true);
      });
    }
  }

  it('todo acento tem o par ink/fill E um `on-` declarado', () => {
    const t = temaEscuro();
    for (const a of ['primary', 'gold', 'danger']) {
      expect(t[`--sm2-${a}-ink`], `--sm2-${a}-ink`).toBeTruthy();
      expect(t[`--sm2-${a}-fill`], `--sm2-${a}-fill`).toBeTruthy();
      expect(t[`--sm2-on-${a}`], `--sm2-on-${a}`).toBeTruthy();
    }
  });
});

// ── 3b. O VISOR (D-O16, canvas Onboarding-funil §23) ──────────────────────
//
// Dentro do vidro a paleta é a do visor e NÃO muda de tema: o vidro é escuro
// nos dois temas, mas `primary-ink`/`muted` do tema claro foram calibrados
// para superfície clara — o ciano claro `#0B6F68` sobre o vidro claro
// `#0E2422` dá 2,70:1. O escopo `.sm2-visor` do `index.css` é o ÚNICO lugar
// que fixa os hex do escuro para o que vive no vidro (splash, intro, slots,
// `Viewport`). Aqui o par é medido contra o `viewport-bg` dos DOIS temas.
const visor = () => tokensOnde(s => s === '.sm2-visor');

describe('VISOR — a paleta dentro do vidro (`.sm2-visor`) é um escopo único', () => {
  it('o escopo existe no index.css e redefine a tinta do visor', () => {
    const v = visor();
    for (const k of ['--sm2-primary-ink', '--sm2-muted', '--sm2-ink', '--sm2-surface', '--sm2-surface-2', '--sm2-line']) {
      expect(v[k], `token ausente em .sm2-visor: ${k}`).toBeTruthy();
    }
  });

  it('os valores do visor são os do TEMA ESCURO (uma fonte, não uma terceira paleta)', () => {
    const v = visor();
    const e = temaEscuro();
    for (const k of Object.keys(v)) {
      expect(v[k], `${k} do visor ≠ tema escuro`).toBe(e[k]);
    }
  });

  for (const [nomeTema, tokens] of [['tema claro', temaClaro], ['tema escuro', temaEscuro]] as const) {
    it(`primary-ink do visor sobre viewport-bg (${nomeTema}) ≥ ${AA_TEXTO}:1`, () => {
      const r = contraste(visor()['--sm2-primary-ink'], tokens()['--sm2-viewport-bg']);
      expect(Number(r.toFixed(2))).toBeGreaterThanOrEqual(AA_TEXTO);
    });
    it(`muted do visor sobre viewport-bg (${nomeTema}) ≥ ${AA_TEXTO}:1`, () => {
      const r = contraste(visor()['--sm2-muted'], tokens()['--sm2-viewport-bg']);
      expect(Number(r.toFixed(2))).toBeGreaterThanOrEqual(AA_TEXTO);
    });
  }

  it('o primary-ink do tema CLARO falharia no vidro — é por isso que o escopo existe', () => {
    const r = contraste(temaClaro()['--sm2-primary-ink'], temaClaro()['--sm2-viewport-bg']);
    expect(r).toBeLessThan(AA_TEXTO);
  });

  it('o index.html não carrega mais cópia dos tokens: o #splash lê de .sm2-visor', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs');
    const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url');
    const aqui = fileURLToPath(new URL('.', import.meta.url));
    const html = fs.readFileSync(`${aqui}../../index.html`, 'utf8');
    expect(html).toMatch(/<div id="splash" class="sm2-visor sm2-splash"/);
    expect(html, 'declaração --sm2-* dentro do index.html (cópia de token)').not.toMatch(/--sm2-[a-z-]+\s*:/);
    // Sem sombra e sem opacidade na splash (D-O2): o brilho é a tinta.
    const splashCss = cssRaw.slice(cssRaw.indexOf('.sm2-splash {'), cssRaw.indexOf('.sm2-splash-video')).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(splashCss).not.toMatch(/drop-shadow|text-shadow|box-shadow|opacity\s*:\s*\.\d/);
  });
});

// ── 4. REGRAS ESTRUTURAIS DA FUNDAÇÃO ─────────────────────────────────────

describe('regras da fundação travadas no CSS', () => {
  /** Corpo da regra `.classe { ... }` (sem sub-blocos aninhados). */
  function corpo(classe: string): string {
    const re = new RegExp(`(?:^|\\n)\\.${classe}\\s*\\{([^}]*)\\}`);
    const m = re.exec(cssRaw);
    return m ? m[1] : '';
  }

  it('REGRA DO DONO: `.sm2-icon` não desenha box nenhuma', () => {
    // "Ícone NUNCA dentro de box" (CLAUDE.md). Sem moldura, sem placa, sem
    // fundo, sem chanfro — nem por descuido numa rodada futura.
    const c = corpo('sm2-icon');
    expect(c.length).toBeGreaterThan(100);
    for (const proibida of [
      'background', 'border', 'box-shadow', 'padding', 'clip-path', 'outline',
    ]) {
      expect(
        new RegExp(`(?:^|[;{\\s])${proibida}(?:-[a-z]+)?\\s*:`).test(c),
        `\`${proibida}\` apareceu em .sm2-icon — ícone NUNCA dentro de box`,
      ).toBe(false);
    }
  });

  it('as fontes são self-hosted (CDN quebra offline no service worker)', () => {
    // Só as URLs de verdade: o comentário ao lado dos @font-face CITA o
    // gstatic para explicar por que ele não pode ser usado.
    const urls = [...cssRaw.matchAll(/src:\s*url\(([^)]+)\)/g)].map(m => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) {
      expect(u, `@font-face apontando para CDN (quebra offline): ${u}`)
        .not.toMatch(/gstatic|googleapis|https?:/);
    }
    const faces = cssRaw.slice(cssRaw.indexOf('ONDA 1'));
    expect(faces.length).toBeGreaterThan(1000);
    for (const f of [
      'fredoka-latin.woff2',
      'fredoka-latin-ext.woff2',
      'rubik-latin.woff2',
      'rubik-latin-ext.woff2',
      'material-symbols-rounded.woff2',
    ]) {
      expect(faces, `@font-face faltando: ${f}`).toContain(`/fonts/${f}`);
    }
  });

  it('a escala tipográfica tem piso de 12px', () => {
    const t = temaClaro();
    const escala = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map(k => t[`--sm2-text-${k}`]);
    expect(escala).toEqual(['12px', '14px', '16px', '20px', '24px', '32px']);
    for (const v of escala) expect(parseInt(v, 10)).toBeGreaterThanOrEqual(12);
    expect(t['--sm2-leading-body']).toBe('1.45');
    expect(t['--sm2-leading-title']).toBe('1.2');
  });

  it('a escala de espaço é grid de 4 (4/8/12/16/24/32) com meio-passo de 2', () => {
    // P1 (DECISOES-WIREFRAME §18, 16/09/2026). Invariante de tema, como o raio:
    // declarada uma vez no bloco `:root` e herdada pelo escuro.
    const t = temaClaro();
    expect(['1', '2', '3', '4', '5', '6'].map(k => t[`--sm2-space-${k}`]))
      .toEqual(['4px', '8px', '12px', '16px', '24px', '32px']);
    // O meio-passo existe SÓ para ícone↔rótulo na mesma linha; é declarado
    // para que o `gap: 2` da nav e do chip sejam token, não literal.
    expect(t['--sm2-space-half']).toBe('2px');
    // Invariante: o bloco escuro NÃO redeclara espaço (senão vira cor por
    // acidente, e o guard de paridade passaria a exigir os dois lados).
    for (const k of ['half', '1', '2', '3', '4', '5', '6']) {
      expect(tokensDoBlocoEscuro()[`--sm2-space-${k}`], `--sm2-space-${k} redeclarado no escuro`).toBeUndefined();
    }
  });

  it('os tokens de movimento são 120/200/320 numa curva só', () => {
    const t = temaClaro();
    expect(t['--sm2-dur-tap']).toBe('120ms');
    expect(t['--sm2-dur-enter']).toBe('200ms');
    expect(t['--sm2-dur-page']).toBe('320ms');
    expect(t['--sm2-ease']).toBe('cubic-bezier(.2, 0, 0, 1)');
  });

  it('a varredura da sintonia do Visor é token de 400ms, não literal solto', () => {
    // Quarta duração, e a única acima de 320ms: a faixa da sintonia é uma
    // passagem que o olho segue de ponta a ponta da tela, não um feedback.
    expect(temaClaro()['--sm2-dur-scan']).toBe('400ms');
    // E o CSS tem de CONSUMIR o token — token que ninguém usa é decoração.
    expect(cssRaw).toMatch(/\.sm-visor-scan\s*\{[^}]*var\(--sm2-dur-scan/);
    // Uma vez, nunca em loop: `infinite` aqui seria a scanline permanente que
    // o `Viewport` recusa desde a fundação (come metade de um sprite de 32px).
    expect(cssRaw).not.toMatch(/sm-visor-scan-once[^;]*infinite/);
  });

  it('prefers-reduced-motion desliga a respiração do visor', () => {
    const bloco = cssRaw.slice(cssRaw.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(bloco).toContain('.sm2-viewport');
    expect(bloco).toMatch(/animation:\s*none/);
  });

  /**
   * GUARD DO GUARD acima.
   *
   * O teste anterior mede o ÚLTIMO bloco `prefers-reduced-motion` do arquivo e
   * cobra `.sm2-viewport` + `animation: none` DENTRO dele. Isso só funciona
   * enquanto o último bloco for o bloco canônico da fundação. Se alguém colar
   * um bloco novo no fim do `index.css` que por acaso contenha um seletor
   * começando em `.sm2-viewport` e um `animation: none` qualquer, o teste
   * acima passa a medir o bloco errado, continua VERDE, e a trava da
   * respiração do visor evapora sem ninguém notar — falso verde é pior que
   * vermelho, porque ocupa o lugar de um teste.
   *
   * A sentinela resolve por identidade, não por conteúdo: o bloco canônico se
   * IDENTIFICA, e tem de ser o último.
   */
  it('o último bloco de movimento reduzido é o CANÔNICO — sentinela de identidade', () => {
    const SENTINELA = 'SENTINELA-MOVIMENTO-REDUZIDO-CANONICO';
    const ocorrências = cssRaw.split(SENTINELA).length - 1;
    expect(ocorrências, 'a sentinela identifica UM bloco só').toBe(1);

    const último = cssRaw.slice(cssRaw.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(
      último,
      'apareceu um bloco `prefers-reduced-motion` DEPOIS do canônico: a trava da ' +
      'respiração do visor passou a medir o bloco errado. Mova a regra nova para ' +
      'dentro do bloco canônico em vez de abrir outro.',
    ).toContain(SENTINELA);

    // E as regras do visor moram todas lá — inclusive a varredura nova.
    expect(último).toContain('.sm-visor-swap');
    expect(último).toContain('.sm-visor-scan');
  });

  it('o visor é escuro nos DOIS temas', () => {
    // Um visor claro para de ler como aparelho e vira cartão. É o ponto
    // inteiro da peça, então vale um número, não uma opinião: o interior
    // fica escuro o bastante para a tinta clara passar AA lá dentro.
    for (const tokens of [temaClaro, temaEscuro]) {
      const t = tokens();
      expect(luminancia(parseCor(t['--sm2-viewport-bg']).rgb)).toBeLessThan(0.05);
    }
  });
});
