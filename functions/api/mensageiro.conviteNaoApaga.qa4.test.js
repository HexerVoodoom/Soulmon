import { describe, it, expect } from 'vitest';
import { deleteMail } from './_mensageiro.js';

// QA r4 C2 · D (REGISTRO §389): "Excluir todas lidas" (scope read) NÃO apaga convite de amizade/clã ainda não respondido.
// Abrir a carta já a marca como lida; o convite respondido (aceito, recusado, entrou no clã) já sai da caixa por outro caminho.

const ID = 'm'.repeat(32);
const kv = (q) => {
  const store = new Map([[`mail:${ID}`, JSON.stringify({ q, done: [], season: '' })]]);
  return { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, String(v)); }, delete: async k => { store.delete(k); } };
};
const carta = (mid, extra = {}) => ({ mid, titlePt: 't', titleEn: 't', bodyPt: 'b', bodyEn: 'b', bits: 0, emblems: 0, at: 1, read: true, claimedAt: 0, ...extra });
const fila = (k) => JSON.parse(k.store.get(`mail:${ID}`)).q.map(m => m.mid);

describe('deleteMail(scope read) e os convites', () => {
  it('convite de amizade, de clã e de clã no formato antigo ficam; a carta comum lida sai', async () => {
    const k = kv([
      carta('invite:pidx00000000000000000001:a', { kind: 'friend-invite', fromPid: 'pidx00000000000000000001' }),
      carta('ginv:gidx:2026-11-13', { kind: 'guild-invite', guildCode: 'ABCD2345' }),
      carta('ginv:gidy:2026-11-01'),
      carta('news:1'),
    ]);
    expect(await deleteMail(k, ID, 'read')).toEqual({ removed: 1, blocked: [] });
    expect(fila(k)).toEqual(['invite:pidx00000000000000000001:a', 'ginv:gidx:2026-11-13', 'ginv:gidy:2026-11-01']);
  });

  it('apagar o convite PELO ID continua possível (é o "Recusar" do clã)', async () => {
    const k = kv([carta('ginv:gidx:2026-11-13', { kind: 'guild-invite', guildCode: 'ABCD2345' })]);
    expect((await deleteMail(k, ID, ['ginv:gidx:2026-11-13'])).removed).toBe(1);
    expect(fila(k)).toEqual([]);
  });
});
