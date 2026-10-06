/**
 * Guard: o manual (`docs/manual/`) e o `CLAUDE.md` não afirmam como VIVO o que o combate v3
 * apagou.
 *
 * O PR10 reescreveu o Guia e o Glossário e deixou um critério de fora: um grep de menções
 * obsoletas. Medido em 06/10/2026, sobre `origin/main`, três textos ainda ensinavam o motor
 * antigo da Masmorra como se existisse — `TIER_BASE` + `hpMult`/`atkMult` e a tabela
 * `PLAYER_STATS`/`playerStatsFor` na §51, `PLAYER_STATS` no Glossário e no `CLAUDE.md`.
 * Quem lê "Stats do jogador: `PLAYER_STATS`" procura o símbolo, não acha, e desconfia do
 * resto do doc inteiro (ou, pior, reintroduz a tabela).
 *
 * Regra: um símbolo/afirmação obsoleto só pode aparecer numa linha que o declare MORTO
 * (⚰️, "saiu", "apagado", "removido", negação explícita). Linha afirmativa sem marca = vermelho.
 * Os símbolos são conferidos CONTRA O CÓDIGO (não existem mais em `src/` fora de teste) —
 * senão o guard travaria um nome que voltou a ser legítimo.
 *
 * Cabeçalhos `> **Dono:**` narram histórico e ficam de fora.
 *
 * Para acrescentar uma menção obsoleta: uma linha em `OBSOLETAS`, com o motivo. Para uma
 * menção legítima que o guard barrou: marque a linha como lápide no texto (é o certo), não
 * afrouxe o regex.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ESCOLAS_SKILL } from './utils/soulProfile/ficha/types';

const ROOT = process.cwd();

const mdEm = (dir: string): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...mdEm(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out.sort();
};

const ARQUIVOS = [join(ROOT, 'CLAUDE.md'), ...mdEm(join(ROOT, 'docs/manual'))];

interface Linha { arq: string; n: number; texto: string }
const linhas = (arqs: string[]): Linha[] => arqs.filter(existsSync).flatMap(arq =>
  readFileSync(arq, 'utf8').split(/\r?\n/)
    .map((texto, i) => ({ arq: relative(ROOT, arq).replace(/\\/g, '/'), n: i + 1, texto }))
    .filter(l => !l.texto.startsWith('> **Dono:**')));

/** A linha declara que a coisa está morta/ausente (lápide ou negação). */
const MORTA = /⚰️|\bsa(?:iu|íram|iram)\b|apagad[oa]s?|removid[oa]s?|\bnão (?:é|são|existe|existem|tem|têm|há|usa|usam)\b|\bNÃO\b|\bnunca\b|\bSEM\b|\bsem\b|não é mais/;

interface Obsoleta {
  /** O que o guard procura. */
  re: RegExp;
  /** Por que está morto. */
  motivo: string;
  /** Se `true`, nem lápide salva (a frase em si é sempre errada). */
  semAbrigo?: boolean;
}

const OBSOLETAS: Obsoleta[] = [
  { re: /\+3 (?:de|em) atributo|\+3 atributo/i, motivo: 'chips de "+3 de atributo" saíram da ficha (o ganho é por level/Vínculo, não um +3 fixo)', semAbrigo: true },
  { re: /\bPLAYER_STATS\b|\bplayerStatsFor\b/, motivo: 'tabela de stats por estágio apagada no PR4 (o jogador é o `soulCombatant` do level)' },
  { re: /\busePveBattle\b/, motivo: 'hook apagado no PR4 (a Masmorra/Pesadelo usam o núcleo `utils/combate/`)' },
  { re: /\bTIER_BASE\b/, motivo: 'tabela de base por tier apagada no PR4 (`dungeonFoe` é relativo ao level)' },
  { re: /\b(?:hpMult|atkMult|speedBump)\b|\bdmgReduction\s*=\s*min\(/, motivo: 'multiplicadores do motor antigo da Masmorra, apagados no PR4' },
  { re: /torcida (?:na|no|da|do) (?:Masmorra|Pesadelo)|gauge (?:do|da|de)[^.\n|]{0,24}(?:Masmorra|Pesadelo)|(?:Masmorra|Pesadelo)(?: e (?:o )?(?:Masmorra|Pesadelo))? (?:têm|tem|com|ganha|usa)(?: a)? torcida/i, motivo: 'a Masmorra e o Pesadelo NÃO têm torcida (contexto §2.19, 06/10/2026)' },
  { re: /evocacao[^.\n|]{0,60}escola (?:de )?skill|escola (?:de )?skill[^.\n|]{0,40}evocacao/i, motivo: '`evocacao` deixou de ser escola de SKILL no PR9b (segue só como pontos da ficha)' },
];

describe('docs/manual e CLAUDE.md × o que o combate v3 apagou', () => {
  const todas = linhas(ARQUIVOS);

  it('AUTOVERIFICAÇÃO: há texto para varrer e o guard barra uma afirmação obsoleta', () => {
    expect(todas.length).toBeGreaterThan(1000);
    const barra = (texto: string) => OBSOLETAS.some(o => o.re.test(texto) && (o.semAbrigo || !MORTA.test(texto)));
    expect(barra('Stats do jogador: `PLAYER_STATS` (`src/utils/dungeon.ts`), por estágio.')).toBe(true);
    expect(barra('Sobre `TIER_BASE`, com `step` = max(0, level − 1)')).toBe(true);
    expect(barra('A Masmorra tem torcida: toque na cena enche a barra.')).toBe(true);
    expect(barra('Cada chip dá +3 de atributo.')).toBe(true);
    expect(barra('`evocacao` é a escola de skill do mago.')).toBe(true);
    // e a lápide/negação é aceita:
    expect(barra('⚰️ `PLAYER_STATS` saiu no PR4.')).toBe(false);
    expect(barra('Masmorra e Pesadelo não têm torcida.')).toBe(false);
    expect(barra('o `usePveBattle` foi apagado')).toBe(false);
  });

  it('o código confirma: os símbolos barrados NÃO existem mais em src/ (fora de teste)', () => {
    const fontes: string[] = [];
    const anda = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules') anda(p); continue; }
        if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) fontes.push(readFileSync(p, 'utf8'));
      }
    };
    anda(join(ROOT, 'src'));
    const codigo = fontes.join('\n');
    for (const simbolo of ['PLAYER_STATS', 'playerStatsFor', 'usePveBattle', 'TIER_BASE']) {
      const comoDefinicao = new RegExp(`(?:export\\s+)?(?:const|function|let|type|interface)\\s+${simbolo}\\b`);
      expect(comoDefinicao.test(codigo), `${simbolo} voltou a existir: tire-o de OBSOLETAS`).toBe(false);
    }
    expect((ESCOLAS_SKILL as readonly string[]).includes('evocacao'), '`evocacao` voltou a ser escola de skill').toBe(false);
  });

  for (const o of OBSOLETAS) {
    it(`nenhuma linha afirma como vivo: ${o.re.source.slice(0, 48)}…`, () => {
      const achadas = todas
        .filter(l => o.re.test(l.texto) && (o.semAbrigo || !MORTA.test(l.texto)))
        .map(l => `${l.arq}:${l.n} — ${o.motivo}\n    ${l.texto.trim().slice(0, 160)}`);
      expect(achadas, 'texto obsoleto afirmado como vivo').toEqual([]);
    });
  }
});
