/**
 * A RÉGUA DA NARRATIVA, PARTE 2 — as superfícies que `narrativa.contract.test.ts`
 * NÃO alcança.
 *
 * ## Por que existe (QA rodada 2, 22/09/2026)
 *
 * A régua original varre `src/**` (.ts/.tsx) e a bíblia. Mas o texto que o
 * jogador lê mora também em:
 *
 *  - `docs/BOOKLET-UNIVERSO.md` — o livrinho, 1.084 linhas de texto de jogador
 *    que entraram em `959e3bee` sem passar por crítica nenhuma;
 *  - `docs/PLAY-FICHA.md` — a ficha da loja, a PRIMEIRA copy pública do produto;
 *  - `public/*.html` — termos, política, páginas fora do bundle React;
 *  - `android/**.kt` — o widget, a superfície mais vista do telefone, que
 *    nenhum teste em `node` alcança a não ser lendo o FONTE (precedente:
 *    `src/plugins/widgetSemCobranca.contract.test.ts`).
 *
 * ## O que trava
 *
 *  1. Os termos vetados da bíblia §12 — a MESMA lista da régua original. Para
 *     não virar cópia que diverge (footgun 9 do `CLAUDE.md`), o 1º teste lê o
 *     fonte de `narrativa.contract.test.ts` e exige que cada regex de lá esteja
 *     aqui, e vice-versa. Quem acrescentar um termo numa acrescenta na outra ou
 *     fica vermelho.
 *  2. Os nomes das cinco camadas da fenda (proposta P3, **depende do dono**):
 *     a bíblia §12 diz "não use em string enquanto P3 estiver aberta". O
 *     livrinho declara que os deixou de fora de propósito — isto é o que
 *     mantém a declaração verdadeira.
 *  3. A formulação vetada da §1 da bíblia ("existe uma parte de você que nunca
 *     coube em você"), em PT e EN — pessoa como sujeito de verbo de ser (L1).
 *  4. Todo caminho `src/…`/`functions/…` citado no livrinho e na ficha existe
 *     (o mesmo anti-apodrecimento que a bíblia já tem).
 *
 * ## O que NÃO trava, dito por extenso
 *
 *  - Tom. Nenhuma regex reprova "está te esperando" ou "You're my favorite
 *    partner!" — isso é leitura do `soulmon-narrative-critic` e veto do
 *    `soulmon-guarda-linha-vermelha`. (Os dois achados estão no relatório da
 *    rodada 2, `02-narrativa-r2.md`.)
 *  - Comentário em `.kt`/`.html` é ignorado (mesma regra do
 *    `copy.semFomo.contract.test.ts`): a lápide de código PRECISA poder citar
 *    o que saiu. Em `.md` não há comentário; em vez disso, linha que fala
 *    SOBRE os termos (contém "vetad", "proibid" ou "NÃO aparecem") é meta e
 *    não conta — é o caso da nota "Vocabulário conferido" da ficha.
 *
 * ## Exceções
 *
 * Mesma lógica da régua original: termo ACEITO pelo dono (§14.4) fica onde já
 * está; espalhar para arquivo novo é escolha nova e tem de ser declarada aqui,
 * com a decisão que a cobre. O livrinho está declarado — mas fique claro que
 * isso é a squad DECLARANDO a escolha, não o dono decidindo de novo.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const REGUA_ORIGINAL = join(RAIZ, 'src', 'narrativa.contract.test.ts');
const BOOKLET = 'docs/BOOKLET-UNIVERSO.md';
const FICHA = 'docs/PLAY-FICHA.md';

/** As superfícies que a régua original não vê. */
function superficies(): string[] {
  const saida: string[] = [];
  for (const rel of [BOOKLET, FICHA]) {
    if (existsSync(join(RAIZ, rel))) saida.push(join(RAIZ, rel));
  }
  const pub = join(RAIZ, 'public');
  if (existsSync(pub)) {
    for (const nome of readdirSync(pub)) if (/\.html$/.test(nome)) saida.push(join(pub, nome));
  }
  const anda = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const nome of readdirSync(dir)) {
      const cheio = join(dir, nome);
      if (statSync(cheio).isDirectory()) { anda(cheio); continue; }
      if (/\.kt$/.test(nome)) saida.push(cheio);
    }
  };
  anda(join(RAIZ, 'android'));
  return saida;
}

const rel = (abs: string) => relative(RAIZ, abs).split('\\').join('/');

/**
 * ⚠️ ESPELHO da tabela `TERMOS` de `narrativa.contract.test.ts`. O 1º teste
 * abaixo compara as duas pelo `source` das regexes — mude lá E aqui.
 */
const TERMOS: { termo: string; re: RegExp; motivo: string }[] = [
  { termo: 'Weave', re: /\bWeave\b/, motivo: 'the Weave é D&D; o par EN do galho é Braid (bíblia §6.6).' },
  { termo: 'Vírus/Vacina/Virus/Vaccine (rótulo)', re: /(Vírus|Vacina|Vaccine|\bVirus\b)/, motivo: 'VETADO desde 29/09/2026 (§14.6, reverte a §14.4): os caminhos são Poder/Harmonia/Benevolência.' },
  { termo: 'Glitchtama', re: /Glitchtama/, motivo: 'aceito pelo dono onde já está (§14.4); em arquivo novo é escolha nova.' },
  { termo: 'domador/treinador/tamer', re: /\b(domador|domadora|treinador|treinadora|tamer)\b/i, motivo: 'fronteira de PI direta; o jogador é "você" (bíblia §12).' },
  { termo: 'digievolução/digievoluir', re: /\bdigi[ée]volu/i, motivo: 'marca de terceiro; o termo é forma / mudar de forma (§12).' },
  { termo: 'mundo digital', re: /\b(mundo digital|digital world)\b/i, motivo: 'colisão com o mundo de outra franquia; o lugar é a Malha / the Mesh (§3).' },
];

/**
 * Travas PRÓPRIAS desta régua — coisas que a bíblia veta em texto de jogador
 * e que a régua original não cobre.
 */
const TRAVAS_PROPRIAS: { termo: string; re: RegExp; motivo: string }[] = [
  {
    termo: 'nomes das cinco camadas da fenda (P3 aberta)',
    re: /\b(o Enquadre|a Ins[ôo]nia|Primeiro Ch[ãa]o|Cobre Frio|the Sleepless|First Ground|Cold Copper)\b/,
    motivo: 'bíblia §12: "nada decidido; não use em string enquanto P3 estiver aberta". É decisão do dono (§14).',
  },
  {
    termo: 'formulação vetada da §1 (pessoa como sujeito de "ser")',
    re: /parte de voc[êe] que (nunca|n[ãa]o) coube|part of you that (never|did not|didn'?t) fit/i,
    motivo: 'bíblia §1: vetada em qualquer texto de jogador — põe a pessoa como sujeito de um verbo de ser (L1).',
  },
];

/** Arquivos onde um termo ACEITO já está, com a decisão que cobre. */
const EXCECOES: Record<string, { arquivos: string[]; decisao: string }> = {
  'Glitchtama': {
    decisao: 'P5 fechada pelo dono em 21/09/2026 (§14.4). O livrinho (959e3bee) e a ficha usam o nome do item. Declarado pela squad-narrativa na QA rodada 2 — não é decisão nova do dono.',
    arquivos: [BOOKLET],
  },
  'Vírus/Vacina/Virus/Vaccine (rótulo)': {
    decisao: 'P1 fechada (§14.4) e REVERTIDA em 29/09/2026 (§14.6). No livrinho o termo antigo aparece SÓ na nota de manutenção fora da ficção, registrando o renomeio.',
    arquivos: [BOOKLET],
  },
};

/** Comentário fora (kt/html); em md, linha META sobre os termos fora. */
function linhasVisiveis(caminho: string, src: string): string[] {
  if (/\.md$/.test(caminho)) {
    // O PARÁGRAFO meta sai inteiro (a nota "Vocabulário conferido" da ficha
    // quebra linha no meio da lista de termos) — parágrafo = até a linha vazia.
    const linhas = src.split('\n');
    let meta = false;
    return linhas.map(l => {
      if (l.trim() === '') { meta = false; return l; }
      if (/vetad|proibid|N[ÃA]O aparecem/i.test(l)) meta = true;
      return meta ? '' : l;
    });
  }
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    .split('\n');
}

describe('régua da narrativa (superfícies) — a lista de termos é a MESMA da régua original', () => {
  it('cada regex de `narrativa.contract.test.ts` está aqui, e vice-versa', () => {
    const fonte = readFileSync(REGUA_ORIGINAL, 'utf8');
    // Só a tabela TERMOS: para no primeiro `];` depois de `const TERMOS`.
    const bloco = fonte.slice(fonte.indexOf('const TERMOS'), fonte.indexOf('];', fonte.indexOf('const TERMOS')));
    const deLa = [...bloco.matchAll(/re:\s*(\/(?:\\.|[^/])+\/[a-z]*)/g)].map(m => m[1]).sort();
    const daqui = TERMOS.map(t => `/${t.re.source}/${t.re.flags}`).sort();
    expect(deLa.length, 'a régua original mudou de forma e este espelho não a lê mais').toBeGreaterThan(3);
    expect(daqui, 'as duas tabelas de termos divergiram — footgun 9 aplicado a régua').toEqual(deLa);
  });
});

describe('régua da narrativa (superfícies) — livrinho, ficha, public/*.html, android/**.kt', () => {
  const arquivos = superficies();

  it('a varredura tem chão embaixo', () => {
    expect(arquivos.some(a => a.endsWith('BOOKLET-UNIVERSO.md'))).toBe(true);
    expect(arquivos.some(a => a.endsWith('PLAY-FICHA.md'))).toBe(true);
    expect(arquivos.some(a => /WidgetRenderer\.kt$/.test(a))).toBe(true);
    expect(arquivos.some(a => /privacidade\.html$/.test(a))).toBe(true);
  });

  it('nenhum termo vetado (§12) fora das exceções declaradas', () => {
    const achados: string[] = [];
    for (const { termo, re, motivo } of TERMOS) {
      const permitidos = new Set(EXCECOES[termo]?.arquivos ?? []);
      for (const arquivo of arquivos) {
        const r = rel(arquivo);
        if (permitidos.has(r)) continue;
        const linhas = linhasVisiveis(r, readFileSync(arquivo, 'utf8'));
        linhas.forEach((l, i) => { if (re.test(l)) achados.push(`${r}:${i + 1} → "${termo}" :: ${l.trim().slice(0, 100)}\n      ${motivo}`); });
      }
    }
    expect(achados, achados.join('\n')).toEqual([]);
  });

  it('nenhuma trava própria (P3 aberta, formulação vetada da §1) em texto de jogador', () => {
    const achados: string[] = [];
    for (const { termo, re, motivo } of TRAVAS_PROPRIAS) {
      for (const arquivo of arquivos) {
        const r = rel(arquivo);
        const linhas = linhasVisiveis(r, readFileSync(arquivo, 'utf8'));
        linhas.forEach((l, i) => { if (re.test(l)) achados.push(`${r}:${i + 1} → "${termo}" :: ${l.trim().slice(0, 100)}\n      ${motivo}`); });
      }
    }
    expect(achados, achados.join('\n')).toEqual([]);
  });

  it('todo arquivo das exceções existe e ainda contém o termo', () => {
    const problemas: string[] = [];
    for (const [termo, { arquivos: lista }] of Object.entries(EXCECOES)) {
      const re = TERMOS.find(t => t.termo === termo)?.re;
      if (!re) { problemas.push(`${termo}: não está na tabela TERMOS`); continue; }
      for (const r of lista) {
        const cheio = join(RAIZ, r);
        if (!existsSync(cheio)) { problemas.push(`${termo}: ${r} não existe`); continue; }
        if (!re.test(readFileSync(cheio, 'utf8'))) problemas.push(`${termo}: ${r} já não tem o termo — tire a linha`);
      }
    }
    expect(problemas, problemas.join('\n')).toEqual([]);
  });

  it('todo caminho de código citado no livrinho e na ficha existe', () => {
    const sumidos: string[] = [];
    for (const r of [BOOKLET, FICHA]) {
      const cheio = join(RAIZ, r);
      if (!existsSync(cheio)) continue;
      const texto = readFileSync(cheio, 'utf8');
      for (const m of texto.matchAll(/`((?:src|functions|workers|desktop|public)\/[^`\s]+?\.(?:ts|tsx|js|html|png))`/g)) {
        if (!existsSync(join(RAIZ, m[1]))) sumidos.push(`${r} cita ${m[1]}`);
      }
    }
    expect(sumidos, sumidos.join('\n')).toEqual([]);
  });
});
