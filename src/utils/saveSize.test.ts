import { describe, it, expect } from 'vitest';

/**
 * WP0.7 — o tamanho do save NUNCA tinha sido medido (anexo E §4). O teto do
 * servidor é MAX_STATE_BYTES = 5 MB (functions/api/save.js). Este teste monta um
 * save SINTÉTICO de ~90 dias de uso pesado (com os campos que crescem: rhythms
 * com HISTORY_CAP 120, completedTasks, activityLog, moodLog, sonhos, acervo de
 * sprites como URLs) e imprime os bytes — o número vai para o STATUS.md.
 * Decide se WP3.1 (contexto) e WP4.6 (álbum/encontros) cabem no save.
 */
const day = (i: number) => `2026-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`;
const days = (n: number, from = 0) => Array.from({ length: n }, (_, i) => day(from + i));

function synthetic90Days() {
  const rhythms: Record<string, unknown> = {};
  for (let h = 0; h < 8; h++) {
    rhythms[`habit-${h}`] = {
      done: days(120), missed: days(10, 120), shielded: days(5, 130), shields: 2,
      totalDone: 140, lastCompletedDate: day(119), lastShieldAt: day(118),
    };
  }
  return {
    petName: 'Nimbra', soulmonDisplayName: 'Nimbra', evolutionStage: 'mega-harmony',
    healthPoints: 3, maxHealthPoints: 4, energyPoints: 5, perfectDays: 40, totalPerfectDays: 40,
    powerPoints: 120, harmonyPoints: 300, benevolencePoints: 90, totalXP: 9800, gamePoints: 4200, emblems: 180,
    soulGoal: 'x'.repeat(280), soulStruggle: 'y'.repeat(280),
    activities: Array.from({ length: 8 }, (_, i) => ({ id: `habit-${i}`, name: `Hábito ${i} com nome razoavelmente longo`, category: 'Health', effort: 1, schedule: { kind: 'weekdays', days: [0,1,2,3,4,5,6] }, weekDays: [0,1,2,3,4,5,6], createdAt: day(0), lastTouchedAt: day(89) })),
    tasks: Array.from({ length: 20 }, (_, i) => ({ id: `task-${i}`, name: `Tarefa ${i} — descrição de tamanho médio para simular uso real`, category: 'Work', effort: 2, status: 'open', dueDate: day(90 + i), createdAt: day(i), postponedCount: 1 })),
    completedTasks: Array.from({ length: 360 }, (_, i) => ({ id: `done-${i}`, name: `Feita ${i} com nome`, category: 'Study', effort: 2, completedAt: day(i % 90) })),
    activityLog: days(90).flatMap(d => [{ id: 'habit-1', day: d }, { id: 'habit-2', day: d }, { id: 'habit-3', day: d }]),
    habitRhythms: rhythms,
    moodLog: days(90).map(d => ({ date: d, mood: 3 })),
    rest: { window: { start: '23:00', end: '07:00' }, nights: days(90).map(d => ({ date: d, within: true })), dreams: Array.from({ length: 30 }, (_, i) => `dream-${i}`) },
    nightmares: { fought: days(60) },
    playLog: days(90),
    unlockedEvolutions: ['rookie', 'champion-harmony', 'ultimate-harmony', 'mega-harmony'],
    equippedDecor: { rug: 'furn-rug', 'floor-left': 'furn-plant', trophy: 'furn-trophy', 'floor-right': 'furn-picture', wall: 'furn-poster' },
    ownedItems: Array.from({ length: 53 }, (_, i) => `item-${i}`),
    foodInventory: { chip_power: 2, chip_harmony: 1, heart: 3 },
    careCaps: { feedTimes: Array.from({ length: 6 }, (_, i) => 1_780_000_000_000 + i * 600_000), rubHeal: { day: day(89), healed: 1 } },
    spriteLibrary: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`form-${i}`, { url: `https://cdn.example.com/sprites/${'a'.repeat(32)}-${i}.png`, attempts: 1, at: day(i) }])),
    lastDayReport: { day: day(89), wasPerfect: true, heartsLost: 0, welcomeBack: false, daysAway: 0 },
    bondRewardsClaimed: Array.from({ length: 12 }, (_, i) => `bond-${i + 2}`),
    playerDayTz: 'America/Sao_Paulo', lastResetDate: day(89), lastCheckInDate: day(89),
  };
}

describe('tamanho do save (WP0.7)', () => {
  it('um save sintético de 90 dias pesados cabe com folga no teto de 5 MB do servidor', () => {
    const bytes = Buffer.byteLength(JSON.stringify(synthetic90Days()), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`[WP0.7] save sintético de 90 dias: ${bytes} bytes (${(bytes / 1024).toFixed(1)} KB)`);
    const MAX_STATE_BYTES = 5 * 1024 * 1024;
    expect(bytes).toBeLessThan(MAX_STATE_BYTES / 10); // < 512 KB: margem de 10× sobre o teto
  });
});
