import { describe, it, expect } from 'vitest';
import {
  SEASONS,
  SEASON_PATHS,
  currentSeason,
  seasonProgress,
  seasonOfDream,
  isSeasonalDream,
  startSeasonProgress,
  ensureSeasonProgress,
  seasonMedalStatus,
  applySeasonMedal,
  seasonLabel,
  type SeasonCounters,
  type SeasonProgressState,
} from './seasons';
import {
  DREAM_CATALOG,
  DREAMS_BY_RARITY,
  SEASON_DREAM_WEIGHT,
  createRestState,
  rollDream,
  collectDream,
  type RestState,
  type RestNight,
} from './restWindow';

// Datas âncora (local, meio-dia para não flertar com fuso).
const IN_SPROUT = new Date(2026, 3, 10, 12); // 10/abr
const IN_EMBER = new Date(2026, 6, 10, 12); // 10/jul
const IN_TIDE = new Date(2026, 9, 10, 12); // 10/out
const IN_STARLIT = new Date(2027, 0, 10, 12); // 10/jan (estação que cruza o ano)
const BETWEEN = new Date(2026, 1, 28, 12); // 28/fev — entre-estações

describe('tabela de estações', () => {
  it('são 4, com ids/medalhas únicos e textos nos dois idiomas', () => {
    expect(SEASONS).toHaveLength(4);
    expect(new Set(SEASONS.map((s) => s.id)).size).toBe(4);
    expect(new Set(SEASONS.map((s) => s.medalId)).size).toBe(4);
    for (const s of SEASONS) {
      expect(s.namePt).not.toBe(s.nameEn);
      expect(s.themePt.trim().length).toBeGreaterThan(0);
      expect(s.themeEn.trim().length).toBeGreaterThan(0);
      expect(s.dreamIds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('cada dreamId da tabela existe no catálogo e aponta de volta para a estação', () => {
    for (const s of SEASONS) {
      for (const id of s.dreamIds) {
        const dream = DREAM_CATALOG.find((d) => d.id === id);
        expect(dream, `sonho ${id} não existe no DREAM_CATALOG`).toBeTruthy();
        expect(dream!.season).toBe(s.id);
        expect(seasonOfDream(id)?.id).toBe(s.id);
      }
    }
  });

  it('nenhum sonho declara uma estação que não existe', () => {
    const ids = new Set(SEASONS.map((s) => s.id));
    for (const d of DREAM_CATALOG) {
      if (d.season) expect(ids.has(d.season)).toBe(true);
    }
  });
});

describe('currentSeason / seasonProgress', () => {
  it('acha a estação de cada trimestre', () => {
    expect(currentSeason(IN_SPROUT)?.id).toBe('season-sprout');
    expect(currentSeason(IN_EMBER)?.id).toBe('season-ember');
    expect(currentSeason(IN_TIDE)?.id).toBe('season-tide');
    expect(currentSeason(IN_STARLIT)?.id).toBe('season-starlit');
  });

  it('a virada de estação acontece no dia certo (último dia ainda é a antiga)', () => {
    expect(currentSeason(new Date(2026, 4, 31, 23))?.id).toBe('season-sprout'); // 31/mai
    expect(currentSeason(new Date(2026, 5, 1, 0, 1))?.id).toBe('season-ember'); // 01/jun
    expect(currentSeason(new Date(2026, 7, 31, 12))?.id).toBe('season-ember'); // 31/ago
    expect(currentSeason(new Date(2026, 8, 1, 12))?.id).toBe('season-tide'); // 01/set
    expect(currentSeason(new Date(2026, 10, 30, 12))?.id).toBe('season-tide'); // 30/nov
    expect(currentSeason(new Date(2026, 11, 1, 12))?.id).toBe('season-starlit'); // 01/dez
  });

  it('devolve null fora de qualquer janela (entre-estações)', () => {
    expect(currentSeason(BETWEEN)).toBeNull();
    expect(seasonProgress(BETWEEN)).toBeNull();
    expect(seasonLabel(null, 'pt-BR')).toMatch(/nada some/i);
  });

  /**
   * WP4.4 do PLANO-MELHORIAS chegou com a premissa "`SEASONS` expira em
   * 2027-02-27". Era falsa — a comparação é por mês/dia desde o início — e o
   * pacote foi RECUSADO por isso. Este teste existe para a premissa não voltar:
   * varre TODOS os dias de 2026 a 2036 e exige que cada um devolva a mesma
   * estação do mesmo mês/dia da primeira edição. Os únicos `null` são os de
   * 28/29 de fevereiro, a folga de entre-estações — deliberada, documentada no
   * cabeçalho de `seasons.ts` e travada pelo teste acima.
   */
  it('de 2026 a 2036, todo dia devolve estação — exceto a folga de 28/29 de fevereiro', () => {
    for (let y = 2026; y <= 2036; y++) {
      for (let d = new Date(y, 0, 1, 12); d.getFullYear() === y; d = new Date(y, d.getMonth(), d.getDate() + 1, 12)) {
        const gap = d.getMonth() === 1 && d.getDate() >= 28;
        const here = currentSeason(d);
        const firstEdition = currentSeason(new Date(2026, d.getMonth(), Math.min(d.getDate(), 28), 12));
        if (gap) expect(here, d.toDateString()).toBeNull();
        else {
          expect(here, d.toDateString()).not.toBeNull();
          expect(here?.id, d.toDateString()).toBe(firstEdition?.id);
        }
      }
    }
  });

  it('a tabela é CÍCLICA: o ano guardado é só a primeira edição', () => {
    // Mesmo mês/dia, anos muito depois do escrito na tabela.
    expect(currentSeason(new Date(2031, 3, 10, 12))?.id).toBe('season-sprout');
    expect(currentSeason(new Date(2040, 6, 10, 12))?.id).toBe('season-ember');
  });

  it('seasonProgress resolve o ano concreto e a estação que cruza a virada', () => {
    const p = seasonProgress(IN_STARLIT)!;
    expect(p.season.id).toBe('season-starlit');
    expect(p.start.getFullYear()).toBe(2026);
    expect(p.start.getMonth()).toBe(11); // dezembro
    expect(p.end.getFullYear()).toBe(2027);
    expect(p.dayIndex).toBe(41); // 31 de dez + 10 de jan
    expect(p.totalDays).toBeGreaterThan(80);
    expect(p.daysLeft).toBe(p.totalDays - p.dayIndex + 1);
    expect(p.ratio).toBeGreaterThan(0);
    expect(p.ratio).toBeLessThanOrEqual(1);
  });

  it('as janelas têm ~13 semanas — DIAS, nunca horas', () => {
    for (const [when, id] of [
      [IN_SPROUT, 'season-sprout'],
      [IN_EMBER, 'season-ember'],
      [IN_TIDE, 'season-tide'],
      [IN_STARLIT, 'season-starlit'],
    ] as const) {
      const p = seasonProgress(when)!;
      expect(p.season.id).toBe(id);
      expect(p.totalDays).toBeGreaterThanOrEqual(80);
      expect(p.dayIndex).toBeGreaterThanOrEqual(1);
      expect(p.dayIndex).toBeLessThanOrEqual(p.totalDays);
    }
  });

  it('primeiro e último dia da estação são dias válidos dela', () => {
    const first = seasonProgress(new Date(2026, 2, 1, 12))!;
    expect(first.dayIndex).toBe(1);
    const last = seasonProgress(new Date(2026, 4, 31, 12))!;
    expect(last.dayIndex).toBe(last.totalDays);
    expect(last.daysLeft).toBe(1);
  });
});

describe('isSeasonalDream — destaque, NUNCA permissão', () => {
  it('só é sazonal dentro da própria estação', () => {
    expect(isSeasonalDream('dream-dew-sprout', IN_SPROUT)).toBe(true);
    expect(isSeasonalDream('dream-dew-sprout', IN_EMBER)).toBe(false);
    expect(isSeasonalDream('dream-dew-sprout', BETWEEN)).toBe(false);
  });

  it('sonho sem estação nunca é sazonal', () => {
    expect(isSeasonalDream('dream-on-the-moon', IN_SPROUT)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// O TESTE QUE SEPARA ESTAÇÃO DE BATTLE PASS
// ---------------------------------------------------------------------------

describe('NADA EXPIRA — sonho sazonal continua obtenível fora da estação', () => {
  const base = createRestState();

  it('todo sonho sazonal está no pool da sua raridade o ano inteiro', () => {
    for (const s of SEASONS) {
      for (const id of s.dreamIds) {
        const d = DREAM_CATALOG.find((x) => x.id === id)!;
        expect(DREAMS_BY_RARITY[d.rarity].some((x) => x.id === id)).toBe(true);
      }
    }
  });

  it('um sonho de OUTRA estação é sorteável hoje (e em entre-estações)', () => {
    // Sorteia com muitas seeds fora da estação do sonho e exige que ele saia.
    const target = 'dream-firefly-jar'; // legendary, estação da Fogueira
    for (const when of [IN_SPROUT, IN_TIDE, BETWEEN]) {
      const saiu = Array.from({ length: 200 }, (_, i) =>
        rollDream(base, 'legendary', i, when),
      ).includes(target);
      expect(saiu, `${target} deveria ser sorteável em ${when.toDateString()}`).toBe(true);
    }
  });

  it('é possível FECHAR o Dex inteiro fora de qualquer estação', () => {
    let state: RestState = createRestState();
    for (let i = 0; i < 500 && state.dreams.length < DREAM_CATALOG.length; i++) {
      for (const rarity of ['common', 'rare', 'legendary'] as const) {
        state = collectDream(state, rollDream(state, rarity, i, BETWEEN));
      }
    }
    expect(state.dreams.length).toBe(DREAM_CATALOG.length);
  });

  it('o catálogo nunca encolhe por data: mesmo total em qualquer dia do ano', () => {
    // Não existe filtro por estação em lugar nenhum — o catálogo é uma
    // constante, e isto é a afirmação literal disso.
    expect(DREAM_CATALOG.filter((d) => d.season).length).toBeGreaterThanOrEqual(8);
    expect(DREAM_CATALOG.filter((d) => d.season).length).toBeLessThanOrEqual(12);
  });
});

describe('peso extra dentro da estação', () => {
  const base = createRestState();

  function freq(target: string, rarity: 'common' | 'rare' | 'legendary', when: Date): number {
    let n = 0;
    for (let seed = 0; seed < 3000; seed++) {
      if (rollDream(base, rarity, seed, when) === target) n++;
    }
    return n;
  }

  it('o sonho da estação sai mais vezes DENTRO dela do que fora', () => {
    const dentro = freq('dream-dew-sprout', 'common', IN_SPROUT);
    const fora = freq('dream-dew-sprout', 'common', IN_EMBER);
    expect(dentro).toBeGreaterThan(fora);
    // O peso é finito e declarado: mais fácil, não exclusivo.
    expect(fora).toBeGreaterThan(0);
    expect(dentro / Math.max(1, fora)).toBeLessThanOrEqual(SEASON_DREAM_WEIGHT + 1);
  });

  it('em entre-estações ninguém ganha peso (todos com peso 1)', () => {
    const sazonal = freq('dream-dew-sprout', 'common', BETWEEN);
    const comum = freq('dream-pillow-cloud', 'common', BETWEEN);
    expect(Math.abs(sazonal - comum)).toBeLessThan(comum * 0.6 + 30);
    expect(sazonal).toBeGreaterThan(0);
  });
});

describe('determinismo de rollDream preservado', () => {
  const base = createRestState();

  it('mesma seed + mesma data = mesmo id, sempre', () => {
    for (const when of [IN_SPROUT, IN_EMBER, BETWEEN]) {
      for (const seed of [0, 1, 42, 1337, 987654]) {
        const a = rollDream(base, 'rare', seed, when);
        expect(rollDream(base, 'rare', seed, when)).toBe(a);
        expect(rollDream(base, 'rare', seed, when)).toBe(a);
      }
    }
  });

  it('devolve sempre um id da raridade pedida, com ou sem estação', () => {
    for (const when of [IN_SPROUT, IN_STARLIT, BETWEEN]) {
      for (const rarity of ['common', 'rare', 'legendary'] as const) {
        for (let seed = 0; seed < 50; seed++) {
          const id = rollDream(base, rarity, seed, when);
          expect(DREAMS_BY_RARITY[rarity].some((d) => d.id === id)).toBe(true);
        }
      }
    }
  });

  it('continua preferindo sonho ainda não coletado', () => {
    const first = rollDream(base, 'legendary', 7, IN_SPROUT);
    const after = rollDream(collectDream(base, first), 'legendary', 7, IN_SPROUT);
    expect(after).not.toBe(first);
  });
});

// ---------------------------------------------------------------------------
// Medalha de estação
// ---------------------------------------------------------------------------

const ZERO: SeasonCounters = { totalPerfectDays: 0, dungeonRunsCompleted: 0 };

function nights(count: number, from: Date, onTime = true): RestNight[] {
  const out: RestNight[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getTime());
    d.setDate(d.getDate() + i);
    out.push({ date: d.toDateString(), onTime });
  }
  return out;
}

function restWith(ns: RestNight[]): RestState {
  return { ...createRestState(), nights: ns };
}

describe('medalha de estação — três caminhos, cada um bastando sozinho', () => {
  it('são exatamente três e têm rótulo nos dois idiomas', () => {
    expect(SEASON_PATHS).toHaveLength(3);
    expect(new Set(SEASON_PATHS.map((p) => p.id)).size).toBe(3);
    for (const p of SEASON_PATHS) {
      expect(p.target).toBeGreaterThan(0);
      expect(p.labelPt).not.toBe(p.labelEn);
    }
  });

  const started = (counters: SeasonCounters = ZERO) =>
    startSeasonProgress(SEASONS[0], counters);

  it('caminho 1 sozinho: dias perfeitos', () => {
    const st = started();
    const counters = { totalPerfectDays: 20, dungeonRunsCompleted: 0 };
    const s = seasonMedalStatus(st, counters, createRestState(), IN_SPROUT);
    expect(s.earned).toBe(true);
    expect(s.paths.filter((p) => p.done).map((p) => p.id)).toEqual(['perfect-days']);
  });

  it('caminho 2 sozinho: runs de masmorra', () => {
    const st = started();
    const counters = { totalPerfectDays: 0, dungeonRunsCompleted: 5 };
    const s = seasonMedalStatus(st, counters, createRestState(), IN_SPROUT);
    expect(s.earned).toBe(true);
    expect(s.paths.filter((p) => p.done).map((p) => p.id)).toEqual(['dungeon-runs']);
  });

  it('caminho 3 sozinho: noites dentro da janela', () => {
    const st = started();
    const rest = restWith(nights(15, new Date(2026, 2, 5)));
    const s = seasonMedalStatus(st, ZERO, rest, IN_SPROUT);
    expect(s.earned).toBe(true);
    expect(s.paths.filter((p) => p.done).map((p) => p.id)).toEqual(['rest-nights']);
  });

  it('nenhum caminho fechado = sem medalha (mas nunca negativo)', () => {
    const st = started();
    const s = seasonMedalStatus(st, { totalPerfectDays: 3, dungeonRunsCompleted: 1 }, createRestState(), IN_SPROUT);
    expect(s.earned).toBe(false);
    for (const p of s.paths) expect(p.current).toBeGreaterThanOrEqual(0);
  });

  it('noite FORA da janela de descanso não conta no caminho 3', () => {
    const st = started();
    const rest = restWith(nights(20, new Date(2026, 2, 5), false));
    const s = seasonMedalStatus(st, ZERO, rest, IN_SPROUT);
    expect(s.paths.find((p) => p.id === 'rest-nights')!.current).toBe(0);
  });
});

describe('snapshot-diff não conta progresso anterior à estação', () => {
  it('quem chega na estação com 999 dias perfeitos começa em ZERO', () => {
    const veterano: SeasonCounters = { totalPerfectDays: 999, dungeonRunsCompleted: 400 };
    const st = startSeasonProgress(SEASONS[0], veterano);
    const s = seasonMedalStatus(st, veterano, createRestState(), IN_SPROUT);
    expect(s.paths.find((p) => p.id === 'perfect-days')!.current).toBe(0);
    expect(s.paths.find((p) => p.id === 'dungeon-runs')!.current).toBe(0);
    expect(s.earned).toBe(false);
  });

  it('só o ganho DEPOIS da foto conta', () => {
    const st = startSeasonProgress(SEASONS[0], { totalPerfectDays: 999, dungeonRunsCompleted: 400 });
    const depois = { totalPerfectDays: 999 + 20, dungeonRunsCompleted: 400 };
    expect(seasonMedalStatus(st, depois, createRestState(), IN_SPROUT).earned).toBe(true);
    const quase = { totalPerfectDays: 999 + 19, dungeonRunsCompleted: 400 };
    expect(seasonMedalStatus(st, quase, createRestState(), IN_SPROUT).earned).toBe(false);
  });

  it('noite ANTERIOR ao início da estação não conta', () => {
    const st = startSeasonProgress(SEASONS[0], ZERO);
    const antes = restWith(nights(20, new Date(2026, 0, 5))); // janeiro
    expect(seasonMedalStatus(st, ZERO, antes, IN_SPROUT).paths
      .find((p) => p.id === 'rest-nights')!.current).toBe(0);
  });

  it('contador que ANDOU PARA TRÁS nunca vira progresso negativo', () => {
    const st = startSeasonProgress(SEASONS[0], { totalPerfectDays: 50, dungeonRunsCompleted: 10 });
    const s = seasonMedalStatus(st, { totalPerfectDays: 2, dungeonRunsCompleted: 0 }, createRestState(), IN_SPROUT);
    for (const p of s.paths) expect(p.current).toBeGreaterThanOrEqual(0);
  });
});

describe('ensureSeasonProgress / applySeasonMedal — nada expira', () => {
  const counters: SeasonCounters = { totalPerfectDays: 30, dungeonRunsCompleted: 9 };

  it('cria a foto na primeira vez e é estável na mesma estação', () => {
    const a = ensureSeasonProgress(undefined, counters, IN_SPROUT)!;
    expect(a.seasonId).toBe('season-sprout');
    expect(a.snapshot).toEqual(counters);
    expect(a.medalEarned).toBe(false);
    const b = ensureSeasonProgress(a, { totalPerfectDays: 99, dungeonRunsCompleted: 99 }, IN_SPROUT);
    expect(b).toBe(a); // identidade — nada de objeto novo por render
  });

  it('vira a estação tirando foto nova e PRESERVANDO as medalhas já ganhas', () => {
    let st = ensureSeasonProgress(undefined, counters, IN_SPROUT)!;
    st = applySeasonMedal(st, { totalPerfectDays: 30 + 20, dungeonRunsCompleted: 9 }, createRestState(), IN_SPROUT)!;
    expect(st.medalEarned).toBe(true);
    expect(st.earnedMedals).toContain('medal-season-sprout');

    const next = ensureSeasonProgress(st, { totalPerfectDays: 80, dungeonRunsCompleted: 20 }, IN_EMBER)!;
    expect(next.seasonId).toBe('season-ember');
    expect(next.snapshot.totalPerfectDays).toBe(80);
    expect(next.medalEarned).toBe(false);
    // A medalha do trimestre passado continua lá — é isto que não é battle pass.
    expect(next.earnedMedals).toContain('medal-season-sprout');
  });

  it('em entre-estações não zera nem perde nada', () => {
    const st: SeasonProgressState = {
      seasonId: 'season-sprout',
      snapshot: ZERO,
      medalEarned: true,
      earnedMedals: ['medal-season-sprout'],
    };
    expect(ensureSeasonProgress(st, counters, BETWEEN)).toBe(st);
    expect(applySeasonMedal(st, counters, createRestState(), BETWEEN)).toBe(st);
  });

  it('applySeasonMedal é idempotente e monotônico', () => {
    const st = startSeasonProgress(SEASONS[0], ZERO);
    const won = { totalPerfectDays: 20, dungeonRunsCompleted: 0 };
    const once = applySeasonMedal(st, won, createRestState(), IN_SPROUT)!;
    const twice = applySeasonMedal(once, won, createRestState(), IN_SPROUT)!;
    expect(twice).toBe(once);
    expect(twice.earnedMedals).toEqual(['medal-season-sprout']);
    // Perder o progresso não tira a medalha.
    expect(seasonMedalStatus(once, ZERO, createRestState(), IN_SPROUT).earned).toBe(true);
  });

  it('seasonLabel fala os dois idiomas e nunca ameaça com prazo', () => {
    const win = seasonProgress(IN_SPROUT);
    const pt = seasonLabel(win, 'pt-BR');
    const en = seasonLabel(win, 'en-US');
    expect(pt).not.toBe(en);
    expect(pt).toMatch(/continuam aparecendo depois/i);
    expect(en).toMatch(/keep showing up later/i);
    for (const t of [pt, en]) {
      expect(t).not.toMatch(/última chance|last chance|expira|expires|acaba em/i);
    }
  });
});
