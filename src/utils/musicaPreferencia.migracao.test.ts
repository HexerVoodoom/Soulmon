// @vitest-environment jsdom
/**
 * §129 — a MIGRAÇÃO das três chaves legadas (tema, combate, marca da §127) para a preferência única de música.
 * localStorage real do jsdom; só desliga quem desligou AS DUAS depois da §127.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS as K } from './storageKeys';
import { musicaLigada, definirMusicaLigada, migrarPreferenciaDeMusica } from './audioBus';
import { iniciarMusica, esquecerMusica } from './musica';
import { esquecerTrilha } from './trilha';

const ls = (k: string) => localStorage.getItem(k);

beforeEach(() => { localStorage.clear(); esquecerTrilha(); esquecerMusica(); });

describe('migrarPreferenciaDeMusica (§129)', () => {
  it('(a) sem chaves: LIGADA e a marca vira "1"', () => {
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(true);
    expect(ls(K.SOUND_MUSIC_VERSION)).toBe('1');
  });
  it('(b) só SOUND_THEME_OFF="true": LIGADA', () => {
    localStorage.setItem(K.SOUND_THEME_OFF, 'true');
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(true);
  });
  it('(c) só SOUND_TRACK_ENABLED="false" sem marca §127 (herdado da S2): LIGADA', () => {
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(true);
  });
  it('(d) marca §127 + combate "false" + tema ligado: LIGADA', () => {
    localStorage.setItem(K.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(true);
  });
  it('(e) marca §127 + combate "false" + tema OFF: DESLIGADA', () => {
    localStorage.setItem(K.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(K.SOUND_THEME_OFF, 'true');
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(false);
  });
  it('(f) combate "false" + tema OFF SEM marca §127: LIGADA (o "false" é herança)', () => {
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(K.SOUND_THEME_OFF, 'true');
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(true);
  });
  it('(g) idempotente: rodar 2x dá o mesmo; depois da marca, definirMusicaLigada(false) sobrevive a nova migração', () => {
    localStorage.setItem(K.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(K.SOUND_THEME_OFF, 'true');
    migrarPreferenciaDeMusica();
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(false);
    localStorage.clear();
    migrarPreferenciaDeMusica();
    definirMusicaLigada(false);
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(false);
    definirMusicaLigada(true);
    migrarPreferenciaDeMusica();
    expect(musicaLigada()).toBe(true);
  });
  it('(h) as três legadas são removidas depois de migrar', () => {
    localStorage.setItem(K.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(K.SOUND_THEME_OFF, 'true');
    migrarPreferenciaDeMusica();
    for (const k of [K.SOUND_PREFS_VERSION, K.SOUND_TRACK_ENABLED, K.SOUND_THEME_OFF]) expect(ls(k)).toBeNull();
  });
  it('(i) iniciarMusica() roda a migração', () => {
    localStorage.setItem(K.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(K.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(K.SOUND_THEME_OFF, 'true');
    iniciarMusica();
    expect(ls(K.SOUND_MUSIC_VERSION)).toBe('1');
    expect(ls(K.SOUND_THEME_OFF)).toBeNull();
    expect(musicaLigada()).toBe(false);
  });
});
