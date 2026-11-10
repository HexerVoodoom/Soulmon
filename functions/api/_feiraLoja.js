// ---------------------------------------------------------------------------
// A FEIRA DE VERDADE (pedido do dono, 10/11/2026): na volta da Missão, com uma chance RARA, o Soulmon encontra uma feira:
// um vendedor com 4 a 6 itens do Mercado (Itens, Decoração, Background) e, raramente, da Hexsmith, com 10% a 50% de desconto,
// só em Bits e SEM ingredientes. É um evento ADITIVO da volta (campo `feiraLoja` em `guildRaidHit`; não substitui o `evento`
// do Chefe/Desafio, que segue existindo para a sala da Feira e para o cliente antigo).
//
// O SERVIDOR decide tudo: se há feira (semente determinística por conta+dia: reabrir não re-sorteia), qual vendedor, quais
// itens e o desconto de cada um. A oferta é GRAVADA ao sortear (`feiraLoja:<save>:<dia>`), então comprar um item (que passa a
// ser "seu") não muda a lista. Limite de 1 unidade por item por oferta (`feiraLojaCompra`). Expira no fim do dia do jogador
// (a oferta é do `dayKey` em que foi sorteada) e não acumula.
//
// CONFIANÇA (igual às demais compras em Bits): o saldo de Bits mora no save do cliente. O servidor define a OFERTA (itens,
// preço final, limite) e só libera a compra de item/preço que ele mesmo sorteou; quem debita é o cliente, pelo caminho da
// loja (`applyShopBuy` com o preço da oferta). Exceção: os itens da Hexsmith, cuja POSSE é do servidor (REGISTRO §216), são
// pagos e entregues pelo servidor (`save.js › action=hexFair`), contra o `gamePoints` GRAVADO.
//
// Espelho de catálogo: Pages Functions não importam de `src/`; `FEIRA_LOJA_CATALOGO` copia (id, tipo, preço, ambiente) dos
// itens à venda em Bits de `src/utils/shop.ts`. `feiraLoja.paridade.test.js` trava a cópia.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { feiraLigada, hash32 } from './_feira.js';
import { COUNTER_RING } from './_elementoBase.js';
import { SPECIAL_FAMILIES } from './_combate.js';
import { hexCost, sanitizeHexsmith, HEX_MAX_OWNED, parseHexItem } from './_hexsmith.js';

/** Chance (em %) de uma volta da Missão encontrar a feira de verdade. Constante, sem custo extra para a pessoa. */
export const FEIRA_LOJA_PCT = 8;
export const DESCONTO_MIN = 10;
export const DESCONTO_MAX = 50;
export const ITENS_MIN = 4;
export const ITENS_MAX = 6;
export const FEIRA_LOJA_TTL = 3 * 24 * 3600;

const ISO_DIA = /^\d{4}-\d{2}-\d{2}$/;
export const feiraLojaKey = (save, dia) => `feiraLoja:${save}:${dia}`;
export const feiraLojaCompraKey = (save, dia) => `feiraLojaCompra:${save}:${dia}`;

/** [id, tipo, preço, ambiente]: espelho dos itens de `SHOP_ITEMS` em Bits, sem `unlock`, sem exclusivo de elemento, fora o que nunca é vendido. */
export const FEIRA_LOJA_CATALOGO = Object.freeze([
  ['chip-power', 'chip', 360, ''],
  ['chip-harmony', 'chip', 360, ''],
  ['chip-benevolence', 'chip', 360, ''],
  ['chip-big-power', 'chip', 840, ''],
  ['chip-big-harmony', 'chip', 840, ''],
  ['chip-big-benevolence', 'chip', 840, ''],
  ['chip-reduce-power', 'chip', 360, ''],
  ['chip-reduce-harmony', 'chip', 360, ''],
  ['chip-reduce-benevolence', 'chip', 360, ''],
  ['furn-sofa', 'furniture', 300, 'indoor'],
  ['furn-chair', 'furniture', 360, 'indoor'],
  ['furn-books', 'furniture', 360, 'indoor'],
  ['furn-lamp', 'furniture', 300, 'indoor'],
  ['furn-rug', 'furniture', 420, 'indoor'],
  ['furn-plant', 'furniture', 200, 'any'],
  ['furn-picture', 'furniture', 390, 'any'],
  ['furn-campfire', 'furniture', 360, 'outdoor'],
  ['furn-tent', 'furniture', 420, 'outdoor'],
  ['furn-rock', 'furniture', 200, 'outdoor'],
  ['furn-grass', 'furniture', 220, 'outdoor'],
  ['furn-sand', 'furniture', 220, 'outdoor'],
  ['furn-stone-tiles', 'furniture', 260, 'any'],
  ['furn-deck', 'furniture', 260, 'any'],
  ['furn-circuit-mat', 'furniture', 420, 'any'],
  ['furn-arcade-cab', 'furniture', 700, 'indoor'],
  ['furn-cauldron', 'furniture', 650, 'any'],
  ['furn-crystal', 'furniture', 600, 'outdoor'],
  ['furn-well', 'furniture', 700, 'outdoor'],
  ['furn-lantern', 'furniture', 330, 'any'],
  ['furn-mushrooms', 'furniture', 330, 'outdoor'],
  ['furn-hourglass', 'furniture', 650, 'any'],
  ['furn-food-bowl', 'furniture', 200, 'any'],
  ['furn-window', 'furniture', 360, 'indoor'],
  ['furn-garland', 'furniture', 200, 'any'],
  ['furn-wind-chime', 'furniture', 330, 'any'],
  ['furn-clock', 'furniture', 390, 'indoor'],
  ['bg-night', 'bg', 300, ''],
  ['bg-desert', 'bg', 300, ''],
  ['bg-matrix', 'bg', 300, ''],
  ['bg-forest', 'bg', 300, ''],
  ['bg-ocean', 'bg', 300, ''],
  ['bg-gameboy', 'bg', 300, ''],
  ['bg-snow', 'bg', 360, ''],
  ['bg-lava', 'bg', 360, ''],
  ['bg-sakura', 'bg', 360, ''],
  ['bg-toytown', 'bg', 400, ''],
  ['bg-synthwave', 'bg', 500, ''],
  ['bg-attic', 'bg', 540, ''],
  ['bg-arcade', 'bg', 540, ''],
  ['bg-library', 'bg', 600, ''],
  ['bg-shrine', 'bg', 600, ''],
  ['bg-rooftop', 'bg', 600, ''],
  ['bg-cloudsea', 'bg', 660, ''],
  ['bg-observatory', 'bg', 660, ''],
  ['bg-swamp', 'bg', 660, ''],
  ['bg-lakeside', 'bg', 480, ''],
  ['bg-crystal-grove', 'bg', 600, ''],
  ['bg-ember-cavern', 'bg', 660, ''],
  ['bg-night-greenhouse', 'bg', 600, ''],
  ['bg-cozy-loft', 'bg', 540, ''],
  ['bg-cloud-terrace', 'bg', 720, ''],
]);

/**
 * O CATALOGO DE VENDEDORES (dono, 10/11/2026) — constante unica: id, arquivo da arte (so reuso, nada novo), tipo, peso, ativo.
 * Nenhum e a Vesca nem a Tessaria. `peso` soma 100 entre os ATIVOS (a Hexsmith e o passeio sao os mais raros). Os vendedores com
 * `ativo: false` (peso 0) ja tem NPC e lugar no catalogo mas ainda NAO vendem: faltam catalogos de Bits (materiais, comidas sem
 * ingrediente, pocoes de elemento com desconto, itens de Honra em Bits) ou refatoracao (o passeio); ver docs/PLANO-FEIRA-CHEFE.md.
 * `pool` escolhe de onde saem os itens do Mercado; `hex` = a prateleira e da Hexsmith (so Bits, sem ingredientes).
 */
export const FEIRA_LOJA_VENDEDORES = Object.freeze([
  { id: 'mercado', file: 'src/assets/avatares/ativo-mercado.webp', tipo: 'itens', peso: 30, ativo: true, hex: false, pool: i => i.tipo === 'chip' },
  { id: 'colheita', file: 'src/assets/soulmon/npcs/npc-n-colheita.png', tipo: 'backgrounds', peso: 28, ativo: true, hex: false, pool: i => i.tipo === 'bg' },
  { id: 'aranha', file: 'src/assets/avatares/extra-aranha-fiandeira-b.webp', tipo: 'decoracao', peso: 30, ativo: true, hex: false, pool: i => i.tipo === 'furniture' },
  { id: 'hexsmith', file: 'src/assets/soulmon/npcs/npc-forja-hexsmith.png', tipo: 'hexsmith', peso: 12, ativo: true, hex: true, pool: () => false },
  { id: 'morcego', file: 'src/assets/avatares/cavernas-morcego-sabio-eco.webp', tipo: 'materiais', peso: 0, ativo: false, hex: false, pool: () => false },
  { id: 'salamandra', file: 'src/assets/avatares/fogo-salamandra-cozinheira.webp', tipo: 'comidas', peso: 0, ativo: false, hex: false, pool: () => false },
  { id: 'vitra', file: 'src/assets/soulmon/npcs/npc-mercado-ferreiro.png', tipo: 'pocoes', peso: 0, ativo: false, hex: false, pool: () => false },
  { id: 'serpente', file: 'src/assets/soulmon/npcs/npc-n-serpentePlumadaForma.png', tipo: 'honra', peso: 0, ativo: false, hex: false, pool: () => false },
  { id: 'sacerdotisa', file: 'src/assets/soulmon/npcs/npc-f-sacerdotisa.png', tipo: 'passeio', peso: 0, ativo: false, hex: false, pool: () => false },
]);

const CATALOGO = FEIRA_LOJA_CATALOGO.map(([id, tipo, preco, fits]) => ({ id, tipo, preco, fits }));

/** Itens que so se tem UM (posse): cenario, decoracao e Hexsmith. Chip e consumivel. */
const unico = tipo => tipo !== 'chip';

/** O que a pessoa ja tem, lido do save GRAVADO (ausente/ilegivel = nada). */
export function possuidosDoSave(stored) {
  const lista = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
  const s = stored && typeof stored === 'object' ? stored : {};
  return new Set([...lista(s.ownedBackgrounds), ...lista(s.ownedFurniture), ...sanitizeHexsmith(s.hexsmith).owned]);
}

/** Desconto inteiro de 10 a 50 (media 30), sorteado por item pela semente. */
export const descontoDoItem = (semente, id) => DESCONTO_MIN + (hash32(`${semente}:desc:${id}`) % (DESCONTO_MAX - DESCONTO_MIN + 1));

/** Preco final: inteiro, nunca abaixo de 1 Bit. */
export const precoComDesconto = (preco, pct) => Math.max(1, Math.round(preco * (100 - pct) / 100));

/** A chance do dia, deterministica em (conta, dia). Reabrir o app nao re-sorteia. */
export function haFeiraDeVerdade(save, hoje) {
  return ISO_DIA.test(hoje) && hash32(`feiraLoja:${save}:${hoje}:roll`) % 100 < FEIRA_LOJA_PCT;
}

const ordenar = (lista, semente, rotulo) => [...lista].sort((a, b) => hash32(`${semente}:${rotulo}:${a.id}`) - hash32(`${semente}:${rotulo}:${b.id}`) || (a.id < b.id ? -1 : 1));

/** Candidatos da Hexsmith SEM ingrediente (so o custo em Bits): coroa, luvas e os tres slots de elemento. */
function candidatosHex() {
  const ids = [
    ...SPECIAL_FAMILIES.map(f => `coroa:${f}`),
    'luvas:ranged', 'luvas:melee',
    ...['amuleto', 'garra', 'couraca'].flatMap(s => COUNTER_RING.map(e => `${s}:${e}`)),
  ];
  return ids.filter(id => parseHexItem(id)).map(id => ({ id, tipo: 'hex', preco: hexCost(id)?.bits ?? 0 }));
}

/**
 * A oferta do dia (pura). `null` = sem feira. Itens trancados nunca entram (o catalogo ja os exclui), item unico que a pessoa
 * ja tem tambem nao, e a Hexsmith entra SEM ingrediente (preco = so os Bits do item, com o desconto).
 * @returns {null | { day: string, vendor: string, items: Array<{ id: string, type: string, kind: string, price: number, was: number, pct: number }> }}
 */
export function sortearFeiraLoja(save, hoje, possuidos = new Set()) {
  if (!haFeiraDeVerdade(save, hoje)) return null;
  const semente = `${save}:${hoje}`;
  let r = hash32(`feiraLoja:${semente}:vendedor`) % 100;
  const vendedor = FEIRA_LOJA_VENDEDORES.find(v => v.ativo && (r -= v.peso) < 0) ?? FEIRA_LOJA_VENDEDORES[0];
  const livres = i => !(unico(i.tipo) && possuidos.has(i.id));
  const quer = ITENS_MIN + (hash32(`feiraLoja:${semente}:n`) % (ITENS_MAX - ITENS_MIN + 1));
  const escolhidos = vendedor.hex
    ? ordenar(candidatosHex().filter(livres), semente, 'hex').slice(0, quer)
    : ordenar(CATALOGO.filter(vendedor.pool).filter(livres), semente, 'item').slice(0, quer);
  if (escolhidos.length === 0) return null;
  const items = escolhidos.map(i => {
    const pct = descontoDoItem(semente, i.id);
    return { id: i.id, type: i.tipo === 'hex' ? 'hex' : 'shop', kind: i.tipo, price: precoComDesconto(i.preco, pct), was: i.preco, pct };
  });
  return { day: hoje, vendor: vendedor.id, items };
}

const lerJson = async (env, chave) => {
  try { const v = await kvOrThrow(env).get(chave); return v ? JSON.parse(v) : null; } catch { return null; }
};

async function lerSave(env, save) {
  try { const v = await kvOrThrow(env).get(save); const s = v ? JSON.parse(v) : null; return s && typeof s === 'object' && !Array.isArray(s) ? s : null; } catch { return null; }
}

function oferta(raw) {
  if (!raw || typeof raw !== 'object' || !ISO_DIA.test(raw.day) || typeof raw.vendor !== 'string' || !Array.isArray(raw.items)) return null;
  return raw;
}

/** Sorteia e GRAVA a oferta (idempotente: se ja existe, devolve a gravada). Chamado pela volta da Missao. */
export async function abrirFeiraLoja(env, save, hoje) {
  if (!feiraLigada(env) || !haFeiraDeVerdade(save, hoje)) return null;
  const ja = oferta(await lerJson(env, feiraLojaKey(save, hoje)));
  if (ja) return ja;
  const o = sortearFeiraLoja(save, hoje, possuidosDoSave(await lerSave(env, save)));
  if (!o) return null;
  await kvOrThrow(env).put(feiraLojaKey(save, hoje), JSON.stringify(o), { expirationTtl: FEIRA_LOJA_TTL });
  return o;
}

export async function comprados(env, save, hoje) {
  const l = await lerJson(env, feiraLojaCompraKey(save, hoje));
  return Array.isArray(l) ? l.filter(x => typeof x === 'string') : [];
}

/** A oferta de HOJE (so a do proprio dia: a de ontem ja expirou) com o que ja foi comprado, no formato do cliente. */
export async function feiraLojaDoDia(env, save, hoje) {
  if (!feiraLigada(env) || !ISO_DIA.test(hoje)) return null;
  const o = oferta(await lerJson(env, feiraLojaKey(save, hoje)));
  if (!o || o.day !== hoje) return null;
  const feitos = await comprados(env, save, hoje);
  return { day: o.day, vendor: o.vendor, items: o.items.map(i => ({ ...i, bought: feitos.includes(i.id) })) };
}

/**
 * Pode comprar `itemId` agora? So item da oferta do dia, 1 unidade por oferta, e item unico que a pessoa ja ganhou por fora
 * nao se compra de novo. NAO grava (quem grava e `marcarCompraFeiraLoja`, depois de a compra passar em tudo).
 * @returns {Promise<{ ok: true, item: any, stored: any } | { ok: false, reason: 'no-offer' | 'no-item' | 'bought' | 'owned' }>}
 */
export async function validarCompraFeiraLoja(env, save, hoje, itemId) {
  const v = await feiraLojaDoDia(env, save, hoje);
  if (!v) return { ok: false, reason: 'no-offer' };
  const item = v.items.find(i => i.id === itemId);
  if (!item) return { ok: false, reason: 'no-item' };
  if (item.bought) return { ok: false, reason: 'bought' };
  const stored = await lerSave(env, save);
  if (unico(item.kind) && possuidosDoSave(stored).has(item.id)) return { ok: false, reason: 'owned' };
  return { ok: true, item, stored };
}

export async function marcarCompraFeiraLoja(env, save, hoje, itemId) {
  const feitos = await comprados(env, save, hoje);
  if (feitos.includes(itemId)) return;
  await kvOrThrow(env).put(feiraLojaCompraKey(save, hoje), JSON.stringify([...feitos, itemId].slice(-12)), { expirationTtl: FEIRA_LOJA_TTL });
}

const num = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/**
 * O item da Hexsmith da feira, entregue pelo servidor: SO Bits GANHOS (o Bit de Credito nao paga, como a forja), preco = o da
 * oferta (ja com o desconto), NENHUM ingrediente (sem pocao, sem fragmento). Espelho de `forgeOnServer`, com o custo trocado.
 * @returns {{ ok: true, already: boolean, state: Record<string, any> } | { ok: false, reason: 'invalid' | 'bits' }}
 */
export function feiraHexOnServer(stored, itemId, preco) {
  if (!parseHexItem(itemId) || !Number.isInteger(preco) || preco < 1) return { ok: false, reason: 'invalid' };
  const hx = sanitizeHexsmith(stored.hexsmith);
  if (hx.owned.includes(itemId)) return { ok: true, already: true, state: stored };
  if (hx.owned.length >= HEX_MAX_OWNED) return { ok: false, reason: 'invalid' };
  const gp = num(stored.gamePoints);
  const paidLeft = num(stored.bitsOrigin?.paidLeft);
  if (Math.max(0, gp - Math.min(gp, paidLeft)) < preco) return { ok: false, reason: 'bits' };
  const next = { ...stored, gamePoints: gp - preco };
  if (stored.bitsOrigin && typeof stored.bitsOrigin === 'object') {
    const left = Math.min(Math.max(0, paidLeft - preco), next.gamePoints);
    if (left !== paidLeft) next.bitsOrigin = { ...stored.bitsOrigin, paidLeft: left };
  }
  const slot = parseHexItem(itemId)?.slot ?? "coroa";
  const equipped = hx.equipped[slot] ? hx.equipped : { ...hx.equipped, [slot]: itemId };
  next.hexsmith = { owned: [...hx.owned, itemId], equipped };
  return { ok: true, already: false, state: next };
}

/** O `dayKey` do jogador cabe na janela de fuso (UTC-1 a UTC+1 dia)? Mesmo critério do `guild.js` (o dia do jogador, ±1 UTC). */
export function diaDoJogadorValido(dayKey, agora = new Date()) {
  if (typeof dayKey !== 'string' || !ISO_DIA.test(dayKey)) return false;
  const d = Date.parse(`${dayKey}T00:00:00Z`);
  if (!Number.isFinite(d)) return false;
  const hojeUtc = Date.parse(`${agora.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.abs(d - hojeUtc) <= 24 * 3600 * 1000;
}
