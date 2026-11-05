/**
 * FILA LOCAL DE SPRITES DOS SIMULADOS — manual, sem gerar por padrão. NUNCA grava no KV e nunca roda em CI.
 *
 * O prompt é o do Oráculo real (`prompts.json`, de `simulados-prompts-run.mjs`; REGISTRO §234). Cada simulado precisa da
 * CADEIA do rookie à forma atual, porque a forma nova usa a anterior como referência, como no jogador. É ela que define o custo.
 * Não há chave Higgsfield local: a geração vai pelo playground, com a rota do jogador, e este script só prepara e recebe.
 *
 * CACHE: a identidade de cada imagem é (simulado, forma, sha do prompt), no `manifesto.json`. Duas imagens iguais para
 * simulados diferentes param o lote.
 *
 *   node scripts/simulados-sprites-fila.mjs                       # plano e custo (não precisa de prompts.json)
 *   node scripts/simulados-sprites-fila.mjs --previa              # só as 3 prévias
 *   node scripts/simulados-sprites-fila.mjs --lote <arq.json>     # grava os pedidos pendentes, em ordem de cadeia
 *   node scripts/simulados-sprites-fila.mjs --instalar <urls.json> # { arquivo: url }: baixa, recorta e registra
 *   opções: --only sim_0051,sim_0052  --dia AAAA-MM-DD  --out <pasta>
 * Saídas: 0 ok · 1 erro · 2 uso errado.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIMULADOS } from '../functions/api/_simulados.data.js';
import { estadoDoDia, dayKeyOf } from '../functions/api/_simulados.js';
import { chromaKeyPng, chromaKeyOfPrompt } from '../functions/api/_chroma.js';

export const SAIDA_PADRAO = 'E:/Soulmon-assets/simulados-170';
export const PREVIA = Object.freeze(['sim_0051', 'sim_0065', 'sim_0119']);
export const CUSTO_POR_IMAGEM = 0.024;
const ATRIBUTO = { poder: 'power', harmonia: 'harmony', benevolencia: 'benevolence' };

export const shaDe = (texto) => createHash('sha256').update(texto).digest('hex');
export const chaveDoCache = (item) => `${item.id}|${item.formId}|${item.sha}`;

/** As 5 formas da linha, em ordem. */
export function formasDaLinha(line) {
  const a = ATRIBUTO[line];
  if (!a) throw new Error(`linha desconhecida: ${line}`);
  return ['rookie', `champion-${a}`, `ultimate-${a}`, `mega-${a}`, 'ultra'];
}

/** Do rookie até `forma`. Forma de outra linha (um simulado antigo) cai na mesma altura da linha dele. */
export function cadeiaAte(line, forma) {
  const formas = formasDaLinha(line);
  const altura = formas.findIndex((f) => f.split('-')[0] === String(forma).split('-')[0]);
  if (altura < 0) throw new Error(`forma desconhecida: ${forma}`);
  return formas.slice(0, altura + 1);
}

/** O plano (puro): a cadeia de cada simulado no dia. Sem `prompts`, serve só para contar. */
export function planejar(only = null, dia = dayKeyOf(), prompts = null) {
  return SIMULADOS.filter((p) => !only || only.includes(p.id)).flatMap((p) => {
    const cadeia = cadeiaAte(p.line, estadoDoDia(p, dia).evolutionStage);
    return cadeia.map((formId, i) => {
      const prompt = prompts ? prompts[p.id]?.[formId]?.prompt : null;
      if (prompts && !prompt) throw new Error(`${p.id}/${formId}: sem prompt do Oráculo`);
      return { id: p.id, formId, refDe: i ? `${p.id}--${cadeia[i - 1]}` : null, element: p.element, line: p.line, prompt, sha: prompt ? shaDe(prompt) : null, arquivo: `${p.id}--${formId}` };
    });
  });
}

export function parseArgs(argv) {
  const o = { only: null, previa: false, dia: dayKeyOf(), out: SAIDA_PADRAO, lote: null, instalar: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--previa') o.previa = true;
    else if (argv[i] === '--only') o.only = String(argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === '--dia') o.dia = String(argv[++i] ?? '');
    else if (argv[i] === '--out') o.out = String(argv[++i] ?? '');
    else if (argv[i] === '--lote') o.lote = String(argv[++i] ?? '');
    else if (argv[i] === '--instalar') o.instalar = String(argv[++i] ?? '');
  }
  return o;
}

/** O que falta gerar: item já no manifesto com o MESMO prompt e arquivo presente não paga de novo; prompt mudado gera. */
export function pendentes(plano, manifesto, existe = () => true) {
  return plano.filter((it) => !(manifesto[chaveDoCache(it)] && existe(it)));
}

/** Imagem igual em simulados diferentes é defeito de cache: devolve o par em conflito, ou `null`. */
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

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.dia)) { console.error('--dia inválido'); process.exit(2); }
  const only = o.previa ? [...PREVIA] : o.only;
  const pp = join(o.out, 'prompts.json');
  const manPath = join(o.out, 'manifesto.json');
  const manifesto = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};
  const png = (it) => join(o.out, 'raw', `${it.arquivo}.png`);
  const porForma = {};
  const contagem = planejar(only, o.dia);
  for (const it of contagem) porForma[it.formId.split('-')[0]] = (porForma[it.formId.split('-')[0]] ?? 0) + 1;
  const prompts = existsSync(pp) ? JSON.parse(readFileSync(pp, 'utf8')) : null;
  const plano = prompts ? planejar(only, o.dia, prompts) : contagem;
  const fila = prompts ? pendentes(plano, manifesto, (it) => existsSync(png(it))) : plano;
  console.log(`${new Set(plano.map((i) => i.id)).size} simulados, ${fila.length}/${plano.length} imagens a gerar, cerca de US$ ${(fila.length * CUSTO_POR_IMAGEM).toFixed(2)}. Por forma: ${JSON.stringify(porForma)}`);
  if (!o.lote && !o.instalar) return;
  if (!prompts) { console.error(`Falta ${pp}: rode scripts/simulados-prompts-run.mjs.`); process.exit(2); }
  if (o.lote) {
    writeFileSync(o.lote, JSON.stringify(fila.map(({ arquivo, refDe, prompt }) => ({ arquivo, refDe, prompt })), null, 1));
    console.log(`Lote em ${o.lote}. Nada foi gerado.`);
    return;
  }
  const urls = JSON.parse(readFileSync(o.instalar, 'utf8'));
  mkdirSync(join(o.out, 'raw'), { recursive: true });
  let falhas = 0;
  for (const it of fila) {
    if (!urls[it.arquivo]) continue;
    try {
      const res = await fetch(urls[it.arquivo]);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const bruto = new Uint8Array(await res.arrayBuffer());
      const recorte = chromaKeyPng(bruto, chromaKeyOfPrompt(it.prompt));
      if (!pngTemAlfa(recorte)) throw new Error('recorte sem alfa');
      writeFileSync(join(o.out, 'raw', `${it.arquivo}--bruto.png`), bruto);
      writeFileSync(png(it), recorte);
      manifesto[chaveDoCache(it)] = { hash: shaDe(recorte), arquivo: `raw/${it.arquivo}.png`, element: it.element, line: it.line, formId: it.formId };
      writeFileSync(manPath, JSON.stringify(manifesto, null, 2));
      const par = hashRepetido(manifesto);
      if (par) { console.error(`Imagem repetida em ${par[0]} e ${par[1]}: parando.`); process.exit(1); }
    } catch (err) { console.error(`${it.arquivo}: ${err.message}`); falhas++; }
  }
  console.log(`Fim: ${falhas} falha(s). Nada foi gravado no KV.`);
  if (falhas) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
