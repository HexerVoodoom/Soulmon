// BETA12 E2 — gera a Tabela de Soulmons e NPCs (artefato do dono, FORA do jogo).
// Uso: node scripts/gerar-tabela-soulmons-npcs.mjs [pastaDeSaida]   (padrao: docs/beta12)
// Saidas: tabela-soulmons-npcs.json (linhas + contagem), tabela-soulmons-npcs.html (autocontido, miniaturas em data URI) e soulmon-npcs-beta12-v2.csv (linha de base).
// So LE o repo. Nao publica nada. Formato do CSV: scripts/tabela-beta12/csv.mjs (E2.4). Validador de importacao: scripts/tabela-beta12/importar.mjs.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { gerarDados, RAIZ } from './tabela-beta12/dados.mjs';
import { NOME_ARQUIVO_CSV, toCsv } from './tabela-beta12/csv.mjs';
import { ENUMS_FECHADOS } from './tabela-beta12/importar.mjs';

const SAIDA = resolve(process.argv[2] || join(RAIZ, 'docs', 'beta12'));
const ALTURA_MINI = 64;
const { linhas, sprites, vocab, contagem, contagemNpcPorRegistro } = await gerarDados();

// miniaturas: 1 por arquivo (dedup), webp de 64 px de altura, data URI
const indice = new Map(); const miniaturas = []; const spritePorId = {};
for (const l of linhas) {
  const arq = sprites[l.id];
  if (!arq) continue;
  if (!indice.has(arq)) {
    const buf = await sharp(arq).resize({ height: ALTURA_MINI, fit: 'inside' }).webp({ quality: 74, alphaQuality: 90, effort: 5 }).toBuffer();
    indice.set(arq, miniaturas.length); miniaturas.push('data:image/webp;base64,' + buf.toString('base64'));
  }
  spritePorId[l.id] = indice.get(arq);
}
const semSprite = linhas.filter((l) => spritePorId[l.id] === undefined).map((l) => l.id);

mkdirSync(SAIDA, { recursive: true });
const gerado_em = new Date().toISOString();
writeFileSync(join(SAIDA, 'tabela-soulmons-npcs.json'), JSON.stringify({ gerado_em, formato: NOME_ARQUIVO_CSV, total: linhas.length, contagem, contagem_npc_por_registro: contagemNpcPorRegistro, sem_sprite: semSprite, vocab, linhas }, null, 1) + '\n');
writeFileSync(join(SAIDA, NOME_ARQUIVO_CSV), toCsv(linhas));

// HTML: o codigo de csv.mjs entra INLINE (mesmo codigo dos testes); `</` escapado para nao fechar o <script>.
const csvCodigo = readFileSync(join(RAIZ, 'scripts', 'tabela-beta12', 'csv.mjs'), 'utf8')
  .replace(/^export const /gm, 'var ').replace(/^export function /gm, 'function ');
const dados = JSON.stringify({ gerado_em, linhas, sprites: spritePorId, miniaturas, vocab, enums: ENUMS_FECHADOS }).replace(/</g, '\\u003c');
const molde = readFileSync(join(RAIZ, 'scripts', 'tabela-beta12', 'template.html'), 'utf8');
const html = molde.replace('/*__CSV__*/', () => csvCodigo).replace('__DADOS__', () => dados);
writeFileSync(join(SAIDA, 'tabela-soulmons-npcs.html'), html);

console.log(`Linhas: ${linhas.length} -> ${SAIDA}`);
console.log('Por tipo_entidade:', JSON.stringify(contagem));
console.log('NPC por registro:', JSON.stringify(contagemNpcPorRegistro));
console.log(`Miniaturas unicas: ${miniaturas.length}; sem sprite: ${semSprite.length}${semSprite.length ? ' (' + semSprite.join(', ') + ')' : ''}`);
console.log(`HTML: ${(html.length / 1024).toFixed(0)} KB`);
