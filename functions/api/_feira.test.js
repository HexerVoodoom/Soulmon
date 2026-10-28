import { describe, it, expect } from 'vitest';
import {
  FEIRA_CHEFE_DESDE, feiraLigada, bossHpFor, diasAlvo, danoBaseFor, kindDoMisterio, nivelDoMisterio, bossDoMisterio,
  BOSS_ROSTER, ARAUTO, ATAQUE_TETO, TRAIL_PCT, pctDoChefe, simularAtaque, FIGHT_SECONDS, LOG_MAX,
  TRAIL_GAMES, instanciaDaTrilha, solucaoDaTrilha, conferirTrilha, jogoDaTrilha, hash32, recompensaDoChefe,
} from './_feira.js';
import { duelSide } from './_duel.js';

/**
 * A Feira do Chefe: as funções PURAS (plano `PLANO-FEIRA-CHEFE.md` §2, com a correção de calibração documentada em `diasAlvo`).
 */
describe('liga e desliga', () => {
  it('a constante está no futuro: nasce DESLIGADA', () => {
    expect(FEIRA_CHEFE_DESDE > new Date().toISOString().slice(0, 10)).toBe(true);
    expect(feiraLigada({})).toBe(false);
    expect(feiraLigada(undefined)).toBe(false);
  });
  it('a variável de ambiente (data válida) liga; lixo é ignorado', () => {
    expect(feiraLigada({ FEIRA_CHEFE_DESDE: '2000-01-01' })).toBe(true);
    expect(feiraLigada({ FEIRA_CHEFE_DESDE: '2099-01-01' })).toBe(false);
    expect(feiraLigada({ FEIRA_CHEFE_DESDE: 'ontem' })).toBe(false);
    expect(feiraLigada({ FEIRA_CHEFE_DESDE: '2026-11-10' }, new Date('2026-11-09T23:00:00Z'))).toBe(false);
    expect(feiraLigada({ FEIRA_CHEFE_DESDE: '2026-11-10' }, new Date('2026-11-10T00:00:00Z'))).toBe(true);
  });
});

describe('calibração (tabela §2, corrigida)', () => {
  const NIVEIS = [1, 5, 10, 20];
  const TAMANHOS = [3, 4, 8, 12];
  it('SNAPSHOT: HP do chefe por nível x tamanho do clã', () => {
    const tabela = Object.fromEntries(NIVEIS.map(L => [L, TAMANHOS.map(N => bossHpFor(L, N))]));
    expect(tabela).toEqual({
      1: [450, 540, 1080, 1620],
      5: [680, 900, 1800, 2700],
      10: [1010, 1350, 2700, 4050],
      20: [1690, 2250, 4500, 6750],
    });
  });
  it('dias alvo: 1,5 no nível 1, +0,25 por nível, teto 7', () => {
    expect([1, 5, 10, 20].map(diasAlvo)).toEqual([1.5, 2.5, 3.75, 6.25]);
    expect(diasAlvo(999)).toBeLessThanOrEqual(7);
    expect(diasAlvo(0)).toBe(1.5);
  });
  it('HP >= 3 x teto do ataque para TODO nível e tamanho (um golpe nunca passa de 1/3 do chefe)', () => {
    for (let L = 1; L <= 25; L++) for (let N = 0; N <= 12; N++) expect(bossHpFor(L, N), `L${L} N${N}`).toBeGreaterThanOrEqual(3 * ATAQUE_TETO);
  });
  it('o HP nunca diminui com o nível nem com o tamanho do clã', () => {
    for (let N = 3; N <= 12; N++) for (let L = 1; L < 20; L++) expect(bossHpFor(L + 1, N)).toBeGreaterThanOrEqual(bossHpFor(L, N));
    for (let L = 1; L <= 20; L++) for (let N = 3; N < 12; N++) expect(bossHpFor(L, N + 1)).toBeGreaterThanOrEqual(bossHpFor(L, N));
  });
  it('clã de 1–2 conta como 3 (piso)', () => {
    expect(bossHpFor(1, 1)).toBe(bossHpFor(1, 3));
    expect(bossHpFor(7, 2)).toBe(bossHpFor(7, 3));
  });
  it('METAS DO DONO (Monte Carlo): clã de 4 ativos (90% de presença) derruba o nível 1 em ~2 dias para os estágios 1–3', () => {
    let s = 7;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const dias = (p) => {
      let d = 0, total = 0;
      const hp = bossHpFor(1, 4);
      while (total < hp && d < 30) { d++; for (let i = 0; i < 4; i++) if (rnd() < 0.9) total += Math.min(ATAQUE_TETO, Math.round(danoBaseFor(p) * (0.9 + 0.2 * rnd()))); }
      return d;
    };
    for (const p of [1, 2, 3]) {
      const r = Array.from({ length: 2000 }, () => dias(p));
      const media = r.reduce((a, b) => a + b, 0) / r.length;
      expect(media, `estágio ${p}`).toBeGreaterThan(1.9);
      expect(media, `estágio ${p}`).toBeLessThan(2.7);
      // Nunca em 1 dia: 4 golpes de no máximo 150 < 540.
      expect(Math.min(...r)).toBeGreaterThanOrEqual(2);
    }
  });
  it('dano base: 70 + 10p (p=3 -> 100), p clampado em 1..5', () => {
    expect([1, 2, 3, 4, 5].map(danoBaseFor)).toEqual([80, 90, 100, 110, 120]);
    expect(danoBaseFor(0)).toBe(80);
    expect(danoBaseFor(99)).toBe(120);
    expect(danoBaseFor('x')).toBe(80);
  });
  it('% do chefe: arredonda para cima (vivo nunca mostra 0), 0 só quando morto', () => {
    expect(pctDoChefe(540, 0)).toBe(100);
    expect(pctDoChefe(540, 539)).toBe(1);
    expect(pctDoChefe(540, 540)).toBe(0);
    expect(pctDoChefe(540, 99999)).toBe(0);
    expect(pctDoChefe(540, 270)).toBe(50);
    expect(pctDoChefe(0, 5)).toBe(100);
  });
});

describe('o mistério (tipo, nível, chefe)', () => {
  it('o mistério 0 é SEMPRE chefe', () => {
    for (let i = 0; i < 300; i++) expect(kindDoMisterio(`gid${i}`, 0)).toBe('boss');
  });
  it('~30% dos demais são Trilha, determinístico em (gid, k)', () => {
    let trilhas = 0, n = 0;
    for (let g = 0; g < 100; g++) for (let k = 1; k <= 30; k++) { n++; if (kindDoMisterio(`g${g}`, k) === 'trail') trilhas++; }
    expect(trilhas / n).toBeGreaterThan((TRAIL_PCT - 4) / 100);
    expect(trilhas / n).toBeLessThan((TRAIL_PCT + 4) / 100);
    expect(kindDoMisterio('abc', 5)).toBe(kindDoMisterio('abc', 5));
  });
  it('nível = 1 + mistérios concluídos, teto 20', () => {
    expect([0, 1, 18, 19, 20, 500].map(nivelDoMisterio)).toEqual([1, 2, 19, 20, 20, 20]);
    expect(nivelDoMisterio(-3)).toBe(1);
    expect(nivelDoMisterio('lixo')).toBe(1);
  });
  it('o Arauto do Fim NUNCA antes do nível 15; no teto (20) é sempre ele; entre 15 e 19 aparece às vezes', () => {
    for (let g = 0; g < 200; g++) for (let k = 0; k < 14; k++) expect(bossDoMisterio(`g${g}`, k).id, `k${k}`).not.toBe(ARAUTO.id);
    for (let g = 0; g < 200; g++) for (const k of [19, 20, 40]) expect(bossDoMisterio(`g${g}`, k).id).toBe(ARAUTO.id);
    let vistos = 0;
    for (let g = 0; g < 400; g++) if (bossDoMisterio(`g${g}`, 16).id === ARAUTO.id) vistos++;
    expect(vistos).toBeGreaterThan(40);
    expect(vistos).toBeLessThan(160);
  });
  it('o sorteio comum cobre os 23 chefes e é determinístico', () => {
    const vistos = new Set();
    for (let g = 0; g < 600; g++) vistos.add(bossDoMisterio(`g${g}`, 3).id);
    expect(vistos.size).toBe(BOSS_ROSTER.length);
    expect(bossDoMisterio('x', 3)).toBe(bossDoMisterio('x', 3));
    expect(BOSS_ROSTER).toHaveLength(23);
  });
});

describe('o ataque (re-simulação com semente do servidor)', () => {
  const ficha = (extra = {}, stage = 'champion') => duelSide({ evolutionStage: stage, perfectDays: 12, totalXP: 3000, ...extra }, { maxLevel: 999 });
  it('determinístico na semente; semente diferente, registro diferente; sempre dentro de [1, teto]', () => {
    const a = simularAtaque(ficha(), 2, 123456);
    const b = simularAtaque(ficha(), 2, 123456);
    expect(a).toEqual(b);
    expect(simularAtaque(ficha(), 2, 654321).log).not.toEqual(a.log);
    for (let s = 1; s <= 40; s++) {
      for (const [extra, p] of [[{}, 1], [{ powerPoints: 500 }, 5], [{ harmonyPoints: 500 }, 3], [{ benevolencePoints: 500 }, 4]]) {
        const r = simularAtaque(ficha(extra), p, (s * 2654435761) >>> 0);
        expect(r.dmg).toBeGreaterThanOrEqual(1);
        expect(r.dmg).toBeLessThanOrEqual(ATAQUE_TETO);
        expect(r.desempenho).toBeGreaterThanOrEqual(0.7);
        expect(r.desempenho).toBeLessThanOrEqual(1.5);
      }
    }
  });
  it('o dano médio por estágio acompanha 70 + 10p (desempenho médio perto de 1)', () => {
    for (const p of [1, 3, 5]) {
      let soma = 0;
      const n = 60;
      for (let s = 0; s < n; s++) soma += simularAtaque(ficha({}, 'champion'), p, ((s + 1) * 40503) >>> 0).dmg;
      expect(soma / n).toBeGreaterThan(danoBaseFor(p) * 0.9);
      expect(soma / n).toBeLessThan(danoBaseFor(p) * 1.15);
    }
  });
  it('o registro para o replay é curto, ordenado e só tem {k,t,s,f} (nada de HP)', () => {
    const r = simularAtaque(ficha(), 3, 99);
    expect(r.log.length).toBeGreaterThan(5);
    expect(r.log.length).toBeLessThanOrEqual(LOG_MAX);
    let ult = 0;
    for (const e of r.log) {
      expect(Object.keys(e).sort()).toEqual(['f', 'k', 's', 't']);
      expect(['a', 'c', 't']).toContain(e.k);
      expect([0, 1]).toContain(e.s);
      expect(e.t).toBeLessThanOrEqual(FIGHT_SECONDS);
      expect(e.t).toBeGreaterThanOrEqual(ult);
      ult = e.t;
    }
  });
});

describe('recompensa do abate (plano §5): cosmético, Emblemas, Bits, seiva; essências só o gancho', () => {
  it('escala com o nível, tem teto e o campo de essências é SEMPRE vazio', () => {
    const r1 = recompensaDoChefe(1, 'cinderhorn', 'fervor', true);
    expect(r1).toEqual({ emblems: 2, bits: 40, sap: 10, trophyId: 'trophy-boss-cinderhorn', essences: [], element: 'fervor' });
    const r20 = recompensaDoChefe(20, 'arauto-do-fim', 'juizo_final', false);
    expect(r20).toEqual({ emblems: 10, bits: 150, sap: 200, trophyId: null, essences: [], element: 'juizo_final' });
    expect(recompensaDoChefe(999, 'x', null, false).emblems).toBe(10);
    expect(Object.keys(r1).sort()).toEqual(['bits', 'element', 'emblems', 'essences', 'sap', 'trophyId']);
  });
});

describe('a Trilha: instâncias semeadas, conferidas por solução', () => {
  it('o jogo do dia é determinístico por (pessoa, dia, k) e sai da lista fechada', () => {
    expect(jogoDaTrilha('s', '2026-11-10', 1)).toBe(jogoDaTrilha('s', '2026-11-10', 1));
    const vistos = new Set();
    for (let i = 0; i < 200; i++) vistos.add(jogoDaTrilha(`s${i}`, '2026-11-10', 1));
    expect([...vistos].sort()).toEqual([...TRAIL_GAMES].sort());
  });
  it('a instância pública NUNCA traz a solução, e a mesma semente dá a mesma instância', () => {
    for (const g of TRAIL_GAMES) {
      const a = instanciaDaTrilha(g, 777);
      expect(JSON.stringify(a)).not.toMatch(/solution/);
      expect(a).toEqual(instanciaDaTrilha(g, 777));
    }
  });
  it('a solução gerada passa; lixo e vazio não passam', () => {
    for (const g of TRAIL_GAMES) {
      for (const seed of [1, 2, 3, 99, 4242]) {
        expect(conferirTrilha(g, seed, solucaoDaTrilha(g, seed)), `${g}/${seed}`).toBe(true);
        expect(conferirTrilha(g, seed, {}), g).toBe(false);
        expect(conferirTrilha(g, seed, null), g).toBe(false);
        expect(conferirTrilha(g, seed, { path: 'x', rects: 'x', cells: 'x', sides: 'x', score: 'x' }), g).toBe(false);
      }
    }
  });
  it('a solução de OUTRA semente não vale (a instância é regerada da semente guardada)', () => {
    for (const g of ['zip', 'patches', 'troca']) {
      let reprovadas = 0;
      for (let seed = 10; seed < 30; seed++) if (!conferirTrilha(g, seed, solucaoDaTrilha(g, seed + 1000))) reprovadas++;
      expect(reprovadas, g).toBeGreaterThan(15);
    }
  });
  it('troca: acertar menos que o alvo não cumpre; reflexo: score implausível ou abaixo do alvo não cumpre', () => {
    const s = solucaoDaTrilha('troca', 5).sides.slice();
    expect(conferirTrilha('troca', 5, { sides: s })).toBe(true);
    for (let i = 0; i < 7; i++) s[i] = s[i] === 'left' ? 'right' : 'left';
    expect(conferirTrilha('troca', 5, { sides: s })).toBe(false);
    expect(conferirTrilha('eco', 1, { score: 4 })).toBe(false);
    expect(conferirTrilha('eco', 1, { score: 5 })).toBe(true);
    expect(conferirTrilha('eco', 1, { score: 101 })).toBe(false); // scoreIsPlausible: o teto do eco é 100
    expect(conferirTrilha('eco', 1, { score: Number.NaN })).toBe(false);
  });
  it('picross: qualquer grade que bata as pistas vale; uma célula errada não', () => {
    const sol = solucaoDaTrilha('picross', 8).cells;
    expect(conferirTrilha('picross', 8, { cells: sol })).toBe(true);
    const errada = sol.map(r => r.slice());
    errada[0][0] = errada[0][0] ? 0 : 1;
    expect(conferirTrilha('picross', 8, { cells: errada })).toBe(false);
  });
  it('hash32 estável (FNV-1a)', () => {
    expect(hash32('')).toBe(0x811c9dc5);
    expect(hash32('a')).toBe(0xe40c292c);
  });
});
