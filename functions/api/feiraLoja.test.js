import { describe, it, expect, vi } from 'vitest';
import {
  FEIRA_LOJA_PCT, FEIRA_LOJA_VENDEDORES, FEIRA_LOJA_CATALOGO, FEIRA_LOJA_HONRA, PRECO_MATERIAL, PRECO_POCAO, HONRA_EM_BITS, FEIRA_LOJA_PRATOS, DESCONTO_MIN, DESCONTO_MAX, ITENS_MIN, ITENS_MAX,
  haFeiraDeVerdade, sortearFeiraLoja, precoComDesconto, abrirFeiraLoja, feiraLojaDoDia, validarCompraFeiraLoja,
  marcarCompraFeiraLoja, feiraHexOnServer, possuidosDoSave, diaDoJogadorValido, feiraLojaKey,
} from './_feiraLoja.js';
import { onRequest } from './guild.js';

vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false, tombstone: { deleted: false, reopened: false } }),
}));

function fakeKV() {
  const store = new Map();
  const meta = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const LIGADA = '2000-01-01';
const env = () => ({ SOULMON_SAVES: fakeKV(), FEIRA_CHEFE_DESDE: LIGADA });
const hojeUtc = () => new Date().toISOString().slice(0, 10);
const diasDe = n => Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10));
/** Uma conta que ganha a feira no dia `dia`. */
const contaQueGanha = (dia) => { for (let i = 0; i < 5000; i++) { const s = `acct${i}`.padEnd(16, 'x'); if (haFeiraDeVerdade(s, dia) && sortearFeiraLoja(s, dia)?.vendor !== 'hexsmith') return s; } throw new Error('nenhuma'); };
// Conta que ganha feira no dia E cuja oferta tem item que satisfaz `pred` (a oferta varia por dia: nao depender da sorte do dia).
const contaCom = (dia, pred) => { for (let i = 0; i < 20000; i++) { const s = `acct${i}`.padEnd(16, 'x'); const o = haFeiraDeVerdade(s, dia) ? sortearFeiraLoja(s, dia) : null; if (o && o.vendor !== 'hexsmith' && o.items.some(pred)) return s; } throw new Error('nenhuma com o item'); };

describe('a feira de verdade: o sorteio', () => {
  it('é determinístico por (conta, dia): a mesma entrada dá a mesma oferta, sempre', () => {
    for (const dia of diasDe(40)) for (const c of ['a1', 'b2', 'c3']) {
      expect(sortearFeiraLoja(c, dia)).toEqual(sortearFeiraLoja(c, dia));
      expect(haFeiraDeVerdade(c, dia)).toBe(haFeiraDeVerdade(c, dia));
    }
  });
  it('a chance é constante e ~8% das voltas', () => {
    let n = 0; let total = 0;
    for (let c = 0; c < 400; c++) for (const dia of diasDe(25)) { total++; if (haFeiraDeVerdade(`conta-${c}`, dia)) n++; }
    expect(FEIRA_LOJA_PCT).toBe(8);
    expect(n / total).toBeGreaterThan(0.06);
    expect(n / total).toBeLessThan(0.10);
  });
  it('dia inválido nunca sorteia', () => {
    expect(haFeiraDeVerdade('conta', 'ontem')).toBe(false);
    expect(sortearFeiraLoja('conta', '')).toBeNull();
  });
  it('os pesos dos vendedores somam 100 e nenhum é a Vesca nem a Tessaria', () => {
    expect(FEIRA_LOJA_VENDEDORES.filter(v => v.ativo).reduce((n, v) => n + v.peso, 0)).toBe(100);
    expect(FEIRA_LOJA_VENDEDORES.filter(v => !v.ativo).every(v => v.peso === 0)).toBe(true);
    expect(FEIRA_LOJA_VENDEDORES).toHaveLength(9);
    expect(FEIRA_LOJA_VENDEDORES.filter(v => !v.ativo).map(v => v.id)).toEqual(['sacerdotisa']);
    const hx = FEIRA_LOJA_VENDEDORES.find(v => v.id === 'hexsmith');
    expect(hx.peso).toBeLessThan(Math.min(...FEIRA_LOJA_VENDEDORES.filter(v => v.ativo && !v.hex).map(v => v.peso)));
    for (const v of FEIRA_LOJA_VENDEDORES) expect(['vesca', 'tessaria', 'alquimista', 'gladiadora']).not.toContain(v.id);
  });
});

describe('a feira de verdade: a oferta', () => {
  const ofertas = [];
  for (let c = 0; c < 600 && ofertas.length < 120; c++) for (const dia of diasDe(30)) {
    const o = sortearFeiraLoja(`conta-${c}`, dia);
    if (o) ofertas.push(o);
  }
  it('tem de 4 a 6 itens, todos distintos', () => {
    expect(ofertas.length).toBeGreaterThan(50);
    for (const o of ofertas) {
      expect(o.items.length).toBeGreaterThanOrEqual(ITENS_MIN);
      expect(o.items.length).toBeLessThanOrEqual(ITENS_MAX);
      expect(new Set(o.items.map(i => i.id)).size).toBe(o.items.length);
    }
  });
  it('desconto de 10% a 50%, preço final inteiro, nunca abaixo de 1 Bit, média perto de 30%', () => {
    let soma = 0; let n = 0;
    for (const o of ofertas) for (const i of o.items) {
      expect(i.pct).toBeGreaterThanOrEqual(DESCONTO_MIN);
      expect(i.pct).toBeLessThanOrEqual(DESCONTO_MAX);
      expect(Number.isInteger(i.price)).toBe(true);
      expect(i.price).toBeGreaterThanOrEqual(1);
      expect(i.price).toBeLessThan(i.was);
      expect(i.price).toBe(precoComDesconto(i.was, i.pct));
      soma += i.pct; n++;
    }
    expect(soma / n).toBeGreaterThan(27);
    expect(soma / n).toBeLessThan(33);
  });
  it('preço mínimo: 1 Bit mesmo com o desconto máximo sobre um item baratíssimo', () => {
    expect(precoComDesconto(1, 50)).toBe(1);
    expect(precoComDesconto(2, 50)).toBe(1);
    expect(precoComDesconto(3, 50)).toBe(2);
  });
  it('a Hexsmith aparece RARAMENTE e SEM ingredientes: só Bits, e só o vendedor raro a traz', () => {
    const comHex = ofertas.filter(o => o.items.some(i => i.type === 'hex'));
    expect(comHex.length).toBeGreaterThan(0);
    expect(comHex.length / ofertas.length).toBeLessThan(0.25);
    expect(ofertas.every(o => o.vendor !== 'sacerdotisa')).toBe(true);
    for (const o of comHex) {
      expect(o.vendor).toBe('hexsmith');
      for (const i of o.items.filter(x => x.type === 'hex')) {
        // o preço é só o dos Bits do item (500/1500/2000); nada de poção/fragmento no objeto
        expect([500, 1500, 2000]).toContain(i.was);
        expect(Object.keys(i).sort()).toEqual(['id', 'kind', 'pct', 'price', 'type', 'was']);
      }
    }
    for (const o of ofertas.filter(x => x.vendor !== 'hexsmith')) expect(o.items.some(i => i.type === 'hex')).toBe(false);
  });
  it('só Bits e só itens destrancados do catálogo da loja: nada de Créditos, Emblemas ou item de missão', () => {
    const ids = new Set([...FEIRA_LOJA_CATALOGO.map(([id]) => id), ...FEIRA_LOJA_HONRA.map(([id]) => id)]);
    for (const o of ofertas) for (const i of o.items.filter(x => x.type === 'shop')) {
      expect(ids.has(i.id)).toBe(true);
      expect(['chip', 'furniture', 'bg']).toContain(i.kind);
    }
  });
  it('item único que a pessoa já tem não entra; chip (consumível) pode repetir', () => {
    const conta = contaQueGanha('2026-11-10');
    const base = sortearFeiraLoja(conta, '2026-11-10');
    const unicos = base.items.filter(i => i.kind !== 'chip').map(i => i.id);
    const sem = sortearFeiraLoja(conta, '2026-11-10', new Set(unicos));
    if (sem) for (const id of unicos) expect(sem.items.map(i => i.id)).not.toContain(id);
    const chips = base.items.filter(i => i.kind === 'chip').map(i => i.id);
    if (chips.length) expect(sortearFeiraLoja(conta, '2026-11-10', new Set(chips)).items.map(i => i.id)).toEqual(expect.arrayContaining(chips));
  });
  it('possuidosDoSave lê cenário, decoração e Hexsmith; save ilegível = nada', () => {
    const s = possuidosDoSave({ ownedBackgrounds: ['bg-a'], ownedFurniture: ['furn-b'], hexsmith: { owned: ['luvas:magic'], equipped: {} } });
    expect(s.has('bg-a') && s.has('furn-b') && s.has('luvas:magic')).toBe(true);
    expect(possuidosDoSave(null).size).toBe(0);
  });
});

describe('a feira de verdade: gravação, limite de 1/item, expiração', () => {
  it('abrir é idempotente e grava a oferta: comprar um item (que vira "seu") não muda a lista', async () => {
    const e = env();
    const dia = '2026-11-10'; // FIXO: a oferta depende do dia e um dia real (23/11/2026) saiu só com chips
    const conta = contaCom(dia, i => i.kind !== 'chip');
    const a = await abrirFeiraLoja(e, conta, dia);
    const b = await abrirFeiraLoja(e, conta, dia);
    expect(b).toEqual(a);
    expect(e.SOULMON_SAVES.store.has(feiraLojaKey(conta, dia))).toBe(true);
    const unico = a.items.find(i => i.kind !== 'chip');
    e.SOULMON_SAVES.store.set(conta, JSON.stringify({ ownedBackgrounds: [unico.id], ownedFurniture: [unico.id] }));
    expect((await feiraLojaDoDia(e, conta, dia)).items.map(i => i.id)).toEqual(a.items.map(i => i.id));
  });
  it('sem feira no dia = null e nada gravado; com a Feira desligada, também', async () => {
    const e = env();
    const dia = hojeUtc();
    let sem = 'zz1'.padEnd(16, 'x');
    for (let i = 0; haFeiraDeVerdade(sem, dia); i++) sem = `sem${i}`.padEnd(16, 'x');
    expect(await abrirFeiraLoja(e, sem, dia)).toBeNull();
    expect(e.SOULMON_SAVES.store.size).toBe(0);
    const desligada = { SOULMON_SAVES: fakeKV(), FEIRA_CHEFE_DESDE: '2099-12-31' };
    expect(await abrirFeiraLoja(desligada, contaQueGanha(dia), dia)).toBeNull();
  });
  it('1 unidade por item por oferta: a segunda compra é recusada', async () => {
    const e = env();
    const dia = hojeUtc();
    const conta = contaQueGanha(dia);
    const o = await abrirFeiraLoja(e, conta, dia);
    const id = o.items[0].id;
    const v1 = await validarCompraFeiraLoja(e, conta, dia, id);
    expect(v1.ok).toBe(true);
    await marcarCompraFeiraLoja(e, conta, dia, id);
    expect(await validarCompraFeiraLoja(e, conta, dia, id)).toEqual({ ok: false, reason: 'bought' });
    expect((await feiraLojaDoDia(e, conta, dia)).items.find(i => i.id === id).bought).toBe(true);
    expect(await validarCompraFeiraLoja(e, conta, dia, 'item-que-nao-esta-na-oferta')).toEqual({ ok: false, reason: 'no-item' });
  });
  it('a oferta expira com o dia: no dia seguinte não há loja nem compra', async () => {
    const e = env();
    const dia = hojeUtc();
    const conta = contaQueGanha(dia);
    const o = await abrirFeiraLoja(e, conta, dia);
    const amanha = new Date(Date.parse(`${dia}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
    expect(await feiraLojaDoDia(e, conta, amanha)).toBeNull();
    expect(await validarCompraFeiraLoja(e, conta, amanha, o.items[0].id)).toEqual({ ok: false, reason: 'no-offer' });
  });
  it('item único que a pessoa ganhou por fora depois do sorteio não se compra', async () => {
    const e = env();
    const dia = hojeUtc();
    const conta = contaCom(dia, i => i.kind === 'bg' || i.kind === 'furniture');
    const o = await abrirFeiraLoja(e, conta, dia);
    const unico = o.items.find(i => i.kind === 'bg' || i.kind === 'furniture');
    e.SOULMON_SAVES.store.set(conta, JSON.stringify({ ownedBackgrounds: [unico.id], ownedFurniture: [unico.id], hexsmith: { owned: [unico.id], equipped: {} } }));
    expect(await validarCompraFeiraLoja(e, conta, dia, unico.id)).toEqual({ ok: false, reason: 'owned' });
  });
  it('diaDoJogadorValido: só a janela de ±1 dia UTC', () => {
    const agora = new Date('2026-11-10T12:00:00Z');
    expect(diaDoJogadorValido('2026-11-10', agora)).toBe(true);
    expect(diaDoJogadorValido('2026-11-09', agora)).toBe(true);
    expect(diaDoJogadorValido('2026-11-11', agora)).toBe(true);
    expect(diaDoJogadorValido('2026-11-08', agora)).toBe(false);
    expect(diaDoJogadorValido('x', agora)).toBe(false);
  });
});

describe('as prateleiras novas: materiais, pratos, poções e Honra em Bits', () => {
  const porVendedor = {};
  for (let c = 0; c < 2000; c++) for (const dia of diasDe(30)) {
    const o = sortearFeiraLoja(`conta-${c}`, dia);
    if (o) (porVendedor[o.vendor] ??= []).push(o);
  }
  it('todos os vendedores ativos aparecem e cada um vende SÓ o seu tipo', () => {
    for (const v of FEIRA_LOJA_VENDEDORES.filter(x => x.ativo)) expect(porVendedor[v.id]?.length, v.id).toBeGreaterThan(0);
    expect(porVendedor.sacerdotisa).toBeUndefined();
    const tipo = { morcego: 'material', salamandra: 'dish', vitra: 'potion' };
    for (const [v, t] of Object.entries(tipo)) for (const o of porVendedor[v]) for (const i of o.items) { expect(i.type).toBe(t); expect(i.id.startsWith(`${t}:`)).toBe(true); }
  });
  it('preço-base por categoria: material 15, poção 60, prato = Bits do Restaurante, Honra x10; sempre com desconto de 10 a 50%', () => {
    for (const o of porVendedor.morcego) for (const i of o.items) expect(i.was).toBe(PRECO_MATERIAL);
    for (const o of porVendedor.vitra) for (const i of o.items) expect(i.was).toBe(PRECO_POCAO);
    const pratos = Object.fromEntries(FEIRA_LOJA_PRATOS.map(([id, b]) => [`dish:${id}`, b]));
    for (const o of porVendedor.salamandra) for (const i of o.items) expect(i.was).toBe(pratos[i.id]);
    const honra = Object.fromEntries(FEIRA_LOJA_HONRA.map(([id, , h]) => [id, h * HONRA_EM_BITS]));
    expect(HONRA_EM_BITS).toBe(10);
    for (const o of porVendedor.serpente) for (const i of o.items) { expect(i.type).toBe('shop'); expect(i.was).toBe(honra[i.id]); }
    for (const o of Object.values(porVendedor).flat()) for (const i of o.items) { expect(i.pct).toBeGreaterThanOrEqual(10); expect(i.pct).toBeLessThanOrEqual(50); expect(i.price).toBeGreaterThanOrEqual(1); }
  });
  it('consumível (material, poção, prato) pode repetir; equipamento de Honra já possuído não entra', () => {
    const o = porVendedor.serpente[0];
    const donos = new Set(o.items.map(i => i.id));
    const dia = o.day;
    const conta = [...Array(2000).keys()].map(c => `conta-${c}`).find(c => sortearFeiraLoja(c, dia)?.vendor === 'serpente' && sortearFeiraLoja(c, dia).items.length > 0);
    const base = sortearFeiraLoja(conta, dia);
    const sem = sortearFeiraLoja(conta, dia, new Set(base.items.map(i => i.id)));
    expect(sem === null || sem.items.every(i => !base.items.some(b => b.id === i.id))).toBe(true);
    expect(donos.size).toBeGreaterThan(0);
  });
});

describe('a Hexsmith da feira (feiraHexOnServer): só Bits, sem ingredientes', () => {
  const salvo = (extra = {}) => ({ gamePoints: 3000, hexsmith: { owned: [], equipped: {} }, ...extra });
  it('debita SÓ o preço da oferta: sem poção nem fragmento no save, ainda assim entrega', () => {
    const r = feiraHexOnServer(salvo(), 'coroa:heal', 700);
    expect(r.ok).toBe(true);
    expect(r.state.gamePoints).toBe(2300);
    expect(r.state.hexsmith.owned).toEqual(['coroa:heal']);
    expect(r.state.hexsmith.equipped.coroa).toBe('coroa:heal');
    expect(r.state.foodInventory).toBeUndefined();
    expect(r.state.equipment).toBeUndefined();
  });
  it('§373: o Bit de Crédito paga (gasto primeiro); sem saldo recusa e não cobra nada', () => {
    const r = feiraHexOnServer(salvo({ gamePoints: 800, bitsOrigin: { day: 'd', free: 0, fromCredits: 800, paidLeft: 800 } }), 'coroa:heal', 700);
    expect(r.ok && r.state.gamePoints).toBe(100);
    expect(r.ok && r.state.bitsOrigin.paidLeft).toBe(100);
    expect(feiraHexOnServer(salvo({ gamePoints: 100 }), 'coroa:heal', 700)).toEqual({ ok: false, reason: 'bits' });
  });
  it('item já possuído = already, sem cobrança; item/preço inválidos = invalid', () => {
    const r = feiraHexOnServer(salvo({ hexsmith: { owned: ['coroa:heal'], equipped: {} } }), 'coroa:heal', 700);
    expect(r.ok && r.already).toBe(true);
    expect(feiraHexOnServer(salvo(), 'lixo', 700)).toEqual({ ok: false, reason: 'invalid' });
    expect(feiraHexOnServer(salvo(), 'coroa:heal', 0)).toEqual({ ok: false, reason: 'invalid' });
    expect(feiraHexOnServer(salvo(), 'coroa:heal', 7.5)).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('as rotas guildFeiraLoja e guildFeiraLojaBuy', () => {
  const chamar = (e, action, body, method = 'POST') => onRequest({
    request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}&dayKey=${body.dayKey}` : ''}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
    }),
    env: e,
  });
  it('lê a loja de hoje; comprar item do Mercado devolve o PREÇO DA OFERTA e a 2a compra dá 409', async () => {
    const e = env();
    const dia = hojeUtc();
    const conta = contaCom(dia, i => i.type === 'shop');
    const o = await abrirFeiraLoja(e, conta, dia);
    const r = await chamar(e, 'guildFeiraLoja', { id: conta, dayKey: dia }, 'GET');
    expect(r.status).toBe(200);
    expect((await r.json()).loja.items.map(i => i.id)).toEqual(o.items.map(i => i.id));
    const shop = o.items.find(i => i.type === 'shop');
    const b1 = await chamar(e, 'guildFeiraLojaBuy', { id: conta, dayKey: dia, itemId: shop.id });
    expect(b1.status).toBe(200);
    expect((await b1.json()).price).toBe(shop.price);
    const b2 = await chamar(e, 'guildFeiraLojaBuy', { id: conta, dayKey: dia, itemId: shop.id });
    expect(b2.status).toBe(409);
  });
  it('item que não está na oferta = 409; sem oferta = 404; Feira desligada = 404 `not available`', async () => {
    const e = env();
    const dia = hojeUtc();
    const conta = contaQueGanha(dia);
    expect((await chamar(e, 'guildFeiraLojaBuy', { id: conta, dayKey: dia, itemId: 'furn-sofa' })).status).toBe(404);
    await abrirFeiraLoja(e, conta, dia);
    expect((await chamar(e, 'guildFeiraLojaBuy', { id: conta, dayKey: dia, itemId: 'nao-existe' })).status).toBe(409);
    const off = { SOULMON_SAVES: fakeKV(), FEIRA_CHEFE_DESDE: '2099-12-31' };
    expect((await chamar(off, 'guildFeiraLoja', { id: conta, dayKey: dia }, 'GET')).status).toBe(404);
  });
});
