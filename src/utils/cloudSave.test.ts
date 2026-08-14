import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { emailToSaveId, cloudSave, cloudLoad } from './cloudSave';

// `cloudSave.ts` é o caminho por onde TODO progresso sai do aparelho, e não
// tinha teste (28% de cobertura, só o `emailToSaveId` de tabela no desktop).

const memoria = new Map<string, string>();

beforeEach(() => {
  memoria.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('derivação do saveId', () => {
  it('mesmo e-mail, mesmo id, independente de caixa e espaços', async () => {
    expect(await emailToSaveId(' Mateus@Exemplo.COM ')).toBe(await emailToSaveId('mateus@exemplo.com'));
  });

  it('casa com o VALID_ID do servidor (^[a-zA-Z0-9_-]{8,64}$)', async () => {
    expect(await emailToSaveId('a@b.com')).toMatch(/^[a-f0-9]{32}$/);
  });

  it('e-mails diferentes não colidem', async () => {
    expect(await emailToSaveId('a@b.com')).not.toBe(await emailToSaveId('c@d.com'));
  });
});

describe('cloudLoad trata rede instável sem derrubar o app', () => {
  it('resposta não-ok vira null (o app segue com o save local)', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 503 }));
    expect(await cloudLoad('a'.repeat(32))).toBeNull();
  });

  it('fetch que lança (offline) vira null', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    expect(await cloudLoad('a'.repeat(32))).toBeNull();
  });

  it('found:false vira null', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ found: false }));
    expect(await cloudLoad('a'.repeat(32))).toBeNull();
  });
});

describe('[BUG] cloudSave declara sucesso mesmo quando o servidor recusa', () => {
  // `cloudSave` só protege contra exceção do `fetch`. Uma resposta 401/403/500
  // é um Response normal — o `await` resolve, nada lança, e a linha seguinte
  // grava `digiapp-last-cloud-sync = agora`. O app então mostra "sincronizado
  // agora" para um save que o servidor JOGOU FORA.
  //
  // Cenários concretos, ambos previstos no docs/STATUS.md §3:
  //   1. dono liga o FIREBASE_PROJECT_ID → token expirado devolve 401 →
  //      o jogador joga o dia inteiro vendo "sincronizado" e troca de aparelho
  //      achando que o progresso foi junto;
  //   2. binding KV fora do ar → 500 → idem.
  //
  // Correção: checar `res.ok` antes de gravar o carimbo, e devolver um booleano
  // para quem chama poder reagendar/avisar.
  it('403 do servidor não pode virar carimbo de sincronização', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'forbidden' }, { status: 403 }));
    await cloudSave('a'.repeat(32), { healthPoints: 3 });
    expect(memoria.get('digiapp-last-cloud-sync')).toBeUndefined();
  });

  it('500 do servidor não pode virar carimbo de sincronização', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'kv down' }, { status: 500 }));
    await cloudSave('a'.repeat(32), { healthPoints: 3 });
    expect(memoria.get('digiapp-last-cloud-sync')).toBeUndefined();
  });

  it('200 legítimo continua carimbando (não regredir para o outro extremo)', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ ok: true }));
    await cloudSave('a'.repeat(32), { healthPoints: 3 });
    expect(memoria.get('digiapp-last-cloud-sync')).toBeTruthy();
  });

  it('offline (fetch lança) não carimba — este já está correto hoje', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    await cloudSave('a'.repeat(32), { healthPoints: 3 });
    expect(memoria.get('digiapp-last-cloud-sync')).toBeUndefined();
  });
});
