/**
 * O cliente espelha DOIS números do servidor (`functions/api/_coop.js`): o teto
 * da roda e o limite da presença nominal — e o alfabeto do código. Divergir não
 * dá erro nenhum: a copy diria "até 11 pessoas" para uma roda de 8, ou o cliente
 * desenharia presença nominal onde o servidor já a cortou. Este encontro lê o
 * FONTE do servidor (é `.js` fora do tsconfig do app).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GROVE_STAGES, GUILD_GESTURES, GUILD_MAX_MEMBERS, GUILD_PRESENCE_NOMINAL_MAX, GUILD_NAME_MAX, GUILD_CODE_LENGTH, normalizeGuildCode,
  RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_EVERY, RAID_TROPHY_ID, GUILD_TIDE_WEEKS, RAID_PHENOMENA } from './guildRules';

const coop = fs.readFileSync(path.resolve(__dirname, '../../functions/api/_coop.js'), 'utf8');
const num = (nome: string) => Number(new RegExp(`export const ${nome} = (\\d+);`).exec(coop)?.[1]);

describe('guildRules × functions/api/_coop.js', () => {
  it('teto da roda, presença nominal e comprimento do nome batem com o servidor', () => {
    expect(GUILD_MAX_MEMBERS).toBe(num('COOP_MAX_MEMBERS'));
    expect(GUILD_PRESENCE_NOMINAL_MAX).toBe(num('PRESENCA_NOMINAL_MAX'));
    expect(GUILD_NAME_MAX).toBe(num('NOME_MAX'));
  });

  it('o campo de código só aceita o alfabeto que o servidor sorteia (sem 0/O/1/I)', () => {
    const alfabeto = /const alfabeto = '([A-Z2-9]+)'/.exec(coop)?.[1] ?? '';
    expect(alfabeto.length).toBeGreaterThan(20);
    expect(GUILD_CODE_LENGTH).toBe(Number(/new Uint8Array\((\d+)\)/.exec(coop)?.[1]));
    expect(normalizeGuildCode(alfabeto + alfabeto)).toBe(alfabeto.slice(0, GUILD_CODE_LENGTH));
    expect(normalizeGuildCode('o0i1-abc d2345 xyz')).toBe('ABCD2345');
  });

  it('estágios do Bosque e gestos: mesmos ids, mesma ordem que o servidor', () => {
    const lista = (nome: string) => [...(new RegExp(`export const ${nome} = Object\\.freeze\\(\\[([^\\]]+)\\]\\)`).exec(coop)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]);
    expect([...GROVE_STAGES]).toEqual(lista('BOSQUE_STAGES'));
    expect([...GUILD_GESTURES]).toEqual(lista('GUILD_GESTURES'));
  });

  it('a Feira: Emblemas, troféu e maré batem com o servidor; os quatro fenômenos existem lá', () => {
    expect(RAID_EMBLEMS).toBe(num('RAID_EMBLEMS'));
    expect(RAID_EMBLEMS_FLOOR).toBe(num('RAID_EMBLEMS_FLOOR'));
    expect(RAID_TROPHY_EVERY).toBe(num('RAID_TROPHY_EVERY'));
    expect(GUILD_TIDE_WEEKS).toBe(num('GUILD_TIDE_WEEKS'));
    expect(RAID_TROPHY_ID).toBe(/RAID_TROPHY_ID = '([^']+)'/.exec(coop)?.[1]);
    const guild = fs.readFileSync(path.resolve(__dirname, '../../functions/api/guild.js'), 'utf8') + coop;
    for (const f of RAID_PHENOMENA) expect(guild).toContain(`'${f}'`);
  });
});
