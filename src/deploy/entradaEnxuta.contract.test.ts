/**
 * CONTRATO — o que só serve depois do primeiro paint NÃO mora no chunk de entrada.
 *
 * Rodada 6 (04/10/2026, perf): o `index-*.js` tinha crescido para 893 KB. Cortamos
 * ~350 KB com `import()`/`React.lazy`: a luta do pesadelo (BattleStage, usePveBattle,
 * combatFx, attackFxArt), o catálogo de atividades, o motor do Oráculo e as perguntas
 * do ritual. Basta UM import estático novo para tudo voltar sem ninguém notar —
 * o guard de bytes só cobra acima da folga. Este teste cobra a NATUREZA: nenhuma
 * string exclusiva dessas fontes pode aparecer no chunk de entrada (mesmo método de
 * `oracleBundleSplit.contract.test.ts`). Exige `npm run build` antes.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const DIST = join(RAIZ, 'dist');
const ASSETS = join(DIST, 'assets');

/** [fonte onde a string existe, string só dela]. */
const SENTINELAS: ReadonlyArray<readonly [string, string]> = [
  ['src/utils/oracle/motor.ts', 'Carries a trace of its previous cycle'],
  ['src/utils/attackFxArt.ts', 'fx-fogo-cast'], // nome do PNG, entra no glob
  ['src/data/activityCatalog.ts', 'Log a difficult thought'],
  ['src/utils/oracle.ts', 'Where do you imagine yourself living?'],
];

describe('bundle — chunk de entrada enxuto', () => {
  it('as sentinelas existem de fato na fonte (senão o teste não prova nada)', () => {
    for (const [fonte, s] of SENTINELAS) {
      if (fonte.endsWith('attackFxArt.ts')) {
        expect(readdirSync(join(RAIZ, 'src/assets/soulmon/fx-ataque')).some(f => f.includes(s)), s).toBe(true);
      } else {
        expect(readFileSync(join(RAIZ, fonte), 'utf8'), `${fonte}: ${s}`).toContain(s);
      }
    }
  });

  it('index-*.js (entrada) não contém nenhuma sentinela — e cada uma vive num chunk próprio', () => {
    expect(existsSync(join(DIST, 'index.html')), 'rode `npm run build` antes').toBe(true);
    const m = readFileSync(join(DIST, 'index.html'), 'utf8').match(/src="\/assets\/(index-[A-Za-z0-9_-]+\.js)"/);
    expect(m, 'dist/index.html não referencia index-*.js').not.toBeNull();
    const entrada = readFileSync(join(ASSETS, m![1]), 'utf8');
    const chunks = readdirSync(ASSETS).filter(f => f.endsWith('.js') && f !== m![1]).map(f => readFileSync(join(ASSETS, f), 'utf8'));
    const vazadas = SENTINELAS.filter(([, s]) => entrada.includes(s)).map(([, s]) => s);
    expect(vazadas, `no chunk de entrada ${m![1]}`).toEqual([]);
    const orfas = SENTINELAS.filter(([, s]) => !chunks.some(c => c.includes(s))).map(([, s]) => s);
    expect(orfas, 'sentinela sumiu do bundle inteiro (renomeada?) — o teste deixou de provar').toEqual([]);
  });
});
