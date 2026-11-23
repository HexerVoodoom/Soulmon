// Gera a TABELA DE SOULMONS (artefato do dono). UNIDADE = a ESPECIE/FORMA (arte/estagio/ramo unico), uma vez so, agrupada por LINHAGEM
// (Rookie -> Champion x3 -> Ultimate x3 -> Mega x3 -> Ultra). Os simulados sim_* sao REFERENCIAS (coluna `usado_por`/`apelidos`), nao linhas:
// cada um usa as formas da criatura do seu ELEMENTO (spriteDoElemento), entao varios sims da mesma linhagem apontam para as mesmas formas.
// Ultra = tipo ABSOLUTO (os tres tipos ao mesmo tempo, neutro). Só LÊ o repo; escreve FORA dele (padrão E:\Soulmon-assets\tabela-soulmons):
//   soulmons.json, soulmons.csv e tabela.html (autocontido, dados e miniaturas dos sprites embutidos; molde em `scripts/tabela-soulmons.template.html`).
// O HTML segue o formato do visualizador de artefatos (sem doctype/html/head/body, sem download: o CSV sai num painel com Copiar).
// Uso: node scripts/gerar-tabela-soulmons.mjs [pastaDeSaida]
// Os módulos TS do jogo são empacotados em memória com o esbuild do repo (assets viram vazio): a fonte da verdade continua sendo o código.
// Colunas `fonte` e `derivado`: cada linha diz de onde veio e quais campos foram CALCULADOS (podem divergir do que o jogo faz num encontro real).
import { build } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = resolve(process.argv[2] || 'E:/Soulmon-assets/tabela-soulmons');

const entrada = `
export { ENEMY_ROSTER, RAVEN_ENTRY } from './src/utils/enemyRoster';
export { RAMOS_INIMIGOS_DATA, ELENCO_ORACULO_DATA } from './src/utils/enemyRosterData';
export { NOVOS_DATA, FORMAS_ALTAS } from './src/utils/novosSoulmonData';
export { foeStrikeForm } from './src/utils/combatFx';
export { magiaOuCorte, meleeImpactOf } from './src/utils/combate/golpeImpacto';
export { foeKindOf, FOE_MIX } from './src/utils/combate/foeFamilies';
export { SCHOOL_STRIKE_FORM } from './src/utils/soulProfile/ficha/strikeForm';
export { SIMULADOS } from './functions/api/_simulados.data.js';
export { escolaDoSimulado, simulaMagia } from './functions/api/_simulados.js';
export { STARTER_ELEMENT, STARTER_ALIGNMENT } from './src/utils/starterElements';
export { STARTER_NAMES, STARTER_IDS } from './src/utils/sprites';
export { isStrayFoe } from './src/utils/wildFoeLabel';
`;

async function carregarJogo() {
  const arquivo = join(SAIDA, '.jogo.tmp.mjs');
  mkdirSync(SAIDA, { recursive: true });
  await build({
    stdin: { contents: entrada, resolveDir: RAIZ, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: arquivo, logLevel: 'error',
    loader: { '.png': 'empty', '.webp': 'empty', '.jpg': 'empty', '.svg': 'empty', '.mp3': 'empty', '.ogg': 'empty', '.wav': 'empty', '.css': 'empty' },
    define: { 'import.meta.glob': '__glob', 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"production","BASE_URL":"/"}', 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true' },
    banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url); const __glob = () => ({});" },
  });
  const mod = await import(pathToFileURL(arquivo).href);
  unlinkSync(arquivo);
  return mod;
}

const J = await carregarJogo();
const ESTAGIOS = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const PERSONS = ['poder', 'harmonia', 'benevolencia'];
const SUFIXO = { poder: 'power', harmonia: 'harmony', benevolencia: 'benevolence' };
const NOVO_POR_ELEMENTO = Object.fromEntries(J.NOVOS_DATA.map(n => [n.element, n]));
const NOVO_POR_ID = Object.fromEntries(J.NOVOS_DATA.map(n => [n.id, n]));

// ── derivados ────────────────────────────────────────────────────────────────
const TIPO_POR_KIND = { direct: 'direto', dot: 'dot', heal: 'cura', hot: 'hot', buff: 'buff', debuff: 'debuff' };
/** Forma + acabamento do golpe de INIMIGO (`ArenaGame`/`DungeonGame`: foeStrikeForm + meleeImpactOf com forma). */
function ataqueInimigo(elemento, chave, nome) {
  const forma = J.foeStrikeForm(elemento, 'basica');
  const impacto = forma === 'ranged' ? J.magiaOuCorte(elemento, chave) : J.meleeImpactOf({ element: elemento, key: chave, name: nome });
  return {
    tipo: forma === 'ranged' ? (impacto === 'concussao' ? 'ranged_splash' : 'ranged_corte') : (impacto === 'concussao' ? 'melee_splash' : 'melee_corte'),
    especialForma: J.foeStrikeForm(elemento, 'especial'),
  };
}
const mix = (estagio) => { const m = J.FOE_MIX[estagio === 'rookie' ? 'rookie' : 'adulto']; return `direto ${m.direct}% / buff ${m.buff}% / dot ${m.dot}% / cura ${m.heal}% / hot ${m.hot}% / debuff ${m.debuff}%`; };


// ── sprites: mesmas regras de `rosterSpriteOf` (src/utils/novosSoulmon.ts) e `enemyRosterArt.ts`, resolvidas no disco ─────────────
const ASSETS = 'src/assets/soulmon';
const arq = (rel) => (existsSync(join(RAIZ, ASSETS, rel)) ? `${ASSETS}/${rel}` : '');
// os PNGs de `novos/` se chamam pelo ELEMENTO da criatura base (`fogo-rookie.png` = Embrit), nao pelo id
const NOVOS_ESTAGIO = (id, est) => { const el = NOVO_POR_ID[id]?.element; return el ? arq(`novos/${el}-${est}.png`) || (est === 'rookie' ? '' : arq(`novos/${el}-champion.png`)) : ''; };
function spriteDoRoster(e) {
  if (e.kind === 'mascote') return arq('corvo-neutro/corvo-neutro.png');
  const a = e.artFile ?? '';
  if (e.kind === 'ramo') return arq(`novos-arquivo/ramos/${a}.png`);
  if (e.kind === 'paralelo') return arq(`novos-arquivo/paralelos/${a}.png`);
  if (e.kind === 'forma') return arq(`novos-arquivo/combinados-formas/${a}.png`);
  if (e.kind === 'base') return NOVOS_ESTAGIO(e.id, e.stage);
  if (e.kind === 'api') return arq(`inimigos-api/${a}.png`);
  // combinado: arte propria; sem ela, o app cai no rookie da criatura base do elemento dominante (1o componente)
  return arq(`novos-arquivo/combinados/${a}.png`) || (NOVO_POR_ELEMENTO[e.elements[0]] ? arq(`novos/${e.elements[0]}-rookie.png`) : '');
}
/** Simulado/catalogo: a criatura do ELEMENTO do sprite (base do elemento; senao a entrada do roster daquele elemento). */
function spriteDoElemento(elemento, estagio) {
  const n = NOVO_POR_ELEMENTO[elemento];
  if (n) return NOVOS_ESTAGIO(n.id, estagio);
  const e = J.ENEMY_ROSTER.find(x => x.element === elemento && x.stage === estagio) || J.ENEMY_ROSTER.find(x => x.element === elemento && x.stage === 'rookie');
  return e ? spriteDoRoster(e) : '';
}

const linhas = [];
let ordem = 0;
function add(l) {
  linhas.push({ ordem: ordem++, sprite: '', elementos: [], ramo: '', basico: '', especial_nome: '', ataque_especial_forma: '', especial_mix: '', nota: '', derivado: [], ...l });
}
const estIdx = (e) => ESTAGIOS.indexOf(e);

// ── 1) Inimigos do roster (Arena, Masmorra/Rift, selvagens/desgarrados) ──────
const ramoDe = new Map(); // id do ramo -> { linha, ramo }
for (const [criatura, , ramo] of J.RAMOS_INIMIGOS_DATA) ramoDe.set(`${criatura}${ramo}`, { linha: criatura, ramo });
const ultraOraculo = [];
for (const [id, , , , , ramos, ultra] of J.ELENCO_ORACULO_DATA) {
  for (const ramo of Object.keys(ramos)) ramoDe.set(`${id}${ramo}`, { linha: id, ramo });
  ultraOraculo.push({ id, ultra });
}
const strayKinds = new Set(['base', 'api', 'mascote']);
for (const e of J.ENEMY_ROSTER) {
  const r = ramoDe.get(e.id);
  const linha = r ? r.linha : e.id;
  const ramoNome = r ? r.ramo : '';
  const derivado = ['ataque_tipo', 'especial_tipo'];
  let personalidade; let fontePers;
  if (r) { personalidade = r.ramo; fontePers = 'RAMOS_INIMIGOS_DATA / ELENCO_ORACULO_DATA (src/utils/enemyRosterData.ts)'; }
  else if (e.kind === 'base') { personalidade = NOVO_POR_ID[e.id]?.line ?? ''; fontePers = 'NOVOS_DATA.line (src/utils/novosSoulmonData.ts)'; }
  else if (e.kind === 'mascote') { personalidade = 'neutro'; fontePers = 'RAVEN_ENTRY (elemento neutro, sem linha)'; derivado.push('personalidade'); }
  else { personalidade = NOVO_POR_ELEMENTO[e.elements[0]]?.line ?? ''; fontePers = 'derivada: linha da criatura base do 1o componente do elemento (NOVOS_DATA)'; derivado.push('personalidade'); }
  const a = ataqueInimigo(e.element, e.name, e.name);
  const contexto = ['arena', 'rift'];
  // Desgarrado do Torneio (`strayFoes.ts`): estágio forte, exceto combinado/paralelo/forma (ramos Ultimate/Mega entram).
  if (J.isStrayFoe(e.stage) && (strayKinds.has(e.kind) || e.kind === 'ramo')) contexto.push('selvagem');
  if (e.kind === 'mascote') contexto.push('jogador');
  add({
    id: e.key, nome: e.name, sprite: spriteDoRoster(e), linha, estagio: e.stage, personalidade, elemento_base: e.element, elementos: [...e.elements], ramo: ramoNome,
    ataque_tipo: a.tipo, ataque_especial_forma: a.especialForma, especial_tipo: 'variavel', especial_mix: mix(e.stage), contexto,
    basico: e.basico?.pt ?? '', especial_nome: e.especial?.pt ?? '',
    nota: `tipo do roster: ${e.kind}${e.artFile ? `; arte ${e.artFile}` : ''}`,
    fonte: `ENEMY_ROSTER (src/utils/enemyRoster.ts); personalidade: ${fontePers}; ataque: foeStrikeForm + magiaOuCorte/meleeImpactOf (src/utils/combatFx.ts, combate/golpeImpacto.ts); especial: foeKindOf/FOE_MIX (src/utils/combate/foeFamilies.ts)`,
    derivado,
  });
}
// Ultra do roster: o roster não tem arte Ultra; só os 2 chefes do Oráculo (Arena) e as 20 formas Ultra do catálogo de novos.
for (const { id, ultra } of ultraOraculo) {
  const base = J.ENEMY_ROSTER.find(e => e.id === id && e.stage === 'rookie');
  const a = ataqueInimigo(base.element, ultra, ultra);
  add({
    id: `${id}-ultra`, nome: ultra, sprite: arq(`novos/${NOVO_POR_ID[id]?.element}-ultra.png`) || spriteDoRoster(base), linha: id, estagio: 'ultra', personalidade: 'absoluto', elemento_base: base.element, elementos: [...base.elements],
    ataque_tipo: a.tipo, ataque_especial_forma: a.especialForma, especial_tipo: 'variavel', especial_mix: mix('ultra'), contexto: ['arena'],
    basico: base.basico.pt, especial_nome: base.especial.pt, nota: 'chefe Ultra da Arena (ARENA_CHEFES_ULTRA)',
    fonte: 'ELENCO_ORACULO_DATA[6] / ARENA_CHEFES_ULTRA (src/utils/arena.ts); ataque e especial como o roster', derivado: ['personalidade', 'ataque_tipo', 'especial_tipo'],
  });
}
for (const n of J.NOVOS_DATA) {
  const nome = J.FORMAS_ALTAS[n.id]?.ultra;
  if (!nome) continue;
  const a = ataqueInimigo(n.element, nome, nome);
  add({
    id: `${n.id}-ultra`, nome, sprite: arq(`novos/${n.element}-ultra.png`), linha: n.id, estagio: 'ultra', personalidade: 'absoluto', elemento_base: n.element, elementos: [n.element],
    ataque_tipo: a.tipo, ataque_especial_forma: a.especialForma, especial_tipo: 'variavel', especial_mix: mix('ultra'), contexto: ['catalogo'],
    basico: n.basico.pt, especial_nome: n.especial.pt, nota: 'forma Ultra com arte instalada; o roster de inimigos nao a sorteia (ENEMY_STAGES vai ate Mega)',
    fonte: 'FORMAS_ALTAS (src/utils/novosSoulmonData.ts)', derivado: ['personalidade', 'ataque_tipo', 'especial_tipo'],
  });
}

// ── 2) Linhas do JOGADOR (5 iniciais; as formas evoluidas sao geradas pelo Oraculo, sem nome fixo) ─────────
for (const id of J.STARTER_IDS) {
  const nome = J.STARTER_NAMES[id];
  const el = J.STARTER_ELEMENT[id];
  const raiz = J.STARTER_ALIGNMENT[id];
  const comum = {
    linha: `starter:${id}`, elemento_base: el, elementos: [el], contexto: ['jogador'], ataque_tipo: 'variavel_ficha', especial_tipo: 'escolha_jogador',
    ataque_especial_forma: '', especial_mix: '', basico: '', especial_nome: '',
  };
  add({ ...comum, id: `starter:${id}:rookie`, nome, sprite: arq(`starters/${id}.png`), estagio: 'rookie', personalidade: raiz,
    nota: 'inicial oferecido na criacao; golpes por ficha (escola) e especial escolhido pelo jogador',
    fonte: 'STARTER_IDS / STARTER_NAMES (src/utils/sprites.ts); STARTER_ELEMENT e STARTER_ALIGNMENT (src/utils/starterElements.ts)', derivado: ['ataque_tipo', 'especial_tipo'] });
  for (const est of ['champion', 'ultimate', 'mega']) {
    for (const p of PERSONS) {
      add({ ...comum, id: `starter:${id}:${est}-${SUFIXO[p]}`, nome: `${nome} (${est}, ${p})`, estagio: est, personalidade: p,
        nota: 'forma gerada pelo Oraculo para o jogador; nome e arte nao sao fixos (o nome aqui e so um rotulo)',
        fonte: 'ramos champion/ultimate/mega por tipo: src/utils/oracle.ts (StageId, linhas Poder/Harmonia/Benevolencia); elemento: STARTER_ELEMENT', derivado: ['nome', 'ataque_tipo', 'especial_tipo'] });
    }
  }
  add({ ...comum, id: `starter:${id}:ultra`, nome: `${nome} (ultra)`, estagio: 'ultra', personalidade: 'absoluto',
    nota: 'o Oraculo chama o ultimate de "perfeito"; Ultra e a forma unica final',
    fonte: 'src/utils/oracle.ts (StageId) e src/utils/libraryForms.ts (STAGE_KEY)', derivado: ['nome', 'personalidade', 'ataque_tipo', 'especial_tipo'] });
}

// ── 3) Simulados sim_*: NAO sao linhas; viram REFERENCIAS nas formas que usam ──────────────────────────────
// O sprite de um simulado vem do ELEMENTO (spriteDoElemento): a criatura base daquele elemento, estagio a estagio. Entao o simulado aponta para
// as formas da linhagem base do elemento (rookie/champion/ultimate/mega/ultra); se a forma do estagio nao existe, cai no maior estagio existente
// (mesma regra de spriteDoElemento). Varios sims do mesmo elemento = mesma linhagem, mesmas formas.
const formaPorId = new Map(linhas.map(l => [l.id, l]));
const simulados = [];
const simSemForma = [];
for (const p of J.SIMULADOS) {
  const n = NOVO_POR_ELEMENTO[p.element];
  const escola = J.escolaDoSimulado(p.id);
  const ref = { id: p.id, nick: p.nick, apelido: p.petName, caminho: p.line, elemento: p.element, escola, faixa: p.faixa, ancora: p.ancora.estagio, formas: [] };
  for (const est of ESTAGIOS) {
    let alvo = null;
    if (n) {
      for (let i = estIdx(est); i >= 0 && !alvo; i--) alvo = formaPorId.get(`${n.id}-${ESTAGIOS[i]}`) ?? null;
    } else {
      const e = J.ENEMY_ROSTER.find(x => x.element === p.element && x.stage === est) || J.ENEMY_ROSTER.find(x => x.element === p.element && x.stage === 'rookie');
      alvo = e ? formaPorId.get(e.key) ?? null : null;
    }
    if (!alvo) { simSemForma.push(`${p.id}:${est}`); continue; }
    ref.formas.push({ estagio: est, forma: alvo.id });
    alvo.sims = alvo.sims || new Map();
    alvo.sims.set(p.id, p.petName);
  }
  simulados.push(ref);
}
for (const l of linhas) {
  const sims = l.sims ? [...l.sims.entries()] : [];
  delete l.sims;
  l.usado_por = [...l.contexto.filter(c => c !== 'simulado'), ...(sims.length ? ['simulado'] : []), ...sims.map(([id]) => id)];
  if (sims.length && !l.contexto.includes('simulado')) l.contexto.push('simulado');
  // apelidos: nomes dados pelos sims diferentes do nome canonico da especie
  l.apelidos = [...new Set(sims.map(([, nome]) => nome).filter(nome => nome !== l.nome))];
}

// ── ordem: bloco (jogador, simulado, inimigos), linha, estagio, personalidade ───────────────────────────
const bloco = (l) => (l.id.startsWith('starter:') ? 0 : 2);
// dentro de cada linha: estagio e personalidade
const grupos = new Map();
for (const l of linhas) { const k = `${bloco(l)}|${l.linha}`; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(l); }
const final = [];
for (const g of [...grupos.entries()].sort((a, b) => Number(a[0][0]) - Number(b[0][0])).map(([, v]) => v)) {
  g.sort((x, y) => estIdx(x.estagio) - estIdx(y.estagio) || PERSONS.indexOf(x.personalidade) - PERSONS.indexOf(y.personalidade) || x.ordem - y.ordem);
  final.push(...g);
}
final.forEach((l, i) => { l.ordem = i + 1; });
// linhagem: nome (do Rookie, senao da 1a forma) e se evolui. So Rookie = nada alem do Rookie cadastrado; jogador = formas geradas pelo Oraculo por jogador.
const porLinha = new Map();
for (const l of final) { if (!porLinha.has(l.linha)) porLinha.set(l.linha, []); porLinha.get(l.linha).push(l); }
const soRookie = [];
for (const [, g] of porLinha) {
  const raiz = g.find(x => x.estagio === 'rookie') ?? g[0];
  const estagios = new Set(g.map(x => x.estagio));
  const evo = g[0].id.startsWith('starter:') ? 'gerada' : (estagios.size === 1 && estagios.has('rookie') ? 'so_rookie' : 'evolui');
  const nSims = new Set(g.flatMap(x => x.usado_por.filter(u => u.startsWith('sim_')))).size;
  for (const x of g) { x.linhagem_nome = raiz.nome; x.evolucao = evo; x.linhagem_sims = nSims; }
  if (evo !== 'evolui') soRookie.push({ linha: g[0].linha, nome: raiz.nome, motivo: evo === 'gerada' ? 'inicial do jogador: champion/ultimate/mega/ultra sao gerados pelo Oraculo por jogador (sem arte/nome fixo)' : 'so existe a forma Rookie no codigo (COMBINADOS_DATA/INIMIGOS_API_DATA: sem evolucao cadastrada)' });
}

// ── miniaturas: 1 por ARQUIVO (dedup), webp 72px de altura, data URI; linha referencia por indice ───────────
const ALTURA_MINI = 72;
const semSprite = final.filter(l => !l.sprite);
const indiceSprite = new Map(); const miniaturas = [];
for (const l of final) {
  if (!l.sprite || indiceSprite.has(l.sprite)) continue;
  const buf = await sharp(join(RAIZ, l.sprite)).resize({ height: ALTURA_MINI, fit: 'inside', withoutEnlargement: false }).webp({ quality: 78, alphaQuality: 90, effort: 5 }).toBuffer();
  indiceSprite.set(l.sprite, miniaturas.length); miniaturas.push('data:image/webp;base64,' + buf.toString('base64'));
}

// ── saidas ───────────────────────────────────────────────────────────────────
const porContexto = {};
for (const l of final) for (const c of l.contexto) porContexto[c] = (porContexto[c] || 0) + 1;
const porEvolucao = {};
for (const g of porLinha.values()) porEvolucao[g[0].evolucao] = (porEvolucao[g[0].evolucao] || 0) + 1;
const doc = {
  gerado_em: new Date().toISOString(),
  total: final.length, linhagens: porLinha.size, linhagens_por_evolucao: porEvolucao, por_contexto: porContexto, simulados_total: simulados.length, simulados_sem_forma: simSemForma,
  so_rookie: soRookie,
  sem_sprite: { total: semSprite.length, ids: semSprite.map(l => l.id) },
  campos_derivados: {
    ataque_tipo: 'calculado: foeStrikeForm (forma pelo elemento) + magiaOuCorte/meleeImpactOf (acabamento por sorteio estavel); chave de sorteio aproximada pelo nome (no jogo e o nome em PT/EN do encontro)',
    especial_tipo: 'inimigos do roster: sorteado POR ENCONTRO (FOE_MIX), por isso "variavel"; simulados: foeKindOf(estagio, "sim|id|estagio"), fixo; jogador: escolhido na ficha',
    tipo_absoluto: 'todo Ultra (inclusive o do jogador) tem personalidade ABSOLUTO: os tres tipos ao mesmo tempo (neutro). No motor o ultra ja nao tem branch (creatureFormId)',
    personalidade: 'combinados, paralelos, formas e mascote: derivada da criatura base do 1o componente; formas evoluidas do jogador: rotulo',
  },
  linhas: final,
  simulados_ref: simulados,
};
mkdirSync(SAIDA, { recursive: true });
writeFileSync(join(SAIDA, 'soulmons.json'), JSON.stringify(doc, null, 1));

const COLUNAS = ['id', 'nome', 'apelidos', 'sprite', 'linha', 'linhagem_nome', 'estagio', 'personalidade', 'elemento_base', 'ataque_tipo', 'especial_tipo', 'contexto', 'usado_por', 'evolucao', 'derivado', 'fonte'];
const csvCel = (v) => { const s = Array.isArray(v) ? v.join(';') : String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync(join(SAIDA, 'soulmons.csv'), '\ufeff' + [COLUNAS.join(','), ...final.map(l => COLUNAS.map(c => csvCel(l[c])).join(','))].join('\r\n') + '\r\n');

// HTML autocontido: o molde recebe o JSON no lugar de __DADOS__ (sem `</` para nao fechar o script).
const molde = readFileSync(join(RAIZ, 'scripts', 'tabela-soulmons.template.html'), 'utf8');
const dados = JSON.stringify({ gerado_em: doc.gerado_em, linhas: final.map(({ ordem, ...r }) => ({ ...r, sp: r.sprite ? indiceSprite.get(r.sprite) : -1 })), sprites: miniaturas, sem_sprite: semSprite.length, linhagens: porLinha.size, so_rookie: soRookie, simulados: simulados.length }).replace(/</g, '\\u003c');
writeFileSync(join(SAIDA, 'tabela.html'), molde.replace('__DADOS__', () => dados));

console.log(`Tabela de Soulmons: ${final.length} linhas -> ${SAIDA}`);
console.log(JSON.stringify(porContexto));
console.log(`Sprites: ${miniaturas.length} miniaturas unicas; ${semSprite.length} linhas sem sprite`);
console.log(`linhagens: ${porLinha.size} ${JSON.stringify(porEvolucao)}; so Rookie/gerada: ${soRookie.length}; simulados: ${simulados.length}, sem forma: ${simSemForma.length}`);
console.log(`sem sprite: ${semSprite.map(l => l.id).join(', ')}`);
