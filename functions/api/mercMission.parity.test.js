import { describe, it, expect } from 'vitest';
import * as server from './_mercMission.js';
import { MERC_ORDENS, sanitizeMercMission } from '../../src/utils/mercMission';
import { MERC_TAREFAS } from '../../src/data/mercTarefas';

describe('paridade mercMission (cliente x servidor)', () => {
  it('mesma lista de Ordens', () => { expect(server.MERC_ORDENS).toEqual([...MERC_ORDENS]); });
  it('mesma forma saneada, idempotente (a leitura do cliente é tolerante; o servidor é mais estrito só no pendente)', () => {
    const ok = { day: 'Fri Oct 30 2026', ordem: 'filtrador', activityId: 'f-elogio', done: false };
    const feita = { ...ok, activityId: 'x', done: true };
    for (const raw of [undefined, null, 'x', 3, [], {}, ok, feita, { ...ok, done: 'sim' }, { ...ok, ordem: 'cla' }, { ...ok, day: '' },
      { ...ok, day: 'd'.repeat(41) }, { ...ok, activityId: 'a'.repeat(65) }, { ...ok, extra: 1 }]) {
      const c = sanitizeMercMission(raw);
      const s = server.sanitizeMercMission(raw);
      expect(s).toEqual(c);
      expect(sanitizeMercMission(c)).toEqual(c);
      expect(server.sanitizeMercMission(s)).toEqual(s);
    }
  });
  it('mesmo mapa id -> Ordem das tarefas da Guilda', () => {
    expect(server.MERC_TAREFA_ORDEM).toEqual(Object.fromEntries(MERC_TAREFAS.map(t => [t.id, t.ordem])));
  });
  it('servidor descarta proposta PENDENTE fora do catálogo da Guilda e mantém a cumprida', () => {
    const base = { day: 'Fri Nov 06 2026', ordem: 'rompente', done: false };
    for (const activityId of ['hidratacao-agua', 'caminhada-3x-semana', 'f-elogio', '__proto__', 'toString']) {
      expect(server.sanitizeMercMission({ ...base, activityId })).toBeUndefined();
    }
    expect(server.sanitizeMercMission({ ...base, activityId: 'r-foco' })).toEqual({ ...base, activityId: 'r-foco' });
    expect(server.sanitizeMercMission({ ...base, activityId: 'hidratacao-agua', done: true })).toEqual({ ...base, activityId: 'hidratacao-agua', done: true });
  });
});
