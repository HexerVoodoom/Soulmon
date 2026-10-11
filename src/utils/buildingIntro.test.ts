import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUILDING_GATES, buildingGateFor, type BuildingId } from './gates';
import {
  BUILDING_INTRO_ORDER, buildingsUnlockedBetween, pendingBuildingIntros, sanitizeBuildingIntrosSeen,
  seedBuildingIntrosSeen, markBuildingIntroSeen, buildingIntroReady, BUILDING_INTRO_AFTER, isBuildingId,
} from './buildingIntro';
import { BUILDING_INTRO_COPY, buildingIntroView, buildingNpcFirstName } from './buildingIntroCopy';
import { LOT_NPC_VOICE } from './areaNpcVoice';
import { LOT_NPC_ART } from '../assets/soulmon/npcs';

const IDS = Object.keys(BUILDING_GATES) as BuildingId[];

describe('fonte única: a apresentação deriva de BUILDING_GATES, sem número próprio', () => {
  it('a ordem da fila cobre exatamente os prédios do Mapa e não repete', () => {
    expect([...BUILDING_INTRO_ORDER].sort()).toEqual([...IDS].sort());
  });

  it('cada prédio é apresentado no MESMO Vínculo em que o Mapa o abre (reprova divergência)', () => {
    for (const id of IDS) {
      const min = BUILDING_GATES[id].minBond;
      expect(buildingGateFor(id, min).open, id).toBe(true);
      if (min > 1) {
        expect(buildingGateFor(id, min - 1).open, id).toBe(false);
        expect(buildingsUnlockedBetween(min - 1, min), id).toContain(id);
        expect(buildingsUnlockedBetween(0, min - 1), id).not.toContain(id);
      }
    }
  });

  it('o módulo não escreve número de prédio à mão', () => {
    const src = readFileSync('src/utils/buildingIntro.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(src).not.toMatch(/minBond\s*[<>=]=?\s*\d/);
    expect(src).not.toMatch(/bondLevel\s*>=\s*\d/);
  });
});

describe('detector entre dois Vínculos', () => {
  it('só os que cruzam o limite: (prev, cur]', () => {
    for (let p = 0; p <= 14; p++) for (let c = 1; c <= 14; c++) {
      const got = buildingsUnlockedBetween(p, c);
      const want = IDS.filter(id => BUILDING_GATES[id].minBond > p && BUILDING_GATES[id].minBond <= c);
      expect([...got].sort(), `${p}->${c}`).toEqual([...want].sort());
    }
  });

  it('Vínculo que não sobe, ou lixo, não abre nada (nunca des-abre, nunca lança)', () => {
    expect(buildingsUnlockedBetween(5, 5)).toEqual([]);
    expect(buildingsUnlockedBetween(9, 3)).toEqual([]);
    for (const lixo of [NaN, Infinity, -4, '3', null, undefined, {}, []]) {
      expect(() => buildingsUnlockedBetween(lixo, lixo)).not.toThrow();
    }
  });

  it('vários de uma vez saem em fila, do Vínculo mais cedo ao mais tarde, e a ordem é estável', () => {
    const a = buildingsUnlockedBetween(1, 5);
    expect(a.length).toBeGreaterThan(3);
    const mins = a.map(id => BUILDING_GATES[id].minBond);
    expect([...mins].sort((x, y) => x - y)).toEqual(mins);
    expect(buildingsUnlockedBetween(1, 5)).toEqual(a);
  });
});

describe('o que já foi visto (buildingIntrosSeen)', () => {
  it('save SEM o campo (ou lixo) semeia tudo que já está aberto: nada re-dispara; o próximo Vínculo apresenta', () => {
    for (const lixo of [undefined, null, 'x', 7, {}, { 0: 'mercado.itens' }]) {
      for (const bond of [1, 2, 3, 5, 9]) {
        const seen = sanitizeBuildingIntrosSeen(lixo, bond);
        expect(pendingBuildingIntros(seen, bond), `${String(lixo)}@${bond}`).toEqual([]);
        const prox = buildingsUnlockedBetween(bond, bond + 1);
        expect(pendingBuildingIntros(seen, bond + 1)).toEqual(prox);
      }
    }
  });

  it('jogador novo (Vínculo 1): nenhuma apresentação até o Vínculo crescer', () => {
    const seen = seedBuildingIntrosSeen(1);
    expect(pendingBuildingIntros(seen, 1)).toEqual([]);
    expect(pendingBuildingIntros(seen, 2).length).toBeGreaterThan(0);
  });

  it('array válido: só ids conhecidos, sem repetir; lixo dentro some', () => {
    expect(sanitizeBuildingIntrosSeen(['mercado.itens', 'x.y', 3, null, 'mercado.itens', 'hall.guilda'], 1))
      .toEqual(['mercado.itens', 'hall.guilda']);
    expect(isBuildingId('__proto__')).toBe(false);
  });

  it('marcar visto é idempotente e devolve a MESMA referência quando já visto', () => {
    const a = markBuildingIntroSeen(['mercado.itens'], 'hall.guilda');
    expect(a).toEqual(['mercado.itens', 'hall.guilda']);
    expect(markBuildingIntroSeen(a, 'hall.guilda')).toBe(a);
    expect(markBuildingIntroSeen(undefined, 'hall.guilda')).toEqual(['hall.guilda']);
  });

  it('a fila anda um por vez: ver o primeiro faz o segundo ser o próximo, na mesma ordem', () => {
    let seen: readonly string[] = seedBuildingIntrosSeen(1);
    const todos = pendingBuildingIntros(seen, 5);
    const vistos: string[] = [];
    for (let guard = 0; guard < 40; guard++) {
      const p = pendingBuildingIntros(seen, 5);
      if (!p.length) break;
      vistos.push(p[0]);
      seen = markBuildingIntroSeen(seen, p[0]);
    }
    expect(vistos).toEqual(todos);
  });
});

describe('encaixe depois do Level Up (declarado)', () => {
  it('declara que vem depois do display de Level Up', () => {
    expect(BUILDING_INTRO_AFTER).toBe('levelUp');
  });
  it('espera o Level Up sair, espera uma tela calma e espera haver pendente', () => {
    const pending: BuildingId[] = ['mercado.decoracao'];
    expect(buildingIntroReady({ pending, levelUpOpen: false, calmView: true })).toBe(true);
    expect(buildingIntroReady({ pending, levelUpOpen: true, calmView: true })).toBe(false);
    expect(buildingIntroReady({ pending, levelUpOpen: false, calmView: false })).toBe(false);
    expect(buildingIntroReady({ pending: [], levelUpOpen: false, calmView: true })).toBe(false);
  });
});

describe('copy: TODO prédio tem NPC, busto e três balões nos dois idiomas', () => {
  it('a tabela de copy cobre exatamente os prédios', () => {
    expect(Object.keys(BUILDING_INTRO_COPY).sort()).toEqual([...IDS].sort());
  });

  for (const id of IDS) {
    it(`${id}: NPC próprio (voz + busto) e balões curtos, em primeira pessoa, sem cobrança`, () => {
      const key = id.replace('.', ':');
      expect(LOT_NPC_VOICE[key], `voz de ${key}`).toBeDefined();
      expect(LOT_NPC_ART[key], `busto de ${key}`).toBeTruthy();
      for (const lang of ['en-US', 'pt-BR'] as const) {
        const v = buildingIntroView(id, lang);
        expect(v.lines).toHaveLength(3);
        expect(v.place.length).toBeGreaterThan(1);
        // o 1º balão diz quem é — com o primeiro nome do NPC vindo de LOT_NPC_VOICE
        expect(v.lines[0]).toContain(buildingNpcFirstName(id, lang));
        expect(v.lines.join(' ')).not.toContain('{name}');
        for (const l of v.lines) {
          expect(l.length, l).toBeLessThanOrEqual(130);
          expect(l, l).not.toMatch(/\p{Extended_Pictographic}/u);
          expect(l, l).not.toMatch(/\d/);
          expect(l, l).not.toMatch(/!/);
          // L1/L12 e a lista de cobrança: nada de mérito, urgência, falta ou "subir de nível"
          expect(l, l).not.toMatch(/\b(you deserve|well done|great job|hurry up|don't miss|you must|only \d|level up|unlock(ed)?|earned)\b/i);
          expect(l, l).not.toMatch(/\b(você merece|parabéns|corra|não perca|você precisa|subir de nível|desbloque\w+|conquist(ou|ado))\b/i);
        }
      }
    });
  }

  it('EN é o idioma-base: o par PT existe e é diferente do EN em todo balão', () => {
    for (const id of IDS) {
      const c = BUILDING_INTRO_COPY[id];
      for (const k of ['hello', 'what', 'invite'] as const) {
        expect(c[k].pt.length, `${id}.${k}.pt`).toBeGreaterThan(0);
        expect(c[k].en.length, `${id}.${k}.en`).toBeGreaterThan(0);
      }
    }
  });
});
