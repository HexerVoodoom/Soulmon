// @vitest-environment jsdom
/**
 * D-18 — as polaridades de som de um save NOVO (sem nenhuma chave gravada).
 *
 * As chaves guardam o ESTADO MARCADO, e `readFlag` devolve `false` quando a chave
 * não existe. Por isso a polaridade de fábrica depende do NOME da chave:
 *  - efeitos sonoros: `SOUND_MUTED` ausente  => LIGADOS (isMuted() === false)
 *  - música (UMA preferência, §129): `SOUND_MUSIC_OFF` ausente => LIGADA (musicaLigada() === true), valendo para o
 *    tema da Home, o combate e o Pesadelo
 * Inverter qualquer uma (renomear a chave, trocar o sentido do readFlag) faz o app
 * nascer com o som errado sem erro em lugar nenhum.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';
import { isMuted } from './sounds';
import { temaPreferido } from './tema';
import { musicaLigada, trilhaLigada } from './audioBus';

describe('polaridades de som do save novo (D-18)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('save novo não tem nenhuma das chaves', () => {
    for (const k of [STORAGE_KEYS.SOUND_MUTED, STORAGE_KEYS.SOUND_MUSIC_OFF, STORAGE_KEYS.SOUND_MUSIC_VERSION]) {
      expect(localStorage.getItem(k)).toBeNull();
    }
  });

  it('efeitos sonoros nascem LIGADOS (SOUND_MUTED ausente)', () => {
    expect(isMuted()).toBe(false);
  });

  it('a música nasce LIGADA (SOUND_MUSIC_OFF ausente): tema, combate e Pesadelo juntos', () => {
    expect(musicaLigada()).toBe(true);
    expect(temaPreferido()).toBe(true);
    expect(trilhaLigada()).toBe(true);
  });
});
