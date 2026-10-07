import { describe, it, expect } from 'vitest';
import catalogo from '../assets/avatares/catalogo.json';
import { DEFAULT_AVATAR_IDS, sanitizeAvatarId, defaultAvatarId, resolveAvatarId } from './avatar';
import { AVATAR_CATALOG, AVATAR_GROUPS, avatarAlt } from './avatarCopy';
// @ts-expect-error módulo JS do servidor
import { AVATAR_IDS, avatarIdOrNull } from '../../functions/api/_avatares.js';
// @ts-expect-error módulo JS do servidor
import { FRAME_IDS, frameIdOrNull } from '../../functions/api/_frames.js';
import { FRAMES } from './frames';

describe('avatar de perfil — lista fechada', () => {
  it('PARIDADE: catalogo.json == AVATAR_IDS do servidor', () => {
    expect([...AVATAR_IDS].sort()).toEqual(catalogo.map(c => c.id).sort());
    expect(new Set(catalogo.map(c => c.id)).size).toBe(catalogo.length);
  });
  it('PARIDADE: molduras do servidor == FRAMES do cliente', () => {
    expect([...FRAME_IDS].sort()).toEqual(FRAMES.map(f => f.id).sort());
    expect(frameIdOrNull('rank-ouro')).toBe('rank-ouro');
    expect(frameIdOrNull('x')).toBeNull();
  });
  it('o servidor só devolve ids da lista', () => {
    expect(avatarIdOrNull('ativo-arena')).toBe('ativo-arena');
    for (const v of ['<img>', '', 5, null, undefined, { a: 1 }, 'ativo-nao-existe']) expect(avatarIdOrNull(v)).toBeNull();
  });
  it('os padrões existem no catálogo e são determinísticos', () => {
    for (const id of DEFAULT_AVATAR_IDS) expect(AVATAR_IDS.has(id)).toBe(true);
    expect(defaultAvatarId('abc')).toBe(defaultAvatarId('abc'));
    expect(resolveAvatarId('lixo ruim!', 'abc')).toBe(defaultAvatarId('abc'));
    expect(sanitizeAvatarId('ativo-arena')).toBe('ativo-arena');
  });
  it('todo grupo tem rótulo PT/EN e alt PT/EN não vazio', () => {
    for (const e of AVATAR_CATALOG) expect(AVATAR_GROUPS[e.g]).toBeTruthy();
    for (const e of AVATAR_CATALOG) expect(e.en.length).toBeGreaterThan(2);
    expect(avatarAlt(AVATAR_CATALOG[0], 0, false)).toBe(AVATAR_CATALOG[0].en);
    expect(avatarAlt(AVATAR_CATALOG[0], 0, true).length).toBeGreaterThan(0);
  });
});
