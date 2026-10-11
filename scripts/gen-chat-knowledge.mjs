import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES, OUT_FILE, buildChunks, renderModule } from './chat-knowledge-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = Object.fromEntries(SOURCES.map(s => [s, readFileSync(resolve(root, s), 'utf8')]));
const chunks = buildChunks(files);
writeFileSync(resolve(root, OUT_FILE), renderModule(chunks));
console.log(`chat-kb: ${chunks.length} trechos -> ${OUT_FILE}`);
