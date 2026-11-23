// @vitest-environment node
/** Corte × concussão (05/11/2026): a tabela, a determinação e a PROVA de que a luta não muda. */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CLASS_ELEMENT_ORDER } from '../soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from '../soulProfile/derivedElements';
import { PESO_CORTE, PESO_CORTE_NEUTRO, chaveDaIdentidade, hashEstavel, impactoPorNome, meleeImpactOf, pesoCorte } from './golpeImpacto';
import { fight, PVP_HP_SCALE } from './fight';
import { REFERENCE_BUILDS, combatantAt } from './level';
import { specialOf } from './specials';

const N = 4000;
const taxaCorte = (element: string) => {
  let c = 0;
  for (let i = 0; i < N; i++) if (meleeImpactOf({ element, key: `lutador-${i}` }) === 'corte') c++;
  return (100 * c) / N;
};

describe('a tabela cobre os 20 elementos base e os 190 derivados', () => {
  it('Ar 75/25 corte e Terra 25/75 (o dono); todo base tem peso 0..100', () => {
    expect(PESO_CORTE.ar).toBe(75);
    expect(PESO_CORTE.terra).toBe(25);
    for (const e of CLASS_ELEMENT_ORDER) expect(PESO_CORTE[e], e).toBeGreaterThanOrEqual(0);
    expect(Object.keys(PESO_CORTE).sort()).toEqual([...CLASS_ELEMENT_ORDER].sort());
  });
  it('derivado herda a média dos dois componentes; desconhecido cai no neutro', () => {
    for (const d of DERIVED_ELEMENT_PAIRS) {
      const [a, b] = d.componentes;
      expect(pesoCorte(d.id), d.id).toBe(Math.round((PESO_CORTE[a] + PESO_CORTE[b]) / 2));
    }
    expect(pesoCorte('neutro')).toBe(PESO_CORTE_NEUTRO);
    expect(pesoCorte(undefined)).toBe(PESO_CORTE_NEUTRO);
  });
  it('a taxa observada sobre muitos lutadores bate o peso (±4 pontos)', () => {
    for (const e of ['ar', 'terra', 'fogo', 'gravidade', 'fada', 'lava']) expect(Math.abs(taxaCorte(e) - pesoCorte(e)), e).toBeLessThan(4);
  });
});

describe('determinismo: o mesmo lutador dá sempre o mesmo golpe', () => {
  it('mesma entrada → mesma saída, em qualquer ordem e quantidade de chamadas', () => {
    const a = meleeImpactOf({ element: 'ar', key: 'abc' });
    for (let i = 0; i < 50; i++) expect(meleeImpactOf({ element: 'ar', key: 'abc' })).toBe(a);
    expect(hashEstavel('abc')).toBe(hashEstavel('abc'));
    expect(hashEstavel('abc')).not.toBe(hashEstavel('abd'));
  });
  it('PvP: a chave sai de ids fechados da identidade, então os dois aparelhos concordam', () => {
    const id = { basico: { elemento: 'ar', escola: 'combate_fisico' }, especial: { elemento: 'ar', escola: null, familia: 'direct' } };
    expect(chaveDaIdentidade(id)).toBe('ar|combate_fisico|ar|-|direct');
    expect(meleeImpactOf({ element: 'ar', key: chaveDaIdentidade(id) })).toBe(meleeImpactOf({ element: 'ar', key: chaveDaIdentidade({ ...id }) }));
  });
});

describe('palavra-chave do nome (dado confiável de inimigo) vence o sorteio', () => {
  it('concussão, corte, conflito e nada', () => {
    expect(impactoPorNome('Golem de Pedra')).toBe('concussao');
    expect(impactoPorNome('Lobo das Garras')).toBe('corte');
    expect(impactoPorNome('Stone Wolf')).toBeNull(); // as duas famílias: cai no sorteio
    expect(impactoPorNome('Pequeno Coelho')).toBeNull();
    expect(impactoPorNome('Rochedo')).toBeNull(); // palavra inteira, não pedaço
    expect(impactoPorNome(undefined)).toBeNull();
  });
  it('mesmo num elemento 100% cortante o nome decide', () => {
    expect(meleeImpactOf({ element: 'fada', key: 'x', name: 'Urso Golem' })).toBe('concussao');
    expect(meleeImpactOf({ element: 'terra', key: 'x', name: 'Raven Blade' })).toBe('corte');
  });
});

describe('só visual: a luta NÃO muda', () => {
  const lado = (lvl: number, fam: 'direct' | 'dot') => ({ combatant: combatantAt(lvl, REFERENCE_BUILDS.balanced), special: specialOf(fam) });
  const roda = (seed: number) => fight(lado(20, 'direct'), lado(20, 'dot'), { seed, hpScale: PVP_HP_SCALE });

  it('chamar meleeImpactOf entre duas simulações da mesma semente não altera nada (nem consome RNG)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const antes = JSON.stringify(roda(seed));
      for (let i = 0; i < 25; i++) meleeImpactOf({ element: i % 2 ? 'ar' : 'terra', key: `k${seed}-${i}` });
      expect(JSON.stringify(roda(seed))).toBe(antes);
    }
  });

  it('o núcleo e o servidor do combate não conhecem o módulo (só a cena o importa)', () => {
    const raiz = process.cwd();
    const alvos = [
      ...readdirSync(join(raiz, 'src/utils/combate')).filter(f => f.endsWith('.ts') && !f.includes('.test.') && f !== 'golpeImpacto.ts').map(f => join(raiz, 'src/utils/combate', f)),
      join(raiz, 'functions/api/_duel.js'),
      join(raiz, 'src/utils/dungeonFight.ts'),
    ];
    for (const f of alvos) expect(readFileSync(f, 'utf8'), f).not.toMatch(/golpeImpacto|meleeImpactOf/);
  });
});
