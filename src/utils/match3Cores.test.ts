import { describe, expect, it } from 'vitest';
import { mulberry32 } from './combate/rng';
import { ELEMENT_DOMINANTE } from './elementDominante.data';
import { ELEMENT_VISUAL } from './elementVisual.data';
import { ELEMENT_PALETA } from './elementPaleta.data';
import {
  M3_DELTA_E_STEP, M3_MIN_DELTA_E, M3_MIN_DELTA_E_DALTONICO, M3_MIN_DELTA_E_PALETA, M3_PARES_PROIBIDOS, ciede2000, m3Conflito, m3DeltaE,
  m3DeltaEDaltonico, m3DeltaEPaleta, m3ParProibido, pickM3Distinct, simulaDaltonismo,
} from './match3Cores';
import { pickPvpElements, pvpElementPool, pvpElementsForSeed } from './match3Pvp';

describe('Match-3: cores distintas no mesmo tabuleiro (REGISTRO §400)', () => {
  it('CIEDE2000 bate com os pares de referência de Sharma et al. (2005)', () => {
    expect(ciede2000([50, 2.6772, -79.7751], [50, 0, -82.7485])).toBeCloseTo(2.0425, 3);
    expect(ciede2000([50, 3.1571, -77.2803], [50, 0, -82.7485])).toBeCloseTo(2.8615, 3);
    expect(ciede2000([50, 2.5, 0], [50, 0, -2.5])).toBeCloseTo(4.3065, 3);
    expect(ciede2000([60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387])).toBeCloseTo(1.2644, 3);
  });
  it('a tabela de cor dominante cobre os mesmos ícones da cor média', () => {
    expect(Object.keys(ELEMENT_DOMINANTE).sort()).toEqual(Object.keys(ELEMENT_VISUAL).sort());
  });
  it('a lista curada é simétrica, só tem ícones reais e nenhum par consigo mesmo', () => {
    for (const k of M3_PARES_PROIBIDOS) {
      const [a, b] = k.split('|');
      expect(a).not.toBe(b);
      expect(M3_PARES_PROIBIDOS.has(`${b}|${a}`)).toBe(true);
      expect(a in ELEMENT_VISUAL && b in ELEMENT_VISUAL).toBe(true);
    }
    expect(m3ParProibido('nebulosa', 'espectro')).toBe(true);
    expect(m3ParProibido('espectro', 'nebulosa')).toBe(true);
    expect(m3ParProibido('fogo', 'agua')).toBe(false);
  });
  it('os 6 fixos do Normal não se confundem (nenhum par abaixo do limiar nem na lista)', () => {
    const base = ['fogo', 'agua', 'terra', 'vida', 'ar', 'luz'];
    for (let i = 0; i < base.length; i++) for (let j = i + 1; j < base.length; j++) {
      expect(m3ParProibido(base[i], base[j])).toBe(false);
      expect(m3DeltaE(base[i], base[j])).toBeGreaterThanOrEqual(M3_MIN_DELTA_E);
    }
  });
  it('em 3000 sementes: nenhum par curado nem abaixo do limiar, sempre 6 distintos', () => {
    for (let sd = 1; sd <= 3000; sd++) {
      const els = pvpElementsForSeed(sd * 104729);
      expect(els).toHaveLength(6);
      expect(new Set(els).size).toBe(6);
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
        expect(m3ParProibido(els[i], els[j])).toBe(false);
        expect(m3DeltaE(els[i], els[j])).toBeGreaterThanOrEqual(M3_MIN_DELTA_E);
      }
    }
  });
  it('determinístico pela semente', () => {
    expect(pvpElementsForSeed(777)).toEqual(pvpElementsForSeed(777));
    expect(pvpElementsForSeed(777)).not.toEqual(pvpElementsForSeed(778));
  });
  it('pool pequeno: não trava, relaxa só o limiar e NUNCA a lista curada', () => {
    // 3 ícones: 2 formam par curado (nebulosa/espectro) e o 3º é distante; pedir 3 não pode devolver o par proibido.
    const r = pickM3Distinct(['nebulosa', 'espectro', 'fogo'], 3);
    expect(r.elements).toEqual(['nebulosa', 'fogo']);
    // pool de gêmeos de cor mas fora da lista: relaxa até o limiar caber e avisa.
    const pool = pvpElementPool().filter(id => m3DeltaE('fogo', id) < 12 && id !== 'fogo').slice(0, 3);
    const g = pickM3Distinct(['fogo', ...pool], 3, M3_MIN_DELTA_E);
    expect(g.elements.length).toBeGreaterThanOrEqual(1);
    expect(g.relaxado || g.elements.length === 1).toBe(true);
    // vazio e n=0 não travam
    expect(pickM3Distinct([], 6).elements).toEqual([]);
    expect(pickM3Distinct(['fogo'], 0).elements).toEqual([]);
    expect(M3_DELTA_E_STEP).toBeGreaterThan(0);
  });
  it('o pool de verdade nunca relaxa o limiar (6 cores cabem folgado)', () => {
    let relaxadas = 0;
    for (let sd = 1; sd <= 3000; sd++) {
      const rng = mulberry32((sd ^ 0x3e1e) | 0);
      if (pickM3Distinct(pickPvpElements(rng, pvpElementPool(), 400), 6).relaxado) relaxadas++;
    }
    expect(relaxadas).toBe(0);
  });
  it('id sem assinatura conta como distante (não trava ícone novo ainda não medido)', () => {
    expect(m3DeltaE('fogo', 'icone-novo-sem-assinatura')).toBe(Infinity);
  });
});

describe('Match-3 rodada 1: paleta e daltonismo (REGISTRO §402)', () => {
  it('a tabela de paleta cobre os mesmos ícones, com pesos que somam ~100 e no máximo 4 cores', () => {
    expect(Object.keys(ELEMENT_PALETA).sort()).toEqual(Object.keys(ELEMENT_VISUAL).sort());
    for (const p of Object.values(ELEMENT_PALETA)) {
      expect(p.length).toBeGreaterThanOrEqual(1);
      expect(p.length).toBeLessThanOrEqual(4);
      expect(p.reduce((s, c) => s + c[3], 0)).toBeGreaterThan(90);
    }
  });
  it('distância de paleta: zero para o mesmo ícone, simétrica, Infinity sem dado', () => {
    expect(m3DeltaEPaleta('fogo', 'fogo')).toBeCloseTo(0, 6);
    expect(m3DeltaEPaleta('fogo', 'agua')).toBeCloseTo(m3DeltaEPaleta('agua', 'fogo'), 6);
    expect(m3DeltaEPaleta('fogo', 'icone-novo-sem-assinatura')).toBe(Infinity);
    expect(m3DeltaEDaltonico('fogo', 'icone-novo-sem-assinatura')).toBe(Infinity);
  });
  it('a simulação de daltonismo preserva cinza e funde vermelho com verde na deuteranopia', () => {
    for (const s of simulaDaltonismo([60, 0, 0])) { expect(Math.abs(s[1])).toBeLessThan(2); expect(Math.abs(s[2])).toBeLessThan(2); }
    const vermelho: [number, number, number] = [50, 70, 50], verde: [number, number, number] = [50, -70, 50];
    expect(ciede2000(vermelho, verde)).toBeGreaterThan(60);
    expect(ciede2000(simulaDaltonismo(vermelho)[0], simulaDaltonismo(verde)[0])).toBeLessThan(25);
  });
  it('pares vistos pelo mapa: carvalho/pira_eterna só se confundem sob daltonismo, ocultismo/singularidade pela paleta', () => {
    expect(m3DeltaE('carvalho', 'pira_eterna')).toBeGreaterThanOrEqual(M3_MIN_DELTA_E);
    expect(m3DeltaEDaltonico('carvalho', 'pira_eterna')).toBeLessThan(M3_MIN_DELTA_E_DALTONICO);
    expect(m3Conflito('carvalho', 'pira_eterna')).toBe(true);
    expect(m3DeltaE('ocultismo', 'singularidade')).toBeGreaterThanOrEqual(M3_MIN_DELTA_E);
    expect(m3DeltaEPaleta('ocultismo', 'singularidade')).toBeLessThan(M3_MIN_DELTA_E_PALETA);
    expect(m3Conflito('ocultismo', 'singularidade')).toBe(true);
  });
  it('em 3000 sementes: nenhum par abaixo do limiar de paleta nem de daltonismo, sempre 6, sem relaxar', () => {
    for (let sd = 1; sd <= 3000; sd++) {
      const rng = mulberry32((sd * 104729 ^ 0x3e1e) | 0);
      const r = pickM3Distinct(pickPvpElements(rng, pvpElementPool(), 400), 6);
      expect(r.relaxado).toBe(false);
      expect(r.elements).toHaveLength(6);
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
        expect(m3DeltaEPaleta(r.elements[i], r.elements[j])).toBeGreaterThanOrEqual(M3_MIN_DELTA_E_PALETA);
        expect(m3DeltaEDaltonico(r.elements[i], r.elements[j])).toBeGreaterThanOrEqual(M3_MIN_DELTA_E_DALTONICO);
      }
    }
  });
  it('pool pequeno de paleta/daltonismo: relaxa só os limiares medidos, nunca a lista curada, e nunca trava', () => {
    const gemeos = ['carvalho', 'pira_eterna', 'ocultismo', 'singularidade'];
    const r = pickM3Distinct(gemeos, 4);
    expect(r.relaxado).toBe(true);
    for (let i = 0; i < r.elements.length; i++) for (let j = i + 1; j < r.elements.length; j++) expect(m3ParProibido(r.elements[i], r.elements[j])).toBe(false);
    expect(pickM3Distinct(['nebulosa', 'espectro'], 2).elements).toEqual(['nebulosa']);
  });
  it('determinístico mesmo com as camadas novas', () => {
    expect(pvpElementsForSeed(31337)).toEqual(pvpElementsForSeed(31337));
  });
});
