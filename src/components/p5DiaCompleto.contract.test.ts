/**
 * P5 — "dia perfeito" virou "DIA COMPLETO", e a renomeação ficou pela metade.
 *
 * A decisão (07/09/2026, `product/soulmon-01/balance/carga-diaria.md`, P5) é de
 * TOM: o contador nunca decresce, então "perfeito" era pior que o mecanismo —
 * é a palavra que transforma um dia bom em fracasso para quem tem traço
 * perfeccionista. O commit `44b7a7c3` afirmou ter trocado os textos "em 13
 * arquivos". A varredura da sessão de QA (08/09/2026) achou onze strings de
 * interface que continuavam dizendo "perfeito":
 *
 *  · `EvolutionPath` — "Faltam 4 dias perfeitos", a frase que responde "quanto
 *    falta para meu bicho evoluir". O DOCBLOCK do mesmo arquivo já dizia
 *    "dias completos": a renomeação passou pelo comentário e não pela string.
 *  · `HelpModal` — a entrada do GLOSSÁRIO. A convenção do `CLAUDE.md` manda
 *    atualizar `GuideModal` E `HelpModal` ao mexer em regra; só o primeiro foi.
 *  · `desktop/phrases.ts` — a fala do pet no overlay, nos dois idiomas.
 *
 * Os nomes NO CÓDIGO ficam (`perfectDays`, `wasPerfect`, `dayWasPerfect`) — a
 * decisão foi sobre o que o jogador LÊ. Por isso este guard olha só o conteúdo
 * de literais de string, e não identificadores.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const AREAS = ['src', 'functions/api', 'workers', 'desktop/renderer/src'];
const EXTENSOES = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * O ÚNICO arquivo dispensado, e o motivo é que ele está MORTO.
 *
 * `src/utils/i18n.ts` carrega a tabela `translations` do app antigo, consumida
 * por `useLanguage` — que não tem um único chamador fora do próprio
 * `LanguageContext.tsx` (conferido em 08/09/2026). O app inteiro escreve texto
 * com `isPt ? … : …` inline. Enquanto a tabela existir ela vai continuar
 * aparecendo em toda auditoria de texto como falso-positivo; apagá-la é decisão
 * do dono, e está registrada em `docs/STATUS.md`.
 */
const MORTO = ['src/utils/i18n.ts'];

const PROIBIDO = /(dias?\s+perfeitos?|perfect\s+days?)/i;

function arquivos(dir: string, saida: string[] = []): string[] {
  let entradas: string[];
  try { entradas = readdirSync(dir); } catch { return saida; }
  for (const nome of entradas) {
    if (nome === 'node_modules' || nome === 'dist' || nome === 'dist-renderer') continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { arquivos(p, saida); continue; }
    if (!EXTENSOES.some(e => nome.endsWith(e)) || nome.includes('.test.')) continue;
    saida.push(p);
  }
  return saida;
}

/** Conteúdo dos literais de string da linha — aspas simples, duplas e crase. */
function literais(linha: string): string[] {
  const achados: string[] = [];
  for (const m of linha.matchAll(/(['"`])((?:[^\\]|\\.)*?)\1/g)) achados.push(m[2]);
  return achados;
}

describe('P5 — nenhum texto de interface volta a dizer "dia perfeito"', () => {
  it('a renomeação está completa fora da tabela morta', () => {
    const ruins: string[] = [];
    for (const area of AREAS) {
      for (const p of arquivos(join(RAIZ, area))) {
        const rel = p.slice(RAIZ.length + 1).replace(/\\/g, '/');
        if (MORTO.includes(rel)) continue;
        const linhas = readFileSync(p, 'utf8').split('\n');
        linhas.forEach((l, i) => {
          const s = l.trim();
          // Comentário é onde a HISTÓRIA da decisão mora — e ela precisa poder
          // citar o nome antigo para explicar por que ele saiu.
          if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*')) return;
          for (const lit of literais(l)) {
            if (PROIBIDO.test(lit)) ruins.push(`${rel}:${i + 1}  ${lit.slice(0, 60)}`);
          }
        });
      }
    }
    expect(
      ruins,
      'P5 trocou "dia perfeito" por "dia completo" no que o jogador LÊ. Identificador continua igual (`perfectDays`); string de interface, não.',
    ).toEqual([]);
  });

  it('a dispensa da tabela morta continua sendo sobre uma tabela MORTA', () => {
    // Se alguém ligar `useLanguage` de novo, a dispensa vira um buraco — e este
    // caso é o que avisa, em vez de deixar o texto antigo voltar por uma porta
    // que ninguém lembra que existe.
    const usos: string[] = [];
    for (const p of arquivos(join(RAIZ, 'src'))) {
      const rel = p.slice(RAIZ.length + 1).replace(/\\/g, '/');
      if (rel === 'src/contexts/LanguageContext.tsx') continue;
      if (/\buseLanguage\b/.test(readFileSync(p, 'utf8'))) usos.push(rel);
    }
    expect(
      usos,
      'a tabela `translations` de `utils/i18n.ts` voltou a ser usada — tire `src/utils/i18n.ts` da lista MORTO e conserte os textos de lá',
    ).toEqual([]);
  });
});
