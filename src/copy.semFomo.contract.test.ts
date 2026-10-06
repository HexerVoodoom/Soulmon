// ---------------------------------------------------------------------------
// PROIBIÇÃO #15 — "Nunca 'última chance' / FOMO que tira".
//
// Fonte: `docs/manual/01-VISAO.md` §7 (era "travada por TESE"); régua
// proposta em `docs/reviews/2026-09-21-qa-geral/09-guardas.md` §2 #15 e
// escrita na rodada QA de 21/09/2026 (noite), guarda linha-vermelha.
//
// Duas réguas, porque FOMO tem duas formas:
//
//  (a) COPY — a frase que tira: "última chance", "só hoje", "antes que
//      acabe", "não perca", contagem regressiva de oferta. Varre todo texto
//      que alcança o jogador: `src/components/**`, `src/utils/i18n.ts`,
//      `functions/api/_pushCopy.js`, `workers/*.js` (o push é a superfície
//      mais tentadora para isso), `public/*.html`, e as strings do widget
//      Android. Comentário é ignorado — um comentário PRECISA poder dizer
//      "nunca 'última chance'" (é como `UnlockAccountModal.tsx` e
//      `EvolutionPath.tsx` explicam por que NÃO usam).
//
//  (b) MECÂNICA — a vitrine que expira: nenhum item de `ALL_SHOP_ITEMS` /
//      `SPECIAL_ITEMS` carrega prazo (`expiresAt`, `until`, `endsAt`,
//      `availableUntil`, `limited`). Loja do Soulmon vende item determinado,
//      sempre disponível (`REGISTRO-DE-DECISOES.md` "Nada de conteúdo
//      aleatório vendido"). Buff consumível com `expiresAt` (`PlayCard.tsx`)
//      é EFEITO de item, não vitrine — não entra aqui.
//
// Se este teste cair, a saída não é afrouxar a regex: é apagar a frase.
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_SHOP_ITEMS, SPECIAL_ITEMS } from './utils/shop';
import { soulLevelLine } from './utils/soulXP';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

/** Frases de FOMO, PT e EN. Palavra inteira onde a raiz é ambígua. */
const FOMO: RegExp[] = [
  /[úu]ltima chance/i,
  /last chance/i,
  /\bs[óo] hoje\b/i,
  /\bapenas hoje\b/i,
  /\bonly today\b/i,
  /\btoday only\b/i,
  /antes que acabe/i,
  /before it'?s gone/i,
  /\bn[ãa]o perca\b/i,
  /don'?t miss/i,
  /\boferta (?:acaba|termina|expira)/i,
  /\boffer (?:ends|expires)/i,
  /\b(?:acaba|termina|expira) em \d/i,
  /\b(?:ends|expires) in \d/i,
  /tempo limitado/i,
  /limited[- ]time/i,
  /\bcorra\b(?! o m[áa]ximo)/i, // "corra o máximo que conseguir" é instrução do jogo de correr
  /\bhurry\b/i,
];

const EXTENSOES = /\.(ts|tsx|js|mjs|html|kt|xml)$/;

function anda(dir: string, saida: string[]) {
  if (!existsSync(dir)) return;
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    if (statSync(cheio).isDirectory()) { anda(cheio, saida); continue; }
    if (!EXTENSOES.test(nome)) continue;
    if (/\.(test|spec)\.(ts|tsx|js)$/.test(nome)) continue;
    saida.push(cheio);
  }
}

/** Onde o texto alcança o jogador. */
function superficies(): string[] {
  const saida: string[] = [];
  anda(join(RAIZ, 'src', 'components'), saida);
  anda(join(RAIZ, 'workers'), saida);
  // QA rodada 2 (22/09/2026): `src/utils` tem copy do jogador (missões,
  // conquistas, oráculo, pesadelos…) e não era varrido — mutação
  // "Última chance" em `missions.ts` ficou verde.
  anda(join(RAIZ, 'src', 'utils'), saida);
  anda(join(RAIZ, 'android', 'app', 'src', 'main', 'java'), saida);
  anda(join(RAIZ, 'android', 'app', 'src', 'main', 'res', 'values'), saida);
  // ⚠️ WP4.29 (22/09/2026): `src/App.tsx` NÃO era varrido, e é onde mora o
  // slot de avisos da Home — a superfície que o jogador lê todo dia. A lacuna
  // era pré-existente e ficou exposta quando o aviso da incubação entrou ali:
  // ele só estava coberto pela varredura do R-I, que olha contagem de tempo,
  // não FOMO. Achado pelo `soulmon-guarda-permanencia` na verificação do
  // aceite. É um arquivo só porque `src/` inteiro arrastaria os testes.
  for (const f of ['src/App.tsx', 'functions/api/_pushCopy.js']) {
    const cheio = join(RAIZ, f);
    if (existsSync(cheio)) saida.push(cheio);
  }
  const pub = join(RAIZ, 'public');
  if (existsSync(pub)) {
    for (const nome of readdirSync(pub)) if (/\.html$/.test(nome)) saida.push(join(pub, nome));
  }
  return saida;
}

// Tira comentários de linha, de bloco (também os de JSX) e de HTML. Grosseiro
// de propósito: erra para o lado de deixar código passar, nunca de esconder
// string. Uma URL com barras duplas dentro de string vira falso-corte só se a
// frase proibida vier DEPOIS dela na mesma linha — aceitável.
function semComentarios(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

describe('proibição #15 — nenhuma frase de "última chance" alcança o jogador', () => {
  const arquivos = superficies();

  it('a varredura tem chão embaixo (superfícies existem)', () => {
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos.some(a => a.endsWith('_pushCopy.js'))).toBe(true);
    expect(arquivos.some(a => /SettingsPage\.tsx$/.test(a))).toBe(true);
    expect(arquivos.some(a => /src[/\\]App\.tsx$/.test(a)), 'App.tsx fora da varredura').toBe(true);
  });

  it('nenhuma superfície contém frase de FOMO fora de comentário', () => {
    const violacoes: string[] = [];
    for (const arquivo of arquivos) {
      const linhas = semComentarios(readFileSync(arquivo, 'utf8')).split('\n');
      linhas.forEach((linha, i) => {
        for (const re of FOMO) {
          if (re.test(linha)) {
            violacoes.push(`${relative(RAIZ, arquivo).split('\\').join('/')}:${i + 1} ~ ${re} :: ${linha.trim().slice(0, 120)}`);
          }
        }
      });
    }
    expect(violacoes, violacoes.join('\n')).toEqual([]);
  });
});

describe('proibição #15 — a vitrine não expira', () => {
  const CAMPOS_DE_PRAZO = ['expiresAt', 'expires', 'until', 'availableUntil', 'endsAt', 'ends', 'deadline', 'limited', 'countdown', 'seasonalUntil'];

  it('nenhum item da loja (Bits ou Emblemas) carrega campo de prazo', () => {
    for (const item of ALL_SHOP_ITEMS) {
      for (const campo of CAMPOS_DE_PRAZO) {
        expect(item, `${item.id} tem ${campo}`).not.toHaveProperty(campo);
      }
    }
  });

  it('nenhum item especial da pastinha carrega campo de prazo', () => {
    for (const [emoji, item] of Object.entries(SPECIAL_ITEMS)) {
      for (const campo of CAMPOS_DE_PRAZO) {
        expect(item, `${emoji} tem ${campo}`).not.toHaveProperty(campo);
      }
    }
  });

  it('a descrição de nenhum item promete escassez de tempo', () => {
    for (const item of ALL_SHOP_ITEMS) {
      for (const texto of [item.namePt, item.nameEn, item.descPt, item.descEn]) {
        for (const re of FOMO) expect(texto, `${item.id}: "${texto}"`).not.toMatch(re);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// COMBATE V3 / PR2 — o level do Soulmon DESCE na degeneração (derivado de
// perfectDays), e o texto que o mostra tem de ser neutro: explica a regra
// e promete a volta, sem falar em perda, queda ou castigo. EN primeiro, depois
// PT-BR. A régua é por FRASE de perda, e a função textoDeLevelSemPerda é
// exportável só para a prova de vermelho abaixo.
// ---------------------------------------------------------------------------
const PERDA: RegExp[] = [
  /perdeu/i, /perdi/i, /\bperda\b/i, /rebaix/i, /\bca[iíu]/i, /castig/i, /\bpuni/i,
  /\blost\b/i, /\blose\b/i, /\bdemot/i, /\bdrop(?:ped)?\b/i, /\bpunish/i, /\bpenalt/i, /\bfell\b/i,
];
export function textoDeLevelSemPerda(texto: string): string[] {
  return [...PERDA, ...FOMO].filter(re => re.test(texto)).map(String);
}

describe('combate v3 — o texto do level que desceu é neutro (semFomo)', () => {
  const textos = ['en-US', 'pt-BR'].flatMap(lang => [1, 6, 7, 21, 40].map(lv => soulLevelLine(lv, true, lang)));

  it('nenhuma frase de perda ou FOMO nas duas línguas (EN primeiro)', () => {
    for (const t of textos) expect(textoDeLevelSemPerda(t), t).toEqual([]);
  });

  it('PROVA DE VERMELHO: uma string com perdeu / lost reprova', () => {
    expect(textoDeLevelSemPerda('Lv 6 · seu Soulmon perdeu um level')).not.toEqual([]);
    expect(textoDeLevelSemPerda('Lv 6 · your Soulmon lost a level')).not.toEqual([]);
  });
});
