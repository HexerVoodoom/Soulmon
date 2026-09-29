/**
 * Régua do renomeio de caminhos (29/09/2026, pedido do dono):
 * vírus → poder, dado → harmonia, vacina → benevolência.
 *
 * Varre o FONTE de src/, functions/, workers/, desktop/, android/ e scripts/
 * (e os NOMES de arquivo) e reprova qualquer id/rótulo/emoji antigo de
 * caminho fora da lista EXPLÍCITA abaixo. O dono único da compatibilidade é
 * `src/utils/branchMigration.ts` (save) + `functions/api/_branchLegacy.js`
 * (chaves KV já gravadas) — e nem eles soletram o id inteiro.
 *
 * O `dist/` e os drawables continuam varridos por `sprites.dungeonRoster.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Montados por partes: esta régua não pode ser uma ocorrência dela mesma.
const V = 'vir' + 'us';
const D = 'da' + 'ta';
const A = 'vacc' + 'ine';

export const PROIBIDOS: ReadonlyArray<{ nome: string; re: RegExp }> = [
  { nome: 'id de forma antigo', re: new RegExp(`(champion|ultimate|mega)[-_](${V}|${D}|${A})(?![a-z])`, 'i') },
  { nome: 'campo de pontos antigo', re: new RegExp(`(${V}|${D}|${A})Points`, 'i') },
  { nome: 'ramo antigo (vírus/vacina em qualquer grafia)', re: new RegExp(`${V}|${A}|v[ií]rus|vacina`, 'i') },
  { nome: `ramo '${D}' literal`, re: new RegExp(`(Branch|branch|attr)\\w*\\??\\s*(:|=|===)\\s*['"]${D}['"]`) },
  { nome: 'emoji antigo de chip', re: /\u{1F9A0}|\u{1F4BE}|\u{1F489}/u },
];

/** Exceções DECLARADAS — cada uma com o porquê. */
export const EXCECOES: Readonly<Record<string, string>> = {
  'src/utils/branchRename.contract.test.ts': 'esta régua',
  'src/narrativa.contract.test.ts': 'a régua da narrativa VETA os rótulos antigos (tem de soletrá-los)',
  'src/narrativa.superficies.contract.test.ts': 'idem, nas superfícies',
  'src/components/guild/guildSemCobranca.contract.test.ts': 'veta Vírus/Vacina na copy da Guilda',
  'src/utils/branchMigration.ts': 'migração legada — dono único (emojis antigos como escape \\u{…})',
  'src/utils/branchMigration.test.ts': 'fixtures de save antigo',
  'functions/api/_branchLegacy.js': 'compat de LEITURA das chaves KV antigas (servidor)',
  'src/utils/oracle.ts': 'um comentário-lápide mínimo registra os nomes antigos',
};

const RAIZES = ['src', 'functions', 'workers', 'desktop', 'android', 'scripts'];
const TEXTO = /\.(ts|tsx|js|mjs|cjs|jsx|json|kt|java|xml|css|html|sh|py|gradle)$/;

function arquivos(): string[] {
  const out = execFileSync('git', ['ls-files', '--', ...RAIZES], { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).filter((f) => !f.includes('node_modules'));
}

describe('renomeio de caminhos — nenhum id antigo fora da migração', () => {
  it('nenhum NOME de arquivo carrega o id antigo', () => {
    const ruins = arquivos().filter((f) => PROIBIDOS[0].re.test(f) || new RegExp(`${V}|${A}|chip-${D}`, 'i').test(f));
    expect(ruins).toEqual([]);
  });

  it('nenhum FONTE carrega id, campo, rótulo ou emoji antigo (fora das exceções)', () => {
    const achados: string[] = [];
    for (const f of arquivos()) {
      if (!TEXTO.test(f) || f in EXCECOES) continue;
      if (/\/data\/[^/]+\.json$/.test(f)) continue; // snapshots de dados de terceiros (sync:oracle-data)
      let txt: string;
      try { txt = readFileSync(f, 'utf8'); } catch { continue; }
      txt.split('\n').forEach((l, i) => {
        for (const p of PROIBIDOS) if (p.re.test(l)) achados.push(`${f}:${i + 1} [${p.nome}] ${l.trim().slice(0, 100)}`);
      });
    }
    expect(achados).toEqual([]);
  });

  it('toda exceção ainda existe E ainda contém um termo antigo (senão a linha sobra)', () => {
    const todos = new Set(arquivos());
    // a migração e o teste dela montam os ids por partes: estão na lista para
    // DECLARAR que são o dono, não porque soletrem o termo.
    const donos = new Set(['src/utils/branchMigration.ts', 'src/utils/branchMigration.test.ts']);
    for (const f of Object.keys(EXCECOES)) {
      if (donos.has(f)) continue;
      expect(todos.has(f), `${f} sumiu`).toBe(true);
      const txt = readFileSync(f, 'utf8');
      expect(PROIBIDOS.some((p) => p.re.test(txt)), `${f} não tem mais termo antigo — tire da lista`).toBe(true);
    }
  });
});
