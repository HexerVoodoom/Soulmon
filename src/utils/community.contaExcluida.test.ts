/**
 * QA rodada 2 (01-seguranca §1.3): o backend passa a responder 410
 * `account-deleted` em TODA rota autorizada por saveId — inclusive
 * `/api/community`. O cliente da comunidade tem que tratar o 410 como o cloud
 * save trata: parar, limpar, deslogar (`reagirContaExcluida`), e LANÇAR para
 * o chamador não ler o corpo do 410 como resposta válida.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { reagiu } = vi.hoisted(() => ({ reagiu: [] as Array<{ excluidaEm?: number }> }));
vi.mock('./auth', () => ({ authHeaders: async () => ({ Authorization: 'Bearer t' }) }));
vi.mock('./cloudSave', () => ({
  reagirContaExcluida: (o: { excluidaEm?: number }) => { reagiu.push(o); return Promise.resolve(); },
}));

import { pushProfile, getRank } from './community';

beforeEach(() => { reagiu.length = 0; });
afterEach(() => { vi.unstubAllGlobals(); });

describe('410 em /api/community', () => {
  it('POST profile com 410 → lança `account-deleted` e dispara reagirContaExcluida com o deletedAt', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'account-deleted', deletedAt: 1_700_000_000_000 }, { status: 410 }));
    await expect(pushProfile({ id: 'x', name: 'n', stage: 'rookie', pvpEnabled: true })).rejects.toThrow('account-deleted');
    expect(reagiu).toEqual([{ excluidaEm: 1_700_000_000_000 }]);
  });

  it('GET com 410 sem deletedAt → idem, sem data', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'account-deleted' }, { status: 410 }));
    await expect(getRank('x')).rejects.toThrow('account-deleted');
    expect(reagiu).toEqual([{ excluidaEm: undefined }]);
  });

  it('outros erros NÃO disparam a reação (403 continua sendo só um erro)', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'forbidden' }, { status: 403 }));
    await expect(getRank('x')).rejects.toThrow('forbidden');
    expect(reagiu).toHaveLength(0);
  });
});
