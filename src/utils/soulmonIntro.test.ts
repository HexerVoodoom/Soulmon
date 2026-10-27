import { describe, it, expect } from 'vitest';
import {
  soulmonIntroLines, INTRO_CLICHES_PROIBIDOS, INTRO_FRASE_MAX, type SoulmonIntroInput,
} from './soulmonIntro';
import { PET_PASSIVES } from './passives';

const PODER: SoulmonIntroInput = {
  name: 'Lumi', element: 'agua', alignment: 'poder', petPassive: 'guloso', categories: ['Fitness', 'Fitness', 'Health'],
};
const HARMONIA: SoulmonIntroInput = {
  name: 'Lumi', element: 'planta', alignment: 'harmonia', petPassive: 'carinhoso', categories: ['Health'],
};
const BENEVOLENCIA: SoulmonIntroInput = {
  name: 'Lumi', element: 'industrial', alignment: 'benevolencia', petPassive: 'sortudo', categories: ['Social'],
};
const TODOS = [PODER, HARMONIA, BENEVOLENCIA];
const emoji = /\p{Extended_Pictographic}/u;
const TRAVESSAO = String.fromCharCode(0x2014);

// 25/10/2026: o anel de counters ganhou fada/industrial/planta — Água agora apanha de Fada e Vida de Planta.
describe('soulmonIntroLines: os três caminhos, texto exato', () => {
  it('poder EN', () => {
    expect(soulmonIntroLines(PODER, 'en')).toEqual([
      "Hi, I'm Lumi.\nI'm a digital counterpart of your soul, and we grow together.",
      "My main element is Water.\nI'm not a fan of Fairy, though. It gets the better of me.",
      "I really like protein.\nAnd I'm a foodie: I enjoy every single meal.",
      'I lean toward Power: when something matters, I like to face it head on.',
    ]);
  });
  it('poder PT', () => {
    expect(soulmonIntroLines(PODER, 'pt')).toEqual([
      'Oi, eu sou Lumi.\nSou uma contraparte digital da sua alma, e juntos vamos crescer.',
      'Meu elemento principal é Água.\nJá de Fada eu não gosto: leva vantagem sobre mim.',
      'Gosto muito de proteína.\nE sou guloso: aproveito cada refeição.',
      'Puxo para o Poder: quando algo importa, gosto de ir de frente.',
    ]);
  });
  it('harmonia EN (planta segue Planta)', () => {
    expect(soulmonIntroLines(HARMONIA, 'en')).toEqual([
      "Hi, I'm Lumi.\nI'm a digital counterpart of your soul, and we grow together.",
      "My main element is Plant.\nI'm not a fan of Fire, though. It gets the better of me.",
      "I really like salad.\nI'm cuddly, too. A little affection goes a long way.",
      'I lean toward Harmony: I like things in balance, one step at a time.',
    ]);
  });
  it('harmonia PT (planta segue Planta)', () => {
    expect(soulmonIntroLines(HARMONIA, 'pt')).toEqual([
      'Oi, eu sou Lumi.\nSou uma contraparte digital da sua alma, e juntos vamos crescer.',
      'Meu elemento principal é Planta.\nJá de Fogo eu não gosto: leva vantagem sobre mim.',
      'Gosto muito de salada.\nTambém sou carinhoso: um pouco de colo faz diferença.',
      'Puxo para a Harmonia: gosto das coisas em equilíbrio, um passo de cada vez.',
    ]);
  });
  it('benevolencia EN (industrial segue Industrial)', () => {
    expect(soulmonIntroLines(BENEVOLENCIA, 'en')).toEqual([
      "Hi, I'm Lumi.\nI'm a digital counterpart of your soul, and we grow together.",
      "My main element is Industrial.\nI'm not a fan of Lightning, though. It gets the better of me.",
      "I really like pizza.\nI'm lucky, too. I tend to stumble into good things.",
      "I lean toward Benevolence: I feel best when I'm looking after someone.",
    ]);
  });
  it('benevolencia PT (industrial segue Industrial)', () => {
    expect(soulmonIntroLines(BENEVOLENCIA, 'pt')).toEqual([
      'Oi, eu sou Lumi.\nSou uma contraparte digital da sua alma, e juntos vamos crescer.',
      'Meu elemento principal é Industrial.\nJá de Eletricidade eu não gosto: leva vantagem sobre mim.',
      'Gosto muito de pizza.\nTambém sou sortudo: costumo tropeçar em coisa boa.',
      'Puxo para a Benevolência: fico melhor quando estou cuidando de alguém.',
    ]);
  });
});

describe('soulmonIntroLines: regras de forma', () => {
  const casos = TODOS.flatMap(i => (['en', 'pt'] as const).map(l => [i.alignment, l, i] as const));

  it.each(casos)('%s %s: frases <= 90, sem travessão, sem emoji, sem clichê, sem id cru', (_a, l, input) => {
    const baloes = soulmonIntroLines(input, l);
    expect(baloes.length).toBeGreaterThanOrEqual(3);
    for (const b of baloes) {
      for (const frase of b.split('\n')) expect(frase.length).toBeLessThanOrEqual(INTRO_FRASE_MAX);
      expect(b).not.toContain(TRAVESSAO);
      expect(emoji.test(b)).toBe(false);
      for (const c of INTRO_CLICHES_PROIBIDOS) expect(b.toLowerCase()).not.toContain(c.toLowerCase());
      // id CRU (minúsculo) proibido; o RÓTULO "Planta"/"Industrial" é legítimo desde 25/10/2026 (viraram base).
      expect(b).not.toMatch(/\b(planta|industrial)\b/);
      expect(b).not.toMatch(/Ruptura|Trama|Guarda|Rupture|Weave|Guard/);
    }
  });

  it('frase literal do dono no 1º balão', () => {
    expect(soulmonIntroLines(PODER, 'en')[0]).toContain('digital counterpart of your soul');
    expect(soulmonIntroLines(PODER, 'pt')[0]).toContain('contraparte digital da sua alma');
  });

  it('nenhuma fala repete a bio do reveal', () => {
    for (const l of ['en', 'pt'] as const) {
      const base = soulmonIntroLines(PODER, l);
      const bio = { pt: base[2], en: base[2] };
      const com = soulmonIntroLines({ ...PODER, bio }, l);
      expect(com).not.toContain(bio[l]);
      expect(com.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('é determinística', () => {
    expect(soulmonIntroLines(PODER, 'en')).toEqual(soulmonIntroLines(PODER, 'en'));
    expect(soulmonIntroLines(HARMONIA, 'pt')).toEqual(soulmonIntroLines(HARMONIA, 'pt'));
  });

  it('empate de categoria: vale a 1ª na ordem de FOOD_BY_CATEGORY (Fitness antes de Health)', () => {
    const l = soulmonIntroLines({ ...PODER, categories: ['Health', 'Fitness'] }, 'en');
    expect(l[2]).toContain('I really like protein.');
  });

  it('categoria mais frequente vence mesmo vindo depois', () => {
    const l = soulmonIntroLines({ ...PODER, categories: ['Fitness', 'Social', 'Social'] }, 'pt');
    expect(l[2]).toContain('Gosto muito de pizza.');
  });

  it('sem categorias: pula o gosto, fica o traço', () => {
    const l = soulmonIntroLines({ ...PODER, categories: [] }, 'en');
    expect(l.join('\n')).not.toContain('I really like');
    expect(l[2]).toBe("And I'm a foodie: I enjoy every single meal.");
  });

  it('passive desconhecido: pula o traço, fica o gosto', () => {
    const l = soulmonIntroLines({ ...PODER, petPassive: 'inexistente' }, 'pt');
    expect(l[2]).toBe('Gosto muito de proteína.');
  });

  it('cada traço de PET_PASSIVES tem fala nos dois idiomas', () => {
    for (const p of PET_PASSIVES) {
      for (const lang of ['en', 'pt'] as const) {
        const l = soulmonIntroLines({ ...PODER, categories: [], petPassive: p.id }, lang);
        expect(l.length).toBe(4);
        expect(l[2].length).toBeGreaterThan(10);
      }
    }
  });

  it('elemento desconhecido: sem balão de elemento, sem id cru, ainda >= 3 balões', () => {
    for (const l of ['en', 'pt'] as const) {
      const baloes = soulmonIntroLines({ ...PODER, element: 'xyz' }, l);
      expect(baloes.length).toBeGreaterThanOrEqual(3);
      expect(baloes.join('\n')).not.toContain('xyz');
    }
  });

  it('sem nenhum dado: o 1º balão se divide e ainda há >= 3 balões', () => {
    const l = soulmonIntroLines({ name: 'Lumi', element: 'xyz', alignment: 'harmonia' }, 'en');
    expect(l).toEqual([
      "Hi, I'm Lumi.",
      "I'm a digital counterpart of your soul, and we grow together.",
      'I lean toward Harmony: I like things in balance, one step at a time.',
    ]);
  });
});
