// Monta as linhas da Tabela de Soulmons e NPCs (BACKLOG-BETA12 E2). So LE o repo.
// Os modulos TS do jogo sao empacotados em memoria com o esbuild do repo (PNG vira o CAMINHO do arquivo): a fonte da verdade continua sendo o codigo.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ENTRADA = `
export { CORVO_FORM_IDS, CORVO_SPRITES_256 } from './src/utils/corvoPet';
export { corvoFormName } from './src/utils/corvoAdocao';
export { OWN_LINE_SPRITES, DUNGEON_LINE_NAMES, STARTER_IDS, STARTER_NAMES, STARTER_SPRITES, RETIRED_LINE_IDS } from './src/utils/sprites';
export { SPRITE_ELEMENT, LINE_ELEMENT, BOSS_ELEMENT, DESAFIANTE_ELEMENT } from './src/utils/spriteElement';
export { STARTER_ELEMENT } from './src/utils/starterElements';
export { NOVOS_DATA } from './src/utils/novosSoulmonData';
export { AREA_NPC_ART, STALL_NPC_ART, LOT_NPC_ART, FUNCTION_NPC_ART, EXTRA_NPC_ART, NOVO_NPC_ART } from './src/assets/soulmon/npcs/index';
export { areaNpcVoice, lotNpcVoice, functionNpcVoice, extraNpcVoice, novoNpcVoice } from './src/utils/areaNpcVoice';
export { BOSS_ROSTER } from './src/data/bossRoster';
export { TOURNAMENT_NPCS } from './src/utils/tournamentNpcs';
export { ESCOLA_FAMILY_PADRAO } from './src/utils/arena';
export { ESCOLAS_SKILL, ESCOLA_SKILL_PADRAO } from './src/utils/soulProfile/ficha/types';
export { SPECIAL_FAMILIES } from './src/utils/combate/specials';
`;

/** Empacota o jogo em memoria e devolve o modulo (PNG -> caminho absoluto; css/audio -> vazio). */
export async function carregarJogo() {
  const dir = mkdtempSync(join(process.env.TABELA_TMP || tmpdir(), 'tabela-b12-'));
  const arquivo = join(dir, 'jogo.mjs');
  const assetsPlugin = {
    name: 'assets-como-caminho',
    setup(b) {
      b.onLoad({ filter: /\.(png|webp|jpe?g|svg|gif)$/ }, (a) => ({ contents: `export default ${JSON.stringify(a.path)};`, loader: 'js' }));
      b.onLoad({ filter: /\.(mp3|ogg|wav|css)$/ }, () => ({ contents: 'export default "";', loader: 'js' }));
    },
  };
  await build({
    stdin: { contents: ENTRADA, resolveDir: RAIZ, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: arquivo, logLevel: 'error', plugins: [assetsPlugin],
    define: { 'import.meta.glob': '__glob', 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"production","BASE_URL":"/"}', 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true' },
    banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url); const __glob = () => ({});" },
  });
  try { return await import(pathToFileURL(arquivo).href); } finally { rmSync(dir, { recursive: true, force: true }); }
}

const ESTAGIOS_LINHA = ['rookie', 'champion', 'ultimate', 'mega'];
const REGISTROS_NPC = ['lot', 'area', 'stall', 'function', 'extra', 'novo', 'boss', 'torneio'];

/**
 * @returns {{ linhas: object[], sprites: Record<string,string>, vocab: object, contagem: object }}
 * `sprites`: id -> caminho absoluto do PNG (so para o HTML; nao entra no CSV).
 */
export async function gerarDados() {
  const J = await carregarJogo();
  const linhas = []; const sprites = {};
  const ataquePadrao = () => ({
    ataque_basico: J.ESCOLA_SKILL_PADRAO,
    ataque_especial_escola: J.ESCOLA_SKILL_PADRAO,
    ataque_especial_familia: J.ESCOLA_FAMILY_PADRAO[J.ESCOLA_SKILL_PADRAO],
    origem_ataque: 'padrao',
  });
  const semAtaque = { ataque_basico: '', ataque_especial_escola: '', ataque_especial_familia: '', origem_ataque: 'sem_ataque' };
  const add = (l, sprite) => { linhas.push({ ...l, usar_no_jogo: 'sim' }); if (sprite) sprites[l.id] = sprite; };

  // Soulmon 1: o corvo, escada de 11 formas (CORVO_FORM_IDS)
  for (const forma of J.CORVO_FORM_IDS) {
    const [estagio, ramo = ''] = forma.split('-');
    add({
      id: `soulmon.corvo.${forma}`, tipo_entidade: 'soulmon', linha_id: 'corvo', estagio, ramo,
      nome_pt: J.corvoFormName(forma, 'pt-BR'), nome_en: J.corvoFormName(forma, 'en'),
      elemento: J.SPRITE_ELEMENT['mascote:corvo'], ...ataquePadrao(),
      fonte_codigo: 'src/utils/corvoPet.ts > CORVO_FORM_IDS; nomes: src/utils/corvoAdocao.ts > NOMES; elemento: src/utils/spriteElement.ts > SPRITE_ELEMENT[mascote:corvo]',
    }, J.CORVO_SPRITES_256[forma]);
  }
  // Soulmon 2: as 4 linhas proprias (OWN_LINE_SPRITES, 4 estagios, sem ultra). Vale a arte de LINHA (nao a do chefe da masmorra).
  for (const linha of Object.keys(J.OWN_LINE_SPRITES)) {
    for (const estagio of ESTAGIOS_LINHA) {
      // ramo: so o que o NOME DO ARQUIVO de arte diz (kaelen-champion-power.png); as outras linhas nao tem sufixo => ramo vazio
      const arte = J.OWN_LINE_SPRITES[linha][estagio];
      const m = /-(power|harmony|benevolence)\.png$/.exec(arte);
      const ramo = estagio !== 'rookie' && m ? m[1] : '';
      add({
        id: `soulmon.${linha}.${ramo ? `${estagio}-${ramo}` : estagio}`, tipo_entidade: 'soulmon', linha_id: linha, estagio, ramo,
        nome_pt: J.DUNGEON_LINE_NAMES[linha], nome_en: J.DUNGEON_LINE_NAMES[linha],
        elemento: J.LINE_ELEMENT[linha], ...ataquePadrao(),
        fonte_codigo: 'src/utils/sprites.ts > OWN_LINE_SPRITES, DUNGEON_LINE_NAMES; elemento: src/utils/spriteElement.ts > LINE_ELEMENT',
      }, arte);
    }
  }
  // Soulmon 3: os 5 iniciais (um sprite so => estagio unico rookie, ramo vazio)
  for (const s of J.STARTER_IDS) {
    add({
      id: `soulmon.${s}.rookie`, tipo_entidade: 'soulmon', linha_id: s, estagio: 'rookie', ramo: '',
      nome_pt: J.STARTER_NAMES[s], nome_en: J.STARTER_NAMES[s], elemento: J.STARTER_ELEMENT[s], ...ataquePadrao(),
      fonte_codigo: 'src/utils/sprites.ts > STARTER_IDS, STARTER_NAMES, STARTER_SPRITES; elemento: src/utils/starterElements.ts > STARTER_ELEMENT',
    }, J.STARTER_SPRITES[s]);
  }

  // NPCs: uma linha por ARTE (arquivo). O NPC que aparece em mais de um registro fica no de maior precedencia (REGISTROS_NPC).
  const candidatos = [];
  const IDX = 'src/assets/soulmon/npcs/index.ts';
  const VOZ = 'src/utils/areaNpcVoice.ts';
  for (const [k, arte] of Object.entries(J.LOT_NPC_ART)) {
    const [a, lot] = k.split(':');
    candidatos.push({ registro: 'lot', chave: k, arte, pt: J.lotNpcVoice(a, lot, 'pt-BR').name, en: J.lotNpcVoice(a, lot, 'en-US').name, fonte: `${IDX} > LOT_NPC_ART; nome: ${VOZ} > LOT_NPC_VOICE` });
  }
  for (const [k, arte] of Object.entries(J.AREA_NPC_ART)) {
    candidatos.push({ registro: 'area', chave: k, arte, pt: J.areaNpcVoice(k, 'pt-BR').name, en: J.areaNpcVoice(k, 'en-US').name, fonte: `${IDX} > AREA_NPC_ART; nome: ${VOZ} > AREA_NPC_VOICE` });
  }
  for (const [k, arte] of Object.entries(J.STALL_NPC_ART)) {
    candidatos.push({ registro: 'stall', chave: k, arte, pt: J.lotNpcVoice('mercado', k, 'pt-BR').name, en: J.lotNpcVoice('mercado', k, 'en-US').name, fonte: `${IDX} > STALL_NPC_ART; nome: ${VOZ} > LOT_NPC_VOICE[mercado:${k}]` });
  }
  for (const [k, arte] of Object.entries(J.FUNCTION_NPC_ART)) {
    candidatos.push({ registro: 'function', chave: k, arte, pt: J.functionNpcVoice(k, 'pt-BR').name, en: J.functionNpcVoice(k, 'en-US').name, fonte: `${IDX} > FUNCTION_NPC_ART; nome: ${VOZ} > FUNCTION_NPC_VOICE` });
  }
  for (const [k, arte] of Object.entries(J.EXTRA_NPC_ART)) {
    candidatos.push({ registro: 'extra', chave: k, arte, pt: J.extraNpcVoice(k, 'pt-BR').name, en: J.extraNpcVoice(k, 'en-US').name, fonte: `${IDX} > EXTRA_NPC_ART; nome: ${VOZ} > EXTRA_NPC_VOICE` });
  }
  for (const [k, arte] of Object.entries(J.NOVO_NPC_ART)) {
    candidatos.push({ registro: 'novo', chave: k, arte, pt: J.novoNpcVoice(k, 'pt-BR').name, en: J.novoNpcVoice(k, 'en-US').name, fonte: `${IDX} > NOVO_NPC_ART; nome: ${VOZ} > NOVO_NPC_VOICE` });
  }
  for (const b of J.BOSS_ROSTER) {
    candidatos.push({ registro: 'boss', chave: b.id, arte: join(RAIZ, 'src/assets/soulmon/bosses', `boss-${b.id}.png`), pt: b.namePt, en: b.nameEn, elemento: J.BOSS_ELEMENT[b.id] ?? '', fonte: 'src/data/bossRoster.ts > BOSS_ROSTER; elemento: src/utils/spriteElement.ts > BOSS_ELEMENT' });
  }
  for (const n of J.TOURNAMENT_NPCS) {
    candidatos.push({ registro: 'torneio', chave: n.id, arte: n.portrait, pt: n.namePt, en: n.nameEn, elemento: J.DESAFIANTE_ELEMENT[n.id] ?? '', fonte: 'src/utils/tournamentNpcs.ts > TOURNAMENT_NPCS; elemento: src/utils/spriteElement.ts > DESAFIANTE_ELEMENT' });
  }

  const porArte = new Map();
  for (const c of candidatos) { if (!porArte.has(c.arte)) porArte.set(c.arte, []); porArte.get(c.arte).push(c); }
  const npcs = [];
  for (const grupo of porArte.values()) {
    grupo.sort((a, b) => REGISTROS_NPC.indexOf(a.registro) - REGISTROS_NPC.indexOf(b.registro) || candidatos.indexOf(a) - candidatos.indexOf(b));
    npcs.push({ ...grupo[0], tambem: grupo.slice(1).map((g) => `${g.registro}:${g.chave}`), ordem: candidatos.indexOf(grupo[0]) });
  }
  npcs.sort((a, b) => a.ordem - b.ordem);
  for (const n of npcs) {
    add({
      id: `npc.${n.registro}.${n.chave}`, tipo_entidade: 'npc', linha_id: '', estagio: '', ramo: '', nome_pt: n.pt, nome_en: n.en,
      elemento: n.elemento ?? '', ...semAtaque,
      fonte_codigo: n.fonte + (n.tambem.length ? '; mesma arte tambem em: ' + n.tambem.join(', ') : ''),
    }, n.arte);
  }

  const elementos = [...new Set(['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial', ...Object.values(J.SPRITE_ELEMENT)])].sort();
  const vocab = { elementos, escolas: [...J.ESCOLAS_SKILL], familias: [...J.SPECIAL_FAMILIES] };
  const contagem = {};
  for (const l of linhas) contagem[l.tipo_entidade] = (contagem[l.tipo_entidade] || 0) + 1;
  const contagemNpcPorRegistro = {};
  for (const n of npcs) contagemNpcPorRegistro[n.registro] = (contagemNpcPorRegistro[n.registro] || 0) + 1;
  return { linhas, sprites, vocab, contagem, contagemNpcPorRegistro, aposentadas: [...J.RETIRED_LINE_IDS], starterElements: { ...J.STARTER_ELEMENT } };
}
