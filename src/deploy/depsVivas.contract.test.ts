import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ===========================================================================
// GUARD — "todo pacote de `dependencies` tem pelo menos um import".
//
// Achado da rodada QA GERAL (21/09/2026, `05-arquitetura.md` §7): 38 pacotes
// em `dependencies` sem um único import — o scaffold shadcn do Figma tinha
// saído de `src/components/ui/`, as dependências ficaram. Não iam para o
// bundle (tree-shaking), mas iam para `npm ci`, para o lockfile, para o
// Dependabot e para a superfície de supply-chain. Decisão do dono #33: remover
// e travar. Pacote instalado com zero imports é porta encostada: o próximo
// `import { X } from 'pacote'` funciona de primeira sem ninguém decidir nada.
//
// O guard varre TODO arquivo de código do repo (src, functions, workers,
// desktop, scripts, public, index.html, vite.config.ts) e exige, para cada
// pacote de `dependencies`, uma ocorrência de import/require/@import do
// próprio pacote ou de um subcaminho dele. O que é carregado por outro
// mecanismo entra na ALLOWLIST abaixo, com o motivo — linha sem motivo não
// entra.
// ===========================================================================

const RAIZ = resolve(__dirname, '../..');

/** Pacotes de `dependencies` que NÃO aparecem como import em código e mesmo
 *  assim são vivos. Cada linha diz QUEM carrega. */
const ALLOWLIST: Record<string, string> = {
  '@capacitor/android':
    'plataforma nativa: entra pelo Gradle (`android/capacitor.settings.gradle` → `node_modules/@capacitor/android`), não por import JS.',
  '@capacitor/cli':
    'binário `cap`: `npx cap sync android` no CI (`.github/workflows/android-build.yml`); não é código do app.',
};

/** Onde procurar imports. `dist/` fica de fora — é saída, não fonte. */
const RAIZES = ['src', 'functions', 'workers', 'desktop', 'scripts', 'public', 'index.html', 'vite.config.ts'];
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs|cjs|css|html)$/;
const IGNORAR = new Set(['node_modules', 'dist', 'dist-renderer', '.git', 'vendor']);

function arquivos(p: string, saida: string[] = []): string[] {
  let st; try { st = statSync(p); } catch { return saida; }
  if (st.isDirectory()) {
    for (const nome of readdirSync(p)) if (!IGNORAR.has(nome)) arquivos(join(p, nome), saida);
  } else if (EXTENSOES.test(p)) saida.push(p);
  return saida;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** `from 'pkg'`, `from 'pkg/sub'`, `import('pkg')`, `require('pkg')`,
 *  `import 'pkg/x.css'`, `@import 'pkg/x.css'` — todos com aspas simples ou duplas. */
function regexDeImport(pkg: string): RegExp {
  return new RegExp(`(from\\s*|import\\s*\\(?\\s*|require\\s*\\(\\s*|@import\\s*(?:url\\()?\\s*)['"]${escapar(pkg)}(['"/])`);
}

/**
 * O VEREDITO, como função pura: quais `deps` não têm import em nenhuma das
 * `fontes` nem entrada na `allowlist`. Extraída (QA, rodada A, 21/09/2026)
 * para que o guard prove que REPROVA um caso sintético — guard que nunca viu
 * um vermelho passa pelo motivo errado.
 */
function pacotesMortos(deps: readonly string[], fontes: readonly string[], allowlist: Record<string, string>): string[] {
  return deps.filter(d => !(d in allowlist) && !fontes.some(c => regexDeImport(d).test(c)));
}

const pkgJson = JSON.parse(readFileSync(resolve(RAIZ, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
const deps = Object.keys(pkgJson.dependencies);
const fontes = RAIZES.flatMap(r => arquivos(resolve(RAIZ, r))).map(p => readFileSync(p, 'utf8'));

describe('dependencies vivas — todo pacote tem quem o importe', () => {
  it('AUTOVERIFICAÇÃO: o extrator reconhece as formas de import que o repo usa', () => {
    const re = regexDeImport('@fontsource/silkscreen');
    expect(re.test(`import "@fontsource/silkscreen/latin-400.css";`)).toBe(true);
    expect(regexDeImport('firebase').test(`import { getAuth } from 'firebase/auth';`)).toBe(true);
    expect(regexDeImport('astronomy-engine').test(`await import('astronomy-engine')`)).toBe(true);
    expect(regexDeImport('hono').test(`const { Hono } = require("hono");`)).toBe(true);
    // `npm:hono` (Deno) e `jsr:@x/y` NÃO contam — não resolvem por node_modules.
    expect(regexDeImport('hono').test(`import { Hono } from "npm:hono";`)).toBe(false);
    // Menção em comentário/lápide não é import.
    expect(regexDeImport('recharts').test(`// saiu: 'recharts'`)).toBe(false);
  });

  it('TESTE-DO-TESTE: um pacote fantasma injetado REPROVA; o mesmo pacote na allowlist ou importado passa', () => {
    const fantasma = 'pacote-fantasma-que-nao-existe';
    expect(pacotesMortos([...deps, fantasma], fontes, ALLOWLIST)).toEqual([fantasma]);
    expect(pacotesMortos([fantasma], [`import x from '${fantasma}/sub';`], {})).toEqual([]);
    expect(pacotesMortos([fantasma], [], { [fantasma]: 'motivo qualquer' })).toEqual([]);
    // Menção sem import NÃO salva o pacote.
    expect(pacotesMortos([fantasma], [`// usamos '${fantasma}' um dia`], {})).toEqual([fantasma]);
  });

  it('todo pacote de `dependencies` é importado por código, ou está na ALLOWLIST com motivo', () => {
    const mortos = pacotesMortos(deps, fontes, ALLOWLIST);
    expect(mortos, 'pacote em `dependencies` sem um único import — `npm uninstall` ou registre na ALLOWLIST com quem o carrega').toEqual([]);
  });

  it('a ALLOWLIST só tem pacote que existe e que de fato não é importado (linha morta some junto)', () => {
    for (const [pkg, motivo] of Object.entries(ALLOWLIST)) {
      expect(deps, `${pkg} está na ALLOWLIST mas não em dependencies`).toContain(pkg);
      expect(motivo.length, `${pkg}: allowlist sem motivo`).toBeGreaterThan(20);
      expect(fontes.some(c => regexDeImport(pkg).test(c)), `${pkg} passou a ser importado; tire da ALLOWLIST`).toBe(false);
    }
  });

  it('o scaffold shadcn não volta: nenhum `@radix-ui/*` nem seus utilitários em dependencies', () => {
    // ⚰️ 21/09/2026 (decisão #33): 26 `@radix-ui/*`, `class-variance-authority`,
    // `clsx`, `tailwind-merge`, `cmdk`, `vaul`, `recharts`, `input-otp`,
    // `next-themes`, `react-hook-form`, `react-day-picker`,
    // `react-resizable-panels`, `embla-carousel-react`, `hono`,
    // `@jsr/supabase__supabase-js`. Quem precisar de um deles de verdade
    // reinstala com import junto — e aí o caso acima passa sozinho.
    expect(deps.filter(d => d.startsWith('@radix-ui/'))).toEqual([]);
  });
});
