/**
 * PONTO CEGO Nº 4 da revisão adversarial: **o relógio do aparelho.**
 *
 * "Um v-pet cujo laço é a virada do dia, e ninguém testou mudar a data:
 *  adiantar para farmar `perfectDays`, atrasar para evitar o dreno de cocô.
 *  `computeDailyReset` é pura e testada — contra o relógio que ela recebe."
 *
 * Este arquivo testa exatamente o que faltava: não a regra, e sim a relação
 * entre a regra e um relógio HOSTIL. O gatilho da virada é
 * `useDailyReset.ts:57` — `new Date().toDateString() !== gameState.lastResetDate`,
 * uma comparação de DESIGUALDADE. Ela não exige que o tempo tenha andado para
 * frente, nem que tenha passado um dia de verdade.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset } from '../utils/dailyReset';

const base = () => ({
  activities: [],
  tasks: [
    { id: 't1', name: 'A', category: 'health', emoji: '💧', completed: true },
    { id: 't2', name: 'B', category: 'study', emoji: '📖', completed: true },
    { id: 't3', name: 'C', category: 'work', emoji: '💼', completed: true },
    { id: 't4', name: 'D', category: 'fitness', emoji: '🏃', completed: true },
  ],
  completedTasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  energyPoints: 4,
  perfectDays: 0,
  totalXP: 0,
  virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
  evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'],
  degeneratedByHP: false,
  currentBranch: 'data' as const,
  lastDayWasPerfect: false,
  maxActivityCap: 6,
  lastResetDate: new Date('2026-08-14T12:00:00Z').toDateString(),
  attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
  poopEventsShown: [],
  poopEventsCompleted: [],
  activityLog: [],
});

/** Recompleta as tarefas e reenche a energia — o que o jogador faz num toque. */
function jogarODia<T extends Record<string, any>>(s: T): T {
  return {
    ...s,
    tasks: s.tasks.map((t: any) => ({ ...t, completed: true })),
    energyPoints: 4,
  };
}

describe('a regra da virada confia no relógio do aparelho', () => {
  it('o gatilho é DESIGUALDADE de data, não "passou um dia"', () => {
    // Documenta a forma exata do gatilho (useDailyReset.ts:57). Qualquer data
    // diferente da última serve — inclusive uma data ANTERIOR.
    const ontem = new Date('2026-08-13T12:00:00Z').toDateString();
    const hoje = new Date('2026-08-14T12:00:00Z').toDateString();
    expect(ontem !== hoje).toBe(true);
    // e o inverso também dispara: voltar no tempo é "mudança de dia" igual
    expect(hoje !== ontem).toBe(true);
  });

  it('ACHADO: adiantar o relógio farma `perfectDays` sem esperar o dia passar', () => {
    // Cenário concreto, em ~1 minuto de relógio real:
    // Configurações do Android → desligar hora automática → +1 dia → abrir o
    // app (o check roda a cada 30s) → remarcar as 4 tarefas → repetir.
    // Cada ciclo é +1 dia perfeito, que é a moeda da EVOLUÇÃO e vai para o
    // ranking da comunidade (`perfectDays`/`totalPerfectDays`).
    let s: any = base();
    for (let dia = 1; dia <= 5; dia++) {
      const now = new Date(`2026-08-${14 + dia}T12:00:00Z`);
      s = computeDailyReset(jogarODia(s), { now });
    }
    expect(s.perfectDays).toBe(5);
    expect(s.healthPoints).toBe(3); // e sem custo nenhum
  });

  it('ACHADO: ATRASAR o relógio também é aceito como virada de dia', () => {
    // Não há checagem de monotonicidade. Voltar a data faz o app processar
    // outra virada — o mesmo "dia" pode render ponto mais de uma vez.
    let s: any = base();
    s = computeDailyReset(jogarODia(s), { now: new Date('2026-08-15T12:00:00Z') });
    expect(s.perfectDays).toBe(1);
    // agora o aparelho volta para 13/08
    s = computeDailyReset(jogarODia(s), { now: new Date('2026-08-13T12:00:00Z') });
    expect(s.perfectDays).toBe(2);
    // e o estado passa a registrar uma data ANTERIOR à que já tinha sido
    // processada, sem nada reclamar
    expect(s.lastResetDate).toBe(new Date('2026-08-13T12:00:00Z').toDateString());
  });

  it('o perdão de ausência é calculado sobre a MESMA data mentirosa', () => {
    // `ABSENCE_FORGIVENESS_DAYS` protege quem sumiu. Como a distância é medida
    // contra `lastResetDate`, adiantar o relógio em 3 dias também compra o
    // perdão: nenhum coração é cobrado pelo dia ruim.
    const s: any = {
      ...base(),
      tasks: base().tasks.map(t => ({ ...t, completed: false })),
      energyPoints: 0,
    };
    const semSalto = computeDailyReset(s, { now: new Date('2026-08-15T12:00:00Z') });
    const comSalto = computeDailyReset(s, { now: new Date('2026-08-18T12:00:00Z') });
    expect(semSalto.healthPoints).toBeLessThan(3);   // dia ruim custa
    expect(comSalto.healthPoints).toBe(3);           // "ausência" perdoa
  });

  it('OBSERVAÇÃO: a regra em si é honesta — dia não jogado NÃO vira ponto', () => {
    // O contraponto que impede o achado de virar alarmismo: só adiantar o
    // relógio não farma nada. É preciso REMARCAR as tarefas a cada ciclo. A
    // falha é de confiança no relógio, não de generosidade da regra.
    let s: any = base();
    s = computeDailyReset(s, { now: new Date('2026-08-15T12:00:00Z') });
    const depois = computeDailyReset(s, { now: new Date('2026-08-16T12:00:00Z') });
    expect(depois.perfectDays).toBe(s.perfectDays); // segundo salto não rende
  });
});
