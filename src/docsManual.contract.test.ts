/**
 * Guard: o manual (`docs/manual/`) não apodrece em silêncio.
 *
 * Cinco travas, todas baratas, todas nascidas de um defeito medido em
 * 09/09/2026 (o `CLAUDE.md` com cinco referências `arquivo:linha` erradas,
 * quatro contagens erradas e docs que nenhum índice alcançava):
 *
 *  (a) todo `.md` de `docs/` (e subpastas) é citado em `docs/manual/00-MAPA.md`
 *      — doc que o índice não alcança é doc que uma sessão nova nunca lê;
 *  (b) todo link relativo dentro do manual resolve para um arquivo que existe;
 *  (c) todo módulo não-teste das árvores de `scripts/docs-inventario.mjs`
 *      (`ARVORES`) tem uma entrada `### \`caminho\`` em `06-REFERENCIA/` —
 *      módulo novo sem entrada fica vermelho aqui, não na próxima auditoria;
 *  (d) nenhum doc do manual cita código por `arquivo:linha` (R1 do método:
 *      a linha escorrega no primeiro commit, o símbolo se reencontra por grep);
 *  (e) todo doc do manual tem cabeçalho com `Dono:` e `Verificação:` (R6).
 *
 * `docs/historico-digiapp/` fica de fora de (a): tem guard próprio em
 * `docsSemMentira.contract.test.ts` e é, por definição, o que NÃO se lê.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ARVORES, modulosDe } from '../scripts/docs-inventario.mjs';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'docs');
const MANUAL = join(DOCS, 'manual');
const MAPA = join(MANUAL, '00-MAPA.md');

const mdEm = (dir: string, ignorar: string[] = []): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (!ignorar.includes(e.name)) walk(p); continue; }
      if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
};

const docsDoManual = () => mdEm(MANUAL);

describe('docs/manual — o mapa alcança tudo e não mente por endereço', () => {
  it('AUTOVERIFICAÇÃO: o manual existe e tem mais de um doc', () => {
    expect(existsSync(MAPA)).toBe(true);
    expect(docsDoManual().length).toBeGreaterThan(5);
  });

  it('(a) todo doc de docs/ é citado no 00-MAPA.md', () => {
    const mapa = readFileSync(MAPA, 'utf8');
    const faltam = mdEm(DOCS, ['historico-digiapp'])
      .map(p => relative(DOCS, p).replace(/\\/g, '/'))
      .filter(rel => rel !== 'manual/00-MAPA.md')
      .filter(rel => !mapa.includes(rel) && !mapa.includes(rel.replace(/^manual\//, '')));
    expect(faltam, 'docs sem entrada no 00-MAPA.md').toEqual([]);
  });

  it('(b) todo link relativo do manual resolve', () => {
    const quebrados: string[] = [];
    for (const doc of docsDoManual()) {
      const src = readFileSync(doc, 'utf8');
      for (const m of src.matchAll(/\]\(([^)\s#]+)(#[^)]*)?\)/g)) {
        const alvo = m[1];
        if (/^(https?:|mailto:)/.test(alvo)) continue;
        const abs = alvo.startsWith('/') ? join(ROOT, alvo) : resolve(dirname(doc), alvo);
        if (!existsSync(abs)) quebrados.push(`${relative(ROOT, doc)} → ${alvo}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it('(c) todo módulo das árvores medidas tem entrada em 06-REFERENCIA/', () => {
    const ref = mdEm(join(MANUAL, '06-REFERENCIA')).map(p => readFileSync(p, 'utf8')).join('\n');
    const semEntrada: string[] = [];
    for (const arvore of ARVORES as string[]) {
      for (const mod of modulosDe(arvore) as string[]) {
        if (!ref.includes('`' + mod + '`')) semEntrada.push(mod);
      }
    }
    expect(semEntrada, 'módulos sem entrada na referência').toEqual([]);
  });

  it('(d) nenhum doc do manual cita código por arquivo:linha', () => {
    const culpados: string[] = [];
    for (const doc of docsDoManual()) {
      readFileSync(doc, 'utf8').split('\n').forEach((l, i) => {
        if (/`[^`\s]+\.(ts|tsx|js|mjs|css|kt|java|json|yml):\d+/.test(l)) culpados.push(`${relative(ROOT, doc)}:${i + 1}`);
      });
    }
    expect(culpados).toEqual([]);
  });

  it('(e) todo doc do manual declara Dono e Verificação no cabeçalho', () => {
    const semCabecalho: string[] = [];
    for (const doc of docsDoManual()) {
      const topo = readFileSync(doc, 'utf8').split('\n').slice(0, 40).join('\n');
      if (!/\*\*Dono:?\*\*|Dono:/.test(topo) || !/\*\*Verificação:?\*\*|Verificação:/.test(topo)) semCabecalho.push(relative(ROOT, doc));
    }
    expect(semCabecalho).toEqual([]);
  });

  it('o inventário exporta as árvores que este guard varre', () => {
    expect((ARVORES as string[]).length).toBeGreaterThan(5);
    expect(statSync(join(ROOT, 'scripts/docs-inventario.mjs')).isFile()).toBe(true);
  });
});
