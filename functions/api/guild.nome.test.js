import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { onRequest as community } from './community.js';
import { sanitizarNomeDeGuilda } from './_coop.js';

/**
 * Nome da guilda e apelido do perfil (D-1, `05-servidor.md` §5.1, WPG-2):
 * texto do jogador lido por OUTRAS pessoas. Contato (e-mail, telefone, URL,
 * `@`) é RECUSADO, nunca mascarado; a mesma função serve aos dois campos.
 */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    put: async (k, v, opts) => { puts.push({ k, v, opts }); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
/** Um id de save válido (32 chars) a partir de um rótulo curto. */
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'pet', stage: 'mega-power', attrs: { power: 9, harmony: 9, benevolence: 9 }, friends: [], createdAt: Date.now(), ...extra });
function req(action, { method = 'GET', body, params = {}, ip } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(ip ? { 'CF-Connecting-IP': ip } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const ANA = sid('ana');
const BIA = sid('bia');
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });
const novoEnv = () => ({ DIGIAPP_SAVES: fakeKV({ [`profile:${ANA}`]: perfil(ANA, 'Ana'), [`profile:${BIA}`]: perfil(BIA, 'Bia') }) });

const CONTATOS = [
  'fale comigo ana@gmail.com',
  'zap 11 98765-4321',
  '+55 (11) 98765-4321',
  'https://exemplo.com/roda',
  'www.roda.com',
  'segue @anaclara',
  'ana@roda',
  // B3 (L2-backend): contato sem esquema nem `www`.
  't.me/fulano',
  'x.com/fulano',
  'insta: fulano_xyz',
  'ig:fulano',
  'discord fulano#1234',
  'joao arroba gmail ponto com',
  'roda.gg',
];

describe('sanitizarNomeDeGuilda', () => {
  it('recusa (null) todo nome com contato', () => {
    for (const c of CONTATOS) expect(sanitizarNomeDeGuilda(c), c).toBeNull();
  });
  it('normaliza espaço, controle e NFKC; corta em 24', () => {
    expect(sanitizarNomeDeGuilda('  Roda\u0000 do\n\n Bosque  ')).toBe('Roda do Bosque');
    expect(sanitizarNomeDeGuilda('Ｒｏｄａ')).toBe('Roda');
    expect(sanitizarNomeDeGuilda('x'.repeat(40))).toHaveLength(24);
    expect(sanitizarNomeDeGuilda('   ')).toBeNull();
    // Nomes legítimos seguem passando.
    for (const ok of ['Roda do Bosque', 'Os Madrugadores', 'Clube 2026', 'Ponto de Encontro', 'Café & Chá']) expect(sanitizarNomeDeGuilda(ok)).toBe(ok);
    // Corte por ponto de código: nenhum substituto solto no fim.
    const cortado = sanitizarNomeDeGuilda('a'.repeat(23) + '🌳🌳');
    expect(cortado).toBe('a'.repeat(23) + '🌳');
    expect(sanitizarNomeDeGuilda(undefined)).toBeNull();
  });
  it('um contato LONGO não escapa por ser cortado antes da checagem', () => {
    expect(sanitizarNomeDeGuilda(`${'a'.repeat(20)} fulano@exemplo.com`)).toBeNull();
  });
});

describe('guildCreate / guildRename / coopCreate usam o sanitizador', () => {
  it('criar com contato → 400 invalid name, nada gravado', async () => {
    for (const c of CONTATOS) {
      const e = novoEnv();
      const r = await chamar(e, 'guildCreate', { method: 'POST', body: { id: ANA, name: c } });
      expect(r.status, c).toBe(400);
      expect((await r.json()).error).toBe('invalid name');
      expect([...e.DIGIAPP_SAVES.store.keys()].some(k => k.startsWith('coop'))).toBe(false);
    }
  });
  it('o alias coopCreate recusa igual', async () => {
    const e = novoEnv();
    const r = await community({ request: new Request('https://x.dev/api/community?action=coopCreate', { method: 'POST', body: JSON.stringify({ id: ANA, name: 'ana@gmail.com' }) }), env: e });
    expect(r.status).toBe(400);
  });
  it('renomear com contato → 400 e o nome antigo fica', async () => {
    const e = novoEnv();
    await chamar(e, 'guildCreate', { method: 'POST', body: { id: ANA, name: 'Roda' } });
    const r = await chamar(e, 'guildRename', { method: 'POST', body: { id: ANA, name: 'www.spam.com' } });
    expect(r.status).toBe(400);
    const g = (await (await chamar(e, 'guild', { params: { id: ANA } })).json()).guild;
    expect(g.name).toBe('Roda');
    const ok = await (await chamar(e, 'guildRename', { method: 'POST', body: { id: ANA, name: '  Nova   Roda ' } })).json();
    expect(ok.guild.name).toBe('Nova Roda');
  });
});

describe('apelido do perfil — a mesma régua', () => {
  const salvar = (e, name) => community({ request: new Request('https://x.dev/api/community?action=profile', { method: 'POST', body: JSON.stringify({ id: ANA, name }) }), env: e });
  it('apelido com contato é descartado (fica o anterior) e a resposta avisa; o resto do perfil grava', async () => {
    const e = novoEnv();
    const r = await (await salvar(e, 'me chama ana@gmail.com')).json();
    expect(r.ok).toBe(true);
    expect(r.nameRejected).toBe(true);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(`profile:${ANA}`)).name).toBe('Ana');
  });
  it('apelido limpo passa normalizado', async () => {
    const e = novoEnv();
    const r = await (await salvar(e, '  Ana   Clara ')).json();
    expect(r.nameRejected).toBeUndefined();
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(`profile:${ANA}`)).name).toBe('Ana Clara');
  });
});
