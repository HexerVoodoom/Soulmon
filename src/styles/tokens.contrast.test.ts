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

  it('os tokens de movimento são 120/200/320 numa curva só', () => {
    const t = temaClaro();
    expect(t['--sm2-dur-tap']).toBe('120ms');
    expect(t['--sm2-dur-enter']).toBe('200ms');
    expect(t['--sm2-dur-page']).toBe('320ms');
    expect(t['--sm2-ease']).toBe('cubic-bezier(.2, 0, 0, 1)');
  });

  it('prefers-reduced-motion desliga a respiração do visor', () => {
    const bloco = cssRaw.slice(cssRaw.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(bloco).toContain('.sm2-viewport');
    expect(bloco).toMatch(/animation:\s*none/);
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
