/**
 * Guard: o TEXTO do combate (GuideModal, HelpModal, `docs/manual/`) não cita um número
 * de combate diferente do que o código declara.
 *
 * O PR10 reescreveu o Guia e o Glossário do combate v3 e deixou dois critérios de fora;
 * este arquivo é o primeiro: o número em prosa (`teto de 5%`, `Vínculo 5`, `até 20`,
 * `25%`) é uma CÓPIA da constante, e cópia diverge em silêncio (footgun 9 do CLAUDE.md).
 * A fonte é sempre o módulo; o texto é que muda.
 *
 * Duas frentes, ambas lendo os VALORES por import (nunca por regex no fonte):
 *
 *  1. PROSA: padrões que ancoram o número a uma constante famosa — o teto único
 *     (`COMBAT_BONUS_CAP`), os portões (`GATES`), os pontos de talento
 *     (`TALENT_POINTS_MAX`) e o câmbio de Créditos (`CREDIT_BITS_CAP_RATIO`).
 *  2. NOMEADA: todo `` `NOME` (N) `` / `` `NOME` = N `` / `` `NOME` (const) — `N` `` de qualquer
 *     constante numérica exportada por `src/utils/combate/*` (mais as quatro acima) e de
 *     cada campo de `CHEER` tem de bater com o valor real.
 *
 * Fora do escopo, de propósito: linhas de cabeçalho (`> **Dono:**`, que narram o histórico
 * de verificação com números antigos) e linhas com ⚰️ (lápide: o número velho é o ponto).
 *
 * A AUTOVERIFICAÇÃO prova que o guard enxerga: acha ocorrências reais nos textos e, dado um
 * texto com o número trocado, aponta a divergência. Sem isso um regex que parou de casar
 * ficaria verde para sempre.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as bonus from './utils/combate/bonus';
import * as curve from './utils/combate/curve';
import * as duel from './utils/combate/duel';
import * as fight from './utils/combate/fight';
import * as level from './utils/combate/level';
import * as ruler from './utils/combate/ruler';
import * as specials from './utils/combate/specials';
import * as talents from './utils/talents';
import * as bitsOrigin from './utils/bitsOrigin';
import { COMBAT_BONUS_CAP } from './utils/combate/bonus';
import { GATES, MASMORRA_ALTO_A_PARTIR_DO_ANDAR } from './utils/gates';
import { TALENT_POINTS_MAX } from './utils/talents';
import { CREDIT_BITS_CAP_RATIO } from './utils/bitsOrigin';

const ROOT = process.cwd();

// ── fontes de texto ────────────────────────────────────────────────────────────
const mdEm = (dir: string): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...mdEm(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out.sort();
};

const FONTES = [
  join(ROOT, 'src/components/GuideModal.tsx'),
  join(ROOT, 'src/components/HelpModal.tsx'),
  ...mdEm(join(ROOT, 'docs/manual')),
];

interface Linha { arq: string; n: number; texto: string }
const linhasDe = (arq: string): Linha[] =>
  readFileSync(arq, 'utf8').split(/\r?\n/)
    .map((texto, i) => ({ arq: relative(ROOT, arq).replace(/\\/g, '/'), n: i + 1, texto }))
    .filter(l => !l.texto.startsWith('> **Dono:**') && !l.texto.includes('⚰️'));

/** O número como o texto escreve: `1,7` (pt-BR), `0.05` (en) ou `5`. */
const num = (s: string) => Number(s.replace(',', '.'));
const perto = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// ── 1. PROSA ───────────────────────────────────────────────────────────────────
interface Regra { nome: string; esperado: number[]; re: RegExp }
/** Valores aceitos para um percentual: o inteiro (`5`) e a fração (`0,05`). */
const pct = (frac: number) => [Math.round(frac * 100 * 1e6) / 1e6, frac];

const PROSA: Regra[] = [
  { nome: 'COMBAT_BONUS_CAP', esperado: pct(COMBAT_BONUS_CAP), re: /\bteto(?: único| global)? de (\d+(?:[.,]\d+)?) ?%(?! do ganho| of the free| sobre o ritmo)/gi },
  { nome: 'COMBAT_BONUS_CAP', esperado: pct(COMBAT_BONUS_CAP), re: /(\d+(?:[.,]\d+)?) ?% (?:de força|strength)/gi },
  { nome: 'COMBAT_BONUS_CAP', esperado: pct(COMBAT_BONUS_CAP), re: /\b(?:no máximo|at most) (\d+(?:[.,]\d+)?) ?% (?:de força|strength)/gi },
  { nome: 'TALENT_POINTS_MAX', esperado: [TALENT_POINTS_MAX], re: /(?:Vínculo|Bond) \((?:até|up to) (\d+)\)/g },
  { nome: 'TALENT_POINTS_MAX', esperado: [TALENT_POINTS_MAX], re: /Pontos de talento = Vínculo, até `?\w*`? ?\((\d+)\)/g },
  { nome: 'CREDIT_BITS_CAP_RATIO', esperado: pct(CREDIT_BITS_CAP_RATIO), re: /\+(\d+) ?% (?:sobre o ritmo|over the free)/g },
  { nome: 'CREDIT_BITS_CAP_RATIO', esperado: pct(CREDIT_BITS_CAP_RATIO), re: /\bteto de (\d+(?:[.,]\d+)?) ?% do ganho/gi },
  { nome: 'GATES.pvp', esperado: [GATES.pvp.minBond], re: /(?:Arena|Duelo|Duel)(?: e (?:o )?Torneio| and the Tournament)? (?:abre|abrem|open|opens) (?:no|at) (?:Vínculo|Bond) (\d+)/gi },
  { nome: 'GATES.torneio', esperado: [GATES.torneio.minBond], re: /Torneio (?:abre|abrem|opens?) (?:no|at) (?:Vínculo|Bond) (\d+)/gi },
  { nome: 'GATES.pvp (Arena/PvP e Torneio no Vínculo N)', esperado: [GATES.pvp.minBond], re: /Arena\/PvP e Torneio no Vínculo (\d+)/g },
  { nome: 'GATES.masmorraAlto', esperado: [GATES.masmorraAlto.minBond], re: /andares altos da Masmorra[^.\n]{0,60}? no (\d+)\b/g },
  { nome: 'GATES.renascimento', esperado: [GATES.renascimento.minBond], re: /Renascimento no (\d+)\b/g },
  { nome: 'MASMORRA_ALTO_A_PARTIR_DO_ANDAR', esperado: [MASMORRA_ALTO_A_PARTIR_DO_ANDAR], re: /a partir do andar (\d+)\b/g },
  { nome: 'MAX_SHARE/MIN_SHARE', esperado: [level.MIN_SHARE * 100], re: /fatias de (\d+) ?% a \d+ ?%/g },
  { nome: 'MAX_SHARE/MIN_SHARE', esperado: [level.MAX_SHARE * 100], re: /fatias de \d+ ?% a (\d+) ?%/g },
];

// ── 2. NOMEADA ─────────────────────────────────────────────────────────────────
/** Toda constante numérica exportada, por nome. `CHEER.campo` entra achatado. */
function constantes(): Map<string, number> {
  const m = new Map<string, number>();
  const mods: Array<Record<string, unknown>> = [bonus, curve, duel, fight, level, ruler, specials, talents, bitsOrigin];
  for (const mod of mods) {
    for (const [k, v] of Object.entries(mod)) {
      if (typeof v === 'number' && Number.isFinite(v)) m.set(k, v);
    }
  }
  for (const [k, v] of Object.entries(specials.CHEER as Record<string, unknown>)) {
    if (typeof v === 'number') m.set(`CHEER.${k}`, v);
  }
  return m;
}
const CONST = constantes();

/** `` `NOME` (N) ``, `` `NOME` = N ``, `` `NOME` (const) — `N` ``. O `%` é aceito (25% ≙ 0,25). */
const NOMEADA = /`([A-Za-z_][\w.]*)`\s*(?:\((?:const\)\s*—\s*`)?|=\s*`?|\(const\)\s*—\s*`?)(\d+(?:[.,]\d+)?)\s*(%?)/g;

interface Divergencia { onde: string; nome: string; texto: number; real: number }

function divergenciasNomeadas(linhas: Linha[]): { achou: number; erros: Divergencia[] } {
  let achou = 0;
  const erros: Divergencia[] = [];
  for (const l of linhas) {
    for (const m of l.texto.matchAll(NOMEADA)) {
      const real = CONST.get(m[1]);
      if (real === undefined) continue; // constante de outro domínio (ou texto livre)
      achou++;
      const dito = num(m[2]);
      const ok = m[3] === '%' ? perto(dito, real * 100) || perto(dito, real) : perto(dito, real) || perto(dito, real * 100);
      if (!ok) erros.push({ onde: `${l.arq}:${l.n}`, nome: m[1], texto: dito, real });
    }
  }
  return { achou, erros };
}

function divergenciasProsa(linhas: Linha[]): { achou: number; erros: string[] } {
  let achou = 0;
  const erros: string[] = [];
  for (const l of linhas) {
    for (const r of PROSA) {
      for (const m of l.texto.matchAll(r.re)) {
        achou++;
        const dito = num(m[1]);
        if (!r.esperado.some(e => perto(dito, e))) {
          erros.push(`${l.arq}:${l.n} — ${r.nome}: o texto diz ${dito}, o código diz ${r.esperado[0]}`);
        }
      }
    }
  }
  return { achou, erros };
}

const TODAS = FONTES.filter(existsSync).flatMap(linhasDe);

describe('texto do combate × constantes do código', () => {
  it('AUTOVERIFICAÇÃO: as fontes existem e o guard enxerga ocorrências reais nas duas frentes', () => {
    expect(FONTES.every(existsSync), 'GuideModal/HelpModal/manual ausentes').toBe(true);
    expect(CONST.get('COMBAT_BONUS_CAP')).toBe(COMBAT_BONUS_CAP);
    expect(CONST.has('CHEER.energyPerDischarge')).toBe(true);
    expect(divergenciasProsa(TODAS).achou, 'nenhuma citação em prosa achada — regex morto?').toBeGreaterThanOrEqual(4);
    expect(divergenciasNomeadas(TODAS).achou, 'nenhuma citação nomeada achada — regex morto?').toBeGreaterThanOrEqual(8);
  });

  it('AUTOVERIFICAÇÃO: um número trocado no texto é apontado (o guard não é decorativo)', () => {
    const ruim = (texto: string): Linha[] => [{ arq: 'falso.md', n: 1, texto }];
    const cap = Math.round(COMBAT_BONUS_CAP * 100) + 1;
    expect(divergenciasProsa(ruim(`tudo passa por UM teto de ${cap}%`)).erros).toHaveLength(1);
    expect(divergenciasProsa(ruim(`A Arena e o Torneio abrem no Vínculo ${GATES.pvp.minBond + 1}.`)).erros).not.toHaveLength(0); // pvp e torneio casam a mesma frase
    expect(divergenciasProsa(ruim(`cada Vínculo (até ${TALENT_POINTS_MAX + 1}) rende um ponto`)).erros).toHaveLength(1);
    expect(divergenciasNomeadas(ruim(`o piso \`MIN_SHARE\` = ${level.MIN_SHARE + 0.07}`)).erros).toHaveLength(1);
    expect(divergenciasNomeadas(ruim(`o câmbio cabe em \`CREDIT_BITS_CAP_RATIO\` (${Math.round(CREDIT_BITS_CAP_RATIO * 100) + 5}%)`)).erros).toHaveLength(1);
    // e o número CERTO passa:
    expect(divergenciasProsa(ruim(`tudo passa por UM teto de ${Math.round(COMBAT_BONUS_CAP * 100)}%`)).erros).toEqual([]);
    expect(divergenciasNomeadas(ruim(`\`TALENT_POINTS_MAX\` (${TALENT_POINTS_MAX})`)).erros).toEqual([]);
  });

  it('PROSA: teto único, portões, pontos de talento e câmbio batem com o código em GuideModal, HelpModal e manual', () => {
    expect(divergenciasProsa(TODAS).erros).toEqual([]);
  });

  it('NOMEADA: `CONSTANTE` (N) / = N no manual bate com o valor exportado', () => {
    expect(divergenciasNomeadas(TODAS).erros).toEqual([]);
  });

  it('GuideModal e HelpModal não repetem o número como literal: leem a constante', () => {
    // O número do teto/portão/pontos entra por `${...}` — um literal no JSX seria uma 2ª cópia.
    for (const f of ['GuideModal.tsx', 'HelpModal.tsx']) {
      const src = readFileSync(join(ROOT, 'src/components', f), 'utf8');
      expect(src, `${f}: "teto de N%" literal`).not.toMatch(/teto (?:único )?de \d+ ?%/i);
      expect(src, `${f}: "Vínculo N" de portão literal`).not.toMatch(/(?:abre|abrem) no Vínculo \d/);
      expect(src, `${f}: "(até N)" literal`).not.toMatch(/Vínculo \(até \d+\)/);
    }
  });
});
