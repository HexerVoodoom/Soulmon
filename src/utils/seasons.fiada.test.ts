/**
 * WP4.16 — as estações passam a existir para o jogador.
 *
 * `seasons.ts` tinha 500 linhas, teste próprio, cabeçalho com as cinco regras
 * inegociáveis… e **nenhum consumidor**. `ensureSeasonProgress` e
 * `applySeasonMedal` nunca eram chamados por ninguém, `SEASON_PATHS` não
 * aparecia em tela nenhuma, e por isso a medalha da estação **não podia ser
 * ganha por ninguém desde que o arquivo foi escrito**. O jogador não sabia nem
 * que estação era.
 *
 * É o caso mais caro do padrão que a rodada 4 encontrou: quanto mais completo o
 * módulo, menos óbvio que ele está mudo — um arquivo com testes verdes parece
 * um arquivo que funciona.
 *
 * O que se trava aqui é a fiação na VIRADA (o dono do dia), e as duas
 * propriedades que a regra 1 do cabeçalho exige: nada expira, e a medalha, uma
 * vez ganha, é para sempre.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset } from './dailyReset';
import { currentSeason, seasonLabel, seasonProgress } from './seasons';

const NA_ESTACAO = new Date('2026-04-10T12:00:00');   // Estação do Broto
const OUTRA_ESTACAO = new Date('2026-07-10T12:00:00'); // Estação da Fogueira
const ENTRE = new Date('2026-02-28T12:00:00');         // entre-estações

const estado = (over: Record<string, unknown> = {}) => ({
  activities: [], tasks: [], healthPoints: 3, maxHealthPoints: 3, energyPoints: 10,
  perfectDays: 0, totalXP: 0, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'harmony' as const,
  maxActivityCap: 6, totalPerfectDays: 0, dungeonRunsCompleted: 0,
  lastResetDate: new Date('2026-04-09T12:00:00').toDateString(),
  lastDayReport: { date: new Date('2026-04-08T12:00:00').toDateString(), saveDay: 90 },
  ...over,
});

const virar = (prev: Record<string, unknown>, now: Date) =>
  computeDailyReset(prev as never, { now } as never) as unknown as {
    season?: { seasonId: string; snapshot: { totalPerfectDays: number }; medalEarned: boolean; earnedMedals: string[] };
  };

describe('as estações ficam fiadas na virada (WP4.16)', () => {
  it('a primeira virada dentro de uma estação tira a foto dos contadores', () => {
    const s = virar(estado({ totalPerfectDays: 12, dungeonRunsCompleted: 3 }), NA_ESTACAO);
    expect(s.season?.seasonId).toBe(currentSeason(NA_ESTACAO)?.id);
    // A foto é dos contadores DEPOIS desta virada — senão a medalha chega
    // sempre um dia tarde.
    expect(s.season?.snapshot.totalPerfectDays).toBe(12);
  });

  it('entrar em estação nova tira foto nova e PRESERVA as medalhas antigas', () => {
    const comMedalha = estado({
      totalPerfectDays: 40,
      season: {
        seasonId: 'season-sprout',
        snapshot: { totalPerfectDays: 10, dungeonRunsCompleted: 0 },
        medalEarned: true,
        earnedMedals: ['medal-season-sprout'],
      },
    });
    const s = virar(comMedalha, OUTRA_ESTACAO);
    expect(s.season?.seasonId).toBe('season-ember');
    expect(s.season?.medalEarned, 'a medalha da estação nova ainda não foi ganha').toBe(false);
    expect(s.season?.earnedMedals, 'NADA EXPIRA — a medalha antiga é para sempre')
      .toContain('medal-season-sprout');
  });

  it('entre-estações não zera nem fecha nada', () => {
    const antes = estado({
      season: {
        seasonId: 'season-starlit',
        snapshot: { totalPerfectDays: 5, dungeonRunsCompleted: 0 },
        medalEarned: true,
        earnedMedals: ['medal-season-starlit'],
      },
      lastResetDate: new Date('2026-02-27T12:00:00').toDateString(),
    });
    const s = virar(antes, ENTRE);
    expect(s.season?.seasonId).toBe('season-starlit');
    expect(s.season?.earnedMedals).toContain('medal-season-starlit');
  });

  it('a medalha é ganha na própria virada em que o caminho fecha', () => {
    // 20 dias perfeitos DENTRO da estação: a foto começa em 5, e a virada que
    // leva o contador a 25 é a que fecha o caminho.
    const quase = estado({
      totalPerfectDays: 24,
      activities: [], tasks: [],
      season: {
        seasonId: 'season-sprout',
        snapshot: { totalPerfectDays: 5, dungeonRunsCompleted: 0 },
        medalEarned: false,
        earnedMedals: [],
      },
    });
    const s = virar(quase, NA_ESTACAO);
    // 24 → nenhum dia perfeito nesta virada (nada cadastrado), então 24 − 5 = 19.
    expect(s.season?.medalEarned).toBe(false);

    const fechando = { ...quase, totalPerfectDays: 25 };
    const t = virar(fechando, NA_ESTACAO);
    expect(t.season?.medalEarned, '25 − 5 = 20, o alvo do caminho de dias perfeitos').toBe(true);
    expect(t.season?.earnedMedals).toContain('medal-season-sprout');
  });

  it('save antigo sem `season` não quebra: a virada cria', () => {
    const s = virar(estado(), NA_ESTACAO);
    expect(s.season).toBeTruthy();
  });

  it('a copy de entre-estações continua dizendo que nada some', () => {
    // A ressalva #15/E4: a virada de estação não pode ler como prazo.
    expect(seasonLabel(seasonProgress(ENTRE), 'pt-BR')).toMatch(/nada some/i);
    expect(seasonLabel(seasonProgress(NA_ESTACAO), 'pt-BR'))
      .toMatch(/continuam aparecendo depois/i);
    for (const idioma of ['pt-BR', 'en-US'] as const) {
      const texto = seasonLabel(seasonProgress(NA_ESTACAO), idioma);
      expect(texto, 'a estação virou contagem regressiva').not.toMatch(/faltam|last chance|ends in|termina/i);
    }
  });
});
