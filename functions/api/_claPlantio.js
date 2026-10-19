// ---------------------------------------------------------------------------
// O PLANTIO DO CLÃ (D-14..D-17). UMA planta por clã por ESTAÇÃO.
//
// CALENDÁRIO FIXO (hemisfério SUL, dono brasileiro; sem fuso, pelo dia do jogador):
//   primavera set-nov = cerejeira (cerejeira+acácia) · verão dez-fev = cacto (cacto+coqueiro)
//   outono    mar-mai = abóbora                      · inverno jun-ago = pinheiro (fruto: pinhão)
// (18/10/2026: girassol e melancia saíram; as 4 espécies são as 4 árvores do Bosque.
//  Dado antigo migra NA LEITURA por `ESPECIE_LEGADO`: girassol→cerejeira, melancia→cacto,
//  a mesma estação; idempotente, e nada é regravado até a próxima escrita normal.)
// Janeiro e fevereiro pertencem ao verão que COMEÇOU em dezembro do ano anterior
// (a chave da estação usa o ano do início: `2026-verao` cobre dez/2026..fev/2027).
//
// CRESCIMENTO: precisa de `PLANTIO_DIAS` (14) dias CUIDADOS. Um dia conta como
// cuidado quando (a) rega >= METADE dos membros daquele dia (arredondada p/ cima;
// só entra quem já era membro no dia) E (b) alguém fez a PROTEÇÃO (corvos/yetis).
// Dia sem uma das duas = +1 dia de atraso (a planta só não avança). Descuido
// NUNCA mata a planta nem reduz a qualidade do fruto (Q1 default).
//
// COLHEITA: concluída (14 dias cuidados), cada membro colhe 1 fruto por SEMANA
// ISO. Fruto = bônus leve (Bits pequenos + item cosmético), NÃO substitui comida
// (G-01). D-17: a árvore persiste por espécie; a cada virada de ano o nível sobe
// 1 e o tier do fruto sobe 1 (teto `ARVORE_TIER_MAX`).
//
// Escritor único por chave: `claPlantioM:<gid>:<save>` (rega/proteção/colheita
// de UMA pessoa). `claPlantio:<gid>` só é escrito ao PLANTAR; `claProt:<gid>:<dia>`
// é o selo de "1 proteção por dia".
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { semanaDoDia, numDia, diaDeNum } from './_coop.js';

export const PLANTIO_TTL = 86400 * 400;
export const PLANTIO_DIAS = 14;
export const PLANTIO_HIST_MAX = 120;
export const ARVORE_TIER_MAX = 3;
export const ARVORE_NIVEL_MAX = 9;

export const ESTACOES = Object.freeze({
  primavera: { especie: 'cerejeira', meses: [9, 10, 11] },
  verao: { especie: 'cacto', meses: [12, 1, 2] },
  outono: { especie: 'abobora', meses: [3, 4, 5] },
  inverno: { especie: 'pinheiro', meses: [6, 7, 8] },
});
export const ESPECIES = Object.freeze(Object.values(ESTACOES).map(e => e.especie));
/** Espécies aposentadas -> a espécie da MESMA estação. */
export const ESPECIE_LEGADO = Object.freeze({ girassol: 'cerejeira', melancia: 'cacto' });
/** Idempotente: espécie nova (ou desconhecida) volta como veio. */
export const migrarEspecie = e => (typeof e === 'string' && Object.hasOwn(ESPECIE_LEGADO, e) ? ESPECIE_LEGADO[e] : e);
const migrarFruto = f => {
  if (!f || typeof f !== 'object') return f;
  const especie = migrarEspecie(f.especie);
  const id = typeof f.id === 'string' ? f.id.replace(/^fruto-(girassol|melancia)-/, (_, e) => `fruto-${ESPECIE_LEGADO[e]}-`) : f.id;
  return { ...f, especie, id };
};

export const plantioKey = gid => `claPlantio:${gid}`;
export const plantioMembroKey = (gid, save) => `claPlantioM:${gid}:${save}`;
export const protKey = (gid, day) => `claProt:${gid}:${day}`;
export const arvoresKey = gid => `claArvores:${gid}`;

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };

/** A estação de um dia `YYYY-MM-DD`: `{ key, estacao, especie, ano }`. */
export function estacaoDoDia(day) {
  const ano = +day.slice(0, 4);
  const mes = +day.slice(5, 7);
  const estacao = Object.keys(ESTACOES).find(k => ESTACOES[k].meses.includes(mes)) ?? 'verao';
  // jan/fev: o verão começou em dezembro do ano anterior.
  const anoDaEstacao = estacao === 'verao' && mes <= 2 ? ano - 1 : ano;
  return { key: `${anoDaEstacao}-${estacao}`, estacao, especie: ESTACOES[estacao].especie, ano: anoDaEstacao };
}

/** Nível/tier da árvore da espécie plantada em `ano` (primeiro plantio em `primeiroAno`). */
export function arvoreDe(primeiroAno, ano) {
  const nivel = Math.min(ARVORE_NIVEL_MAX, Math.max(1, 1 + ano - primeiroAno));
  return { nivel, tier: Math.min(ARVORE_TIER_MAX, nivel) };
}

/** O fruto (determinístico, sem sorteio): bônus leve e cosmético. */
export function frutoDe(especie, tier) {
  const t = Math.min(ARVORE_TIER_MAX, Math.max(1, Math.floor(tier) || 1));
  return { id: `fruto-${especie}-t${t}`, especie, tier: t, bits: 5 * t };
}

/**
 * Avalia o crescimento (PURA). `membros`: `[{save, desde?}]`; `membro`:
 * `{ [save]: { water:[dias], prot:[dias] } }`.
 * Dia contado = rega >= ceil(n/2) entre os membros de então E alguém protegeu.
 * O dia de HOJE só conta se já está completo; não completo = ainda pendente
 * (não é atraso até o dia acabar).
 * @returns {{ cared:number, delays:number, mature:boolean, maturedOn:string|null, todayWatered:boolean, todayProtected:boolean }}
 */
export function avaliarCrescimento({ plantedDay, today, membros, membro }) {
  let cared = 0, delays = 0, maturedOn = null;
  const ini = numDia(plantedDay), fim = numDia(today);
  let todayWatered = false, todayProtected = false;
  for (let n = ini; n <= fim; n++) {
    const d = diaDeNum(n);
    const eleg = membros.filter(m => !m.desde || m.desde <= d);
    const base = eleg.length || 1;
    const regou = eleg.filter(m => membro[m.save]?.water?.includes(d)).length;
    const prot = membros.some(m => membro[m.save]?.prot?.includes(d));
    const ok = regou >= Math.ceil(base / 2) && prot;
    if (d === today) { todayWatered = regou >= Math.ceil(base / 2); todayProtected = prot; }
    if (ok && !maturedOn) {
      cared++;
      if (cared >= PLANTIO_DIAS) maturedOn = d;
    } else if (!ok && d !== today && !maturedOn) delays++;
  }
  return { cared: Math.min(cared, PLANTIO_DIAS), delays, mature: !!maturedOn, maturedOn, todayWatered, todayProtected };
}

export function normalizarPlanta(r) {
  const species = migrarEspecie(r?.species);
  if (!r || typeof r.season !== 'string' || !ESPECIES.includes(species) || !DIA_RE.test(r.plantedDay)) return null;
  return {
    v: 1, season: r.season, species, plantedDay: r.plantedDay,
    by: typeof r.by === 'string' ? r.by : null,
    nivel: Math.min(ARVORE_NIVEL_MAX, Math.max(1, Math.floor(r.nivel) || 1)),
    tier: Math.min(ARVORE_TIER_MAX, Math.max(1, Math.floor(r.tier) || 1)),
  };
}

const diasLista = a => (Array.isArray(a) ? a.filter(d => typeof d === 'string' && DIA_RE.test(d)) : []).slice(-PLANTIO_HIST_MAX);
export function normalizarMembro(r) {
  return {
    v: 1,
    water: diasLista(r?.water),
    prot: diasLista(r?.prot),
    last: r?.last && typeof r.last.week === 'string' && r.last.fruit && typeof r.last.receipt === 'string' ? { week: r.last.week, fruit: migrarFruto(r.last.fruit), receipt: r.last.receipt } : null,
    harvest: (Array.isArray(r?.harvest) ? r.harvest.filter(w => typeof w === 'string') : []).slice(-12),
  };
}

export async function lerPlanta(env, gid) { return normalizarPlanta(parse(await kvOrThrow(env).get(plantioKey(gid)))); }
export async function lerMembro(env, gid, save) { return normalizarMembro(parse(await kvOrThrow(env).get(plantioMembroKey(gid, save)))); }
async function gravarMembro(env, gid, save, m) {
  await kvOrThrow(env).put(plantioMembroKey(gid, save), JSON.stringify(m), { expirationTtl: PLANTIO_TTL });
  return m;
}
async function lerArvores(env, gid) {
  const r = parse(await kvOrThrow(env).get(arvoresKey(gid)));
  const out = {};
  // Chave legada entra na espécie nova; se as duas existem, vale o ano MAIS ANTIGO (a árvore já era mais velha).
  for (const [k, v] of Object.entries(r ?? {})) {
    const e = migrarEspecie(k);
    if (ESPECIES.includes(e) && Number.isInteger(v)) out[e] = out[e] === undefined ? v : Math.min(out[e], v);
  }
  return out;
}

/** Planta a espécie da estação de `hoje`. `{ok:false, reason:'already-planted'}` se já há planta nesta estação. */
export async function plantar(env, gid, save, hoje) {
  const est = estacaoDoDia(hoje);
  const atual = await lerPlanta(env, gid);
  if (atual && atual.season === est.key) return { ok: false, reason: 'already-planted' };
  const arvores = await lerArvores(env, gid);
  const primeiro = arvores[est.especie] ?? est.ano;
  if (arvores[est.especie] === undefined) {
    await kvOrThrow(env).put(arvoresKey(gid), JSON.stringify({ ...arvores, [est.especie]: est.ano }), { expirationTtl: PLANTIO_TTL });
  }
  const { nivel, tier } = arvoreDe(primeiro, est.ano);
  const planta = { v: 1, season: est.key, species: est.especie, plantedDay: hoje, by: save, nivel, tier };
  await kvOrThrow(env).put(plantioKey(gid), JSON.stringify(planta), { expirationTtl: PLANTIO_TTL });
  return { ok: true, planta };
}

async function estado(env, g, hoje) {
  const planta = await lerPlanta(env, g.id);
  const est = estacaoDoDia(hoje);
  if (!planta || planta.season !== est.key) return { est, planta: null };
  const membros = g.members.map(m => ({ save: m, desde: g.desde?.[m] }));
  const lidos = await Promise.all(g.members.map(m => lerMembro(env, g.id, m)));
  const membro = Object.fromEntries(g.members.map((m, i) => [m, lidos[i]]));
  return { est, planta, membros, membro, cresc: avaliarCrescimento({ plantedDay: planta.plantedDay, today: hoje, membros, membro }) };
}

/** Rega 1x/dia/membro. `reason`: 'no-plant' | 'grown' | 'already-watered'. */
export async function regar(env, g, save, hoje) {
  const s = await estado(env, g, hoje);
  if (!s.planta) return { ok: false, reason: 'no-plant' };
  if (s.cresc.mature) return { ok: false, reason: 'grown' };
  const m = s.membro[save];
  if (m.water.includes(hoje)) return { ok: false, reason: 'already-watered' };
  m.water = [...m.water, hoje].slice(-PLANTIO_HIST_MAX);
  await gravarMembro(env, g.id, save, m);
  return { ok: true };
}

/** Proteção: 1 membro por dia (selo `claProt:<gid>:<dia>`, relido como no `guildClaim`). */
export async function proteger(env, g, save, hoje, selo = Math.random().toString(36).slice(2)) {
  const s = await estado(env, g, hoje);
  if (!s.planta) return { ok: false, reason: 'no-plant' };
  if (s.cresc.mature) return { ok: false, reason: 'grown' };
  if (s.cresc.todayProtected || await kvOrThrow(env).get(protKey(g.id, hoje))) return { ok: false, reason: 'already-protected' };
  await kvOrThrow(env).put(protKey(g.id, hoje), JSON.stringify({ selo }), { expirationTtl: 86400 * 3 });
  const lido = parse(await kvOrThrow(env).get(protKey(g.id, hoje)));
  if (lido?.selo !== selo) return { ok: false, reason: 'already-protected' };
  const m = s.membro[save];
  m.prot = [...m.prot, hoje].slice(-PLANTIO_HIST_MAX);
  await gravarMembro(env, g.id, save, m);
  return { ok: true };
}

/** Colhe 1 fruto por semana ISO. `reason`: 'no-plant' | 'not-grown' | 'already-harvested'. */
export async function colher(env, g, save, hoje) {
  const s = await estado(env, g, hoje);
  if (!s.planta) return { ok: false, reason: 'no-plant' };
  if (!s.cresc.mature) return { ok: false, reason: 'not-grown' };
  const semana = semanaDoDia(hoje);
  const m = s.membro[save];
  // Reentregavel: repetir na mesma semana devolve o MESMO fruto/recibo (o app credita 1x por recibo).
  if (m.harvest.includes(semana)) {
    if (m.last && m.last.week === semana) return { ok: true, repeat: true, fruit: m.last.fruit, week: semana, receipt: m.last.receipt };
    return { ok: false, reason: 'already-harvested' };
  }
  const fruit = frutoDe(s.planta.species, s.planta.tier);
  const receipt = `${g.id}|${semana}|${s.planta.season}`;
  m.harvest = [...m.harvest, semana].slice(-12);
  m.last = { week: semana, fruit, receipt };
  await gravarMembro(env, g.id, save, m);
  return { ok: true, fruit, week: semana, receipt };
}

/**
 * A VISTA do plantio. Coletiva: nenhum número por pessoa (quem regou, quantos).
 * `stage` 0..4 derivado de dias cuidados; `rainhaRega` binário (`waterOk`).
 */
export async function vistaDoPlantio(env, g, eu, hoje) {
  const s = await estado(env, g, hoje);
  const base = { season: s.est.estacao, seasonKey: s.est.key, species: s.est.especie, planted: !!s.planta };
  if (!s.planta) return { ...base, canPlant: true, stage: 0, mature: false, level: null, tier: null, today: { waterOk: false, protectedToday: false }, mine: { wateredToday: false, canHarvest: false } };
  const c = s.cresc;
  const mine = s.membro[eu] ?? normalizarMembro(null);
  return {
    ...base, canPlant: false,
    stage: c.mature ? 4 : Math.min(3, Math.floor((c.cared / PLANTIO_DIAS) * 4)),
    mature: c.mature,
    progress: Math.round((c.cared / PLANTIO_DIAS) * 100),
    delayed: c.delays > 0,
    level: s.planta.nivel, tier: s.planta.tier,
    today: { waterOk: c.todayWatered, protectedToday: c.todayProtected },
    mine: { wateredToday: mine.water.includes(hoje), canHarvest: c.mature && !mine.harvest.includes(semanaDoDia(hoje)) },
  };
}
