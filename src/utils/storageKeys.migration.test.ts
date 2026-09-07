// @vitest-environment jsdom
/**
 * A migração das chaves `digiapp-*` → `soulmon-*`.
 *
 * O prefixo era herança do fork e este repositório afirmava, em dois lugares,
 * que ele era mantido de propósito "porque renomear faria os usuários atuais
 * perderem o progresso local". Não havia usuários atuais — ninguém nunca usou
 * o app em produção (07/09/2026, confirmado pelo dono).
 *
 * A migração existe assim mesmo, pelo save do DONO: "ninguém em produção" não
 * é "nenhum save existe", e o custo de errar isso seria o progresso dele.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS, migrateLegacyStorageKeys } from './storageKeys';

describe('migrateLegacyStorageKeys', () => {
  beforeEach(() => localStorage.clear());

  it('traz o save antigo para a chave nova', () => {
    localStorage.setItem('digiapp_state_v3', '{"gamePoints":42}');
    migrateLegacyStorageKeys();
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBe('{"gamePoints":42}');
  });

  it('traz as preferências', () => {
    localStorage.setItem('digiapp-theme', 'dark');
    localStorage.setItem('digiapp-language', 'pt-BR');
    migrateLegacyStorageKeys();
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe('pt-BR');
  });

  it('COPIA, não move — o original fica para recuperação manual', () => {
    localStorage.setItem('digiapp_state_v3', '{"a":1}');
    migrateLegacyStorageKeys();
    expect(localStorage.getItem('digiapp_state_v3')).toBe('{"a":1}');
  });

  it('NUNCA sobrescreve a chave nova — ela é a que o app vem escrevendo', () => {
    localStorage.setItem('digiapp_state_v3', '{"velho":true}');
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, '{"novo":true}');
    migrateLegacyStorageKeys();
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBe('{"novo":true}');
  });

  it('é idempotente: rodar duas vezes dá o mesmo resultado', () => {
    localStorage.setItem('digiapp-user-name', 'Mateus');
    migrateLegacyStorageKeys();
    localStorage.setItem(STORAGE_KEYS.USER_NAME, 'Outro');
    migrateLegacyStorageKeys();
    expect(localStorage.getItem(STORAGE_KEYS.USER_NAME)).toBe('Outro');
  });

  it('sem nada antigo, não inventa chave nenhuma', () => {
    migrateLegacyStorageKeys();
    expect(localStorage.length).toBe(0);
  });

  it('storage que LANÇA não derruba o boot', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('bloqueado'); };
    expect(() => migrateLegacyStorageKeys()).not.toThrow();
    Storage.prototype.getItem = original;
  });
});

describe('nenhuma chave nasce com o prefixo do fork', () => {
  it('STORAGE_KEYS é inteiramente `soulmon-`', () => {
    const forasteiras = Object.entries(STORAGE_KEYS)
      .filter(([, v]) => !String(v).startsWith('soulmon'));
    expect(forasteiras).toEqual([]);
  });
});
