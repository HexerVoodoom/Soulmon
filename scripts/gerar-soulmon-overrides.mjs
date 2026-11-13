#!/usr/bin/env node
// Gera `src/utils/soulmonOverrides.data.ts` a partir de um export da Tabela de Soulmons editado pelo dono (REGISTRO §333).
// Uso: node scripts/gerar-soulmon-overrides.mjs <arquivo.csv> [saida.ts]
//
// Aceita os dois formatos que o dono exporta:
//  - posicional, sem cabeçalho: `id,ataque_tipo[,estagio,personalidade,elemento_base]` (linhas `#` são comentário);
//  - com cabeçalho (1ª linha não-comentário começa com `id,`): lê as colunas `id`, `ataque_tipo`, `flutua`, `flip` pelo nome.
// Só o ataque_tipo, flutua e flip viram dado gerado. Estágio, personalidade e elemento mudam a LINHA da criatura e passam
// por validação à mão (`soulmonOverrides.ts`), nunca por este script.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = resolve(process.argv[3] ?? resolve(RAIZ, 'src/utils/soulmonOverrides.data.ts'));
const TIPOS = new Set(['ranged_corte', 'ranged_splash', 'melee_corte', 'melee_splash']);
const SIM = v => /^(sim|s|yes|true|1)$/i.test((v ?? '').trim());

const arq = process.argv[2];
if (!arq) { console.error('uso: node scripts/gerar-soulmon-overrides.mjs <arquivo.csv>'); process.exit(1); }
const linhas = readFileSync(arq, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
let col = { id: 0, ataque_tipo: 1, flutua: -1, flip: -1 };
if (/^id,/.test(linhas[0] ?? '')) {
  const cab = linhas.shift().split(',').map(c => c.trim());
  col = { id: cab.indexOf('id'), ataque_tipo: cab.indexOf('ataque_tipo'), flutua: cab.indexOf('flutua'), flip: cab.indexOf('flip') };
}
const ataque = new Map(); const flutua = []; const flip = []; const ignorados = [];
for (const l of linhas) {
  const c = l.split(',').map(x => x.trim());
  const id = c[col.id];
  const tipo = col.ataque_tipo >= 0 ? c[col.ataque_tipo] : undefined;
  if (!id) continue;
  if (tipo && TIPOS.has(tipo)) ataque.set(id, tipo); else if (tipo) ignorados.push(`${id}: ataque_tipo '${tipo}'`);
  if (col.flutua >= 0 && SIM(c[col.flutua])) flutua.push(id);
  if (col.flip >= 0 && SIM(c[col.flip])) flip.push(id);
}
const lista = a => a.length ? `[\n${a.map(x => `  '${x}',`).join('\n')}\n]` : '[]';
const out = `// GERADO por scripts/gerar-soulmon-overrides.mjs (REGISTRO §333). Não editar à mão: reexporte a Tabela de Soulmons e rode o script.
import type { AtaqueTipo } from './soulmonOverrides';

/** O tipo do ataque BÁSICO de cada forma, escolhido pelo dono na Tabela de Soulmons (${ataque.size} formas). Chave = chave do bestiário. */
export const ATAQUE_TIPO_OVERRIDE_DATA: Readonly<Record<string, AtaqueTipo>> = {
${[...ataque].map(([k, v]) => `  '${k}': '${v}',`).join('\n')}
};

/** Formas desenhadas um pouco acima do chão no combate (coluna \`flutua\`). */
export const FLUTUA_DATA: readonly string[] = ${lista(flutua)};

/** Formas espelhadas na horizontal (coluna \`flip\`). */
export const FLIP_DATA: readonly string[] = ${lista(flip)};
`;
writeFileSync(SAIDA, out);
console.log(`ataque_tipo: ${ataque.size} · flutua: ${flutua.length} · flip: ${flip.length} → ${SAIDA}`);
if (ignorados.length) console.log(`ignorados (${ignorados.length}):\n  ${ignorados.join('\n  ')}`);
