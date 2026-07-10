import { describe, it, expect } from 'vitest';
import {
  normalizeName, reduceNumber, computeNumerology, westernSunSign,
  approximateAscendant, computeChinese, computeVedic, generateOracle,
  ELEMENT_ORDER, ROLE_ORDER,
  type OracleInput,
} from './oracle';

const INPUT: OracleInput = {
  fullName: 'Maria da Silva',
  birthDate: '1990-08-15',
  birthTime: '14:30',
  birthPlace: 'São Paulo, Brasil',
};

describe('normalizeName', () => {
  it('remove acentos, espaços e não-letras', () => {
    expect(normalizeName('José Ângelo-Núñez 3º')).toBe('JOSEANGELONUNEZ');
  });
});

describe('reduceNumber', () => {
  it('reduz a um dígito', () => {
    expect(reduceNumber(1990)).toBe(1); // 1+9+9+0=19 → 10 → 1
    expect(reduceNumber(15)).toBe(6);
  });
  it('preserva números mestres', () => {
    expect(reduceNumber(11)).toBe(11);
    expect(reduceNumber(22)).toBe(22);
    expect(reduceNumber(33)).toBe(33);
    expect(reduceNumber(29)).toBe(11); // 2+9=11 mantém
  });
});

describe('computeNumerology', () => {
  it('calcula caminho de vida (dia+mês+ano reduzidos)', () => {
    // 15→6, 08→8, 1990→1 ⇒ 6+8+1=15 → 6
    expect(computeNumerology('Maria', '1990-08-15').lifePath).toBe(6);
  });
  it('expressão/vogais/consoantes de nome conhecido', () => {
    // MARIA: M4+A1+R9+I9+A1 = 24 → 6; vogais A1+I9+A1=11 (mestre); consoantes M4+R9=13→4
    const n = computeNumerology('Maria', '1990-08-15');
    expect(n.expression).toBe(6);
    expect(n.soulUrge).toBe(11);
    expect(n.personality).toBe(4);
  });
  it('todo resultado tem significado definido', () => {
    const n = computeNumerology(INPUT.fullName, INPUT.birthDate);
    expect(n.meanings.lifePath).toBeDefined();
    expect(n.meanings.expression).toBeDefined();
    expect(n.meanings.soulUrge).toBeDefined();
    expect(n.meanings.personality).toBeDefined();
  });
});

describe('westernSunSign', () => {
  it('identifica signos e fronteiras', () => {
    expect(westernSunSign(8, 15).id).toBe('leao');
    expect(westernSunSign(3, 21).id).toBe('aries');
    expect(westernSunSign(3, 20).id).toBe('peixes');
    expect(westernSunSign(12, 22).id).toBe('capricornio');
    expect(westernSunSign(1, 19).id).toBe('capricornio');
    expect(westernSunSign(1, 20).id).toBe('aquario');
  });
});

describe('approximateAscendant', () => {
  it('ao nascer do sol (~6h) o ascendente ≈ signo solar', () => {
    expect(approximateAscendant('leao', 6, 0).id).toBe('leao');
  });
  it('avança um signo a cada 2h', () => {
    expect(approximateAscendant('leao', 8, 0).id).toBe('virgem');
    expect(approximateAscendant('leao', 10, 0).id).toBe('libra');
  });
});

describe('computeChinese', () => {
  it('1990 (após 4/fev) = Cavalo, Metal, yang', () => {
    const c = computeChinese(1990, 8, 15);
    expect(c.animal.en).toBe('Horse');
    expect(c.element.en).toBe('Metal');
    expect(c.yinYang).toBe('yang');
  });
  it('antes de 4/fev usa o ano anterior', () => {
    expect(computeChinese(1990, 1, 20).animal.en).toBe('Snake'); // 1989
  });
  it('2000 = Dragão', () => {
    expect(computeChinese(2000, 6, 1).animal.en).toBe('Dragon');
  });
});

describe('computeVedic', () => {
  it('15/08 = Karka (Câncer sideral)', () => {
    expect(computeVedic(8, 15).rashi).toBe('Karka');
  });
  it('17/08 = Simha', () => {
    expect(computeVedic(8, 17).rashi).toBe('Simha');
  });
  it('início de janeiro = Dhanu (wrap de ano)', () => {
    expect(computeVedic(1, 5).rashi).toBe('Dhanu');
    expect(computeVedic(1, 14).rashi).toBe('Makara');
  });
});

describe('generateOracle', () => {
  it('é reproduzível com o mesmo seed', () => {
    const a = generateOracle(INPUT, 12345);
    const b = generateOracle(INPUT, 12345);
    expect(a.archetype.phrase.pt).toBe(b.archetype.phrase.pt);
    expect(a.creature.stages.map(s => s.name)).toEqual(b.creature.stages.map(s => s.name));
    expect(a.elementScores).toEqual(b.elementScores);
  });

  it('pontuações determinísticas independem do seed', () => {
    const a = generateOracle(INPUT, 1);
    const b = generateOracle(INPUT, 999999);
    expect(a.elementScores).toEqual(b.elementScores);
    expect(a.roleScores).toEqual(b.roleScores);
    expect(a.dominantElement).toBe(b.dominantElement);
    expect(a.dominantRole).toBe(b.dominantRole);
    expect(a.numerology).toEqual(b.numerology);
  });

  it('elemento dominante é o de maior pontuação', () => {
    const r = generateOracle(INPUT, 42);
    const max = Math.max(...ELEMENT_ORDER.map(e => r.elementScores[e]));
    expect(r.elementScores[r.dominantElement]).toBe(max);
    expect(r.dominantElement).not.toBe(r.secondaryElement);
  });

  it('função dominante é a de maior pontuação', () => {
    const r = generateOracle(INPUT, 42);
    const max = Math.max(...ROLE_ORDER.map(x => r.roleScores[x]));
    expect(r.roleScores[r.dominantRole]).toBe(max);
  });

  it('arquétipo = 1 substantivo + 2 adjetivos', () => {
    const r = generateOracle(INPUT, 42);
    expect(r.archetype.noun.pt.length).toBeGreaterThan(0);
    expect(r.archetype.adjectives).toHaveLength(2);
    expect(r.archetype.phrase.pt).toContain(r.archetype.noun.pt);
  });

  it('gera 4 estágios com nome, descrição PT/EN e prompt de imagem', () => {
    const r = generateOracle(INPUT, 42);
    expect(r.creature.stages).toHaveLength(4);
    expect(r.creature.stages.map(s => s.stage)).toEqual(['crianca', 'adulto', 'perfeito', 'mega']);
    for (const s of r.creature.stages) {
      expect(s.name.length).toBeGreaterThan(2);
      expect(s.description.pt.length).toBeGreaterThan(20);
      expect(s.description.en.length).toBeGreaterThan(20);
      expect(s.imagePrompt).toContain('8-bit');
      expect(s.imagePrompt).toContain('pixel art');
    }
  });

  it('seeds diferentes variam a parte criativa mantendo o perfil', () => {
    const results = [1, 2, 3, 4, 5, 6, 7, 8].map(s => generateOracle(INPUT, s));
    const phrases = new Set(results.map(r => r.archetype.phrase.pt));
    expect(phrases.size).toBeGreaterThan(1); // salt muda o arquétipo
    const dominants = new Set(results.map(r => r.dominantElement));
    expect(dominants.size).toBe(1); // ...mas não o elemento dominante
  });

  it('sem seed usa salt aleatório e o devolve no resultado', () => {
    const r = generateOracle(INPUT);
    expect(Number.isInteger(r.seed)).toBe(true);
    const again = generateOracle(INPUT, r.seed);
    expect(again.archetype.phrase.pt).toBe(r.archetype.phrase.pt);
  });
});
