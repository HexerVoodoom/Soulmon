// @vitest-environment jsdom
/**
 * D-18 — as TRÊS polaridades de som de um save NOVO (sem nenhuma chave gravada).
 *
 * As chaves guardam o ESTADO MARCADO, e `readFlag` devolve `false` quando a chave
 * não existe. Por isso a polaridade de fábrica depende do NOME da chave:
 *  - efeitos sonoros: `SOUND_MUTED` ausente  => LIGADOS (isMuted() === false)
 *  - música-tema:     `SOUND_THEME_OFF` ausente => LIGADA (temaPreferido() === true)
 *  - música de masmorra/arena: `SOUND_TRACK_ENABLED` ausente => DESLIGADA (trilhaLigada() === false)
 * Inverter qualquer uma (renomear a chave, trocar o sentido do readFlag) faz o app
 * nascer com o som errado sem erro em lugar nenhum.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';
import { isMuted } from './sounds';
import { temaPreferido } from './tema';
import { trilhaLigada } from './audioBus';

describe('polaridades de som do save novo (D-18)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('save novo não tem nenhuma das três chaves', () => {
    for (const k of [STORAGE_KEYS.SOUND_MUTED, STORAGE_KEYS.SOUND_THEME_OFF, STORAGE_KEYS.SOUND_TRACK_ENABLED]) {
      expect(localStorage.getItem(k)).toBeNull();
    }
  });

  it('efeitos sonoros nascem LIGADOS (SOUND_MUTED ausente)', () => {
    expect(isMuted()).toBe(false);
  });

  it('música-tema nasce LIGADA (SOUND_THEME_OFF ausente)', () => {
    expect(temaPreferido()).toBe(true);
  });

  it('música de masmorra/arena nasce DESLIGADA (SOUND_TRACK_ENABLED ausente)', () => {
    expect(trilhaLigada()).toBe(false);
  });
});
