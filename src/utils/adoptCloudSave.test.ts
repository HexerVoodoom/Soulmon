import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { adoptCloudSave } from './cloudSave';
import { STORAGE_KEYS } from './storageKeys';
import { resetStorageNotice } from './safeStorage';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// REGRESSÃO — adotar save da nuvem não pode trocar a IDENTIDADE sem o DADO.
//
// Defeito real (rodada 4): os quatro call sites gravavam `SAVE_ID` antes de
// `GAME_STATE`, com `setItem` cru. Com o storage cheio (origem compartilhada
// com o DigiApp) o segundo `setItem` lançava dentro de uma função async passada
// como prop — rejeição não tratada, sem reload e sem mensagem. O aparelho
// ficava apontando para o `saveId` do OUTRO aparelho segurando o estado LOCAL
// antigo, e o cloud save seguinte sobrescrevia o save de lá.
// ---------------------------------------------------------------------------

type Store = Map<string, string>;

function installStorage(store: Store, opts: { failOn?: (k: string, v: string) => boolean } = {}) {
  const fake = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (opts.failOn?.(k, v)) {
        const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e;
      }
      store.set(k, v);
    },
    removeItem: (k: string) => { store.delete(k); },
  };
  vi.stubGlobal('localStorage', fake);
}

const ANTIGO = JSON.stringify({ evolutionStage: 'mega', gamePoints: 999 });

let store: Store;
beforeEach(() => {
  resetStorageNotice();
  store = new Map([
    [STORAGE_KEYS.GAME_STATE, ANTIGO],
    [STORAGE_KEYS.SAVE_ID, 'id-local-antigo'],
  ]);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('adoptCloudSave — caminho feliz', () => {
  it('grava o save da nuvem e só então a identidade', () => {
    installStorage(store);
    expect(adoptCloudSave('id-da-nuvem', { evolutionStage: 'rookie' }, ' Fulano@Ex.COM ')).toBe('ok');
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!).evolutionStage).toBe('rookie');
    expect(store.get(STORAGE_KEYS.SAVE_ID)).toBe('id-da-nuvem');
    expect(store.get(STORAGE_KEYS.USER_EMAIL)).toBe('fulano@ex.com');
  });

  it('sem e-mail não inventa um', () => {
    installStorage(store);
    expect(adoptCloudSave('id2', { a: 1 })).toBe('ok');
    expect(store.has(STORAGE_KEYS.USER_EMAIL)).toBe(false);
  });
});

describe('adoptCloudSave — storage cheio (o defeito)', () => {
  // AUTOVERIFICAÇÃO: o instrumento precisa de fato estourar na escrita do save
  // grande. Sem este caso o teste passaria com um storage que nunca falha.
  it('o storage falso realmente lança QuotaExceededError no GAME_STATE', () => {
    installStorage(store, { failOn: k => k === STORAGE_KEYS.GAME_STATE });
    expect(() => localStorage.setItem(STORAGE_KEYS.GAME_STATE, 'x')).toThrow(/quota/i);
    expect(() => localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'x')).not.toThrow();
  });

  it('não lança, devolve "storage" e NÃO troca a identidade', () => {
    installStorage(store, { failOn: k => k === STORAGE_KEYS.GAME_STATE });
    let r: string | undefined;
    expect(() => { r = adoptCloudSave('id-da-nuvem', { evolutionStage: 'rookie' }, 'a@b.com'); }).not.toThrow();
    expect(r).toBe('storage');
    // O que trava a regressão: o save e o id continuam sendo os locais.
    expect(store.get(STORAGE_KEYS.SAVE_ID)).toBe('id-local-antigo');
    expect(store.get(STORAGE_KEYS.GAME_STATE)).toBe(ANTIGO);
    expect(store.has(STORAGE_KEYS.USER_EMAIL)).toBe(false);
  });

  it('storage bloqueado (SecurityError em tudo) também não troca nada', () => {
    installStorage(store, { failOn: () => true });
    expect(adoptCloudSave('id-da-nuvem', { a: 1 }, 'a@b.com')).toBe('storage');
    expect(store.get(STORAGE_KEYS.SAVE_ID)).toBe('id-local-antigo');
  });
});

describe('adoptCloudSave — payload hostil da nuvem', () => {
  for (const [nome, payload] of [
    ['array', [1, 2, 3]],
    ['string', 'oi'],
    ['número', 42],
    ['null', null],
  ] as const) {
    it(`${nome} não substitui o save local`, () => {
      installStorage(store);
      expect(adoptCloudSave('id-da-nuvem', payload)).toBe('invalid');
      expect(store.get(STORAGE_KEYS.GAME_STATE)).toBe(ANTIGO);
      expect(store.get(STORAGE_KEYS.SAVE_ID)).toBe('id-local-antigo');
    });
  }

  it('objeto com ciclo (JSON.stringify lança) não derruba nem apaga', () => {
    installStorage(store);
    const ciclo: Record<string, unknown> = {};
    ciclo.self = ciclo;
    expect(adoptCloudSave('id-da-nuvem', ciclo)).toBe('invalid');
    expect(store.get(STORAGE_KEYS.GAME_STATE)).toBe(ANTIGO);
  });
});

describe('guard de origem — só existe UM caminho que substitui o save inteiro', () => {
  const appSrc = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
  // A forma proibida: escrever o save inteiro com `setItem` cru. Quatro cópias
  // disso divergiram da camada defensiva da rodada 3, que parou no provider.
  const cru = /localStorage\.setItem\(\s*STORAGE_KEYS\.GAME_STATE/;

  // AUTOVERIFICAÇÃO do guard (STATUS §5): sem isto ele passaria para sempre.
  it('o guard reconhece a forma proibida quando ela existe', () => {
    expect(cru.test('localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(x));')).toBe(true);
    expect(cru.test('adoptCloudSave(id, state);')).toBe(false);
  });

  it('App.tsx não grava GAME_STATE com setItem cru', () => {
    expect(appSrc).not.toMatch(cru);
  });

  it('todo cloudLoad adotado passa por adoptCloudSave', () => {
    const adocoes = (appSrc.match(/adoptCloudSave\(/g) ?? []).length;
    expect(adocoes).toBeGreaterThanOrEqual(4);
  });
});
