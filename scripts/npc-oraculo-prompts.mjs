#!/usr/bin/env node
/**
 * NPCs de área pelo ORÁCULO — decisão do dono, 29/09/2026.
 *
 * Os prompts dos NPCs de lote (bíblia das áreas §4) deixam de ser escritos à
 * mão: a criatura sai do MESMO motor que gera as criaturas dos jogadores
 * (`generateOracleWithFamilies` → `composeSpritePrompts`, em
 * `src/utils/oracle.ts`), com as duas variantes que o app usa
 * (`imagePrompt` com referências de gênero / `imagePromptFallback` limpo).
 * A bíblia dá o papel (pose/gesto), a área dá o estilo (âncora nos arquivos
 * `docs/design/areas/prompts/*.md`) — este script só produz o NÚCLEO.
 *
 * Como roda (sem pacote novo, sem rede, sem API de geração):
 *   node scripts/npc-oraculo-prompts.mjs
 * O `esbuild` que já vem com o Vite empacota `src/utils/oracle.ts` +
 * `src/utils/oracle/familias.ts` num .mjs temporário (como os testes fazem
 * via `src/test/oracleSync.ts`), e o script importa a função pura.
 *
 * Forma: todos saem em `rookie`. NPC é forma única, e o rookie é a única
 * forma que não injeta um CORPO sorteado por linha (champion+ trocam o corpo
 * por uma "shape" — ex.: "a proud beast with a blazing flame mane" —, que
 * atropela a espécie da ficha e trazia fogo, vetado pela bíblia §5). O
 * tamanho real vem da âncora da área (busto 768²), não do "tiny" do rookie.
 *
 * Reprodutível: entrada fixa, semente fixa por NPC. A semente é a PRIMEIRA de
 * `SEED_BASE + 0..63` cuja paleta sorteada pelo oráculo não traz matiz
 * proibida na área (bíblia §5: magenta/roxo/rosa/violeta em todo lugar;
 * vermelho/laranja fora da Arena). O filtro não altera o motor — só escolhe
 * qual semente usar, e a escolhida fica gravada na saída.
 *
 * Saída: docs/design/areas/npcs-oraculo-saida.json e .md
 */
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'docs/design/areas/npcs-oraculo-saida.json');
const OUT_MD = join(ROOT, 'docs/design/areas/npcs-oraculo-saida.md');
const SEED_BASE = 29092026;

/**
 * Perfis (justificativa em docs/design/areas/npcs-oraculo.md).
 * `descricao` entra como `petDescription` — o mesmo campo que o jogador usa
 * para descrever o próprio pet: ele SUBSTITUI o conceito sorteado no prompt
 * (máx. 200 caracteres, cortado pelo motor). Os eixos entram como
 * `OracleOverrides` (o mesmo ajuste manual que a OraclePage expõe).
 */
const PERFIS = [
  { id: 'npc-mercado-itens', nome: 'Tamba', area: 'mercado', forma: 'rookie',
    eixos: { dominantElement: 'industrial', dominantRole: 'suporte', dominantAlignment: 'benevolencia', dominantRealm: 'cavernas' },
    descricao: 'dog-sized hermit crab whose shell is a brass chest of six little drawers with tiny knobs, turquoise-tipped antennae, precise counting eyes' },
  { id: 'npc-mercado-decoracao', nome: 'Musga', area: 'mercado', forma: 'rookie',
    eixos: { dominantElement: 'planta', dominantRole: 'tanque', dominantAlignment: 'harmonia', dominantRealm: 'pantano' },
    descricao: 'big slow moss slug carrying a whole tiny room on its back: plank roof, crate-wood walls, one small window glowing warm amber, eyes on short stalks' },
  { id: 'npc-mercado-background', nome: 'Panora', area: 'mercado', forma: 'rookie',
    eixos: { dominantElement: 'agua', dominantRole: 'magico', dominantAlignment: 'harmonia', dominantRealm: 'oceano' },
    descricao: 'dreamy cream land-squid whose mantle is a stretched canvas screen in a thin copper frame showing a small pixel landscape of hills and rain clouds' },
  { id: 'npc-mercado-conquistas', nome: 'Medra', area: 'mercado', forma: 'rookie',
    eixos: { dominantElement: 'terra', dominantRole: 'tanque', dominantAlignment: 'benevolencia', dominantRealm: 'deserto' },
    descricao: 'old wise tortoise with a domed shell of brass plates, each plate engraved with a simple plain medal emblem, moss along the shell rim, kind half-closed eyes' },
  { id: 'npc-arena-duelo', nome: 'Tuska', area: 'arena', forma: 'rookie',
    eixos: { dominantElement: 'terra', dominantRole: 'fisico', dominantAlignment: 'poder', dominantRealm: 'picos' },
    descricao: 'stocky bipedal rhinoceros with sandstone hide, a horn of chipped stone with a thin turquoise vein, a bone cloth headband and a good-natured grin' },
  { id: 'npc-arena-feira', nome: 'Fanfare', area: 'arena', forma: 'rookie',
    eixos: { dominantElement: 'ar', dominantRole: 'suporte', dominantAlignment: 'harmonia', dominantRealm: 'campina' },
    descricao: 'accordion creature whose body is a bellows of petrol and bone striped canvas, a friendly mouth in the middle, long thin arms carrying small paper lanterns' },
  { id: 'npc-exploracao-dino', nome: 'Trote', area: 'exploracao', forma: 'rookie',
    eixos: { dominantElement: 'sombra', dominantRole: 'fisico', dominantAlignment: 'harmonia', dominantRealm: 'pantano' },
    descricao: 'long-legged running bird with a short beak, peat brown-green feathers with pale glowing tips, one loose feather always falling from its crest, eager eyes' },
  { id: 'npc-laboratorio-pet', nome: 'Bento', area: 'laboratorio', forma: 'rookie',
    eixos: { dominantElement: 'luz', dominantRole: 'suporte', dominantAlignment: 'benevolencia', dominantRealm: 'akasha' },
    descricao: 'small owl-deer with tiny antlers of clear ice-blue glass, petrol-teal feathers and round copper-framed glasses over big calm eyes' },
  { id: 'npc-laboratorio-stats', nome: 'Quill', area: 'laboratorio', forma: 'rookie',
    eixos: { dominantElement: 'industrial', dominantRole: 'magico', dominantAlignment: 'harmonia', dominantRealm: 'gelo' },
    descricao: 'praying mantis of greenish translucent glass whose front forelegs end in feather quill pens with copper nibs, a blank copper notebook strapped to its back' },
  { id: 'npc-hall-amigos', nome: 'Nino', area: 'hall', forma: 'rookie',
    eixos: { dominantElement: 'ar', dominantRole: 'alcance', dominantAlignment: 'benevolencia', dominantRealm: 'campina' },
    descricao: 'cream gliding squirrel with a thin parchment membrane between its paws, a small copper courier bag across its chest and a bushy curled tail' },
  { id: 'npc-hall-guilda', nome: 'Marla', area: 'hall', forma: 'rookie',
    eixos: { dominantElement: 'planta', dominantRole: 'tanque', dominantAlignment: 'harmonia', dominantRealm: 'floresta' },
    descricao: 'large calm tree-stag with a cream and pale-stone coat, antlers that are a small living grove of turquoise and green leaves, pale stone hooves' },
];

const PROIBIDO_SEMPRE = /\b(purple|violet|magenta|pink|lilac|lavender|fuchsia|plum|amethyst|orchid|mauve|rose|indigo|periwinkle|wine)\b/i;
const PROIBIDO_FORA_ARENA = /\b(red|crimson|scarlet|orange|ruby|vermilion|blood|coral)\b/i;
const PROIBIDO_FORMA = /\b(flame|fire|blaze|blazing|ember|magma|skull|bone|tomb)\b/i;
const vetada = (area, texto) => PROIBIDO_SEMPRE.test(texto) || PROIBIDO_FORMA.test(texto) || (area !== 'arena' && PROIBIDO_FORA_ARENA.test(texto));

async function carregarOraculo() {
  const dir = mkdtempSync(join(tmpdir(), 'npc-oraculo-'));
  const out = join(dir, 'oraculo.mjs');
  await build({
    stdin: {
      contents: "export { generateOracleWithFamilies } from './src/utils/oracle';\nexport * as familias from './src/utils/oracle/familias';\n",
      resolveDir: ROOT, loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
  });
  const mod = await import(pathToFileURL(out).href);
  rmSync(dir, { recursive: true, force: true });
  return mod;
}

function gerar(oraculo, p, seed) {
  const input = {
    fullName: p.nome, birthDate: '2026-09-29', birthTime: '12:00', birthPlace: `soulmon:${p.area}`,
    petDescription: p.descricao,
  };
  const r = oraculo.generateOracleWithFamilies(input, oraculo.familias, seed, { ...p.eixos, secondaryElement: null });
  const forma = r.creature.stages.find(s => s.stage === p.forma && (p.ramo ? s.branch === p.ramo : true));
  return { r, forma };
}

const oraculo = await carregarOraculo();
const saida = [];
for (const p of PERFIS) {
  let escolhida = null;
  for (let i = 0; i < 64 && !escolhida; i++) {
    const seed = SEED_BASE + i;
    const { r, forma } = gerar(oraculo, p, seed);
    // Varre só o que o MOTOR sorteou (corpo da forma + paleta + acento): a
    // descrição da ficha é nossa, e as referências de gênero e a cláusula de
    // franquia são fixas do motor.
    const sorteado = forma.imagePromptFallback
      .split('transparent background: ')[1]
      .replace(p.descricao, '')
      .replace(/Do not tint[\s\S]*$/, '');
    if (!vetada(p.area, sorteado)) escolhida = { seed, rejeitadas: i, r, forma };
  }
  if (!escolhida) throw new Error(`${p.nome}: nenhuma semente com paleta permitida em 64`);
  const { seed, rejeitadas, r, forma } = escolhida;
  for (const v of [forma.imagePrompt, forma.imagePromptFallback]) {
    if (!v.includes('Do not copy any existing franchise character')) throw new Error(`${p.nome}: cláusula de franquia ausente`);
  }
  if (/mon$/i.test(p.nome)) throw new Error(`${p.nome}: sufixo -mon`);
  saida.push({
    id: p.id, nome: p.nome, area: p.area, seed, sementesRejeitadas: rejeitadas,
    forma: p.forma, ramo: p.ramo ?? null,
    eixos: { elemento: r.dominantElement, papel: r.dominantRole, alinhamento: r.dominantAlignment, reino: r.dominantRealm },
    entrada: { petDescription: p.descricao },
    imagePrompt: forma.imagePrompt,
    imagePromptFallback: forma.imagePromptFallback,
  });
}

writeFileSync(OUT_JSON, JSON.stringify({ geradoPor: 'scripts/npc-oraculo-prompts.mjs', seedBase: SEED_BASE, npcs: saida }, null, 2) + '\n');

const md = [
  '# NPCs de área — saída do oráculo',
  '',
  '> Etiqueta: **registro gerado** (não editar à mão). Rode `node scripts/npc-oraculo-prompts.mjs` para regenerar — mesma entrada, mesma semente, mesma saída.',
  '> Perfis e justificativa: [npcs-oraculo.md](npcs-oraculo.md). Uso: núcleo dos prompts em `prompts/*.md`, envolvido pela âncora da área.',
  '',
];
for (const n of saida) {
  md.push(`## ${n.nome} — \`${n.id}\``, '',
    `- área \`${n.area}\` · forma \`${n.forma}${n.ramo ? `/${n.ramo}` : ''}\` · semente \`${n.seed}\` (${n.sementesRejeitadas} rejeitada(s) por paleta)`,
    `- eixos: elemento \`${n.eixos.elemento}\` · papel \`${n.eixos.papel}\` · alinhamento \`${n.eixos.alinhamento}\` · reino \`${n.eixos.reino}\``,
    '', '**imagePrompt** (1ª tentativa)', '```', n.imagePrompt, '```',
    '**imagePromptFallback** (se o provedor recusar)', '```', n.imagePromptFallback, '```', '');
}
writeFileSync(OUT_MD, md.join('\n'));
console.log(`ok: ${saida.length} NPCs → ${OUT_JSON}`);
