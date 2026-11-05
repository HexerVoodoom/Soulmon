/**
 * FILA LOCAL DE SPRITES DOS SIMULADOS — manual, DRY-RUN por padrão. NUNCA grava no KV e nunca roda em CI.
 *
 * Gera com alfa real pela CLI Higgsfield (`scripts-arte/hf-gen.mjs`, `gpt_image_2_5 --variant flare --background transparent`)
 * e salva em E:/Soulmon-assets/simulados-170/raw/<id>--<forma>.png.
 *
 * CACHE CORRETO: a identidade de cada imagem é (simulado, forma, sha do prompt), no `manifesto.json`. A versão anterior passava
 * pelo `/api/generate-sprite` com o save do admin, cujo cache é (save, forma): todo simulado receberia a imagem do primeiro.
 * Por isso duas imagens iguais para simulados diferentes também param o lote.
 *
 *   node scripts/simulados-sprites-fila.mjs                      # lista o plano e o custo
 *   node scripts/simulados-sprites-fila.mjs --previa             # lista só as 3 prévias
 *   node scripts/simulados-sprites-fila.mjs --previa --run       # gera as 3 prévias (gasta crédito)
 *   opções: --only sim_0051,sim_0052  --dia AAAA-MM-DD  --out <pasta>  --gen <caminho do hf-gen.mjs>
 * Saídas: 0 ok · 1 erro · 2 uso errado.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIMULADOS } from '../functions/api/_simulados.data.js';
import { estadoDoDia, dayKeyOf } from '../functions/api/_simulados.js';
import { promptDaForma } from '../functions/api/_simFormas.js';

export const SAIDA_PADRAO = 'E:/Soulmon-assets/simulados-170';
export const GEN_PADRAO = 'D:/Soulmon/scripts-arte/hf-gen.mjs';
export const PREVIA = Object.freeze(['sim_0051', 'sim_0065', 'sim_0119']);
export const CUSTO_POR_IMAGEM = 0.024;

export const shaDe = (texto) => createHash('sha256').update(texto).digest('hex');
export const promptDe = (p, forma) => promptDaForma(p, forma, 'alfa');
export const chaveDoCache = (item) => `${item.id}|${item.formId}|${item.sha}`;

/** O plano (puro): a forma ATUAL de cada simulado no dia. `only` restringe. */
export function planejar(only = null, dia = dayKeyOf()) {
  return SIMULADOS.filter((p) => !only || only.includes(p.id)).map((p) => {
    const formId = estadoDoDia(p, dia).evolutionStage;
    const prompt = promptDe(p, formId);
    return { id: p.id, formId, element: p.element, line: p.line, prompt, sha: shaDe(prompt), arquivo: `${p.id}--${formId}` };
  });
}

export function parseArgs(argv) {
  const o = { run: false, only: null, previa: false, dia: dayKeyOf(), out: SAIDA_PADRAO, gen: GEN_PADRAO };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run') o.run = true;
    else if (argv[i] === '--previa') o.previa = true;
    else if (argv[i] === '--only') o.only = String(argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === '--dia') o.dia = String(argv[++i] ?? '');
    else if (argv[i] === '--out') o.out = String(argv[++i] ?? '');
    else if (argv[i] === '--gen') o.gen = String(argv[++i] ?? '');
  }
  return o;
}

/** O que falta gerar: item já no manifesto com o MESMO prompt e arquivo presente não paga de novo; prompt mudado gera. */
export function pendentes(plano, manifesto, existe = () => true) {
  return plano.filter((it) => !(manifesto[chaveDoCache(it)] && existe(it)));
}

/** Imagem igual em simulados diferentes é o defeito de cache antigo: devolve o par em conflito, ou `null`. */
export function hashRepetido(manifesto) {
  const visto = new Map();
  for (const [chave, v] of Object.entries(manifesto)) {
    const id = chave.split('|')[0];
    if (visto.has(v.hash) && visto.get(v.hash) !== id) return [visto.get(v.hash), id];
    visto.set(v.hash, id);
  }
  return null;
}

/** PNG com canal alfa? (tipo de cor 6 ou 4 no IHDR) */
export const pngTemAlfa = (b) => b.length > 26 && b[0] === 0x89 && (b[25] === 6 || b[25] === 4);

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.dia)) { console.error('--dia inválido'); process.exit(2); }
  const plano = planejar(o.previa ? [...PREVIA] : o.only, o.dia);
  const manPath = join(o.out, 'manifesto.json');
  const manifesto = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};
  const png = (it) => join(o.out, 'raw', `${it.arquivo}.png`);
  const fila = pendentes(plano, manifesto, (it) => existsSync(png(it)));
  console.log(`${fila.length}/${plano.length} a gerar, cerca de US$ ${(fila.length * CUSTO_POR_IMAGEM).toFixed(2)}.`);
  if (!o.run) {
    for (const it of fila) console.log(`${it.id}  ${it.formId}  ${it.element}/${it.line}\n    ${it.prompt}`);
    console.log('Dry-run. Use --run para gerar.');
    return;
  }
  mkdirSync(o.out, { recursive: true });
  let falhas = 0;
  for (const it of fila) {
    const r = spawnSync(process.execPath, [o.gen, '--id', it.arquivo, '--model', 'gpt_image_2_5', '--res', '1k', '--out', o.out, '--prompt', it.prompt, '--extra', '--variant flare --background transparent --quality high'], { stdio: 'inherit', shell: false });
    if (r.status !== 0 || !existsSync(png(it))) { console.error(`${it.id}: falhou`); falhas++; continue; }
    const bytes = readFileSync(png(it));
    if (!pngTemAlfa(bytes)) { console.error(`${it.id}: PNG sem alfa, rejeitado`); falhas++; continue; }
    manifesto[chaveDoCache(it)] = { hash: shaDe(bytes), arquivo: `raw/${it.arquivo}.png`, element: it.element, line: it.line, formId: it.formId };
    writeFileSync(manPath, JSON.stringify(manifesto, null, 2));
    const par = hashRepetido(manifesto);
    if (par) { console.error(`Imagem repetida em ${par[0]} e ${par[1]}: parando.`); process.exit(1); }
  }
  console.log(`Fim: ${falhas} falha(s). Nada foi gravado no KV.`);
  if (falhas) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
