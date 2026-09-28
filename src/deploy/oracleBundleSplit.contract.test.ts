/**
 * CONTRATO — as famílias visuais do Oráculo NÃO moram no chunk de entrada.
 *
 * Fase 2 do Oráculo (28/09/2026): `CREATURE_FAMILIES`/`MOTIVO_ELEMENTO_CLASSE`
 * saíram para `src/utils/oracle/familias.ts`, carregado só por
 * `generateOracleAsync` via `import()`. Basta UM import estático novo (de
 * `oracle.ts` ou de qualquer módulo do caminho síncrono) para os ~22 KB
 * voltarem ao `index-*.js` sem ninguém perceber — o guard de bytes só cobra
 * acima da folga. Este teste cobra a NATUREZA: nenhum VALOR string exclusivo
 * de `familias.ts` pode aparecer no chunk de entrada (chaves e nomes de
 * `const` o minificador renomeia; valores string, não).
 *
 * Provado vermelho: com `import * as F from './oracle/familias'` estático
 * reintroduzido em `oracle.ts` (e usado), o build pôs as sentinelas no
 * `index-*.js` e este teste falhou (corpo do PR da Fase 2, PR 4).
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(__dirname, '../..', 'dist');
const ASSETS = join(DIST, 'assets');

/** Strings que só existem em `familias.ts` (conferido por grep em src/). */
const SENTINELAS = ['stalagmite', 'crackling spark markings', 'glowing rune markings'];

describe('bundle — famílias do Oráculo fora do chunk de entrada', () => {
  const htmlPath = join(DIST, 'index.html');

  it('as sentinelas existem de fato na fonte (senão o teste não prova nada)', () => {
    const fonte = readFileSync(resolve(__dirname, '../utils/oracle/familias.ts'), 'utf8');
    for (const s of SENTINELAS) expect(fonte, s).toContain(s);
  });

  it('index-*.js (entrada) não contém nenhuma string de CREATURE_FAMILIES/MOTIVO_ELEMENTO_CLASSE', () => {
    expect(existsSync(htmlPath), 'rode `npm run build` antes').toBe(true);
    const m = readFileSync(htmlPath, 'utf8').match(/src="\/assets\/(index-[A-Za-z0-9_-]+\.js)"/);
    expect(m, 'dist/index.html não referencia index-*.js').not.toBeNull();
    const entrada = readFileSync(join(ASSETS, m![1]), 'utf8');
    const vazadas = SENTINELAS.filter(s => entrada.includes(s));
    expect(vazadas, `famílias no chunk de entrada ${m![1]}`).toEqual([]);
  });

  it('as famílias estão num chunk próprio (o import() dinâmico existe)', () => {
    const chunks = readdirSync(ASSETS).filter(f => /^familias-.*\.js$/.test(f));
    expect(chunks.length).toBeGreaterThan(0);
    const conteudo = readFileSync(join(ASSETS, chunks[0]), 'utf8');
    expect(conteudo).toContain(SENTINELAS[0]);
  });
});
