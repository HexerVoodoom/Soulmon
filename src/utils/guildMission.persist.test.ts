import { describe, it, expect } from 'vitest';
import { startGuildMission, normalizeGuildMission } from './guildMission';
import { playerDayKey } from './playerDay';

/**
 * BUG DO DONO (14/11/2026, "a Feira continua sem funcionar"): o App parte com `startGuildMission(playerDayKey(...))`, e
 * `playerDayKey` escreve o dia como `toDateString` ("Sat Nov 14 2026"), não ISO. A hidratação do save
 * (`GameStateContext` → `normalizeGuildMission`) só aceitava `AAAA-MM-DD`: fechar/recarregar o app durante os 30 min
 * apagava a missão. O Soulmon "voltava" sem `guildRaidHit` (sem seiva, sem encontro, sem `hitToday`) e a sala da Feira
 * oferecia "Mandar investigar" de novo.
 */
describe('guildMission sobrevive a recarregar o app', () => {
  const agora = new Date('2026-11-14T15:00:00Z');
  for (const anchor of [undefined, { tz: 'America/Sao_Paulo' }, { offsetMin: -180 }] as const) {
    it(`a missão gravada pelo App volta igual da hidratação (âncora ${JSON.stringify(anchor ?? null)})`, () => {
      const m = startGuildMission(playerDayKey(agora, anchor as never), agora.getTime());
      const recarregada = normalizeGuildMission(JSON.parse(JSON.stringify(m)));
      expect(recarregada).toEqual(m);
    });
  }
  it('o formato ISO antigo continua valendo; lixo continua virando "sem missão"', () => {
    expect(normalizeGuildMission({ day: '2026-11-14', returnAt: 9 })).toEqual({ day: '2026-11-14', returnAt: 9 });
    for (const day of ['ontem', '', 'Sat Nov 14', 'x'.repeat(41), 'Sat Nov 14 2026 <b>']) expect(normalizeGuildMission({ day, returnAt: 9 })).toBeNull();
  });
});
