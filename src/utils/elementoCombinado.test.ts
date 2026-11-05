import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { efeitoDoEspecial } from './combate/elementEffects';
import { CHANCES_POR_ESTAGIO, componentesPorSorte, escolherElemento, registrarElementoDoEstagio, sorteDaChave, stagesComElemento } from './elementoCombinado';
import { ELEMENTOS_CURADOS, curatedComponents } from './elementosCurados';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { IDS_DOS_CURADOS, elementoConhecidoLeve } from './soulProfile/ficha/elementoIds';
import { elementoConhecido, elementoNomeDe } from './soulProfile/ficha/elementoNome';
import { sanitizeElementoJornada, elementoDoEstagioAtual } from './elementoJornada';
import { petBaseOf, petElementOf } from './starterElements';
import { petHasElement } from './elementExclusive';
import { combatBaseElement, combatGlowPair } from './combatArt';
import { arenaTemaElementos } from './arenaTema';
import type { FichaStage } from './soulProfile/ficha/types';

const STAGES: FichaStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const componentes = (id: string): readonly string[] => curatedComponents(id) ?? DERIVED_ELEMENT_PAIRS.find(p => p.id === id)?.componentes ?? [id];

describe('§232 a tabela e a sorte', () => {
  it('cada linha soma 100 e as chances acumuladas só sobem', () => {
    for (const st of STAGES) expect(CHANCES_POR_ESTAGIO[st].reduce((a, b) => a + b, 0)).toBe(100);
    for (const min of [1, 2, 3]) {
      const acima = STAGES.map(st => CHANCES_POR_ESTAGIO[st].slice(min).reduce((a, b) => a + b, 0));
      for (let i = 1; i < acima.length; i++) expect(acima[i]).toBeGreaterThanOrEqual(acima[i - 1]);
    }
  });

  it('a frequência real da sorte bate a tabela (±2pp) e o Ultra de um elemento só existe', () => {
    const N = 20000;
    for (const st of STAGES) {
      const c = [0, 0, 0, 0];
      for (let i = 0; i < N; i++) c[componentesPorSorte(sorteDaChave(`p${i}`), st) - 1]++;
      c.forEach((v, i) => expect(Math.abs((100 * v) / N - CHANCES_POR_ESTAGIO[st][i])).toBeLessThan(2));
    }
    expect(componentesPorSorte(0.01, 'ultra')).toBe(1);
  });

  it('nunca perde complexidade ao evoluir', () => {
    for (let i = 0; i < 2000; i++) {
      const u = sorteDaChave(`m${i}`);
      const ks = STAGES.map(st => componentesPorSorte(u, st));
      for (let j = 1; j < ks.length; j++) expect(ks[j]).toBeGreaterThanOrEqual(ks[j - 1]);
    }
  });
});

describe('§232 a escolha', () => {
  it('o elemento sempre contém a base nº 1 e tem o k pedido quando há curado', () => {
    for (const base of ['fogo', 'agua', 'terra', 'ar', 'sombra', 'luz']) for (const k of [1, 2, 3, 4]) {
      const e = escolherElemento(base, k, 0.5);
      expect(e.k).toBe(k);
      expect(componentes(e.id)).toContain(base);
      expect(componentes(e.id)).toHaveLength(k);
    }
  });

  it('planta, industrial e fada não têm curado: ficam no par, nunca inventam elemento', () => {
    expect(ELEMENTOS_CURADOS.some(e => ['planta', 'industrial', 'fada'].some(b => e.componentes.includes(b)))).toBe(false);
    for (const base of ['planta', 'industrial', 'fada']) for (const k of [3, 4]) {
      const e = escolherElemento(base, k, 0.9);
      expect(e.k).toBe(2);
      expect(componentes(e.id)).toContain(base);
    }
  });

  it('as afinidades decidem; sem elas o resultado é estável', () => {
    const a = escolherElemento('fogo', 2, 0.5, { fogo: 9, agua: 8 });
    expect(a.id).toBe('vapor');
    expect(escolherElemento('fogo', 3, 0.5).id).toBe(escolherElemento('fogo', 3, 0.5).id);
  });
});

describe('§232 o registro', () => {
  const r0 = registrarElementoDoEstagio(undefined, { stage: 'ultra', base: 'fogo', chave: 'x' })!;

  it('estágio gravado é imutável e a sorte não muda (degenerar e reevoluir)', () => {
    expect(registrarElementoDoEstagio(r0, { stage: 'ultra', base: 'agua', chave: 'y' })).toBe(r0);
    expect(registrarElementoDoEstagio(r0, { stage: 'mega', base: 'fogo', chave: 'y' })!.u).toBe(r0.u);
  });

  it('degenerar lê o elemento daquele nível; forma sem registro cai no oráculo', () => {
    const j = { v: 1 as const, u: 0.99, estagios: { ultra: { id: 'geiser', base: 'fogo' }, champion: { id: 'vapor', base: 'fogo' } } };
    const meta = { dominantElement: 'fogo', baseName: 'x' };
    expect(petElementOf({ evolutionStage: 'ultra', elementoJornada: j, soulmonMeta: meta })).toBe('geiser');
    expect(petElementOf({ evolutionStage: 'champion', elementoJornada: j, soulmonMeta: meta })).toBe('vapor');
    expect(petElementOf({ evolutionStage: 'mega', elementoJornada: j, soulmonMeta: meta })).toBe('fogo');
    expect(petBaseOf({ evolutionStage: 'ultra', elementoJornada: j, soulmonMeta: meta })).toBe('fogo');
  });

  it('save antigo não muda; poção e inicial mantêm a precedência; corvo segue neutro', () => {
    const j = { v: 1 as const, u: 0.99, estagios: { ultra: { id: 'geiser', base: 'fogo' } } };
    expect(petElementOf({ evolutionStage: 'ultra', soulmonMeta: { dominantElement: 'agua' } })).toBe('agua');
    expect(petElementOf({ evolutionStage: 'ultra', potionElement: 'lava', elementoJornada: j })).toBe('lava');
    expect(petBaseOf({ evolutionStage: 'ultra', potionElement: 'lava', elementoJornada: j })).toBeUndefined();
    expect(petElementOf({ evolutionStage: 'ultra', demoCharacterId: 'meteoro', elementoJornada: j })).toBe('fogo');
    expect(petElementOf({ evolutionStage: 'ultra', elementoJornada: j, soulmonMeta: { creature: 'corvo' } })).toBe('neutro');
  });

  it('sanitize tira o que não tem forma', () => {
    expect(sanitizeElementoJornada({ u: 2, estagios: {} })).toBeUndefined();
    expect(sanitizeElementoJornada({ u: 0.5, estagios: { ultra: { id: 'xxx', base: 'fogo' } } })?.estagios.ultra).toBeUndefined();
    expect(elementoDoEstagioAtual(null, 'ultra')).toBeUndefined();
  });

  it('o prompt só muda em forma combinada', () => {
    const st = [{ stage: 'ultra', imagePrompt: 'a', imagePromptFallback: 'b' }, { stage: 'mega', imagePrompt: 'c', imagePromptFallback: 'd' }];
    const out = stagesComElemento(st, { v: 1, u: 0.9, estagios: { ultra: { id: 'geiser', base: 'fogo' }, mega: { id: 'fogo', base: 'fogo' } } })!;
    expect(out[0].imagePrompt).toContain('Geyser');
    expect(out[0].imagePromptFallback).toContain('Geyser');
    expect(out[1]).toBe(st[1]);
  });
});

describe('§232 caminhos da vantagem', () => {
  it('todo Combina 3 de jogo com petElement recebe também a base nº 1', () => {
    for (const f of ['src/components/RogueDungeon.tsx', 'src/components/nav/AreaView.tsx']) {
      for (const linha of readFileSync(f, 'utf8').split(/\r?\n/).filter(l => l.includes('<Match3Game') && l.includes('petElement='))) expect(linha).toContain('petBase=');
    }
    expect(readFileSync('src/components/nav/AreaView.tsx', 'utf8')).toContain('<RogueDungeon petBase={props.petBase}');
  });
  it('curado herda o efeito do especial como o par', () => {
    const c = ELEMENTOS_CURADOS.find(e => e.componentes.includes('fogo') && e.componentes[0] === 'fogo')!;
    expect(efeitoDoEspecial('dot', c.id)).toBe(efeitoDoEspecial('dot', 'fogo'));
  });
});

describe('§232 os 50 curados passam por todos os leitores', () => {
  it('lista fechada, nome, cor, cenário e filtro', () => {
    expect([...IDS_DOS_CURADOS].sort()).toEqual(ELEMENTOS_CURADOS.map(e => e.id).sort());
    for (const { id, componentes: c } of ELEMENTOS_CURADOS) {
      expect(elementoConhecido(id)).toBe(true);
      expect(elementoConhecidoLeve(id)).toBe(true);
      expect(elementoNomeDe(id).pt).not.toBe(id);
      expect(elementoNomeDe(id).en).not.toBe(id);
      expect(arenaTemaElementos(id)).toEqual([...c]);
      expect(petHasElement(c[0], id)).toBe(true);
      expect(combatGlowPair(id)[0]).toBe(combatGlowPair(c[0])[0]);
      void combatBaseElement(id);
    }
    expect(elementoConhecido('neutro')).toBe(false);
  });
});
