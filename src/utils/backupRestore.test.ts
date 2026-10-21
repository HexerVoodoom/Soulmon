import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { resetStorageNotice } from './safeStorage';
import { sessaoEncerrando, __resetSessaoEncerrando } from './sessionReset';

// L08-04 — restaurar backup. A nuvem é mockada (lerNuvem/cloudSave); o resto é real.
const lerNuvem = vi.fn();
const cloudSave = vi.fn();
vi.mock('./cloudSave', () => ({
  lerNuvem: (...a: unknown[]) => lerNuvem(...a),
  cloudSave: (...a: unknown[]) => cloudSave(...a),
}));

import {
  listarCopiasDoAparelho, lerArquivoDeBackup, restaurarCopia, resumoDaCopia, origemDaCopia,
} from './backupRestore';

const RING = STORAGE_KEYS.BACKUP_RING;
const store = new Map<string, string>();
let ordem: string[] = [];
let falhaChave: string | null = null;

const estado = (nome: string, extra: Record<string, unknown> = {}) => ({
  soulmonMeta: { baseName: nome }, evolutionStage: 'champion', totalXP: 123, ...extra,
});
const ring = () => (JSON.parse(store.get(RING) ?? '{"copias":[]}') as { copias: Array<{ motivo: string; saveId: string; state: { soulmonMeta?: { baseName: string } } }> }).copias;

beforeEach(() => {
  __resetSessaoEncerrando();
  store.clear(); ordem = []; falhaChave = null;
  lerNuvem.mockReset(); cloudSave.mockReset();
  resetStorageNotice();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (k === falhaChave) throw new DOMException('cheio', 'QuotaExceededError');
      ordem.push(k); store.set(k, v);
    },
    removeItem: (k: string) => { store.delete(k); },
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('listarCopiasDoAparelho', () => {
  it('lista as 3 fontes: anel, quarentena e vaga da adoção', () => {
    store.set(RING, JSON.stringify({ formato: 'soulmon-backup-ring-v1', copias: [{ saveId: 's', salvoEm: '2026-10-01T10:00:00Z', motivo: 'logout', state: estado('Anel') }] }));
    store.set(STORAGE_KEYS.SAVE_QUARANTINE, JSON.stringify({ formato: 'soulmon-save-quarantine-v1', salvoEm: '2026-10-02T10:00:00Z', saveId: 's', motivo: 'x', cru: JSON.stringify(estado('Quarentena')) }));
    store.set(RECONCILE_KEYS.CONFLICT_BACKUP, JSON.stringify({ saveId: 's', salvoEm: '2026-10-03T10:00:00Z', motivo: 'adocao-da-nuvem', state: estado('Adocao') }));
    const l = listarCopiasDoAparelho();
    expect(l.map(c => c.fonte)).toEqual(['conflito', 'quarentena', 'anel']); // mais nova primeiro
    expect(l.map(c => c.state.soulmonMeta)).toEqual([{ baseName: 'Adocao' }, { baseName: 'Quarentena' }, { baseName: 'Anel' }]);
  });

  it('ignora quarentena ilegível, cortada ou que não vira objeto; e anel com state em texto', () => {
    store.set(STORAGE_KEYS.SAVE_QUARANTINE, JSON.stringify({ cru: '{"soulmonMeta":{"base' }));
    expect(listarCopiasDoAparelho()).toEqual([]);
    store.set(STORAGE_KEYS.SAVE_QUARANTINE, JSON.stringify({ cru: JSON.stringify(estado('X')), cortado: true }));
    expect(listarCopiasDoAparelho()).toEqual([]);
    store.set(STORAGE_KEYS.SAVE_QUARANTINE, 'não é json');
    store.set(RING, JSON.stringify({ copias: [{ saveId: '', salvoEm: '', motivo: 'conflict-backup-ilegivel', state: 'texto cru' }] }));
    store.set(RECONCILE_KEYS.CONFLICT_BACKUP, '{lixo');
    expect(listarCopiasDoAparelho()).toEqual([]);
  });
});

describe('lerArquivoDeBackup', () => {
  it('aceita o arquivo de montarBackupLocal', () => {
    const r = lerArquivoDeBackup(JSON.stringify({ format: 'soulmon-local-backup-v1', generatedAt: '2026-10-05T00:00:00Z', state: estado('Arq') }));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.copia.fonte).toBe('arquivo'); expect(r.copia.salvoEm).toBe('2026-10-05T00:00:00Z'); }
  });
  it('JSON inválido, formato errado e state não-objeto viram erro nomeado, sem lançar', () => {
    expect(lerArquivoDeBackup('{nope')).toEqual({ ok: false, erro: 'json' });
    expect(lerArquivoDeBackup('')).toEqual({ ok: false, erro: 'json' });
    expect(lerArquivoDeBackup(JSON.stringify({ format: 'outro', state: estado('a') }))).toEqual({ ok: false, erro: 'formato' });
    expect(lerArquivoDeBackup('[1,2]')).toEqual({ ok: false, erro: 'formato' });
    expect(lerArquivoDeBackup(JSON.stringify({ format: 'soulmon-local-backup-v1', state: 'texto' }))).toEqual({ ok: false, erro: 'estado' });
    expect(lerArquivoDeBackup(JSON.stringify({ format: 'soulmon-local-backup-v1', state: [] }))).toEqual({ ok: false, erro: 'estado' });
  });
});

describe('textos', () => {
  it('resumo sem número; origem pelo motivo', () => {
    expect(resumoDaCopia(estado('Luma'), true)).toBe('Luma · Ascendente');
    expect(resumoDaCopia(estado('Luma'), false)).toBe('Luma · Ascendant');
    expect(resumoDaCopia({}, false)).not.toMatch(/\d/);
    expect(origemDaCopia({ fonte: 'anel', motivo: 'logout' }, true)).toBe('Cópia de quando você saiu da conta.');
    expect(origemDaCopia({ fonte: 'anel', motivo: 'conflito-409' }, false)).toMatch(/another device/);
  });
});

describe('restaurarCopia', () => {
  it('guarda o atual no anel ANTES de gravar GAME_STATE; SAVE_ID fica', async () => {
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(estado('Atual')));
    store.set(STORAGE_KEYS.SAVE_ID, '');
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('ok');
    expect(ordem.indexOf(RING)).toBeGreaterThanOrEqual(0);
    expect(ordem.indexOf(RING)).toBeLessThan(ordem.indexOf(STORAGE_KEYS.GAME_STATE));
    expect(ring().at(-1)).toMatchObject({ motivo: 'antes-de-restaurar', state: { soulmonMeta: { baseName: 'Atual' } } });
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Velha');
    expect(store.get(STORAGE_KEYS.SAVE_ID)).toBe('');
    expect(lerNuvem).not.toHaveBeenCalled(); // sem conta: nada sobe
  });

  it('aborta sem trocar nada se a cópia do atual falhar', async () => {
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(estado('Atual')));
    falhaChave = RING;
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('sem-copia');
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Atual');
  });

  it('cota negando o GAME_STATE: devolve storage', async () => {
    falhaChave = STORAGE_KEYS.GAME_STATE;
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('storage');
  });

  it('state inválido: invalido, nada muda', async () => {
    store.set(STORAGE_KEYS.GAME_STATE, 'orig');
    for (const ruim of ['x', null, [], 5, {}]) await expect(restaurarCopia(ruim)).resolves.toBe('invalido');
    expect(store.get(STORAGE_KEYS.GAME_STATE)).toBe('orig');
  });

  it('estado atual ilegível (texto cru) também vai ao anel', async () => {
    store.set(STORAGE_KEYS.GAME_STATE, '{cortado');
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('ok');
    expect(ring().at(-1)).toMatchObject({ motivo: 'antes-de-restaurar', state: '{cortado' });
  });

  it('com conta: empurra a cópia da nuvem, grava a revisão e manda cloudSave', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    lerNuvem.mockResolvedValue({ estado: 'encontrado', state: estado('Nuvem'), revision: 7 });
    cloudSave.mockImplementation(async () => {
      expect(JSON.parse(store.get(STORAGE_KEYS.SAVE_REVISION)!)).toEqual({ saveId: 'conta1', r: 7 }); // base já gravada
      return { ok: true };
    });
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('ok');
    expect(ring().map(c => c.motivo)).toContain('nuvem-antes-de-restaurar');
    expect(cloudSave).toHaveBeenCalledTimes(1);
    expect(cloudSave.mock.calls[0][0]).toBe('conta1');
    expect((cloudSave.mock.calls[0][1] as { soulmonMeta: { baseName: string } }).soulmonMeta.baseName).toBe('Velha');
  });

  it('409: relê e retenta UMA vez com a revisão nova', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    lerNuvem.mockResolvedValueOnce({ estado: 'encontrado', state: estado('N1'), revision: 3 })
      .mockResolvedValueOnce({ estado: 'encontrado', state: estado('N2'), revision: 9 });
    cloudSave.mockResolvedValue({ ok: false, kind: 'conflict', status: 409 });
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('ok');
    expect(cloudSave).toHaveBeenCalledTimes(2);
    expect(JSON.parse(store.get(STORAGE_KEYS.SAVE_REVISION)!).r).toBe(9);
    expect(ring().filter(c => c.motivo === 'nuvem-antes-de-restaurar').map(c => c.state.soulmonMeta?.baseName)).toEqual(['N1', 'N2']);
  });

  it('nuvem indeterminada (offline): sem-rede, NADA muda (local e revisão intactos)', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(estado('Atual')));
    lerNuvem.mockResolvedValue({ estado: 'indeterminado' });
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('sem-rede');
    expect(cloudSave).not.toHaveBeenCalled();
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Atual');
    expect(store.has(STORAGE_KEYS.SAVE_REVISION)).toBe(false);
    expect(sessaoEncerrando()).toBe(false);
  });

  it('nuvem excluída: resultado próprio, nada muda', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(estado('Atual')));
    lerNuvem.mockResolvedValue({ estado: 'excluida' });
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('excluida');
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Atual');
  });

  it('cópia da nuvem não coube no anel: sem-copia, GAME_STATE e revisão intactos', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ naoTemProgresso: true }));
    lerNuvem.mockResolvedValue({ estado: 'encontrado', state: estado('Nuvem'), revision: 7 });
    falhaChave = RING;
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('sem-copia');
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!)).toEqual({ naoTemProgresso: true });
    expect(cloudSave).not.toHaveBeenCalled();
    expect(sessaoEncerrando()).toBe(false);
  });

  it('congela as gravações do provider antes de gravar; upload falho mantém o local e a revisão', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    lerNuvem.mockResolvedValue({ estado: 'encontrado', state: estado('Nuvem'), revision: 7 });
    cloudSave.mockResolvedValue({ ok: false, kind: 'offline', status: 0 });
    await expect(restaurarCopia(estado('Velha'))).resolves.toBe('ok');
    expect(sessaoEncerrando()).toBe(true);
    expect(JSON.parse(store.get(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Velha');
    expect(JSON.parse(store.get(STORAGE_KEYS.SAVE_REVISION)!)).toEqual({ saveId: 'conta1', r: 7 });
  });

  it('o flag já está ligado quando o GAME_STATE é gravado', async () => {
    let vistoNaGravacao: boolean | null = null;
    const base = (globalThis.localStorage as Storage).setItem.bind(globalThis.localStorage);
    (globalThis.localStorage as Storage).setItem = (k: string, v: string) => {
      if (k === STORAGE_KEYS.GAME_STATE) vistoNaGravacao = sessaoEncerrando();
      base(k, v);
    };
    await restaurarCopia(estado('Velha'));
    expect(vistoNaGravacao).toBe(true);
  });

  it('demo local não sobe', async () => {
    store.set(STORAGE_KEYS.SAVE_ID, 'conta1');
    await restaurarCopia(estado('Demo', { demoLocal: true }));
    expect(lerNuvem).not.toHaveBeenCalled();
  });
});
