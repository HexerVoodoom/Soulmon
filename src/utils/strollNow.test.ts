/**
 * O PASSEIO PAGA NA HORA (REGISTRO §413): `applyStrollNow` é a conta única do "Concluir" (NPC ou linha da Home). Trava aqui:
 * paga tudo uma vez (região guardada abre, achado no diário, avistado no Drive, `sceneDay`/`claimDay` gravados), a 2ª passada é no-op
 * (marcar pelas duas portas não paga duas vezes), sem missão de pé não faz nada, e o achado é o MESMO que o resumo da noite acharia.
 */
import { describe, it, expect } from 'vitest';
import { CROSSINGS_EMPTY } from '../types/travessias';
import { applyStrollNow } from './strollNow';
import { dailyOffer, passeioFindOfDay, pickMission } from './travessias';
import { playerDayIso, playerDayKey } from './playerDay';
import { ENEMY_ROSTER } from './enemyRoster';

const NOW = new Date(2026, 10, 16, 15, 0, 0).getTime();
const DAY = playerDayIso(new Date(NOW), undefined);
const m = dailyOffer(DAY, 'seed')[0];
const pegada = () => ({
  crossings: { ...pickMission(CROSSINGS_EMPTY, DAY, 'seed', m.region.id, m.challenge.id, NOW - 60_000), pending: [m.region.id] },
  adventures: [] as Array<{ id: string; day: string }>,
  bestiary: [] as string[],
  playerDayTz: undefined,
});

describe('applyStrollNow', () => {
  it('paga tudo na hora: Fiz, recibo, cena, região que abre, achado e avistado', () => {
    const r = applyStrollNow(pegada(), NOW, false)!;
    expect(r).not.toBeNull();
    const c = r.state.crossings!;
    expect(c.doneDay).toBe(DAY);
    expect(c.claimDay).toBe(DAY);
    expect(c.sceneDay).toBe(DAY);
    expect(c.score).toBe(1);
    expect(c.opened.some(o => o.region === m.region.id && o.day === DAY)).toBe(true);
    expect(r.state.adventures).toEqual([{ id: r.scene.adventure.id, day: playerDayKey(new Date(NOW), undefined) }]);
    expect(r.scene.discovery).not.toBeNull();
    expect(r.state.bestiary).toEqual([r.scene.discovery!.key]);
    expect(r.scene.regionId).toBe(m.region.id);
    expect(r.scene.stroll.destination).toBe(m.region.nameEn);
  });

  it('idempotente: a 2ª passada (outra porta, toque duplo) não paga nada de novo', () => {
    const r = applyStrollNow(pegada(), NOW, false)!;
    expect(applyStrollNow(r.state, NOW + 5_000, false)).toBeNull();
  });

  it('sem missão de pé não faz nada', () => {
    expect(applyStrollNow({ ...pegada(), crossings: CROSSINGS_EMPTY }, NOW, false)).toBeNull();
  });

  it('o achado é o MESMO que o resumo da noite acharia (a noite não sorteia outro)', () => {
    const r = applyStrollNow(pegada(), NOW, false)!;
    const noite = passeioFindOfDay({
      crossings: r.state.crossings!, entries: r.state.adventures!, feito: 5, meta: 5,
      dayKey: playerDayKey(new Date(NOW), undefined), crossDay: DAY,
    });
    expect(noite.id).toBe(r.scene.adventure.id);
  });

  it('com o Drive completo, não há avistado e o bestiário não muda', () => {
    const cheio = { ...pegada(), bestiary: ENEMY_ROSTER.map(e => e.key) };
    const r = applyStrollNow(cheio, NOW, true)!;
    expect(r.scene.discovery).toBeNull();
    expect(r.state.bestiary).toBe(cheio.bestiary);
  });
});
